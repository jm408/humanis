import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import {
  processJob,
  getPhoto,
  createPhoto,
  GalleryError,
} from "../src/services/gallery.js";
const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});
const owner = "11111111-1111-4111-8111-111111111111";
const photo = "33333333-3333-4333-8333-333333333333";
const job = "44444444-4444-4444-8444-444444444444";
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
function client() {
  return createClient("https://gallery-test.supabase.co", "sb_secret_test", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
test("retrieving another user photo is scoped by verified owner and does not sign URLs", async () => {
  let signed = false;
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    if (url.pathname.includes("/storage/")) signed = true;
    assert.equal(url.searchParams.get("owner_id"), `eq.${owner}`);
    return response(null);
  };
  await assert.rejects(
    getPhoto(owner, photo, client()),
    (error: any) => error instanceof GalleryError && error.status === 404,
  );
  assert.equal(signed, false);
});
test("worker persists output and duplicate delivery never regenerates a completed job", async () => {
  let status = "queued";
  let restoreCalls = 0;
  let uploads = 0;
  let signed = false;
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    const method = init?.method || "GET";
    if (url.pathname.endsWith("/rpc/humanis_claim_job")) {
      if (status === "succeeded") return response([]);
      status = "processing";
      const body = JSON.parse(String(init?.body));
      return response([
        {
          id: job,
          photo_id: photo,
          owner_id: owner,
          year: "1910",
          location: "Paris",
          context: "Album",
          lease_token: body.p_lease,
        },
      ]);
    }
    if (url.pathname.endsWith("/humanis_photos")) {
      assert.equal(url.searchParams.get("owner_id"), `eq.${owner}`);
      return response({
        id: photo,
        owner_id: owner,
        mime_type: "image/png",
        original_path: `${owner}/${photo}/original.png`,
      });
    }
    if (url.pathname.endsWith("/humanis_jobs")) {
      if (method === "PATCH") {
        assert.ok(url.searchParams.get("lease_token"));
        const body = JSON.parse(String(init?.body));
        status = body.status;
        return response(null, 200);
      }
      return response({ status });
    }
    if (url.pathname.includes("/storage/v1/object/sign")) {
      signed = true;
      return response({});
    }
    if (url.pathname.includes("/storage/v1/object/")) {
      if (method === "POST") {
        uploads++;
        assert.ok(url.pathname.includes(owner));
        return response({ Key: "saved" });
      }
      return new Response(Buffer.from(png, "base64"), {
        status: 200,
        headers: { "Content-Type": "image/png" },
      });
    }
    throw new Error("Unexpected mock request: " + url.pathname);
  };
  const restore = async (options: any) => {
    restoreCalls++;
    assert.equal(options.year, "1910");
    return `data:image/png;base64,${png}`;
  };
  await processJob(job, client(), restore);
  await processJob(job, client(), restore);
  assert.equal(status, "succeeded");
  assert.equal(restoreCalls, 1);
  assert.equal(uploads, 1);
  assert.equal(signed, false);
});
test("invalid image signatures are rejected before upload", async () => {
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return response(null);
  };
  await assert.rejects(
    createPhoto(
      owner,
      {
        id: photo,
        imageBase64: "data:image/png;base64,aGVsbG8=",
        title: "Bad",
      },
      client(),
    ),
    (error: any) => error.code === "INVALID_IMAGE",
  );
  assert.equal(called, false);
});

test('job creation requests a singular RPC response and dispatches its returned ID', async () => {
  const { queuePhoto } = await import('../src/services/gallery.js');
  const keys = ['TASKS_PROJECT','TASKS_LOCATION','TASKS_QUEUE','TASKS_SERVICE_ACCOUNT','APP_URL'];
  const original=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
  for(const key of keys)process.env[key]='mock-config';
  try {
    globalThis.fetch=async(input,init)=>{
      assert.ok(String(input).endsWith('/rpc/humanis_create_job'));
      assert.equal(new Headers(init?.headers).get('accept'),'application/vnd.pgrst.object+json');
      const body=JSON.parse(String(init?.body));assert.equal(body.p_owner,owner);
      return response({id:job,status:'queued',enqueued_at:null});
    };
    let dispatched='';
    const result=await queuePhoto(owner,photo,{jobId:job,year:'1910',location:'Paris',context:''},client(),async id=>{dispatched=id;});
    assert.equal(dispatched,job);assert.equal(result.id,job);
  } finally {for(const key of keys){if(original[key]===undefined)delete process.env[key];else process.env[key]=original[key];}}
});
