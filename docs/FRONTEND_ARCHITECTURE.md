# Kamosa Platform — Frontend Implementation Architecture

Author: Frontend Engineer pass. Written 2026-09-22.
Companion docs (do not duplicate): `docs/IMPLEMENTATION_PLAN.md` (sitemap, feature matrix, phasing),
`docs/DESIGN_SYSTEM.md` (tokens, component visual spec), `docs/DATABASE_ARCHITECTURE.md` (schema, RLS).

This document makes `IMPLEMENTATION_PLAN.md` §12 ("Component Architecture") concrete and buildable.
It is opinionated on purpose — where the plan offered options, this document picks one. No
production code; pseudocode/structure snippets only, to pin down a pattern.

Baseline confirmed by reading the repo directly: React 18.3 + Vite 5.2 + TypeScript + Tailwind
3.4, react-router-dom 6.26, framer-motion, lucide-react, @emotion/react. Zero data-fetching, zero
state-management, zero form libraries in `package.json` today. Content is static, typed TS under
`src/data/*.ts` (`services.ts`, `industries.ts`, `experience.ts`, `about.ts`…), typed via
`src/types/content.ts`. Components are plain functional components with Tailwind utility classes,
no CSS-in-JS beyond what @emotion/react happens to support. `App.tsx` is a flat `<Routes>` list, no
lazy loading, no layout nesting beyond a single Navbar/Footer shell wrapping everything.

---

## 1. Data Fetching: `@supabase/supabase-js` directly, no TanStack Query in Phase 2

**Decision: for Phase 2 public read surfaces (tenders, training, resources, insights, FAQ), call
`@supabase/supabase-js` directly from simple `useEffect`/`useState` hooks, one thin hook per
resource. Do not introduce TanStack Query yet.**

Why not TanStack Query yet, given it's the "obvious" answer for a Supabase frontend:

- Phase 2 public pages are **read-heavy, low-interaction, low-frequency**: a tenders list, a course
  catalogue, a resource library. They render once per navigation. There is no cache invalidation
  problem to solve (no optimistic updates, no shared cache across many components reading the same
  key, no background refetch/polling requirement) — which is the actual value TanStack Query adds.
  Reaching for it here is adding a dependency to solve a problem this phase doesn't have.
- The project's existing philosophy (evident from `package.json`: five runtime deps, all doing
  distinct jobs) is deliberately minimal. A raw `supabase-js` call in a `useEffect` is roughly the
  same amount of code as a `useQuery` call once you've written the one shared hook below — the
  library isn't buying much at this data volume.
- `supabase-js` already does the one thing that matters here (typed Postgrest queries against RLS-
  protected tables) without another abstraction layer on top translating its errors/loading states.

**Where TanStack Query earns its place: the Phase 2 admin dashboard.** Once `/admin/*` exists, you
genuinely have the problems TanStack Query solves — multiple views reading the same
`enquiries`/`tenders`/`registrations` data, mutations (status changes, CRUD) that need to
invalidate and refetch that shared data, and want for de-duped in-flight requests when an admin
flips between tabs quickly. **Add `@tanstack/react-query` at the same time the admin dashboard is
built, scoped to `src/pages/admin/**` and `src/components/admin/**` only** — the public site keeps
the plain-hook pattern. This is a deliberate two-tier approach, not an oversight: complexity is
introduced exactly where it's earned, not sitewide by default.

Phase 3 portal (`/portal/*`) reuses the admin-tier pattern (TanStack Query) for the same reason —
it's an authenticated, mutation-heavy, per-user-data surface.

**Shared read hook pattern for Phase 2 public pages** (illustrative, not implementation):

```ts
// src/lib/supabase/client.ts
export const supabase = createClient(url, anonKey); // anon key only, ever, client-side

// src/lib/supabase/useSupabaseQuery.ts — the ONE shared hook, not one per resource
function useSupabaseQuery<T>(queryFn: () => PromiseLike<{ data: T | null; error: PostgrestError | null }>, deps: unknown[]) {
  // returns { data, loading, error } — same three-state shape ContactForm.tsx
  // already established for submitting/result, so the pattern is familiar in this codebase
}

// src/lib/api/tenders.ts — mirrors src/data/services.ts's export shape on purpose (see §8)
export function useTenders(filters: TenderFilters) {
  return useSupabaseQuery(() => supabase.from('tenders').select('*').match(filters), [filters]);
}
```

Detail pages (`/tenders/:slug`) use the same hook with `.eq('slug', slug).single()`.

---

## 2. Routing

**`/services/:slug` is a Phase-1-only pattern; tenders/training/insights each get their own
sibling detail route, not a shared param.** They are not interchangeable: services are static,
five-item, never paginated or filtered; tenders/training/insights are DB-backed, paginated,
filterable, and (for tenders/training) have materially different detail-page shapes (documents +
closing date vs. curriculum + registration vs. article body). Reusing one generic
`/:collection/:slug` route would force a single `DetailPage` component to branch internally on
collection type — that's a worse abstraction than four small, honest route/page pairs. Each gets
its own top-level route + its own `:slug` detail route, following the *existing* `/services` +
`/services/:slug` pairing as the template, not as a literal shared route:

```
/tenders          -> Tenders.tsx        (list + filters)
/tenders/:slug     -> TenderDetail.tsx
/training          -> Training.tsx
/training/:slug     -> CourseDetail.tsx
/resources          -> Resources.tsx     (categorised, likely no detail route — direct download)
/insights            -> Insights.tsx
/insights/:slug      -> ArticleDetail.tsx
/faq                  -> Faq.tsx          (single page, categorised, no detail route)
```

**Code splitting: not needed at Phase 1 scope; introduce it when Phase 2 routes ship, not before.**
Phase 1 adds ~6 static content routes to an already-small bundle — framer-motion and lucide-react
are the heavy deps, already loaded eagerly today, and splitting six thin pages saves negligible
bytes at real cost (Suspense fallback UX work for no benefit). Phase 2 is different: tenders +
training + resources + insights + FAQ + a full admin dashboard section is a meaningfully larger
bundle, much of which (admin) the vast majority of visitors never touch. At that point:

```tsx
// src/App.tsx, from Phase 2 onward
const Tenders = lazy(() => import('./pages/Tenders'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout')); // whole admin tree, one chunk

<Suspense fallback={<PageLoadingSkeleton />}>
  <Routes>...</Routes>
</Suspense>
```

Split at the **route-group** level (public Phase-2 pages as one lazy boundary, `admin/*` as
another, `portal/*` as a third in Phase 3) rather than per-page — finer splitting multiplies
Suspense boundaries and waterfall requests for marginal gain on a site this size.

---

## 3. New Shared Components

Cross-referencing `DESIGN_SYSTEM.md` §9–12 (status badges, modals, tables, alerts/toasts) against
the "no heavy dependencies" philosophy evident in `package.json`:

| Component | Build vs. library | Reasoning |
|---|---|---|
| **StatusBadge** | Build thin, custom | Trivial: a `<span>` with a color-token lookup keyed by status string (design system already specifies the exact palette per status). A library is absurd overkill for this. |
| **EmptyState** | Build thin, custom | Icon + heading + body + optional CTA `Button`/`ButtonLink` reuse. No library need. |
| **LoadingSkeleton** | Build thin, custom | Pure CSS (`animate-pulse` + Tailwind gray blocks) shaped per context (card grid skeleton, table row skeleton, detail-page skeleton). No library warrants adding for this. |
| **SearchFilter** | Build thin, custom | Controlled `<input>` + `<select>`/checkbox group driving the `useSupabaseQuery` filter args from §1. Genuinely simple at this data volume (tens to low hundreds of rows, not virtualized-list scale). |
| **Pagination** | Build thin, custom | Standard prev/next + page-number component; ~40 lines, no library justified for offset/limit pagination against Postgrest's `.range()`. |
| **Modal** | Build thin, custom, using native `<dialog>` where practical | A hand-rolled modal needs focus trap + `Escape`-to-close + return-focus (accessibility plan §10 requires this explicitly). Rather than pull in a full library (Radix/Headless UI) for one component, use the native `<dialog>` element (built-in focus trap and `Esc` handling in modern browsers) styled to the design system's modal spec — a ~60-line wrapper, not a dependency. Reconsider only if Phase 2/3 ends up needing many more overlay primitives (popovers, comboboxes, dropdown menus) at once, at which point a headless primitives library (Radix) earns its keep across all of them together rather than one at a time. |
| **Toast/Alert** | Build thin, custom | The `Notice` component pattern already exists inline in `ContactForm.tsx` (success/error/info tones). Extract it to `src/components/Alert.tsx` as the inline-form-notice component, and build a small `src/components/Toast.tsx` + `useToast()` context provider for the corner-anchored transient admin notifications (`DESIGN_SYSTEM.md` §12). This is genuinely small (a context + a portal + a 3-second timer) and reuses the same tone/color tokens as `Alert` — not worth a library like `react-hot-toast` for one queue of short-lived, non-interactive notifications. |
| **DataTable** (admin) | Build thin, custom — **this is the one to watch** | A plain `<table>` + sortable header + row-action slot covers the admin lists in `DATABASE_ARCHITECTURE.md` (enquiries, tenders, registrations) at their expected row counts (tens to low hundreds, not tens of thousands). Do not add a table library (TanStack Table) at Phase 2. Revisit only if a specific admin table needs client-side virtualization, multi-column drag-reorder, or column-resize — none of which are in the Phase 2 feature matrix. |

General rule applied consistently: **every new component here is buildable in well under 100 lines
against existing design tokens; none crosses the threshold (complex state machines, drag-and-drop,
virtualization) where a library's maintenance cost is clearly repaid.** If a future phase needs
virtualized tables or a rich WYSIWYG editor (e.g. for `/admin/content` blog authoring), that is the
threshold to revisit this section — not before.

All new components live in `src/components/` (public-reusable: StatusBadge, Modal, Toast, Alert,
EmptyState, LoadingSkeleton) or `src/components/admin/` (DataTable, SearchFilter+Pagination when
used in an admin-dense context) per the directory split in §7.

---

## 4. Form Architecture: hand-rolled stays, through Phase 2; **react-hook-form is the right call once
dynamic per-service quote fields ship**

The existing pattern (`ContactForm.tsx` + `src/utils/enquiry.ts`'s `validateEnquiry`) is: local
`useState` for values/errors/submitting/result, a pure `validate(payload) -> errors` function, a
`submit(payload) -> Result` function, manual `aria-describedby`/`aria-invalid` wiring per field.
It's clean and it's the established house style.

**Decision: extract this into one shared hook (`useFormSubmission`) now, at Phase 1, generalizing
what `ContactForm.tsx` already does — but do not add `react-hook-form` yet.** Phase 1's new forms
(`/request-a-quote`, `/request-service`, gated profile download) are structurally identical to
`ContactForm.tsx` (fixed field set, flat validation) — extracting the state-machine part costs
little and removes duplication across three-to-four forms:

```ts
// src/hooks/useFormSubmission.ts
function useFormSubmission<TValues, TResult>(opts: {
  initial: TValues;
  validate: (v: TValues) => Partial<Record<keyof TValues, string>>;
  submit: (v: TValues) => Promise<TResult>;
}) {
  // returns { values, errors, submitting, result, update, handleSubmit } —
  // exactly the state ContactForm.tsx already manages inline, made reusable.
}
```

**The call to make now, not defer:** introduce `react-hook-form` **when the quote-request form's
dynamic per-service question set ships** (Phase 2, `DATABASE_ARCHITECTURE.md`'s `quote_questions`
table implies field sets that vary at runtime per selected service, fetched from the DB). That is
qualitatively different from the hand-rolled pattern's sweet spot: a fixed, known-at-compile-time
field list. Dynamic field arrays (add/remove repeating groups), conditional field visibility driven
by another field's value, and per-field async validation against DB-fetched question metadata are
exactly the class of problem hand-rolled `useState` handles badly (re-render churn, manual key
management for dynamic arrays, easy-to-miss validation-on-blur-vs-submit inconsistency). Waiting
for "5+ forms" as a blanket trigger is the wrong criterion — plain field-count doesn't create the
pain; **dynamic/conditional field logic does**, and the quote form is the first place that appears.

Once introduced, `react-hook-form` should be adopted for: quote request (dynamic fields),
training registration (per-course custom questions, if `DATABASE_ARCHITECTURE.md`'s courses schema
implies them), and admin content-editing forms (tender/course CRUD — many fields, need
dirty-tracking and reset-on-cancel, which `react-hook-form` gives for free). The simple, static
forms (`ContactForm.tsx` itself, tender-clarification-question submission, a basic
contact-style enquiry) stay on the `useFormSubmission` hand-rolled hook — there's no reason to
migrate working, simple forms just for consistency; consistency of *pattern* (validate → submit →
tri-state result) matters more than consistency of *library*.

---

## 5. Auth-Gated UI (Phase 3)

Direct application of the lesson stated explicitly in `IMPLEMENTATION_PLAN.md` §8 and
`DATABASE_ARCHITECTURE.md` §1: the prior incident was a client-side-only `localStorage` flag gating
`/admin`. **The frontend route guard in this architecture is UX only — it prevents a flash of
protected content and redirects unauthenticated users to `/login`; it is never the security
boundary. The security boundary is Supabase RLS, enforced server-side on every query, regardless of
what the frontend believes about the session.**

Concrete shape:

```tsx
// src/lib/auth/AuthProvider.tsx
// Wraps the app (or just the /admin and /portal subtrees) in a context that:
// - calls supabase.auth.getSession() on mount (reads the real, signed, httpOnly-cookie-backed
//   or Supabase-managed session token — never a hand-set localStorage boolean)
// - subscribes via supabase.auth.onAuthStateChange to keep the context current
// - exposes { session, user, role, loading }

// src/components/auth/ProtectedRoute.tsx
function ProtectedRoute({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { session, role, loading } = useAuth();
  if (loading) return <PageLoadingSkeleton />;
  if (!session || !allow.includes(role)) return <Navigate to="/login" replace />;
  return children; // <-- UX convenience only; RLS is what actually stops a bad request
}
```

```tsx
// src/App.tsx, Phase 3
<Route path="/admin/*" element={
  <ProtectedRoute allow={['admin', 'staff']}><AdminLayout /></ProtectedRoute>
} />
<Route path="/portal/*" element={
  <ProtectedRoute allow={['client', 'staff', 'admin']}><PortalLayout /></ProtectedRoute>
} />
```

The critical point this diagram is trying to make visible: **every `supabase.from('documents')...`
call the portal makes is scoped by an RLS policy keyed to `auth.uid()` server-side, independent of
`ProtectedRoute`.** Even if `ProtectedRoute` were deleted entirely (or bypassed by editing client
JS, exactly as the prior incident's flag could be), a Client-role user's query for another client's
row must return zero rows because Postgres itself refuses it — not because the frontend didn't
render a link to it. `ProtectedRoute` exists purely so a legitimate but unauthenticated visitor
sees a login prompt instead of a blank/broken page — it carries zero security weight and should
never be described or reviewed as if it did.

Session tokens: use Supabase Auth's own session handling (it manages a JWT + refresh token via its
client SDK, `supabase.auth.getSession()`), not a custom cookie/localStorage scheme — this avoids
re-inventing exactly the primitive that failed before.

---

## 6. File/Asset Handling

**Decision: simple `<input type="file">` as the base control, with an optional drag-and-drop zone
layered on top of the same input — not a drag-only interface.** The stated audience
(`IMPLEMENTATION_PLAN.md`: a small business, non-technical staff/clients uploading tender
documents, training certs, portal documents) means the upload control must work perfectly for
someone who has never used drag-and-drop and will simply click "Choose File" — that path must never
be secondary or hidden behind a drop zone. Concretely:

```tsx
// src/components/FileUpload.tsx
// - a visible, always-present "Browse files" button wrapping a real <input type="file"> (labelled,
//   keyboard-operable — not a div styled to look like a button, which breaks keyboard/AT users)
// - the drop zone is an ADDITIONAL affordance around that same input (onDragOver/onDrop
//   sets the input's files programmatically), not a replacement for it
// - client-side pre-validation (type allowlist, size limit) mirroring DATABASE_ARCHITECTURE.md's
//   security plan — but this is a UX nicety (fail fast, clear message), the real validation is
//   server-side in the Vercel function per the security plan's "never trust client MIME type" rule
// - upload progress: a simple percentage/spinner state, no resumable-upload library needed at
//   this file-count/size scale (tender PDFs, certificates — not large video/dataset uploads)
```

No upload library needed (e.g. `react-dropzone`, `uppy`) — the interaction is simple enough
(single or few files, no chunked/resumable requirement, no in-browser image cropping) that the
~80-line custom component above covers it, and a custom component avoids importing a library whose
polished drag-and-drop UX would then need to be reasonably supplemented with the plain-button path
this audience actually needs — better to build both together, deliberately, than fight a library
that assumes drag-and-drop is primary.

---

## 7. Admin Dashboard Shell

**Decision: `/admin/*` is a separate layout tree from the public site — no shared `Navbar`/`Footer`
— with its own `AdminLayout` (sidebar nav + top bar + content area, per `DESIGN_SYSTEM.md` §8's
navigation section). Same decision applies to `/portal/*` (`PortalLayout`) in Phase 3.**

Reasoning: the public `Navbar`/`Footer` are marketing-styled (full-bleed hero, editorial type
scale, CTA-heavy) and structurally assume a small, mostly-static page count for its nav items — the
design system explicitly notes admin/portal need "denser data tables" and different navigation
affordances (§8's tab-navigation note, §11's dense-table-not-card-grid note). Forcing admin pages
inside the marketing chrome would mean either compromising the marketing nav's visual identity to
accommodate dashboard density, or fighting the public layout's spacing/typography scale on every
admin screen. A dedicated shell is a small amount of extra code (one more layout component) for a
much better fit:

```tsx
// src/App.tsx
<Routes>
  {/* Public site — unchanged shell */}
  <Route element={<PublicLayout />}>  {/* wraps existing Navbar + <main> + Footer */}
    <Route path="/" element={<Home />} />
    ...
  </Route>

  {/* Admin — separate shell entirely, Phase 2 */}
  <Route path="/admin/*" element={
    <ProtectedRoute allow={['admin','staff']}><AdminLayout /></ProtectedRoute>
  }>
    <Route path="content" element={<AdminContent />} />
    <Route path="business" element={<AdminBusiness />} />
    <Route path="documents" element={<AdminDocuments />} />
    <Route path="users" element={<AdminUsers />} />
    <Route path="settings" element={<AdminSettings />} />
  </Route>

  {/* Portal — separate shell, Phase 3 */}
  <Route path="/portal/*" element={
    <ProtectedRoute allow={['client','staff','admin']}><PortalLayout /></ProtectedRoute>
  }>
    ...
  </Route>
</Routes>
```

`AdminLayout` = fixed left sidebar (nav links to the 5 admin sections from the sitemap) + top bar
(user menu, notifications badge) + scrollable content area — the standard dashboard shell pattern,
built from the same design tokens (colors, type, `rounded-sm` sharp-edged look per §7's radius
scale) so it reads as clearly "Kamosa" without borrowing the marketing site's actual nav component.
`Button`, `Container` (possibly a wider `max-w` variant for admin), `Reveal`, and the new
StatusBadge/DataTable/Modal/Toast from §3 are shared across both shells — component-level reuse,
layout-level separation.

`robots.txt` disallow for `/admin/*` and `/portal/*` (already specified in the implementation plan)
is a natural consequence of this being a structurally distinct route tree, not an afterthought.

---

## 8. Migration of Existing Static Content

**Decision: About, Services overview/detail content, Industries, Experience, Leadership, and
Credentials stay as static TS files (`src/data/*.ts`) through Phase 2 and Phase 3. Do not migrate
them to Supabase unless a specific, real admin-editability need appears.**

Reasoning, applying the same "don't buy maintenance you don't need" principle the plan states
throughout: these six content areas share three properties that make DB-backing them pure cost with
no offsetting benefit right now —

1. **They change rarely.** Company profile, service descriptions, leadership bio, credentials list
   — these are edited on the order of "when the business changes," not daily/weekly content
   operations. A code change + deploy (current workflow) is not a real burden at that cadence.
2. **They need no admin-editability in Phase 1/2.** `DATABASE_ARCHITECTURE.md`'s and the feature
   matrix's admin-CRUD needs are explicitly scoped to tenders, training, resources, insights, FAQ,
   CRM/enquiries — never to About/Services/Industries/Experience/Leadership/Credentials. Migrating
   them would mean building admin CRUD screens (`/admin/content`) for data that has no stated
   requirement to be editable outside a code change, which is exactly the gold-plating this
   document is instructed not to do.
3. **Migrating them buys real, avoidable cost**: an extra Supabase round-trip (with a loading
   state) on pages that currently render instantly from a bundled import, one more thing to seed/
   migrate/back up, and — per the one-person-business risk in the implementation plan — one more
   surface requiring RLS policy review even though it's public-read content with no meaningful
   access-control question.

**The one qualifier:** `docs/IMPLEMENTATION_PLAN.md`'s feature matrix lists "Company profile
download (gated)" and mentions the confirm-list items (TCS status, SACPCMP number, etc.) as things
that may firm up over time. If Kamosa's credential/registration facts change with any real
frequency once TCS/SACPCMP/SAIOSH items in §17 of the plan get confirmed, updating one line in
`src/data/company.ts`/`credentials.ts` and redeploying is materially simpler than standing up a
`content_sources`-style table + admin form for six fields that change a handful of times a year.
**Revisit this decision only if Kamosa hires content-editing staff who need to update these pages
without a developer** — that's the actual trigger for a CMS-backed content model, and it isn't
indicated anywhere in the current plan.

`src/data/*.ts` and `src/types/content.ts` for these six areas are therefore permanent, not a
migration staging ground — Phase 2's "extend the `src/data/*.ts` pattern" language in the
implementation plan's §12 applies to the *pattern* (typed static exports as the template for the
new `src/lib/api/*.ts` hooks' return shape, per §1 above), not to these specific files eventually
moving to the DB.

---

## 9. Summary of New Dependencies

Added, and exactly when:

| Dependency | Added at | Scope |
|---|---|---|
| `@supabase/supabase-js` | Start of Phase 2 (DB stood up) | Sitewide (public reads use anon key directly; admin/portal reuse same client with session-scoped RLS) |
| `@tanstack/react-query` | Start of Phase 2 admin dashboard | `src/pages/admin/**`, `src/components/admin/**` only; extended to `src/pages/portal/**` in Phase 3 |
| `react-hook-form` | When the dynamic per-service quote form ships (Phase 2) | Quote request, training registration (if dynamic questions), admin content-CRUD forms. Simple static forms keep the hand-rolled `useFormSubmission` hook. |

Nothing else — no table library, no toast library, no modal/dialog library, no upload library, per
§3 and §6's reasoning. This keeps the dependency count proportionate to what each phase actually
needs, consistent with the project's current five-runtime-dependency footprint.
