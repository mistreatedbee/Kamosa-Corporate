-- Careers: admin-managed job postings + public applications with CV upload.
-- Same security posture as 0001_enquiries.sql: RLS is the real boundary, not application code.
--
-- job_postings: public can SELECT only rows with status = 'open' (the public /careers listing).
-- Nothing else — no public insert/update/delete. Postings are created/edited only by the admin
-- API, which uses the service role and bypasses RLS entirely.
--
-- job_applications: public can INSERT only, and only against a posting that is currently open
-- (enforced in the insert policy itself, not just in application code, so a stale/buggy client
-- can't submit into a closed or draft posting). No public SELECT/UPDATE/DELETE — applicants can't
-- read back their own or anyone else's application. Admin reads/updates via the service role.
--
-- cv-uploads storage bucket: private (not public), 5MB cap, PDF/DOC/DOCX only. Applicants can only
-- INSERT objects, never list or read any back (their own included) — the admin CV-download endpoint
-- is the only reader, via short-lived signed URLs minted server-side with the service role.

create table if not exists public.job_postings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text,
  location text not null default 'South Africa',
  employment_type text not null default 'Full-time'
    check (employment_type in ('Full-time', 'Part-time', 'Contract', 'Internship')),
  summary text not null,
  requirements text[] not null default '{}',
  responsibilities text[] not null default '{}',
  status text not null default 'draft'
    check (status in ('draft', 'open', 'closed')),
  closing_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_postings_status_idx on public.job_postings (status);
create index if not exists job_postings_created_at_idx on public.job_postings (created_at desc);

drop trigger if exists job_postings_set_updated_at on public.job_postings;
create trigger job_postings_set_updated_at
  before update on public.job_postings
  for each row
  execute function public.set_updated_at();

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_posting_id uuid not null references public.job_postings (id) on delete cascade,
  status text not null default 'New'
    check (status in ('New', 'Reviewed', 'Shortlisted', 'Interviewing', 'Offered', 'Rejected', 'Hired')),
  name text not null,
  email text not null,
  phone text,
  cover_message text,
  cv_storage_path text not null,
  cv_file_name text not null,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists job_applications_job_posting_id_idx on public.job_applications (job_posting_id);
create index if not exists job_applications_status_idx on public.job_applications (status);
create index if not exists job_applications_created_at_idx on public.job_applications (created_at desc);

drop trigger if exists job_applications_set_updated_at on public.job_applications;
create trigger job_applications_set_updated_at
  before update on public.job_applications
  for each row
  execute function public.set_updated_at();

alter table public.job_postings enable row level security;
alter table public.job_applications enable row level security;

drop policy if exists "public can read open job postings" on public.job_postings;
create policy "public can read open job postings"
  on public.job_postings for select
  to anon, authenticated
  using (status = 'open');

drop policy if exists "public can apply to open job postings" on public.job_applications;
create policy "public can apply to open job postings"
  on public.job_applications for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.job_postings jp
      where jp.id = job_posting_id and jp.status = 'open'
    )
  );

-- Storage bucket + policies for CVs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cv-uploads',
  'cv-uploads',
  false,
  5242880,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

drop policy if exists "anon can upload cvs" on storage.objects;
create policy "anon can upload cvs"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'cv-uploads');
