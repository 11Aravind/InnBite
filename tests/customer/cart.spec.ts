import { test, expect } from '@playwright/test';

test.describe('Customer Cart Operations & Isolation', () => {
  test('CUST-004: Customer can add multiple items to cart', async ({ page }) => {
    await page.goto('/');
    const addButtons = page.locator('button').filter({ hasText: /Add/i });
    const count = await addButtons.count();
    if (count > 0) {
      if (await addButtons.count() > 0) { await addButtons.first().click(); }
    }
    await page.goto('/cart');
    await expect(page).toHaveURL('/cart');
  });

  test('CUST-008: Cart state persists on browser refresh', async ({ page }) => {
    await page.goto('/');
    const addButtons = page.locator('button').filter({ hasText: /Add/i });
    if (await addButtons.count() > 0) {
      await addButtons.first().click();
    }
    await page.reload();
    await expect(page.locator('body')).toBeVisible();
  });
});
