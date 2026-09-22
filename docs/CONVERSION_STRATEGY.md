# Kamosa Platform — Conversion & Lead Generation Strategy

Author: Conversion / Lead Generation Specialist pass. Written 2026-09-22.
Companion docs (do not duplicate): `docs/CONTENT_MAPPING.md` (page copy), `docs/DESIGN_SYSTEM.md`
(visual components), `docs/IMPLEMENTATION_PLAN.md` (sitemap, feature matrix, phasing).
Source of truth for all facts used as trust signals: `docs/KAMOSA_COMPANY_PROFILE.md`.

**Scope of this document:** not what the pages say (Content Mapping) or what components look like
(Design System) — where CTAs sit, how forms are sequenced, and how trust is built using only
confirmed facts. Every recommendation below was checked against the company profile's confirm-list
before being written. Where a normal conversion-optimization instinct would require fabricated
proof (a testimonial carousel, a "trusted by 200+ clients" stat, a fake urgency countdown), that
instinct is named and explicitly rejected below, not quietly worked around.

---

## 0. The core constraint, stated plainly

Kamosa has no testimonials, no client logos, no case-study numbers, no awards, and no address to
publish. It has real, checkable credentials (B-BBEE Level 1, CSD registration, SACPCMP-registered
leadership) and one specific, confirmed body of work (Eskom Medupi/Lethabo/Matla, at plant-name
level only). The entire strategy below is built on the premise that **credential density and
specificity substitute for social proof** — a first-time visitor who can't see "50 happy clients"
can instead see a CSD number they could look up themselves, which is arguably more credible to a
procurement officer than a testimonial would be anyway. This is a B2B/B2G compliance-and-safety
buyer, not a consumer — that buyer trusts verifiable registration numbers more than star ratings.

---

## 1. CTA Hierarchy and Placement, Per Page Type

Rule across all pages: **one primary CTA, one secondary CTA, repeated at most twice per page**
(once near the top, once at the natural end-of-content point). No page should show the same CTA
label more than twice — that is the CTA-fatigue failure mode explicitly flagged in the brief.

| Page type | Primary CTA | Where | Secondary CTA | Where |
|---|---|---|---|---|
| Homepage | "Request a Quote" | Hero, right after the value prop | "WhatsApp Us" | Hero, as a visually distinct second option next to primary (not stacked below it) |
| Service page (5x) | "Request a Quote" (pre-selects that service) | Directly under the "What's Included" list — the moment the visitor has just read what they'd be buying | "Ask a Question" (opens WhatsApp with service pre-filled as context, or falls to `/contact`) | Bottom of page, after Problems Addressed |
| Industry page (7x) | "Request a Quote" (pre-selects the 1–2 services flagged as relevant to that sector) | End of page, after the sector overview and relevant-services list | "View [Service] Details" links | Inline, contextual, pointing into the relevant service pages — these are navigation, not conversion CTAs, and shouldn't be counted against the 2-CTA budget |
| Credentials page | "Request Company Profile" (the gated PDF) | After the credentials list, positioned as "take this with you" | "Request a Quote" | Footer of page only, not competing with the primary |
| Tender listing (`/tenders`) | "View Tender" (per listing card, into detail page) | Per card | — | n/a — listing pages route, they don't convert directly |
| Tender detail (`/tenders/:slug`) | See Section 8 — differs from consumer lead-gen | | | |
| Training course page | "Register for This Course" | Directly under course details, above the fold if possible | "Ask a Question" (WhatsApp) | Bottom of page |
| Resource/download page | "Download" (the resource itself) | Primary content action | "Request a Quote" | Only shown after download starts/completes, not competing before it (see Section 3 for the profile-download-specific pattern, which generalizes to other resources) |
| Blog/Insights post | "Related Service" contextual link (not a hard CTA) | Inline, where topically relevant | "Request a Quote" | End-of-article only, low-pressure, framed as "if this is relevant to your site/project" |
| Admin/Portal pages | n/a | These are not conversion surfaces | | |

**Anti-pattern explicitly rejected:** repeating "Request a Consultation" in the hero, mid-page,
sidebar, and footer of a single service page. Cap is two placements, two different framings if
they're the same underlying form (e.g., "Request a Quote" in-content, "WhatsApp Us" as the
alternate channel) — never the identical label three-plus times.

---

## 2. Form Friction Reduction — Per Form Type

General principle: **field count should track buying-intent, not data-collection ambition.** A
low-intent surface (profile download) asks almost nothing; a high-intent surface (quote request)
can ask more because the visitor has already signalled they want a real conversation.

### Contact form (`/contact` — general enquiry)
- **Single-page, 4 fields:** Name, Email, Phone (optional), Message.
- No service dropdown here — that's what `/request-a-quote` and `/request-service` are for. Keep
  `/contact` as the low-friction catch-all.
- No multi-step needed; this is already minimal.

### Request-a-quote (`/request-a-quote`) — dynamic per service
- **This is the highest-intent form on the site and the one place extra fields are earned.** See
  Section 5 for the full flow recommendation (wizard, not single long form).
- Always-required, regardless of service: Name, Company/Organisation, Email, Phone, Service
  selection.
- Service-specific fields (per the plan's existing spec) are **nice-to-have, not required** —
  mark them optional with a one-line note ("Helps us prepare a more accurate quote — skip if
  unsure"). Forcing a site visitor to know exact worker count or exact PPE quantity before they can
  submit is a guaranteed abandonment point; Kamosa's own six-stage methodology starts with
  DISCOVER, i.e., asking these questions is supposed to be a conversation, not a form gate.
- Required subset per service (everything else in that service's field set stays optional):
  - **H&S:** Site type, general location (province/city, not full address) — required. Worker
    count, duration, docs needed, compliance status — optional.
  - **Training:** Course of interest, approximate participant count — required. Preferred date,
    location, organisation type — optional.
  - **Procurement:** Category (PPE/tools/signage — matching the confirmed three), approximate
    quantity — required. Delivery location, delivery date — optional.
  - **Business Consulting / Environmental (associate):** No dynamic sub-fields beyond a free-text
    "what are you looking to achieve" box — these two services don't have the structured
    quantity/date shape the other three do, and forcing a fake structure onto them would be worse
    than an open text field.

### Request-service (`/request-service`)
- Reuses the enquiry pattern, not the quote pattern — this is "I know what I want, contact me,"
  lighter than a quote. **Single-page, 5 fields:** Name, Email, Phone, Service (dropdown), brief
  description (free text). No dynamic per-service question sets here — that's what
  differentiates it from `/request-a-quote` and keeps it genuinely lighter.

### Tender interest / tender clarification (on `/tenders/:slug`)
- Two distinct, separate, smaller actions — do not merge them into one form (see Section 8).
- **Tender interest:** Name, Company, Email, Phone, which tender (pre-filled/hidden field). 4
  visible fields. This is a "notify me / register interest" action, not a proposal submission —
  keep it that light.
- **Request clarification:** Name, Email, Company, the specific question (free text). 4 fields.
  Single-page, no reason to complicate a Q&A request.

### Training registration (`/training/:slug`)
- **Single-page, not multi-step** — registration intent is already high by the time someone
  reaches this form (they've picked a specific course and date).
- Required: Name, Email, Phone, Organisation, Course + date (pre-filled from the page), number of
  participants.
- Optional: dietary/accessibility requirements (only show if relevant to in-person training),
  additional notes.
- Do not ask for payment details at this stage unless Kamosa has a confirmed payment flow — the
  plan doesn't mention one; registration should capture intent and let Kamosa follow up to
  invoice/confirm, consistent with the profile's relationship-led, consultative positioning.

### Company profile download (gated lead form)
- See Section 3 — this is a special case, not a standard form.

### General sequencing rule
- **No form on this site should be multi-step except the quote request wizard (Section 5).**
  Every other form listed above is short enough (4–7 fields) that breaking it into steps would add
  friction (more taps/clicks, more chances to abandon between steps) without a real UX benefit.
  Multi-step is earned by field count and conditional complexity — only the quote form has both.

---

## 3. The Company Profile Download — Recommended Pattern

**Recommendation: soft-gate, not a hard paywall, and not truly frictionless-with-an-optional-form
either — a genuine middle position.**

Reasoning:
- A fully optional form (download button always works, form is cosmetic) collects almost no leads
  in practice — visitors will skip an optional form nearly every time, which defeats the stated
  purpose in the feature matrix ("Company profile download (gated) ... lead-capture form").
- A hard paywall (must complete form, no download otherwise) risks exactly what the brief warns
  against: annoying a first-time visitor over what is, for Kamosa, effectively a marketing
  document, not something proprietary or sensitive. For a small business trying to build a first
  impression, a wall in front of "tell me who you are" reads as needy.
- The right pattern: **the download button is visible and always present, but clicking it opens a
  lightweight inline form (not a redirect to a separate page) that must be completed to receive the
  file** — a "soft gate" in the specific sense that the form is short (4 fields: Name, Company,
  Email, reason-for-interest as an optional dropdown — not phone, which is unnecessary friction for
  a document download), takes under 15 seconds, and the copy explicitly frames the value exchange:
  *"Enter your details and we'll email you the full company profile (PDF) — this also lets us
  follow up if it's useful."* That framing (help us serve you better, not "unlock content") matches
  the profile's own consultative, non-pushy tone (Section on Style/Voice in Content Mapping:
  "practical," "responsive," never pushy marketing language).
- Do not require phone number on this form specifically — email is enough to deliver the PDF and
  follow up; phone is one field too many for a document download and belongs on higher-intent forms
  (quote, training registration) instead.
- This is a real lead-capture mechanism (satisfies the business need in the feature matrix) while
  staying proportionate to how low-commitment "download a company profile" actually is as a buying
  signal.

---

## 4. Trust-Building Without Fake Social Proof

**What's available (all confirmed, all usable):**
1. Level 1 B-BBEE Contributor — 135% procurement recognition
2. 100% Black Female Owned
3. Registered South African company (2023/164644/07), active CSD supplier (MAAA1465904)
4. SACPCMP-registered Construction Health and Safety Manager leading the company
5. SAIOSH member (leadership)
6. Six-plus years of hands-on multi-sector SHE experience
7. The Eskom Medupi/Lethabo/Matla work — named at plant level, confirmed
8. Certified Fall Protection Plan Developer; registered Assessor/Moderator/Facilitator
9. Four integrated service lines under one provider (fewer vendors for a client to manage)

**What must never appear, even reframed:** star ratings, "trusted by," client counts, logos,
before/after stats, testimonial quotes attributed to anyone, an "our clients" section of any kind,
manufactured urgency ("only 2 slots left this month" — no such scarcity is confirmed).

**Placement and sequencing, by prominence:**

- **Header/hero credential strip (every page, not just homepage):** a compact, persistent strip —
  "Level 1 B-BBEE · 100% Black Female Owned · CSD Registered" — three items, small, next to or
  under the primary nav or hero, not a full section. This is the highest-frequency exposure point
  and should carry only the three shortest, most scannable facts. Do not put the Eskom names here —
  too long for a strip, and their power comes from a dedicated read, not a glance.
- **Homepage, dedicated credentials-and-experience block (below the fold, above the fold on
  mobile-scroll-length terms):** expand to all nine items above, in two groups — "Credentials"
  (B-BBEE, CSD, company registration, ownership) and "Experience" (six-plus years, Eskom
  Medupi/Lethabo/Matla, SACPCMP leadership). This is the second-highest-value placement: a visitor
  who scrolled past the hero is evaluating, and this is the moment to give them the full case.
- **Dedicated `/credentials` page (already planned):** the fullest, most literal treatment —
  present each credential with what it verifiably means (e.g., "Level 1 B-BBEE Contributor — the
  highest possible B-BBEE rating, giving clients 135% procurement recognition"), and explicitly
  render TCS status as "Information to be confirmed" per the confirm-list rather than omitting it —
  an honestly-flagged gap is itself a small trust signal (it shows the site isn't hiding anything,
  it's just accurate about what's pending).
- **Service page sidebars/asides:** one line only, contextual to that service — e.g., on the
  Health & Safety page, lead with "Led by a SACPCMP-registered Construction Health and Safety
  Manager"; on Procurement, lead with "CSD Registered — MAAA1465904." Match the credential to the
  service instead of repeating the full list everywhere (repetition of the *same* full credential
  block on every page dilutes it the same way CTA repetition does).
- **Industry pages — Energy specifically:** this is the one place the Eskom work should be stated
  at more than passing mention, since it's the most concrete, specific proof Kamosa has. State it
  plainly (plant names, nature of work) and stop exactly where the confirm-list stops (no client
  company name, no values, no dates) — do not visually "hero" it with a stat callout box implying
  more than what's confirmed (no "X years on Eskom projects," no "X incidents prevented").
- **Footer (every page):** the shortest possible line — company registration number, CSD number,
  B-BBEE level — functioning as a persistent, low-key credibility anchor rather than a promotional
  one. This is where a procurement/compliance reviewer will look first out of habit; it should be
  there, factual, unstyled-as-marketing.
- **Explicitly not recommended, and why:** a "Why Choose Kamosa" carousel or a stats-counter
  animation (e.g., animated "6+ Years" ticking up) — visually implies the genre of proof (metrics,
  scale) the company doesn't have quantities of. Static, plainly stated facts read as more honest
  for this specific credential set than an animated stats block would, which is itself a form of
  overclaiming through design even if the underlying number is true.

---

## 5. The Quote-Request Flow — Recommendation: Step-by-Step Wizard

**Call: a short wizard (service selection first, then dynamic questions, then contact details
last), not one long form with JS-toggled conditional fields.**

Reasoning:
- With four different service-specific question sets (H&S, Training, Procurement, plus the lighter
  Consulting/Environmental path), a single-page conditional form either shows a long empty form
  before any service is picked (bad first impression, visitor doesn't know how long this will take)
  or requires scrolling past irrelevant hidden fields even when collapsed. A wizard avoids both.
- Recommended steps:
  1. **Step 1 — Service selection.** Large, clickable service cards (not a dropdown — a dropdown
     hides the choice architecture; cards let the visitor confirm this is the right form before
     investing time). Selecting a service immediately shows a one-line "here's what we'll ask
     next" preview, so there's no surprise-length anxiety.
  2. **Step 2 — Service-specific questions.** Only that service's fields, required ones first,
     optional ones visibly marked and skippable. A visible progress indicator ("Step 2 of 3") sets
     expectations and reduces the biggest driver of multi-step abandonment (not knowing how much is
     left).
  3. **Step 3 — Contact details + submit.** Name, Company, Email, Phone. This is deliberately last
     — the visitor has already invested effort describing their need, which increases completion
     likelihood on the final, lowest-effort step (this is a standard, well-evidenced sequencing
     principle: ask for identity after effort, not before).
- **Do not require account creation or email verification before submission** — this is a lead
  form, not a portal signup; adding an auth step here would contradict the entire point of lowering
  friction on the highest-intent conversion point in the plan.
- Each step should be resumable within the session (state kept in the form, not lost on back/
  forward) but does not need to persist across visits — this is a short flow, not a long
  application.
- Allow "skip to contact" from Step 1 for a visitor who just wants someone to call them without
  answering service-specific questions at all — a small link, not a prominent competing CTA, so the
  wizard remains the default path but isn't a hard block for someone in a hurry.

---

## 6. WhatsApp CTA Placement and Framing

**Recommendation: an equal, parallel primary alternative to the form — not a fallback, not
mobile-only.** South African B2B/B2G buyers (site managers, procurement officers, SHE officers)
routinely conduct real business over WhatsApp; treating it as a lesser or last-resort channel would
under-serve exactly the audience most likely to actually convert quickly through it.

- **Placement:** directly beside the primary form CTA in the hero and on every service/industry
  page's CTA block — visually distinct (e.g., outlined/secondary button style vs. the filled
  primary), but positioned at equal prominence, not smaller or lower.
- **Framing:** service-aware where possible — a WhatsApp link from a service page should pre-fill
  the message text (`https://wa.me/27711914744?text=...`) with something like "Hi, I'm interested
  in [Service Name] and would like a quote" so the conversation starts with context instead of the
  visitor having to explain from scratch. This removes a real piece of friction (typing an opening
  message) without collecting any data via a form.
- **Do not** frame it as "prefer to chat? Try WhatsApp" positioned below/after the form as an
  apology-for-the-form fallback — that framing undersells it for this market. Frame it as a
  first-class option: "Request a Quote" and "WhatsApp Us" side by side, both legitimate front doors.
- **A floating/sticky WhatsApp button on mobile** (common, expected pattern in SA business sites)
  is reasonable in addition to the inline CTA — mobile visitors specifically benefit from a
  persistent one-tap option, but this supplements the equal-placement pattern above, it doesn't
  replace it.
- Ship this CTA only once the number is confirmed as WhatsApp-enabled (flagged as open item #17 in
  the Implementation Plan) — do not wire a `wa.me` link to an unconfirmed number.

---

## 7. Post-Submission Experience

Goal: reduce anxiety, reinforce the decision to convert, without inventing a commitment Kamosa
hasn't confirmed it can keep.

- **Immediate on-screen confirmation** (not just a toast that disappears) on every form: a
  dedicated confirmation state with a clear message — "Thank you, your [quote request /
  enquiry / registration] has been received." Restate what was submitted (service, or course +
  date) so the visitor has confidence the right thing went through.
- **No invented SLA or response-time promise.** Nothing in the company profile confirms a turnaround
  commitment — the FAQ draft explicitly marks turnaround-time questions as "information to be
  confirmed with Kamosa directly" (Content Mapping, FAQ Q13). The post-submission message must
  follow the same discipline: do not write "we'll respond within 24 hours" or similar unless and
  until Kamosa confirms that's a real, honourable commitment. Safe, honest alternative copy:
  *"A member of the Kamosa team will be in touch to discuss your requirements."* — a commitment to
  respond, without a fabricated timeframe.
- **Confirmation email**, same discipline — restates what was submitted, gives the WhatsApp number
  and email as alternate contact channels ("if you'd like to reach us sooner"), again without a
  time promise.
- **Immediately offer the next-best action, not a dead end:** after a quote/enquiry submission,
  surface a soft secondary option — "In the meantime, you may find our [Company Profile /
  Credentials page] useful" — this keeps a converting visitor engaged with more trust material
  while they wait, rather than sending them back to a generic homepage.
- **Training registration specifically:** confirmation should state that registration is
  provisional/pending confirmation from Kamosa (since no payment flow is confirmed) — do not imply
  a guaranteed seat until Kamosa's own process confirms it.
- **Once this becomes a real commitment** (owner confirms an actual response-time SLA), update this
  copy — this document should be revisited the moment that confirmation exists, since a stated SLA
  is itself a strong, legitimate trust signal worth adding once real.

---

## 8. Tender Portal Conversion Angle — Different From Consumer Lead-Gen

Two distinct audiences use `/tenders`, and the CTA design must not conflate them:

1. **Contractors/buyers evaluating Kamosa for a tender they're compiling** (they need Kamosa's
   B-BBEE/CSD credentials, or Kamosa's SHE documentation services, to strengthen their own
   submission) — this audience's intent maps to the existing service/credentials conversion paths,
   not the tender listing itself. Where relevant, cross-link from `/tenders` and `/credentials` to
   `/request-a-quote` (pre-selecting Health & Safety, since that's where "tender safety
   documentation packs" lives per the profile) — but this is a secondary path off the tender
   section, not the tender detail page's own primary CTA.

2. **Kamosa itself reviewing/responding to tender opportunities relevant to its own services** —
   this is the tender listing/detail's actual primary function per the sitemap (`/tenders`,
   `/tenders/:slug` as a listing+detail of tender opportunities, presumably ones Kamosa is
   tracking/publishing, with admin CRUD in Phase 2).

**Recommended tender detail page CTA set (three distinct, clearly labelled actions, not one
generic "Contact Us"):**
- **Primary: "Register Interest"** — the lightweight 4-field form from Section 2. This is the
  correct primary because it's the lowest-friction way for an external party (a subcontractor,
  associate, or interested vendor) to signal engagement with a specific tender, and it gives
  Kamosa a qualified, tender-specific lead list rather than a generic enquiry.
- **Secondary: "Request Clarification"** — a distinct, separate small form (not merged with
  Register Interest) for a specific question about the tender's scope/requirements. Keeping these
  separate matters: merging them would force everyone into answering a free-text question field
  even when they just want to be noted as interested, reintroducing exactly the unnecessary-field
  friction this whole document is arguing against.
- **Tertiary: "Download Tender Documents"** — a direct file action (Storage-backed per the DB
  plan), not gated behind a form at all. Unlike the company profile (a marketing document where lead
  capture has real value), tender documents are working documents a legitimate bidder needs quickly
  and without friction — gating them would actively work against Kamosa's own interest in
  attracting genuine tender engagement. If Kamosa wants visibility into who downloaded documents,
  log it silently against a session/optional-email prompt rather than blocking the download.

**What NOT to do here:** don't reuse the general `/request-a-quote` wizard on the tender page — a
tender response is a business-development action with its own status pipeline (per the DB plan's
`tenders`/`tender_documents` tables), not a service quote. Conflating the two would corrupt both
funnels' data (quote leads mixed in with tender-interest leads) and confuse the visitor about what
they're actually requesting.

---

## 9. Summary Table — CTA Budget Discipline

To make the "avoid CTA fatigue" instruction auditable during build/QA, per-page maximum CTA counts:

| Page type | Max primary CTA instances | Max secondary CTA instances |
|---|---|---|
| Homepage | 2 (hero + one mid/end-of-page repeat) | 2 (WhatsApp alongside each primary instance) |
| Service page | 2 | 1 |
| Industry page | 1 | 0 (service links are navigation, not CTA) |
| Credentials page | 1 (profile download) | 1 (quote, footer only) |
| Tender detail | 1 primary (Register Interest) | 2 (Clarification, Download Docs — distinct actions, not repeats) |
| Training course page | 1 | 1 (WhatsApp) |
| Resource/download page | 1 (the download) | 1 (quote, post-download only) |
| Blog/Insights post | 0–1 (contextual only) | 1 (end-of-article) |

This table should be used as a build-review checklist once pages are implemented — any page
exceeding these counts should be treated as a regression against this strategy, not a stylistic
choice.
