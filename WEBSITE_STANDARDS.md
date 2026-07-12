# Vero Tech Care Website Standards

Status: binding website editing contract
Last reviewed: 2026-07-12

Purpose: AI-facing standards for editing the Vero Tech Care website without drifting from the brand, offer model, booking flow, or current site structure.

This file is a pre-edit contract, not a strategy doc, report, backlog, or full brand guide. Keep it compact and point to source files instead of duplicating them.

## Standards Authority

This file is the primary editing authority for every Vero Tech Care website task.

A routine request to change copy, spacing, formatting, SEO, layout, a CTA, or a page does not silently override this contract. Interpret the requested outcome inside these standards. Change a locked standard only when CJ explicitly says to change the website standard, replace the current offer or conversion model, restructure the site, or approves the exact exception after it is named.

If a request conflicts with a locked standard:

1. preserve the locked standard
2. implement the closest compliant version when the intent is still clear
3. name the conflict in the closeout
4. do not rewrite this file merely to make the requested patch appear compliant

Current HTML and CSS show how the standard is implemented. They do not outrank this file and do not turn accidental drift into a new standard.

## Source Authority

Use the authority that matches the decision:

1. This `WEBSITE_STANDARDS.md` for website architecture, conversion paths, page roles, voice rules, visual-system boundaries, change radius, and validation.
2. `../06 Admin + Legal/Services.md` for residential offers, prices, memberships, monitoring language, service boundaries, and exclusions.
3. `../06 Admin + Legal/Digital Presence Management Launch Plan.md` for the business website offer, business pricing, private Checkup, and internal Digital Presence rules.
4. Current website files in `02 Website/` for compliant implementation details, exact current copy, routes, classes, embeds, metadata, and responsive behavior.
5. `README.md` for website workflow and current route notes.
6. `../01 Brand/brand-core.md`, `../01 Brand/voice-and-tone.md`, `../01 Brand/visual-rules.md`, and `../09 Knowledge Base/VTC Voice Rules.md` for broader brand and voice guidance where this file does not define a more specific website rule.
7. `../08 Templates/Digital Presence Management/` for reusable business client-facing language when it fits the locked public business offer.

If sources conflict, do not invent a compromise. This file wins for website behavior. The most specific current business source wins for factual claims, offers, and prices. Current site code never wins merely because drift is already present; fix the conflict or report it.

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

## Locked Baseline Contract

These are invariants, not suggestions:

| Surface | Locked standard |
| --- | --- |
| Public model | Two public front doors only: residential Tech Tune-Up and local business website build or redesign. |
| Residential offer | One public pricing card: Tech Tune-Up Visit at `$250`, with `/special` as the booking destination. |
| Business offer | Local Business Website Build or Redesign, complete projects starting at `$1,500`, with a custom quote path. |
| Primary navigation | `Home`, `Home Tech Help`, `Business Help`, plus one page-appropriate primary CTA. Do not add more primary nav items without changing this standard. |
| Homepage structure | Header/nav, residential hero, three-card proof strip, About CJ, one residential offer with four capability cards, business bridge, three-item FAQ, contact, footer. Preserve this order and section ownership. |
| Residential CTA | `Book Tune-Up`, `Book a Tech Tune-Up`, or `Book the Tech Tune-Up`, linking to `/special` or the verified scheduler anchor on a booking page. |
| Business CTA | `Request a Website Quote` or `Request a Quote`, using the current quote/contact path until a dedicated fit appointment is verified. |
| Voice | Human, local, first person when CJ is speaking about his help or process. Use `Vero Tech Care` in metadata, factual business references, and places where first person would be unclear. |
| Visual system | Warm ivory, near-black, ocean teal, serif display headings, sans-serif body copy, generous whitespace, simple cards, pill buttons, and the current calm photography style. |
| Secondary contact | Phone, text, and email remain visible but secondary to the page's primary conversion action. |
| Claims | Only source-backed prices, proof, testimonials, service facts, and local facts. No invented reassurance, credentials, guarantees, or urgency. |
| Private lanes | Internal packages, memberships, Remote Fix, monitoring, Digital Presence ladders, and the standalone Checkup remain private or direct-link-only unless CJ explicitly changes the public offer standard. |
| Booking usability | Embedded schedulers must remain unobstructed on mobile. Do not place a sticky dock, floating CTA, or other fixed interface over scheduler controls. |

## Change Classes And Override Gate

Classify the task before editing:

- **Class A — content or spacing:** wording, typo, metadata wording, wrapping, alignment, or local spacing inside an existing page role. Keep the locked baseline unchanged.
- **Class B — shared presentation or behavior:** repeated header/footer updates, responsive behavior, shared CSS patterns, accessibility, or routing repairs. Preserve the locked baseline and verify every affected page.
- **Class C — contract change:** offers, prices, primary CTA destinations, public/private boundaries, page roles, nav items, homepage sections, route names, booking embeds, brand palette, typography system, or visual identity. Do not implement from an ordinary edit request. Require an explicit standards or strategy change from CJ, update this file first, then update code and tests.

Default edit radius is the named page, its necessary shared CSS, and its contract tests. Do not turn a copy or spacing task into a site-wide rewrite. Expand to repeated pages only when a shared component or locked fact must stay consistent.

Broad requests such as “improve,” “modernize,” “make it convert,” “make it more human,” or “clean it up” are not Class C approval. They authorize the strongest compliant Class A or Class B improvement.

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
- `business-websites.html`: business-facing Website Build or Redesign page served publicly at `/business-websites`
- `book-digital-presence-checkup.html`: no-indexed direct booking page for standalone Digital Presence Checkup referrals; not a primary public path
- `tech-tips.html` and tip articles: helpful local education with a light path back to the Tech Tune-Up or contact
- `workshops.html`: workshop trust and community proof with a path back to the Tech Tune-Up
- `404.html`: recover visitors and route them to booking or contact

When adding or revising copy, decide which page owns that message. Link to the owning page instead of repeating the same explanation everywhere.

### Homepage Section Ownership

Each homepage section has one job:

- hero: audience, main outcome, local relevance, and primary residential CTA
- proof strip: real trust evidence only; no new offer or pricing ladder
- About CJ: personal trust, working style, and what it feels like to receive help; no service catalog
- services: the single Tech Tune-Up offer, four capability examples, and custom-work boundary
- business bridge: short handoff to `/business-websites`; do not duplicate the full business offer
- FAQ: the three strongest pre-booking questions; do not turn it into a service encyclopedia
- contact: primary booking action plus secondary question paths
- footer: compact navigation, contact facts, and real social links

Adding a homepage section, a second pricing card, a fifth capability card, a fourth FAQ item, or a fourth proof card is a Class C structure change.

Keep the proof strip compact enough that About CJ follows naturally instead of feeling buried. The About copy may name both sides of CJ's work, patient home tech help and clear websites for local small businesses, without turning into a service list.

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

Website perspective rules:

- Use first person for CJ's approach, process, reassurance, recommendations, and direct invitations: `I help`, `I explain`, `we decide`, `ask me`.
- Use `Vero Tech Care` for metadata, structured data, factual business identification, and sentences where the company name improves clarity.
- Do not switch between `I`, `we`, `CJ`, and `Vero Tech Care` inside one section without a clear reason.
- The About headline and body must sound like a real introduction from CJ, not a generic agency biography or marketing slogan.
- Prefer concrete human outcomes over abstract brand claims. Show patience through wording and process instead of repeatedly calling the service patient or premium.
- Do not add more copy to make a page feel warmer. Replace stiff copy with warmer copy and keep the same or lower information load.

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

- warm ivory background: `--ivory: #f6f1e7`
- near-black foundation: `--charcoal: #111514`
- ocean teal accent: `--accent: #3e8c8c`
- serif display and brand headings: `Big Caslon` with the current serif fallbacks
- sans-serif body and interface copy: `Avenir Next` with the current sans-serif fallbacks
- generous whitespace
- premium minimal layout
- calm photo/image style
- simple cards and panels already present in the CSS
- rounded pill buttons and the existing border-radius family

Color tokens, font families, button language, global width behavior, and the overall card/section system are Class C. Do not change them from a general styling request. Local spacing, wrapping, alignment, and responsive corrections are Class A or B when they preserve the system.

Avoid trendy effects, dense cards, crowded layouts, unnecessary animation, heavy visual clutter, and adding sections that compete with booking.

Readability and spacing rules:

- Supporting interface copy, labels, top bars, and brand tags should render at about `14px` or larger in normal use, with enough contrast to read comfortably.
- Generous whitespace should create calm hierarchy, not long empty runs or sparse sections. Remove repeated copy before adding more vertical space.
- Keep proof, FAQ, contact, and footer sections compact enough to support the page's main path.
- On desktop, do not leave a single offer card artificially narrow when the surrounding section has useful space.
- Embedded booking controls must never sit beneath a fixed mobile dock or floating action bar.
- Business-page headings should describe the customer outcome in natural language. Keep internal strategy terms and stacked slogan fragments out of public headings.

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

Test the contract, not every subjective sentence:

- Exact tests should protect locked prices, offer names, CTA destinations, routes, appointment IDs, page counts, card counts, and public/private boundaries.
- Do not freeze ordinary headlines or body copy word-for-word unless the wording itself is an approved claim or conversion standard.
- When compliant copy changes, update only stale subjective assertions. Do not weaken an invariant test to make drift pass.
- A test update must explain whether the standard changed or only the implementation wording changed.

If copy changes invalidate smoke-test expectations, update the smoke tests as part of the same website edit or report that the tests are stale.

## Required Pre-Edit Contract

Before changing files, establish:

- change class: A, B, or C
- target page and section
- locked invariants touched: normally `none`
- factual sources required
- expected file radius

Then read this file, the target files, and only the factual sources required. If the expected radius expands during the task, stop and identify why before widening the edit.

## Final Validation Checklist

Before closing a website edit, verify:

- source files needed for the claim were read
- primary page CTA is still clear
- booking path still matches the page role
- offers and prices match the source authority
- contact methods are available but secondary
- no unsupported claims were introduced
- no redundant section or repeated copy was added
- homepage section order and card counts still match the locked baseline
- primary nav still contains only the locked items and page CTA
- first-person and business-name perspective are consistent inside changed sections
- visual tokens and typography families were not changed by a routine styling task
- mobile wrapping and spacing risks were considered
- semantic HTML and accessibility were preserved
- affected metadata or structured data stayed accurate
- smoke tests were run or the reason for not running them is stated
- tests still protect standards rather than merely matching the latest implementation
- no push, deploy, publish, merge, branch, or PR happened without explicit approval
