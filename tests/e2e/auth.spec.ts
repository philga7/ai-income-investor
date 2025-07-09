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

  // Example of how to use the testUser fixture when needed
  test('should allow user to log in with valid credentials', async ({ page, testUser }) => {
    await page.goto('/auth/sign-in');
    
    // Fill in the login form
    await page.getByTestId('signin-email').fill(testUser.email);
    await page.getByTestId('signin-password').fill(testUser.password);
    await page.getByTestId('signin-submit').click();
    
    // Wait for successful login
    await page.waitForURL((url: URL) => url.pathname === '/' || url.pathname === '/dashboard');
    
    // Verify user is logged in
    await expect(page.getByTestId('user-menu-trigger')).toBeVisible();
  });
});