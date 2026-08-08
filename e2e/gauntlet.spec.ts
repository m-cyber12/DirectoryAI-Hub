import { test, expect } from '@playwright/test';

/**
 * v2.2 Infinity Gauntlet easter egg:
 *  1. The sphere is gone; the gauntlet is in the hero.
 *  2. Scrolling opens the fist and 4 random tool "stones" pop out — each a
 *     real link to its tool page.
 *  3. Visiting all four and returning triggers the snap EXPLOSION
 *     (flash + rings + particle burst + radial blast) and `html.theme-red`
 *     (site-wide palette flip).
 *  4. Clicking the gauntlet again restores the amber theme.
 */
test.describe('infinity gauntlet', () => {
  test('stones pop out, visiting all of them snaps the site red', async ({ page }) => {
    await page.goto('/');

    // The gauntlet stage exists and the sphere canvas is gone.
    const section = page.getByRole('region', { name: /Infinity Gauntlet/i });
    await expect(section).toBeVisible();
    expect(await page.locator('canvas').count()).toBe(0);

    // Scroll the gauntlet into view → the fist opens and stones pop out.
    await section.scrollIntoViewIfNeeded();
    const stones = page.locator('.g-stone');
    await expect(stones).toHaveCount(4, { timeout: 10_000 });

    // Every stone is a link to a real tool page, opening in a NEW tab.
    const hrefs = await stones.evaluateAll((els) =>
      els.map((el) => (el as HTMLAnchorElement).getAttribute('href') || '')
    );
    for (const href of hrefs) expect(href).toMatch(/^\/tool\//);
    const targets = await stones.evaluateAll((els) =>
      els.map((el) => (el as HTMLAnchorElement).getAttribute('target'))
    );
    for (const t of targets) expect(t).toBe('_blank');
    // ...and the target page actually exists.
    await page.goto(hrefs[0]);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');

    // "Click" each stone (dispatchEvent = wiring only, no popup in the test).
    // Stones open in new tabs for real users, so the round now completes
    // in-page: after the 4th tap the snap explosion runs automatically.
    for (let i = 0; i < hrefs.length; i++) {
      await section.scrollIntoViewIfNeeded();
      // Nudge up so the stones clear the sticky header.
      await page.evaluate(() => window.scrollBy(0, -140));
      await page.waitForTimeout(300);
      const stone = page.locator('.g-stone').nth(i);
      await expect(stone).toBeAttached();
      await expect(stone).toHaveCSS('opacity', '1', { timeout: 8000 });
      await stone.dispatchEvent('click');
      await page.waitForTimeout(350);
    }

    // The explosion covers the screen, then the theme flips site-wide.
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.classList.contains('theme-red')), {
        timeout: 10_000,
      })
      .toBe(true);

    // Iron Man is revealed (not a second before the boom anymore).
    await expect(page.getByText(/SNAPPED/)).toBeVisible();
    await expect(page.getByText(/which Tony Stark is better/i)).toBeVisible();

    // Accent utilities actually turned red (variable flip works).
    const accent = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent-400').trim()
    );
    expect(accent).toBe('#F87171');

    // Clicking the gauntlet restores the amber theme.
    await section.scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: /gauntlet/i }).first().dispatchEvent('click');
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.classList.contains('theme-red')), {
        timeout: 10_000,
      })
      .toBe(false);
  });
});
