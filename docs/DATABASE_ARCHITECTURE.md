# Kamosa Platform — Database & Backend Architecture (Design Doc)

Status: design only. No Supabase project has been created, no SQL has been run, no infrastructure
has been touched. This document specifies the schema, security model, and phasing for the backend
that will support the expanded Kamosa platform described in the project brief. It complements
`docs/KAMOSA_COMPANY_PROFILE.md` (business facts — do not duplicate/invent content elsewhere) and
`docs/EXISTING_AUDIT_SUMMARY.md` (prior audit, including the hand-rolled-admin-auth incident this
design explicitly must not repeat).

---

## 1. Recommended Stack: Supabase

**Recommendation: Supabase (hosted Postgres + Auth + Storage + Edge Functions + Row Level
Security).**

### Why Supabase over the alternatives

| Option | Verdict |
|---|---|
| **Supabase** (chosen) | Postgres gives real relational integrity for CRM-shaped data (enquiries → contacts → orgs → interactions) that a document DB would force us to denormalize badly. Auth, Storage, and RLS are first-class and integrate as one system instead of three vendors to wire together. Free/low tier is appropriate for a small business's current traffic; scales later without a re-platform. |
| Firebase / Firestore | Document model is a poor fit for relational CRM/tender/training data with many foreign keys and reporting needs. Security rules are less expressive than SQL RLS for the "own org only" pattern Phase 3 needs. |
| Hand-rolled Node/Express + Postgres on Render/Railway + custom JWT auth | This is exactly the shape of system that produced the prior incident (hand-rolled, easy to get auth wrong). More code to write and audit for the same result. No inherent advantage given the team's size. |
| Vercel Postgres + NextAuth/custom auth | Works but recreates Auth, Storage, and RLS pieces Supabase already bundles and battle-tests; more integration surface, more places to introduce the client-side-auth mistake again. |

### Integration with existing deployment

The site is a Vite + React SPA on Vercel with no backend today (`src/utils/enquiry.ts` posts to a
`null` endpoint). Supabase slots in cleanly:
- **Vercel Serverless Functions** (`/api/*`) act as the trusted server-side layer: they hold the
  Supabase **service role key** (never shipped to the browser), validate input, apply rate limiting,
  and call Supabase. The browser never talks to Supabase with elevated privileges.
- The browser talks to Supabase directly only with the **anon/publishable key** for reads that RLS
  already permits (e.g. published tenders, FAQs, blog posts) — no serverless hop needed for those.
- Supabase Auth issues JWTs for admin/staff/client logins; those JWTs are verified server-side
  (Vercel function or Supabase Edge Function), never by a client-side flag. This is the direct fix
  for the pattern that caused the prior incident (see §5).

---

## 2. Phase 1/2 Tables (build now)

Naming: `snake_case`, `uuid` primary keys (`gen_random_uuid()`), `created_at`/`updated_at`
(`timestamptz`, default `now()`) on every table unless noted.

### 2.1 `enquiries`
General enquiries + the entry point for quote/service requests (a quote/service request is an
enquiry with `type` set and a linked type-specific detail row).

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| type | text | `general` \| `quote_hs` \| `quote_training` \| `quote_procurement` \| `service_request` |
| status | text | `New`/`Contacted`/`Qualified`/`In Progress`/`Converted`/`Closed`/`Spam` — check constraint |
| name | text | required |
| email | text | required |
| phone | text | |
| company_name | text | |
| message | text | |
| service_slug | text | references the static service catalogue (`src/data/services.ts`), not a FK — content stays static |
| assigned_staff_id | uuid | FK → `profiles.id` (nullable; Phase 3 — null until staff accounts exist, see §3) |
| source | text | e.g. `contact_form`, `service_page`, `tender_interest` |
| spam_score | numeric | honeypot/heuristic result, for filtering |
| ip_hash | text | hashed, not raw IP (minimal PII) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Indexes: `status`, `type`, `created_at desc`, `assigned_staff_id`.

### 2.2 `enquiry_notes`
Internal staff notes on an enquiry (never visible to the public).

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| enquiry_id | uuid | FK → `enquiries.id` on delete cascade |
| author_id | uuid | FK → `profiles.id` (Phase 3) |
| note | text | |
| created_at | timestamptz | |

Index: `enquiry_id`.

### 2.3 `enquiry_attachments`
Files attached to an enquiry (e.g. a compliance doc a visitor uploads with a quote request).

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| enquiry_id | uuid | FK → `enquiries.id` on delete cascade |
| storage_path | text | path within `client-documents` or a dedicated `enquiry-uploads` bucket |
| file_name | text | original filename |
| mime_type | text | |
| size_bytes | integer | |
| uploaded_at | timestamptz | |

Index: `enquiry_id`.

### 2.4 `quote_requests`
Type-specific detail row, one per enquiry of type `quote_*`. Kept as a single flexible table
(rather than three near-duplicate tables) using a `jsonb` column for the field set that varies by
service type — avoids over-engineering three near-identical tables for v1 while keeping the fixed,
always-present fields typed and queryable.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| enquiry_id | uuid | FK → `enquiries.id` on delete cascade, unique |
| category | text | `health_safety` \| `training` \| `procurement` |
| details | jsonb | category-specific fields, e.g. H&S: `{site_type, worker_count, duration, location, docs_needed[], compliance_status}`; Training: `{course, participant_count, preferred_date, location, organisation}`; Procurement: `{product_category, quantity, needed_by, delivery_location}` |
| created_at | timestamptz | |

Indexes: `enquiry_id` (unique), GIN index on `details` for admin filtering.

> Why `jsonb` here and nowhere else: this is the one place field sets genuinely vary per category
> and are read/written together as a form payload, not queried column-by-column in reports. Every
> other table in this doc uses typed columns.

### 2.5 `service_requests`
For `service_request`-type enquiries that don't fit the quote categories (e.g. "review our existing
safety file"). Minimal — mostly reuses `enquiries` fields; this table just tags the specific service
line requested.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| enquiry_id | uuid | FK → `enquiries.id` on delete cascade, unique |
| service_slug | text | which of the four service lines |
| urgency | text | `standard` \| `urgent`, optional |
| created_at | timestamptz | |

### 2.6 `tenders`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| reference_number | text | unique, required |
| title | text | |
| organisation | text | issuing org |
| industry | text | |
| description | text | |
| requirements | text | |
| status | text | `Open`/`Closing Soon`/`Closed`/`Awarded`/`Archived` |
| published_at | timestamptz | null until published |
| closing_date | timestamptz | |
| contact_name | text | |
| contact_email | text | |
| contact_phone | text | |
| created_by | uuid | FK → `profiles.id` (Phase 3) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Indexes: `status`, `closing_date`, unique on `reference_number`.

### 2.7 `tender_documents`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| tender_id | uuid | FK → `tenders.id` on delete cascade |
| storage_path | text | in `tender-documents` bucket |
| file_name | text | |
| mime_type | text | |
| size_bytes | integer | |
| uploaded_at | timestamptz | |

Index: `tender_id`.

### 2.8 `tender_interests`
Visitor actions on a tender: expressing interest, requesting clarification, or logging a download.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| tender_id | uuid | FK → `tenders.id` on delete cascade |
| action | text | `interest` \| `clarification_request` \| `document_download` |
| name | text | |
| email | text | |
| company_name | text | |
| message | text | clarification question, if any |
| response | text | admin's clarification reply, if any |
| responded_at | timestamptz | |
| created_at | timestamptz | |

Indexes: `tender_id`, `action`.

### 2.9 `training_courses`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| slug | text | unique |
| title | text | |
| overview | text | |
| duration | text | e.g. "1 day" |
| format | text | `onsite` \| `virtual` \| `hybrid` |
| audience | text | |
| requirements | text | prerequisites |
| is_active | boolean | default true |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Index: unique `slug`.

### 2.10 `training_sessions`
Scheduled instances of a course (optional but useful — lets admin publish concrete dates rather than
registrations floating against a course with no calendar).

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| course_id | uuid | FK → `training_courses.id` on delete cascade |
| session_date | date | |
| location | text | |
| capacity | integer | nullable = unlimited |
| status | text | `Scheduled`/`Full`/`Cancelled`/`Completed` |
| created_at | timestamptz | |

Index: `course_id`, `session_date`.

### 2.11 `training_registrations`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| course_id | uuid | FK → `training_courses.id` |
| session_id | uuid | FK → `training_sessions.id`, nullable (registrant may not have picked a date yet) |
| participant_name | text | |
| organisation | text | |
| email | text | |
| phone | text | |
| preferred_date | date | used when `session_id` is null |
| participant_count | integer | default 1 |
| notes | text | |
| status | text | `Registered`/`Confirmed`/`Attended`/`Completed`/`Cancelled` |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Indexes: `course_id`, `session_id`, `status`.

### 2.12 `resources`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| title | text | |
| description | text | |
| category | text | `guides`/`checklists`/`compliance`/`company_docs`/`training`/`safety`/`procurement` |
| storage_path | text | in `resources` bucket |
| file_name | text | |
| mime_type | text | |
| size_bytes | integer | |
| author | text | |
| download_count | integer | default 0 |
| is_published | boolean | default false |
| published_at | timestamptz | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Indexes: `category`, `is_published`, full-text search index (`to_tsvector`) on `title`+`description`.

### 2.13 `faqs`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| category | text | `General`/`H&S`/`Consulting`/`Procurement`/`Training`/`Environmental`/`Tenders` |
| question | text | |
| answer | text | |
| sort_order | integer | default 0 |
| is_published | boolean | default true |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Indexes: `category`, `is_published`, full-text search on `question`+`answer`.

### 2.14 `blog_posts`
| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| slug | text | unique |
| title | text | |
| excerpt | text | |
| body | text | markdown or rich text |
| category | text | |
| author | text | |
| reading_time_minutes | integer | |
| cover_image_path | text | storage path or external URL |
| seo_title | text | |
| seo_description | text | |
| is_published | boolean | default false |
| published_at | timestamptz | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Indexes: unique `slug`, `is_published`, `category`, `published_at desc`, full-text search on
`title`+`excerpt`+`body`.

### 2.15 `profile_downloads`
Tracks the gated company-profile PDF download.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text | |
| company_name | text | |
| email | text | |
| phone | text | |
| reason | text | |
| source | text | which page triggered the gate |
| downloaded_at | timestamptz | |

Index: `downloaded_at desc`, `email`.

### 2.16 `notifications`
Both admin-side and (later) client-side notifications, one table with a `recipient_type` /
`recipient_id` split so Phase 3 client notifications need no schema change.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| recipient_type | text | `admin` \| `staff` \| `client` |
| recipient_id | uuid | FK → `profiles.id`, nullable for broadcast-to-all-admins |
| type | text | e.g. `new_enquiry`, `new_quote`, `tender_interest`, `training_registration`, `new_client`, `new_document`, `enquiry_received`, `request_updated`, `training_confirmed`, `doc_available`, `tender_clarification_response` |
| title | text | |
| body | text | |
| related_table | text | e.g. `enquiries` |
| related_id | uuid | |
| is_read | boolean | default false |
| created_at | timestamptz | |

Indexes: `recipient_type, recipient_id, is_read`, `created_at desc`.

---

## 3. Phase 3 Tables (NOT implemented until Phase 3 — documented for forward compatibility only)

These exist here so Phase 1/2 foreign keys (`assigned_staff_id`, `created_by`, `recipient_id`) have
a known future target and don't need renaming later. **Do not create these tables, do not enable
Supabase Auth, do not build any client portal UI in Phase 1/2.**

### `profiles`
Mirrors `auth.users` (Supabase Auth). One row per authenticated user (admin/staff/client).
`id` (uuid, PK, = `auth.users.id`), `role` (`admin`/`staff`/`client`), `organisation_id` (FK →
`organisations.id`, null for admin/staff), `full_name`, `email`, `phone`, `notification_prefs`
(jsonb), `created_at`.

### `organisations`
Client companies with portal access. `id`, `name`, `registration_number`, `industry`, `created_at`.

### `contacts`
People at an organisation who may or may not have portal logins yet (CRM contact vs. authenticated
`profiles` row are separate concerns). `id`, `organisation_id` (FK), `name`, `email`, `phone`,
`role_title`, `created_at`.

### `projects`
Case-study / project-tracking records. **Schema only — must stay empty of invented data**; the
company profile has no confirmed client/project names to populate beyond the sector-level Eskom
plant references already in the static content. `id`, `organisation_id` (FK, nullable for
public-facing anonymised case studies), `title`, `industry`, `location`, `client_name` (nullable,
never invented), `description`, `services` (text[]), `challenges`, `approach`, `outcome`, `is_public`
(boolean — gates whether it can appear as a public case study vs. client-portal-only), `date`,
`created_at`.

### `project_documents`
`id`, `project_id` (FK), `storage_path` (in `client-documents`), `file_name`, `document_type`
(`safety_file`/`report`/`certificate`/`compliance`/`other`), `expiry_date` (nullable), `uploaded_by`
(FK → `profiles.id`), `created_at`.

### `documents`
General client-portal documents not tied to a specific project (e.g. a standing compliance
certificate). `id`, `organisation_id` (FK), `storage_path`, `file_name`, `document_type`,
`expiry_date`, `uploaded_by`, `created_at`.

### `audit_logs`
`id`, `actor_id` (FK → `profiles.id`, nullable for system actions), `action` (e.g.
`document.download`, `enquiry.status_change`, `tender.publish`), `target_table`, `target_id`,
`metadata` (jsonb — before/after values where relevant), `ip_hash`, `created_at`. Append-only,
never updated or deleted by application code.

---

## 4. Row Level Security (RLS) Design

RLS is enabled on **every** table (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`), including ones with
no policies yet — the Postgres default when RLS is on and no policy matches is **deny**, so a table
is inaccessible until a policy explicitly opens it. This is the enforced backstop that makes the
"never trust a client-side flag" principle real at the data layer, not just the app layer.

### Phase 1/2 policies (no auth yet — public + a trusted server role only)

Until Supabase Auth / `profiles` exist, "admin access" is done via the **service role key**, used
only from Vercel serverless functions, never exposed to the browser. RLS policies below are written
for the `anon`/public role; the service role bypasses RLS by design and is how the (not-yet-built)
admin dashboard reads/writes freely in Phase 1/2.

| Table | Public (anon) read | Public (anon) insert | Public (anon) update/delete |
|---|---|---|---|
| `enquiries` | none | **yes** (insert only, own row not readable after) | none |
| `enquiry_notes` | none | none | none |
| `enquiry_attachments` | none | yes (insert, tied to an enquiry just created in the same request) | none |
| `quote_requests` | none | yes (insert only) | none |
| `service_requests` | none | yes (insert only) | none |
| `tenders` | yes, but only rows where `status IN ('Open','Closing Soon','Awarded')` and `published_at IS NOT NULL` | none | none |
| `tender_documents` | yes, only for tenders visible per above | none | none |
| `tender_interests` | none | yes (insert only) | none |
| `training_courses` | yes, only `is_active = true` | none | none |
| `training_sessions` | yes, only for active courses, `status != 'Cancelled'` | none | none |
| `training_registrations` | none | yes (insert only) | none |
| `resources` | yes, only `is_published = true` | none | none |
| `faqs` | yes, only `is_published = true` | none | none |
| `blog_posts` | yes, only `is_published = true` | none | none |
| `profile_downloads` | none | yes (insert only) | none |
| `notifications` | none | none | none |

Key pattern: every public-facing "submit a form" table allows **insert-only** for `anon`, with no
`SELECT` policy at all — a visitor cannot read back their own or anyone else's submission through the
public API. Reading any of it back (for confirmation UI, status, etc.) is served by the serverless
function returning the inserted row directly from the insert response, not via a subsequent
client-side query.

### Phase 3 additions (once `profiles`/`organisations`/Auth exist)

- Add `staff`/`admin` SELECT/UPDATE policies keyed on `auth.uid()` joined to `profiles.role`, e.g.:
  `USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')))` on
  `enquiries`, `tenders` (all statuses), `training_registrations`, `resources` (unpublished too),
  etc. — this replaces routing everything through the service role once real staff logins exist.
- `projects`, `project_documents`, `documents`: clients read only rows where
  `organisation_id = (SELECT organisation_id FROM profiles WHERE id = auth.uid())`. Admin/staff read
  all. No client update/delete on any of these — client portal is read + limited request-submission
  only.
- `audit_logs`: insert via trigger/service role only; SELECT restricted to `admin` role; never
  client-writable, never client-deletable (no delete policy at all, ever).

---

## 5. Auth Design

**Supabase Auth** (email/password to start; magic-link optional later) provides three roles via the
`profiles.role` column, checked server-side:

- **Admin** — full access, manages staff/content/all data.
- **Staff** — enquiry/tender/training/resource management, scoped by RLS as above; no user/role
  management.
- **Client** — Phase 3 only; portal access scoped to their own `organisation_id`.

**Explicit anti-pattern callout**: the prior incident (`docs/EXISTING_AUDIT_SUMMARY.md`) was a
hardcoded plaintext password in `AdminLogin.tsx`, gated by a `localStorage` flag with **no server
check at all** — any visitor could open devtools, set the flag, and see the admin dashboard, and the
password itself shipped in the public JS bundle. This design replaces that entirely:

- No credentials are ever hardcoded in application code or shipped in the JS bundle.
- Every session is a real Supabase Auth JWT, issued only after a verified login.
- **The JWT is verified server-side on every privileged request** — either by a Vercel serverless
  function calling `supabase.auth.getUser(token)` before doing anything, or by RLS itself when the
  browser talks to Supabase directly with the user's JWT (never the service role key). A client-side
  "am I logged in" flag is used only for UI state (show/hide a button); it is never the thing that
  gates data access. Data access is gated by RLS + server-side token verification, full stop.
- The service role key lives only in Vercel environment variables (server-side), never in any
  client-shipped bundle, never in a public repo file.

---

## 6. Storage Buckets

| Bucket | Access | Contents |
|---|---|---|
| `tender-documents` | **Public read** (tender docs are meant to be publicly downloadable once a tender is published), admin/staff write only | RFQ/RFP packs, tender specs |
| `resources` | **Public read** for published resources, admin/staff write only | Guides, checklists, compliance/company docs, training/safety/procurement materials |
| `training-materials` | **Private** — signed URLs only, issued server-side to confirmed registrants/staff | Course materials that shouldn't be freely public (e.g. assessment content) |
| `client-documents` | **Private, never public** — signed URLs only, scoped by RLS-equivalent check in the issuing function to the requesting client's `organisation_id` or staff/admin | Safety files, reports, certificates, compliance docs, project docs |
| `enquiry-uploads` (new, small) | **Private** | Docs a visitor attaches to an enquiry/quote request — not meant for public browsing even though the submitter isn't authenticated |

Rule: **any bucket holding client-identifying or compliance-sensitive documents is private by
default**, full stop — `client-documents`, `training-materials`, `enquiry-uploads`. Only genuinely
public marketing/tender/resource material goes in a public bucket, and even then, write access is
never public.

---

## 7. File Upload Validation (per bucket)

Enforced both client-side (UX) and **server-side in the upload-handling function** (authoritative —
client-side checks are convenience only, matching the auth principle above):

| Bucket | Allowed types | Max size |
|---|---|---|
| `tender-documents` | pdf, doc, docx, xls, xlsx | 25 MB/file |
| `resources` | pdf, doc, docx, xls, xlsx, ppt, pptx | 25 MB/file |
| `training-materials` | pdf, doc, docx, ppt, pptx | 25 MB/file |
| `client-documents` | pdf, doc, docx, xls, xlsx, jpg, png | 15 MB/file |
| `enquiry-uploads` | pdf, doc, docx, jpg, png | 10 MB/file |

Additional checks: reject by declared MIME type **and** verify file signature/magic bytes
server-side (don't trust the `Content-Type` header alone); reject executable extensions outright
regardless of declared type; virus scanning is a nice-to-have, not a Phase 1/2 blocker given no
executable uploads are permitted; filenames are sanitized/rewritten to a generated storage path
(never trust the original filename as a path component, to prevent path traversal).

---

## 8. Migration & Versioning Approach

- Use the **Supabase CLI** (`supabase migration new <name>`) to generate timestamped SQL migration
  files, committed to the repo under `supabase/migrations/`.
- Migrations are the only way schema changes happen — no ad hoc changes via the Supabase dashboard
  SQL editor on the real project; the dashboard is for read-only inspection/debugging.
- Local development uses `supabase start` (local Postgres in Docker) to apply and test migrations
  before pushing; `supabase db push` deploys to the hosted project.
- Migration files are named to match this doc's phasing, e.g.
  `0001_enquiries.sql`, `0002_tenders.sql`, ... `phase3_0001_profiles.sql`, so Phase 3 work is
  clearly separated and not accidentally applied early.
- `supabase gen types typescript` generates a `Database` type from the live schema, checked into
  `src/types/supabase.ts` (or similar) and regenerated on every migration — keeps the frontend's
  TypeScript types honest against the real schema instead of hand-maintained duplicates.
- RLS policies are defined in the same migration file as the table they apply to, not bolted on
  later — a table is never live without its policies committed alongside it.

---

## 9. Audit Logging Approach

`audit_logs` (Phase 3, §3) is the durable record, but the **principle applies from Phase 1**:

- Every privileged write (status change, publish/unpublish, document upload/download, admin login)
  goes through a serverless function or Postgres trigger — never a raw client-side write — so there
  is always a single choke point that can log the action.
- Phase 1/2 (no `audit_logs` table yet, low action volume): rely on Supabase's built-in Postgres
  logs and Vercel function logs for the enquiry/tender/training admin actions; this is acceptable
  short-term because there's no client-portal document access yet to make gapless auditing critical.
- Phase 3 (once document access and multi-role staff exist): every `document.download`,
  `document.view`, `enquiry.status_change`, `tender.publish/unpublish`, and role/permission change is
  written to `audit_logs` via a Postgres trigger on the relevant tables (guarantees logging happens
  even if a developer forgets to call a logging function manually) plus explicit application-level
  logging for actions with no single table write (e.g. "downloaded a signed URL").
- `audit_logs` is insert-only at the RLS level (§4) and readable only by `admin` — staff and clients
  never see the audit trail, including their own.

---

## 10. Phase 2 vs Phase 3 — concrete split

**Build now (Phase 2 — this is the "real backend" milestone):**
- All tables in §2.
- Public-facing insert-only forms wired to Supabase via Vercel serverless functions (replaces the
  currently-null `ENQUIRY_ENDPOINT`).
- Public read access to published tenders/resources/FAQs/blog posts, no auth required.
- A single trusted admin surface using the Supabase **service role key from server-side functions
  only** — not a client-side dashboard yet, or if a dashboard ships, it sits behind Supabase Auth
  with `admin`/`staff` roles from day one (do NOT ship a Phase-2 admin UI with any client-side-only
  gate, even temporarily — that is the exact anti-pattern already fixed once).
- Storage buckets: `tender-documents`, `resources`, `training-materials`, `client-documents` (bucket
  created and locked private even before Phase 3 client portal exists, so document infrastructure
  is ready but unused), `enquiry-uploads`.
- Notifications table + simple admin-side notification triggers (new enquiry, new tender interest,
  new training registration) — no email sending required yet beyond what's already planned for the
  enquiry form fix; in-app/admin notification rows are enough for v1.
- Minimal analytics: page views, CTA clicks, form submissions, downloads — can start as a lightweight
  `analytics_events` table (`id`, `event_type`, `path`, `metadata` jsonb, `created_at`) logged
  from serverless functions, no need for a full analytics platform in Phase 2.

**Defer to Phase 3 (do not build until there's a concrete client-portal need):**
- `profiles`, `organisations`, `contacts`, `projects`, `project_documents`, `documents`,
  `audit_logs` — the full client-portal + CRM-with-accounts layer.
- Supabase Auth login flows, role-based dashboard, client-side session UI.
- Per-organisation document access, invoices, training certificates delivered through the portal.
- Full audit log table and trigger-based logging (Phase 2 leans on platform logs instead).
- Any case-study/project public content — schema exists (`projects`) but stays empty; there is no
  confirmed client/project data to populate it with per the company profile's CONFIRM list, and
  populating it is a content task, not a backend task, whenever real data is confirmed.

This split keeps Phase 2 scoped to "make the site's forms and content actually work against a real,
secure backend" without building the client-auth surface (the highest-risk, highest-effort piece)
until there's an actual client to onboard to a portal.
