-- Phase 1: enquiries + quote/service request detail tables.
-- Schema per docs/DATABASE_ARCHITECTURE.md §2.1-2.5.
-- Security: RLS is the real boundary here, not application code. Public role gets INSERT only,
-- on all four tables — no SELECT/UPDATE/DELETE for anon/authenticated. Only the service role
-- (used exclusively from Vercel serverless functions, never the client) can read enquiries back.
-- See docs/DECISIONS.md Decision 3.

create extension if not exists pgcrypto;

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'general'
    check (type in ('general', 'quote_hs', 'quote_training', 'quote_procurement', 'service_request')),
  status text not null default 'New'
    check (status in ('New', 'Contacted', 'Qualified', 'In Progress', 'Converted', 'Closed', 'Spam')),
  name text not null,
  email text not null,
  phone text,
  company_name text,
  message text,
  service_slug text,
  assigned_staff_id uuid,
  source text,
  spam_score numeric,
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists enquiries_status_idx on public.enquiries (status);
create index if not exists enquiries_type_idx on public.enquiries (type);
create index if not exists enquiries_created_at_idx on public.enquiries (created_at desc);
create index if not exists enquiries_assigned_staff_id_idx on public.enquiries (assigned_staff_id);

create table if not exists public.enquiry_notes (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries (id) on delete cascade,
  author_id uuid,
  note text not null,
  created_at timestamptz not null default now()
);

create index if not exists enquiry_notes_enquiry_id_idx on public.enquiry_notes (enquiry_id);

create table if not exists public.enquiry_attachments (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes integer,
  uploaded_at timestamptz not null default now()
);

create index if not exists enquiry_attachments_enquiry_id_idx on public.enquiry_attachments (enquiry_id);

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null unique references public.enquiries (id) on delete cascade,
  category text not null check (category in ('health_safety', 'training', 'procurement')),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists quote_requests_details_gin_idx on public.quote_requests using gin (details);

create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null unique references public.enquiries (id) on delete cascade,
  service_slug text not null,
  urgency text check (urgency in ('standard', 'urgent')),
  created_at timestamptz not null default now()
);

-- updated_at trigger for enquiries
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists enquiries_set_updated_at on public.enquiries;
create trigger enquiries_set_updated_at
  before update on public.enquiries
  for each row
  execute function public.set_updated_at();

-- Row Level Security: insert-only for everyone, no read/update/delete for anon or authenticated.
-- The service role bypasses RLS entirely (by design in Supabase) so admin tooling reads via the
-- service role from serverless functions only — never via a client-side Supabase call.

alter table public.enquiries enable row level security;
alter table public.enquiry_notes enable row level security;
alter table public.enquiry_attachments enable row level security;
alter table public.quote_requests enable row level security;
alter table public.service_requests enable row level security;

drop policy if exists "public can insert enquiries" on public.enquiries;
create policy "public can insert enquiries"
  on public.enquiries for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public can insert quote_requests" on public.quote_requests;
create policy "public can insert quote_requests"
  on public.quote_requests for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public can insert service_requests" on public.service_requests;
create policy "public can insert service_requests"
  on public.service_requests for insert
  to anon, authenticated
  with check (true);

drop policy if exists "public can insert enquiry_attachments" on public.enquiry_attachments;
create policy "public can insert enquiry_attachments"
  on public.enquiry_attachments for insert
  to anon, authenticated
  with check (true);

-- No insert policy on enquiry_notes for anon/authenticated: notes are staff-only, written via the
-- service role from admin tooling (Phase 2), never from a public-facing form.

-- Deliberately no SELECT/UPDATE/DELETE policies for anon/authenticated on any of these five tables:
-- with RLS enabled and no matching policy, those operations are denied by default. This is what
-- "insert-only, no public select" means in Postgres RLS terms.
