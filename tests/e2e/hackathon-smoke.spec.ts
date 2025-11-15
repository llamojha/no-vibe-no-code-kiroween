import { test, expect } from '@playwright/test';
import { HackathonPage } from './helpers/page-objects/HackathonPage';

test.describe('Hackathon Analyzer Smoke Test', () => {
  test('should render hackathon analyzer shell', async ({ page }) => {
    const hackathonPage = new HackathonPage(page);
    await hackathonPage.navigate();
    await expect(hackathonPage.projectNameInput).toBeVisible({ timeout: 10000 });
    await expect(hackathonPage.analyzeButton).toBeVisible();
  });
});
