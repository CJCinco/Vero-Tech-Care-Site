const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../../..');

test('review expansion swaps the excerpt and full text with keyboard controls', async ({ page }) => {
  // Synthetic fixture exercises the control while real full text awaits supply.
  await page.setContent(`<figure class="customer-review-card">
    <blockquote data-review-excerpt>Short review excerpt.</blockquote>
    <blockquote id="full-review" data-review-full hidden><p>Complete synthetic review used only for this test.</p><p>A second paragraph.</p></blockquote>
    <button data-review-toggle aria-expanded="false" aria-controls="full-review" hidden>Read the full review</button>
  </figure>`);
  await page.addScriptTag({ content: fs.readFileSync(path.join(root, 'reviews.js'), 'utf8') });
  const toggle = page.getByRole('button');
  await expect(toggle).toHaveText('Read the full review');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(toggle).toHaveText('Show less');
  await expect(page.locator('[data-review-excerpt]')).toBeHidden();
  await expect(page.locator('[data-review-full]')).toBeVisible();
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Space');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('[data-review-excerpt]')).toBeVisible();
  await expect(page.locator('[data-review-full]')).toBeHidden();
});
