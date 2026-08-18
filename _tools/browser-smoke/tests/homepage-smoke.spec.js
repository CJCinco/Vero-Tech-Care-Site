const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const siteRoot = path.resolve(__dirname, "../../..");
const operationalHtmlFiles = new Set([
  "check-in.html",
  "workshop-check-in.html",
  "workshop-check-in-setup.html"
]);

const homepageUrl = pathToFileURL(
  path.resolve(__dirname, "../../../index.html")
).toString();
const homeTechHelpUrl = pathToFileURL(
  path.resolve(__dirname, "../../../home-tech-help.html")
).toString();
const businessWebsitesUrl = pathToFileURL(
  path.resolve(__dirname, "../../../business-websites.html")
).toString();
const businessConsultBookingUrl = pathToFileURL(
  path.resolve(__dirname, "../../../business-consult.html")
).toString();
const bookingUrl = pathToFileURL(
  path.resolve(__dirname, "../../../book.html")
).toString();
const digitalPresenceBookingPageUrl = pathToFileURL(
  path.resolve(__dirname, "../../../book-digital-presence-checkup.html")
).toString();
const currentSpecialUrl = pathToFileURL(
  path.resolve(__dirname, "../../../special.html")
).toString();
const checkinSetupUrl = pathToFileURL(
  path.resolve(__dirname, "../../../check-in.html")
).toString();

const primaryHeaderPages = [
  ["Home", homepageUrl],
  ["Personal Tech Support", homeTechHelpUrl],
  ["Business Tech Support", businessWebsitesUrl]
];

const secondaryPages = [
  ["404", "404.html"],
  ["tech-tips", "tech-tips.html"],
  ["workshops", "workshops.html"],
  ["smartphone-confidence", "smartphone-confidence.html"],
  ["smartphone-confidence-basics", "smartphone-confidence-basics.html"],
  ["ai-for-everyday-life", "ai-for-everyday-life.html"],
  ["ai-for-everyday-life-workshop", "ai-for-everyday-life-workshop.html"],
  ["phone-clean-up-speed-up", "phone-clean-up-speed-up.html"],
  ["phone-clean-up-speed-up-workshop", "phone-clean-up-speed-up-workshop.html"],
  ["tips-scam-texts", "tips-scam-texts.html"],
  ["tips-iphone-storage", "tips-iphone-storage.html"],
  ["tips-photo-backup", "tips-photo-backup.html"],
  ["tips-when-to-book-help", "tips-when-to-book-help.html"],
  ["tips-senior-tech-safety-checklist", "tips-senior-tech-safety-checklist.html"]
];

const sharedHeroPages = [
  ["Home", "index.html"],
  ["Personal Tech Support", "home-tech-help.html"],
  ["Business Tech Support", "business-websites.html"],
  ["Business Tech Consult", "business-consult.html"],
  ["Tech Tune-Up", "special.html"],
  ["Legacy booking", "book.html"],
  ["Digital Presence Checkup", "book-digital-presence-checkup.html"],
  ...secondaryPages
];

const mobileDockPages = [
  ["Home", "index.html", "Choose Support", "#choose-path", false],
  ["Personal Tech Support", "home-tech-help.html", "Book Tech Tune-Up", "/special", false],
  ["Business Tech Support", "business-websites.html", "Book Consult", "/business-consult", false],
  ["Business Tech Consult", "business-consult.html", "Book Consult", "#booking-embed", true],
  ["Tech Tune-Up", "special.html", "Book Tech Tune-Up", "#booking-embed", true],
  ["Legacy booking", "book.html", "Book Tech Tune-Up", "#booking-embed", true],
  ["Digital Presence Checkup", "book-digital-presence-checkup.html", "Book Checkup", "#booking-embed", true],
  ["404", "404.html", "Book Tech Tune-Up", "/special", false],
  ["Tech Tips", "tech-tips.html", "Book Tech Tune-Up", "/special", false],
  ["Workshops", "workshops.html", "Book Tech Tune-Up", "/special", false],
  ["Smartphone Confidence", "smartphone-confidence.html", "Choose a Class", "#series-parts", false],
  ["Smartphone Basics", "smartphone-confidence-basics.html", "Explore Series", "/smartphone-confidence", false],
  ["AI for Everyday Life", "ai-for-everyday-life.html", "View Part 1", "#series-parts", false],
  ["Future AI Workshop", "ai-for-everyday-life-workshop.html", "Ask About a Future Session", "#interest", false],
  ["Phone Clean Up", "phone-clean-up-speed-up.html", "Workshop Details", "#workshop-details", false],
  ["Future Phone Workshop", "phone-clean-up-speed-up-workshop.html", "Ask About a Future Session", "#interest", false],
  ["Scam Texts", "tips-scam-texts.html", "Book Tech Tune-Up", "/special", false],
  ["iPhone Storage", "tips-iphone-storage.html", "Book Tech Tune-Up", "/special", false],
  ["Photo Backup", "tips-photo-backup.html", "Book Tech Tune-Up", "/special", false],
  ["When to Book Help", "tips-when-to-book-help.html", "Book Tech Tune-Up", "/special", false],
  ["Senior Tech Safety", "tips-senior-tech-safety-checklist.html", "Book Tech Tune-Up", "/special", false]
];

function captureErrors(page) {
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();
      const isKnownThirdPartyNoise =
        text === "requestStorageAccess: Permission denied." ||
        (
          text.includes("Framing 'https://www.google.com/'") &&
          text.includes("report-only Content Security Policy directive")
        );
      if (!isKnownThirdPartyNoise) {
        consoleErrors.push(text);
      }
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  return { consoleErrors, pageErrors };
}

async function assertNoOverflow(page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.viewportWidth + 1);
}

async function assertPrimaryNavigation(page, currentHref, currentLabel, ctaLabel) {
  const shell = page.locator(".site-navigation-shell");
  const activeLink = shell.locator('.site-nav-links a[aria-current="page"]');
  const menuToggle = shell.locator(".nav-menu-toggle");
  const navCluster = shell.locator(".nav-cluster");

  await expect(shell).toHaveCount(1);
  await expect(shell.locator(".topbar")).toBeHidden();
  await expect(shell.locator(".brand-mark")).toHaveText("Vero Tech Care");
  await expect(shell.locator(".site-nav-links a")).toHaveCount(3);
  await expect(activeLink).toHaveCount(1);
  await expect(activeLink).toHaveAttribute("href", currentHref);
  await expect(activeLink).toHaveText(currentLabel);
  if (ctaLabel) {
    await expect(shell.locator(".nav-cta")).toHaveText(ctaLabel);
  } else {
    await expect(shell.locator(".nav-cta")).toHaveCount(0);
  }

  const activeState = await activeLink.evaluate((link) => {
    const style = getComputedStyle(link);
    const marker = getComputedStyle(link, "::after");
    return {
      backgroundColor: style.backgroundColor,
      markerWidth: Number.parseFloat(marker.width),
      markerHeight: Number.parseFloat(marker.height),
      markerColor: marker.backgroundColor
    };
  });

  expect(activeState.backgroundColor).toBe("rgba(0, 0, 0, 0)");
  expect(activeState.markerWidth).toBeGreaterThan(0);
  expect(activeState.markerHeight).toBeGreaterThanOrEqual(2);
  expect(activeState.markerColor).not.toBe("rgba(0, 0, 0, 0)");

  const isMobile = await page.evaluate(() => window.innerWidth < 820);
  if (isMobile) {
    await expect(menuToggle).toBeVisible();
    await expect(menuToggle).toHaveAttribute("aria-expanded", "false");
    await expect(navCluster).toBeHidden();
    await menuToggle.click();
    await expect(menuToggle).toHaveAttribute("aria-expanded", "true");
    await expect(navCluster).toBeVisible();
    if (ctaLabel) await expect(shell.locator(".nav-cta")).toBeVisible();
    await menuToggle.click();
    await expect(navCluster).toBeHidden();
  } else {
    await expect(menuToggle).toBeHidden();
    await expect(navCluster).toBeVisible();
  }
}

async function assertSchedulerLoaded(page) {
  const scheduler = page.frameLocator("iframe.scheduler-frame");
  const schedulerMain = scheduler.getByRole("main");

  await expect(schedulerMain).toBeVisible({ timeout: 15000 });
  const schedulerText = await schedulerMain.innerText();
  expect(schedulerText.trim().length).toBeGreaterThan(40);

  const frameSize = await page.locator("iframe.scheduler-frame").evaluate((frame) => ({
    height: frame.getBoundingClientRect().height,
    width: frame.getBoundingClientRect().width,
    viewportWidth: window.innerWidth
  }));
  expect(frameSize.width).toBeGreaterThan(Math.min(250, frameSize.viewportWidth * 0.75));
  expect(frameSize.height).toBeGreaterThanOrEqual(672);
}

async function runSecondaryPageQuality(page, pageName, fileName, viewportName, viewport) {
  const { consoleErrors, pageErrors } = captureErrors(page);
  const pageUrl = pathToFileURL(path.join(siteRoot, fileName)).toString();

  await page.setViewportSize(viewport);
  await page.goto(pageUrl, { waitUntil: "load" });

  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("header")).toHaveCount(1);
  await expect(page.locator("main")).toHaveCount(1);

  const quality = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const ids = [...document.querySelectorAll("[id]")].map((element) => element.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    const brokenImages = [...document.images]
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.getAttribute("src"));
    const clippedText = [...document.querySelectorAll("h1, h2, h3, p, li, a, summary")]
      .filter((element) => {
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden") return false;
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && (rect.left < -1 || rect.right > viewportWidth + 1);
      })
      .slice(0, 10)
      .map((element) => element.textContent.trim().slice(0, 80));
    const hero = document.querySelector(".hero-copy");

    return {
      brokenImages,
      clippedText,
      duplicateIds,
      heroOpacity: hero ? Number.parseFloat(getComputedStyle(hero).opacity) : 1,
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth
    };
  });

  expect(quality.heroOpacity).toBe(1);
  expect(quality.brokenImages).toEqual([]);
  expect(quality.clippedText).toEqual([]);
  expect(quality.duplicateIds).toEqual([]);
  expect(quality.scrollWidth).toBeLessThanOrEqual(quality.viewportWidth + 1);

  await page.screenshot({
    path: `test-results/screenshots/${pageName}-${viewportName}.png`,
    fullPage: true
  });

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
}

async function runHomepageSmoke(page, viewportName, viewport) {
  const { consoleErrors, pageErrors } = captureErrors(page);

  await page.setViewportSize(viewport);
  await page.goto(homepageUrl, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/Tech Support for Home & Business/);
  await assertPrimaryNavigation(page, "/", "Home", null);
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://verotechcare.com/"
  );
  await expect(page.locator("h1")).toHaveText("For home and local business.");
  await expect(page.locator(".preview-bar")).toHaveCount(0);
  await expect(page.locator(".homepage-header")).toHaveCSS(
    "background-image",
    /vero-beach-hero\.jpg/
  );
  await expect(page.locator(".overview-hero.hero.home-hero")).toHaveCount(1);
  await expect(page.locator(".overview-capability-strip .proof-card")).toHaveCount(3);
  await expect(page.locator("body")).toContainText("Tech Support");
  await expect(page.locator("body")).toContainText("Digital Setup");
  await expect(page.locator("body")).toContainText("Online Presence");

  const audiencePaths = page.locator("#choose-path .test-path-card");
  await expect(audiencePaths).toHaveCount(2);
  await expect(page.locator('#choose-path a[href="/home-tech-help"]')).toHaveCount(2);
  await expect(page.locator('#choose-path a[href="/business-websites"]')).toHaveCount(2);
  await expect(page.locator("#choose-path > .wrap > .section-heading")).toHaveCount(0);
  await expect(page.locator("#choose-path .audience-tag")).toHaveCount(0);
  await expect(page.locator("#choose-path .audience-meta")).toHaveCount(0);
  await expect(page.locator("#choose-path .test-path-card h2")).toHaveText([
    "For Local Businesses",
    "For Home and Family"
  ]);
  await expect(page.locator('#choose-path .test-path-card h2 a[href="/business-websites"]')).toHaveText(
    "For Local Businesses"
  );
  await expect(page.locator('#choose-path .test-path-card h2 a[href="/home-tech-help"]')).toHaveText(
    "For Home and Family"
  );
  await expect(page.locator("#choose-path .audience-actions a", { hasText: "More Info" })).toHaveCount(2);
  await expect(page.locator('#choose-path a[href="/business-consult"]')).toHaveText("Book Consult");
  await expect(page.locator('#choose-path a[href="/special"]')).toHaveText("Book Tune-Up");

  const about = page.locator("#about");
  await expect(about).toBeVisible();
  await expect(page.locator("#about-title")).toHaveText("About CJ");
  await expect(page.locator("#about .about-copy .signature-line")).toHaveCount(0);
  await expect(page.locator("#about .about-side .signature-line")).toHaveText(
    "CJ Watson · Owner & Tech Care Specialist"
  );
  await expect(page.locator("#about .about-copy > p:not(.eyebrow):not(.signature-line)")).toHaveText([
    "I help people around Vero Beach feel more confident with everyday technology, and I help local small businesses improve the technology, digital tools, and online presence they rely on every day.",
    "My technical background began in U.S. Army aviation maintenance, working on helicopter electrical, avionics, and weapon systems. I later earned an associate degree in Recording Arts with highest honors, combining music production with extensive computer-based work using professional recording and editing software.",
    "Whether I’m sorting out devices and accounts at home or improving the technology behind a local business, I bring the same careful approach: troubleshoot methodically, explain things clearly, and leave you with a practical next step."
  ]);
  await expect(page.locator("#about .about-photo-card img")).toHaveCount(1);
  await expect(page.locator("#proof")).toHaveCount(0);
  await expect(page.locator("#contact .contact-actions .button-accent")).toHaveCount(2);
  await expect(page.locator("#contact .contact-actions .button-light-outline")).toHaveCount(0);

  const homepageStructure = await page.locator("main > section").evaluateAll((sections) =>
    sections.map((section) => section.id)
  );
  expect(homepageStructure).toEqual(["choose-path", "about", "contact"]);

  await expect(page.locator(".nav-links a")).toHaveCount(3);
  await expect(page.locator('.nav-links a[href="/"]')).toHaveText("Home");
  await expect(page.locator('.nav-links a[href="/"]')).toHaveAttribute("aria-current", "page");
  await expect(page.locator('.nav-links a[href="/home-tech-help"]')).toHaveText("Personal Tech Support");
  await expect(page.locator('.nav-links a[href="/business-websites"]')).toHaveText("Business Tech Support");
  await expect(page.locator(".site-navigation-shell .nav-cta")).toHaveCount(0);
  await expect(page.locator(".overview-hero .hero-actions")).toHaveCount(0);
  await expect(page.locator(".page-nav")).toHaveCount(0);
  await expect(page.locator("#booking")).toHaveCount(0);
  await expect(page.locator("#booking-embed")).toHaveCount(0);

  await page.locator("footer").scrollIntoViewIfNeeded();
  await page.waitForFunction(() =>
    [...document.images].every((image) => image.complete && image.naturalWidth > 0)
  );
  await page.evaluate(() => window.scrollTo(0, 0));

  await assertNoOverflow(page);

  await page.screenshot({
    path: `test-results/screenshots/homepage-${viewportName}.png`,
    fullPage: true
  });

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
}

async function runHomeTechHelpSmoke(page, viewportName, viewport) {
  const { consoleErrors, pageErrors } = captureErrors(page);

  await page.setViewportSize(viewport);
  await page.goto(homeTechHelpUrl, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/In-Home Tech Support in Vero Beach/);
  await assertPrimaryNavigation(page, "/home-tech-help", "Personal Tech Support", "Book Tune-Up");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://verotechcare.com/home-tech-help"
  );
  await expect(page.locator("#services")).toContainText("Tech Tune-Up Visit");
  await expect(page.locator("#services")).toContainText("$250");
  await expect(page.locator("#services .pricing-card")).toHaveCount(1);
  await expect(page.locator("#services .capability-card-grid .capability-card")).toHaveCount(4);
  await expect(page.locator("#services .capability-list")).toHaveCount(0);
  await expect(page.locator("#services .capability-number")).toHaveCount(0);
  await expect(page.locator('#services a[href="/special"]')).toHaveCount(1);
  await expect(page.locator("#services")).not.toContainText("Whole-Home Tech Reset");
  await expect(page.locator("#services")).not.toContainText("Remote Fix Session");
  await expect(page.locator("#services")).not.toContainText("per month");
  await expect(page.locator("#faq")).not.toContainText("24/7 computer monitoring");
  await expect(page.locator("#faq .faq-item")).toHaveCount(6);
  await expect(page.locator(".proof-strip .proof-card")).toHaveCount(3);
  await expect(page.locator(".proof-strip")).toContainText("Help with the things you use");
  await expect(page.locator(".proof-strip")).toContainText("Know what comes next");
  await expect(page.locator(".proof-strip")).toContainText("After I leave, I’ll send a detailed next-steps sheet");
  await expect(page.locator(".proof-strip")).not.toContainText("Unity Spiritual Center");
  await expect(page.locator(".proof-strip")).not.toContainText("Careful by default");
  const featuredRecommendation = page.locator(".proof-strip .proof-card-featured");
  await expect(featuredRecommendation.locator(".proof-value")).toHaveText("Understanding and reliable.");
  await expect(featuredRecommendation).toContainText(
    "Helped me set up my computers and streaming services! Very understanding and reliable."
  );
  await expect(featuredRecommendation.locator("a")).toHaveCount(0);
  await expect(page.locator("#services .pricing-note a[href^=mailto]")).toHaveCount(1);
  await expect(page.locator("#services .pricing-note a[href^=tel]")).toHaveCount(1);
  await expect(page.locator("footer .footer-contact-links a[href^=mailto]")).toHaveCount(1);
  await expect(page.locator("footer .footer-contact-links a[href^=tel]")).toHaveCount(1);
  await expect(page.locator("footer .footer-links a[href^=mailto]")).toHaveCount(0);
  await expect(page.locator("footer .footer-links a[href^=tel]")).toHaveCount(0);
  await expect(page.locator("#contact")).toHaveCount(0);
  await expect(page.locator(".home-hero .hero-panel")).toHaveCount(0);
  await expect(page.locator(".home-hero .hero-benefits")).toHaveCount(0);

  const residentialStructure = await page.locator("main > section").evaluateAll((sections) =>
    sections.map((section) => section.id || (
      section.classList.contains("business-bridge-main") ? "business-bridge-main" : ""
    ))
  );
  expect(residentialStructure).toEqual([
    "services",
    "faq",
    "business-bridge-main"
  ]);

  await expect(page.locator('.nav-links a[href="/business-websites"]')).toHaveCount(1);
  await expect(page.locator(".nav-links a")).toHaveCount(3);
  await expect(page.locator('.nav-links a[href="/"]')).toHaveText("Home");
  await expect(page.locator('.nav-links a[href="/home-tech-help"]')).toHaveText("Personal Tech Support");
  await expect(page.locator('.nav-links a[href="/home-tech-help"]')).toHaveAttribute(
    "aria-current",
    "page"
  );
  await expect(page.locator('.nav-links a[href="/business-websites"]')).toHaveText("Business Tech Support");
  await expect(page.locator(".business-bridge-main")).toContainText("free 15-minute consultation");
  await expect(page.locator(".business-bridge-main")).not.toContainText("$1,500");
  await expect(page.locator('.business-bridge-main a[href="/business-websites"]')).toHaveText(
    "Explore Business Tech Support"
  );
  await expect(page.locator('.nav-cta[href="/special"]')).toHaveText("Book Tune-Up");
  await expect(page.locator(".page-nav")).toHaveCount(0);

  const tuneUpLinks = page.locator('a[href="/special"]');
  await expect(page.locator('a[href="/special"]:visible').first()).toBeVisible();
  expect(await tuneUpLinks.count()).toBeGreaterThan(0);
  await expect(page.locator('a[href="/book"]')).toHaveCount(0);
  await expect(page.locator("#booking")).toHaveCount(0);
  await expect(page.locator("#booking-embed")).toHaveCount(0);

  if (viewport.width >= 820) {
    const heroTitleLayout = await page.evaluate(() => {
      const title = document.querySelector("#hero-title");
      const lead = document.querySelector(".primary-page-hero .lead");
      const range = document.createRange();
      range.selectNodeContents(title);
      const titleLineRects = [...range.getClientRects()];

      return {
        lineCount: titleLineRects.length,
        titleContentBottom: Math.max(...titleLineRects.map((rect) => rect.bottom)),
        leadTop: lead.getBoundingClientRect().top
      };
    });

    expect(heroTitleLayout.lineCount).toBe(2);
    expect(heroTitleLayout.titleContentBottom).toBeLessThanOrEqual(heroTitleLayout.leadTop + 1);
  }

  await assertNoOverflow(page);

  await page.screenshot({
    path: `test-results/screenshots/home-tech-help-${viewportName}.png`,
    fullPage: true
  });

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
}

async function runBusinessWebsitesSmoke(page, viewportName, viewport) {
  const { consoleErrors, pageErrors } = captureErrors(page);

  await page.setViewportSize(viewport);
  await page.goto(businessWebsitesUrl, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/Business Tech Support in Vero Beach/);
  await assertPrimaryNavigation(
    page,
    "/business-websites",
    "Business Tech Support",
    "Book Consult"
  );
  await expect(page.locator("#hero-title")).toHaveText("For local business owners.");
  await expect(page.locator(".business-hero .hero-panel")).toHaveCount(0);
  await expect(page.locator(".business-hero .hero-benefits")).toHaveCount(0);
  await expect(page.locator("#business-support")).toContainText("Technology and digital setup");
  await expect(page.locator("#business-support .pricing-line")).toHaveCount(3);
  await expect(page.locator("body")).not.toContainText("$1,500");
  await expect(page.locator("#scope")).toHaveCount(0);
  await expect(page.locator("#workflow")).toHaveCount(0);
  await expect(page.locator("#contact")).toHaveCount(0);
  await expect(page.locator("#faq .faq-item")).toHaveCount(6);
  await expect(page.locator("#faq")).toContainText("never send passwords");
  await expect(page.locator(".business-bridge-main")).toContainText("For home and family");
  await expect(page.locator(".business-bridge-main")).toContainText("Need technology help at home?");
  await expect(page.locator('.business-bridge-main a[href="/home-tech-help"]')).toHaveText(
    "Explore Personal Tech Support"
  );
  await expect(page.locator("body")).not.toContainText("Digital Presence");
  await expect(page.locator("body")).not.toContainText("$300");
  await expect(page.locator("body")).not.toContainText("Book Checkup");
  await expect(page.locator('.nav-links a[href="/"]')).toHaveCount(1);
  await expect(page.locator('.nav-links a[href="/home-tech-help"]')).toHaveText(
    "Personal Tech Support"
  );
  await expect(page.locator('.nav-links a[href="/business-websites"]')).toHaveAttribute(
    "aria-current",
    "page"
  );
  await expect(page.locator(".page-nav")).toHaveCount(0);

  const businessStructure = await page.locator("main > section").evaluateAll((sections) =>
    sections.map((section) => section.id || (
      section.classList.contains("business-bridge-main") ? "business-bridge-main" : ""
    ))
  );
  expect(businessStructure).toEqual([
    "business-support",
    "faq",
    "business-bridge-main"
  ]);

  const consultationLinks = page.locator('a[href="/business-consult"]');
  const visibleConsultationLinks = page.locator('a[href="/business-consult"]:visible');
  expect(await visibleConsultationLinks.count()).toBeGreaterThan(0);
  expect(await consultationLinks.count()).toBeGreaterThan(1);
  await expect(page.locator(".mobile-dock a")).toHaveText([
    "Book Consult",
    "Text",
    "Call",
    "Email"
  ]);
  await expect(page.locator('.mobile-dock a[href^="sms:"]')).toHaveCount(1);
  await expect(page.locator('.mobile-dock a[href^="tel:"]')).toHaveCount(1);
  await expect(page.locator('.mobile-dock a[href="/business-consult"]')).toHaveCount(1);
  await expect(page.locator('.mobile-dock a[href^="mailto:"]')).toHaveCount(1);
  await expect(page.locator('a[href="/book-digital-presence-checkup"]')).toHaveCount(0);
  await expect(page.locator('a[href^="https://app.acuityscheduling.com"]')).toHaveCount(0);

  await assertNoOverflow(page);

  await page.waitForTimeout(900);

  await page.screenshot({
    path: `test-results/screenshots/business-websites-${viewportName}.png`,
    fullPage: true
  });

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
}

async function runBusinessConsultBookingSmoke(page, viewportName, viewport) {
  const { consoleErrors, pageErrors } = captureErrors(page);

  await page.setViewportSize(viewport);
  await page.goto(businessConsultBookingUrl, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/Free Business Tech Consult/);
  await assertPrimaryNavigation(
    page,
    "/business-websites",
    "Business Tech Support",
    "Choose Time"
  );
  await expect(page.locator("#hero-title")).toHaveText("Free 15-minute business consult.");
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://verotechcare.com/business-consult"
  );
  await expect(page.locator("header .proof-strip .proof-card")).toHaveCount(3);
  await expect(page.locator("#schedule-title")).toHaveText("Choose a time.");
  await expect(page.locator("#booking")).toContainText("CJ will call");
  await expect(page.locator("#booking")).toContainText("do not send passwords");

  const bookingFrame = page.locator("#booking-embed");
  await expect(bookingFrame).toHaveAttribute(
    "src",
    /app\.acuityscheduling\.com\/schedule\.php\?owner=38883336/
  );
  await expect(bookingFrame).toHaveAttribute("src", /appointmentType=91121958/);
  await expect(bookingFrame).not.toHaveAttribute("src", /appointmentType=(?:93474728|93634542)/);
  await expect(page.locator(".scheduler-fallback")).toContainText("Can't see the scheduler?");
  await expect(page.locator(".scheduler-loading")).toHaveAttribute("role", "status");
  await expect(page.locator(".mobile-dock")).toHaveCount(1);

  await assertSchedulerLoaded(page);
  await assertNoOverflow(page);

  await page.screenshot({
    path: `test-results/screenshots/business-consult-${viewportName}.png`,
    fullPage: true
  });

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
}

async function runBookingPageSmoke(page, viewportName, viewport) {
  const { consoleErrors, pageErrors } = captureErrors(page);

  await page.setViewportSize(viewport);
  await page.goto(bookingUrl, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/Book Tech Tune-Up/);
  await expect(page.locator("#hero-title")).toHaveText(
    "Book your Tech Tune-Up."
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
  await expect(page.locator("#schedule-title")).toHaveText("Book Tune-Up.");
  await expect(page.locator("#booking .booking-guide article")).toHaveCount(3);

  const bookingFrame = page.locator("#booking-embed");
  await expect(bookingFrame).toHaveAttribute(
    "src",
    /app\.acuityscheduling\.com\/schedule\.php\?owner=38883336/
  );
  await expect(bookingFrame).toHaveAttribute("src", /appointmentType=93634542/);
  await expect(bookingFrame).not.toHaveAttribute("src", /calendarID=/);
  await expect(page.locator(".scheduler-fallback")).toContainText("Can't see the scheduler?");
  await expect(page.locator(".scheduler-loading")).toHaveAttribute("role", "status");
  await expect(page.locator(".mobile-dock")).toHaveCount(1);

  await assertSchedulerLoaded(page);

  await assertNoOverflow(page);

  await page.screenshot({
    path: `test-results/screenshots/booking-${viewportName}.png`,
    fullPage: true
  });

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
}

async function runDigitalPresenceBookingSmoke(page, viewportName, viewport) {
  const { consoleErrors, pageErrors } = captureErrors(page);

  await page.setViewportSize(viewport);
  await page.goto(digitalPresenceBookingPageUrl, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/Book Digital Presence Checkup/);
  await expect(page.locator("#hero-title")).toHaveText("Digital Presence Checkup.");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
  await expect(page.locator("header .proof-strip .proof-card")).toHaveCount(3);
  await expect(page.locator("header .proof-strip")).toContainText("One action plan");
  await expect(page.locator("body")).not.toContainText("through 2026");
  await expect(page.locator("#booking")).toContainText("book at least 3 business days out");
  await expect(page.locator("#booking .booking-guide article")).toHaveCount(0);
  await expect(page.locator("#booking .scheduler-note")).toContainText("public website and profile links");

  const bookingFrame = page.locator("#booking-embed");
  await expect(bookingFrame).toHaveAttribute(
    "src",
    /app\.acuityscheduling\.com\/schedule\.php\?owner=38883336/
  );
  await expect(bookingFrame).toHaveAttribute("src", /appointmentType=93474728/);
  await expect(page.locator(".scheduler-fallback")).toContainText("Can't see the scheduler?");
  await expect(page.locator(".scheduler-loading")).toHaveAttribute("role", "status");
  await expect(page.locator(".mobile-dock")).toHaveCount(1);

  await assertSchedulerLoaded(page);

  await assertNoOverflow(page);

  await page.screenshot({
    path: `test-results/screenshots/digital-presence-booking-${viewportName}.png`,
    fullPage: true
  });

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
}

async function runCurrentSpecialSmoke(page, viewportName, viewport) {
  const { consoleErrors, pageErrors } = captureErrors(page);

  await page.setViewportSize(viewport);
  await page.goto(currentSpecialUrl, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/Tech Tune-Up Visit/);
  await expect(page.locator("#hero-title")).toHaveText("Tech Tune-Up Visit.");
  await expect(page.locator(".hero-intro")).toHaveCount(0);
  await expect(page.locator("body")).toContainText("$250");
  await expect(page.locator("body")).not.toContainText("$187.50");
  await expect(page.locator("body")).not.toContainText("25% off");
  await expect(page.locator("body")).not.toContainText("MEMORIAL25");
  await expect(page.locator("#schedule-title")).toHaveText("Book Tune-Up.");
  await expect(page.locator("#booking .booking-guide article")).toHaveCount(0);

  const bookingFrame = page.locator("#booking-embed");
  await expect(bookingFrame).toHaveAttribute(
    "src",
    /app\.acuityscheduling\.com\/schedule\.php\?owner=38883336/
  );
  await expect(bookingFrame).toHaveAttribute("src", /appointmentType=93634542/);
  await expect(bookingFrame).not.toHaveAttribute("src", /certificate=/);
  await expect(bookingFrame).not.toHaveAttribute("src", /calendarID=/);
  await expect(page.locator(".scheduler-fallback")).toContainText("Can't see the scheduler?");
  await expect(page.locator(".scheduler-loading")).toHaveAttribute("role", "status");
  await expect(page.locator(".mobile-dock")).toHaveCount(1);

  await assertSchedulerLoaded(page);

  await assertNoOverflow(page);

  await page.screenshot({
    path: `test-results/screenshots/special-${viewportName}.png`,
    fullPage: true
  });

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
}

test("Vero Tech Care homepage desktop smoke test", async ({ page }) => {
  await runHomepageSmoke(page, "desktop", { width: 1440, height: 1100 });
});

test("Vero Tech Care homepage mobile smoke test", async ({ page }) => {
  await runHomepageSmoke(page, "mobile", { width: 390, height: 900 });
});

test("Vero Tech Care homepage small-phone navigation smoke test", async ({ page }) => {
  await runHomepageSmoke(page, "small-phone", { width: 320, height: 568 });
});

test("Personal Tech Support page desktop smoke test", async ({ page }) => {
  await runHomeTechHelpSmoke(page, "desktop", { width: 1440, height: 1100 });
});

test("Personal Tech Support page mobile smoke test", async ({ page }) => {
  await runHomeTechHelpSmoke(page, "mobile", { width: 390, height: 900 });
});

test("Personal Tech Support page small-phone navigation smoke test", async ({ page }) => {
  await runHomeTechHelpSmoke(page, "small-phone", { width: 320, height: 568 });
});

test("Business Tech Support page desktop smoke test", async ({ page }) => {
  await runBusinessWebsitesSmoke(page, "desktop", { width: 1440, height: 1100 });
});

test("Business Tech Support page mobile smoke test", async ({ page }) => {
  await runBusinessWebsitesSmoke(page, "mobile", { width: 390, height: 900 });
});

test("Business Tech Support page small-phone navigation smoke test", async ({ page }) => {
  await runBusinessWebsitesSmoke(page, "small-phone", { width: 320, height: 568 });
});

test("every customer-facing page shares the four-action mobile dock", async ({ page }) => {
  for (const [pageName, fileName, primaryLabel, primaryHref, hasScheduler] of mobileDockPages) {
    await page.setViewportSize({ width: 390, height: 900 });
    const pageUrl = pathToFileURL(path.join(siteRoot, fileName)).toString();
    await page.goto(pageUrl, { waitUntil: "domcontentloaded" });

    const dock = page.locator(".mobile-dock");
    const actions = dock.locator("a");
    await expect(dock, `${pageName} quick-action dock`).toHaveCount(1);
    await expect(dock).toHaveAttribute("aria-label", "Quick actions");
    await expect(actions).toHaveText([primaryLabel, "Text", "Call", "Email"]);
    await expect(actions.first()).toHaveAttribute("href", primaryHref);
    await expect(dock.locator('a[href="sms:+17725884324"]')).toHaveCount(1);
    await expect(dock.locator('a[href="tel:+17725884324"]')).toHaveCount(1);
    await expect(dock.locator('a[href^="mailto:cj@verotechcare.com"]')).toHaveCount(1);
    await expect(dock).toHaveAttribute("aria-hidden", "true");
    await expect(dock).toBeHidden();
    await assertNoOverflow(page);

    if (hasScheduler) {
      await page.setViewportSize({ width: 320, height: 568 });
      const revealPosition = await page.evaluate(() => {
        const hero = document.querySelector("header .primary-page-hero");
        const scheduler = document.querySelector(".scheduler-embed-shell");
        const heroTop = hero.getBoundingClientRect().top + window.scrollY;
        const schedulerTop = scheduler.getBoundingClientRect().top + window.scrollY;
        const showAfter = Math.max(0, heroTop - window.innerHeight * 0.25);
        return Math.max(showAfter + 1, Math.min(showAfter + 120, schedulerTop - window.innerHeight - 8));
      });
      await page.evaluate((position) => window.scrollTo(0, position), revealPosition);
      await expect(dock, `${pageName} dock before scheduler`).toHaveClass(/is-visible/);
      await expect(dock).toHaveAttribute("aria-hidden", "false");
      await assertNoOverflow(page);

      await page.locator(".scheduler-embed-shell").scrollIntoViewIfNeeded();
      await expect(dock, `${pageName} dock over scheduler`).not.toHaveClass(/is-visible/);
      await expect(dock).toHaveAttribute("aria-hidden", "true");
      await expect(dock).toBeHidden();
    } else {
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await expect(dock, `${pageName} dock after page trigger`).toHaveClass(/is-visible/);
      await expect(dock).toHaveAttribute("aria-hidden", "false");
      await expect(dock).toBeVisible();
      await assertNoOverflow(page);
    }
  }
});

test("Smartphone Confidence workflow stays discoverable, fact-backed, and low friction", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });

  await page.goto(pathToFileURL(path.join(siteRoot, "index.html")).toString(), {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator('#choose-path a[href="/smartphone-confidence"]')).toHaveText(
    "Explore community smartphone workshops"
  );

  await page.goto(pathToFileURL(path.join(siteRoot, "workshops.html")).toString(), {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator('main a[href="/smartphone-confidence"]')).toHaveText(
    "Explore Smartphone Confidence"
  );
  const workshopNavigation = page.locator(".primary-site-nav");
  await expect(workshopNavigation).not.toHaveClass(/is-open/);
  await page.locator(".nav-menu-toggle").click();
  await expect(workshopNavigation).toHaveClass(/is-open/);
  await expect(page.locator("#primary-nav-links")).toBeVisible();

  await page.goto(pathToFileURL(path.join(siteRoot, "smartphone-confidence.html")).toString(), {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator("h1")).toHaveText("Smartphone Confidence Series.");
  await expect(page.locator('#series-parts a[href="/smartphone-confidence-basics"]')).toHaveText(
    "View Part 1 Notes"
  );
  await expect(page.locator("#series-parts .path-card")).toHaveCount(3);
  await expect(page.locator("#parts-title")).toHaveText("Choose the class you want to join.");
  await expect(page.locator("#series-parts")).toContainText("August 30, 2026");
  await expect(page.locator("#series-parts")).toContainText("September 20, 2026");
  await expect(page.locator("#series-parts")).toContainText("11:30 AM");
  await expect(page.locator("#series-parts")).toContainText("Date TBD");
  await expect(page.locator("#series-parts")).toContainText("Unity Spiritual Center of Vero Beach");
  await expect(page.locator("#series-parts")).toContainText("Registration is free");
  await expect(page.locator("#series-parts")).toContainText("$20 donation");
  await expect(page.locator("main")).not.toContainText(/(?:chapel|sanctuary)/i);

  const part1Registration = page.locator(
    '#series-parts a[data-series-registration="part-1"]'
  );
  const part2Registration = page.locator(
    '#series-parts a[data-series-registration="part-2"]'
  );
  await expect(part1Registration).toHaveText("Save My Seat — Part 1");
  await expect(part1Registration).toHaveAttribute(
    "href",
    "https://app.acuityscheduling.com/schedule.php?owner=38883336&appointmentType=96581893"
  );
  await expect(part2Registration).toHaveText("Save My Seat — Part 2");
  await expect(part2Registration).toHaveAttribute(
    "href",
    "https://app.acuityscheduling.com/schedule.php?owner=38883336&appointmentType=96621892"
  );
  await expect(part1Registration).not.toHaveAttribute("target", "_blank");
  await expect(part2Registration).not.toHaveAttribute("target", "_blank");
  await expect(page.locator('#series-parts [aria-labelledby="part-3-title"] a')).toHaveCount(0);
  await expect(
    page.locator('#series-parts [aria-labelledby="part-3-title"] .series-registration-status')
  ).toHaveText("Registration opens when the date is confirmed.");
  await expect(page.locator(".scheduler-embed-shell")).toHaveCount(0);
  await expect(page.locator('header a[href="#series-parts"]')).toHaveText("Choose a Class");
  await expect(page.locator('.mobile-dock a[href="#series-parts"]')).toHaveText("Choose a Class");
  await expect(page.locator('#series-parts a[href^="mailto:cj@verotechcare.com"]')).toHaveText("Ask a Question");

  await page.goto(pathToFileURL(path.join(siteRoot, "smartphone-confidence-basics.html")).toString(), {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator("h1")).toHaveText("Smartphone Basics.");
  await expect(page.locator("#notes h2").first()).toHaveText("Part 1: Getting Comfortable");
  await expect(page.locator("#notes .class-summary > p")).toHaveCount(2);
  await expect(page.locator('#notes a[href="smartphone-confidence-basics-handout.pdf"]')).toHaveAttribute(
    "download",
    ""
  );
  await expect(page.locator('#notes a[href="smartphone-confidence-basics-handout.png"]')).toHaveCount(0);
  const handoutPreview = page.locator(
    '#notes img[src="smartphone-confidence-basics-handout.png"]'
  );
  await handoutPreview.scrollIntoViewIfNeeded();
  await expect(handoutPreview).toHaveAttribute("width", "1700");
  await expect(handoutPreview).toHaveAttribute("height", "2200");
  await expect
    .poll(() => handoutPreview.evaluate((image) => image.naturalWidth))
    .toBeGreaterThan(0);
  const noteHeadings = await page.locator("#notes h2").allTextContents();
  expect(noteHeadings.some((heading) => /^\d+\./.test(heading.trim()))).toBe(false);
  await expect(page.locator('.resource-next-steps a[href="https://g.page/r/CWFhUlhmySkxEAE/review"]')).toHaveText(
    "Leave a Google Review"
  );
  await expect(page.locator('.resource-next-steps a[href="/special"]')).toHaveText(
    "Book the Tech Tune-Up"
  );
  await assertNoOverflow(page);

  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".site-header")).toBeHidden();
  await expect(page.locator(".site-footer")).toBeHidden();
  await expect(page.locator(".resource-next-steps")).toBeHidden();
  await expect(page.locator("#notes h2").first()).toBeVisible();
});

test("additional workshop routes stay factual and fail closed", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });

  await page.goto(pathToFileURL(path.join(siteRoot, "workshops.html")).toString(), {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator('main a[href="/ai-for-everyday-life"]')).toHaveCount(2);
  await expect(page.locator('main a[href="/phone-clean-up-speed-up"]')).toHaveText(
    "Phone Clean Up & Speed Up"
  );
  await expect(page.locator('main a[href="/ai-for-everyday-life-workshop"]')).toHaveText(
    "AI for Everyday Life"
  );
  await expect(page.locator('main a[href="/phone-clean-up-speed-up-workshop"]')).toHaveText(
    "Phone Clean Up & Speed Up"
  );

  await page.goto(pathToFileURL(path.join(siteRoot, "ai-for-everyday-life.html")).toString(), {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator("h1")).toHaveText("AI for Everyday Life Series.");
  await expect(page.locator("#series-parts .path-card")).toHaveCount(3);
  await expect(page.locator("#series-parts")).toContainText("April 19, 2026");
  await expect(page.locator("#series-parts")).toContainText("11:45 AM");
  await expect(page.locator("#series-parts")).toContainText("Unity Spiritual Center of Vero Beach");
  await expect(page.locator("#series-parts")).toContainText("No current registration is open");
  await expect(page.locator("#series-parts")).not.toContainText(/Spot AI Scams|Health Questions/i);
  await expect(page.locator('#series-parts a[href*="acuityscheduling"]')).toHaveCount(0);
  await expect(page.locator('#series-parts [aria-labelledby="ai-part-2-title"] a')).toHaveCount(0);
  await expect(page.locator('#series-parts [aria-labelledby="ai-part-3-title"] a')).toHaveCount(0);
  await expect(page.locator('header a[href="#series-parts"]')).toHaveText("View Part 1");
  await expect(page.locator('.mobile-dock a[href="#series-parts"]')).toHaveText("View Part 1");
  await assertNoOverflow(page);

  await page.goto(pathToFileURL(path.join(siteRoot, "phone-clean-up-speed-up.html")).toString(), {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator("h1")).toHaveText("Phone Clean Up & Speed Up.");
  await expect(page.locator("#workshop-details")).toContainText("February 22, 2026");
  await expect(page.locator("#workshop-details")).toContainText("Unity Spiritual Center of Vero Beach");
  await expect(page.locator("#workshop-details")).toContainText("no current registration is open");
  await expect(page.locator('main a[href*="acuityscheduling"]')).toHaveCount(0);
  await expect(page.locator('header a[href="#workshop-details"]')).toHaveText("Workshop Details");
  await expect(page.locator('.mobile-dock a[href="#workshop-details"]')).toHaveText("Workshop Details");
  await assertNoOverflow(page);

  for (const [fileName, historicalHref] of [
    ["ai-for-everyday-life-workshop.html", "/ai-for-everyday-life"],
    ["phone-clean-up-speed-up-workshop.html", "/phone-clean-up-speed-up"]
  ]) {
    await page.goto(pathToFileURL(path.join(siteRoot, fileName)).toString(), {
      waitUntil: "domcontentloaded"
    });
    await expect(page.locator('[data-workshop-registration-state="interest-only"]')).toHaveCount(1);
    await expect(page.locator('[data-workshop-registration-state="interest-only"]')).toHaveAttribute(
      "href",
      /^mailto:cj@verotechcare\.com/
    );
    await expect(page.locator('main a[href*="acuityscheduling"]')).toHaveCount(0);
    await expect(page.locator(`main a[href="${historicalHref}"]`)).toHaveCount(1);
    await expect(page.locator("main")).not.toContainText(/\b(?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, 20\d{2}\b/);
    await expect(page.locator("main")).not.toContainText("Unity Spiritual Center");
    await assertNoOverflow(page);
  }
});

test("primary beach headers share typography and spacing at every breakpoint", async ({ page }) => {
  const viewports = [
    ["desktop", { width: 1440, height: 1100 }],
    ["navigation-breakpoint", { width: 820, height: 900 }],
    ["mobile", { width: 390, height: 900 }]
  ];

  for (const [viewportName, viewport] of viewports) {
    await page.setViewportSize(viewport);
    const metricsByPage = [];

    for (const [pageName, pageUrl] of primaryHeaderPages) {
      await page.goto(pageUrl, { waitUntil: "load" });
      await expect(page.locator(".primary-page-header")).toHaveCount(1);
      await expect(page.locator(".primary-page-hero")).toHaveCount(1);
      await expect(page.locator(".primary-page-hero .eyebrow")).toHaveCount(0);

      const metrics = await page.evaluate(() => {
        const header = document.querySelector(".primary-page-header");
        const topbar = header.querySelector(".topbar-content");
        const nav = header.querySelector(".primary-site-nav");
        const navLinks = header.querySelector(".site-nav-links");
        const brand = header.querySelector(".brand-mark");
        const navLink = header.querySelector(".site-nav-links a");
        const hero = header.querySelector(".primary-page-hero");
        const title = hero.querySelector("h1");
        const lead = hero.querySelector(".lead");
        const navRect = nav.getBoundingClientRect();
        const navLinksRect = navLinks.getBoundingClientRect();
        const navLinkWidths = [...navLinks.querySelectorAll("a")].map((link) => link.getBoundingClientRect().width);
        const topbarStyle = getComputedStyle(topbar);
        const navStyle = getComputedStyle(nav);
        const brandStyle = getComputedStyle(brand);
        const navLinkStyle = getComputedStyle(navLink);
        const heroStyle = getComputedStyle(hero);
        const titleStyle = getComputedStyle(title);
        const leadStyle = getComputedStyle(lead);
        const headerStyle = getComputedStyle(header);

        return {
          viewportWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          topbarDisplay: topbarStyle.display,
          topbarFontFamily: topbarStyle.fontFamily,
          topbarFontSize: topbarStyle.fontSize,
          topbarLineHeight: topbarStyle.lineHeight,
          topbarHeight: topbar.getBoundingClientRect().height,
          navDisplay: navStyle.display,
          navHeight: navRect.height,
          navPaddingTop: navStyle.paddingTop,
          navPaddingBottom: navStyle.paddingBottom,
          navCenterOffset: Math.abs(
            (navLinksRect.left + navLinksRect.width / 2) -
            (navRect.left + navRect.width / 2)
          ),
          navLinksWidth: navLinksRect.width,
          navLinkWidths,
          brandFontFamily: brandStyle.fontFamily,
          brandFontSize: brandStyle.fontSize,
          brandLineHeight: brandStyle.lineHeight,
          navFontFamily: navLinkStyle.fontFamily,
          navFontSize: navLinkStyle.fontSize,
          navLineHeight: navLinkStyle.lineHeight,
          heroPaddingTop: heroStyle.paddingTop,
          heroPaddingBottom: heroStyle.paddingBottom,
          titleFontFamily: titleStyle.fontFamily,
          titleFontSize: titleStyle.fontSize,
          titleLineHeight: titleStyle.lineHeight,
          titleMarginBottom: titleStyle.marginBottom,
          leadFontFamily: leadStyle.fontFamily,
          leadFontSize: leadStyle.fontSize,
          leadLineHeight: leadStyle.lineHeight,
          heroBackgroundSize: headerStyle.backgroundSize
        };
      });

      expect(metrics.scrollWidth, `${viewportName} ${pageName} horizontal overflow`).toBeLessThanOrEqual(
        metrics.viewportWidth + 1
      );
      expect(metrics.heroBackgroundSize, `${viewportName} ${pageName} hero photo fit`).toContain("auto 100%");
      if (viewport.width >= 820) {
        expect(metrics.navCenterOffset, `${viewportName} ${pageName} navigation centering`).toBeLessThanOrEqual(1);
      }
      metricsByPage.push([pageName, metrics]);
    }

    const [, baseline] = metricsByPage[0];
    const parityKeys = [
      "topbarDisplay",
      "topbarFontFamily",
      "topbarFontSize",
      "topbarLineHeight",
      "topbarHeight",
      "navDisplay",
      "navHeight",
      "navPaddingTop",
      "navPaddingBottom",
      "brandFontFamily",
      "brandFontSize",
      "brandLineHeight",
      "navFontFamily",
      "navFontSize",
      "navLineHeight",
      "heroPaddingTop",
      "heroPaddingBottom",
      "titleFontFamily",
      "titleFontSize",
      "titleLineHeight",
      "titleMarginBottom",
      "leadFontFamily",
      "leadFontSize",
      "leadLineHeight"
    ];

    for (const [pageName, metrics] of metricsByPage.slice(1)) {
      expect(metrics.navLinksWidth, `${viewportName} ${pageName} navigation width`).toBe(baseline.navLinksWidth);
      expect(metrics.navLinkWidths, `${viewportName} ${pageName} navigation link widths`).toEqual(baseline.navLinkWidths);
      for (const key of parityKeys) {
        expect(metrics[key], `${viewportName} ${pageName} ${key}`).toBe(baseline[key]);
      }
    }
  }
});

test("customer-facing pages share compact desktop hero spacing without hero actions", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  const metricsByPage = [];

  for (const [pageName, fileName] of sharedHeroPages) {
    const pageUrl = pathToFileURL(path.join(siteRoot, fileName)).toString();
    await page.goto(pageUrl, { waitUntil: "load" });

    const hero = page.locator("header .primary-page-hero");
    const cards = page.locator("header .proof-strip .proof-card");
    await expect(hero, `${pageName} shared hero`).toHaveCount(1);
    await expect(hero.locator(".hero-actions"), `${pageName} hero actions`).toHaveCount(0);
    await expect(cards, `${pageName} hero cards`).toHaveCount(3);
    await expect(cards.locator(".card-label"), `${pageName} hero card eyebrow labels`).toHaveCount(0);

    const metrics = await page.evaluate(() => {
      const sharedHero = document.querySelector("header .primary-page-hero");
      const sharedCards = [...document.querySelectorAll("header .proof-strip .proof-card")];
      const heroCopy = sharedHero.querySelector(".hero-copy");
      const title = sharedHero.querySelector("h1");
      const lead = sharedHero.querySelector(".lead");
      return {
        heroHeight: sharedHero.getBoundingClientRect().height,
        heroCopyWidth: heroCopy.getBoundingClientRect().width,
        titleTop: title.getBoundingClientRect().top - sharedHero.getBoundingClientRect().top,
        leadTop: lead.getBoundingClientRect().top - sharedHero.getBoundingClientRect().top,
        leadBottom: lead.getBoundingClientRect().bottom - sharedHero.getBoundingClientRect().top,
        cardGap: sharedCards[0].getBoundingClientRect().top - lead.getBoundingClientRect().bottom,
        cardHeights: sharedCards.map((card) => card.getBoundingClientRect().height),
        scrollWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth
      };
    });

    expect(metrics.scrollWidth, `${pageName} horizontal overflow`).toBeLessThanOrEqual(metrics.viewportWidth + 1);
    metricsByPage.push([pageName, metrics]);
  }

  const [, baseline] = metricsByPage[0];
  for (const [pageName, metrics] of metricsByPage.slice(1)) {
    expect(metrics.heroCopyWidth, `${pageName} hero copy width`).toBe(baseline.heroCopyWidth);
    expect(metrics.titleTop, `${pageName} title should begin inside the hero`).toBeGreaterThanOrEqual(0);
    expect(metrics.leadTop, `${pageName} lead should follow the title`).toBeGreaterThan(metrics.titleTop);
    expect(metrics.leadBottom, `${pageName} lead should fit inside the hero`).toBeLessThanOrEqual(metrics.heroHeight);
    expect(metrics.cardGap, `${pageName} card spacing`).toBeGreaterThanOrEqual(24);
    expect(metrics.cardGap, `${pageName} card spacing`).toBeLessThanOrEqual(48);
    expect(metrics.cardHeights, `${pageName} card heights`).toEqual(baseline.cardHeights);
  }
});

test("customer-facing section headings avoid redundant top gaps", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  const structuralHeadingSelector = [
    ".section-heading > h1",
    ".section-heading > h2",
    ".about-copy > h2:first-child",
    ".contact-copy > h2:first-child",
    ".scheduler-shell > h2:first-child",
    ".article-content > h1:first-child",
    ".article-content > h2:first-child"
  ].join(", ");

  for (const [pageName, fileName] of sharedHeroPages) {
    const pageUrl = pathToFileURL(path.join(siteRoot, fileName)).toString();
    await page.goto(pageUrl, { waitUntil: "load" });

    const headingMetrics = await page.locator(structuralHeadingSelector).evaluateAll((headings) =>
      headings.map((heading) => {
        const section = heading.closest(".section");
        return {
          marginTop: Number.parseFloat(getComputedStyle(heading).marginTop),
          gapFromSectionTop: heading.getBoundingClientRect().top - section.getBoundingClientRect().top
        };
      })
    );

    expect(headingMetrics.length, `${pageName} structural heading count`).toBeGreaterThan(0);
    for (const metrics of headingMetrics) {
      expect(metrics.marginTop, `${pageName} heading margin`).toBe(0);
      expect(metrics.gapFromSectionTop, `${pageName} section top gap`).toBeLessThanOrEqual(56);
    }
  }
});

test("Legacy Book page desktop smoke test", async ({ page }) => {
  await runBookingPageSmoke(page, "desktop", { width: 1440, height: 1100 });
});

test("Legacy Book page mobile smoke test", async ({ page }) => {
  await runBookingPageSmoke(page, "mobile", { width: 390, height: 900 });
});

test("Digital Presence Checkup booking page desktop smoke test", async ({ page }) => {
  await runDigitalPresenceBookingSmoke(page, "desktop", { width: 1440, height: 1100 });
});

test("Digital Presence Checkup booking page mobile smoke test", async ({ page }) => {
  await runDigitalPresenceBookingSmoke(page, "mobile", { width: 390, height: 900 });
});

test("Business Tech Consult booking page desktop smoke test", async ({ page }) => {
  await runBusinessConsultBookingSmoke(page, "desktop", { width: 1440, height: 1100 });
});

test("Business Tech Consult booking page mobile smoke test", async ({ page }) => {
  await runBusinessConsultBookingSmoke(page, "mobile", { width: 390, height: 900 });
});

test("Business Tech Consult booking page small-phone smoke test", async ({ page }) => {
  await runBusinessConsultBookingSmoke(page, "small-phone", { width: 320, height: 568 });
});

test("Tech Tune-Up Visit booking page desktop smoke test", async ({ page }) => {
  await runCurrentSpecialSmoke(page, "desktop", { width: 1440, height: 1100 });
});

test("Tech Tune-Up Visit booking page mobile smoke test", async ({ page }) => {
  await runCurrentSpecialSmoke(page, "mobile", { width: 390, height: 900 });
});

for (const [pageName, fileName] of secondaryPages) {
  test(`${pageName} desktop visual quality`, async ({ page }) => {
    await runSecondaryPageQuality(
      page,
      pageName,
      fileName,
      "desktop",
      { width: 1440, height: 1100 }
    );
  });

  test(`${pageName} mobile visual quality`, async ({ page }) => {
    await runSecondaryPageQuality(
      page,
      pageName,
      fileName,
      "mobile",
      { width: 390, height: 900 }
    );
  });
}

test("all internal page links and fragments resolve", async () => {
  const htmlFiles = fs.readdirSync(siteRoot).filter((file) => file.endsWith(".html"));
  const sourceByFile = new Map(
    htmlFiles.map((file) => [file, fs.readFileSync(path.join(siteRoot, file), "utf8")])
  );

  for (const [fileName, source] of sourceByFile) {
    if (fileName === "google19831672bbe53c8b.html") continue;

    const currentRoute = fileName === "index.html"
      ? "/"
      : `/${fileName.replace(/\.html$/, "")}`;
    const hrefs = [...source.matchAll(/<a\b[^>]*\bhref="([^"]+)"/gi)]
      .map((match) => match[1]);

    for (const href of hrefs) {
      if (/^(?:https?:|mailto:|tel:|sms:)/i.test(href)) continue;

      const resolved = new URL(href, `https://verotechcare.com${currentRoute}`);
      const routeFiles = new Map();
      const normalizedPath = resolved.pathname.replace(/^\//, "").replace(/\/$/, "");
      const extension = path.extname(normalizedPath);

      if (extension && extension !== ".html") {
        expect(
          fs.existsSync(path.join(siteRoot, normalizedPath)),
          `${fileName}: ${href}`
        ).toBe(true);
        continue;
      }

      const targetFile = resolved.pathname === "/"
        ? "index.html"
        : routeFiles.get(resolved.pathname)
          || (normalizedPath.endsWith(".html") ? normalizedPath : `${normalizedPath}.html`);

      expect(sourceByFile.has(targetFile), `${fileName}: ${href}`).toBe(true);

      if (resolved.hash) {
        const fragment = resolved.hash.slice(1);
        const targetSource = sourceByFile.get(targetFile);
        expect(
          new RegExp(`\\bid=["']${fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`).test(targetSource),
          `${fileName}: ${href}`
        ).toBe(true);
      }
    }
  }
});

test("public route and sitemap contracts stay simplified", async () => {
  const redirects = fs.readFileSync(path.join(siteRoot, "_redirects"), "utf8");
  const sitemap = fs.readFileSync(path.join(siteRoot, "sitemap.xml"), "utf8");
  const headers = fs.readFileSync(path.join(siteRoot, "_headers"), "utf8");

  expect(redirects).toContain("/book /special 301");
  expect(redirects).toContain("/digital-presence-management /business-websites 301");
  expect(redirects).toContain("/testhome1.html / 301");
  expect(redirects).toContain("/testhome1 / 301");
  expect(redirects).toContain("/testhome2.html / 301");
  expect(redirects).toContain("/testhome2 / 301");
  expect(redirects).toContain("/testhome3.html / 301");
  expect(redirects).toContain("/testhome3 / 301");
  expect(redirects).toContain("/rhythm-soul-studio-overview.html https://rhythmandsoulvero.com/ 301");
  expect(redirects).toContain("/rhythm-soul-studio-overview https://rhythmandsoulvero.com/ 301");
  expect(redirects).toContain("/workshop-check-in.html /workshop-check-in 301");
  expect(redirects).toContain("/check-in.html /check-in 301");
  expect(redirects).toContain("/workshop-check-in-setup.html /check-in 301");
  expect(redirects).toContain("/workshop-check-in-setup /check-in 301");
  expect(redirects).not.toContain("/business-websites /digital-presence-management.html 200");
  expect(sitemap).toContain("https://verotechcare.com/special");
  expect(sitemap).toContain("https://verotechcare.com/business-websites");
  expect(sitemap).toContain("https://verotechcare.com/business-consult");
  expect(sitemap).toContain("https://verotechcare.com/home-tech-help");
  expect(sitemap).toContain("https://verotechcare.com/smartphone-confidence");
  expect(sitemap).toContain("https://verotechcare.com/smartphone-confidence-basics");
  expect(sitemap).toContain("https://verotechcare.com/ai-for-everyday-life");
  expect(sitemap).toContain("https://verotechcare.com/ai-for-everyday-life-workshop");
  expect(sitemap).toContain("https://verotechcare.com/phone-clean-up-speed-up");
  expect(sitemap).toContain("https://verotechcare.com/phone-clean-up-speed-up-workshop");
  expect(sitemap).not.toContain("<loc>https://verotechcare.com/book</loc>");
  expect(sitemap).not.toContain("<loc>https://verotechcare.com/book-digital-presence-checkup</loc>");
  expect(sitemap).not.toContain("<loc>https://verotechcare.com/digital-presence-management</loc>");
  expect(sitemap).not.toContain("testhome1");
  expect(sitemap).not.toContain("testhome2");
  expect(sitemap).not.toContain("testhome3");
  expect(sitemap).not.toContain("rhythm-soul-studio-overview");
  expect(sitemap).not.toContain("workshop-check-in");
  expect(sitemap).not.toContain("<loc>https://verotechcare.com/check-in</loc>");
  expect(headers).not.toContain("/testhome1*");
  expect(headers).not.toContain("/testhome2*");
  expect(headers).not.toContain("/testhome3*");
  expect(headers).not.toContain("/rhythm-soul-studio-overview*");
  expect(headers).toContain("/workshop-check-in");
  expect(headers).toContain("/check-in");
  expect(headers).toContain("X-Robots-Tag: noindex, nofollow, noarchive");
  expect(headers).toContain("Cache-Control: no-store, max-age=0");
});

test("direct-only workshop check-in pages stay private, minimal, and senior-friendly", async () => {
  const checkin = fs.readFileSync(path.join(siteRoot, "workshop-check-in.html"), "utf8");
  const setup = fs.readFileSync(path.join(siteRoot, "check-in.html"), "utf8");
  const legacySetup = fs.readFileSync(path.join(siteRoot, "workshop-check-in-setup.html"), "utf8");
  const setupScript = fs.readFileSync(path.join(siteRoot, "workshop-check-in-setup.js"), "utf8");
  const stylesheet = fs.readFileSync(path.join(siteRoot, "workshop-check-in.css"), "utf8");
  const headers = fs.readFileSync(path.join(siteRoot, "_headers"), "utf8");
  const sitemap = fs.readFileSync(path.join(siteRoot, "sitemap.xml"), "utf8");
  const navigation = fs.readFileSync(path.join(siteRoot, "navigation.js"), "utf8");
  const routes = JSON.parse(fs.readFileSync(path.join(siteRoot, "_routes.json"), "utf8"));
  const middleware = fs.readFileSync(path.join(siteRoot, "functions/_middleware.js"), "utf8");

  for (const [fileName, source] of [
    ["workshop-check-in.html", checkin],
    ["check-in.html", setup]
  ]) {
    expect(source, `${fileName} should be no-indexed`).toContain(
      '<meta name="robots" content="noindex, nofollow, noarchive" />'
    );
    expect(source, `${fileName} should not use public navigation`).not.toMatch(/<nav\b/i);
    expect(source, `${fileName} should not use the public footer`).not.toMatch(/<footer\b/i);
    expect(source, `${fileName} should not use inline styles`).not.toMatch(/\sstyle=/i);
  }

  expect(checkin).toContain('<label for="full-name">Full name</label>');
  expect(checkin).toContain('Email <span>(optional)</span>');
  expect(checkin).toContain('Phone <span>(optional)</span>');
  expect(checkin).toContain('type="submit">Sign me in</button>');
  expect(checkin).toContain(
    "Email is optional. If you share it, Vero Tech Care may send workshop follow-up and occasional tech tips. You can unsubscribe anytime."
  );
  expect(checkin).not.toMatch(/localStorage/i);
  expect(setup).toContain('type="password"');
  expect(setup).toContain('id="setup-password"');
  expect(setup).not.toContain('name="setupPassword"');
  expect(setup).not.toContain('id="event-id"');
  expect(setup).not.toContain("Workshop code");
  expect(setup).not.toMatch(/id="setup-password"[\s\S]*?\svalue=/i);
  expect(setup).toContain('id="open-button" class="checkin-primary-action" type="button"');
  expect(setup).toContain("Loading secure setup…");
  expect(setup).toContain("JavaScript must be enabled before this iPad can open workshop check-in.");
  expect(setup).toContain('workshop-check-in.css?v=20260818-ipad-feedback');
  expect(setup).toContain('workshop-check-in-setup.js?v=20260818-ipad-feedback');
  expect(setup).toContain('id="setup-status"');
  expect(setup).toContain('aria-atomic="true"');
  expect(setup).toContain('id="setup-success"');
  expect(setup).toContain('tabindex="-1"');
  expect(setupScript).not.toContain("?.");
  expect(setupScript).toContain('typeof AbortController === "undefined"');
  expect(setup).toBe(legacySetup);
  expect(sitemap).not.toContain("workshop-check-in");
  expect(sitemap).not.toContain("<loc>https://verotechcare.com/check-in</loc>");
  expect(navigation).not.toContain("workshop-check-in");
  expect(navigation).not.toContain('href="/check-in"');
  expect(routes.include).toContain("/api/workshop-check-in/*");
  for (const privateRoute of [
    "/README.md",
    "/WEBSITE_STANDARDS.md",
    "/AGENTS.md",
    "/_tools/*",
    "/functions/*",
    "/migrations/*"
  ]) {
    expect(routes.include).toContain(privateRoute);
  }
  expect(middleware).toContain('return new Response("Not found.\\n"');
  expect(middleware).toContain('"Cache-Control": "no-store, max-age=0"');
  for (const operationalAsset of [
    "/workshop-check-in.css",
    "/workshop-check-in.js",
    "/workshop-check-in-setup.js"
  ]) {
    expect(headers).toContain(`${operationalAsset}\n  Cache-Control: no-store, max-age=0`);
  }
  expect(stylesheet).toMatch(/font-size:\s*18px;/i);
  expect(stylesheet).toMatch(/min-height:\s*58px;/i);
  expect(stylesheet).toMatch(/outline:\s*3px solid/i);
});

test("workshop setup makes confirmed success unmistakable on an iPad-sized screen", async ({ page }) => {
  const { consoleErrors, pageErrors } = captureErrors(page);
  await page.setViewportSize({ width: 1080, height: 810 });
  await page.goto(checkinSetupUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    window.__setupFetchCalls = 0;
    window.__resolveSetupFetch = null;
    window.__setupRequest = null;
    window.fetch = (resource, options) => {
      window.__setupFetchCalls += 1;
      window.__setupRequest = {
        resource,
        method: options.method,
        cache: options.cache,
        credentials: options.credentials,
        headers: options.headers,
        body: JSON.parse(options.body)
      };
      return new Promise((resolve) => {
        window.__resolveSetupFetch = () =>
          resolve(
            new Response(
              JSON.stringify({
                ok: true,
                event: { id: "smartphone-confidence-part-1-2026-08-30", status: "open" }
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            )
          );
      });
    };
  });

  const password = page.getByLabel("Setup password");
  const openButton = page.locator("#open-button");
  await password.fill("fake-test-password");
  await openButton.click();
  await expect(openButton).toBeDisabled();
  await expect(openButton).toHaveText("Opening workshop…");
  await page.locator("#setup-form").evaluate((form) =>
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
  );
  await expect(password).toHaveValue("fake-test-password");
  await expect(page.locator("#setup-success")).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.__setupFetchCalls)).toBe(1);
  await page.evaluate(() => window.__resolveSetupFetch());

  const success = page.locator("#setup-success");
  await expect(success).toBeVisible();
  await expect(success).toBeFocused();
  await expect(success).toContainText("The workshop is open.");
  await expect(page.locator("#setup-status")).toHaveAttribute("data-state", "success");
  await expect(password).toHaveValue("");
  await page.waitForTimeout(300);

  const result = await page.evaluate(() => {
    const rect = document.querySelector("#setup-success").getBoundingClientRect();
    return {
      calls: window.__setupFetchCalls,
      request: window.__setupRequest,
      top: rect.top,
      bottom: rect.bottom,
      viewportHeight: window.innerHeight
    };
  });
  expect(result.calls).toBe(1);
  expect(result.request).toEqual({
    resource: "/api/workshop-check-in/activate",
    method: "POST",
    cache: "no-store",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: {
      action: "open",
      setupPassword: "fake-test-password",
      event: {
        title: "Smartphone Confidence, Part 1: Smartphone Basics",
        details: "August 30, 2026 at 11:30 AM · Unity Spiritual Center"
      }
    }
  });
  expect(result.top).toBeGreaterThanOrEqual(0);
  expect(result.bottom).toBeLessThanOrEqual(result.viewportHeight + 1);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("workshop setup preserves the password and focuses an unmistakable failure", async ({ page }) => {
  const { consoleErrors, pageErrors } = captureErrors(page);
  await page.setViewportSize({ width: 1080, height: 810 });
  await page.goto(checkinSetupUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    window.fetch = async () =>
      new Response(
        JSON.stringify({
          ok: false,
          code: "ACCESS_DENIED",
          message: "The setup password was not accepted."
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
  });

  const password = page.getByLabel("Setup password");
  await password.fill("fake-test-password");
  await page.getByRole("button", { name: "Open and activate this iPad" }).click();

  const status = page.locator("#setup-status");
  await expect(status).toHaveAttribute("data-state", "error");
  await expect(status).toHaveAttribute("role", "alert");
  await expect(status).toHaveAttribute("aria-live", "assertive");
  await expect(status).toBeFocused();
  await expect(status).toContainText("The setup password was not accepted.");
  await expect(status).toContainText("Nothing was cleared.");
  await expect(password).toHaveValue("fake-test-password");
  await expect(page.locator("#setup-success")).toBeHidden();

  const result = await status.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, viewportHeight: window.innerHeight };
  });
  expect(result.top).toBeGreaterThanOrEqual(0);
  expect(result.bottom).toBeLessThanOrEqual(result.viewportHeight + 1);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("workshop setup keeps validation and network failures visible without clearing fields", async ({ page }) => {
  const { consoleErrors, pageErrors } = captureErrors(page);
  await page.setViewportSize({ width: 1080, height: 810 });
  await page.goto(checkinSetupUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => {
    window.__setupFetchCalls = 0;
    window.fetch = async () => {
      window.__setupFetchCalls += 1;
      throw new TypeError("Simulated offline state");
    };
  });

  const title = page.getByLabel("Workshop title");
  const details = page.getByLabel("Date, time, and location");
  const password = page.getByLabel("Setup password");
  const openButton = page.getByRole("button", { name: "Open and activate this iPad" });
  const status = page.locator("#setup-status");

  await password.fill("short");
  await openButton.click();
  await expect(status).toHaveAttribute("data-state", "error");
  await expect(status).toBeFocused();
  await expect(status).toContainText("at least 10 characters");
  await expect(password).toHaveValue("short");
  await expect.poll(() => page.evaluate(() => window.__setupFetchCalls)).toBe(0);

  await password.fill("fake-test-password");
  await openButton.click();
  await expect(status).toContainText("could not reach Vero Tech Care");
  await expect(status).toContainText("Nothing was cleared.");
  await expect(title).toHaveValue("Smartphone Confidence, Part 1: Smartphone Basics");
  await expect(details).toHaveValue("August 30, 2026 at 11:30 AM · Unity Spiritual Center");
  await expect(password).toHaveValue("fake-test-password");
  await expect(openButton).toBeEnabled();
  await expect(page.locator("#setup-success")).toBeHidden();
  await expect.poll(() => page.evaluate(() => window.__setupFetchCalls)).toBe(1);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test("workshop setup cannot serialize a password when its script is unavailable", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(checkinSetupUrl, { waitUntil: "domcontentloaded" });

  const password = page.getByLabel("Setup password");
  await password.fill("fake-test-password");
  await expect(page.getByRole("button", { name: "Open and activate this iPad" })).toBeDisabled();
  await expect(page.locator("#setup-status")).toContainText("Loading secure setup…");

  const serializedFields = await page.locator("#setup-form").evaluate((form) =>
    [...new FormData(form).entries()]
  );
  expect(serializedFields).toEqual([]);
  expect(page.url()).not.toContain("fake-test-password");
  expect(page.url()).not.toContain("setupPassword=");
  await context.close();
});

test("shared HTML source contracts stay valid", async () => {
  const htmlFiles = fs.readdirSync(siteRoot).filter((file) => file.endsWith(".html"));

  for (const fileName of htmlFiles) {
    if (fileName === "google19831672bbe53c8b.html") continue;
    if (operationalHtmlFiles.has(fileName)) continue;
    const source = fs.readFileSync(path.join(siteRoot, fileName), "utf8");

    const footer = source.match(/<footer\b[\s\S]*?<\/footer>/i)?.[0];
    expect(footer, `${fileName} should use the shared site footer`).toBeTruthy();
    expect(footer, `${fileName} footer should use the shared brand copy`).toContain(
      "Premium, patient in-home tech support for Vero Beach and nearby homes."
    );
    expect(footer, `${fileName} footer should include the shared social links`).toContain(
      'aria-label="Social links"'
    );
    expect(footer, `${fileName} footer should include the shared contact links`).toContain(
      'aria-label="Contact Vero Tech Care"'
    );

    const footerNavigation = footer.match(/<nav class="footer-links"[\s\S]*?<\/nav>/i)?.[0];
    const footerHrefs = [...footerNavigation.matchAll(/\bhref="([^"]+)"/gi)]
      .map((match) => match[1]);
    expect(footerHrefs, `${fileName} footer links should use the shared order`).toEqual([
      "/",
      "/home-tech-help",
      "/business-websites",
      "/workshops",
      "/tech-tips"
    ]);
    expect(footerNavigation, `${fileName} footer should not include Book Tune-Up`).not.toContain(
      "Book Tune-Up"
    );

    expect(source, `${fileName} should not use inline layout styles`).not.toMatch(/\sstyle=/i);
    expect(source, `${fileName} should use one clear heading instead of an eyebrow-title stack`).not.toMatch(
      /class="[^"]*\beyebrow\b[^"]*"/i
    );

    const sharedHeader = source.match(/<header\b[^>]*\bprimary-page-header\b[\s\S]*?<\/header>/i)?.[0];
    expect(sharedHeader, `${fileName} should use the shared image-backed hero header`).toBeTruthy();
    expect(sharedHeader, `${fileName} should use one shared hero`).toMatch(
      /<section\b[^>]*\bprimary-page-hero\b/i
    );
    expect(sharedHeader, `${fileName} should not include a hero action row`).not.toMatch(
      /<div class="hero-actions[^"]*"/i
    );

    const heroCards = sharedHeader.match(/<section class="proof-strip[\s\S]*?<\/section>/i)?.[0];
    expect(heroCards, `${fileName} should include the shared hero card strip`).toBeTruthy();
    expect(
      (heroCards.match(/<article class="proof-card\b/gi) || []).length,
      `${fileName} should use exactly three hero cards`
    ).toBe(3);
    expect(heroCards, `${fileName} hero cards should not use eyebrow labels`).not.toMatch(
      /\bcard-label\b/i
    );
    expect(source, `${fileName} should not publish legacy residential packages or prices`).not.toMatch(
      /(?:Whole-Home Tech Reset|New Device Done Right|Photo (?:&|&amp;) Memory Safety Package|Scam Safety (?:&|&amp;) Account Security Visit|Life Story \/ Tribute Video|Remote Fix Session|Tech Care Check-In|Tech Care Plus|Family Tech Care|\$(?:125|225|325|350|495|750)\b|\$\d+\s+per month)/i
    );

    const jsonLdBlocks = [...source.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/gi)];
    for (const block of jsonLdBlocks) {
      expect(() => JSON.parse(block[1]), `${fileName} JSON-LD should parse`).not.toThrow();
    }

    const externalBlankLinks = [...source.matchAll(/<a\b[^>]*\bhref="https?:[^"]+"[^>]*\btarget="_blank"[^>]*>/gi)];
    for (const match of externalBlankLinks) {
      expect(match[0], `${fileName} external links should protect the opener`).toMatch(
        /\brel="[^"]*\bnoopener\b[^"]*"/i
      );
    }
  }
});

test("visual system contract stays stable", async () => {
  const stylesheet = fs.readFileSync(path.join(siteRoot, "style.css"), "utf8");

  expect(stylesheet).toMatch(/--charcoal:\s*#111514;/i);
  expect(stylesheet).toMatch(/--ivory:\s*#f6f1e7;/i);
  expect(stylesheet).toMatch(/--accent:\s*#3e8c8c;/i);
  expect(stylesheet).toMatch(/font-family:\s*"Avenir Next",\s*"Segoe UI",\s*"Helvetica Neue",\s*Arial,\s*sans-serif;/i);
  expect(stylesheet).toMatch(/font-family:\s*"Big Caslon",\s*"Book Antiqua",\s*"Palatino Linotype",\s*serif;/i);
  expect(stylesheet).toMatch(/\.wrap\s*\{[\s\S]*?width:\s*min\(1120px,\s*calc\(100%\s*-\s*1\.5rem\)\);/i);
});
