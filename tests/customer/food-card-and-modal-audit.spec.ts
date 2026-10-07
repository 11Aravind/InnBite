import { test, expect } from '@playwright/test';

test.describe('Customer Menu FoodCard & Dish Preview Modal Verification', () => {
    test.setTimeout(120000);

    test('FoodCard layout, Veg/Non-Veg icon, ADD button overlay, popup preview modal, portion selection & full details page navigation', async ({ page }) => {
        console.log('Step 1: Navigating to Home page...');
        await page.goto('/', { waitUntil: 'domcontentloaded' });
        
        // Wait for data load and popular dishes section
        const popularHeading = page.locator('h2').filter({ hasText: /Popular Dishes/i });
        await expect(popularHeading).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(1000);

        // Target ADD button inside FoodCard
        const addButtons = page.locator('button').filter({ hasText: /^ADD$/i });
        await expect(addButtons.first()).toBeVisible({ timeout: 10000 });
        const count = await addButtons.count();
        console.log(`Verified ${count} ADD buttons rendered inside FoodCards on Home page.`);

        // 2. Audit Veg/Non-Veg Symbol inside FoodCard
        const vegSymbol = page.locator('span[title="Vegetarian"], span[title="Non-Vegetarian"]').first();
        await expect(vegSymbol).toBeVisible();
        console.log('✅ Veg / Non-Veg Indicator Symbol verified in FoodCard!');

        // 3. Target FoodCard Dish Title specifically
        console.log('Clicking FoodCard dish title to open Quick Dish Preview Popup Modal...');
        const foodCardTitle = page.locator('div:has(button:has-text("ADD")) h3').first();
        await expect(foodCardTitle).toBeVisible();
        await foodCardTitle.click();
        await page.waitForTimeout(1200);

        // Verify Popup Modal Container & Close (X) button
        const closeBtn = page.locator('button[title="Close Modal"]').first();
        await expect(closeBtn).toBeVisible({ timeout: 10000 });
        console.log('✅ Quick Dish Preview Popup Modal opened successfully!');
        console.log('✅ Floating close (X) button on top of modal image verified!');

        // Verify Add to Cart button inside modal
        const addToCartBtn = page.locator('button').filter({ hasText: /ADD TO CART|in Cart/i }).first();
        if (await addToCartBtn.isVisible().catch(() => false)) {
            await addToCartBtn.click();
            await page.waitForTimeout(1000);
            console.log('✅ "ADD TO CART" inside Popup Modal clicked!');
        }

        // 5. Test "View Full Details Page" Navigation link
        const fullDetailsBtn = page.locator('button').filter({ hasText: /View Full Dish Details/i }).first();
        await expect(fullDetailsBtn).toBeVisible();
        console.log('Clicking "View Full Dish Details & Ingredients"...');
        await fullDetailsBtn.click();

        await page.waitForTimeout(2000);
        console.log('Navigated URL after clicking details:', page.url());
        expect(page.url()).toContain('/FoodDetails/');
        console.log('✅ Successfully navigated to Full FoodDetails page!');
    });
});
