# Vero Tech Care Website Standards

Purpose: AI-facing standards for editing the Vero Tech Care website without drifting from the brand, offer model, booking flow, or current site structure.

This file is a pre-edit contract, not a strategy doc, report, backlog, or full brand guide. Keep it compact and point to source files instead of duplicating them.

## Source Authority

Use this order when a website edit depends on facts:

1. Current website files in `02 Website/`
2. Website workflow facts in `02 Website/README.md`
3. Offer, pricing, memberships, monitoring language, service boundaries, and exclusions in `../06 Admin + Legal/Services.md`
4. Digital Presence Management strategy and pricing in `../06 Admin + Legal/Digital Presence Management Launch Plan.md`
5. Brand, voice, and visual direction in `../01 Brand/brand-core.md`, `../01 Brand/voice-and-tone.md`, and `../01 Brand/visual-rules.md`
6. Practical VTC public voice rules in `../09 Knowledge Base/VTC Voice Rules.md`
7. Digital Presence reusable client-facing language in `../08 Templates/Digital Presence Management/`

If these sources conflict, do not invent a compromise. Use the most specific current source for the affected claim and mention the conflict in the closeout.

## Site Intention

The site should make Vero Tech Care feel local, trustworthy, premium, patient, calm, and easy to book.

Primary audience:

- older adults, especially 55+
- Vero Beach and Indian River County households
- adult children or caregivers helping a parent or relative
- local neighbors who value patience, privacy, clarity, and in-home trust

Secondary audience:

- local business owners who need a clear website build or redesign
- workshop, partner, and community contacts

Core positioning:

- premium local tech care, not bargain repair
- outcomes and peace of mind, not technical labor
- patient in-home help first, remote help when it fits
- one clear public residential price and clear custom next steps
- local trust over generic MSP or big-box support language

## Primary Conversion Path

The residential website should guide visitors toward one primary action:

`Book Tune-Up`

The main residential booking path is the verified Tech Tune-Up Acuity scheduler on `/special`. The legacy `/book` route redirects to `/special`. Phone, text, and email are secondary support paths for questions before booking, remote help, unusual situations, ongoing care, workshops, partners, and community inquiries.

Do not make phone, text, or email the main booking path unless CJ explicitly requests that change for a specific page or campaign.

The business website path uses `Request a Website Quote` as its primary action until a dedicated website-fit Acuity appointment is verified. Do not invent an appointment type or reuse the standalone checkup appointment as the website-project front door.

## Page Roles

Use each page for its job. Do not make every page carry the whole business.

- `index.html`: primary residential trust, capability overview, one clear Tech Tune-Up offer, local proof, and path to `/special`
- `book.html`: no-indexed legacy booking file with the verified Tech Tune-Up scheduler; public `/book` redirects to `/special`
- `special.html`: evergreen Tech Tune-Up Visit landing page at `/special`
- `digital-presence-management.html`: business-facing Website Build or Redesign page served publicly at `/business-websites`
- `book-digital-presence-checkup.html`: no-indexed direct booking page for standalone Digital Presence Checkup referrals; not a primary public path
- `tech-tips.html` and tip articles: helpful local education with a light path back to the Tech Tune-Up or contact
- `workshops.html`: workshop trust and community proof with a path back to the Tech Tune-Up
- `404.html`: recover visitors and route them to booking or contact

When adding or revising copy, decide which page owns that message. Link to the owning page instead of repeating the same explanation everywhere.

## CTA Rules

Default primary CTA:

- `Book Tune-Up`
- `Book the Tech Tune-Up`
- `Request a Website Quote`
- `Request a Quote`

Acceptable contextual CTAs:

- `See what is included`
- `View Business Websites`

Secondary helper language:

- `Not sure what to book? Call, text, or email.`
- `Questions before booking? Call or text.`
- `I can point you toward the simplest next step.`

Avoid as primary CTA language unless explicitly requested:

- `Call today`
- `Text to book`
- `Email to book`
- `Reach out to schedule`
- vague CTAs like `Learn more` when a clearer action exists

## Offer And Pricing Rules

`../06 Admin + Legal/Services.md` is the authority for residential offers and prices.

Current public offer model:

- The `Tech Tune-Up Visit` is the single core public residential offer.
- The public Tune-Up price is `$250`.
- Other residential outcomes, remote help, larger projects, and ongoing care may be described as capabilities available by request, not as a public package catalog.
- Keep non-Tune-Up package prices, remote-session pricing, hourly floors, and membership tiers/prices internal unless CJ explicitly approves a new public offer change.
- Custom work should be described as scoped and priced before starting.
- Specials should be added value or seasonal launch value, not percent-off or slashed-price framing.

Membership rules:

- Memberships are premium ongoing tech care for clients who already trust VTC.
- Do not make every visitor feel pushed toward membership.
- Keep membership tier names and prices off the public website; describe ongoing care as available by request after the first visit.
- 24/7 computer monitoring must be clearly limited to covered computers and secure monitoring software.
- Monitoring is not 24/7 emergency live support, personal file browsing, password access, banking access, or broad account surveillance.
- Do not imply monitored membership activation is ready until the platform stack has been selected and tested.

Business website rules:

- `../06 Admin + Legal/Digital Presence Management Launch Plan.md` is the authority for strategy, pricing, and founding-mode rules.
- The public business front door is `Local Business Website Build or Redesign` at `/business-websites`.
- Complete website projects publicly start at `$1,500`; the final scope and price are quoted before work begins.
- The internal Digital Presence system may guide website implementation and ongoing care, but do not lead public copy with `Digital Presence Management` or `DPM` jargon.
- Ongoing website and broader online-presence care may be offered after launch with a client-specific scope and quote.
- The standalone Digital Presence Checkup may remain available by direct referral, but it is not the primary public CTA and should not be listed in the sitemap.
- Do not promise guaranteed rankings, guaranteed leads, ad results, or 24/7 coverage.
- Do not request passwords by email, text, or form.
- Public changes, Google profile edits, social posts, review replies, booking changes, DNS changes, or account-access changes require client/CJ approval.

## Copy Standards

Write like Vero Tech Care:

- calm
- clear
- practical
- local
- patient
- respectful
- confidence-building
- premium without sounding fancy

Use plain words before technical terms. Name the practical outcome first. Keep paragraphs short. Make the next step obvious. Explain risk without fear tactics.

Prefer language like:

- patient in-home tech care
- tech care you can trust
- explained simply
- clearer next step
- calmer setup
- less frustrating
- safer
- smoother
- peace of mind

Avoid:

- hype
- fake urgency
- fear-heavy scam language
- jargon-heavy explanations
- bargain or discount positioning
- generic computer repair framing
- corporate IT or MSP framing for residential pages
- condescending language
- guaranteed security, recovery, performance, rankings, or leads
- fake testimonials, reviews, client stories, credentials, certifications, or years in business

For public website copy, avoid dash-heavy writing when a comma, period, or line break is cleaner. Keep exact hyphens when needed for a term, URL, file name, phone number, or existing brand language.

## Visual And Layout Standards

Preserve the current design language:

- warm ivory background
- near-black text
- ocean teal accents
- clean typography hierarchy
- generous whitespace
- premium minimal layout
- calm photo/image style
- simple cards and panels already present in the CSS

Do not change brand colors, typography system, image style, visual identity, or major layout patterns unless explicitly requested.

Avoid trendy effects, dense cards, crowded layouts, unnecessary animation, heavy visual clutter, and adding sections that compete with booking.

Small spacing, consistency, wrapping, accessibility, and alignment improvements are acceptable when directly tied to the requested edit.

## Redundancy Gate

Before adding any new section, paragraph, card, FAQ, or CTA, check whether the same job is already handled by:

- hero
- proof strip
- about section
- services section
- packages section
- visit/process section
- business website bridge
- FAQ
- contact section
- footer
- mobile dock
- dedicated landing page
- tip article body

If the message already exists, prefer one of these moves:

- shorten the existing copy
- replace the weaker version
- link to the owning page
- merge two similar sections
- remove stale wording

Do not repeat the same offer, reassurance, pricing explanation, or CTA in multiple places unless each instance has a distinct job in the page flow.

## SEO And Local Trust

Keep local facts consistent:

- Business name: `Vero Tech Care`
- Website URL: `https://verotechcare.com/`
- Phone: `(772) 588 4324`
- Email: `cj@verotechcare.com`
- Primary local focus: Vero Beach, FL
- Service model: service area business by appointment
- Do not publish a street address unless CJ explicitly changes this.

Local SEO should support clear service relevance, Vero Beach and Indian River County signals, accurate booking/contact paths, and real proof. Do not add fake service areas, fake testimonials, fake reviews, or keyword-stuffed copy.

## Technical Standards

This site is a static HTML/CSS site with repeated headers, footers, mobile docks, and Acuity embeds.

When editing:

- inspect the target file before changing it
- reuse existing structure and classes
- keep semantic HTML
- preserve keyboard accessibility and skip links
- preserve mobile usability
- preserve canonical URLs, metadata, structured data, and social metadata unless the edit requires them to change
- update repeated nav/footer/mobile-dock links consistently when a page-level CTA changes
- do not create new abstractions or tooling unless explicitly requested

If copy changes invalidate smoke-test expectations, update the smoke tests as part of the same website edit or report that the tests are stale.

## Final Validation Checklist

Before closing a website edit, verify:

- source files needed for the claim were read
- primary page CTA is still clear
- booking path still matches the page role
- offers and prices match the source authority
- contact methods are available but secondary
- no unsupported claims were introduced
- no redundant section or repeated copy was added
- mobile wrapping and spacing risks were considered
- semantic HTML and accessibility were preserved
- affected metadata or structured data stayed accurate
- smoke tests were run or the reason for not running them is stated
- no push, deploy, publish, merge, branch, or PR happened without explicit approval
