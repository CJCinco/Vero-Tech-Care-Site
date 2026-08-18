# Vero Tech Care Website Standards

Status: binding website editing contract
Last reviewed: 2026-08-17

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
3. `../06 Admin + Legal/Digital Presence Management Launch Plan.md` for internal business pricing, the private Checkup, and Digital Presence fulfillment rules.
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

- local business owners who need practical technology, digital setup, online-presence, or website support
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
| Public model | Two public front doors only: residential Tech Tune-Up and practical technology and digital support for local businesses. |
| Residential offer | One public pricing card: Tech Tune-Up Visit at `$250`, with `/special` as the booking destination. |
| Business offer | Broad, consultation-first business technology support. Websites and online presence are capabilities within that lane, not the sole front-facing offer. Business work is scoped and quoted after the initial conversation. |
| Primary navigation | `Home`, `Personal Tech Support`, and `Business Tech Support`. The overview homepage stops at these three destinations; dedicated service pages may add one page-appropriate conversion CTA. Do not add more primary nav items without changing this standard. |
| Shared hero template | Every customer-facing page uses the root homepage's continuous image-backed header and the same reserved title, lead, and three-card zones. Page copy may change, but the desktop footprint, card count, card shape, and content rhythm stay consistent. Cards begin with their main title and do not use a smaller eyebrow label. |
| Homepage structure | Shared image-backed header/nav, general Vero Tech Care hero, three capability cards within the header, two equal audience paths, owner introduction, contact, footer. Preserve this order and section ownership. |
| Residential CTA | `Book Tune-Up`, `Book a Tech Tune-Up`, or `Book the Tech Tune-Up`, linking to `/special` or the verified scheduler anchor on a booking page. |
| Business CTA | `Book Consult`, linking to the dedicated Acuity booking page at `/business-consult`. |
| Voice | Human, local, first person when CJ is speaking about his help or process. Use `Vero Tech Care` in metadata, factual business references, and places where first person would be unclear. |
| Visual system | Warm ivory, near-black, ocean teal, serif display headings, sans-serif body copy, generous whitespace, simple cards, pill buttons, and the current calm photography style. |
| Secondary contact | Phone, text, and email remain visible but secondary to the page's primary conversion action. |
| Claims | Only source-backed prices, proof, testimonials, service facts, and local facts. No invented reassurance, credentials, guarantees, or urgency. |
| Private lanes | Internal packages, memberships, Remote Fix, monitoring, Digital Presence ladders, and the standalone Checkup remain private or direct-link-only unless CJ explicitly changes the public offer standard. |
| Mobile quick actions | Every customer-facing page uses one shared four-action mobile dock: one page-appropriate primary action followed by `Text`, `Call`, and `Email`. |
| Booking usability | Embedded schedulers must remain unobstructed on mobile. The shared mobile dock may exist on booking pages, but it must automatically hide whenever scheduler controls are visible. |

## Change Classes And Override Gate

Classify the task before editing:

- **Class A — content or spacing:** wording, typo, metadata wording, wrapping, alignment, or local spacing inside an existing page role. Keep the locked baseline unchanged.
- **Class B — shared presentation or behavior:** repeated header/footer updates, responsive behavior, shared CSS patterns, accessibility, or routing repairs. Preserve the locked baseline and verify every affected page.
- **Class C — contract change:** offers, prices, primary CTA destinations, public/private boundaries, page roles, nav items, homepage sections, route names, booking embeds, brand palette, typography system, or visual identity. Do not implement from an ordinary edit request. Require an explicit standards or strategy change from CJ, update this file first, then update code and tests.

Default edit radius is the named page, its necessary shared CSS, and its contract tests. Do not turn a copy or spacing task into a site-wide rewrite. Expand to repeated pages only when a shared component or locked fact must stay consistent.

Broad requests such as “improve,” “modernize,” “make it convert,” “make it more human,” or “clean it up” are not Class C approval. They authorize the strongest compliant Class A or Class B improvement.

### Selected Homepage Direction — 2026-07-18

CJ selected Concept 2, `Business Card Expanded`, as the new root homepage direction.

- `/` is the inclusive overview and routing page for Vero Tech Care.
- `/home-tech-help` preserves the complete residential Tech Tune-Up homepage and is the dedicated Personal Tech Support route.
- `/business-websites` remains the dedicated Business Tech Support route until a separate route change is explicitly approved.
- The root gives Personal Tech Support and Business Tech Support equal prominence and uses `Tech Support`, `Digital Setup`, and `Online Presence` as capability themes, not new packages.
- The root navigation has no fourth CTA. The two equal audience cards below the hero route directly to Personal Tech Support and Business Tech Support; audience-specific conversion actions live within the dedicated residential and business pages.
- The three temporary concept pages are retired. `/testhome1`, `/testhome2`, and `/testhome3`, including their `.html` forms, redirect to `/`.
- Navigation, metadata, structured data, sitemap, tests, and internal Personal Tech Support links must reflect this routing model together.

## Primary Conversion Paths

The root homepage is a balanced router with two equally prominent audience cards beneath its hero:

- `Personal Tech Support` to `/home-tech-help`
- `Business Tech Support` to `/business-websites`

The dedicated residential path should guide visitors toward one primary action:

`Book Tune-Up`

The main residential booking path is the verified Tech Tune-Up Acuity scheduler on `/special`. The legacy `/book` route redirects to `/special`. Phone, text, and email are secondary support paths for questions before booking, remote help, unusual situations, ongoing care, workshops, partners, and community inquiries.

Do not make phone, text, or email the main booking path unless CJ explicitly requests that change for a specific page or campaign.

The business path uses `Book Consult` as its primary action and routes to `/business-consult`. That page embeds the verified free 15-minute Business Tech Consult appointment, Acuity type `91121958`. Do not reuse the standalone Checkup appointment as the general business front door.

## Page Roles

Use each page for its job. Do not make every page carry the whole business.

- `index.html`: inclusive Vero Tech Care overview, the three capability themes, two equal audience paths, owner introduction, contact, and routing to `/home-tech-help` or `/business-websites`
- `home-tech-help.html`: primary residential trust, capability overview, one clear Tech Tune-Up offer, local proof, and path to `/special`
- `book.html`: no-indexed legacy booking file with the verified Tech Tune-Up scheduler; public `/book` redirects to `/special`
- `special.html`: evergreen Tech Tune-Up Visit landing page at `/special`
- `business-websites.html`: broad Business Tech Support page served publicly at `/business-websites`; websites are one supported capability, not the page's sole offer
- `business-consult.html`: public free 15-minute Business Tech Consult booking page at `/business-consult`, using Acuity appointment type `91121958`
- `book-digital-presence-checkup.html`: no-indexed direct booking page for standalone Digital Presence Checkup referrals; not a primary public path
- `tech-tips.html` and tip articles: helpful local education with a light path back to the Tech Tune-Up or contact
- `workshops.html`: workshop trust and community proof, a visible route into the Smartphone Confidence Series, and a path back to the Tech Tune-Up
- `smartphone-confidence.html`: evergreen Smartphone Confidence Series hub and permanent public-flyer destination; publish verified per-part Acuity registration links for available classes, keep unavailable parts clearly labeled without dead links, and omit unconfirmed details
- `smartphone-confidence-basics.html`: accessible Part 1 class recap with a downloadable PDF handout and full-page image, plus light routes back to the series, a Google review, and one-on-one help
- `ai-for-everyday-life.html`: evergreen AI for Everyday Life Series hub and stable QR destination; present the completed first workshop factually, keep later parts as neutral forthcoming placeholders, and publish no registration path until a future event is approved
- `phone-clean-up-speed-up.html`: individual historical event page for the completed February 22, 2026 workshop; do not turn it into a series hub or imply that registration is open
- `ai-for-everyday-life-workshop.html`: evergreen, date-and-location-agnostic overview for a future AI for Everyday Life workshop; keep it interest-only until an actual event has a verified direct booking destination
- `phone-clean-up-speed-up-workshop.html`: evergreen, date-and-location-agnostic overview for a future Phone Clean Up & Speed Up workshop; keep it interest-only until an actual event has a verified direct booking destination
- `workshop-check-in.html`: direct-only, no-indexed in-person attendance kiosk; use one distraction-free form with required full name, optional email, optional phone, the exact approved email disclosure, confirmed-save feedback, and automatic reset; omit it from navigation and the sitemap
- `check-in.html`: direct-only, no-indexed CJ setup surface served at the short private route `/check-in`; use it to enter the workshop title and dated details, open or close that workshop, and activate one kiosk session without asking CJ to create or type an internal workshop code; never expose the setup password, attendee data, export controls, or an attendee list
- `workshop-check-in-setup.html`: retained only as the legacy source route, with both its extensionless and `.html` URLs permanently redirecting to `/check-in`
- `404.html`: recover visitors and route them to booking or contact

When adding or revising copy, decide which page owns that message. Link to the owning page instead of repeating the same explanation everywhere.

### Direct-Only Workshop Check-In Exception

The attendee route `/workshop-check-in` and CJ setup route `/check-in` are operational tools, not customer-facing discovery or conversion pages. They are the explicit exception to the shared hero, footer, navigation, mobile dock, metadata, and three-card requirements. Preserve the VTC palette, typography, calm voice, large touch targets, and senior-friendly readability without adding public-site navigation or booking actions.

The kiosk contract is locked:

- Acuity continues to own advance registration. The kiosk records arrival attendance and optional contact information without creating an Acuity booking.
- Full name is required. Email and phone are optional. Phone does not grant SMS-marketing permission.
- The email disclosure must appear exactly: `Email is optional. If you share it, Vero Tech Care may send workshop follow-up and occasional tech tips. You can unsubscribe anytime.`
- A signed, expiring, secure kiosk session binds the iPad to one open server-side event and its current activation generation. Reopening an event rotates that generation so old iPad sessions cannot revive. Attendee submissions do not choose or send a trusted event destination.
- Derive the internal workshop identifier on the server from the validated workshop title and written date. Keep that identifier stable for the approved AOS import allowlist without showing or requesting it on the iPad setup page.
- The iPad setup password may authorize only workshop open and close actions. Keep it separate from the stronger export and AOS custody credential so it cannot retrieve attendee data, verify AOS custody, or purge records. Store all credentials only as environment secrets, never in public source or browser storage.
- Show success only after a confirmed database write or an idempotent receipt recovery. Preserve all visible fields on an uncertain or failed request.
- Bind every idempotency key to its normalized submitted fields. A repeated key with different fields must fail with a conflict and never confirm the earlier attendee's receipt.
- Clear attendee fields immediately after confirmation. Show no prior record, attendee list, search, edit, delete, or export control on either iPad page.
- Store no attendee contact information in browser storage, URLs, application logs, Git, Linear, or public build artifacts.
- Cloudflare D1 is temporary operational custody. Import only after the event is closed, require one stable count/final-sequence snapshot, and merge immutable receipts into the event's exact AOS `6 Sign Up Sheet/` folder through a local static allowlist; cloud data never supplies a filesystem path and a later export must never remove a prior AOS row.
- After the atomic AOS readback, record a server-verified receipt digest. D1 deletion is permitted only after 30 days, only for a closed roster that still matches that custody proof, and only through the protected cleanup path.
- Both pages and every API response use `no-store`; both pages are `noindex, nofollow, noarchive` and not frameable.
- Keep local, preview, and production databases and secrets separate. Preview uses fake attendees only.
- Keep the Numbers workbook available as the offline fallback.

### Workshop Resource Architecture

The Smartphone Confidence Series uses a hybrid structure:

- `/smartphone-confidence` is the stable series hub and the destination encoded in public series flyers.
- Available classes register separately through verified class-specific Acuity direct links on their hub cards; do not place a general workshop embed on the hub or route visitors through Acuity's full appointment catalog.
- Part 1 uses Acuity appointment type `96581893`, and Part 2 uses Acuity appointment type `96621892`. Registration links open in the current tab so the browser Back action returns visitors to the hub.
- Registration is free. A suggested `$20` donation may be given at the workshop but is not required and is not collected through Acuity.
- The registration form requires an email address for class logistics; phone remains optional.
- Publish a class date, time, location, registration link, or availability state only after it is verified. The current confirmed classes are Part 1 on August 30, 2026 at 11:30 AM and Part 2 on September 20, 2026 at 11:30 AM at Unity Spiritual Center of Vero Beach.
- Each class receives one short, stable resource URL only when its reviewed notes are ready. Part 1 uses `/smartphone-confidence-basics`.
- Class-slide QR codes should point directly to that class resource page, while the page itself always links back to the series hub.
- Unconfirmed class dates, locations, registration terms, donations, and availability stay off public pages.
- Unreleased parts may appear on the hub as plain unavailable-status cards without dead links or disabled controls.
- Each class resource page should summarize the workshop in one or two plain-language paragraphs rather than repeating the lesson step by step.
- The detailed teaching material belongs in a reviewed handout offered both as a downloadable PDF and a visible full-page image that can be saved from a phone.
- Resource pages and handouts should be readable without an account or download gate and written for older or less-confident smartphone users.
- Google review requests are secondary end-of-class actions, never the only way to continue.
- Registration is the hub's primary action. On class resource pages, booking, contact, and upcoming-class questions remain visible but secondary to the educational content.
- Use stable first-party URLs in printed QR codes. Add campaign tracking at the redirect or analytics layer rather than printing fragile tracked URLs.

Other workshop routes follow the same source and QR safeguards without copying the Smartphone Confidence registration model where it does not fit:

- `/ai-for-everyday-life` is the stable AI series overview and QR destination. Part 1 may use the completed April 19, 2026 workshop facts. Parts 2 and 3 remain plain forthcoming placeholders until CJ approves their titles, order, logistics, availability, and registration destinations.
- `/phone-clean-up-speed-up` is one individual historical event page, not a hub. Its QR may route to that exact page, but the page and flyer must not imply a new session or open registration.
- `/ai-for-everyday-life-workshop` and `/phone-clean-up-speed-up-workshop` are evergreen workshop overviews and interest surfaces. They are not canonical destinations for an actual event flyer.
- An individual future event receives its own verified booking instance and registration CTA only after its title, date, time, venue, terms, capacity, and destination are approved.
- Each actual event flyer uses its own unique QR that routes directly to that event's verified booking instance. Until that verified destination exists, the evergreen workshop overview remains interest-only and must not claim that registration is open.
- If no verified registration destination exists, use a plain status or workshop-question contact path. Never substitute the general Acuity catalog, a disabled button, or another workshop's registration link.

### Root Homepage Section Ownership

Each root homepage section has one job:

- hero: inclusive positioning and equal Home/Business actions, using the same image-backed base layout as the dedicated pages
- capability strip: three dark glass cards within the image-backed header, with one concise explanation for each capability theme; no package or pricing ladder
- audience paths: one Personal Tech Support card and one Business Tech Support card with equal visual prominence; the Home and Family card may include one quiet text link to the Smartphone Confidence Series without becoming a third audience path
- owner introduction: personal trust, working style, and what it feels like to receive help; no service catalog
- contact: repeat the two audience routes and keep phone, text, and email secondary
- footer: compact navigation, contact facts, and real social links

Adding a root homepage section, a fourth capability card, or a third audience path is a Class C structure change.

The dedicated Personal Tech Support page uses this approved page-specific sequence: residential hero, three-card proof strip, one Tech Tune-Up offer, four-item capability guide, six-item FAQ, business bridge, and footer.

The dedicated Business Tech Support page uses this approved page-specific sequence: business hero, three-card capability strip, one business support offer, six-item FAQ, personal-tech-support bridge, and footer. The bridge mirrors the residential page&rsquo;s business bridge and routes to `/home-tech-help`.

### Locked Owner Introduction Copy

The homepage owner-introduction section uses the title `About CJ`. The signature `CJ Watson · Owner & Tech Care Specialist` appears once, centered directly beneath the owner photo in the established teal serif treatment. The section uses these three approved paragraphs:

> I help people around Vero Beach feel more confident with everyday technology, and I help local small businesses improve the technology, digital tools, and online presence they rely on every day.
>
> My technical background began in U.S. Army aviation maintenance, working on helicopter electrical, avionics, and weapon systems. I later earned an associate degree in Recording Arts with highest honors, combining music production with extensive computer-based work using professional recording and editing software.
>
> Whether I’m sorting out devices and accounts at home or improving the technology behind a local business, I bring the same careful approach: troubleshoot methodically, explain things clearly, and leave you with a practical next step.

This is approved credibility language, not a service catalog. Preserve the meaning and the second and third paragraphs exactly unless CJ explicitly approves replacement copy and a standards update.

## CTA Rules

Hero action rows are intentionally absent from every site hero. Keep the shared hero limited to its title, lead, and three-card strip; place page-appropriate conversion actions in the relevant content section or mobile dock instead.

Default primary CTA:

- `Book Tune-Up`
- `Book Tech Tune-Up` in the compact mobile dock
- `Book the Tech Tune-Up`
- `Book Consult`

Acceptable contextual CTAs:

- `See what is included`
- `Explore Business Tech Support`

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

Mobile quick-action rules:

- Show exactly four actions, in this order: the page-appropriate primary action, `Text`, `Call`, and `Email`.
- Use `Choose Support` on the overview homepage, linking to its audience-path section.
- Use `Book Tech Tune-Up` on Personal Tech Support, Tech Tips, Workshops, tip articles, the 404 page, and residential booking pages. Link to `/special`, or to the scheduler anchor when already on a residential booking page.
- Use `Choose a Class` on the Smartphone Confidence Series hub, linking to `#series-parts`.
- Use `Explore Series` on Smartphone Confidence class resource pages, linking to `/smartphone-confidence`.
- Use `View Part 1` on the AI for Everyday Life hub, linking to `#series-parts`, while no future AI registration is verified.
- Use `Workshop Details` on the historical Phone Clean Up event page, linking to `#workshop-details`.
- Use `Book Consult` on Business Tech Support and the Business Tech Consult page. Link to `/business-consult`, or to the scheduler anchor when already on that booking page.
- Keep `Book Checkup` only on the no-indexed direct-referral Checkup page, linking to its scheduler anchor.
- The dock appears only on mobile after the visitor reaches the page&rsquo;s main content. On any page with an embedded scheduler, hide it while the scheduler is visible so no booking controls are covered.

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

Business support rules:

- `../06 Admin + Legal/Digital Presence Management Launch Plan.md` is the authority for strategy, pricing, and founding-mode rules.
- The public business front door is `Business Tech Support` at `/business-websites`.
- Lead with practical technology and digital support for local businesses. Websites, online presence, digital setup, customer contact paths, and focused technology projects may be described as capabilities rather than a package catalog.
- Do not publish a business starting price on the general support page. Scope and quote each project after the initial conversation.
- The primary action is `Book Consult`, routing to the dedicated Acuity booking page at `/business-consult`.
- The internal Digital Presence system may guide implementation and ongoing care, but do not lead public copy with `Digital Presence Management` or `DPM` jargon.
- Ongoing technology, website, and broader online-presence care may be offered with a client-specific scope and quote.
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
- Embedded booking controls must never sit beneath the fixed mobile dock; automatically hide the dock while the scheduler is visible.
- Business-page headings should describe the customer outcome in natural language. Keep internal strategy terms and stacked slogan fragments out of public headings.

Small spacing, consistency, wrapping, accessibility, and alignment improvements are acceptable when directly tied to the requested edit.

Every customer-facing page uses the same continuous, image-backed top section as the root homepage: shared logo treatment, navigation spacing, base hero layout, and a three-card strip inside the photograph. The Google ownership-verification stub is the only non-page exception. Exactly one primary destination link uses `aria-current="page"` where the page belongs directly to Home, Personal Tech Support, or Business Tech Support. The overview homepage omits a fourth navigation CTA; other pages may retain one page-appropriate navigation CTA when it supports the page's established conversion path.

Within that shared top section, every page uses one typography and spacing rhythm: the same brand and navigation type sizes, responsive `h1` scale and line height, hero padding, button sizing, and glass-card padding. The title, lead, and action area each occupy a reserved zone on desktop so different copy does not change the overall header footprint. Every hero includes an action zone, even when its contents are page-specific, followed by exactly three equal-width, equal-height cards. Each card begins with its main title and one concise supporting description; do not add a small uppercase eyebrow or category label above the card title. Keep card titles and descriptions concise enough to preserve the common template. On smaller screens the same zones and cards may grow naturally to avoid clipping, but their order, spacing rhythm, and shape remain consistent.

Do not stack a small eyebrow title above a larger title that repeats or competes with it elsewhere in the site. Use the clearer short phrase as the heading when it carries the section meaning, while preserving unique article titles and the locked `About CJ` title. On desktop, the destination links stay centered in a reserved three-column navigation grid so they do not move when a page adds its CTA.

## Redundancy Gate

Before adding any new section, paragraph, card, FAQ, or CTA, check whether the same job is already handled by:

- hero
- proof strip
- about section
- services section
- packages section
- visit/process section
- business support bridge
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

Cloudflare Pages builds the public static allowlist into `dist/`. Pages Functions remain in root-level `functions/` and may run only on the explicitly included API routes in `_routes.json`. Never publish repository governance, migration SQL, tests, local database state, secrets, attendee exports, or AOS paths as static assets.

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
- primary nav still contains only the locked destination links and any page CTA permitted for that route
- first-person and business-name perspective are consistent inside changed sections
- visual tokens and typography families were not changed by a routine styling task
- mobile wrapping and spacing risks were considered
- semantic HTML and accessibility were preserved
- affected metadata or structured data stayed accurate
- smoke tests were run or the reason for not running them is stated
- tests still protect standards rather than merely matching the latest implementation
- no push, deploy, publish, merge, branch, or PR happened without explicit approval
