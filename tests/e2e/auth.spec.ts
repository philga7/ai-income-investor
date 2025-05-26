import { test, expect } from '../fixtures/test-utils';

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    // Navigate to login page with specific wait condition
    await page.goto('/auth/sign-in', { 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    });
    
    // Wait for the form to be ready
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Log the current URL and title for debugging
    console.log('Current URL:', page.url());
    console.log('Current title:', await page.title());
    
    // Check if we're on the correct page
    await expect(page).toHaveURL(/.*\/auth\/sign-in/);
    
    // Now check the title
    await expect(page).toHaveTitle(/AI Income Investor/);
    
    // Verify the login form is present
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
  });
});