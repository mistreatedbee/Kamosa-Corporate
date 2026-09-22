# Existing Codebase Audit Summary (2026-09-22)

Six specialist agents (Architecture, Engineering, UI/UX, Backend, QA, Security) plus a CTO
synthesis pass already audited this repo before the full-platform planning phase began. This is
their consolidated output, preserved so the planning phase doesn't re-derive it. Treat this as
already-verified context, not something to re-audit from scratch — spot-check specific claims only
if something here looks stale.

## Stack (as of audit)
React 18.3 + Vite 5.2 + TypeScript + Tailwind 3.4 + react-router-dom 6.26 + framer-motion 11.5 +
lucide-react. Fully static SPA, no backend, no database, deployed on Vercel at
kamosa-corporate.vercel.app. Content lives in flat TS files under `src/data/*.ts`, typed via
`src/types/content.ts`.

## Since fixed during this audit (already resolved, do not re-flag)
- **Critical security hole**: admin login (`AdminLogin.tsx`/`AdminDashboard.tsx`) had a hardcoded
  plaintext password shipping in the public JS bundle, gated only by a client-side localStorage
  flag with no server check. Both files were deleted entirely and the `/admin` routes removed from
  `App.tsx` — confirmed the password no longer appears in the built bundle, and `/admin` now
  correctly 404s.
- 27 TypeScript errors from unused `import React` statements (React 18 JSX runtime doesn't need
  them) — all fixed.
- A stray, drifted duplicate `src/package.json` left over from the original scaffold tool — deleted.
- Duplicate H1/H2 heading text on `/leadership` and `/experience` (PageHeader banner repeated the
  section heading verbatim below it) — reworded, fixed.
- No `focus-visible` styling existed on any button (`Button.tsx`, used by every CTA site-wide) —
  added a visible focus-visible outline.

## Confirmed still open (not yet built)

### Enquiry form has no backend (highest business priority)
`src/components/ContactForm.tsx` + `src/utils/enquiry.ts` are fully built and validate client-side,
but `ENQUIRY_ENDPOINT` in `enquiry.ts` is hardcoded `null`. Every submission currently just tells
the visitor to phone/email instead of actually sending anything. This is the site's lead-gen form
silently not working. Recommended fix (from Backend + Architecture agents): one Vercel serverless
function (`/api/enquiry`) + an email service (Resend/SendGrid) + honeypot field + basic rate
limiting. `ContactForm.tsx`'s existing `sent`/`error` state handling needs no changes — just point
`ENQUIRY_ENDPOINT` at the new function.

### Brand color — investigated and RESOLVED, do not re-flag
The UI/UX agent initially flagged `brand-600` (`#E71B1C`, bright red, used on every primary CTA) as
contradicting an assumed green/white brand identity. This was investigated further: the actual
Kamosa logo (`public/logo.jpg`) is a red "KM" monogram with a small green leaf accent and dark
wordmark — red genuinely is the primary brand color, green is only an accent. **Decision: keep
`brand-600` red. Do not change it to green.** Guidance for future work: `brand-600` should be
reserved for primary CTAs only, never repurposed for error/validation messaging, so it doesn't
carry both "click here" and "something's wrong" meanings on the same screen.

### Other confirmed findings, not yet fixed
- `/services/:slug` silently redirects to `/services` on an unknown slug instead of showing a 404
  or explanit error message (`ServiceDetail.tsx`).
- No CI pipeline exists — only Vercel's build-time check. A minimal GitHub Actions workflow
  (tsc + eslint on PR) was recommended but not yet added.
- No automated tests exist. Judged reasonable for a mostly-static marketing site; if any coverage
  is added, `src/utils/enquiry.ts`'s `validateEnquiry` function (real branching logic: email/phone
  regex, required fields) is the one function worth unit testing.
- Two harmless React Router v6→v7 future-flag console warnings on every page load (cosmetic,
  `v7_startTransition`/`v7_relativeSplatPath`).
- No security headers configured (CSP/X-Frame-Options) — judged low urgency for a static brochure
  site at the time, may need revisiting once a backend/auth exists.
- Leadership portrait is an intentional placeholder (`Leadership.tsx`) pending a client-supplied
  photo — confirmed correct, not a bug.

## CTO synthesis at the time (superseded by the new full-platform directive)
The CTO agent's original read was: this is a small, resource-constrained business (B-BBEE Level 1,
100% Black Female Owned per the company profile), the site was "~85% done" as a brochure site, and
recommended against building any CMS/admin panel/database/client portal until a concrete need was
named — explicitly calling that class of work "buying maintenance, not capability" for a business
this size. The site owner has since reviewed this recommendation and explicitly chosen to proceed
with the full business-platform build anyway (client portal, CRM foundation, tender system, training
platform, AI assistant, Supabase backend, etc.) — so that recommendation is superseded for scope
purposes, but the underlying engineering caution it raised (don't hand-roll auth again, don't add
speculative infrastructure with no matching feature) still stands as a design principle: build real
security and real data models for whatever IS being built, rather than the client-side-only
patterns that caused the original admin auth hole.
