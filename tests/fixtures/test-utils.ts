import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local if it exists
dotenv.config({ path: path.resolve(__dirname, '../../.env.local'), quiet: true });

import { test as base } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Validate required environment variables
const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

// Check for missing environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value || value.trim() === '')
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Declare custom fixture types
type CustomFixtures = {
  supabase: SupabaseClient;
  testUser: { email: string; password: string; id: string };
  testPortfolioId: string;
};

// Extend the base test with custom fixtures
export const test = base.extend<CustomFixtures>({
  // Supabase client fixture
  supabase: async ({}, use) => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await use(supabase);
  },

  // Test user fixture - creates a unique user for each test
  testUser: async ({}, use) => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    const email = `playwright-test-${randomUUID()}@example.com`;
    const password = `PW!${randomUUID()}`;
    const full_name = 'Playwright Test User';

    // Clean up any existing user/profile with this email
    await supabase.from('profiles').delete().eq('email', email);
    const { data: userList } = await supabase.auth.admin.listUsers();
    const usersWithEmail = userList?.users?.filter((u: any) => u.email === email) || [];
    if (usersWithEmail.length > 0) {
      for (const u of usersWithEmail) {
        await supabase.auth.admin.deleteUser(u.id);
      }
    }

    // Create user in auth.users (with email confirmed)
    const { data: user, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });
    if (error || !user) throw new Error('Failed to create test user: ' + error?.message);

    // Ensure no existing profile with this id
    await supabase.from('profiles').delete().eq('id', user.user.id);

    // Insert into profiles
    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.user.id,
      email,
      full_name,
    });
    if (profileError) throw new Error('Failed to create test profile: ' + profileError.message);

    const testUser = { email, password, id: user.user.id };

    // Use the test user
    await use(testUser);

    // Cleanup after test
    try {
      // Delete from profiles
      await supabase.from('profiles').delete().eq('id', testUser.id);
      // Delete from auth.users
      await supabase.auth.admin.deleteUser(testUser.id);
    } catch (error) {
      console.error('Error during test user cleanup:', error);
    }
  },

  // Test portfolio fixture - creates a portfolio for the test user
  testPortfolioId: async ({ testUser }, use) => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    // Create a test portfolio
    const { data: portfolio, error: portfolioError } = await supabase.from('portfolios').insert({
      name: 'Test Portfolio',
      description: 'Portfolio for testing',
      user_id: testUser.id,
    }).select().single();
    
    if (portfolioError) throw new Error('Failed to create test portfolio: ' + portfolioError.message);

    // Use the portfolio ID
    await use(portfolio.id);

    // Cleanup after test
    try {
      // Delete any securities in the portfolio first
      await supabase.from('portfolio_securities').delete().eq('portfolio_id', portfolio.id);
      // Delete any lots associated with the portfolio
      await supabase.from('security_lots').delete().eq('portfolio_id', portfolio.id);
      // Delete the portfolio
      await supabase.from('portfolios').delete().eq('id', portfolio.id);
    } catch (error) {
      console.error('Error during test portfolio cleanup:', error);
    }
  },
});

export { expect } from '@playwright/test';