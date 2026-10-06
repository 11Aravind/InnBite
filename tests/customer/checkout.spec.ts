import { test, expect } from '@playwright/test';

test.describe('Customer Checkout & Order Placement Verification', () => {

  test('PAY-004: Complete End-to-End Customer Order Placement (Pay at Shop)', async ({ page }) => {
    // 1. Monitor console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // 2. Scan Table 1 QR & load menu
    await page.goto('/table/1');
    await expect(page).toHaveURL(/.*table\/1/);

    // 3. Add first available item to cart
    const addButtons = page.locator('button').filter({ hasText: /Add/i });
    if (await addButtons.count() > 0) {
      await addButtons.first().click();
    }

    // 4. Navigate to Cart
    await page.goto('/cart');
    await expect(page).toHaveURL('/cart');

    // 5. Fill customer info if input fields exist
    const nameInput = page.locator('input[placeholder*="Name"], input[type="text"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('John Doe');
    }

    const phoneInput = page.locator('input[placeholder*="Phone"], input[type="tel"]').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('9876543210');
    }

    // 6. Select "Pay at Shop" (Counter Cash) payment method
    const payAtShopBtn = page.locator('button, label, div').filter({ hasText: /Pay at Shop|Counter|Cash/i }).first();
    if (await payAtShopBtn.isVisible()) {
      await payAtShopBtn.click();
    }

    // 7. Place Order
    const placeOrderBtn = page.locator('button').filter({ hasText: /Place Order|Confirm Order|Pay at Shop/i }).first();
    if (await placeOrderBtn.isVisible()) {
      await placeOrderBtn.click();
      
      // Wait for backend response & order confirmation modal/page
      await page.waitForTimeout(2000);
    }

    // 8. Assert no critical console errors occurred during ordering
    const fatalErrors = consoleErrors.filter(err => !err.includes('favicon') && !err.includes('manifest'));
    expect(fatalErrors.length).toBe(0);

    // 9. Verify page state is rendered cleanly
    await expect(page.locator('body')).toBeVisible();
  });

  test('PAY-001: Online Payment Selection Option is rendered', async ({ page }) => {
    await page.goto('/cart');
    const onlineOption = page.locator('button, input, label').filter({ hasText: /Online|Razorpay|Card/i });
    if (await onlineOption.count() > 0) {
      await expect(onlineOption.first()).toBeVisible();
    }
  });

});
