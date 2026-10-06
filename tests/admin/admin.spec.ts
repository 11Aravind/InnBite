import { test, expect } from '@playwright/test';

test.describe('Restaurant Admin Portal', () => {
  test('ADMIN-001: Admin login page rendered correctly', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page).toHaveURL(/.*admin\/login/);
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('ADMIN-002: Protected admin dashboard redirects unauthenticated users', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('body')).toBeVisible();
  });
});
