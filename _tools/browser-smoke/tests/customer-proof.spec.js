const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const root = path.resolve(__dirname, '../../..');
const liveBase = process.env.VTC_PROOF_BASE_URL;
const home = liveBase || pathToFileURL(path.join(root, 'index.html')).href;
// Exact review bodies supplied by CJ on September 29, 2026.
const suppliedReviews = [
  "A remarkable tech! Patient, efficient and well prepared for the service call. He completely resolved all my issues in a very reasonable timeframe and took the time to show me how I could utilize both my computer and printer now that they were both up and running efficiently. I would not hesitate to recommend his services and trust that he did everything correctly. He comes highly recommended! 5 Star talent!",
  "Patient and reliable tech care!!  Finally… it can be exhausting to find someone you can trust with in home help. CJ is very respectful and responsive with handling all tech needs. You get what you pay for with his tech services. Well worth it ⭐️⭐️⭐️⭐️⭐️"
];

for (const width of [320, 390, 1280]) {
  test(`approved customer proof stays attributed and readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(home);
    const proof = page.locator('.customer-proof');
    await expect(proof.locator('.customer-review-card')).toHaveCount(2);
    await expect(proof.locator('.review-name')).toHaveText(['Linda Barnett', 'Michele']);
    await expect(proof.locator('.review-avatar')).toHaveCount(2);
    const headersAligned = await proof.locator('figcaption').evaluateAll(headers => headers.every(header => {
      const avatar = header.querySelector('.review-avatar').getBoundingClientRect();
      const name = header.querySelector('.review-name').getBoundingClientRect();
      return name.left >= avatar.right && Math.abs((name.top + name.bottom) / 2 - (avatar.top + avatar.bottom) / 2) < 1;
    }));
    expect(headersAligned).toBe(true);
    await expect(proof.locator('.customer-review-card').first()).toHaveCSS('text-align', 'left');
    const portrait = proof.locator('img.review-avatar');
    await portrait.scrollIntoViewIfNeeded();
    await expect.poll(() => portrait.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    await expect(portrait).toHaveCSS('border-radius', '50%');
    for (const avatar of await proof.locator('.review-avatar').all()) {
      await expect(avatar).toHaveCSS('width', '40px');
      await expect(avatar).toHaveCSS('height', '40px');
    }
    await expect(proof.locator('.review-source')).toHaveCount(0);
    const cardOrder = await proof.locator('.customer-review-card').first().evaluate(card => [...card.children].map(el => el.tagName));
    expect(cardOrder).toEqual(['FIGCAPTION', 'P', 'BLOCKQUOTE', 'BLOCKQUOTE', 'BUTTON']);
    await expect(proof.getByRole('img', { name: '5 out of 5 stars' })).toHaveCount(2);
    await expect(proof.locator('[data-review-excerpt]')).toHaveText([
      '“Patient, efficient and well prepared for the service call.”',
      '“very respectful and responsive”'
    ]);
    await expect(proof.locator('.customer-trust-line')).toContainText('5 out of 5 on Google');
    await expect(proof.locator('a[href="https://nextdoor.com/page/vero-tech-care-vero-beach-fl/"]')).toHaveText('Recommended and favorited by neighbors on Nextdoor');
    await expect(proof).not.toContainText(/\d+ (Faves|recommendations|mentions|customers)/i);
    for (const link of await proof.locator('a:visible').all()) {
      await link.focus();
      await expect(link).toBeFocused();
    }
    await expect(proof.locator('.customer-review-card a')).toHaveCount(0);
    await expect(proof.locator('.review-summary-label')).toHaveCount(0);
    // Exercise the actual page; a synthetic fixture cannot prove that the
    // customer reviews were supplied. Preserve the exact user-provided wording.
    const startingURL = page.url();
    const startingTabs = page.context().pages().length;
    const cards = proof.locator('.customer-review-card');
    for (let i = 0; i < await cards.count(); i++) {
      const card = cards.nth(i);
      const full = card.locator('[data-review-full]');
      const excerpt = card.locator('[data-review-excerpt]');
      const toggle = card.locator('[data-review-toggle]');
      const reviewer = await card.locator('.review-name').innerText();
      const completeText = (await full.textContent()).trim();
      expect(completeText, `${reviewer}: preserve the supplied review verbatim`).toBe(suppliedReviews[i]);
      const excerptText = (await excerpt.textContent()).replace(/[“”]/g, '').trim();
      expect(completeText.length, `${reviewer}: complete review text has not been supplied`).toBeGreaterThan(excerptText.length);
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveText('Read more');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(full).toBeHidden();
      const collapsedHeight = (await card.boundingBox()).height;
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await expect(toggle).toHaveText('Show less');
      await expect(full).toBeVisible();
      await expect(full).toHaveText(completeText);
      await proof.screenshot({ path: path.join(root, '_tools/browser-smoke/output/customer-path-audit-2026-09-29', `stage3-expanded-${i}-${width}.png`) });
      await expect(excerpt).toBeHidden();
      expect((await card.boundingBox()).height).toBeGreaterThan(collapsedHeight);
      await expect(cards.nth(1 - i).locator('[data-review-full]')).toBeHidden();
      expect(page.url()).toBe(startingURL);
      expect(page.context().pages()).toHaveLength(startingTabs);
      await toggle.focus();
      await page.keyboard.press('Space');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(toggle).toHaveText('Read more');
      await expect(full).toBeHidden();
      await expect(excerpt).toBeVisible();
    }
    await page.keyboard.press('Tab');
    const geometry = await proof.evaluate(el => ({
      pageFits: document.documentElement.scrollWidth <= innerWidth,
      cardsFit: [...el.querySelectorAll('.customer-review-card')].every(card => {
        const r = card.getBoundingClientRect();
        return r.left >= 0 && r.right <= innerWidth && card.scrollWidth <= card.clientWidth;
      })
    }));
    expect(geometry).toEqual({ pageFits: true, cardsFit: true });
    await proof.screenshot({ path: path.join(root, '_tools/browser-smoke/output/customer-path-audit-2026-09-29', `stage3-${liveBase ? 'live' : 'local'}-proof-${width}.png`) });
  });
}

test('all customer-facing footers include both approved audiences', async () => {
  const pages = fs.readdirSync(root).filter(name => name.endsWith('.html'))
    .map(name => fs.readFileSync(path.join(root, name), 'utf8'))
    .filter(text => text.includes('class="footer-copy"'));
  expect(pages).toHaveLength(23);
  for (const text of pages) {
    expect(text).toContain('Patient, practical tech support for Vero Beach homes and local businesses.');
    expect(text).not.toContain('Premium, patient in-home tech support for Vero Beach and nearby homes.');
  }
});
