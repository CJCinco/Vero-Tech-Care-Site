const { test, expect } = require("@playwright/test");
const path = require("path");
const { pathToFileURL } = require("url");

const homepageUrl = pathToFileURL(
  path.resolve(__dirname, "../../../index.html")
).toString();
const digitalPresenceUrl = pathToFileURL(
  path.resolve(__dirname, "../../../digital-presence-management.html")
).toString();
const bookingUrl = pathToFileURL(
  path.resolve(__dirname, "../../../book.html")
).toString();
const digitalPresenceBookingPageUrl = pathToFileURL(
  path.resolve(__dirname, "../../../book-digital-presence-checkup.html")
).toString();
const currentSpecialUrl = pathToFileURL(
  path.resolve(__dirname, "../../../current-special.html")
).toString();

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
      consoleErrors.push(message.text());
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

async function runHomepageSmoke(page, viewportName, viewport) {
  const { consoleErrors, pageErrors } = captureErrors(page);

  await page.setViewportSize(viewport);
  await page.goto(homepageUrl, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/Vero Tech Care/);

  const about = page.locator("#about");
  await expect(about).toBeVisible();
  await expect(page.locator("#about-title")).toHaveText(
    "Patient, local tech help you can trust."
  );
  await expect(page.locator("#about .about-points li")).toHaveCount(4);
  await expect(page.locator("#pricing")).toContainText("24/7 computer monitoring");
  await expect(page.locator("#faq")).toContainText(
    "What does 24/7 computer monitoring mean?"
  );
  await expect(page.locator("#faq")).toContainText(
    "What membership options are available?"
  );
  await expect(page.locator("#faq")).toContainText("Tech Care Plus");

  await expect(page.locator('.nav-links a[href="digital-presence-management.html"]')).toBeVisible();
  await expect(page.locator('.nav-cta[href="book.html"]')).toBeVisible();
  await expect(page.locator(".page-nav")).toHaveCount(0);

  await page.locator(".footer-links").scrollIntoViewIfNeeded();
  await page.locator('.footer-links a[href="#about"]').click();
  await assertAboutScrolledIntoView(page);

  const bookingLinks = page.locator('a[href="book.html"]');
  await expect(bookingLinks.first()).toBeVisible();
  expect(await bookingLinks.count()).toBeGreaterThan(0);
  await expect(page.locator("#booking")).toContainText(
    "Booking now has its own page"
  );
  await expect(page.locator("#booking-embed")).toHaveCount(0);

  await assertNoOverflow(page);

  await page.screenshot({
    path: `test-results/screenshots/homepage-${viewportName}.png`,
    fullPage: true
  });

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
}

async function runDigitalPresenceSmoke(page, viewportName, viewport) {
  const { consoleErrors, pageErrors } = captureErrors(page);

  await page.setViewportSize(viewport);
  await page.goto(digitalPresenceUrl, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/Digital Presence Management/);
  await expect(page.locator("#hero-title")).toHaveText(
    "Digital Presence Management for Local Businesses."
  );
  await expect(page.locator("#checkup")).toContainText("Founding price");
  await expect(page.locator("#checkup")).toContainText("$300");
  await expect(page.locator("#scope .path-card")).toHaveCount(6);
  await expect(page.locator("#workflow")).toContainText("Audit first");
  await expect(page.locator("#access")).toContainText("Manager access or guided screen share");
  await expect(page.locator('.nav-links a[href="index.html"]')).toBeVisible();
  await expect(page.locator(".page-nav")).toHaveCount(0);

  const bookingLinks = page.locator('a[href="book-digital-presence-checkup.html"]');
  await expect(bookingLinks.first()).toBeVisible();
  expect(await bookingLinks.count()).toBeGreaterThan(0);
  await expect(page.locator('a[href^="https://app.acuityscheduling.com"]')).toHaveCount(0);

  await assertNoOverflow(page);

  await page.waitForTimeout(900);

  await page.screenshot({
    path: `test-results/screenshots/digital-presence-${viewportName}.png`,
    fullPage: true
  });

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
}

async function runBookingPageSmoke(page, viewportName, viewport) {
  const { consoleErrors, pageErrors } = captureErrors(page);

  await page.setViewportSize(viewport);
  await page.goto(bookingUrl, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/Book Online/);
  await expect(page.locator("#hero-title")).toHaveText(
    "Book the right kind of tech help."
  );
  await expect(page.locator("#booking")).toContainText("Choose your appointment type");
  await expect(page.locator("#booking .booking-guide article")).toHaveCount(3);

  const bookingFrame = page.locator("#booking-embed");
  await expect(bookingFrame).toHaveAttribute(
    "src",
    /app\.acuityscheduling\.com\/schedule\.php\?owner=38883336/
  );
  await expect(bookingFrame).toHaveAttribute("src", /calendarID=13853126/);

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
  await expect(page).toHaveTitle(/Memorial Day Special: 2-Hour Tech Tune-Up/);
  await expect(page.locator("#hero-title")).toHaveText("2-Hour Tech Tune-Up.");
  await expect(page.locator(".hero-intro")).toHaveText("Memorial Day Special");
  await expect(page.locator("body")).toContainText("25% off");
  await expect(page.locator("body")).toContainText("$250");
  await expect(page.locator("body")).toContainText("$187.50");
  await expect(page.locator("body")).not.toContainText("$200");
  await expect(page.locator("body")).toContainText("MEMORIAL25");
  await expect(page.locator("#booking")).toContainText(
    "Choose a time below to book your 2-Hour Tech Tune-Up."
  );
  await expect(page.locator("#booking .booking-guide article")).toHaveCount(0);

  const bookingFrame = page.locator("#booking-embed");
  await expect(bookingFrame).toHaveAttribute(
    "src",
    /app\.acuityscheduling\.com\/schedule\.php\?owner=38883336/
  );
  await expect(bookingFrame).toHaveAttribute("src", /appointmentType=93634542/);
  await expect(bookingFrame).toHaveAttribute("src", /certificate=MEMORIAL25/);
  await expect(bookingFrame).not.toHaveAttribute("src", /calendarID=/);

  await assertNoOverflow(page);

  await page.screenshot({
    path: `test-results/screenshots/current-special-${viewportName}.png`,
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

test("Digital Presence Management page desktop smoke test", async ({ page }) => {
  await runDigitalPresenceSmoke(page, "desktop", { width: 1440, height: 1100 });
});

test("Digital Presence Management page mobile smoke test", async ({ page }) => {
  await runDigitalPresenceSmoke(page, "mobile", { width: 390, height: 900 });
});

test("Book Online page desktop smoke test", async ({ page }) => {
  await runBookingPageSmoke(page, "desktop", { width: 1440, height: 1100 });
});

test("Book Online page mobile smoke test", async ({ page }) => {
  await runBookingPageSmoke(page, "mobile", { width: 390, height: 900 });
});

test("Digital Presence Checkup booking page desktop smoke test", async ({ page }) => {
  await runDigitalPresenceBookingSmoke(page, "desktop", { width: 1440, height: 1100 });
});

test("Digital Presence Checkup booking page mobile smoke test", async ({ page }) => {
  await runDigitalPresenceBookingSmoke(page, "mobile", { width: 390, height: 900 });
});

test("Memorial Day Special booking page desktop smoke test", async ({ page }) => {
  await runCurrentSpecialSmoke(page, "desktop", { width: 1440, height: 1100 });
});

test("Memorial Day Special booking page mobile smoke test", async ({ page }) => {
  await runCurrentSpecialSmoke(page, "mobile", { width: 390, height: 900 });
});
