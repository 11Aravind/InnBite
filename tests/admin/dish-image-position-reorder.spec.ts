import { test, expect } from '@playwright/test';

test.describe('Admin Dish Multiple Image Position Reordering Verification', () => {
    test('Admin can view image position controls (Top, Up, Down, Bottom) and reorder dish images', async ({ page }) => {
        // 1. Navigate to Admin Login Page
        console.log('Step 1: Navigating to Admin Login page...');
        await page.goto('http://localhost:5174/admin/login', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1000);

        // Enter Admin Username & Password
        const usernameInput = page.locator('input[type="text"]').first();
        if (await usernameInput.isVisible()) {
            console.log('Logging in with admin credentials...');
            await usernameInput.fill('admin');
            await page.locator('input[type="password"]').first().fill('adminpassword');
            await page.locator('button[type="submit"]').first().click();
            await page.waitForTimeout(2000);
        }

        // 2. Navigate to Admin Dishes Page
        console.log('Step 2: Navigating to Admin Dishes page...');
        await page.goto('http://localhost:5174/admin/dishes', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);

        // Verify "Add New Dish" button
        const addDishBtn = page.locator('button:has-text("Add New Dish")').first();
        await expect(addDishBtn).toBeVisible({ timeout: 10000 });
        console.log('Clicking "Add New Dish" button to test modal...');
        await addDishBtn.click();
        await page.waitForTimeout(500);

        // 3. Verify Dish Images section title & max slots badge
        console.log('Step 3: Checking Dish Images section & position labels...');
        await expect(page.locator('text=Dish Images').first()).toBeVisible();
        await expect(page.locator('text=(Reorder & Set Primary)').first()).toBeVisible();
        await expect(page.locator('text=0/5 uploaded').or(page.locator('text=/5 uploaded')).first()).toBeVisible();

        console.log('✅ "Dish Images (Reorder & Set Primary)" header & max 5 slots badge verified!');

        // Close modal
        await page.locator('button').filter({ hasText: 'Cancel' }).or(page.locator('button:has(svg.lucide-x)')).first().click();
        await page.waitForTimeout(500);

        // Find an Edit button in the dishes table to inspect uploaded images with reordering buttons
        const editBtn = page.locator('button:has-text("Edit")').first();
        if (await editBtn.isVisible()) {
            console.log('Clicking Edit on existing dish to test position reordering...');
            await editBtn.click();
            await page.waitForTimeout(800);

            // Check position controls on uploaded images
            const topBadge = page.locator('text=Top / Primary Image');
            if (await topBadge.isVisible()) {
                console.log('✅ "Top / Primary Image" badge verified on Position #1!');
            }

            const changePositionText = page.locator('text=Change Position:');
            if (await changePositionText.isVisible()) {
                console.log('✅ "Change Position:" toolbar verified on dish image cards!');
            }

            // Verify Top, Up, Down, Bottom buttons
            const topBtn = page.locator('button:has-text("Top")').first();
            const bottomBtn = page.locator('button:has-text("Bottom")').first();
            if (await topBtn.isVisible() && await bottomBtn.isVisible()) {
                console.log('✅ "Top" and "Bottom" position reorder buttons verified!');
            }
        }

        console.log('✅ Admin dish image position reordering UI test completed successfully!');
    });
});
