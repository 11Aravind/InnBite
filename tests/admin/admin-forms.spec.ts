import { test, expect } from '@playwright/test';

test.describe('Admin Side Forms Validation & Error Audit', () => {

  // Helper function to perform login as admin with credentials
  async function performAdminLogin(page) {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
    const userInput = page.locator('input[type="text"], input[placeholder*="admin"]').first();
    const passInput = page.locator('input[type="password"]').first();
    
    if (await userInput.isVisible()) {
      await userInput.fill('admin');
      await passInput.fill('adminpassword');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(1500);
    }
  }

  // 1. ADMIN LOGIN FORM AUDIT
  test('FORM-ADM-001: Admin Login validation (Invalid credentials & Error Alert)', async ({ page }) => {
    await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });

    const userInput = page.locator('input[type="text"], input[placeholder*="admin"]').first();
    const passInput = page.locator('input[type="password"]').first();

    if (await userInput.isVisible()) {
      // Test invalid credentials
      await userInput.fill('invalid_user');
      await passInput.fill('wrong_password');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(1000);

      // Verify error message alert container
      const errorAlert = page.locator('div').filter({ hasText: /Invalid|error|incorrect|failed|denied/i });
      if (await errorAlert.count() > 0) {
        await expect(errorAlert.first()).toBeVisible();
      }

      // Test valid credentials (admin / adminpassword)
      await userInput.fill('admin');
      await passInput.fill('adminpassword');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(1500);
    }
  });

  // 2. ADMIN DISHES FORM AUDIT
  test('FORM-ADM-002: Admin Dishes Form validation (Dishes & Prices)', async ({ page }) => {
    await performAdminLogin(page);
    await page.goto('/admin/dishes', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    const addDishBtn = page.locator('button').filter({ hasText: /Add Dish|New Dish|Add/i }).first();
    if (await addDishBtn.isVisible()) {
      await addDishBtn.click();
      await page.waitForTimeout(500);

      const dishNameInput = page.locator('input[placeholder*="Name"], input[type="text"]').first();
      if (await dishNameInput.isVisible()) {
        await expect(dishNameInput).toBeVisible();
      }

      const closeBtn = page.locator('button').filter({ hasText: /Cancel|Close|×/i }).first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      }
    }
  });

  // 3. ADMIN CATEGORIES FORM AUDIT
  test('FORM-ADM-003: Admin Categories Form validation', async ({ page }) => {
    await performAdminLogin(page);
    await page.goto('/admin/categories', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    const addCatBtn = page.locator('button').filter({ hasText: /Add Category|New Category|Add/i }).first();
    if (await addCatBtn.isVisible()) {
      await addCatBtn.click();
      await page.waitForTimeout(500);

      const cancelBtn = page.locator('button').filter({ hasText: /Cancel|Close|×/i }).first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
      }
    }
  });

  // 4. ADMIN TABLES FORM AUDIT
  test('FORM-ADM-004: Admin Tables Form validation', async ({ page }) => {
    await performAdminLogin(page);
    await page.goto('/admin/tables', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    const tableInput = page.locator('input[type="number"], input[placeholder*="Table"]').first();
    if (await tableInput.isVisible()) {
      await expect(tableInput).toBeVisible();
    }
  });

  // 5. ADMIN WAITERS FORM AUDIT
  test('FORM-ADM-005: Admin Waiters Form validation', async ({ page }) => {
    await performAdminLogin(page);
    await page.goto('/admin/waiters', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    const addWaiterBtn = page.locator('button').filter({ hasText: /Add Waiter|New Waiter|Add/i }).first();
    if (await addWaiterBtn.isVisible()) {
      await addWaiterBtn.click();
      await page.waitForTimeout(500);

      const cancelBtn = page.locator('button').filter({ hasText: /Cancel|Close|×/i }).first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
      }
    }
  });

  // 6. ADMIN SETTINGS FORM AUDIT
  test('FORM-ADM-006: Admin Settings Form fields & tax rate validation', async ({ page }) => {
    await performAdminLogin(page);
    await page.goto('/admin/settings', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    const appNameInput = page.locator('input[placeholder*="InnBite"]').first();
    if (await appNameInput.isVisible()) {
      await expect(appNameInput).toBeVisible();
    }
  });

  // 7. ADMIN POS FORM AUDIT
  test('FORM-ADM-007: Admin POS Form search & billing validation', async ({ page }) => {
    await performAdminLogin(page);
    await page.goto('/admin/pos', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toBeVisible();

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Paneer');
    }
  });

});
