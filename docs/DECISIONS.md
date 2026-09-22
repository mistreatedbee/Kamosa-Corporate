# Decisions (authoritative — resolves conflicts between the 9 planning docs)

The 9 planning documents were written by parallel agents working from a shared brief but without
seeing each other's output. Two real conflicts surfaced on reconciliation, plus this doc sets the
authority order for future conflicts. **Where any other doc disagrees with this one, this one wins.**
Everything else in `docs/` remains a valid reference for its own domain (schema detail, design
tokens, copy, etc.) — this file only pins the decisions that were actually contested or ambiguous.

## Authority order for future conflicts
1. `DECISIONS.md` (this file) — wins on anything it explicitly addresses
2. `IMPLEMENTATION_PLAN.md` — source of truth for scope/phase/roadmap questions
3. `DATABASE_ARCHITECTURE.md` — source of truth for schema/RLS/storage questions
4. `SECURITY_ARCHITECTURE.md` — non-negotiable on anything it flags critical/high; overrides
   convenience calls made elsewhere
5. `DESIGN_SYSTEM.md` / `FRONTEND_ARCHITECTURE.md` — source of truth for implementation patterns
6. `CONTENT_MAPPING.md` / `CONVERSION_STRATEGY.md` / `SEO_ACCESSIBILITY_PLAN.md` /
   `QA_TESTING_STRATEGY.md` — authoritative within their own domain, don't override scope/security

## Decision 1: Phase 1 writes enquiries to Postgres, not just email

`IMPLEMENTATION_PLAN.md` originally scoped Phase 1 as needing "almost none of Supabase — just the
enquiry email function." `DATABASE_ARCHITECTURE.md` scoped `enquiries`/`enquiry_attachments` as
Phase 1/2 tables with a real backing store.

**Ruling: Phase 1 writes to Postgres.** An email-only enquiry is a lead that exists nowhere but an
inbox — if it's missed, filtered as spam, or the inbox changes, it's gone with no record. A durable
`enquiries` row is cheap to add now and is the actual foundation Phase 2's enquiry-management UI
needs anyway — building email-only now and migrating to a DB later is strictly more work than
building it right once.

**Consequence: the three security non-negotiables below ship in the SAME commit that first touches
Supabase, not deferred to "later Phase 2 hardening."**

## Decision 2: Environmental service route

`IMPLEMENTATION_PLAN.md`'s sitemap calls for `/services/environmental` as one of five individual
service pages, but the existing live site has this page at the top-level route
`/environmental-management` (see `src/App.tsx`).

**Ruling: `/services/environmental` is the canonical route**, consistent with the other four
service pages (`/services/health-safety-compliance`, `/services/business-consulting`,
`/services/procurement-supply`, `/services/training`) all living under `/services/`. The old
`/environmental-management` path gets a redirect (not a hard removal) to avoid breaking any
existing external link/bookmark/search result pointing at it.

## Decision 3: Non-negotiable Phase 1 security requirements

Carried forward from `SECURITY_ARCHITECTURE.md` and `QA_TESTING_STRATEGY.md`, binding from the
first commit that touches Supabase (i.e. Phase 1's enquiry backend), not deferred to Phase 2:

1. **`enquiries` table RLS: insert-only for the public role, no public SELECT.** Anyone can submit
   an enquiry; nobody but the service role (used only server-side) can read them back.
2. **The Supabase service-role key never appears in any client-reachable path.** It is read only
   inside Vercel serverless functions (`/api/*`), never in anything under `src/` that gets bundled
   by Vite, and never passed as a `VITE_`-prefixed env var.
3. **CI includes a build-output grep for the service-role-key pattern** (`sb_secret_` prefix and
   the legacy JWT `service_role` claim) to confirm it never reaches `dist/`. This is the direct
   forward-looking equivalent of the original hardcoded-admin-password incident and is treated as
   a release blocker, not a nice-to-have.

## Decision 4: Phase 2/3 security findings are carried forward, not blocking, with named scope

Per the CTO's ruling: `SECURITY_ARCHITECTURE.md`'s two critical findings (1.1 — unauthenticated
`/api/admin/*` surface once Phase 2 admin endpoints exist; 5.3 — a future Phase 3 `profiles` update
policy must exclude `organisation_id`/`role` from client-writable columns) do not block Phase 1,
which has no admin endpoints and no `profiles` table yet. They are recorded here as **hard
requirements to be implemented at the moment each relevant feature is built**, not optional
hardening to revisit later:

- Before any `/api/admin/*` endpoint ships (Phase 2): a shared-secret `ADMIN_API_KEY` header,
  checked server-side with constant-time comparison, before the service-role client is
  instantiated. Temporary by design, retired once real Supabase Auth ships in Phase 3.
- Before any Phase 3 `profiles` table gets a client-facing update policy: `organisation_id` and
  `role` must be excluded from the writable column set, enforced at the RLS/policy level, not just
  in application code.
