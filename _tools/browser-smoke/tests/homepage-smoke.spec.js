const { test, expect } = require("@playwright/test");
const path = require("path");
const { pathToFileURL } = require("url");

const homepageUrl = pathToFileURL(
  path.resolve(__dirname, "../../../index.html")
).toString();

async function assertAboutScrolledIntoView(page) {
  await page.waitForFunction(() => {
    const about = document.querySelector("#about");
    if (!about) return false;
    const rect = about.getBoundingClientRect();
    return rect.top >= -20 && rect.top < window.innerHeight * 0.35;
  });
}

async function runHomepageSmoke(page, viewportName, viewport) {
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

  await page.locator('.nav-links a[href="#about"]').click();
  await assertAboutScrolledIntoView(page);

  await page.locator(".footer-links").scrollIntoViewIfNeeded();
  await page.locator('.footer-links a[href="#about"]').click();
  await assertAboutScrolledIntoView(page);

  const bookingLinks = page.locator('a[href="#booking-embed"]');
  await expect(bookingLinks.first()).toBeVisible();
  expect(await bookingLinks.count()).toBeGreaterThan(0);

  const bookingFrame = page.locator("#booking-embed");
  await expect(bookingFrame).toHaveAttribute(
    "src",
    /app\.acuityscheduling\.com\/schedule\.php\?owner=38883336/
  );
  await expect(bookingFrame).toHaveAttribute("src", /calendarID=13853126/);

  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.viewportWidth + 1);

  await page.screenshot({
    path: `test-results/screenshots/homepage-${viewportName}.png`,
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
