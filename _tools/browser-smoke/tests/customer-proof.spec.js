const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const root = path.resolve(__dirname, '../../..');
const liveBase = process.env.VTC_PROOF_BASE_URL;
const home = liveBase || pathToFileURL(path.join(root, 'index.html')).href;

for (const width of [320, 390, 1280]) {
  test(`approved customer proof stays attributed and readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(home);
    const proof = page.locator('.customer-proof');
    await expect(proof.locator('.customer-review-card')).toHaveCount(2);
    await expect(proof.locator('figcaption')).toHaveText(['Linda Barnett · Google review', 'Michele · Google review']);
    await expect(proof.getByRole('img', { name: '5 out of 5 stars' })).toHaveCount(2);
    await expect(proof.locator('blockquote')).toHaveText([
      '“Patient, efficient and well prepared for the service call.”',
      '“very respectful and responsive”'
    ]);
    await expect(proof.locator('.customer-trust-line')).toContainText('5 out of 5 on Google');
    await expect(proof.locator('a[href="https://nextdoor.com/page/vero-tech-care-vero-beach-fl/"]')).toHaveText('Recommended and favorited by neighbors on Nextdoor');
    await expect(proof).not.toContainText(/\d+ (Faves|recommendations|mentions|customers)/i);
    for (const link of await proof.locator('a').all()) {
      await link.focus();
      await expect(link).toBeFocused();
    }
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
