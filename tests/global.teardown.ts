import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { test as teardown } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

teardown('delete test user from Supabase', async () => {
  let testUser;
  try {
    testUser = JSON.parse(fs.readFileSync('tests/test-user.json', 'utf-8'));
  } catch {
    // No test user file, nothing to clean up
    return;
  }
  const { id } = testUser;

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Delete from profiles
  await supabase.from('profiles').delete().eq('id', id);
  // Delete from auth.users
  await supabase.auth.admin.deleteUser(id);

  // Remove the temp file
  fs.unlinkSync('tests/test-user.json');
}); 