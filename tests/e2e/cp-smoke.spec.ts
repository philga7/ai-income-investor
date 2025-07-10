import { test, expect } from '../fixtures/test-utils';
import { Page } from '@playwright/test';

// Helper: login via UI
async function login(page: Page, email: string, password: string) {
  await page.goto('/auth/sign-in');
  await page.getByTestId('signin-email').fill(email);
  await page.getByTestId('signin-password').fill(password);
  await page.getByTestId('signin-submit').click();
  
  // Wait for navigation to complete with more resilient strategy
  await page.waitForURL((url: URL) => url.pathname === '/' || url.pathname === '/dashboard', { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for authentication state to be established
  await page.waitForTimeout(2000);
}

test.describe('Critical Path Smoke Test', () => {
  test('User can log in and access main pages', async ({ page, testUser }) => {
    // Test login
    await login(page, testUser.email, testUser.password);
    await expect(page.getByTestId('user-menu-trigger')).toBeVisible();
    
    // Verify we're on dashboard
    await expect(page.getByText('Portfolio Summary')).toBeVisible();
    
    // Quick navigation test to protected pages
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
    
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Profile Settings' })).toBeVisible();
  });

  test('Portfolios page loads correctly', async ({ page, testUser, testPortfolioId }) => {
    await login(page, testUser.email, testUser.password);
    await page.goto('/portfolios');

    // Check page loads
    await expect(page.getByRole('heading', { name: 'Portfolios' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Portfolio' })).toBeVisible();
    
    // Check test portfolio exists
    await expect(page.getByRole('heading', { name: 'Test Portfolio' })).toBeVisible();
  });

  test('Securities page loads correctly', async ({ page, testUser }) => {
    await login(page, testUser.email, testUser.password);
    await page.goto('/securities');

    // Check page loads
    await expect(page.getByRole('heading', { name: 'Securities' })).toBeVisible();
    await expect(page.getByPlaceholder('Search securities...')).toBeVisible();
    
    // Wait for page to stabilize
    await page.waitForLoadState('domcontentloaded');
  });
}); 