const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const siteRoot = path.resolve(__dirname, "../../..");

const homepageUrl = pathToFileURL(
  path.resolve(__dirname, "../../../index.html")
).toString();
const businessWebsitesUrl = pathToFileURL(
  path.resolve(__dirname, "../../../business-websites.html")
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

const secondaryPages = [
  ["404", "404.html"],
  ["tech-tips", "tech-tips.html"],
  ["workshops", "workshops.html"],
  ["tips-scam-texts", "tips-scam-texts.html"],
  ["tips-iphone-storage", "tips-iphone-storage.html"],
  ["tips-photo-backup", "tips-photo-backup.html"],
  ["tips-when-to-book-help", "tips-when-to-book-help.html"],
  ["tips-senior-tech-safety-checklist", "tips-senior-tech-safety-checklist.html"]
];

async function assertAboutScrolledIntoView(page) {
  await page.waitForFunction(() => {
    const about = document.querySelector("#about");
    if (!about) return false;
    const rect = about.getBoundingClientRect();
    return rect.top >= -20 && rect.top < window.innerHeight * 0.35;
  });
}

function captureErrors(page) {
  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();
      if (text !== "requestStorageAccess: Permission denied.") {
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

async function assertSchedulerLoaded(page) {
  const scheduler = page.frameLocator("iframe.scheduler-frame");
  const schedulerMain = scheduler.getByRole("main");

  await expect(schedulerMain).toBeVisible({ timeout: 15000 });
  const schedulerText = await schedulerMain.innerText();
  expect(schedulerText.trim().length).toBeGreaterThan(40);

  const frameSize = await page.locator("iframe.scheduler-frame").evaluate((frame) => ({
    height: frame.getBoundingClientRect().height,
    width: frame.getBoundingClientRect().width
  }));
  expect(frameSize.width).toBeGreaterThan(250);
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
  await expect(page).toHaveTitle(/Vero Tech Care/);

  const about = page.locator("#about");
  await expect(about).toBeVisible();
  await expect(page.locator("#about-title")).toHaveText(
    "Local help from someone who explains things clearly."
  );
  await expect(page.locator("#about .about-points li")).toHaveCount(0);
  await expect(page.locator("#services")).toContainText("Tech Tune-Up Visit");
  await expect(page.locator("#services")).toContainText("$250");
  await expect(page.locator("#services .pricing-card")).toHaveCount(1);
  await expect(page.locator("#services .service-path-grid .path-card")).toHaveCount(6);
  await expect(page.locator('#services a[href="/special"]')).toHaveCount(2);
  await expect(page.locator("#services")).not.toContainText("Whole-Home Tech Reset");
  await expect(page.locator("#services")).not.toContainText("Remote Fix Session");
  await expect(page.locator("#services")).not.toContainText("per month");
  await expect(page.locator("#faq")).not.toContainText("24/7 computer monitoring");
  await expect(page.locator("#faq .faq-item")).toHaveCount(5);

  await expect(page.locator('.nav-links a[href="/business-websites"]')).toBeVisible();
  await expect(page.locator('.nav-links a[href="#services"]')).toHaveText("Home Tech Help");
  await expect(page.locator('.nav-links a[href="/business-websites"]')).toHaveText("Business Help");
  await expect(page.locator(".business-bridge-main")).toContainText(
    "Complete website projects start at $1,500"
  );
  await expect(page.locator('.business-bridge-main a[href="/business-websites"]')).toHaveText(
    "View Business Websites"
  );
  await expect(page.locator('.nav-cta[href="/special"]')).toHaveText("Book Tune-Up");
  await expect(page.locator(".page-nav")).toHaveCount(0);

  await page.locator(".footer-links").scrollIntoViewIfNeeded();
  await page.locator('.footer-links a[href="#about"]').click();
  await assertAboutScrolledIntoView(page);

  const tuneUpLinks = page.locator('a[href="/special"]');
  await expect(tuneUpLinks.first()).toBeVisible();
  expect(await tuneUpLinks.count()).toBeGreaterThan(0);
  await expect(page.locator('a[href="/book"]')).toHaveCount(0);
  await expect(page.locator("#booking")).toHaveCount(0);
  await expect(page.locator("#booking-embed")).toHaveCount(0);

  await assertNoOverflow(page);

  await page.screenshot({
    path: `test-results/screenshots/homepage-${viewportName}.png`,
    fullPage: true
  });

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
}

async function runBusinessWebsitesSmoke(page, viewportName, viewport) {
  const { consoleErrors, pageErrors } = captureErrors(page);

  await page.setViewportSize(viewport);
  await page.goto(businessWebsitesUrl, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/Local Business Website Build or Redesign/);
  await expect(page.locator("#hero-title")).toHaveText(
    "Local Business Website Build or Redesign."
  );
  await expect(page.locator("#website-offer")).toContainText("Starting price");
  await expect(page.locator("#website-offer")).toContainText("$1,500");
  await expect(page.locator("#scope .path-card")).toHaveCount(6);
  await expect(page.locator("#workflow")).toContainText("Simple scope");
  await expect(page.locator("#ownership")).toContainText("Manager access or guided screen share");
  await expect(page.locator("body")).not.toContainText("Digital Presence");
  await expect(page.locator("body")).not.toContainText("$300");
  await expect(page.locator("body")).not.toContainText("Book Checkup");
  await expect(page.locator('.nav-links a[href="/"]')).toBeVisible();
  await expect(page.locator('.nav-links a[href="/business-websites"]')).toHaveAttribute(
    "aria-current",
    "page"
  );
  await expect(page.locator(".page-nav")).toHaveCount(0);

  const quoteLinks = page.locator('a[href*="subject=Website%20Project%20Quote%20Request"]');
  await expect(quoteLinks.first()).toBeVisible();
  expect(await quoteLinks.count()).toBeGreaterThan(1);
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

async function runBookingPageSmoke(page, viewportName, viewport) {
  const { consoleErrors, pageErrors } = captureErrors(page);

  await page.setViewportSize(viewport);
  await page.goto(bookingUrl, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/Book Tech Tune-Up/);
  await expect(page.locator("#hero-title")).toHaveText(
    "Book your Tech Tune-Up."
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
  await expect(page.locator("#booking")).toContainText("Choose a time for your Tech Tune-Up Visit");
  await expect(page.locator("#booking .booking-guide article")).toHaveCount(3);

  const bookingFrame = page.locator("#booking-embed");
  await expect(bookingFrame).toHaveAttribute(
    "src",
    /app\.acuityscheduling\.com\/schedule\.php\?owner=38883336/
  );
  await expect(bookingFrame).toHaveAttribute("src", /appointmentType=93634542/);
  await expect(bookingFrame).not.toHaveAttribute("src", /calendarID=/);
  await expect(page.locator(".scheduler-fallback")).toContainText("Can't see the scheduler?");

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
  await expect(page.locator("#hero-title")).toHaveText(
    "Book your Digital Presence Checkup."
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
  await expect(page.locator(".hero-card-primary")).toContainText("Founding price");
  await expect(page.locator("body")).not.toContainText("through 2026");
  await expect(page.locator("#booking")).toContainText(
    "already pointed to the business checkup"
  );
  await expect(page.locator("#booking .booking-guide article")).toHaveCount(3);

  const bookingFrame = page.locator("#booking-embed");
  await expect(bookingFrame).toHaveAttribute(
    "src",
    /app\.acuityscheduling\.com\/schedule\.php\?owner=38883336/
  );
  await expect(bookingFrame).toHaveAttribute("src", /appointmentType=93474728/);
  await expect(page.locator(".scheduler-fallback")).toContainText("Can't see the scheduler?");

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
  await expect(page.locator(".hero-intro")).toHaveText("The standard first visit");
  await expect(page.locator("body")).toContainText("$250");
  await expect(page.locator("body")).not.toContainText("$187.50");
  await expect(page.locator("body")).not.toContainText("25% off");
  await expect(page.locator("body")).not.toContainText("MEMORIAL25");
  await expect(page.locator("#booking")).toContainText(
    "Choose a time below to book your Tech Tune-Up Visit."
  );
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

test("Business Websites page desktop smoke test", async ({ page }) => {
  await runBusinessWebsitesSmoke(page, "desktop", { width: 1440, height: 1100 });
});

test("Business Websites page mobile smoke test", async ({ page }) => {
  await runBusinessWebsitesSmoke(page, "mobile", { width: 390, height: 900 });
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
      const targetFile = resolved.pathname === "/"
        ? "index.html"
        : routeFiles.get(resolved.pathname)
          || `${resolved.pathname.replace(/^\//, "").replace(/\/$/, "")}.html`;

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

  expect(redirects).toContain("/book /special 301");
  expect(redirects).toContain("/digital-presence-management /business-websites 301");
  expect(redirects).not.toContain("/business-websites /digital-presence-management.html 200");
  expect(sitemap).toContain("https://verotechcare.com/special");
  expect(sitemap).toContain("https://verotechcare.com/business-websites");
  expect(sitemap).not.toContain("<loc>https://verotechcare.com/book</loc>");
  expect(sitemap).not.toContain("<loc>https://verotechcare.com/book-digital-presence-checkup</loc>");
  expect(sitemap).not.toContain("<loc>https://verotechcare.com/digital-presence-management</loc>");
});

test("shared HTML source contracts stay valid", async () => {
  const htmlFiles = fs.readdirSync(siteRoot).filter((file) => file.endsWith(".html"));

  for (const fileName of htmlFiles) {
    if (fileName === "google19831672bbe53c8b.html") continue;
    const source = fs.readFileSync(path.join(siteRoot, fileName), "utf8");

    expect(source, `${fileName} should not use inline layout styles`).not.toMatch(/\sstyle=/i);
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
