# Kamosa Platform — QA & Testing Strategy

Author: QA pass, full-platform planning phase. Written 2026-09-22.
Companion docs (do not duplicate): `docs/EXISTING_AUDIT_SUMMARY.md` (prior audit — "no tests
needed" verdict, scoped to the old static site), `docs/IMPLEMENTATION_PLAN.md` §14 (high-level
testing strategy this document expands into something runnable), `docs/DATABASE_ARCHITECTURE.md`
(schema/RLS/auth design this strategy tests against).

**Status: strategy only.** No test code, no CI config, no test framework has been added to the
repo as part of writing this document.

---

## 0. Why the old verdict changes now

The prior audit's "no automated tests needed" call was correct for what existed then: a fully
static SPA with content in typed TS files and one real function (`validateEnquiry`). There was no
server, no auth, no database, so there was nothing a bug could silently corrupt except the UI.

That calculus breaks the moment Phase 2 ships. The new surface has three properties that make
untested bugs materially worse than a broken static page:

1. **Real access control** (RLS, admin/staff/client roles) — a bug here doesn't render wrong, it
   leaks data. The prior admin-auth incident was exactly this class of bug, just at the
   client-side-flag layer instead of the database layer. Same failure mode, higher stakes once
   real client documents exist in Phase 3.
2. **Real state machines** (enquiry/tender/training status pipelines) — an invalid transition
   (e.g. `Closed` → `New`, or a training registration silently skipping `Confirmed`) corrupts
   business data that a human (the MD, alone, running this business) now depends on for follow-up.
   Nothing catches that but a test or a human staring at every record.
3. **Money-adjacent and lead-adjacent flows** — a silently-dropped enquiry, a tender document
   served to the wrong org, a broken file-upload validator that lets a `.exe` through — each has a
   real business or security consequence, not just a cosmetic one.

The team is still one person (plus maybe a few associates). This document is written for that
reality: it recommends targeted, high-leverage tests on the logic that can actually hurt the
business, and explicitly tells you what NOT to build, so effort doesn't get soaked up chasing
enterprise-grade coverage nobody asked for.

---

## 1. What actually needs automated tests now

### 1.1 RLS policies — the highest-leverage tests in this whole plan

RLS is the direct replacement for the mechanism that failed last time (a client-side flag). A
silently-wrong policy is invisible in normal use — the app still "works" from the browser's point
of view — and only shows up when someone probes it, which makes it exactly the kind of bug that
sits undetected until it's exploited or until a client notices their document isn't private.

**Recommended approach: `pgTAP` via the Supabase CLI, plus a thin authenticated-client
integration suite.**

- **pgTAP** (`supabase test db`) is Supabase's documented, first-class way to test RLS directly in
  SQL: you write test files under `supabase/tests/` that set a role/JWT claim (`set_config`,
  `SET LOCAL ROLE`) and assert `SELECT`/`INSERT`/`UPDATE`/`DELETE` succeed or fail as expected,
  run against the local Supabase stack (`supabase start` + `supabase test db`). This is the
  cheapest, fastest way to test policy logic — no app code involved, pure SQL/Postgres, runs in
  seconds.
- **Authenticated Supabase-JS client tests** (a small Vitest/Jest suite that spins up real
  `anon`/`authenticated` clients against the local Supabase stack, signs in as different
  role fixtures, and asserts query results) are worth adding on top of pgTAP for Phase 3 once
  `profiles`/`organisations` exist — they catch integration issues (a policy that's individually
  correct in pgTAP but wired to the wrong JWT claim from the app side) that pure SQL tests can't.
  Keep this suite small: one test file per table with cross-org access, not one per column.
- **What to actually test per table** (Phase 2, `anon` role, per §4 of the database doc):
  - Every insert-only public table (`enquiries`, `quote_requests`, `tender_interests`,
    `training_registrations`, `profile_downloads`) — confirm `anon` CAN insert, and CANNOT select,
    update, or delete, including their own just-inserted row.
  - Every published-content table (`tenders`, `training_courses`, `resources`, `faqs`,
    `blog_posts`) — confirm `anon` sees only `is_published`/`status`-filtered rows, never draft or
    unpublished ones, via a fixture that inserts one published and one unpublished row and asserts
    the unpublished one never appears in a query result.
  - `enquiry_notes`, `notifications` — confirm `anon` gets zero rows under any query, always.
- **Phase 3, once `profiles`/`organisations` exist** — this is the non-negotiable one:
  - A pgTAP test that creates two organisations, inserts a document under each, authenticates as
    a client of org A, and asserts a query for org B's document row returns **zero rows**, not an
    error and not the row. Repeat for `projects`, `project_documents`. This is the literal test
    that would catch "a leaked cross-tenant document" before it ships, and it should exist before
    the client portal's document view is considered done — not as a nice-to-have.
  - A test that a `staff` role cannot escalate to `admin`-only actions (e.g. cannot read
    `audit_logs`, cannot change another user's `role`).
  - A test that an unauthenticated request to any table gated behind `auth.uid()` gets zero rows,
    matching the Phase 2 anon-role tests above.

### 1.2 Status state machines (enquiries, tenders, training registrations)

Pure logic, cheap to unit test, and the class of bug ("a quote silently reopens after being
closed") that's otherwise only caught by a human noticing something looks wrong in the admin
dashboard days later.

- Write the **valid transition table** as data (e.g. a `const ENQUIRY_TRANSITIONS: Record<Status,
  Status[]>`), not as scattered `if` statements — this makes it both testable and reviewable in
  one place. Recommended transition sets per the schema:
  - Enquiries: `New → Contacted → Qualified → In Progress → Converted`, with `Closed` and `Spam`
    reachable from any non-terminal state, and nothing reachable from `Closed`/`Spam`/`Converted`.
  - Tenders: `Open → Closing Soon → Closed → Awarded`, plus `Archived` reachable from `Closed` or
    `Awarded` only (an `Open` tender shouldn't jump straight to `Archived`).
  - Training registrations: `Registered → Confirmed → Attended → Completed`, with `Cancelled`
    reachable from `Registered`/`Confirmed` only (not from `Attended`/`Completed` — you can't
    retroactively cancel someone who showed up).
- Unit test: every **valid** transition succeeds, every plausible **invalid** transition (skip a
  step, go backwards, transition from a terminal state) is rejected by the function/serverless
  handler before it reaches the database. This is pure function testing — no Supabase needed, fast,
  runs in the existing `tsc`/lint feedback loop.
- Where the transition function lives matters: put it in the serverless function (or a shared
  `src/lib/*.ts` module the function imports), never trust a status value posted directly from an
  admin UI without server-side revalidation — same "never trust the client" principle as auth.

### 1.3 File upload validation logic

The type/size/magic-byte rules in `docs/DATABASE_ARCHITECTURE.md` §7 are exactly the kind of
branchy, easy-to-get-subtly-wrong logic `validateEnquiry` already set the precedent for testing.

- Unit test the validator function directly (not via an actual HTTP upload) against fixtures per
  bucket: an allowed type at/under the size limit (accept), an allowed extension but disallowed
  magic bytes (e.g. a `.pdf`-named file that isn't actually a PDF — reject), an allowed type over
  the size limit (reject), a disguised executable (`.pdf.exe`, double extension — reject), a
  correctly-typed file with a path-traversal filename (`../../etc/passwd`) — confirm the filename
  gets sanitized/rewritten, never used as-is.
- One test per bucket's allowed-type list (`tender-documents`, `resources`, `training-materials`,
  `client-documents`, `enquiry-uploads`) — the lists differ (e.g. `client-documents` allows
  `jpg`/`png`, `enquiry-uploads` doesn't allow `xls`), so a shared validator parameterized by
  bucket needs a test per bucket config, not just one generic pass/fail test.

### 1.4 Serverless function business logic

Test the **logic**, not the HTTP transport — extract validation/business rules into plain
functions the handler calls, and unit test those directly; reserve slower integration tests (real
HTTP request to a locally-running function) for the small smoke-test list in §3.

- `/api/enquiry`: honeypot field triggers silent rejection (not a visible error — confirm the
  response still looks like success to a bot, per standard honeypot practice); rate limiting
  actually blocks a burst from the same IP/hash; a valid submission produces exactly one DB row
  and one outbound email call (mock the email provider, assert it was called with the right
  payload — don't actually send email in tests).
- Admin auth check middleware (whatever verifies the JWT before any `/api/admin/*` handler runs):
  test that a request with no token, an expired token, a malformed token, and a valid token for a
  non-admin role are all rejected (403/401), and only a valid admin/staff token proceeds. This is
  the single function that, if wrong, recreates the exact prior incident in a new form — treat it
  with the same weight as the RLS cross-org test in §1.1.
- Tender/training status-change endpoints: confirm they reject an invalid transition (per §1.2)
  even if called directly with a crafted request body, not just from the admin UI happy path.

---

## 2. What still doesn't need heavy investment

The team-size argument from the prior audit still holds — it just applies to a narrower slice of
the system now (the UI/presentation layer) instead of the whole app.

- **Full e2e browser test suites (Playwright/Cypress) covering every page and flow** — premature.
  A handful of targeted smoke tests (§3) covering the flows that touch money/leads/security is
  higher value per hour spent than a comprehensive suite that mostly re-tests React Router and
  Tailwind rendering, which breaks loudly and visibly if broken (a blank page is easy to notice on
  a small site with light traffic; a leaked cross-org document is not).
- **Visual regression testing** (Percy/Chromatic-style pixel-diffing) — not worth it for a small
  marketing/business site maintained by one person. Visual bugs are caught by eyeballing a preview
  deployment before merge (Vercel preview URLs already give you this for free); the cost of
  maintaining visual-diff baselines and triaging false positives (font rendering, animation
  timing) exceeds the value at this scale.
- **Cross-browser test matrices** — Kamosa's audience is B2B/procurement/mining-sector visitors on
  standard modern browsers; there's no evidence of a legacy-browser requirement anywhere in the
  company profile or implementation plan. Spot-check Safari/Firefox manually before major
  releases (§4) instead of automating a matrix nobody's asked for.
- **100% unit test coverage / coverage-percentage targets** — resist the urge to chase a coverage
  number. Test the branchy, consequence-bearing logic named in §1; skip trivial getters, pure
  presentational components, and static-data files. A coverage mandate for a one-person team is a
  process cost with no matching safety benefit here.
- **Load/performance testing** — not warranted at current or projected traffic. Revisit only if
  Vercel/Supabase usage metrics show the free/low tier genuinely straining (the cost risk already
  flagged in the implementation plan's Risks section is the earlier warning sign, not a load test).

---

## 3. Concrete CI smoke-test list (runs on every PR, once Phase 2 backend exists)

The prior audit recommended `tsc` + `eslint` on PR with no CI pipeline built yet. Once Phase 2
ships, extend that same single GitHub Actions workflow — don't stand up a second pipeline.

**Fast checks (run first, fail fast, seconds):**
1. `tsc --noEmit` — typecheck, already recommended, still first.
2. `eslint` — lint, already recommended, still second.
3. Unit tests: `validateEnquiry` + all new form validators (Phase 1, already in place by the time
   Phase 2 lands), status-transition functions (§1.2), file-upload validator (§1.3), admin-auth
   middleware logic (§1.4) — these are all plain-function tests, no live Supabase needed, fast.

**Slower checks (Phase 2+, require the local Supabase stack — `supabase start` in CI via the
official GitHub Action):**
4. `supabase test db` (pgTAP) — the RLS test suite from §1.1, run against a fresh local Postgres
   instance seeded with fixture data. This is the single most important CI gate in this whole
   list.
5. A short list of e2e smoke checks (Playwright, headless, against a locally-running dev server +
   local Supabase stack — NOT a full suite, just these):
   - **Enquiry form submits and appears in the DB** — fill and submit the real form, then query
     the local Supabase instance directly and assert exactly one new row with the right fields.
     This is the test that would have caught the original "`ENQUIRY_ENDPOINT` is `null`" bug
     immediately, automatically, on every PR — worth having permanently even after the fix ships,
     as a regression guard against it silently breaking again (e.g. an env var typo in a future
     deploy).
   - **Unauthenticated request to an admin endpoint is rejected** — direct HTTP call to
     `/api/admin/*` with no auth header, assert 401/403, not a 200 with data or a redirect to a
     client-side login page (the redirect-only failure mode is exactly the old bug).
   - **RLS blocks cross-org document read** — same scenario as the pgTAP test in §1.1, but run
     once through the actual app/API layer (not just raw SQL) to catch wiring bugs between the
     app's Supabase client config and the policy itself.
   - **A closed/archived tender's documents are not publicly downloadable** — confirms the
     `tender-documents` bucket policy tracks the tender's visibility, not just its existence.
6. **Secret-leak grep of the production build output** (see §5) — cheap, fast, non-negotiable.

Keep the e2e list at five items or fewer. If a sixth flow feels tempting to add, prefer converting
it into a pgTAP or unit test instead — e2e tests are the most expensive and flakiest tier, spend
that budget only on flows that genuinely require the full stack wired together to catch the bug.

---

## 4. Manual QA checklist per new feature area (pre-ship, solo/small-team pace)

Run through the relevant section below before flipping a feature's route live publicly (per the
implementation plan's own "don't expose a Phase 2 route until it has real content" guidance —
these checklists assume that's already true and focus on function/security/accessibility, not
content completeness).

**Tenders**
- [ ] Submitting tender interest/clarification as an anonymous visitor works and produces exactly
      one record (no duplicate submissions from a double-click).
- [ ] A closed/archived tender no longer appears in the public listing but its detail URL doesn't
      404 outright if previously indexed (check the SEO plan's noindex/410 guidance).
- [ ] Tender documents download correctly and only for tenders that should be publicly visible.
- [ ] Admin can change tender status and the change is reflected on the public listing within the
      expected refresh window.
- [ ] Keyboard-only pass: filter controls, "express interest" flow, document download links.

**Training**
- [ ] Registration works with and without a selected session (`session_id` null case, per schema).
- [ ] A full session (`capacity` reached) either blocks new registrations or clearly communicates
      waitlist status — don't silently accept past capacity if capacity is meant to be enforced.
- [ ] Cancelling a registration transitions status correctly and doesn't affect the session's
      capacity count incorrectly (a cancelled registration should free the seat).
- [ ] Course/session admin CRUD doesn't allow scheduling a session in the past without a warning.
- [ ] Keyboard-only + screen-reader spot check of the registration form (reuses `ContactForm.tsx`
      pattern — confirm the reuse actually happened, not a fresh unlabeled form).

**Resources**
- [ ] Only `is_published = true` resources appear publicly; unpublish a resource and confirm it
      disappears immediately, including from search.
- [ ] Download count increments correctly and doesn't allow trivial spam-inflation (rapid repeat
      downloads from one client shouldn't need to be prevented at launch, but check it isn't
      wildly gameable in an embarrassing way).
- [ ] File type icons/labels match actual file type (no PDF icon on a `.docx`).
- [ ] Search returns relevant results for a few real queries against real seeded content.

**Blog / Insights**
- [ ] A draft (`is_published = false`) post is never reachable by direct URL, not just hidden from
      the index listing.
- [ ] `Article` schema (SEO plan §3) matches visible content exactly — spot-check one post through
      Google's Rich Results Test.
- [ ] Reading-time estimate is plausible, not a hardcoded placeholder.
- [ ] Heading hierarchy inside post body starts at `h2`, never `h1` (per accessibility plan §4).

**FAQ**
- [ ] Accordion is keyboard-operable (`Tab` to reach, `Enter`/`Space` to toggle) and
      `aria-expanded` reflects real state — verify with a screen reader, not just visually.
- [ ] `FAQPage` schema mirrors the visible accordion content exactly (same requirement as blog's
      `Article` schema check above).
- [ ] Unpublished FAQ entries (`is_published = false`) never appear publicly.

**Admin dashboard**
- [ ] Every `/admin/*` route redirects an unauthenticated visitor to login server-side (not a
      client-side flash-of-content before redirecting) — this is the single most important manual
      check in this entire document, given the prior incident. Test by directly navigating to a
      deep admin URL in a fresh, logged-out browser session, not just clicking through the UI.
  - [ ] A `staff`-role login cannot reach admin-only surfaces (user management, settings) even by
      guessing/typing the URL directly.
  - [ ] Status-change actions (enquiry, tender, training) reject invalid transitions from the UI
      itself, not just from a crafted API call — confirm the UI's own state machine agrees with
      the server's.
  - [ ] Session expiry is handled gracefully (an expired JWT mid-session doesn't silently keep
      showing stale data as if still authenticated).

**Client portal (Phase 3, before any real client is onboarded)**
- [ ] Log in as two separate seeded test clients in two browser profiles simultaneously; confirm
      neither can see the other's documents/projects/messages under any navigation path,
      including directly-typed URLs with the other client's known record IDs.
- [ ] Signed URLs for private documents expire and aren't guessable/enumerable.
- [ ] A client account cannot escalate to staff/admin views via URL manipulation.
- [ ] Document upload respects the same validation as §1.3, enforced server-side, not just the
      upload widget's client-side filter.

---

## 5. Regression risk areas specific to this project

The prior admin-auth incident is the anchor case for this whole section: a hardcoded plaintext
password shipped in the public JS bundle, gated only by a client-side `localStorage` flag with no
server check. The check that would have caught it before deploy, and its forward-looking
equivalents for the new backend:

- **What would have caught the original incident:** a CI step that greps the production build
  output (`dist/` or `.vercel/output/`) for known secret-shaped patterns (hardcoded password
  strings, `localStorage.getItem('isAdmin')`-style client-only auth flags, anything matching a
  `password\s*=\s*['"]` literal) before deploy. This is cheap, fast, and should be added to the CI
  workflow in §3 as a permanent guard, not a one-time fix — regressions of exactly this shape
  (someone adds a "quick" client-side check for convenience during a future feature, intending to
  fix it later) are a realistic risk on a team this size and this is the automatable backstop.
- **The forward-looking equivalent for the new backend:** grep the same build output for the
  **Supabase service role key pattern** (`SUPABASE_SERVICE_ROLE_KEY` value, or the JWT-shaped
  string itself if it's ever accidentally interpolated into client code) — confirm it never
  appears in anything shipped to the browser. This is the single non-negotiable check for the new
  architecture: the entire RLS/auth model in `docs/DATABASE_ARCHITECTURE.md` assumes the service
  role key is server-only; a build that accidentally bundles it makes every RLS policy irrelevant
  in one step, because the service role bypasses RLS by design.
- **Other project-specific regression risks worth a standing check:**
  - **Env var scoping** (implementation plan §15): a preview deployment accidentally pointed at
    the production Supabase project. Add a CI/deploy-time check (or at minimum a documented manual
    check before each production deploy) that preview builds use the staging project's URL/keys,
    not production's.
  - **The `/services/:slug` silent-redirect bug pattern**: any new dynamic route (`/tenders/:slug`,
    `/training/:slug`, `/insights/:slug`) is at risk of repeating the same "unknown slug silently
    redirects instead of 404ing" mistake if built by copying the old pattern. Add one test per new
    dynamic route type confirming an unknown slug renders a real 404, not a silent redirect —
    small, cheap, directly named in the audit as a known repeat-risk.
  - **RLS policy drift from migration discipline**: the database doc (§8) mandates that RLS
    policies live in the same migration file as the table they apply to. A CI check that fails the
    build if a new/altered table's migration doesn't also touch `pg_policies` for that table (even
    a rough heuristic) would catch a table shipped with RLS enabled but zero policies — which
    defaults to fully locked, a safe failure — or worse, RLS never enabled at all, which is an open
    table. A simpler manual equivalent: the PR checklist item "does this migration enable RLS and
    add its policies in the same file?" enforced by habit if not by tooling.

---

## 6. Accessibility testing

`docs/SEO_ACCESSIBILITY_PLAN.md` already specifies the accessibility target (WCAG 2.2 AA) and a
long list of component-level requirements (focus-visible everywhere, form label/error patterns,
heading hierarchy, contrast flags on `gold`/`brand-600` combinations, keyboard patterns for the
industry selector/FAQ accordion/admin tables, reduced-motion handling, live-region/loading-state
requirements). This section adds the testing-specific angle: what to automate vs. what needs a
human.

**Automatable (add to CI, or at minimum run before each release):**
- **`axe-core`** (via `@axe-core/playwright` if the e2e smoke suite from §3 exists, or
  `jest-axe`/`vitest-axe` against rendered components) — run against every new page type at least
  once (one representative tender page, one training page, one FAQ page, one blog post, one admin
  screen) as part of the CI smoke list. `axe-core` reliably catches missing labels, missing
  `alt` text, invalid ARIA usage, and contrast failures against the *actual rendered* colors —
  directly automatable evidence for the contrast risks the accessibility plan already flagged by
  hand (§5 of that doc: white-on-gold, red-on-cream, muted-on-cream).
- **Lighthouse CI** (accessibility category) — cheap to add alongside `axe-core` in the same CI
  step, catches a slightly different/overlapping rule set and gives a trackable score over time.
- **Automated contrast checks** for the specific token combinations the accessibility plan already
  named as risky (`gold`/white, `brand-600`/`cream`, `muted`/`cream`) — a small script or test
  asserting the computed contrast ratio of each named pair against WCAG AA thresholds, so a future
  design-token change that reintroduces the risk fails CI instead of shipping unnoticed.
- **Structured data / visible content parity** (FAQ schema vs. accordion, Article schema vs. post
  content) — already flagged as an SEO+accessibility dual concern in the source plan; a script
  comparing the JSON-LD `mainEntity` list against the rendered accordion's question text per FAQ
  page would catch drift automatically.

**Needs a human (manual spot check, per new page type, not per page instance):**
- **Real keyboard-only pass** through each new interactive pattern named in the accessibility
  plan's §6 (industry selector, tender filters, FAQ accordion, admin data tables, any modal) —
  `axe-core` checks markup correctness, it does not confirm a roving-tabindex widget actually
  *feels* operable or that focus order is logical; that needs a person tabbing through it.
- **Screen reader spot check** (VoiceOver on macOS is sufficient — no need for a paid NVDA/JAWS
  license at this team size) on one representative page per new page type per phase: does the form
  error-focus behavior actually announce correctly, does the loading-state live region actually
  speak, does the toast/notice pattern read sensibly instead of announcing nothing or announcing
  twice. Do this once per page *type* (tender detail, training detail, FAQ, blog post, admin
  table, portal document view), not once per individual record — the pattern is what's being
  tested, not the content.
- **Reduced-motion spot check**: toggle `prefers-reduced-motion` in OS settings and click through
  the new page type once, confirming animations genuinely stop rather than just slow down.
- **Zoom/reflow check** at 200% browser zoom on any new dense layout (admin tables, portal
  document lists) — automatable in theory but cheap enough to just eyeball manually before each
  release given the low page count.

Calibration note: run the automated axe/Lighthouse pass on every PR that touches a new page type
(cheap, catches most regressions); reserve the manual keyboard/screen-reader pass for **once per
new page type at first ship**, plus a periodic re-check (e.g. before each phase's public launch),
not on every PR — that's the proportionate line for a team this size.
