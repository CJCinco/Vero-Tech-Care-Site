const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../../..');

test('review expansion swaps the excerpt and full text with keyboard controls', async ({ page }) => {
  // Synthetic paragraphs also verify keyboard behavior for multi-paragraph reviews.
  await page.setContent(`<figure class="customer-review-card">
    <blockquote data-review-excerpt>Short review excerpt.</blockquote>
    <blockquote id="full-review" data-review-full hidden><p>Complete synthetic review used only for this test.</p><p>A second paragraph.</p></blockquote>
    <button data-review-toggle aria-expanded="false" aria-controls="full-review" hidden>Read more</button>
  </figure>`);
  await page.addScriptTag({ content: fs.readFileSync(path.join(root, 'reviews.js'), 'utf8') });
  const startingURL = page.url();
  const toggle = page.getByRole('button');
  await expect(toggle).toHaveText('Read more');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(toggle).toHaveText('Show less');
  await expect(page.locator('[data-review-excerpt]')).toBeHidden();
  await expect(page.locator('[data-review-full]')).toBeVisible();
  await expect(toggle).toBeFocused();
  expect(page.url()).toBe(startingURL);
  expect(page.context().pages()).toHaveLength(1);
  await expect(page.locator('.customer-review-card a')).toHaveCount(0);
  await expect(page.locator('[data-review-full] p')).toHaveText(['Complete synthetic review used only for this test.', 'A second paragraph.']);
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('[data-review-excerpt]')).toBeVisible();
  await expect(page.locator('[data-review-full]')).toBeHidden();
});
