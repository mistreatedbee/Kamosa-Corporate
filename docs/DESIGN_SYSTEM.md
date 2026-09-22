# Kamosa (Pty) Ltd — Design System

Status: living document for the Phase 2/3 platform expansion (client portal, admin dashboards,
tender system, training platform). Written by extending the existing, shipped design language in
`tailwind.config.js`, `src/index.css`, and the component library under `src/components/` — not by
inventing a parallel one. If anything below conflicts with the running codebase, the codebase wins
and this doc should be corrected.

Source documents read before writing this: `docs/KAMOSA_COMPANY_PROFILE.md`,
`docs/EXISTING_AUDIT_SUMMARY.md`, `tailwind.config.js`, `public/logo.jpg` (viewed directly),
`src/index.css`, `src/components/Button.tsx`, `Container.tsx`, `Reveal.tsx`, `PageHeader.tsx`,
`ServicesGrid.tsx`, `ServiceCard.tsx`, `ContactForm.tsx`, `Navbar.tsx`, `src/pages/Home.tsx`,
`src/pages/Services.tsx`.

---

## 1. Brand Foundation

**Verified directly from `public/logo.jpg`:** the Kamosa mark is a circular badge — light
grey/cream circle, a bold red "KM" monogram, a small green leaf growing out of the "K", sitting in
an open palm silhouette, with "KAMOSA" set below in dark charcoal type. There is no green
background, no green wordmark, and no gold in the logo itself.

**Decision (already made and shipped, do not re-open):** red is the genuine primary brand color,
not a mistake. An earlier review pass assumed a "premium corporate green" identity without having
looked at the logo — that assumption was wrong and has been corrected in both the codebase
(`brand-600` / `#E71B1C` on every primary CTA) and `docs/EXISTING_AUDIT_SUMMARY.md`. This document
does not reintroduce that invented green palette. The Tailwind `lime`/`gold` tokens (`#8CC540`) are
the real accent, taken from the leaf in the logo — they are a warm lime-green, not the deep
corporate green (`#176B4B`) or gold (`#C8A45A`) that a generic brief might suggest. Those generic
values are not used anywhere in this system.

### Brand roles

| Role | Token | Hex | Usage rule |
|---|---|---|---|
| Primary / action | `brand-600` | `#E71B1C` | Primary CTAs, primary buttons, active nav state, links-as-actions. **Reserved for "click here."** Never used for error, danger, or "closed/rejected" states — see §9. |
| Primary hover-in | `brand-500` | `#CD1718` | Rarely used directly; primary button hover currently goes to `ink-700`, not a darker red (see §5). Keep `brand-500` available for contexts needing a red-on-red hover (e.g. a red-outline button). |
| Accent | `gold` / `lime` | `#8CC540` | Eyebrow text, list bullets, active nav underline, secondary button fill, required-field asterisks, small accent details. Never used for large fills or primary CTAs — it's a garnish, not a second primary. |
| Accent soft | `gold-soft` / `lime.soft` | `#A9D96D` | Hover state for accent-filled elements only. |
| Ink (near-black) | `ink-900` | `#353535` | Body text default, dark section backgrounds (`PageHeader`, footer), primary button hover fill. |
| Ink mid | `ink-800` | `#4A4A4A` | Secondary dark text on dark backgrounds. |
| Ink light | `ink-700` | `#5C5C5C` | Tertiary dark text; also doubles as the primary button's hover fill. |
| Muted text | `muted` | `#6B6B6B` | Body copy on white/cream where full `ink-900` is too heavy — captions, summaries, helper text. |
| Cream | `cream` | `#D9D5D4` | Section background alternation (see `ServicesGrid background="cream"`), badge fills, hover background for outline buttons. |
| Hairline | `hairline` | `#E8E2E1` | All 1px borders — card borders, input borders, nav border. |

**Rule of thumb carried over from the audit:** the same principle already applied to buttons
(`brand-600` = action, never error) must extend to every new pattern in this doc — status badges,
form validation, alerts, toasts. Red must mean exactly one thing sitewide: "primary action."

---

## 2. Color Palette

### 2.1 Existing tokens (verbatim from `tailwind.config.js`, do not rename)

```
ink:    DEFAULT/900 #353535, 800 #4A4A4A, 700 #5C5C5C
brand:  DEFAULT/600 #E71B1C, 500 #CD1718
lime:   DEFAULT #8CC540, soft #A9D96D
gold:   DEFAULT #8CC540, soft #A9D96D   (gold is currently an alias of lime — same hex)
cream:  #D9D5D4
muted:  #6B6B6B
hairline: #E8E2E1
```

Note for implementers: `gold` and `lime` currently resolve to the identical hex values. Treat them
as one accent color with two semantic names in the codebase (`gold-*` classes read better in
copy-heavy UI, `lime-*` reads better in data-viz-adjacent contexts) — do not let them drift apart
visually; if one is ever restyled, restyle both or consolidate them.

`index.css` also mirrors these as CSS custom properties (`--kamosa-red`, `--kamosa-lime`,
`--kamosa-charcoal`, `--kamosa-light-grey`, `--kamosa-hairline`, etc.) for non-Tailwind contexts
(e.g. `::selection`, `:focus-visible` outline). Keep both in sync if a hex ever changes.

### 2.2 New semantic tokens needed for Phase 2/3

The current codebase has exactly one non-brand "signal" color in use today: `#B3261E` (Material's
standard error red), hardcoded inline in `ContactForm.tsx` for the required-field error border and
error message text. It is deliberately **not** `brand-600` — this is the existing precedent to
formalize, not deviate from.

Two things need fixing/extending as real Tailwind tokens (not hardcoded hex) before Phase 2 ships
dashboards, status badges, and toasts at volume:

1. `ContactForm.tsx`'s success `<Notice>` currently uses `brand-600/5` and `brand-600/40` (red) as
   its **success** tone background/border. That's an existing small inconsistency worth correcting
   in Phase 2 — success must not visually borrow the CTA red. Route it to the new `success` token
   below instead.
2. No warning/info-distinct-from-accent or dedicated status-badge palette exists yet.

Proposed new tokens (additive to `tailwind.config.js`, chosen to sit comfortably next to the
existing warm/earthy palette and to stay clearly separate from `brand-600` and `gold`):

| Token | Hex | Usage |
|---|---|---|
| `success.600` | `#1E7A3D` | Success text/icons, "Open" tender badge, "Awarded" badge, success toast/alert border+wash, form success state. A muted forest green — deliberately distinct from both `brand-600` (red) and `gold`/`lime` (yellow-green accent) so success is never confused with the leaf accent or the CTA red. |
| `success.50` | `#EAF5EE` | Success alert/badge background wash. |
| `warning.600` | `#B7791B` | Warning text/icons, "Closing Soon" badge, "Pending review" states. Amber, not gold — kept visually distinct from the `gold` accent by being noticeably darker/browner. |
| `warning.50` | `#FBF3E4` | Warning alert/badge background wash. |
| `error.600` | `#B3261E` | Promote the existing hardcoded `ContactForm.tsx` value to a real token. Error text, invalid field borders, error toast, "Archived"/"Rejected" badge. Chosen specifically because it is *not* `brand-600` — same red family conceptually (danger-adjacent), but a distinct, more muted brick-red so it never gets confused visually with the CTA. |
| `error.50` | `#FBEAE9` | Error alert/badge/field background wash. |
| `info.600` | `#2E5F8A` | Info text/icons, info toast/alert, neutral-informational badges ("Under Review"). A cool blue — the one hue with zero overlap anywhere else in the existing palette, making "informational, not urgent" unambiguous. |
| `info.50` | `#EAF1F7` | Info alert/badge background wash. |
| `neutral.600` | `muted` (`#6B6B6B`, reuse) | "Closed"/"Archived" badge — a deliberately unstyled grey so an ended/inactive item doesn't compete visually with any signal color. |
| `neutral.100` | `cream` (`#D9D5D4`, reuse) | Neutral badge/background wash — reuse existing token, no new hex needed. |

None of these six new hues touch `#E71B1C`/`#CD1718` (brand) or `#8CC540`/`#A9D96D` (accent), and
none of the "closed/ended" states reuse brand red — satisfying the audit's explicit guidance.

---

## 3. Typography

From `tailwind.config.js` + `src/index.css` (Google Fonts, loaded at the top of `index.css` per the
file's own "must stay at top" guard comment):

- **Display / heading font:** Manrope (400/500/600/700/800) — `font-display`. Applied globally to
  `h1–h4` via `index.css`, and explicitly on eyebrows, button labels, nav labels, and card titles.
- **Body font:** DM Sans (300/400/500 + italic 400) — `font-sans`, the `body` default.
- **Display scale** (fluid, `clamp()`-based, tightening tracking as size increases — already
  covers hero-to-subsection needs):
  - `display-xl` — `clamp(2.5rem, 5.2vw, 4.25rem)`, line-height 1.04, tracking −0.03em (hero H1)
  - `display-lg` — `clamp(2.125rem, 4vw, 3.25rem)`, 1.08, −0.025em (page H1, `PageHeader`)
  - `display-md` — `clamp(1.75rem, 2.8vw, 2.5rem)`, 1.14, −0.02em (section H2)
  - `display-sm` — `clamp(1.375rem, 1.9vw, 1.75rem)`, 1.22, −0.015em (card/subsection H3)
  - `eyebrow` — `0.6875rem`, tracking 0.18em, uppercase (kicker labels above headings)
- **Body sizes in practice** (not tokenized, used as literal Tailwind arbitrary values throughout):
  `text-[0.9375rem]` (15px) is the dominant body/paragraph size; `text-[0.8125rem]` (13px) for
  captions/helper text/breadcrumbs; `text-sm` (14px) for button/nav labels.

Confirmed sufficient for Phase 2/3 — no new font families needed. Extension guidance for dashboards
and tables (dense data contexts): use `font-sans` (DM Sans) for table body copy and form inputs as
today; reserve `font-display` (Manrope) for headings, button/tab labels, and badge text, matching
current usage exactly. Do not introduce a monospace font for IDs/reference numbers unless a real
tabular-data density problem shows up — DM Sans's numerals are already reasonably tabular at body
sizes.

---

## 4. Spacing & Layout

- **Container:** `Container.tsx` — `max-w-content` (1200px), horizontal padding `px-5` (mobile) →
  `sm:px-8` → `lg:px-10`. Every new page-level pattern (admin tables, portal dashboards) should sit
  inside the same `Container`, or a wider variant introduced deliberately (see §11) rather than a
  bespoke width.
- **Section rhythm:** the `.kamosa-section` utility class (`index.css`) sets vertical padding to
  `clamp(64px, 8vw, 120px)` — applied on every marketing section (`ServicesGrid`, etc.). Dashboard
  and portal screens are denser by nature and should **not** use `.kamosa-section` — use a tighter,
  fixed vertical rhythm instead (recommend `py-8` to `py-12` for dashboard sections, not clamp-fluid,
  since admin screens don't need hero-scale breathing room).
- **Card padding:** `p-8` on desktop service cards, `p-7 sm:p-10` on the contact form card — i.e.
  roughly 28–40px depending on density. New admin/portal cards (tender listing, course card) should
  use the tighter end of that range (`p-6`–`p-7`) since they'll appear in denser grids.
  `max-w-prose` (62ch) already exists for body copy measure — reuse for FAQ answers, resource
  descriptions.
- **Border radius:** deliberately restrained and mostly square — `sm` 2px, `DEFAULT` 3px, `md` 4px,
  `lg` 6px. This is a sharp-edged, editorial look, not a rounded SaaS look. New components (modals,
  tables, badges) must stay within this scale — do not introduce `rounded-xl`/`rounded-2xl`
  anywhere; the largest radius in the whole system is 6px.
- **Shadows:** `shadow-card` (very subtle resting elevation), `shadow-lift` (hover elevation on
  cards), `shadow-nav` (1px bottom line, used for the scrolled navbar). New elevated surfaces
  (dropdowns, modals, toasts) should use `shadow-lift` for their resting state — nothing in this
  system should look "floatier" than the existing card hover state.

---

## 5. Buttons

From `Button.tsx` (`ButtonLink`, `ButtonAnchor`, `Button` — three components sharing one class
builder, `variant` + `inverted` + `withArrow` props):

- **Variants:** `primary` (brand-600 fill, white text, hover → `ink-700` — note: hover is *not* a
  darker red, it shifts to near-black, keeping red exclusively as the "resting/actionable" cue),
  `secondary` (gold/lime fill, ink text, hover → gold-soft), `outline` (hairline border, hover →
  ink border + cream fill), `text` (no padding, ink text, hover → brand-600, or gold when
  `inverted` on a dark background).
- **Focus-visible:** already implemented sitewide (fixed in the prior audit pass) —
  `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
  focus-visible:outline-current`, i.e. the outline color always matches the button's own text
  color. Any new interactive component (badge-as-button, table row action, tab) must follow this
  same "outline-current" pattern rather than a fixed outline color, so it auto-adapts on colored
  buttons.
- **Disabled:** `disabled:cursor-not-allowed disabled:opacity-60` — already implemented on
  `Button`. Apply the same pair of classes to any new disabled control (form inputs, table row
  actions) for consistency.
- **Loading (new for Phase 2 forms):** `ContactForm.tsx` already establishes the pattern to reuse
  verbatim — keep the button's own width/label slot, swap the label for
  `<Loader2Icon className="h-4 w-4 animate-spin" /> + "<Verb>ing…"` text, set `withArrow={false}`,
  and set `disabled` while submitting. Do not introduce a separate spinner-only button state or an
  overlay spinner — the existing pattern (spinner inline, before the in-progress label) is the one
  precedent and should become the standard for every async submit button (tender application
  submit, training registration, admin save actions).
- **Icon-only buttons (new, needed for table row actions/admin toolbars):** not yet precedented in
  the codebase. Recommendation: same base class, square `p-2.5` sizing instead of `px-6 py-3.5`,
  `aria-label` required since there's no visible text, otherwise identical hover/focus/disabled
  treatment to `outline` variant.

---

## 6. Forms

`ContactForm.tsx` is the only form in the codebase today and is the reference pattern for every new
form (enquiry variants, tender application, training registration, admin CRUD forms):

- **Field shell:** `rounded-sm border border-hairline bg-white px-4 py-3.5`, label above field
  (`font-display text-[0.8125rem] font-semibold`), 2-column grid on `sm:` breakpoint collapsing to
  1 column on mobile.
- **Required-field indication:** a `<span className="text-gold">*</span>` immediately after the
  label text — accent color, not red, so the required marker never competes visually with the
  brand-red CTA below the form. Keep this exact pattern for every new form.
- **States:**
  - Default: `border-hairline`.
  - Hover: `hover:border-muted/50`.
  - Focus: `focus:border-brand-600` — the one place outside CTAs where brand red legitimately
    appears, as a focus indicator, which is a widely-understood convention distinct from "danger."
  - Error: currently hardcoded `border-[#B3261E]`, both resting and hover — should migrate to the
    new `error-600` token (§2.2) once added to Tailwind config, no visual change, just detokenizing.
    Paired with `aria-invalid` and `aria-describedby` pointing at an inline `<FieldError>` (icon +
    message, `text-[#B3261E]` → `text-error-600`).
  - Disabled: not yet precedented — recommend `disabled:cursor-not-allowed disabled:opacity-60`,
    matching `Button`'s disabled treatment, plus `disabled:bg-cream/40` so a disabled field reads
    visually inert against the white card background.
- **Validation message pattern:** inline, per-field, below the field, with an `AlertCircleIcon` +
  message, `role` implied by proximity + `aria-describedby` (not `role="alert"` on every field —
  only the form-level submit result uses `role="status" aria-live="polite"`, which is correct and
  should be kept as the single announced region per form, not one live region per field).
- **Submission outcome:** the existing three-state `<Notice>` pattern (`success` / `error` / `info`
  for "not yet configured") is the right shape for every new form's post-submit state. Per §2.2,
  route `success` to the new `success-600`/`success-50` tokens instead of `brand-600`, and `info` to
  `info-600`/`info-50` instead of `gold`, once those tokens exist — keeps the "red = action only"
  rule intact even in form feedback.

---

## 7. Cards

**Existing patterns** (`ServiceCard.tsx`, and the same shell reused for industry cards): white
surface, `border border-hairline`, hover → `-translate-y-1` + `border-ink-900/25` +
`shadow-lift`, `ease-editorial` timing. A "featured" variant spans a wider grid cell with a 2-column
internal split (copy + image). Both variants share: an eyebrow-style number/kicker, `gold` bullet
list, and a `brand-600` text CTA with an arrow icon that nudges on hover.

**New card patterns needed — all should reuse the same shell (white, `border-hairline`, hover-lift,
`p-6`–`p-7`) with pattern-specific content:**

- **Tender listing card:** kicker = tender reference number (style like `service.number`), title,
  1–2 line summary, a **status badge** (§9) top-right where `ServiceCard` puts its "Core discipline"
  pill (`rounded-sm bg-cream px-2.5 py-1 ... text-brand-600` today — for tenders this slot must use
  the new neutral/status badge colors, never brand red, since "Open"/"Closed" is a status, not a
  CTA), closing-date line, "View tender" text-link CTA in the existing `brand-600` arrow style.
- **Training course card:** kicker = course category, title, summary, a metadata row (duration,
  delivery mode, next date) styled like the bullet list (`gold` dot markers), CTA "Register
  interest."
  - Full-bleed image variant should reuse the featured `ServiceCard`'s image treatment
    (`object-cover`, `bg-ink-900/15 mix-blend-multiply` overlay) if a course photo is used.
- **Resource download card:** kicker = file type/category (PDF, guide, etc.), title, short
  description, file-size/date metadata, CTA styled as `outline` button variant (secondary action —
  a download isn't the site's primary conversion action) rather than a red primary CTA.
- **FAQ accordion item:** not a card in the bordered sense — a hairline-bottom-bordered row
  (`border-b border-hairline`), question as a button (full row, `font-display font-semibold`,
  chevron icon that rotates on open, reusing the `ease-editorial` transition already used for the
  breadcrumb chevron in `PageHeader`), answer in `text-muted` body copy, `max-w-prose`. Must be a
  real disclosure (`<button aria-expanded>` + `aria-controls`), not a `:hover` reveal.
- **Blog post card:** same shell as `ServiceCard`'s non-featured variant — image (or none), kicker
  = category/date, title (`display-sm`-adjacent weight), summary, "Read article" text CTA.

---

## 8. Navigation

- **Navbar (existing, `Navbar.tsx`):** fixed, transitions from transparent-on-white to a
  blurred/bordered state on scroll (`shadow-nav`), skip-link present, active route styled with
  `text-brand-600` + an animated `gold` underline that scales in from `scale-x-0`. Primary CTA
  ("Request an Enquiry") is a filled `brand-600` button inline in the header, hidden below `sm:`.
- **Mobile menu (`MobileMenu.tsx`):** triggered by a hamburger icon, closes automatically on route
  change (`useEffect` on `pathname`).
- **Breadcrumbs (existing, `PageHeader.tsx`):** already built and should be reused as-is for every
  new deep page (tender detail, course detail, resource detail) — `nav aria-label="Breadcrumb"`,
  chevron separators, "Home" always first, current page as a non-link `aria-current="page"` span,
  all in the dark `PageHeader` band. Portal/admin pages that don't use the marketing `PageHeader`
  (see below) still need breadcrumbs but on a light background — recreate the same markup pattern
  with ink-toned colors instead of the white/70 tones tuned for the dark banner.
- **New: admin dashboard sidebar nav.** No existing precedent (the old admin panel was deleted
  entirely for the hardcoded-password security hole — this is a from-scratch build, not a restyle).
  Recommendation, staying inside the existing visual language: fixed-width left sidebar,
  `bg-ink-900` (reusing the same dark tone as `PageHeader`/footer rather than inventing a new dark
  shade), white/70 inactive labels, white + `gold` left-border-accent for the active item (parallel
  to the navbar's gold underline, rotated 90°), icons from `lucide-react` (already the icon library
  in use everywhere else — do not add a second icon set), collapsible to icon-only rail below a
  breakpoint rather than becoming a hamburger (persistent dashboard nav shouldn't fully hide).
- **New: tab navigation for portal.** Reuse the navbar's active-state pattern: underline that
  scales in on the active tab (`gold`, `scale-x-100`/`scale-x-0`, `ease-editorial`), inactive tabs
  in `text-ink-900/70` hover `text-brand-600`. Horizontal, scrollable on mobile with no visible
  scrollbar rather than wrapping or collapsing into a select.

---

## 9. Status Badges (new component)

No badge component exists yet beyond the one-off "Core discipline" pill in `ServiceCard.tsx`
(`rounded-sm bg-cream px-2.5 py-1 font-display text-[0.6875rem] font-semibold uppercase
tracking-[0.12em] text-brand-600`). That pill is a *category* label on a card the CTA itself lives
on, so brand red is acceptable there. **Status badges are a different job — signaling state, not
branding a CTA — and must not reuse brand red**, per the audit's explicit instruction that
`brand-600` should never carry a second, conflicting meaning.

**Shape:** reuse the exact pill geometry (`rounded-sm px-2.5 py-1 font-display text-[0.6875rem]
font-semibold uppercase tracking-[0.12em]`), swap only the color pair (background wash + text) per
status family below, using the tokens from §2.2:

| Status family | Example values | Background | Text |
|---|---|---|---|
| Tender | Open | `success-50` | `success-600` |
| Tender | Closing Soon | `warning-50` | `warning-600` |
| Tender | Closed | `neutral-100` (cream) | `neutral-600` (muted) |
| Tender | Awarded | `success-50` | `success-600` (same as Open — "won" is a good outcome; distinguish with a small trophy/check icon inside the badge, not a different hue, to avoid a 5th color family) |
| Tender | Archived | `neutral-100` | `neutral-600` |
| Training | Upcoming | `info-50` | `info-600` |
| Training | Open for registration | `success-50` | `success-600` |
| Training | Full | `warning-50` | `warning-600` |
| Training | Completed | `neutral-100` | `neutral-600` |
| Enquiry | New | `info-50` | `info-600` |
| Enquiry | In Progress | `warning-50` | `warning-600` |
| Enquiry | Resolved | `success-50` | `success-600` |

This gives every domain (tender/training/enquiry) the same four-color vocabulary
(success/warning/info/neutral) rather than a bespoke palette per feature, and none of the twelve
rows above touch `brand-600` — including "Closed," which is exactly the case the audit called out
by name as a trap to avoid.

---

## 10. Modals & Dialogs (new)

No precedent in the codebase. Needed for: admin confirmations (delete tender, archive enquiry) and
document viewers (viewing an uploaded tender document, a safety file PDF).

- **Surface:** white, `shadow-lift`, sharp corners per §4 (`rounded-md` at most, 4px — not the
  rounded-2xl a generic dashboard template would default to), centered, `max-w-content`-scale for
  document viewers, a narrower fixed width (~420–480px) for confirmation dialogs.
- **Scrim:** `bg-ink-900/60` — reuse the exact opacity value `PageHeader` uses for its image
  overlay (`bg-ink-900/85`, slightly darker since a modal scrim needs to recede the whole page, not
  just tint a hero image) rather than introducing a separate black.
- **Confirmation dialogs:** title (`font-display font-bold`), body copy (`text-muted`), two actions
  — a destructive confirmation should use the `outline` button variant styled with `error-600`
  border/text rather than `brand-600`, precisely so a "delete this tender" action is never visually
  identical to "submit this enquiry." Cancel = `text` variant.
- **Document viewer:** header bar with filename + close icon-button (§5), body scrolls
  independently of the page, footer with a `secondary`-style download action.
- **Focus management:** trap focus within the dialog, return focus to the trigger on close, `Esc`
  closes, matching the accessibility bar already set by the skip-link and focus-visible work done
  in the prior audit pass.

---

## 11. Tables (new)

No precedent. Needed for admin lists — enquiries, tenders, registrations.

- **Container:** break out of the 1200px `Container` for wide tables (recommend a dedicated
  `max-w-[1440px]` admin shell rather than forcing dense data into the marketing-site's content
  width) but keep the same side-gutter logic (`px-5`/`sm:px-8`/`lg:px-10`).
- **Row surface:** white rows separated by `border-hairline` (not `shadow-card` per row — reserve
  elevation for cards, keep tables flat and dense), header row `bg-cream` with
  `font-display text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-ink-900/70` labels,
  matching the eyebrow typographic treatment used everywhere else.
  - Add a hover wash on data rows (`hover:bg-cream/50`) for scanability, not `hover:-translate-y`
    (that lift effect is a card-grid affordance, wrong for dense table rows).
- **Sortable headers:** header label + small chevron/arrow icon (lucide, consistent with the arrow
  icons already used on buttons/cards), `gold` when actively sorted, `muted` otherwise — no new
  interaction pattern needed beyond icon color swap.
- **Filters:** reuse the exact form field shell from §6 (`fieldClass` styling) for filter
  dropdowns/search inputs sitting above the table.
- **Pagination:** simple prev/next + page count using icon-only buttons (§5) rather than a numbered
  page-picker, to keep the control vocabulary small.
- **Status column:** always render the §9 badge component, never plain colored text — keeps status
  meaning consistent between tables, cards, and detail pages.

---

## 12. Alerts & Toasts

`ContactForm.tsx`'s `<Notice>` component (§6) is the base pattern: `border + wash + icon + text`,
one of three tones today (`success`/`error`/`info`), `role="status" aria-live="polite"` on the
containing region. Extend rather than replace:

- Add a fourth tone, `warning`, using `warning-50`/`warning-600` (§2.2) — needed for admin actions
  like "this tender closes in 24 hours" or bulk-action warnings.
- **Toasts (new — transient, corner-anchored notifications for admin actions like "Tender saved"):**
  same tone/color/icon system as `Notice`, same `rounded-sm` + `border` shell, but positioned
  fixed bottom-right, auto-dismiss after ~5s with a manual close (×) icon-button, stacked with
  `gap-3`, entrance/exit as a functional slide+fade (see §16 — this is one of the few places
  motion is functional, not decorative, so it's allowed to animate even in reduced-motion-lean UI,
  though it must still respect `prefers-reduced-motion` by cross-fading instead of sliding).
- **Inline alerts** (persistent, page-level — e.g. "This tender is closing soon" banner at the top
  of a detail page) reuse the exact `Notice` shell full-width instead of centered in a form.
- Keep the existing convention: icon + tone always paired (`CheckCircle2Icon`/success,
  `AlertCircleIcon`/error, `InfoIcon`/info, add `AlertTriangleIcon`/warning — all already available
  in `lucide-react`, already a project dependency, no new icon set needed).

---

## 13. Empty States (new)

No precedent (a static brochure site has no empty-data screens). Needed for: "no tenders yet," "no
resources in this category," "no training courses scheduled," empty admin tables.

- **Pattern:** centered within the content area (not full-viewport), generous vertical padding
  (`py-16`–`py-20`, echoing `.kamosa-section`'s breathing room, but capped — not the full fluid
  clamp, since this is a state within a page, not a marketing section), a muted line-icon from
  `lucide-react` (`h-10 w-10 text-muted/50`), a short `font-display font-bold` headline ("No
  tenders open right now"), one line of `text-muted` supporting copy, and — where relevant — a
  single `outline` or `text` variant CTA (e.g. "Browse all services" or "Check back soon"). Do not
  use a `primary` red button in an empty state; there is usually no urgent primary action to take.
- **Admin table empty state:** same pattern, inline within the table's body region rather than
  replacing the whole page, with copy specific to the active filters ("No enquiries match these
  filters" + a "Clear filters" `text` link) versus true emptiness ("No enquiries yet").

---

## 14. Loading States (new)

Current site has none — everything is static, so this is greenfield. Two needs: **skeletons** for
predictable-shape async content (tender lists, dashboard tables) and **spinners** for actions
(already precedented by the button loading state, §5).

- **Spinner:** reuse `Loader2Icon` + `animate-spin` exactly as `ContactForm.tsx` does — this is now
  the one and only spinner pattern in the system; don't introduce a second spinner component/style.
- **Skeletons:** flat `bg-cream` (or `bg-hairline` for a slightly lighter placeholder on white
  surfaces) blocks with `rounded-sm` corners matching real content's radius, `animate-pulse` — sized
  to mirror the real component's shape (e.g. a tender-card skeleton = kicker-bar + title-bar ×2 +
  badge-block, matching §7's tender card layout) so layout doesn't jump on load. Must respect
  `prefers-reduced-motion` — `index.css`'s existing reduced-motion block already forces all
  `animation-duration` to `0.001ms`, which will flatten `animate-pulse` automatically; no extra work
  needed, just don't fight that rule with an inline duration override.
- **Full-page/route-level loading:** a centered spinner + `sr-only` "Loading…" text is sufficient
  for route transitions (portal/admin); do not build a branded full-screen splash animation — it
  would be decorative motion in a place motion should stay functional (§16).

---

## 15. Mobile Behavior

The existing responsive approach is Tailwind's standard mobile-first breakpoints with no custom
breakpoints defined (none in `tailwind.config.js` — defaults are in play: `sm` 640, `lg` 1024,
etc.), and `Container.tsx`'s three-step padding (`px-5` → `sm:px-8` → `lg:px-10`) as the one
consistent horizontal-gutter rule referenced everywhere. Every pattern above should follow the same
approach rather than inventing per-component breakpoints:

- **Cards/grids:** collapse from `lg:grid-cols-3`/`md:grid-cols-2` to single column below their
  breakpoint, exactly as `ServicesGrid` does today. New card grids (tenders, courses, resources)
  follow the same `grid gap-6 md:grid-cols-2 lg:grid-cols-3` shape.
  - Featured/split cards (image + copy side-by-side at `lg:grid-cols-[1.15fr_0.85fr]`) stack to a
    single column below `lg`, image on top — same as today's `ServiceCard` featured variant.
- **Forms:** `sm:grid-cols-2` → single column below `sm`, as `ContactForm.tsx` already does.
- **Navbar → mobile menu:** hamburger replaces the inline nav list below `lg`; the primary CTA
  button hides below `sm` in favor of the hamburger + full CTA inside the mobile menu itself — keep
  this exact swap point for any new persistent-header pattern (e.g. a portal header).
- **Admin sidebar:** collapses to a bottom tab bar or an off-canvas drawer (triggered like
  `MobileMenu`, not a second, different mobile-menu pattern) below `lg` — do not keep a full
  labeled sidebar visible on mobile; icon-rail collapse (§8) is a tablet/narrow-desktop behavior,
  full hide-behind-a-trigger is the phone behavior.
- **Tables:** the one place a straight breakpoint-collapse doesn't work well. Recommendation: below
  `md`, switch each row to a stacked card (label: value pairs) reusing the §7 card shell, rather
  than horizontal-scrolling the raw table — horizontal scroll on data tables is a common source of
  "hidden," undiscoverable columns and should be avoided for the admin's primary lists.
- **Modals:** below `sm`, confirmation dialogs go full-width with safe-area bottom padding rather
  than staying a small centered box; document viewers go full-screen.
- **Toasts:** anchor bottom-center full-width (minus gutter) on mobile instead of bottom-right,
  so they don't get clipped by iOS Safari's bottom chrome.

---

## 16. Motion

- **Existing pattern — `Reveal.tsx`:** a scroll-triggered fade+rise (`opacity 0→1`, `y: 18→0`,
  `duration 0.45`, `ease [0.23,1,0.32,1]` — the same curve as `transitionTimingFunction.editorial`
  in Tailwind config, so JS-driven and CSS-driven motion use one shared easing curve site-wide),
  staggered by an `index` prop (60ms/step, capped at 5 steps), fires once via
  `whileInView`/`viewport={{ once: true }}`. This is `framer-motion`'s only real usage today beyond
  `useReducedMotion`.
- **Reduced motion — already handled at two layers, both must stay intact:**
  1. `Reveal.tsx` calls `useReducedMotion()` and renders a plain static tag (no animation props at
     all) when the user prefers reduced motion — not just a shorter duration, a full bypass.
  2. `index.css` has a global `@media (prefers-reduced-motion: reduce)` block forcing all CSS
     animations/transitions to `0.001ms` — a safety net for anything that isn't `Reveal`-wrapped
     (button hovers, nav underline, etc.).
- **Guidance for new dashboard/portal UI — motion should mostly not be decorative there:**
  `Reveal`'s scroll-fade pattern is a marketing-site device for pacing a long scroll of sections; it
  is **not** appropriate on admin tables, dashboard widgets, or portal lists — content that loads
  once and is scanned/worked with repeatedly shouldn't re-animate in on every visit, and staggering
  50 table rows would actively slow down task completion. Reserve `Reveal` for genuinely
  marketing/editorial surfaces (a portal's own marketing landing page, a resource library's public
  listing) and skip it entirely inside authenticated dashboard/admin screens.
- **Functional transitions are still welcome everywhere,** using the same `ease-editorial` curve
  and the existing ~200ms duration convention already used for hover/focus states
  (`duration-200 ease-editorial` appears on nearly every interactive element in `Button.tsx`,
  `Navbar.tsx`, `ServiceCard.tsx`): dropdown open/close, modal enter/exit, toast slide-in, accordion
  expand/collapse, tab underline movement, table row hover wash. These communicate state change and
  should stay — they're mechanically the same category as the already-shipped nav-underline
  animation, not new decorative motion.
- **New motion must go through the same two reduced-motion layers:** anything built with
  `framer-motion` should call `useReducedMotion()` like `Reveal` does; anything built with plain
  CSS transitions/animations is already covered by the global `index.css` rule and needs no extra
  work, provided durations aren't set via inline `!important`-overriding styles that could escape
  it.

---

## Summary for implementers

Nothing above changes brand identity. Red (`brand-600`) stays the one and only "primary action"
color, verified against the real logo, matching the prior audit's explicit, already-shipped
decision. Everything new — status badges, alerts, toasts, form validation — gets its own
non-red, non-gold color family (success/warning/error/info/neutral) specifically so "Closed,"
"error," and "click here" never look like the same color again anywhere in the product.
