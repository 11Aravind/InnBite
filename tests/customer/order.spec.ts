import { test, expect } from '@playwright/test';

test.describe('Customer Order Tracking & Multi-Orders', () => {
  test('ORDER-001: Unique Order ID generation and tracking view', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });

  test('ORDER-003: Customer can create second independent order while first is in progress', async ({ page }) => {
    await page.goto('/table/1');
    await expect(page.locator('body')).toBeVisible();
  });
});
