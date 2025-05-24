import { test as base } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Declare custom fixture types
type CustomFixtures = {
  supabase: SupabaseClient;
};

// Extend the base test with custom fixtures
export const test = base.extend<CustomFixtures>({
  // Add custom fixtures here as needed
  supabase: async ({}, use) => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await use(supabase);
  },
});

export { expect } from '@playwright/test';