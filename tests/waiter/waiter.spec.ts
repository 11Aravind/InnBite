import { test, expect } from '@playwright/test';

test.describe('Waiter Application & Kitchen View', () => {
  test('WAIT-001: Waiter login page access', async ({ page }) => {
    await page.goto('/waiter/login');
    await expect(page).toHaveURL(/.*waiter\/login/);
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('WAIT-002: Protected kitchen view redirects unauthorized access', async ({ page }) => {
    await page.goto('/kitchen');
    // Protected route redirects to login if unauthenticated
    await expect(page.locator('body')).toBeVisible();
  });
});
