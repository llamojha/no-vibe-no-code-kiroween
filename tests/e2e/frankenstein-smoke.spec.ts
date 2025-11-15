import { test, expect } from '@playwright/test';
import { FrankensteinPage } from './helpers/page-objects/FrankensteinPage';

test.describe('Doctor Frankenstein Smoke Test', () => {
  test('should render generator shell', async ({ page }) => {
    const frankensteinPage = new FrankensteinPage(page);
    await frankensteinPage.navigate();
    await expect(page.locator('h1:has-text("Doctor Frankenstein")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Create Frankenstein")')).toBeVisible();
  });
});
