import { test, expect } from '@playwright/test';

test.describe('Customer Product Tests', () => {
  test('should display product details', async ({ page }) => {
    await page.goto('/product/1');
  });
});
