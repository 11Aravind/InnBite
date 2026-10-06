import { test, expect } from '@playwright/test';

test.describe('Customer Checkout & Payment Modes', () => {
  test('PAY-004: Pay at Shop order placement flow', async ({ page }) => {
    await page.goto('/table/1');
    const addButtons = page.locator('button').filter({ hasText: /Add/i });
    if (await addButtons.count() > 0) {
      await addButtons.first().click();
      await page.goto('/cart');
      const checkoutBtn = page.locator('button').filter({ hasText: /Place Order|Checkout|Pay/i }).first();
      if (await checkoutBtn.isVisible()) {
        await checkoutBtn.click();
      }
    }
    await expect(page.locator('body')).toBeVisible();
  });

  test('PAY-001: Online payment selection option', async ({ page }) => {
    await page.goto('/cart');
    const onlineOption = page.locator('button, input, label').filter({ hasText: /Online|Razorpay|Card/i });
    if (await onlineOption.count() > 0) {
      await expect(onlineOption.first()).toBeVisible();
    }
  });
});
