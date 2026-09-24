const { test, expect } = require("@playwright/test");
const { spawn } = require("child_process");
const net = require("net");
const path = require("path");

const siteRoot = path.resolve(__dirname, "../../..");
const stripeLink = "https://buy.stripe.com/eVq8wIa22fEM7YO1JZ2Fa00";
let server;
let baseUrl;

async function freePort() {
  const listener = net.createServer();
  await new Promise((resolve) => listener.listen(0, "127.0.0.1", resolve));
  const port = listener.address().port;
  await new Promise((resolve) => listener.close(resolve));
  return port;
}

test.beforeAll(async () => {
  const port = await freePort();
  baseUrl = `http://127.0.0.1:${port}`;
  server = spawn("python3", ["_tools/browser-smoke/local_preview_server.py", "--port", String(port)], {
    cwd: siteRoot,
    stdio: "ignore"
  });
  for (let tries = 0; tries < 40; tries++) {
    try {
      if ((await fetch(`${baseUrl}/pay`)).ok) return;
    } catch { /* server is starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Local payment preview did not start");
});

test.afterAll(() => server?.kill());

async function mockPayment(page, { configStatus = 200, sessionStatus = 200, sdkStatus = 200 } = {}) {
  const requests = [];
  await page.route("**/api/payment/config", (route) => route.fulfill({
    status: configStatus,
    contentType: "application/json",
    body: configStatus === 200
      ? JSON.stringify({ mode: "live", publishableKey: "pk_live_browser_test" })
      : JSON.stringify({ error: "unavailable" })
  }));
  await page.route("**/api/payment/session", async (route) => {
    requests.push(JSON.parse(route.request().postData()));
    await route.fulfill({
      status: sessionStatus,
      contentType: "application/json",
      body: sessionStatus === 200
        ? JSON.stringify({ clientSecret: "cs_test_browser_only" })
        : JSON.stringify({ error: "unavailable" })
    });
  });
  await page.route("https://js.stripe.com/dahlia/stripe.js", (route) => route.fulfill({
    status: sdkStatus,
    contentType: "application/javascript",
    body: sdkStatus === 200 ? `
      window.Stripe = (key) => ({
        createEmbeddedCheckoutPage: async ({ fetchClientSecret, onComplete }) => {
          window.__stripeKey = key;
          window.__paymentComplete = onComplete;
          window.__clientSecret = await fetchClientSecret();
          return {
            mount(selector) {
              document.querySelector(selector).innerHTML = '<div data-test-embedded-checkout style="height: 900px">Secure payment form</div>';
            },
            destroy() {
              window.__destroyCount = (window.__destroyCount || 0) + 1;
            }
          };
        }
      });
    ` : ""
  }));
  return requests;
}

test("valid amount opens embedded checkout and completion removes duplicate payment action", async ({ page }) => {
  const requests = await mockPayment(page);
  await page.goto(`${baseUrl}/pay`);
  await expect(page.getByRole("button", { name: "Continue to Payment" })).toBeEnabled();
  await page.getByLabel("Amount in US dollars").fill("125.50");
  await page.getByRole("button", { name: "Continue to Payment" }).click();
  await expect(page.locator("[data-test-embedded-checkout]")).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(requests[0].amount).toBe("125.50");
  expect(requests[0].attemptId).toMatch(/^[0-9a-f-]{36}$/i);
  expect(await page.evaluate(() => window.__stripeKey)).toBe("pk_live_browser_test");
  await expect(page.locator("#payment-fallback a")).toHaveAttribute("href", stripeLink);

  await page.evaluate(() => window.__paymentComplete());
  await expect(page.locator("#payment-complete")).toBeVisible();
  await expect(page.locator("#payment-complete")).toBeFocused();
  await expect(page.locator("#payment-fallback")).toBeHidden();
  await expect(page.locator("#payment-amount-form")).toBeHidden();
  await expect(page.locator("#payment-checkout")).toBeHidden();
});

test("invalid amounts never request a payment session", async ({ page }) => {
  const requests = await mockPayment(page);
  await page.goto(`${baseUrl}/pay`);
  await expect(page.getByRole("button", { name: "Continue to Payment" })).toBeEnabled();
  const amount = page.getByLabel("Amount in US dollars");
  for (const value of ["0.99", "10000.01", "12.345", "-2", "abc"]) {
    await amount.fill(value);
    await amount.evaluate((input) => input.form.requestSubmit());
    await expect(page.locator("#payment-status")).toContainText("Enter an amount from $1 to $10,000");
  }
  expect(requests).toHaveLength(0);
  await expect(page.locator("#payment-fallback a")).toHaveAttribute("href", stripeLink);
});

test("retry keeps the same attempt and changing amount starts a new one", async ({ page }) => {
  const requests = await mockPayment(page);
  let failFirst = true;
  await page.unroute("**/api/payment/session");
  await page.route("**/api/payment/session", (route) => {
    requests.push(JSON.parse(route.request().postData()));
    const status = failFirst ? 503 : 200;
    failFirst = false;
    return route.fulfill({
      status,
      contentType: "application/json",
      body: status === 200 ? JSON.stringify({ clientSecret: "cs_test_browser_only" }) : "{}"
    });
  });
  await page.goto(`${baseUrl}/pay`);
  const amount = page.getByLabel("Amount in US dollars");
  const continueButton = page.getByRole("button", { name: "Continue to Payment" });
  await amount.fill("42.25");
  await continueButton.click();
  await expect(page.locator("#payment-status")).toContainText("unavailable");
  await expect(continueButton).toBeEnabled();
  await continueButton.click();
  await expect(page.locator("[data-test-embedded-checkout]")).toBeVisible();
  expect(requests.map((request) => request.amount)).toEqual(["42.25", "42.25"]);
  expect(requests[1].attemptId).toBe(requests[0].attemptId);

  await page.getByRole("button", { name: "Change amount" }).click();
  await expect(amount).toBeVisible();
  await amount.fill("50");
  await continueButton.click();
  await expect(page.locator("[data-test-embedded-checkout]")).toBeVisible();
  expect(requests[2].amount).toBe("50.00");
  expect(requests[2].attemptId).not.toBe(requests[0].attemptId);
});

test("unavailable configuration or Stripe script leaves the hosted payment route visible", async ({ page }) => {
  await mockPayment(page, { configStatus: 503 });
  await page.goto(`${baseUrl}/pay`);
  await expect(page.locator("#payment-status")).toContainText("unavailable");
  await expect(page.locator("#payment-fallback a")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue to Payment" })).toBeDisabled();

  await page.unrouteAll();
  await mockPayment(page, { sdkStatus: 503 });
  await page.reload();
  await page.getByLabel("Amount in US dollars").fill("25");
  await page.getByRole("button", { name: "Continue to Payment" }).click();
  await expect(page.locator("#payment-status")).toContainText("unavailable");
  await expect(page.locator("#payment-fallback a")).toBeVisible();
});

test("no JavaScript keeps the Stripe payment link available", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/pay`);
  await expect(page.locator("#payment-fallback a")).toBeVisible();
  await expect(page.locator("#payment-fallback a")).toHaveAttribute("href", stripeLink);
  await expect(page.getByRole("button", { name: "Continue to Payment" })).toBeDisabled();
  await context.close();
});

test("mobile payment layout fits and the dock does not cover checkout", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await mockPayment(page);
  await page.goto(`${baseUrl}/pay`);
  await page.getByLabel("Amount in US dollars").fill("10");
  await page.getByRole("button", { name: "Continue to Payment" }).click();
  await expect(page.locator("[data-test-embedded-checkout]")).toBeVisible();
  await page.locator("#payment-checkout").scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await expect(page.locator(".mobile-dock")).toBeHidden();
});
