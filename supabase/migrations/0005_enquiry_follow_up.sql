-- Enquiry follow-up tracking + typed note history for the admin Enquiries page.
-- Purely additive: two nullable columns on enquiries and one defaulted column on enquiry_notes, so
-- every existing row stays exactly as it is (existing notes become kind = 'note'). No data is
-- rewritten. RLS posture is unchanged from 0001: enquiries/enquiry_notes still have NO public
-- SELECT/UPDATE policy — these columns are only ever read or written through the service role from
-- api/admin/enquiries.ts, behind rejectIfUnauthorized.

alter table public.enquiries
  add column if not exists next_follow_up_at date,
  add column if not exists last_contacted_at date;

create index if not exists enquiries_next_follow_up_at_idx
  on public.enquiries (next_follow_up_at)
  where next_follow_up_at is not null;

create index if not exists enquiries_updated_at_idx on public.enquiries (updated_at desc);

-- 'note'          — free-text internal note typed by the admin
-- 'status_change' — written automatically when the status changes, so the history (e.g. how an
--                   enquiry reached Converted) survives later status edits
-- 'follow_up'     — written automatically when the follow-up / last-contacted dates change
alter table public.enquiry_notes
  add column if not exists kind text not null default 'note';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'enquiry_notes_kind_check'
  ) then
    alter table public.enquiry_notes
      add constraint enquiry_notes_kind_check check (kind in ('note', 'status_change', 'follow_up'));
  end if;
end;
$$;
