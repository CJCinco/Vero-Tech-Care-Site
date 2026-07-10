# Vero Tech Care Site

Website for Vero Tech Care.

AI editing contract:

- `AGENTS.md` is the required agent entrypoint.
- `WEBSITE_STANDARDS.md` is the durable website editing standard.
- This `README.md` is the site map and workflow reference.

Current residential offer: `special.html` is the evergreen Tech Tune-Up Visit landing and booking page; `/special` is the public URL. The Tech Tune-Up is the single core public residential offer at `$250`. Other home outcomes, remote help, larger projects, and ongoing care remain available by request or custom quote without a public package or membership price catalog. Two-hour language may describe included scope, but dated promo/code language should not return without a clear expiry/removal plan.

`book.html` is a no-indexed legacy booking file using the same verified Tech Tune-Up appointment embed. The public `/book` and `/book.html` routes redirect to `/special`.

Current business page: `digital-presence-management.html` serves the public `/business-websites` route. The public offer is `Local Business Website Build or Redesign`, with complete website projects starting at `$1,500` and custom scoped before work. The legacy `/digital-presence-management` route redirects to `/business-websites`.

`book-digital-presence-checkup.html` remains available for direct standalone-checkup referrals, but it is no-indexed, omitted from the sitemap, and is not the primary public business path. No website quote or fit-call Acuity appointment has been verified yet, so the public business page uses a quote-request contact path rather than an invented scheduler link.

Primary public residential navigation now exposes only the verified Tech Tune-Up appointment path. The no-indexed standalone Checkup referral page remains direct-access, and Acuity's public appointment-type catalog still needs a coordinated live review so legacy residential package types do not conflict with the simplified website.

## Codex Website Workflow

Use this workflow when Codex makes website changes.

- Work only inside this `02 Website` repo for website source changes.
- Read `AGENTS.md` and `WEBSITE_STANDARDS.md` before editing website files.
- Keep browser smoke test tooling in `_tools/browser-smoke/`.
- Before publishing-level changes, run `npm run test:smoke` from `_tools/browser-smoke/` after confirming the tests match current intentional site copy.
- Do not commit, push, deploy, publish, merge, create branches, or open pull requests without explicit CJ approval.
- GitHub CLI is optional. Local Git credentials and the GitHub connector are enough when CJ explicitly asks for GitHub work.

## Local SEO Checklist

Use this checklist when updating the website or Google Business Profile.

- Business name: `Vero Tech Care`
- Website URL: `https://verotechcare.com/`
- Phone: `(772) 588 4324`
- Email: `cj@verotechcare.com`
- Primary local focus: Vero Beach, FL
- Public location model: service area business; do not publish a street address unless CJ explicitly changes this.
- Scheduling model: by appointment through online booking.
- Primary residential website action: `Book Tune-Up`
- Keep Google Business Profile services aligned with the website: in home tech support, remote tech support, Wi Fi help, printer help, phone, tablet, and computer setup, password help, scam prevention help, photo and file organization, and ongoing support.
- Keep Google Business Profile fresh with accurate service area, phone, website URL, booking link, service descriptions, photos, and review replies.
- Local ranking focus from Google: relevance, distance, and prominence. Improve relevance with accurate services and copy, distance with clear Vero Beach service area signals, and prominence with real reviews, photos, links, and consistent business information across the web.
