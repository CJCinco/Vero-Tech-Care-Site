# AGENTS.md

## Required Read Order

Before making website edits, read:

1. `WEBSITE_STANDARDS.md`
2. `README.md`
3. The target HTML/CSS files
4. Any source-of-truth files named by `WEBSITE_STANDARDS.md` for the specific edit

Do not rely on memory or prior chat alone for offers, pricing, CTA rules, brand language, or publishing rules.

## Primary Authority Rule

`WEBSITE_STANDARDS.md` is the binding website editing contract. A normal request for copy, layout, spacing, SEO, conversion, modernization, or a more human feel must be implemented inside that contract.

Do not treat broad improvement wording as permission to change locked offers, prices, public/private boundaries, CTA destinations, page roles, navigation, homepage structure, routes, booking embeds, palette, typography, or visual identity. Those are Class C changes and require an explicit CJ instruction to change the standard or approve the named exception.

Before editing, identify the change class, target section, locked invariants touched, required factual sources, and expected file radius. If the task expands beyond that radius, identify why before continuing.

## Scope

This repository powers the Vero Tech Care website.

Work only inside this `02 Website` folder for website source changes unless CJ explicitly names another file or source.

Do not scan unrelated folders, client records, Mail, Messages, browser data, app databases, credentials, or financial files for website work. Use only targeted VTC source files needed for the edit.

## Operating Rules

- Preserve the locked baseline in `WEBSITE_STANDARDS.md`; it outranks incidental patterns in the current HTML/CSS.
- Preserve the current premium, minimal, calm, local, senior-friendly website direction.
- Make the smallest useful change that accomplishes the request.
- Reuse existing HTML structure, CSS classes, layout patterns, images, nav/footer patterns, and Acuity booking embeds.
- Do not redesign, restructure, rename, delete, or add new pages unless explicitly requested.
- Do not introduce new services, prices, testimonials, reviews, claims, guarantees, credentials, certifications, years in business, or partner relationships.
- Do not make phone, text, or email the main booking path unless CJ explicitly asks.
- Do not duplicate a message already handled by another section. Compress or replace redundant copy before adding more.
- Keep contact methods available as secondary support for questions, complex situations, memberships, workshops, partners, and community inquiries.

## Approval Gates

Explicit CJ approval is required before:

- publishing, deploying, pushing, merging, or opening production changes
- creating branches or pull requests
- changing the service/pricing model
- changing booking/payment embeds or Acuity IDs
- adding public claims, testimonials, guarantees, or review language not already source-backed
- changing Google Business Profile-facing facts
- deleting, renaming, moving, or restructuring website files

## Validation

Before finishing a website edit:

- Read back every changed file.
- Check the main CTA and booking path still match the page role.
- Search for stale or conflicting offer, price, CTA, or booking language introduced by the edit.
- Check that the edit did not add unnecessary copy or duplicate an existing section.
- Check the locked navigation, homepage section order, proof/card/FAQ counts, and public/private boundaries.
- Keep exact tests for contract facts and structural invariants; do not freeze ordinary subjective copy or weaken contract tests to bless drift.
- Verify semantic HTML, keyboard accessibility, mobile usability, and obvious wrapping risks.
- For publish-level or behavior/layout changes, run `npm run test:smoke` from `_tools/browser-smoke/` after making sure the smoke tests match current intentional site copy.

## Closeout

Summarize changed files, what changed, checks run, and any residual risk. Do not report a publish, deploy, push, merge, or production action unless it actually happened with explicit approval.
