import { test, expect } from '@playwright/test';

test.describe('Customer Home Page Tests', () => {
  test('should load the home page successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Orderly/i);
  });
});
