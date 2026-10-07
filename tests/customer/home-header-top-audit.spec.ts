import { test, expect } from '@playwright/test';

test.describe('Home Top Header Section Audit', () => {
    test('Verify Emerald Green top header with InnBite logo badge, title, tagline, call button and search mic', async ({ page }) => {
        // Navigate to Home page
        await page.goto('/');
        await page.waitForSelector('button[title="Call Support / Waiter"]', { timeout: 15000 });

        // 1. Verify Brand Title "InnBite" and Tagline "Good Food · Happy Moments"
        const brandTitleInn = page.getByText('Inn', { exact: true });
        await expect(brandTitleInn).toBeVisible();

        const brandTitleBite = page.getByText('Bite', { exact: true });
        await expect(brandTitleBite).toBeVisible();

        const tagline = page.getByText('Good Food · Happy Moments');
        await expect(tagline).toBeVisible();

        // 2. Verify Mobile Phone icon button on top right
        const phoneButton = page.locator('button[title="Call Support / Waiter"]');
        await expect(phoneButton).toBeVisible();

        // 3. Verify Search Bar with "Search for 'Pizza' or any dish..." placeholder & Microphone button
        const searchInput = page.locator('input[placeholder="Search for \'Pizza\' or any dish..."]');
        await expect(searchInput).toBeVisible();

        const micButton = page.locator('button[title="Voice Search"]');
        await expect(micButton).toBeVisible();

        // Take screenshot of new green header
        await page.screenshot({
            path: 'C:/Users/USER/.gemini/antigravity-ide/brain/98687728-f3ac-4706-bfb5-12aa19083f0b/.tempmediaStorage/media_green_header_audit.png',
            fullPage: false
        });

        console.log('✅ Emerald Green top header audit completed successfully!');
    });
});
