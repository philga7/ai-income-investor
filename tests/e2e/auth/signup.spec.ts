import { test, expect } from '../../fixtures/test-utils';

test.describe('Signup Page Navigation', () => {
  test('should navigate to signup page', async ({ page }) => {
    // Navigate to the home page first
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Click the signup link (assuming it's in the navigation)
    await page.getByRole('link', { name: /sign up/i }).click();
    
    // Wait for navigation and content to be ready
    await page.waitForURL(/.*\/auth\/sign-up/, { timeout: 10000 });
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Verify we're on the signup page
    await expect(page).toHaveURL(/.*\/auth\/sign-up/);
    
    // Verify the signup form is present
    await expect(page.getByRole('heading', { name: /Create an account/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    
    // Verify both password fields are present using placeholder text
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByPlaceholder('Confirm your password')).toBeVisible();
  });
}); 