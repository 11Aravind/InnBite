import { test as base, Page } from '@playwright/test';

type TestFixtures = {
  customerPageA: Page;
  customerPageB: Page;
  waiterPage: Page;
  adminPage: Page;
};

export const test = base.extend<TestFixtures>({
  customerPageA: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/table/1');
    await use(page);
    await context.close();
  },

  customerPageB: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/table/1');
    await use(page);
    await context.close();
  },

  waiterPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/waiter/login');
    await use(page);
    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/admin/login');
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
