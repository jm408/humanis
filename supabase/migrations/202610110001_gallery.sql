begin;
create table if not exists public.humanis_photos (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  year text not null default '' check (char_length(year) <= 200),
  location text not null default '' check (char_length(location) <= 500),
  context text not null default '' check (char_length(context) <= 8000),
  original_path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  created_at timestamptz not null default now(),
  deleting_at timestamptz,
  unique (id, owner_id)
);
create table if not exists public.humanis_jobs (
  id uuid primary key,
  photo_id uuid not null,
  owner_id uuid not null,
  foreign key (photo_id, owner_id) references public.humanis_photos(id, owner_id) on delete cascade,
  status text not null default 'queued' check (status in ('queued','processing','succeeded','failed')),
  year text not null default '', location text not null default '', context text not null default '',
  result_path text,
  error_code text, error_message text,
  enqueued_at timestamptz,
  attempts integer not null default 0,
  lease_token uuid,
  lease_until timestamptz,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists humanis_photos_owner_created on public.humanis_photos(owner_id, created_at desc, id desc);
create index if not exists humanis_jobs_photo_created on public.humanis_jobs(photo_id, created_at desc);
create unique index if not exists humanis_one_active_job on public.humanis_jobs(photo_id) where status in ('queued','processing');
alter table public.humanis_photos enable row level security;
alter table public.humanis_jobs enable row level security;
drop policy if exists humanis_read_own_photos on public.humanis_photos;
create policy humanis_read_own_photos on public.humanis_photos for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists humanis_read_own_jobs on public.humanis_jobs;
create policy humanis_read_own_jobs on public.humanis_jobs for select to authenticated using (owner_id = (select auth.uid()));
revoke all on public.humanis_photos, public.humanis_jobs from anon, authenticated;
grant select on public.humanis_photos, public.humanis_jobs to authenticated;
grant all on public.humanis_photos, public.humanis_jobs to service_role;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('humanis-private','humanis-private',false,18874368,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists humanis_read_own_objects on storage.objects;
create policy humanis_read_own_objects on storage.objects for select to authenticated using (
  bucket_id = 'humanis-private' and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Only the verified backend can write. All RPCs use the caller's service-role privileges.
create or replace function public.humanis_create_job(p_id uuid, p_photo uuid, p_owner uuid, p_year text, p_location text, p_context text)
returns public.humanis_jobs language plpgsql set search_path = public as $$
declare photo public.humanis_photos; job public.humanis_jobs;
begin
  -- Serialize per-user admission to keep the outstanding-job cap atomic.
  perform pg_advisory_xact_lock(hashtextextended(p_owner::text, 0));
  select * into photo from public.humanis_photos where id=p_photo and owner_id=p_owner for update;
  if not found or photo.deleting_at is not null then raise exception 'PHOTO_NOT_FOUND'; end if;
  select * into job from public.humanis_jobs where id=p_id;
  if found then
    if job.owner_id <> p_owner or job.photo_id <> p_photo then raise exception 'JOB_CONFLICT'; end if;
    return job;
  end if;
  if char_length(p_year)>200 or char_length(p_location)>500 or char_length(p_context)>8000 then raise exception 'INVALID_CONTEXT'; end if;
  if exists(select 1 from public.humanis_jobs where photo_id=p_photo and status in ('queued','processing')) then raise exception 'JOB_ACTIVE'; end if;
  if (select count(*) from public.humanis_jobs where owner_id=p_owner and status in ('queued','processing')) >= 100 then raise exception 'JOB_LIMIT'; end if;
  insert into public.humanis_jobs(id,photo_id,owner_id,year,location,context)
  values(p_id,p_photo,p_owner,p_year,p_location,p_context) returning * into job;
  update public.humanis_photos set year=p_year, location=p_location, context=p_context where id=p_photo;
  return job;
end $$;

create or replace function public.humanis_claim_job(p_id uuid, p_lease uuid)
returns setof public.humanis_jobs language plpgsql set search_path = public as $$
begin
  -- Prevent indefinite retries if infrastructure repeatedly fails mid-request.
  update public.humanis_jobs set status='failed', error_code='WORKER_RETRIES_EXHAUSTED',
    error_message='Processing was interrupted. You can retry this photo.', finished_at=now()
  where id=p_id and status in ('queued','processing') and attempts>=3 and (lease_until is null or lease_until<now());
  return query update public.humanis_jobs set status='processing', attempts=attempts+1,
    lease_token=p_lease, lease_until=now()+interval '10 minutes'
  where id=p_id and (status='queued' or (status='processing' and lease_until<now())) and attempts<3
  returning *;
end $$;

create or replace function public.humanis_begin_delete(p_id uuid, p_owner uuid)
returns public.humanis_photos language plpgsql set search_path = public as $$
declare photo public.humanis_photos;
begin
  select * into photo from public.humanis_photos where id=p_id and owner_id=p_owner for update;
  if not found then raise exception 'PHOTO_NOT_FOUND'; end if;
  if exists(select 1 from public.humanis_jobs where photo_id=p_id and status in ('queued','processing')) then raise exception 'JOB_ACTIVE'; end if;
  update public.humanis_photos set deleting_at=coalesce(deleting_at,now()) where id=p_id returning * into photo;
  return photo;
end $$;
revoke all on function public.humanis_create_job(uuid,uuid,uuid,text,text,text), public.humanis_claim_job(uuid,uuid), public.humanis_begin_delete(uuid,uuid) from public, anon, authenticated;
grant execute on function public.humanis_create_job(uuid,uuid,uuid,text,text,text), public.humanis_claim_job(uuid,uuid), public.humanis_begin_delete(uuid,uuid) to service_role;
commit;
