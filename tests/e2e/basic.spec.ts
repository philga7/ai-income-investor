import { test, expect } from '@playwright/test';

test.describe('Basic Navigation', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    // Basic check that the page loaded
    await expect(page).toHaveTitle(/AI Income Investor/);
  });

  test('navigation works', async ({ page }) => {
    await page.goto('/');
    
    // Check if header elements are visible
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('link', { name: 'AI Income Investor' })).toBeVisible();
    
    // Check if sidebar navigation elements are visible
    await expect(page.getByRole('complementary')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Portfolios' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Securities' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Dividends' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Performance' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
  });
}); 