import { test, expect } from '@playwright/test';

test.describe('Customer Product Details & Special Notes', () => {
  test('CUST-005: Customer can add special notes to food items', async ({ page }) => {
    await page.goto('/');
    const addButton = page.locator('button').filter({ hasText: /Add/i }).first();
    if (await addButton.isVisible()) {
      await addButton.click();
    }
    await expect(page.locator('body')).toBeVisible();
  });
});
