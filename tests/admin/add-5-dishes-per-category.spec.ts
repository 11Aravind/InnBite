import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const ARTIFACT_DIR = 'C:/Users/USER/.gemini/antigravity-ide/brain/98687728-f3ac-4706-bfb5-12aa19083f0b';

function getGeneratedImage(preferredPrefix: string): string {
    const files = fs.readdirSync(ARTIFACT_DIR);
    const matched = files.find(f => f.startsWith(preferredPrefix) && f.endsWith('.jpg'));
    if (matched) {
        return path.join(ARTIFACT_DIR, matched);
    }
    // Fallbacks
    const anyStarter = files.find(f => f.includes('starter') && f.endsWith('.jpg'));
    if (anyStarter) return path.join(ARTIFACT_DIR, anyStarter);
    const anyMain = files.find(f => f.includes('main') && f.endsWith('.jpg'));
    if (anyMain) return path.join(ARTIFACT_DIR, anyMain);
    const anyJpg = files.find(f => f.endsWith('.jpg'));
    if (anyJpg) return path.join(ARTIFACT_DIR, anyJpg);
    throw new Error(`No generated images found in ${ARTIFACT_DIR}`);
}

// Map of 5 unique dishes per category keyword
const fiveDishesPerCategoryMap: Record<string, Array<{ name: string; price: string; description: string; prep: string; imgPrefix: string }>> = {
    'main': [
        { name: 'Paneer Butter Masala Royal', price: '349.00', description: 'Rich creamy tomato gravy with fresh paneer cubes and butter naan.', prep: 'Simmered in clay oven spices.', imgPrefix: 'main_dal_makhani' },
        { name: 'Dal Makhani Double Cream', price: '299.00', description: 'Slow cooked black lentils with white butter and fresh cream.', prep: 'Overnight simmered on charcoal embers.', imgPrefix: 'main_dal_makhani' },
        { name: 'Kadai Paneer Special', price: '329.00', description: 'Cottage cheese tossed with bell peppers and freshly ground coriander spices.', prep: 'Wok tossed on high heat.', imgPrefix: 'main_dish' },
        { name: 'Dum Handi Veg Biryani', price: '279.00', description: 'Fragrant basmati rice layered with garden fresh vegetables and aromatic saffron.', prep: 'Cooked under seal in traditional handi.', imgPrefix: 'main_dish' },
        { name: 'Malai Kofta Creamy Gravy', price: '339.00', description: 'Soft melted paneer and potato dumplings in cashew nuts gravy.', prep: 'Fried dumplings topped with cream gravy.', imgPrefix: 'main_dish' }
    ],
    'beverages': [
        { name: 'Fresh Mango Lassi', price: '129.00', description: 'Thick yogurt blend with Alphonso mango pulp and cardamom.', prep: 'Blended chilled upon order.', imgPrefix: 'beverage_dish' },
        { name: 'Cold Coffee with Ice Cream', price: '159.00', description: 'Creamy espresso shake topped with a scoop of vanilla ice cream.', prep: 'Hand whipped with roasted coffee beans.', imgPrefix: 'beverage_dish' },
        { name: 'Blue Lagoon Sparkling Mocktail', price: '169.00', description: 'Refreshing blue curaçao mocktail with crushed ice and sprite fizz.', prep: 'Shaken with ice and fresh lemon.', imgPrefix: 'beverage_dish' },
        { name: 'Fresh Watermelon Mint Juice', price: '119.00', description: '100% natural cold pressed fresh watermelon juice with mint.', prep: 'Cold pressed without added sugar.', imgPrefix: 'beverage_dish' },
        { name: 'Masala Spiced Chai Kettle', price: '89.00', description: 'Authentic Indian spiced tea infused with ginger, cardamom, and cloves.', prep: 'Brewed fresh with whole milk.', imgPrefix: 'beverage_dish' }
    ],
    'starters': [
        { name: 'Tandoori Paneer Tikka Skewers', price: '289.00', description: 'Marinated cottage cheese skewers grilled in clay oven with mint chutney.', prep: 'Charcoal grilled for smoky taste.', imgPrefix: 'starter_paneer_tikka' },
        { name: 'Crispy Butter Garlic Bread', price: '169.00', description: 'Toasted baguette slices with garlic herb butter and melted mozzarella.', prep: 'Oven baked to golden perfection.', imgPrefix: 'starter_dish' },
        { name: 'Golden Crispy Corn Salt & Pepper', price: '219.00', description: 'Crunchy sweet corn kernels tossed with chili, garlic, and scallions.', prep: 'Deep fried and seasoned.', imgPrefix: 'starter_dish' },
        { name: 'Stuffed Cheese Mushroom Bites', price: '249.00', description: 'Button mushrooms stuffed with herbs and processed cheese, crumb fried.', prep: 'Crispy panko breadcrumbs crust.', imgPrefix: 'starter_dish' },
        { name: 'Crispy Veg Cutlet Deluxe', price: '179.00', description: 'Spiced vegetable patties served with tangy tomato tamarind dip.', prep: 'Pan fried till golden brown.', imgPrefix: 'starter_dish' }
    ],
    'chinese': [
        { name: 'Schezwan Veg Fried Rice', price: '239.00', description: 'Spicy wok tossed rice with exotic veggies and spicy schezwan sauce.', prep: 'Wok tossed on high flame.', imgPrefix: 'starter_dish' },
        { name: 'Chili Paneer Dry Spicy', price: '269.00', description: 'Crispy paneer cubes tossed in garlic, soy sauce, and green chilies.', prep: 'Indo-Chinese street style fry.', imgPrefix: 'starter_paneer_tikka' },
        { name: 'Veg Manchurian Balls Gravy', price: '249.00', description: 'Minced veggie balls in rich dark soy garlic sauce.', prep: 'Fried dumplings simmered in sauce.', imgPrefix: 'main_dish' },
        { name: 'Crispy Chili Garlic Noodles', price: '229.00', description: 'Spaghetti noodles tossed with crushed garlic, chilies, and scallions.', prep: 'Stir fried in sesame oil.', imgPrefix: 'starter_dish' },
        { name: 'Steamed Veg Dim Sum Dumplings', price: '219.00', description: 'Delicate steamed wheat dim sums filled with cabbage, corn, and mushrooms.', prep: 'Bamboo steamer basket steamed.', imgPrefix: 'starter_dish' }
    ],
    'desserts': [
        { name: 'Warm Gulab Jamun with Ice Cream', price: '149.00', description: 'Hot golden milk solid dumplings served with cold vanilla bean ice cream.', prep: 'Soaked in saffron sugar syrup.', imgPrefix: 'dessert_dish' },
        { name: 'Classic New York Cheesecake', price: '279.00', description: 'Smooth baked cream cheese cake on graham cracker crust with berry drizzle.', prep: 'Slow baked and chilled.', imgPrefix: 'dessert_dish' },
        { name: 'Sizzling Chocolate Walnut Brownie', price: '269.00', description: 'Fudgy walnut brownie served on sizzler plate with chocolate fudge sauce.', prep: 'Served sizzling hot.', imgPrefix: 'dessert_dish' },
        { name: 'Royal Saffron Rasmalai Bowl', price: '179.00', description: 'Soft cottage cheese discs soaked in cardamom saffron milk with pistachio.', prep: 'Chilled sweet milk dessert.', imgPrefix: 'dessert_dish' },
        { name: 'Italian Tiramisu Cream Cup', price: '259.00', description: 'Espresso soaked ladyfingers layered with mascarpone cream and cocoa dust.', prep: 'Traditional Italian recipe.', imgPrefix: 'dessert_dish' }
    ],
    'combos': [
        { name: 'Grand North Indian Thali Feast', price: '499.00', description: 'Complete thali with Paneer, Dal Makhani, Mix Veg, Naan, Rice & Dessert.', prep: 'Assorted royal Indian dishes.', imgPrefix: 'main_dal_makhani' },
        { name: 'Artisanal Pizza & Pasta Combo', price: '449.00', description: 'Medium Margherita Pizza + Creamy Alfredo Pasta + Garlic Bread & Soda.', prep: 'Italian duo combo meal.', imgPrefix: 'main_dish' },
        { name: 'Double Cheeseburger Fries Shake Combo', price: '399.00', description: 'Juicy Veg Cheeseburger + Salted French Fries + Chocolate Milkshake.', prep: 'Classic American combo.', imgPrefix: 'starter_dish' },
        { name: 'Tandoori Grill Platter Family Combo', price: '599.00', description: 'Assorted Paneer Tikka, Veg Seekh, Mushroom Tikka & Mint Chutney.', prep: 'Clay oven sizzler platter.', imgPrefix: 'starter_paneer_tikka' },
        { name: 'South Indian Dosa & Vada Combo', price: '299.00', description: 'Crispy Butter Masala Dosa + Medu Vada + Sambhar & Coconut Chutney.', prep: 'Fermented batter griddle cooked.', imgPrefix: 'main_dish' }
    ]
};

test.describe('Bulk Admin Product Insertion (5 Dishes Per Category)', () => {
    test.setTimeout(600000); // 10 minutes timeout for 30 products

    test('Log in as Admin and insert 5 products into every single category', async ({ page }) => {
        const errorsEncountered: string[] = [];
        const submissionLog: Array<{ categoryId: string; categoryName: string; dishName: string; price: number; success: boolean; message: string }> = [];

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

        // 2. NAVIGATE TO ADMIN DISHES
        console.log('Step 2: Navigating to Admin Dishes page...');
        await page.goto('/admin/dishes', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);

        // Read categories from Add Dish modal dropdown
        await page.locator('button').filter({ hasText: /Add New Dish|Add Dish/i }).first().click();
        await page.waitForTimeout(800);

        const modalForm = page.locator('form').first();
        const modalCategorySelect = modalForm.locator('select').first();
        await expect(modalCategorySelect).toBeVisible();

        const options = await modalCategorySelect.locator('option').all();
        const categoriesList: Array<{ id: string; name: string }> = [];

        for (const opt of options) {
            const val = await opt.getAttribute('value');
            const txt = await opt.innerText();
            if (val && val !== '' && val !== 'all' && !txt.includes('Select Category')) {
                categoriesList.push({ id: val, name: txt.trim() });
            }
        }

        console.log(`Total Categories Detected (${categoriesList.length}):`, categoriesList);

        // Close modal via Escape key
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        // 3. LOOP THROUGH EACH CATEGORY AND ADD 5 DISHES EACH
        for (const cat of categoriesList) {
            console.log(`\n======================================================================`);
            console.log(`STARTING BATCH INSERTION FOR CATEGORY: "${cat.name}" (ID: ${cat.id})`);
            console.log(`======================================================================`);

            const lowerCat = cat.name.toLowerCase();
            const matchingKey = Object.keys(fiveDishesPerCategoryMap).find(k => lowerCat.includes(k)) || 'main';
            const dishesToInsert = fiveDishesPerCategoryMap[matchingKey] || fiveDishesPerCategoryMap['main'];

            for (let i = 0; i < dishesToInsert.length; i++) {
                const item = dishesToInsert[i];
                console.log(`\n[${cat.name} ${i + 1}/5] Adding Dish: "${item.name}" (₹${item.price})`);

                const imagePath = getGeneratedImage(item.imgPrefix);

                // Open Add Dish Modal
                await page.locator('button').filter({ hasText: /Add New Dish|Add Dish/i }).first().click();
                await page.waitForTimeout(600);

                const activeForm = page.locator('form').first();

                // Fill Form Fields
                await activeForm.locator('input[placeholder*="Margherita Pizza"], input[placeholder*="Name"], input[type="text"]').first().fill(item.name);
                await activeForm.locator('input[type="number"]').first().fill(item.price);
                await activeForm.locator('select').first().selectOption(cat.id);

                const textareas = activeForm.locator('textarea');
                if (await textareas.count() > 0) await textareas.nth(0).fill(item.description);
                if (await textareas.count() > 1) await textareas.nth(1).fill(item.prep);

                // Upload Image
                await activeForm.locator('input[type="file"]').first().setInputFiles(imagePath);
                await page.waitForTimeout(800);

                // Handle Crop Modal if opened
                const applyCropBtn = page.locator('button').filter({ hasText: /Apply Cropped Image/i });
                if (await applyCropBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
                    await applyCropBtn.click();
                    await page.waitForTimeout(800);
                }

                // Submit Form
                const saveBtn = activeForm.locator('button[type="submit"]').filter({ hasText: /Save Dish/i }).first();
                await saveBtn.click();
                await page.waitForTimeout(2000);

                // Check Toast & Modal Status
                const toastEl = page.locator('div[role="status"], div:has-text("saved"), div:has-text("error"), div:has-text("Failed")').first();
                let toastMsg = '';
                if (await toastEl.isVisible().catch(() => false)) {
                    toastMsg = await toastEl.innerText();
                }

                const isModalOpen = await page.locator('h2').filter({ hasText: /Add New Dish|Edit Dish/i }).isVisible().catch(() => false);

                if (isModalOpen) {
                    const errMsg = toastMsg || 'Form modal stayed open (possible validation or server error)';
                    console.error(`❌ FAILED to add "${item.name}": ${errMsg}`);
                    submissionLog.push({
                        categoryId: cat.id,
                        categoryName: cat.name,
                        dishName: item.name,
                        price: parseFloat(item.price),
                        success: false,
                        message: errMsg
                    });
                    errorsEncountered.push(`Category "${cat.name}" Dish "${item.name}" Error: ${errMsg}`);
                    await page.keyboard.press('Escape');
                    await page.waitForTimeout(500);
                } else {
                    console.log(`✅ SUCCESS: Dish "${item.name}" added to "${cat.name}"!`);
                    submissionLog.push({
                        categoryId: cat.id,
                        categoryName: cat.name,
                        dishName: item.name,
                        price: parseFloat(item.price),
                        success: true,
                        message: toastMsg || `Dish "${item.name}" saved successfully!`
                    });
                }
            }
        }

        // 4. SUMMARY & REPORT PERSISTENCE
        console.log('\n======================================================================');
        console.log('FINAL AUDIT SUMMARY: 5 DISHES PER CATEGORY INSERTION');
        console.log('======================================================================');
        console.log(`Total Products Attempted: ${submissionLog.length}`);
        console.log(`Total Successful: ${submissionLog.filter(s => s.success).length}`);
        console.log(`Total Errors: ${errorsEncountered.length}`);

        fs.writeFileSync(
            path.join(ARTIFACT_DIR, 'admin_5_dishes_per_category_audit.json'),
            JSON.stringify({ submissionLog, errorsEncountered }, null, 2)
        );

        const totalSuccessful = submissionLog.filter(s => s.success).length;
        expect(totalSuccessful).toBeGreaterThan(0);
    });
});
