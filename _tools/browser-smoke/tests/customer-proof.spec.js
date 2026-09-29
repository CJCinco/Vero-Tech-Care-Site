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
    expect(cardOrder).toEqual(['FIGCAPTION', 'P', 'BLOCKQUOTE', 'A']);
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
    const fullReviews = proof.locator('.customer-review-card a');
    await expect(fullReviews).toHaveCount(2);
    for (const link of await fullReviews.all()) {
      await expect(link).toBeVisible();
      await expect(link).toHaveText('Read more');
      await expect(link).toHaveAttribute('href', 'https://www.google.com/maps/place/Vero+Tech+Care/@27.7090496,-80.5725545,11z/data=!4m8!3m7!1s0x493d3f6e5940e81:0x3129c96658526161!8m2!3d27.7090496!4d-80.5725545!9m1!1b1!16s%2Fg%2F11n51m53m0');
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
    await expect(proof.locator('.review-summary-label')).toHaveCount(0);
    await expect(proof.locator('[data-review-toggle]:visible')).toHaveCount(0);
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
