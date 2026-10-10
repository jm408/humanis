import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const owner = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const photo = "33333333-3333-4333-8333-333333333333";
const job = "44444444-4444-4444-8444-444444444444";
const lease = "55555555-5555-4555-8555-555555555555";
test("gallery migration enforces isolation, admission, leases and deletion interlocks", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create schema storage;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid,name text,bucket_id text);
      alter table storage.objects enable row level security;
      create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
      grant usage on schema public,auth,storage to anon,authenticated,service_role;
      grant select on storage.objects to authenticated;
      insert into auth.users values('${owner}'),('${other}');`);
    await db.exec(
      await readFile(
        new URL(
          "../supabase/migrations/202610110001_gallery.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    await db.query(
      `insert into public.humanis_photos(id,owner_id,title,original_path,mime_type) values($1,$2,'Photo',$3,'image/png')`,
      [photo, owner, `${owner}/${photo}/original.png`],
    );
    await db.query(
      `insert into storage.objects(id,name,bucket_id) values($1,$2,'humanis-private'),($3,$4,'humanis-private')`,
      [photo, `${owner}/original.png`, job, `${other}/original.png`],
    );
    await db.exec(
      `set role authenticated; select set_config('request.jwt.claim.sub','${other}',false);`,
    );
    assert.equal(
      (await db.query("select * from public.humanis_photos")).rows.length,
      0,
    );
    assert.equal(
      (await db.query("select * from storage.objects")).rows.length,
      1,
    );
    await assert.rejects(
      db.query(
        "insert into public.humanis_jobs(id,photo_id,owner_id) values($1,$2,$3)",
        [job, photo, other],
      ),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select public.humanis_create_job($1,$2,$3,$4,$5,$6)", [
        job,
        photo,
        owner,
        "",
        "",
        "",
      ]),
      /permission denied/,
    );
    await db.exec(
      `select set_config('request.jwt.claim.sub','${owner}',false);`,
    );
    assert.equal(
      (await db.query("select * from public.humanis_photos")).rows.length,
      1,
    );
    await db.exec("reset role;");
    const args = [job, photo, owner, "1910", "Paris", "Family album"];
    await db.query("select public.humanis_create_job($1,$2,$3,$4,$5,$6)", args);
    await db.query("select public.humanis_create_job($1,$2,$3,$4,$5,$6)", args);
    assert.equal(
      (await db.query("select * from public.humanis_jobs")).rows.length,
      1,
      "same request ID is idempotent",
    );
    await assert.rejects(
      db.query("select public.humanis_create_job($1,$2,$3,$4,$5,$6)", [
        "66666666-6666-4666-8666-666666666666",
        photo,
        owner,
        "",
        "",
        "",
      ]),
      /JOB_ACTIVE/,
    );
    await assert.rejects(
      db.query("select public.humanis_create_job($1,$2,$3,$4,$5,$6)", [
        "66666666-6666-4666-8666-666666666666",
        photo,
        other,
        "",
        "",
        "",
      ]),
      /PHOTO_NOT_FOUND/,
    );
    assert.equal(
      (
        await db.query("select * from public.humanis_claim_job($1,$2)", [
          job,
          lease,
        ])
      ).rows.length,
      1,
    );
    assert.equal(
      (
        await db.query("select * from public.humanis_claim_job($1,$2)", [
          job,
          lease,
        ])
      ).rows.length,
      0,
      "duplicate delivery cannot acquire active lease",
    );
    await assert.rejects(
      db.query("select public.humanis_begin_delete($1,$2)", [photo, owner]),
      /JOB_ACTIVE/,
    );
    await db.query(
      `update public.humanis_jobs set lease_until=now()-interval '1 minute' where id=$1`,
      [job],
    );
    assert.equal(
      (
        await db.query("select * from public.humanis_claim_job($1,$2)", [
          job,
          lease,
        ])
      ).rows.length,
      1,
      "stale lease can be reclaimed",
    );
    await db.query(
      `update public.humanis_jobs set status='succeeded',result_path='result.png' where id=$1`,
      [job],
    );
    assert.equal(
      (
        await db.query("select * from public.humanis_claim_job($1,$2)", [
          job,
          lease,
        ])
      ).rows.length,
      0,
      "completed jobs never regenerate",
    );
    await db.query("select public.humanis_begin_delete($1,$2)", [photo, owner]);
    await assert.rejects(
      db.query("select public.humanis_create_job($1,$2,$3,$4,$5,$6)", [
        "66666666-6666-4666-8666-666666666666",
        photo,
        owner,
        "",
        "",
        "",
      ]),
      /PHOTO_NOT_FOUND/,
    );
    await db.query("delete from public.humanis_photos where id=$1", [photo]);
    assert.equal(
      (await db.query("select * from public.humanis_jobs")).rows.length,
      0,
      "deleting a photo removes versions",
    );
  } finally {
    await db.close();
  }
});
