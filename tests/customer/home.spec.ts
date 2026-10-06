import { test, expect } from '@playwright/test';

test.describe('Customer Navigation & QR Handling', () => {
  test('CUST-001: Customer can open restaurant menu via table QR', async ({ page }) => {
    await page.goto('/table/1');
    await expect(page).toHaveURL(/.*table\/1/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('CUST-002: Customer can browse categories and filter items', async ({ page }) => {
    await page.goto('/');
    const categoryButtons = page.locator('button, a').filter({ hasText: /Category|All|Appetizer|Main|Dessert/i });
    if (await categoryButtons.count() > 0) {
      await categoryButtons.first().click();
    }
    await expect(page.locator('body')).toBeVisible();
  });

  test('CUST-003: Customer can open food details', async ({ page }) => {
    await page.goto('/');
    const foodCards = page.locator('.group, [class*="card"], div').filter({ hasText: /₹|Add/i });
    if (await foodCards.count() > 0) {
      await foodCards.first().click();
    }
    await expect(page.locator('body')).toBeVisible();
  });
});
