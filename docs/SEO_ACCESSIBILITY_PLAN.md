# SEO & Accessibility Plan — Kamosa Platform Expansion

Prepared by: SEO + Accessibility specialist pass, for merge into `docs/IMPLEMENTATION_PLAN.md`
(owned by another agent). Source of truth for all factual claims: `docs/KAMOSA_COMPANY_PROFILE.md`.
Prior codebase findings: `docs/EXISTING_AUDIT_SUMMARY.md`.

Hard constraint carried through this entire document: **no physical address, no SACPCMP
registration number, no SAIOSH membership grade are confirmed.** Nothing below recommends
publishing or structuring data around any of the three. Where the company profile marks something
"CONFIRM", this plan treats it as absent, not as a placeholder value to invent.

---

## SEO Plan

### 1. Audit of existing SEO setup (`src/components/Seo.tsx`)

What exists today:
- `<Seo title description image?>` component, mounted per-page, imperatively upserts (not
  React-Helmet-style declarative, but functionally equivalent) into `document.head`:
  - `document.title`
  - `meta[name=description]`
  - `meta[name=robots]` — **hardcoded to `index, follow` on every page, with no prop to override.**
    This is the single biggest gap for Phase 2: there is currently no way to noindex a route.
  - `link[rel=canonical]`, built from `SITE_URL` (`https://www.kamosa.co.za`, hardcoded) +
    `useLocation().pathname` — correct pattern, but has no override for paginated/query-string
    variants and no trailing-slash normalization logic (relies on router always producing clean
    paths).
  - Open Graph: `og:type` (hardcoded `website`), `og:site_name`, `og:title`, `og:description`,
    `og:url`, `og:locale` (`en_ZA`), plus `og:image`/`twitter:image` if an `image` prop is passed.
  - Twitter: `summary_large_image` card, title, description.
- `<OrganizationSchema>` — a separate component, injects one `application/ld+json` Organization
  schema into `<head>` once (guarded by `document.getElementById` so it isn't duplicated on
  re-render/route change). Fields: name, alternateName, url, email, telephone, slogan, areaServed
  (Country: South Africa), knowsAbout (four service-line strings). No `logo`, no `sameAs` (no social
  profiles confirmed to link), no address — this is deliberate, with an inline code comment already
  explaining LocalBusiness is intentionally withheld pending a confirmed address. **This existing
  discipline should be preserved, not relaxed, in Phase 2.**
- No sitemap.xml or robots.txt were found alongside `Seo.tsx` in this pass — treat their presence
  in `public/` as unverified; confirm during implementation and build from the strategy below
  regardless.
- Gaps for the platform expansion, addressed in sections 2–5 below: no per-page `noindex` override,
  no `og:type: article` support for blog posts, no BreadcrumbList schema (breadcrumbs exist visually
  in `PageHeader.tsx` but carry no structured data), no Service/Article/FAQPage schema components,
  no dynamic sitemap generation path, and title/description are always caller-supplied ad hoc rather
  than generated from a per-page-type template (risk of inconsistent formatting as page count grows
  from ~10 to 100+).

### 2. Per-page-type metadata strategy

Extend `Seo.tsx` with a `noindex?: boolean` prop (renders `noindex, follow` — follow so link equity
still flows through portal/admin pages that may link out — rather than omitting the tag) and an
`type?: 'website' | 'article'` prop before any Phase 2 page type ships. Title/description should be
generated from small template functions per content type, not typed freely per page, so a 7-industry
or 30-course catalogue stays consistent without per-page authoring effort.

| Page type | Title template | Description template | Notes |
|---|---|---|---|
| Service page (5) | `{Service Name} \| Health, Safety & Compliance Services \| Kamosa` | First 155 chars of the service's lead paragraph from `src/data/services.ts`, ending on a full clause | Service name first (search intent match), brand last |
| Industry page (7) | `{Industry} Safety & Compliance Solutions \| Kamosa` | `Kamosa supports {industry} operations in South Africa with {2–3 relevant service lines from the profile}.` — pull only from confirmed sector list (Mining, Construction, Energy, Manufacturing, Transport, Government, Commercial) | Do not invent industry-specific stats or client names — profile explicitly forbids named clients/values |
| Tender listing (index) | `Open Tenders \| Kamosa` | `Current tender opportunities from Kamosa (Pty) Ltd — Level 1 B-BBEE, CSD-registered supplier.` | Static, confirmed facts only |
| Tender detail | `{Tender Title} — Tender \| Kamosa` | Truncated tender summary from CMS/DB record | **noindex candidate once tenders close/expire** — see sitemap section; closed tenders should 410/noindex, not silently 404 |
| Training course | `{Course Name} Training \| Kamosa` | `{Course name} delivered by a registered assessor, moderator and facilitator. {1-line course summary}.` | Never claim SETA/accreditation body names not confirmed in the profile — "accredited-standard" language only, matching profile wording |
| Blog / Insights post | `{Post Title} \| Kamosa Insights` | Author-written meta description or first 155 chars of intro | `type: 'article'` → `og:type: article`, add `article:published_time`/`article:modified_time` OG tags |
| FAQ page | `Frequently Asked Questions \| Kamosa` | `Answers to common questions about Kamosa's health & safety, consulting, procurement and training services.` | Pairs with FAQPage schema (section 3) |
| Resource centre index/detail | `{Resource Title} \| Kamosa Resource Centre` | Resource summary | If gated behind portal login, noindex |
| Client portal (all routes) | Not search-relevant | N/A | `noindex, nofollow` (portal pages should not leak into search or pass link equity — override the default `follow`) |

General rule for all templates: 50–60 char titles, 140–160 char descriptions, brand name only in
titles (not stuffed into descriptions), and no title/description may state a credential, number, or
client name from the "must remain unconfirmed" list in the company profile.

### 3. Structured data (schema.org) plan per page type

Guardrail restated up front: **do not add `LocalBusiness` schema with a `PostalAddress`, and do not
include SACPCMP registration numbers or SAIOSH membership grades in any structured data property**
(not in `Organization.hasCredential`, not in a `Person` schema for the MD, not anywhere) until the
company profile's CONFIRM items are resolved. `Organization` schema stays address-less exactly as it
is today.

- **Organization (site-wide)** — keep `OrganizationSchema` as-is, mounted once at app shell level
  (not re-injected per route). Candidate additions once confirmed/available: `logo` (once a proper
  logo asset URL exists), `sameAs` (once official social profiles are confirmed — none currently
  listed in the profile, so skip for now). Do **not** add `address`, `foundingDate` beyond what's
  public record (registration number is public via CSD/CIPC, so `Organization.identifier` with the
  CIPC/CSD numbers is fine — those are the two facts explicitly marked "confirmed" in the profile),
  or `award`/`aggregateRating` (none exist — profile explicitly says don't invent).
- **Service (per service page, 5)** — new `ServiceSchema` component: `@type: Service`, `name`,
  `description`, `provider: {@type: Organization, name: "Kamosa (Pty) Ltd", url}` (reference, not a
  duplicate full Organization block), `areaServed: {@type: Country, name: "South Africa"}`,
  `serviceType` matching the four confirmed service lines. No `offers`/pricing — none confirmed.
- **Article (blog posts)** — `@type: Article` (or `BlogPosting`), `headline`, `description`,
  `datePublished`, `dateModified`, `author: {@type: Person, name: <author>}` (only if a real named
  author is set — default to `Organization` as author if unattributed, never fabricate a byline),
  `publisher: {@type: Organization, name: "Kamosa (Pty) Ltd"}`. No `image` unless a real, licensed
  image exists for that post (profile forbids stock photos implying to be real people/assets, e.g.
  the MD portrait rule — apply the same caution to any blog imagery of "team" or "site work" that
  isn't genuinely Kamosa's).
- **FAQPage (FAQ page only)** — `@type: FAQPage` with `mainEntity[]` of `Question`/`Answer` pairs
  mirrored exactly from the visible on-page FAQ accordion content (Google penalizes structured data
  that doesn't match visible content — this also has an accessibility upside, see Accessibility §6).
  Do not create a separate FAQPage schema on pages that don't have a visible FAQ block.
- **BreadcrumbList** — `PageHeader.tsx` already renders visible breadcrumbs (`crumbs` prop, with
  "Home" prepended) but emits no schema. Add a `BreadcrumbSchema` component/hook that takes the same
  `crumbs` array `PageHeader` already receives and emits matching `@type: BreadcrumbList` /
  `ListItem` JSON-LD, so the two never drift out of sync — ideally generate it inside `PageHeader`
  itself from the same `crumbs` prop rather than as a separately-authored parallel list, to remove
  the risk of the visible trail and the schema trail disagreeing.
- **JobPosting** — N/A / skip, per instructions (no careers/vacancies content in scope).
- **Course (training pages)** — worth adding once training pages exist: `@type: Course`,
  `provider: Organization` reference, `name`, `description`. Skip `hasCourseInstance` fields like
  price/schedule until those are real, DB-backed values rather than placeholders.
- **Product** — explicitly avoid for the Procurement & Supply pages. Nothing in the profile confirms
  SKUs, pricing, or stock — a `Product` schema implies purchasable items with availability, which
  would misrepresent a supply *capability* as an e-commerce catalogue.

### 4. Sitemap strategy

- **Today (Phase 1, static ~10 pages):** a hand-maintained `public/sitemap.xml` covering the static
  routes is sufficient. Confirm one exists; if not, add it as a trivial static file — no build step
  needed yet.
- **Phase 2+ (tenders, training, blog, resources become DB-backed):** static sitemap breaks down
  once content count and URLs are dynamic and change independently of deploys. Move to generated
  sitemaps:
  - A build-time or on-request sitemap generator (Vercel serverless function, e.g.
    `/api/sitemap.xml`, or a Vite/Vercel build step that queries the DB and writes the file) — pick
    based on how often content changes vs. deploy frequency. Given tenders/courses/posts will be
    edited outside of code deploys once a CMS/DB exists (per the EXISTING_AUDIT_SUMMARY note that
    the platform is moving to Supabase), prefer an **on-request or scheduled-regeneration serverless
    sitemap** over a build-time one, so a new tender or post doesn't wait for the next deploy to be
    discoverable.
  - Split into a sitemap index once page count grows: `sitemap-static.xml` (marketing pages),
    `sitemap-services.xml`, `sitemap-industries.xml`, `sitemap-tenders.xml`, `sitemap-training.xml`,
    `sitemap-blog.xml`, referenced from a root `sitemap.xml` index file.
  - **Exclusion rules:** any route requiring authentication (client portal, admin) must never appear
    in any sitemap. Expired/closed tenders should drop out of `sitemap-tenders.xml` on the next
    regeneration rather than persist with a stale `lastmod`.
  - `lastmod` should reflect real content-update timestamps from the DB once one exists, not a
    blanket "today" on every generation — a sitemap where every URL claims the same `lastmod` is a
    known low-trust signal to crawlers.
- **Noindex vs. sitemap exclusion are both required, not either/or:** a portal page must carry
  `noindex` (in case it's ever linked externally) *and* never be enumerated in a sitemap.

### 5. Robots.txt strategy

- Keep a single static `public/robots.txt` (no need for a dynamic one — disallow rules are stable
  even as content is dynamic, since noindex handles the fine-grained per-page cases).
- Baseline rules:
  ```
  User-agent: *
  Disallow: /portal/
  Disallow: /admin/
  Disallow: /api/
  Sitemap: https://www.kamosa.co.za/sitemap.xml
  ```
- `/admin/` is currently removed entirely per `EXISTING_AUDIT_SUMMARY.md` (the hardcoded-password
  admin was deleted) — keep the `Disallow` rule anyway as defense-in-depth for whenever a real,
  server-authenticated admin surface is rebuilt, so it's blocked from day one rather than
  retrofitted.
- Do not rely on `robots.txt` `Disallow` alone to keep the portal out of search — `Disallow` blocks
  *crawling*, not *indexing* (a disallowed URL can still be indexed with no snippet if linked from
  elsewhere). The portal's own pages must also carry `noindex` meta tags (via the `Seo` component's
  new `noindex` prop) for defense-in-depth, matching what section 4 already requires.

### 6. Internal linking strategy across the new IA

Goal: make the new information architecture (Services ↔ Industries ↔ Case-study-equivalent content
↔ Resources ↔ Blog) mutually reinforcing rather than siloed, without inventing content that doesn't
exist.

- **Service ↔ Industry cross-links:** each of the 5 service pages should link to the industries it's
  most relevant to (e.g. Health, Safety & Compliance → Mining, Construction, Energy), and each
  industry page should link back to the 2–4 service lines actually delivered in that sector, sourced
  from the "Experience & Track Record" table in the company profile (e.g. Energy → link to Health,
  Safety & Compliance and Training; do not claim Procurement & Supply for a sector not evidenced in
  that table).
  Environmental Management is cross-sector and associate-delivered (not in-house) — link it from
  Industries pages generically where relevant, but label it clearly as "delivered via associate
  network" per the profile's own qualifier, never presented as an in-house Kamosa team capability.
- **Experience/track record as the substitute for case studies:** the profile explicitly forbids
  named clients, project values, and numeric outcomes — so there is no traditional "case study"
  content to link to. Treat the existing `/experience` page's sector table as the de facto
  case-study-equivalent hub: link every relevant Industry page to the matching row's anchor on
  `/experience`, and every Service page to `/experience` generally.
  When a future case-study section is proposed, this is also the natural place to flag that it needs
  the profile's CONFIRM items (client names, values, durations) resolved first.
- **Blog ↔ Resource Centre ↔ Services:** blog posts should link contextually to the service or
  industry page they relate to (e.g. a post about HIRA methodology links to the Health, Safety &
  Compliance service page); the Resource Centre's downloadable content (guides, templates) should
  link back to the relevant service page as a "related service" block, and vice versa — services
  link to relevant resources as further reading.
- **FAQ page:** link individual FAQ answers to the fuller page they summarize (e.g. a "Do you supply
  PPE?" answer links to the Procurement & Supply service page) — this also strengthens the FAQPage
  schema's real-world correspondence to actual content.
- **Tenders/Training index → Services:** tender listings and training course pages should link back
  to the relevant service line (a tender requiring a SHE file links to Health, Safety & Compliance;
  a HAZCHEM course links to Training & Skills Development), closing the loop back into the core
  service pages that carry the highest commercial intent.
- **Avoid orphan pages:** every new page type needs at least one inbound link from an existing
  high-traffic page (home, services index, industries index) at launch — don't rely solely on the
  sitemap for discovery of new sections.

### 7. Technical SEO checks for Vercel deployment

- **Canonical URLs:** `Seo.tsx`'s canonical builder (`SITE_URL + pathname`) needs verification
  against trailing slashes and query strings once tender/training filter UIs exist (e.g.
  `/tenders?sector=mining` should canonicalize to `/tenders`, not self-canonicalize with the query
  string, to avoid duplicate-content dilution across filter combinations).
- **www vs. non-www / protocol:** confirm Vercel's project domain settings 301-redirect
  `kamosa.co.za` → `www.kamosa.co.za` (matching `SITE_URL` in `Seo.tsx`) and `http` → `https`, so
  canonical tags and actual served URLs never disagree.
- **Redirects for any changed paths:** if the IA expansion renames or restructures any existing
  route (e.g. if `/services/:slug` structure changes when 5 dedicated service pages replace a
  generic detail route), add explicit 301s via `vercel.json` `redirects` — do not let the currently-
  known bug where an unknown `/services/:slug` silently redirects to `/services` (noted in
  `EXISTING_AUDIT_SUMMARY.md`) persist into the expanded IA; unknown/removed slugs should serve a
  real 404 (with a `noindex` 404 page) rather than a silent redirect, which currently risks masking
  broken inbound links as "working."
- **Performance as a ranking factor:** framer-motion + `Reveal.tsx` scroll animations are already in
  use — confirm they don't block LCP on image-heavy new pages (industry/tender/training pages likely
  to carry more imagery than the current brochure site). Use `loading="lazy"` on below-the-fold
  images (industry photography, resource thumbnails) and confirm Vercel's image optimization (or an
  equivalent) is applied to any new imagery, since Core Web Vitals remain a confirmed Google ranking
  input.
- **Structured data validation:** run new schema (Service, Article, FAQPage, BreadcrumbList) through
  Google's Rich Results Test before each new page type ships, given several are hand-authored
  JSON-LD rather than framework-generated.
- **Sitemap/robots reachability:** confirm `/sitemap.xml` and `/robots.txt` are served at the domain
  root by Vercel (not nested under a build output path) after the sitemap generation strategy in
  §4 moves from static to generated.

---

## Accessibility Plan

Target: **WCAG 2.2 AA** across all new page types and interactive components.

### 1. Target and scope

WCAG 2.2 AA is the bar for every new surface in this expansion — service/industry/tender/training
pages, the FAQ accordion, forms, and (per the note that it should "generally be noindexed") the
authenticated client portal too: noindex is an SEO decision, not an accessibility exemption —
authenticated users still need full AA compliance inside the portal.

### 2. Current state and what needs the same treatment as `Button.tsx`

`Button.tsx` is currently the only interactive component with `focus-visible` styling
(`focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
focus-visible:outline-current`, applied via a shared `base` class across `Button`, `ButtonLink`,
`ButtonAnchor`). That pattern needs to be extended to every other interactive element site-wide
before Phase 2 ships new ones, specifically:
- **Nav links** (primary nav, footer nav, breadcrumb links in `PageHeader.tsx`) — currently rely on
  browser default focus ring or none; audit and align with the same visible focus-visible outline
  treatment (adjusted for context — e.g. `outline-current` inverted correctly against the dark
  `bg-ink-900` header in `PageHeader.tsx`, where default outline colors may not be visible against
  a dark background).
- **Form inputs** (`ContactForm.tsx`) — currently styled with `hover:border-muted/50
  focus:border-brand-600` (a border-color change on focus, not a `focus-visible` outline). Border-
  color-only focus indication is a weaker signal than an outline and may not meet the 2.2 SC 2.4.11
  ("Focus Not Obscured") / 2.4.13 ("Focus Appearance", AAA but good practice) bar as robustly as an
  outline does. Recommend adding the same `focus-visible:outline` treatment as `Button.tsx` to the
  shared `fieldClass` used across all `ContactForm.tsx` inputs, and to any new form component (the
  training registration form, tender filter inputs) built from the same pattern.
- **New Phase 2 interactive components that must ship with this from day one** (not retrofitted
  later): tender filters (checkboxes/selects/buttons), training registration forms, admin data
  tables (sortable headers act as buttons — need the same treatment), FAQ accordion triggers, any
  modal/dialog close buttons and focus traps.
- Recommend extracting the shared focus-visible outline into a single Tailwind utility class (e.g.
  `.focus-ring` in a shared CSS layer) applied consistently, rather than repeating the same utility
  string across every new component file — reduces the risk of a new component shipping without it.

### 3. Forms: validation, live regions, labels

`ContactForm.tsx` already implements a solid, extensible pattern — audited here as the template for
every new Phase 2 form (training registration, tender enquiry, portal forms):
- **Label association:** every input uses `<label htmlFor>` matched to the input's `id` (e.g.
  `enquiry-name` / `htmlFor="enquiry-name"`) — correct, keep this convention for new fields.
- **Required field indication:** visually marked with `<span className="text-gold">*</span>` next to
  the label text (plus the native `required` attribute on the input). Two things to verify/extend
  for new forms: (a) the asterisk-only visual indicator should be paired with a text legend, which
  `ContactForm.tsx` already provides ("Fields marked with an asterisk are required.") — carry that
  sentence into every new form, don't rely on the asterisk alone; (b) note the `gold` Tailwind token
  actually resolves to `#8CC540` (a green/lime), not a gold/yellow color — the label text itself
  isn't a contrast concern since the asterisk is decorative alongside real label text, but don't
  assume "gold" reads as visually distinct/warning-colored the way the name implies — verify the
  asterisk is still discernible against `white` at that green tone (see §5).
- **Error announcement:** `aria-invalid` + `aria-describedby` pointing to a `FieldError` paragraph
  with a matching `id` — correct pattern, errors are programmatically associated with their field.
  The overall submission result (`role="status" aria-live="polite"`, on a `tabIndex={-1}` div that
  receives programmatic focus via `requestAnimationFrame` after submit) is a good pattern for the
  *summary* announcement. One gap: individual field errors set via `setErrors` are not themselves in
  a live region — a screen reader user who has already moved past a field before validation runs
  (e.g. on submit, not on blur) relies on the focus move to the first invalid field
  (`document.getElementById(...).focus()`, which `ContactForm.tsx` already does) rather than an
  announcement of *all* errors. That's acceptable given the focus-first-error pattern is already
  correct, but extend it to every new form (training registration, portal forms) exactly as built
  here — don't let a new form skip the focus-to-first-error step.
- **Error color reliance:** errors use both color (`#B3261E` red-adjacent to but distinct from
  `brand-600`) and an icon (`AlertCircleIcon`) plus text — correct, not color-alone. Confirm this
  three-part pattern (icon + color + text) is mandatory for every new form's error states, not just
  color.
- **New Phase 2 forms to build to this same standard:** training course registration, tender
  enquiry/subscription forms, admin/portal data-entry forms — all should reuse `ContactForm.tsx`'s
  `fieldClass`/`labelClass`/`FieldError`/`Notice` pattern rather than being built fresh, both for
  consistency and to avoid re-deriving this accessibility work per form.

### 4. Semantic HTML / heading hierarchy for new page types

- **General rule (already followed by `PageHeader.tsx`):** one `<h1>` per page (rendered by
  `PageHeader`, `id="page-heading"`, referenced by the section's `aria-labelledby`) — every new page
  type must go through `PageHeader` or an equivalent single-`h1`-emitting component, not a bespoke
  hero that skips it.
- **Tender detail pages:** `h1` = tender title (via `PageHeader`); `h2`s for structured sections
  (Overview, Requirements, Closing Date, How to Apply, Documents) — avoid styling a visually-large
  "closing date" callout as an `h2` if it isn't actually a section heading; use a `<dl>` or labelled
  `<p>` for key-value metadata (closing date, reference number) instead of misusing heading levels
  for visual size.
- **Training course pages:** `h1` = course name; `h2`s for Overview / Who Should Attend / Course
  Content / Outcomes / How to Register, mirroring the tender pattern.
- **Blog posts:** `h1` = post title; author/date metadata should be marked up as `<time
  datetime="...">` (machine-readable, pairs with the `datePublished` in Article schema from SEO §3)
  rather than plain text; in-body headings from the CMS/editor should start at `h2` (never `h1`
  inside the body, and never skip from `h2` straight to `h4`).
- **FAQ page:** each question should be a heading-level element (or at minimum a `<button>` with the
  question as its accessible name) inside the accordion — see §6 for the accordion's interaction
  requirements. If questions are also real headings (`h3` under an `h2` category), that reinforces
  both SEO structure and screen-reader landmark navigation.
- **Industry pages:** `h1` = industry name; reuse the Service-page `h2` pattern for consistency
  (Overview / Relevant Services / Track Record in this sector), linking to `/experience` per the SEO
  internal-linking plan.

### 5. Color contrast — brand palette flags

Confirmed palette (from `tailwind.config.ts`): `brand-600 #E71B1C` (red, primary CTA), `ink-900
#353535` (dark text/background), `cream #D9D5D4`, `white`, `muted #6B6B6B`, `hairline #E8E2E1`, and
**`gold` is actually `#8CC540` / `gold-soft #A9D96D`** — i.e., despite the token name, this is a
green/lime, not a yellow-gold. That naming mismatch is worth flagging on its own: anyone auditing
"gold text" in code by eye rather than by computed value will misjudge its contrast behavior, since
lime-green has very different luminance characteristics than true gold/amber.

Combinations to contrast-check (WCAG AA: 4.5:1 for normal text, 3:1 for large text ≥24px/19px-bold
and for UI component boundaries) before they ship on any new page:
- **White text on gold/lime (`#8CC540`)** — flagged explicitly in the task brief. Lime `#8CC540`
  against white text is very likely to fail 4.5:1 (light, high-luminance green background needs a
  dark foreground, not white) — do not use white text on the `gold`/`gold-soft` background token for
  body copy; if a gold-background badge/button is needed, use `ink-900` text on it, not white, and
  verify the exact computed ratio before shipping (do not eyeball it).
  Note this token is already used as button `secondary` variant text-on-background in `Button.tsx`
  (`bg-gold text-ink-900` — dark text on lime, which is the *correct* direction) — the risk is net
  new Phase 2 components (status badges, tender "open"/"closing soon" tags, training availability
  badges) reusing `gold` as a background with white or light text by habit copied from `brand-600`
  patterns (which does use white text correctly, since red at this saturation is dark enough).
- **Red text (`brand-600 #E71B1C`) on cream (`#D9D5D4`)** — flagged explicitly in the task brief.
  Both are mid-to-light in luminance; a saturated red on a warm grey/cream background is a plausible
  AA failure for body-sized text even though it may look "readable" at a glance. Do not use
  `brand-600` as a text color on `cream` backgrounds for anything below large/bold text without
  verifying the ratio — this matters because `cream` is a common section background in the existing
  design and `brand-600` will be tempting to reuse for emphasis text (e.g. a pull-quote or callout)
  on a cream section.
  Also recall `EXISTING_AUDIT_SUMMARY.md`'s existing guidance: `brand-600` is reserved for CTAs
  only and should not double as error/validation color — that convention should extend to also not
  overload it as arbitrary "emphasis" text color on tinted backgrounds, both for meaning-clarity and
  because it's a contrast risk.
- **`muted` (`#6B6B6B`) on `cream` (`#D9D5D4`)** — likely marginal; check before using muted-gray
  secondary text (captions, metadata, timestamps on blog/tender/training cards) on cream card
  backgrounds, which are likely to be common in Phase 2's card-heavy listing pages (tender lists,
  training catalogues, blog index).
  All three of the above should go through an actual contrast checker (e.g. WebAIM's tool or an
  automated axe/Lighthouse pass) against the *exact* hex values above before any new component using
  them ships — this plan flags the risk, it does not certify pass/fail.

### 6. Keyboard navigation for new interactive patterns

- **Industry selector (interactive, e.g. a map/grid/tab-like picker across 7 industries):** must be
  fully operable by keyboard — if built as a custom tab-like widget, follow the WAI-ARIA APG Tabs
  pattern (arrow-key roving tabindex between industry options, `Enter`/`Space` to activate,
  `aria-selected` on the active one) rather than a div-with-onClick pattern with no keyboard handler.
- **Tender filters:** if built as checkboxes/selects, native elements already give correct keyboard
  behavior for free — the risk is only if filter "chips" or a custom multi-select are built instead,
  in which case they need explicit `Tab`/`Enter`/`Space` handling and visible focus states (per §2).
  Filter results updating live (as opposed to a submit button) should announce result-count changes
  via a polite live region, mirroring the pattern already used in `ContactForm.tsx`'s status region.
- **FAQ accordion:** each question must be a real `<button>` (not a `div`/`span` with a click
  handler) with `aria-expanded` reflecting open/closed state and `aria-controls` pointing to the
  answer panel's `id`, so it's both keyboard-operable by default (native button semantics) and
  correctly announced by screen readers. This is also what makes the FAQPage schema (SEO §3)
  trustworthy — the visible accordion and the schema should describe the same Q&A pairs.
- **Admin data tables:** sortable column headers must be real `<button>`s inside `<th>` (not
  clickable `<th>` alone), row actions (edit/delete/view) need visible focus states and a logical
  tab order that doesn't require sighted users' left-to-right table scanning to infer; consider
  whether dense admin tables need a documented keyboard shortcut set (e.g. arrow-key cell navigation)
  — not mandatory for AA but worth a note for the admin-specific implementation phase.
- **Modals/dialogs** (any confirmation dialog, tender-apply modal, training registration modal):
  need a focus trap (focus moves into the modal on open, `Tab`/`Shift+Tab` cycle within it, `Escape`
  closes it, focus returns to the triggering element on close). If a dialog library isn't already a
  dependency, evaluate Radix UI or React Aria primitives rather than hand-rolling focus-trap logic —
  hand-rolled focus traps are a common source of AA regressions.

### 7. Reduced-motion requirements

`Reveal.tsx` already does this correctly and should be the template for all new motion: it calls
`useReducedMotion()` from framer-motion and short-circuits to a plain, unanimated element (`<Tag>`
instead of `<MotionTag>`) when the user has `prefers-reduced-motion: reduce` set — this fully
satisfies WCAG 2.2 SC 2.3.3 (Animation from Interactions, AAA, but good practice) and SC 2.2.2
(Pause, Stop, Hide) for scroll-triggered reveals.
Requirements for Phase 2 additions:
- Any new framer-motion usage (tender filter transitions, accordion open/close animation, modal
  enter/exit, admin table row animations, toast notifications) must check `useReducedMotion()` the
  same way — either directly, or by building on top of `Reveal.tsx` rather than introducing a second,
  inconsistent animation pattern.
- Auto-playing or looping animations (if any carousel/testimonial-style component is ever proposed —
  note the profile confirms no testimonials exist, so this is currently moot, but applies to any
  future auto-advancing UI) must respect reduced-motion and provide a pause control regardless.
- CSS-only transitions (e.g. `Button.tsx`'s `transition-[background-color,...]` on hover/focus) are
  lower-risk than transform/opacity motion but should still be wrapped in
  `@media (prefers-reduced-motion: reduce) { transition: none; }` at the Tailwind config or global
  CSS level for consistency, since color/border transitions are cheap to disable and it costs nothing
  to be thorough.

### 8. Screen reader considerations for dynamic content (all new in Phase 2)

None of the following exist yet in the current static-brochure codebase — they are new to Phase 2's
DB-backed tenders/training/blog/portal, so build them accessible from the start rather than retrofit:
- **Loading states:** any skeleton/spinner shown while tender listings, training catalogues, or
  portal data load must be announced — either an `aria-busy="true"` on the container being loaded
  into, or a visually-hidden `role="status"` text ("Loading tenders…") that disappears once content
  arrives, mirroring the `Loader2Icon` + `aria-hidden="true"` pattern already used in
  `ContactForm.tsx`'s submit button (the spinner icon there is correctly `aria-hidden` because the
  adjacent text "Sending enquiry" already conveys the state — extend that same icon-is-decorative
  discipline to new loading indicators, and add the text/status-region for icon-only loaders).
- **Empty states** ("No tenders currently open", "No results match your filters"): must be real,
  perceivable text content in the DOM, not just an icon+illustration — and if they replace content
  inside a live region (e.g. after a filter action), the empty-state message itself should be what
  gets announced by the `aria-live="polite"` region from §6.
- **Status badges** (tender "Open"/"Closing Soon"/"Closed", training "Seats Available"/"Full"): must
  not convey status by color alone (a common failure mode for exactly this kind of badge) — pair
  color with text label and/or icon, matching the icon+color+text discipline already established in
  `ContactForm.tsx`'s `Notice` component (§3). A colored dot with no text label is not sufficient.
- **Toast notifications:** must use `role="status"` (polite, non-interrupting — e.g. "Enquiry saved")
  or `role="alert"` (assertive, for errors needing immediate attention) as appropriate, must not
  auto-dismiss before a screen reader has had a chance to announce them (a common toast-library
  default of 3–4 seconds can be too short — prefer 6+ seconds or a manually-dismissible toast for
  anything error-related), and must not be the *only* record of an action's outcome — critical
  outcomes (e.g. "tender application submitted") should also be reflected in persistent page state
  (like `ContactForm.tsx`'s `result` state driving a persistent `Notice`, not just a transient toast)
  so a user who missed the toast can still confirm what happened.
