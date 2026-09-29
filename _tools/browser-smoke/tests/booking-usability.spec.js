const { test, expect } = require('@playwright/test');
const path = require('path');
const { pathToFileURL } = require('url');

const pages = ['business-consult.html', 'special.html', 'book.html', 'book-digital-presence-checkup.html'];

for (const width of [320, 390, 1280]) {
  for (const file of pages) {
    test(`booking controls remain readable: ${file} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(process.env.BOOKING_TEST_BASE_URL
        ? new URL(file, process.env.BOOKING_TEST_BASE_URL).href
        : pathToFileURL(path.resolve(__dirname, '../../..', file)).href);
      await expect(page.locator('.scheduler-timezone')).toHaveText('All appointment times are shown in Eastern Time.');
      if (width <= 600) {
        const bounds = await page.locator('#booking-embed').boundingBox();
        expect(bounds.width).toBeGreaterThanOrEqual(width - 2);
      }
      const frame = page.frameLocator('#booking-embed');
      await expect(frame.getByRole('heading', { name: 'Date & Time', exact: true })).toBeVisible({ timeout: 20000 });
      await page.locator('#booking-embed').scrollIntoViewIfNeeded();
      await expect(frame.getByRole('button', { name: 'Open month picker', exact: true })).toBeVisible();
      const metrics = await frame.locator('body').evaluate(body => {
        const viewport = body.ownerDocument.documentElement.clientWidth;
        const targets = [...body.querySelectorAll('button, input, select, textarea, [role="region"], h2, h3')];
        const clipped = targets.filter(el => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          if (!rect.width || !rect.height || style.visibility === 'hidden' || style.display === 'none') return false;
          if (rect.left < -1 || rect.right > viewport + 1) return true;
          for (let parent = el.parentElement; parent; parent = parent.parentElement) {
            if (!['hidden', 'clip', 'auto', 'scroll'].includes(getComputedStyle(parent).overflowX)) continue;
            const bounds = parent.getBoundingClientRect();
            if (rect.left < bounds.left - 1 || rect.right > bounds.right + 1) return true;
          }
          return false;
        }).map(el => el.getAttribute('aria-label') || el.textContent.trim().slice(0, 60));
        return { viewport, scroll: Math.max(body.scrollWidth, body.ownerDocument.documentElement.scrollWidth), clipped };
      });
      await frame.getByRole('main').screenshot({ path: `test-results/screenshots/inner-${file}-${width}.png` });
      await page.screenshot({ path: `test-results/screenshots/outer-${file}-${width}.png` });

      expect(metrics.scroll).toBeLessThanOrEqual(metrics.viewport + 1);
      expect(metrics.clipped).toEqual([]);
      await expect(page.locator('#booking-embed')).toBeVisible();
      if (['business-consult.html', 'special.html'].includes(file)) {
        await frame.getByRole('button', { name: /[0-9]:[0-9]{2}, .*spot/ }).first().click();
        await expect(frame.getByRole('heading', { name: 'Your Information', exact: true }).first()).toBeVisible();
        const callback = frame.getByRole('textbox', { name: 'Callback phone number *', exact: true });
        if (file === 'business-consult.html') {
          await expect(callback).toBeVisible();
          await expect(callback).toHaveAttribute('aria-required', 'true');
          await expect(frame.getByRole('textbox', { name: /address|city|zip/i })).toHaveCount(0);
        } else {
          await expect(frame.getByRole('textbox', { name: /address for service/i })).toBeVisible();
          await expect(callback).toHaveCount(0);
        }
        await expect(frame.getByRole('button', { name: /Confirm Appointment|Continue/ }).first()).toBeVisible();
        await expect(frame.getByRole('combobox', { name: 'Phone number country', exact: true })).toBeVisible();
        const formBounds = await frame.locator('input,textarea,button,select').evaluateAll(elements => elements.flatMap(el => {
          const r = el.getBoundingClientRect();
          const viewport = el.ownerDocument.documentElement.clientWidth;
          if (!r.width || !r.height || getComputedStyle(el).visibility === 'hidden') return [];
          return r.left < -1 || r.right > viewport + 1 ? [{ tag: el.tagName, name: el.getAttribute('aria-label'), left: r.left, right: r.right, viewport }] : [];
        }));
        expect(formBounds).toEqual([]);
        await frame.locator('body').screenshot({ path: `test-results/screenshots/form-${file}-${width}.png` });
      }
    });
  }
}
