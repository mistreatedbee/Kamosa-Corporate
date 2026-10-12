-- Backing tables/bucket for the remaining admin sidebar sections: Reports (no new table — reads
-- existing enquiries/job_postings/job_applications), Documents, Email Templates, and Settings.
-- Same posture as every prior migration: RLS enabled, no anon/authenticated policies at all on
-- either table or the new bucket — everything here is admin-only, reached exclusively through the
-- service role from api/admin/tools.ts (and, for email_templates/site_settings, read by
-- api/_lib/notifyEmail.ts). There is no public-facing path to any of this, unlike cv-uploads.

create table if not exists public.email_templates (
  type text primary key check (type in ('enquiry', 'quote_request', 'service_request', 'job_application')),
  subject text not null,
  intro text,
  updated_at timestamptz not null default now()
);

drop trigger if exists email_templates_set_updated_at on public.email_templates;
create trigger email_templates_set_updated_at
  before update on public.email_templates
  for each row
  execute function public.set_updated_at();

create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row
  execute function public.set_updated_at();

alter table public.email_templates enable row level security;
alter table public.site_settings enable row level security;

-- Deliberately no policies for anon/authenticated on either table: with RLS enabled and no
-- matching policy, every operation is denied by default for those roles. Only the service role
-- (which bypasses RLS) ever touches these tables.

insert into storage.buckets (id, name, public, file_size_limit)
values ('admin-documents', 'admin-documents', false, 4194304)
on conflict (id) do nothing;

-- No storage.objects policies for this bucket either (contrast with cv-uploads, which needs an
-- anon INSERT policy for the public apply flow) — admin-documents has no public-facing writer at
-- all, so the absence of any anon/authenticated policy is the entire access control: only the
-- service role can read, write, or delete.
