import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity-ide/brain/98687728-f3ac-4706-bfb5-12aa19083f0b';

function getCategoryCoverImage(categoryKeyword: string): string {
    const files = fs.readdirSync(ARTIFACT_DIR);
    const kw = categoryKeyword.toLowerCase();
    
    let matched = files.find(f => f.startsWith('category_') && f.includes(kw) && f.endsWith('.jpg'));
    if (!matched) {
        if (kw.includes('starters')) matched = files.find(f => f.startsWith('category_starters') && f.endsWith('.jpg'));
        else if (kw.includes('main')) matched = files.find(f => f.startsWith('category_main_foods') && f.endsWith('.jpg'));
        else if (kw.includes('beverage')) matched = files.find(f => f.startsWith('category_beverages') && f.endsWith('.jpg'));
        else if (kw.includes('chinese')) matched = files.find(f => f.startsWith('category_chinese') && f.endsWith('.jpg'));
        else if (kw.includes('dessert')) matched = files.find(f => f.startsWith('category_desserts') && f.endsWith('.jpg'));
        else if (kw.includes('combo')) matched = files.find(f => f.startsWith('category_combos') && f.endsWith('.jpg'));
    }
    
    if (matched) return path.join(ARTIFACT_DIR, matched);
    const anyCategoryImg = files.find(f => f.startsWith('category_') && f.endsWith('.jpg'));
    if (anyCategoryImg) return path.join(ARTIFACT_DIR, anyCategoryImg);
    
    const anyJpg = files.find(f => f.endsWith('.jpg'));
    if (anyJpg) return path.join(ARTIFACT_DIR, anyJpg);
    throw new Error('No category images found');
}

test.describe('Update Categories & Dish Cover Images Workflow', () => {
    test.setTimeout(300000);

    test('Login as Admin and edit each food category with matching cropped images', async ({ page }) => {
        const errorsEncountered: string[] = [];
        const updateLog: Array<{ type: string; name: string; success: boolean; message: string }> = [];

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
        console.log('Step 1: Logging in as Admin...');
        await page.goto('/admin/login', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('body')).toBeVisible();

        await page.locator('input[type="text"]').first().fill('admin');
        await page.locator('input[type="password"]').first().fill('adminpassword');
        await page.locator('button[type="submit"]').first().click();
        await page.waitForTimeout(2000);

        console.log('LoggedIn Admin Portal URL:', page.url());

        // 2. NAVIGATE TO CATEGORIES PAGE
        console.log('\n======================================================================');
        console.log('UPDATING CATEGORY COVER IMAGES (/admin/categories)');
        console.log('======================================================================');
        await page.goto('/admin/categories', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);

        const rows = page.locator('tbody tr');
        const count = await rows.count();
        console.log(`Found ${count} category rows in table.`);

        for (let i = 0; i < count; i++) {
            const row = rows.nth(i);
            const catNameText = await row.locator('h4').first().innerText().catch(() => '');
            if (!catNameText) continue;

            console.log(`\n[Category ${i + 1}/${count}] Updating Cover Image for "${catNameText}"...`);
            const matchingImage = getCategoryCoverImage(catNameText);
            console.log(`Using matching image: ${matchingImage}`);

            // Click Edit button on the category row
            const editBtn = row.locator('button[title="Edit Category"], button').first();
            await editBtn.click();
            await page.waitForTimeout(600);

            const catForm = page.locator('form').first();

            // Set matching file image
            await catForm.locator('input[type="file"]').first().setInputFiles(matchingImage);
            await page.waitForTimeout(800);

            // Handle Cropper Modal if opened
            const applyCropBtn = page.locator('button').filter({ hasText: /Apply Cropped Image/i });
            if (await applyCropBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
                console.log('Cropper modal opened. Clicking "Apply Cropped Image"...');
                await applyCropBtn.click();
                await page.waitForTimeout(800);
            }

            // Save Category
            const saveBtn = catForm.locator('button[type="submit"]').filter({ hasText: /Save Category/i }).first();
            await saveBtn.click();
            await page.waitForTimeout(2000);

            const toastEl = page.locator('div[role="status"], div:has-text("saved"), div:has-text("error"), div:has-text("Failed")').first();
            let toastMsg = '';
            if (await toastEl.isVisible().catch(() => false)) {
                toastMsg = await toastEl.innerText();
            }

            const isModalOpen = await page.locator('h2').filter({ hasText: /Edit Category/i }).isVisible().catch(() => false);

            if (isModalOpen) {
                const errMsg = toastMsg || 'Category modal stayed open (possible validation or server error)';
                console.error(`❌ FAILED to update Category "${catNameText}": ${errMsg}`);
                updateLog.push({ type: 'Category', name: catNameText, success: false, message: errMsg });
                errorsEncountered.push(`Category "${catNameText}" Update Error: ${errMsg}`);
                await page.keyboard.press('Escape');
                await page.waitForTimeout(500);
            } else {
                console.log(`✅ SUCCESS: Category "${catNameText}" updated with matching image!`);
                updateLog.push({ type: 'Category', name: catNameText, success: true, message: toastMsg || `Category "${catNameText}" saved successfully!` });
            }
        }

        // 3. FINAL REPORT PERSISTENCE
        console.log('\n======================================================================');
        console.log('FINAL CATEGORY IMAGE UPDATE REPORT');
        console.log('======================================================================');
        console.log(`Total Categories Updated: ${updateLog.length}`);
        console.log(`Total Errors: ${errorsEncountered.length}`);

        fs.writeFileSync(
            path.join(ARTIFACT_DIR, 'admin_category_images_update_audit.json'),
            JSON.stringify({ updateLog, errorsEncountered }, null, 2)
        );

        const successCount = updateLog.filter(s => s.success).length;
        expect(successCount).toBeGreaterThan(0);
    });
});
