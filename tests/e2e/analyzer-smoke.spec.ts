import { test, expect } from '@playwright/test';
import { AnalyzerPage } from './helpers/page-objects/AnalyzerPage';

test.describe('Analyzer Smoke Test', () => {
  test('should render analyzer page shell', async ({ page }) => {
    const analyzerPage = new AnalyzerPage(page);
    await analyzerPage.navigate();

    await expect(analyzerPage.ideaInput).toBeVisible();
    await expect(analyzerPage.analyzeButton).toBeVisible();
  });
});
