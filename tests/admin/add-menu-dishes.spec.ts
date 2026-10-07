import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity-ide/brain/98687728-f3ac-4706-bfb5-12aa19083f0b';

function getGeneratedImage(prefix: string): string {
    const files = fs.readdirSync(ARTIFACT_DIR);
    const matched = files.find(f => f.startsWith(prefix) && f.endsWith('.jpg'));
    if (matched) {
        return path.join(ARTIFACT_DIR, matched);
    }
    const anyJpg = files.find(f => f.endsWith('.jpg'));
    if (anyJpg) return path.join(ARTIFACT_DIR, anyJpg);
    throw new Error(`No generated images found in ${ARTIFACT_DIR}`);
}

test.describe('Admin Menu & Product Insertion Workflow', () => {
    test.setTimeout(180000);

    test('Login as Admin and Add New Dish for Each Category with Generated Images', async ({ page }) => {
        const errorsEncountered: string[] = [];
        const submissionLog: { categoryId: string; categoryName: string; dishName: string; price: number; success: boolean; message: string }[] = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log(`[Browser Console Error] ${msg.text()}`);
                errorsEncountered.push(`Console Error: ${msg.text()}`);
            }
        });

        page.on('pageerror', err => {
            console.log(`[Browser Uncaught Exception] ${err.message}`);
            errorsEncountered.push(`Uncaught Page Exception: ${err.message}`);
        });

        // 1. LOGIN AS ADMIN
        console.log('Step 1: Navigating to Admin Login...');
        await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('body')).toBeVisible();

        const userInput = page.locator('input[type="text"]').first();
        const passInput = page.locator('input[type="password"]').first();
        const loginBtn = page.locator('button[type="submit"]').first();

        await userInput.fill('admin');
        await passInput.fill('adminpassword');
        await loginBtn.click();

        await page.waitForTimeout(2000);

        if (page.url().includes('/admin/login')) {
            const errorBanner = page.locator('div').filter({ hasText: /Invalid|error|failed/i });
            if (await errorBanner.count() > 0) {
                const errText = await errorBanner.first().innerText();
                console.log('Login Error Message:', errText);
                errorsEncountered.push(`Login Failed: ${errText}`);
            }
        } else {
            console.log('Successfully logged into Admin Portal! URL:', page.url());
        }

        // 2. NAVIGATE TO ADMIN DISHES PAGE
        console.log('Step 2: Navigating to Admin Dishes page...');
        await page.goto('/admin/dishes', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);

        // Open Add Dish Modal to read categories from modal select
        const openAddDishBtn = page.locator('button').filter({ hasText: /Add New Dish|Add Dish/i }).first();
        await expect(openAddDishBtn).toBeVisible();
        await openAddDishBtn.click();
        await page.waitForTimeout(800);

        const modalForm = page.locator('form').first();
        const modalCategorySelect = modalForm.locator('select').first();
        await expect(modalCategorySelect).toBeVisible();

        const options = await modalCategorySelect.locator('option').all();
        const categoriesList: { id: string; name: string }[] = [];

        for (const opt of options) {
            const val = await opt.getAttribute('value');
            const txt = await opt.innerText();
            if (val && val !== '' && val !== 'all' && !txt.includes('Select Category')) {
                categoriesList.push({ id: val, name: txt.trim() });
            }
        }

        console.log('Detected Valid Categories for Products:', categoriesList);

        // Close modal via Escape key or cancel button
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        // Product templates mapped by category keywords
        const productTemplates: Record<string, { name: string; price: string; description: string; prep: string; imgPrefix: string }> = {
            'starters': {
                name: 'Crispy Veg Spring Rolls',
                price: '199.00',
                description: 'Golden fried vegetable spring rolls served with sweet chili dipping sauce.',
                prep: 'Rolled fresh daily, deep fried to crisp golden perfection.',
                imgPrefix: 'starter_dish'
            },
            'main': {
                name: 'Paneer Butter Masala Special',
                price: '349.00',
                description: 'Rich creamy tomato cashewnut gravy with fresh cottage cheese cubes and butter naan.',
                prep: 'Simmered in authentic tandoori gravy and spices.',
                imgPrefix: 'main_dish'
            },
            'desserts': {
                name: 'Molten Chocolate Lava Cake',
                price: '249.00',
                description: 'Warm chocolate cake with oozing chocolate sauce center & vanilla bean ice cream.',
                prep: 'Freshly baked upon order.',
                imgPrefix: 'dessert_dish'
            },
            'beverages': {
                name: 'Virgin Mint Lime Mojito',
                price: '149.00',
                description: 'Refreshing cold beverage made with fresh mint leaves, lime juice, and sparkling soda.',
                prep: 'Muddled fresh mint and crushed ice.',
                imgPrefix: 'beverage_dish'
            },
            'chinese': {
                name: 'Hakka Chili Garlic Noodles',
                price: '229.00',
                description: 'Wok-tossed noodles with colorful bell peppers, garlic, and hot chili sauce.',
                prep: 'Tossed in high flame Asian wok.',
                imgPrefix: 'starter_dish'
            },
            'combos': {
                name: 'Royal Feast Thali Combo',
                price: '499.00',
                description: 'Complete meal combo with Paneer dish, Dal Makhani, Rice, Naan, Gulab Jamun & Beverage.',
                prep: 'Assorted chef specilties served together.',
                imgPrefix: 'main_dish'
            }
        };

        // 3. ADD ONE PRODUCT FOR EACH CATEGORY
        for (const cat of categoriesList) {
            console.log(`--------------------------------------------------`);
            console.log(`Adding Dish for Category: "${cat.name}" (ID: ${cat.id})`);

            const lowerCatName = cat.name.toLowerCase();
            const matchingKey = Object.keys(productTemplates).find(k => lowerCatName.includes(k)) || '';
            const tpl = productTemplates[matchingKey] || {
                name: `${cat.name} Special Dish`,
                price: '299.00',
                description: `Signature chef special product for ${cat.name}.`,
                prep: 'Freshly prepared with authentic ingredients.',
                imgPrefix: 'main_dish'
            };

            const imagePath = getGeneratedImage(tpl.imgPrefix);
            console.log(`Product Name: "${tpl.name}" | Price: ₹${tpl.price}`);

            // Open Add Dish Modal
            await page.locator('button').filter({ hasText: /Add New Dish|Add Dish/i }).first().click();
            await page.waitForTimeout(600);

            const activeForm = page.locator('form').first();

            // Fill Dish Name
            const nameInput = activeForm.locator('input[placeholder*="Margherita Pizza"], input[placeholder*="Name"], input[type="text"]').first();
            await nameInput.fill(tpl.name);

            // Fill Price
            const priceInput = activeForm.locator('input[type="number"]').first();
            await priceInput.fill(tpl.price);

            // Select Category
            const catSelect = activeForm.locator('select').first();
            await catSelect.selectOption(cat.id);

            // Fill Description & Preparation
            const textareas = activeForm.locator('textarea');
            if (await textareas.count() > 0) {
                await textareas.nth(0).fill(tpl.description);
            }
            if (await textareas.count() > 1) {
                await textareas.nth(1).fill(tpl.prep);
            }

            // Upload Generated Image
            const fileInput = activeForm.locator('input[type="file"]').first();
            await fileInput.setInputFiles(imagePath);
            await page.waitForTimeout(800);

            // Handle Crop Modal if visible
            const applyCropBtn = page.locator('button').filter({ hasText: /Apply Cropped Image/i });
            if (await applyCropBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
                console.log('Crop modal opened. Clicking "Apply Cropped Image"...');
                await applyCropBtn.click();
                await page.waitForTimeout(800);
            }

            // Submit Dish Form
            console.log(`Clicking "Save Dish" for "${tpl.name}"...`);
            const saveBtn = activeForm.locator('button[type="submit"]').filter({ hasText: /Save Dish/i }).first();
            await saveBtn.click();

            await page.waitForTimeout(2000);

            // Toast notification capture
            const toastEl = page.locator('div[role="status"], div:has-text("saved"), div:has-text("error"), div:has-text("Failed")').first();
            let toastMessage = '';
            if (await toastEl.isVisible().catch(() => false)) {
                toastMessage = await toastEl.innerText();
                console.log(`Submit Toast Message: "${toastMessage}"`);
            }

            // Check if modal closed (success condition)
            const modalStillOpen = await page.locator('h2').filter({ hasText: /Add New Dish|Edit Dish/i }).isVisible().catch(() => false);

            if (modalStillOpen) {
                const errDetail = toastMessage || 'Modal stayed open on submit';
                console.error(`FAILED to submit dish for category "${cat.name}": ${errDetail}`);
                submissionLog.push({
                    categoryId: cat.id,
                    categoryName: cat.name,
                    dishName: tpl.name,
                    price: parseFloat(tpl.price),
                    success: false,
                    message: errDetail
                });
                errorsEncountered.push(`Category "${cat.name}" (${cat.id}) Submit Error: ${errDetail}`);

                // Close modal via Escape
                await page.keyboard.press('Escape');
                await page.waitForTimeout(500);
            } else {
                console.log(`SUCCESSFULLY created dish "${tpl.name}" for category "${cat.name}"!`);
                submissionLog.push({
                    categoryId: cat.id,
                    categoryName: cat.name,
                    dishName: tpl.name,
                    price: parseFloat(tpl.price),
                    success: true,
                    message: toastMessage || `Dish "${tpl.name}" saved successfully!`
                });
            }
        }

        // Summary Audit Output
        console.log('\n==================================================');
        console.log('SUMMARY AUDIT REPORT FOR PRODUCT INSERTION');
        console.log('==================================================');
        console.log('Submissions:', JSON.stringify(submissionLog, null, 2));
        console.log('Errors:', JSON.stringify(errorsEncountered, null, 2));

        fs.writeFileSync(
            path.join(ARTIFACT_DIR, 'admin_menu_audit_report.json'),
            JSON.stringify({ submissionLog, errorsEncountered }, null, 2)
        );

        const successCount = submissionLog.filter(s => s.success).length;
        expect(successCount).toBeGreaterThan(0);
    });
});
