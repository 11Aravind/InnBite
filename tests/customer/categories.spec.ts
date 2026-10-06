import { test, expect } from '@playwright/test';

test.describe('Customer Categories Tests', () => {
  test('should display categories section', async ({ page }) => {
    await page.goto('/categories');
  });
});
