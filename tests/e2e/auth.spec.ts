import { test, expect } from '../fixtures/test-utils';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page).toHaveTitle(/AI Income Investor/);
    // await expect(page.getByRole('heading', { name: /Sign in/i })).toBeVisible();
  });
});