import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { test as setup } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import fs from 'fs';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

setup('create test user in Supabase', async () => {
  const email = `playwright-test-${randomUUID()}@example.com`;
  const password = `PW!${randomUUID()}`;
  const full_name = 'Playwright Test User';

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

  // Store credentials for test/teardown
  fs.writeFileSync('tests/test-user.json', JSON.stringify({ email, password, id: user.user.id }, null, 2));
}); 