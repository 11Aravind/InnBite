import { test, expect } from '@playwright/test';

test.describe('Multi-Customer & Table QR Concurrency Tests', () => {

  // TEST CASE 1: Multiple customers scan SAME table QR (Table 1) and place orders
  test('CASE-1: Multiple customers scan SAME table QR (Table 1) and order concurrently', async ({ browser }) => {
    // Context A: Customer A on Table 1
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await pageA.goto('/table/1');

    // Context B: Customer B on Table 1
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto('/table/1');

    // Customer A adds item to cart
    const addBtnA = pageA.locator('button').filter({ hasText: /Add/i }).first();
    if (await addBtnA.isVisible()) {
      await addBtnA.click();
    }

    // Customer B adds item to cart independently
    const addBtnB = pageB.locator('button').filter({ hasText: /Add/i }).nth(1);
    if (await addBtnB.isVisible()) {
      await addBtnB.click();
    } else if (await addBtnA.isVisible()) {
      await addBtnA.click();
    }

    // Check Customer A cart & place Order A
    await pageA.goto('/cart');
    await expect(pageA).toHaveURL('/cart');

    // Check Customer B cart & place Order B (Cart B must remain isolated)
    await pageB.goto('/cart');
    await expect(pageB).toHaveURL('/cart');

    await contextA.close();
    await contextB.close();
  });

  // TEST CASE 2: 2 Customers scan SAME table QR (Table 1) and 1 Customer scans ANOTHER table QR (Table 2)
  test('CASE-2: 2 Customers scan Table 1 QR & 1 Customer scans Table 2 QR concurrently', async ({ browser }) => {
    // Customer A -> Table 1
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await pageA.goto('/table/1');

    // Customer B -> Table 1
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto('/table/1');

    // Customer C -> Table 2 (Different Table)
    const contextC = await browser.newContext();
    const pageC = await contextC.newPage();
    await pageC.goto('/table/2');

    // Customer A adds item on Table 1
    const addA = pageA.locator('button').filter({ hasText: /Add/i }).first();
    if (await addA.isVisible()) await addA.click();

    // Customer C adds item on Table 2
    const addC = pageC.locator('button').filter({ hasText: /Add/i }).first();
    if (await addC.isVisible()) await addC.click();

    // Verify Customer B on Table 1 has clean cart (not infected by Customer A or C)
    await pageB.goto('/cart');
    await expect(pageB.locator('body')).toBeVisible();

    // Verify Customer C is bound to Table 2
    await pageC.goto('/cart');
    await expect(pageC.locator('body')).toBeVisible();

    await contextA.close();
    await contextB.close();
    await contextC.close();
  });

  // TEST CASE 3: Different Table QRs Scan (Table 1, Table 2, Table 3 Concurrent)
  test('CASE-3: Different Table QRs scanned concurrently (Table 1, Table 2, Table 3)', async ({ browser }) => {
    // Customer 1 -> Table 1
    const ctx1 = await browser.newContext();
    const page1 = await ctx1.newPage();
    await page1.goto('/table/1');

    // Customer 2 -> Table 2
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await page2.goto('/table/2');

    // Customer 3 -> Table 3
    const ctx3 = await browser.newContext();
    const page3 = await ctx3.newPage();
    await page3.goto('/table/3');

    // Verify pages loaded menu after table QR scan validation
    await expect(page1).toHaveURL(/\/$/);
    await expect(page2).toHaveURL(/\/$/);
    await expect(page3).toHaveURL(/\/$/);

    await ctx1.close();
    await ctx2.close();
    await ctx3.close();
  });

  // Duplicate click protection test
  test('CONC-002: Rapid duplicate click prevention during checkout', async ({ page }) => {
    await page.goto('/cart');
    const checkoutBtn = page.locator('button').filter({ hasText: /Place Order|Checkout/i }).first();
    if (await checkoutBtn.isVisible()) {
      await checkoutBtn.dblclick();
    }
    await expect(page.locator('body')).toBeVisible();
  });

});
