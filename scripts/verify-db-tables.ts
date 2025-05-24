import { supabase } from '../lib/supabase';

async function verifyDatabase() {
  console.log('Verifying database schema...\n');

  // Test profiles table
  console.log('Testing profiles table...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);
  
  if (profilesError) {
    console.error('Error accessing profiles table:', profilesError.message);
  } else {
    console.log('Profiles table accessible ✓');
  }

  // Test portfolios table
  console.log('\nTesting portfolios table...');
  const { data: portfolios, error: portfoliosError } = await supabase
    .from('portfolios')
    .select('*')
    .limit(1);
  
  if (portfoliosError) {
    console.error('Error accessing portfolios table:', portfoliosError.message);
  } else {
    console.log('Portfolios table accessible ✓');
  }

  // Test securities table
  console.log('\nTesting securities table...');
  const { data: securities, error: securitiesError } = await supabase
    .from('securities')
    .select('*')
    .limit(1);
  
  if (securitiesError) {
    console.error('Error accessing securities table:', securitiesError.message);
  } else {
    console.log('Securities table accessible ✓');
  }

  // Test portfolio_securities table
  console.log('\nTesting portfolio_securities table...');
  const { data: portfolioSecurities, error: portfolioSecuritiesError } = await supabase
    .from('portfolio_securities')
    .select('*')
    .limit(1);
  
  if (portfolioSecuritiesError) {
    console.error('Error accessing portfolio_securities table:', portfolioSecuritiesError.message);
  } else {
    console.log('Portfolio securities table accessible ✓');
  }

  // Test dividends table
  console.log('\nTesting dividends table...');
  const { data: dividends, error: dividendsError } = await supabase
    .from('dividends')
    .select('*')
    .limit(1);
  
  if (dividendsError) {
    console.error('Error accessing dividends table:', dividendsError.message);
  } else {
    console.log('Dividends table accessible ✓');
  }
}

verifyDatabase().catch(console.error); 