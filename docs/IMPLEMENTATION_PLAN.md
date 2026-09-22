# Kamosa Platform — Implementation Plan

Author: Product Architect / Business Analyst pass. Written 2026-09-22.
Companion docs (written in parallel, do not duplicate): `docs/DESIGN_SYSTEM.md`, `docs/DATABASE_ARCHITECTURE.md`.
Source of truth for all business facts: `docs/KAMOSA_COMPANY_PROFILE.md`. Prior codebase findings: `docs/EXISTING_AUDIT_SUMMARY.md`.

This is a **planning document only**. No code, no infrastructure, no Supabase project was created as part of producing it.

---

## 1. Executive Summary

Kamosa's site today is a well-built, ~85%-complete static brochure SPA (React 18 + Vite + TypeScript + Tailwind, no backend, no database, deployed on Vercel). The site owner has decided — against the prior CTO recommendation on record in `EXISTING_AUDIT_SUMMARY.md` — to expand it into a six-part platform: corporate site, lead-gen, tender/procurement hub, training platform, resource centre, and a client portal foundation with an AI assistant. That decision stands; this plan does not re-litigate it, but it is built to be honest about cost and sequencing risk so the owner can phase spend rather than buy the whole thing at once.

The recommended path is incremental, not a rewrite. The existing React/Vite frontend, component library, and `src/data/*.ts` content pattern are kept and extended. Backend capability is added via Vercel serverless functions plus Supabase (Postgres + Auth + Storage), introduced only when a phase actually needs it — Phase 1 needs almost none of it (just the enquiry email function already scoped in the audit), Phase 2 needs the database and admin surface, Phase 3 needs real auth and the AI assistant.

The single biggest structural risk carried through every section below: this is a one-person business taking on the maintenance profile of a multi-tenant SaaS platform (auth, RLS, file uploads, an AI assistant that must never hallucinate credentials). The plan's job is to make that cost visible and sequenced, not to hide it.

---

## 2. Current Project Audit (condensed from EXISTING_AUDIT_SUMMARY.md)

**Stack:** React 18.3, Vite 5.2, TypeScript, Tailwind 3.4, react-router-dom 6.26, framer-motion, lucide-react. Fully static SPA on Vercel, no backend, no DB. Content lives in flat typed files under `src/data/*.ts`.

**Already fixed, do not re-flag:** hardcoded admin password removed entirely (`/admin` deleted, 404s correctly); unused React imports cleaned up; stray `src/package.json` removed; duplicate H1/H2 on Leadership/Experience fixed; `focus-visible` outline added to `Button.tsx`.

**Confirmed still open:**
- **Enquiry form has no backend** — `ContactForm.tsx` + `src/utils/enquiry.ts` are fully built client-side but `ENQUIRY_ENDPOINT` is hardcoded `null`. This is the site's only lead-gen mechanism today and it silently does nothing. Highest-priority fix, scoped in the audit as one Vercel function (`/api/enquiry`) + Resend/SendGrid + honeypot + rate limiting.
- `brand-600` red is the confirmed correct primary brand color (logo has a red "KM" monogram, green is only an accent) — settled, do not revisit.
- `/services/:slug` silently redirects to `/services` on unknown slug instead of a proper 404.
- No CI pipeline (only Vercel build check); a minimal `tsc` + `eslint` GitHub Actions workflow was recommended, not yet added.
- No automated tests — reasonable for a static site at the time; `validateEnquiry` in `src/utils/enquiry.ts` was flagged as the one function worth unit testing if coverage starts anywhere.
- Two harmless React Router v6→v7 future-flag console warnings.
- No security headers (CSP/X-Frame-Options) configured — was low-urgency for a static site, **no longer low-urgency once a backend/auth exists**.
- Leadership portrait placeholder is intentional (photo not yet supplied) — correct as-is.

**Current routes** (from `src/App.tsx`): `/`, `/about`, `/services`, `/services/:slug`, `/experience`, `/leadership`, `/contact`, `/environmental-management`, `/privacy`, `/terms`, `*` (404). `package.json` has zero backend/DB dependencies today — no Supabase client, no server framework.

**CTO synthesis on record:** originally recommended against CMS/admin/database/portal work for a business this size, calling it "buying maintenance, not capability." Owner has explicitly chosen to proceed anyway — superseded for scope, but the underlying engineering principle carries forward: build real security and real data models for whatever ships, never client-side-only patterns like the one that caused the original admin auth hole.

---

## 3. Recommended Architecture

**Keep:** React 18 + Vite + TypeScript + Tailwind frontend, react-router-dom, the existing component library under `src/components/`.

**Add:**
- **Vercel Serverless Functions** (`/api/*`) for all server-side logic — enquiry submission, quote requests, tender admin CRUD, training registration, resource downloads, AI assistant proxy. Same platform the site already deploys to, no new hosting relationship, scales to zero cost at low traffic.
- **Supabase** (Postgres + Auth + Storage + Row Level Security) as the single backend-as-a-service for Phase 2/3:
  - **Postgres** for all structured data (enquiries, tenders, training, resources, CRM, users) — one relational store instead of several point solutions.
  - **Supabase Auth** for Phase 3 role-based login (Admin/Staff/Client) — avoids hand-rolling auth again, which is exactly the failure class that caused the original admin hole.
  - **Storage** for tender documents, training certificates, resource downloads, uploaded PPE/compliance documents — with RLS-backed bucket policies rather than public URLs for anything sensitive.
  - **RLS** as the actual security boundary (not client-side checks) for every table a Client or Staff role can touch.

**Why this pairing over alternatives:** it avoids running/managing a separate database server, gives auth + storage + Postgres + RLS as one coherent, well-documented product (important for a one-person business with no dedicated ops capacity), and keeps the whole stack on two platforms (Vercel + Supabase) with generous free tiers appropriate to current traffic. A custom Node/Express backend or a headless CMS would each add an extra service to operate for no capability Supabase doesn't already cover.

Full schema is out of scope here — see `docs/DATABASE_ARCHITECTURE.md`.

---

## 4. Sitemap (full URL tree, all phases)

```
/                                   (Phase 1 — exists)
/about                              (Phase 1 — exists)
/services                           (Phase 1 — exists)
/services/health-safety-compliance  (Phase 1 — exists as slug, verify content)
/services/business-consulting       (Phase 1 — exists as slug, verify content)
/services/procurement-supply        (Phase 1 — exists as slug, verify content)
/services/training                  (Phase 1 — exists as slug, verify content)
/services/environmental             (Phase 1 — currently /environmental-management, reconcile)
/industries                         (Phase 1 — NEW, interactive selector)
/experience                         (Phase 1 — exists)
/leadership                         (Phase 1 — exists)
/credentials                        (Phase 1 — NEW, verification UI)
/contact                            (Phase 1 — exists)
/request-a-quote                    (Phase 1 — NEW)
/request-service                    (Phase 1 — NEW)
/privacy                            (Phase 1 — exists)
/terms                              (Phase 1 — exists)

/tenders                            (Phase 2 — NEW, listing + filters)
/tenders/:slug                      (Phase 2 — NEW, detail + documents)
/training                           (Phase 2 — NEW, catalogue)
/training/:slug                     (Phase 2 — NEW, course detail + registration)
/resources                          (Phase 2 — NEW, categorised downloads + search)
/insights                           (Phase 2 — NEW, blog/insights index)
/insights/:slug                     (Phase 2 — NEW, article)
/faq                                (Phase 2 — NEW, categorised + searchable)
/case-studies                       (Phase 2 — NEW, schema ready, EMPTY until real projects confirmed)
/case-studies/:slug                 (Phase 2 — NEW, only populated with confirmed data)
/admin                              (Phase 2 — NEW, real server-checked auth)
/admin/content                      (Phase 2)
/admin/business                     (Phase 2 — enquiries, quotes, CRM)
/admin/documents                    (Phase 2 — tender/resource docs)
/admin/users                        (Phase 2)
/admin/settings                     (Phase 2)

/portal                             (Phase 3 — NEW, client/staff login)
/portal/documents                   (Phase 3)
/portal/projects                    (Phase 3)
/portal/training                    (Phase 3 — certificates)
/portal/messages                    (Phase 3)
/portal/ask-kamosa                  (Phase 3 — AI assistant, scoped to approved content only)
```

---

## 5. Feature Matrix

| Feature | Phase | Priority | Frontend | Backend | Database | Dependencies | Status |
|---|---|---|---|---|---|---|---|
| Enquiry form → real email delivery | 1 | Must | `ContactForm.tsx` (exists) | `/api/enquiry` (Vercel fn) | none (email only, or log to DB) | Resend/SendGrid account | Not Started |
| Industries interactive selector | 1 | Must | New `/industries` page + component | none | none (static data) | none | Not Started |
| Individual service pages (5) | 1 | Must | Extend `ServiceDetail.tsx`/`services.ts` | none | none | none | Not Started |
| Credentials page w/ verification UI | 1 | Must | New page | none | none | CSD/B-BBEE cert docs from client | Not Started |
| Company profile download (gated) | 1 | Must | Lead-capture form + download | `/api/profile-download` (Vercel fn) | enquiries table (or reuse) | Resend/SendGrid, PDF asset | Not Started |
| /request-a-quote | 1 | Must | New form page | `/api/quote` (Vercel fn) | quotes table (Phase 2 for full mgmt) | Resend/SendGrid | Not Started |
| /request-service | 1 | Should | New form page | `/api/enquiry` (reuse) | none | none | Not Started |
| WhatsApp CTA | 1 | Should | `wa.me` link component | none | none | confirmed WhatsApp number | Not Started |
| 404 for unknown service slug | 1 | Must | Fix `ServiceDetail.tsx` | none | none | none | Not Started |
| Security headers (CSP etc.) | 1 | Should | `vercel.json` config | none | none | none | Not Started |
| CI (tsc + eslint on PR) | 1 | Should | GitHub Actions workflow | none | none | none | Not Started |
| Enquiry management backend + statuses | 2 | Must | Admin business tab | `/api/admin/enquiries` | `enquiries` table | Supabase project, Auth | Not Started |
| Dynamic quote question sets | 2 | Should | Quote form per service | `/api/quote` extended | `quotes`, `quote_questions` | none | Not Started |
| Tender/Procurement portal | 2 | Must | `/tenders` pages + admin CRUD | `/api/tenders/*` | `tenders`, `tender_documents` | Supabase Storage | Not Started |
| Training platform + registration | 2 | Must | `/training` pages | `/api/training/*` | `courses`, `registrations` | Supabase, email | Not Started |
| Resource Centre | 2 | Should | `/resources` + search | `/api/resources` | `resources` | Supabase Storage | Not Started |
| Blog/Insights | 2 | Could | `/insights` pages | `/api/insights` (or static) | `posts` | none | Not Started |
| FAQ system | 2 | Should | `/faq` + search | `/api/faq` (or static) | `faq_items` | none | Not Started |
| Case-study showcase (schema, empty) | 2 | Could | `/case-studies` | `/api/case-studies` | `case_studies` | Real project data (none confirmed yet) | Not Started |
| Admin dashboard (content/business/docs/users/settings) | 2 | Must | New `/admin/*` app section | `/api/admin/*` | multiple | Supabase Auth, RLS | Not Started |
| Notifications | 2 | Should | Admin UI badges/emails | `/api/notifications` | `notifications` | email provider | Not Started |
| Analytics | 2 | Should | Dashboard widgets | Vercel Analytics or Supabase views | derived views | Vercel Analytics | Not Started |
| CRM foundation (leads/companies/contacts/interactions) | 2 | Should | Admin CRM views | `/api/crm/*` | `companies`, `contacts`, `interactions` | none | Not Started |
| Client portal + RBAC auth | 3 | Must | `/portal/*` | Supabase Auth + `/api/portal/*` | `users`, `roles` | Supabase Auth | Not Started |
| Secure document management | 3 | Must | Portal documents tab | `/api/portal/documents` | `documents` + RLS | Supabase Storage | Not Started |
| Project tracking | 3 | Should | Portal projects tab | `/api/portal/projects` | `projects` | none | Not Started |
| Training certificates | 3 | Should | Portal training tab | `/api/portal/certificates` | `certificates` | ties to Phase 2 `registrations` | Not Started |
| Messaging | 3 | Could | Portal messages tab | `/api/portal/messages` | `messages` | none | Not Started |
| "Ask Kamosa" AI assistant | 3 | Should | `/portal/ask-kamosa` widget | `/api/ai/ask` (RAG over approved content) | `content_sources` (approved corpus) | LLM API key, curated content corpus | Not Started |

---

## 6. User Roles

- **Admin** (Managing Director / business owner): full access to everything — content, business data (enquiries, quotes, CRM), documents, user management, settings, tender/training CRUD, portal oversight. Only role that can create/delete other users and change roles.
- **Staff** (future hires/associates, e.g. training facilitators, associate EAP): scoped access — can manage tenders/training/resources they're assigned to, view and respond to enquiries and quote requests, upload documents to their assigned projects, cannot manage users or global settings, cannot see other staff's private notes unless shared.
- **Client** (portal users — Kamosa's customers): can only see their own company's data — their documents, their project status, their training registrations/certificates, their messages with Kamosa. No visibility into other clients, no visibility into internal CRM notes, no admin surfaces. Read-mostly except for messaging and document upload to their own project space.

RBAC must be enforced at the database layer via Supabase RLS, not only in frontend route guards — this is the direct lesson from the removed admin-password hole in the current codebase.

---

## 7. Database Plan (high-level — full schema in `docs/DATABASE_ARCHITECTURE.md`)

Table names and purpose only; do not duplicate the schema doc's work here.

- `enquiries` — general contact form + request-service submissions, with status pipeline (New/Contacted/Qualified/In Progress/Converted/Closed/Spam).
- `quotes` — quote requests, per-service dynamic answers.
- `tenders` — tender/procurement listings, status (Open/Closing Soon/Closed/Awarded/Archived).
- `tender_documents` — files attached to a tender, Storage-backed.
- `courses` — training catalogue entries.
- `registrations` — training sign-ups, status (Registered/Confirmed/Attended/Completed/Cancelled).
- `certificates` — issued training certificates, links to `registrations` and portal users.
- `resources` — categorised downloadable documents for the Resource Centre.
- `posts` — Insights/blog articles.
- `faq_items` — FAQ entries, categorised.
- `case_studies` — schema for project showcases; intentionally left empty of any Kamosa content until real, confirmed project data exists (per company profile confirm-list items 7–10).
- `companies`, `contacts`, `interactions` — CRM foundation tying enquiries/quotes/tenders/training together per client organisation.
- `users`, `roles` — Supabase Auth-backed identity and Admin/Staff/Client role assignment.
- `documents` — portal document store (per-client, RLS-scoped).
- `projects` — portal project tracking.
- `messages` — portal messaging.
- `content_sources` — the approved content corpus the Phase 3 "Ask Kamosa" assistant is allowed to draw from (nothing else).
- `notifications` — internal admin/staff notification queue.

---

## 8. Security Plan

Grounded directly in the one confirmed real incident on this codebase: a hardcoded plaintext admin password shipping in the public JS bundle, gated only by a client-side `localStorage` flag with no server check.

- **No client-side-only auth, ever, anywhere.** Every authenticated surface (admin, portal) is enforced server-side via Supabase Auth sessions + RLS policies, not a frontend `if` check. Frontend route guards are a UX convenience, never the security boundary.
- **RLS on every table touched by Staff or Client roles.** Default-deny; explicit policies per role per table. Admin bypass only via a clearly scoped service role used solely in trusted server functions, never shipped to the client.
- **Secrets handling:** all API keys (Supabase service role key, Resend/SendGrid key, future AI provider key) live only in Vercel environment variables, scoped per environment (dev/preview/prod), never committed, never referenced from client-side code. The publishable Supabase anon key is the only Supabase credential allowed in the browser bundle.
- **Rate limiting** on all public-facing write endpoints (`/api/enquiry`, `/api/quote`, `/api/training/register`) to prevent spam/abuse — combine with the honeypot field already scoped for the enquiry form.
- **File upload validation:** type allowlist, size limits, and virus/malware scanning consideration for anything uploaded to Storage (tender documents from admin, client document uploads in the portal); never trust a client-supplied MIME type alone.
- **Security headers** (CSP, X-Frame-Options, Referrer-Policy) added starting Phase 1 — was deferred as low-urgency for the static site but becomes necessary the moment a backend/auth exists.
- **Least privilege by role**, matching Section 6 exactly — a Client account must be structurally incapable of reading another client's row, not just prevented by the UI from navigating there.
- **Audit logging** on admin actions (status changes, document access, user role changes) from Phase 2 onward, given this becomes a real multi-user system.

---

## 9. SEO Plan

- **Schema.org structured data per page type**, only for confirmed facts:
  - `Organization` schema (already present via `OrganizationSchema` component) — keep to confirmed fields only: registered name, registration number, CSD number, B-BBEE level, industries served. **Do not add `address`, `award`, `review`/`aggregateRating`, or specific credential/registration-number fields** — all explicitly unconfirmed per the company profile's confirm-list.
  - `Service` schema on each of the 5 service pages.
  - `Person` schema for Lovedonia Mmola on `/leadership` — name, jobTitle, affiliation only; no registration number, no membership grade, no photo claimed as a real portrait (placeholder stays a placeholder in markup, not tagged as an `image` of the person).
  - `JobPosting` schema only if/when a careers section is ever added (not in current scope).
  - `FAQPage` schema on `/faq` once real, non-invented FAQ content exists.
  - `BreadcrumbList` on all deep pages (`/services/:slug`, `/tenders/:slug`, `/training/:slug`, `/insights/:slug`).
  - Explicitly excluded until confirmed: `AggregateRating`/`Review` (no testimonials exist — confirm-list item 9), `Award` (none exist — item 10), any `Organization.address` (no physical address confirmed — item 4).
- **Sitemap/robots strategy:** dynamically generated `sitemap.xml` covering all static + Phase 2 dynamic routes (tenders, training, resources, insights), regenerated on content change; `robots.txt` disallows `/admin/*` and `/portal/*` entirely.
- **Canonical URLs** on all paginated/filtered listing pages (tenders, resources, training) to avoid duplicate-content penalties from filter query strings.

---

## 10. Accessibility Plan

Target: **WCAG 2.2 AA**, sitewide, all phases.

Concretely, given `focus-visible` was just added to `Button.tsx`:
- Extend the same visible focus-outline treatment to every interactive element sitewide — links, form inputs, custom dropdowns/selectors (notably the new Industries selector), tabs in the admin dashboard and portal, modal close buttons. `Button.tsx`'s fix should become the pattern, not a one-off.
- **Forms** (enquiry, quote request, tender/training registration, portal forms): every input has a programmatically associated `<label>`, inline error messages tied via `aria-describedby`, error summary announced on submit failure, no color-only error indication (the audit already flagged `brand-600` red must not double as both CTA and error color — errors need their own distinct treatment).
- **Navigation:** skip-to-content link (main landmark already exists via `id="main"` in `App.tsx` — verify a skip link targets it), logical heading hierarchy per page (H1/H2 duplication was already fixed on Leadership/Experience — hold that standard on every new page), keyboard-operable mobile menu and the new Industries selector (must not be a hover-only or mouse-only interaction).
- **Dynamic/portal UI:** any modal, toast, or live-updating admin/portal panel gets proper `aria-live` regions and focus trapping/return.
- **Color contrast:** verify 4.5:1 minimum for body text and 3:1 for large text/UI components against the confirmed red/white/dark palette, particularly on new admin/portal surfaces that will use denser data tables.
- **File downloads** (resources, tender documents, company profile): link text describes the file (name, type, size), not "click here."

---

## 11. Design System

Source of truth: `docs/DESIGN_SYSTEM.md` (written in parallel by a separate agent). This plan does not duplicate tokens, components, or visual spec — implementation should read that doc directly for colors, spacing, typography, and component variants, and treat the confirmed `brand-600` red decision from the audit as binding.

---

## 12. Component Architecture

No full rewrite. Build outward from what exists:

- **Reuse as-is:** `Button.tsx`, `Container.tsx`, `PageHeader.tsx`, `SectionHeader.tsx`, `Reveal.tsx`, `Navbar.tsx`/`MobileMenu.tsx`, `Footer.tsx`, `Seo.tsx` (extend with new schema types per Section 9), `Credentials.tsx` (extend for the new `/credentials` verification UI).
- **Extend the `src/data/*.ts` pattern for Phase 1 only.** Phase 1 content (services, industries, experience, leadership) has no dynamic/user-generated component and can stay in typed static files — this matches the existing pattern and needs no backend.
- **Phase 2 onward, introduce a data-fetching layer that replaces static files where content becomes DB-backed** (tenders, training, resources, insights, FAQ, CRM). Recommend a thin typed API client (e.g. `src/lib/api/*.ts`) mirroring the shape of today's `src/data/*.ts` exports, so existing components consuming that data shape need minimal changes — components like `ServiceCard.tsx`/`ServicesGrid.tsx` become the template for `TenderCard`/`CourseCard`/`ResourceCard`, not rewrites from scratch.
- **New top-level directories:** `src/pages/admin/*`, `src/pages/portal/*`, `src/components/admin/*`, `src/components/portal/*` — kept structurally separate from the public site's components so RBAC-gated code is easy to audit in isolation.
- **Forms:** generalize `ContactForm.tsx`'s existing validation/submit-state pattern (`sent`/`error` state handling, per the audit) into a shared form hook, reused by quote request, tender enquiry, training registration, and portal forms, rather than four bespoke implementations.

---

## 13. Development Roadmap

Sequencing is driven by what unblocks what, not just phase order:

1. **Fix the standing Phase 0 issue first:** wire `/api/enquiry` (Vercel fn + Resend/SendGrid + honeypot + rate limit) so the existing lead-gen form actually works. This is infrastructure every later phase's "request a quote"/"request service"/tender-enquiry flows will reuse.
2. **Phase 1 build-out** (content pages, Industries selector, Credentials page, gated profile download, request-a-quote/request-service, WhatsApp CTA, 404 fix, security headers, CI) — no Supabase needed yet; the gated download and quote form can reuse the Phase 0 email function.
3. **Stand up Supabase** (schema per `DATABASE_ARCHITECTURE.md`, RLS policies, Auth config) — this unblocks everything in Phase 2 and is a hard prerequisite, not parallelizable with Phase 2 feature work.
4. **Phase 2 core business data:** enquiry management backend + CRM foundation first (highest business value, and the schema/RLS patterns here get reused by every other Phase 2 feature) → then tenders → then training → then resources/insights/FAQ (lower dependency, can be built in any order once the DB/auth pattern exists) → then the admin dashboard wrapping all of it.
5. **Phase 3 requires Phase 2's Auth and RLS patterns to already be proven in production** before extending them to external Client logins — do not start portal auth until at least one Phase 2 admin-authenticated surface has been live and stable.
6. **"Ask Kamosa" AI assistant is last**, deliberately — it depends on a curated `content_sources` corpus that itself depends on Phase 1/2 content existing and being finalized, and it carries its own scoped risk (Section 16).

---

## 14. Testing Strategy

Proportionate — the audit correctly judged no automated tests necessary for the current static brochure site, and that judgment doesn't change for Phase 1 (still mostly static, low branching logic beyond `validateEnquiry`, which was already flagged as the one function worth a unit test).

That changes materially in Phase 2/3, where real server-side logic and access control exist for the first time:
- **Phase 1:** unit test `validateEnquiry` (already flagged) and any new form validation (quote request, request-service). No e2e infra yet — premature for the traffic/complexity level.
- **Phase 2:** real test coverage becomes necessary, not optional, for: enquiry/quote status transitions, RLS policies (test that a Staff/Client role genuinely cannot read another org's row — this is the exact class of bug that caused the original admin hole, just at the database layer instead of the frontend), tender/training status logic, file upload validation (type/size rejection).
- **Phase 3:** auth flows (login, role assignment, session handling) and the AI assistant's escalation behavior (must reliably hand off to a real enquiry when it doesn't know an answer, must never fabricate a service/certification) need explicit test cases — this is the highest-risk surface in the whole plan and the one place where "proportionate" still means "thorough."
- Recommend deferring heavy e2e browser test infrastructure (Playwright/Cypress) until Phase 2 admin surfaces exist to actually exercise; integration tests against the Vercel functions + Supabase (using Supabase's local dev stack) are higher-value earlier than full e2e.

---

## 15. Deployment Strategy

- **Vercel** remains the single deployment target for the frontend and all serverless functions — no new hosting relationship required.
- **Environment separation:** `development` (local, Supabase local stack or a dev project), `preview` (Vercel preview deployments per PR, pointed at a Supabase staging project/branch), `production` (main branch, production Supabase project). Never point a preview deployment at the production database.
- **Secrets:** all keys (Supabase service role key, anon key, Resend/SendGrid key, future AI provider key) set as Vercel environment variables scoped per environment, never committed to the repo. Rotate the service role key if it is ever exposed to a preview/public deployment by mistake.
- **Migrations:** Supabase schema changes tracked as versioned migration files in-repo (per `DATABASE_ARCHITECTURE.md`'s convention), applied to staging before production, never edited directly against the live database console for anything beyond emergency fixes.
- **Rollback:** rely on Vercel's instant rollback to a previous deployment for frontend/function issues; database migrations need their own forward-fix or down-migration discipline since Vercel rollback doesn't undo a schema change.

---

## 16. Risks

Honest, given this is a one-person business taking on a materially larger surface:

- **Cost:** Supabase and Vercel both have usable free tiers today, but Storage (tender documents, training certificates, resource files, portal documents) and Auth (per-user pricing beyond free tier limits) are the two line items most likely to start costing real money as Phase 2/3 data volume grows — budget for this before Phase 3, not after an invoice arrives.
- **Maintenance burden:** every new feature in Phases 2/3 is now something a single owner (or very small team) must patch, monitor, and keep dependencies current on indefinitely. A static brochure site needed none of that. This is the same concern the original CTO synthesis raised and it remains true regardless of the scope decision.
- **Security surface:** auth, RLS, file uploads, and an AI assistant are all new attack surface that did not exist on the static site. The one confirmed prior incident (hardcoded admin password) happened on far simpler surface area than what's being proposed now — Phase 2/3 needs deliberate security discipline (Section 8), not best-effort.
- **Unfinished-feature risk:** the brief is large enough that partially-shipped features (a tender portal with no tenders in it, a training catalogue with no courses, a case-study page that's intentionally empty per the confirm-list) risk making the site look abandoned or hollow rather than professional if Phase 2/3 stalls partway. Recommend not exposing a Phase 2 route publicly until it has real content, not just working code.
- **AI assistant risk specifically:** an assistant that invents a certification, a service Kamosa doesn't offer, or a registration number that isn't confirmed would directly contradict the company profile's confirm-list and create a compliance/reputation problem worse than not having the feature. This is why it is sequenced last and scoped to answer only from an approved content corpus with mandatory escalation on uncertainty.
- **Data-entry burden:** Phase 2 features (tenders, training, resources) only have value if someone keeps them populated and current. That's an ongoing operational commitment on top of the engineering one.

---

## 17. Missing Information

Pulled directly from the company profile's confirm-list (never to be presented as fact until resolved), plus additional items needed for this specific build that aren't in the profile:

**From the company profile confirm-list:**
1. SARS Tax Compliance Status (TCS) PIN — flagged outstanding at time of writing; must be confirmed active before the site states TCS as current.
2. SACPCMP registration number — not confirmed, do not publish.
3. SAIOSH membership grade (Member/Graduate/Technical Member) — not confirmed.
4. Physical/postal address — not confirmed; some tender processes require one, flagged as an open item.
5. Any procurement product categories beyond PPE, construction tools/consumables, safety signage.
6. Any trade/distributor account relationships.
7. Any named client organisations beyond the sector-level Eskom plant names (Medupi/Lethabo/Matla).
8. Specific project values, contract durations, or dates beyond what's stated in the profile.
9. Client testimonials/customer reviews — none exist, must not be invented for Phase 2 case studies.
10. Awards, statistics, or case-study numeric outcomes — none exist.
11. Government/mining contract specifics beyond general sector descriptions.
12. Client/partner logos — none supplied.
13. A professional portrait of Lovedonia Mmola — not supplied, placeholder in use.

**Additional items needed for this build, not covered by the company profile:**
14. Does Kamosa have (or is willing to set up) a **Supabase project**? On what plan?
15. Does Kamosa have a **Resend or SendGrid account**, or another transactional email provider preference? Needed for the already-scoped `/api/enquiry` fix and every Phase 2/3 notification.
16. Is there a **domain** (e.g. a subdomain of kamosa.co.za or a dedicated sending domain) available/authorized for transactional email sending, to avoid deliverability issues sending "from" a domain not configured for it?
17. Confirmed **WhatsApp Business number** for the WhatsApp CTA (the profile lists a landline-style number, 071 191 4744 — confirm this is WhatsApp-enabled before wiring a `wa.me` link to it).
18. Who are the intended first **Staff** users, if any — does Kamosa currently have any employees/associates beyond the associate Environmental Assessment Practitioner, or is Staff role scoping premature for Phase 3?
19. Who are the intended first **Client portal** users — is there an actual client relationship ready to pilot the portal, or is this being built speculatively ahead of demand?
20. Budget ceiling/expectation for ongoing Supabase + Vercel + email-provider costs, to right-size which Phase 2/3 features are worth building first.
21. Any existing brand assets beyond `public/logo.jpg` (e.g. vector logo, brand guideline doc) relevant to `docs/DESIGN_SYSTEM.md`.
22. Preferred AI provider/model for "Ask Kamosa" (Phase 3) and whether Kamosa is comfortable with the associated per-query cost and the data-handling implications of sending enquiry content to a third-party LLM API.

---

## 18. Questions Requiring Kamosa Confirmation

Actionable list the owner needs to answer before Phase 2/3 can proceed (a subset of Section 17, framed as decisions):

1. Confirm current SARS TCS PIN status — is it active now? (Blocks stating tax compliance as current anywhere.)
2. Provide the SACPCMP registration number and SAIOSH membership grade, or confirm they should remain unpublished indefinitely.
3. Provide a physical/postal address, or confirm Kamosa will operate without publishing one (accepting that some tenders may require it separately, outside the website).
4. Approve or reject creating a Supabase project under Kamosa's name/billing — who owns that account?
5. Confirm a transactional email provider (Resend/SendGrid/other) and who holds that account.
6. Confirm the WhatsApp number to use for the CTA.
7. Confirm whether any Staff or Client users exist today to pilot Phase 3, or whether Phase 3 should be deprioritized until a real client/staff relationship exists.
8. Set a rough budget ceiling for monthly infrastructure spend (Supabase + email + any AI provider).
9. Confirm whether Kamosa wants case studies/testimonials pursued actively (asking real past clients for permission to be named) or left permanently empty per the current confirm-list.
10. Confirm appetite for the AI assistant given the added cost and the strict "never invent, always escalate" constraint — is this worth building in Phase 3, or should it be deferred further?

---

## 19. Recommended Phase 1 Scope

Ship first, concretely:

- Fix `/api/enquiry` so the existing contact form actually sends email (this alone unblocks the site's only working lead-gen mechanism today).
- Reconcile `/environmental-management` into the `/services/environmental` slug pattern for consistency with the other 4 service pages, or keep both with a redirect — decide once, don't leave both live inconsistently.
- Build the 5 individual service pages fully (health-safety-compliance, business-consulting, procurement-supply, training, environmental) using only confirmed content from the company profile.
- Build `/industries` with the interactive selector across the 7 confirmed sectors (Mining, Construction, Energy, Manufacturing, Transport, Government, Commercial).
- Build `/credentials` with a verification UI for the confirmed credentials only (Registered SA Company, Active CSD Supplier, Level 1 B-BBEE, 100% Black Female Owned) — render TCS status as "information to be confirmed," not verified.
- Build the gated company profile download (lead-capture form → tracked → PDF), reusing the Phase 0 email function.
- Build `/request-a-quote` and `/request-service`.
- Add the WhatsApp CTA (pending number confirmation, Section 18 item 6).
- Fix the `/services/:slug` unknown-slug 404 bug.
- Add basic security headers and a minimal CI workflow (tsc + eslint on PR) — both were already recommended in the prior audit and cost little to add now before backend complexity increases.

Explicitly NOT in Phase 1: anything requiring Supabase, any admin/portal surface, tenders/training/resources/insights/FAQ/case-studies, the AI assistant.

---

## 20. First Development Tasks

Ordered, to start Phase 1 implementation:

1. Set up Resend or SendGrid account (pending Section 18 item 5) and implement `/api/enquiry` as a Vercel serverless function; point `ENQUIRY_ENDPOINT` in `src/utils/enquiry.ts` at it; add honeypot field and basic rate limiting.
2. Fix `ServiceDetail.tsx` to render a proper "service not found" state instead of silently redirecting on an unknown slug.
3. Decide and implement the `/environmental-management` vs `/services/environmental` reconciliation.
4. Extend `src/data/services.ts` with full, confirmed content for all 5 individual service pages; verify each renders correctly through `ServiceDetail.tsx`.
5. Build `src/data/industries.ts` (if not already complete) and a new `Industries.tsx` page + interactive selector component under `src/components/`; add the `/industries` route to `App.tsx`.
6. Build `Credentials.tsx` into a full `/credentials` page (component already exists per the repo listing — extend it) with an explicit "information to be confirmed" state pattern for TCS status.
7. Build the gated profile-download flow: lead-capture form component (reuse the `ContactForm.tsx` validation pattern) → `/api/profile-download` function → email the PDF or provide a tracked download link, logging the lead.
8. Build `/request-a-quote` and `/request-service` pages reusing the shared form pattern.
9. Add the WhatsApp CTA component once the number is confirmed.
10. Add `vercel.json` security headers (CSP, X-Frame-Options, Referrer-Policy) and a `.github/workflows/ci.yml` running `tsc --noEmit` and `eslint` on PRs.
11. Add a unit test for `validateEnquiry` (and any new quote/request-service validation) as the first test in the repo.
