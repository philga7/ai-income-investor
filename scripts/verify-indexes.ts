require('dotenv').config({ path: '.env.local' });
const { supabase } = require('../lib/supabase');

async function verifyIndexes() {
  // Verify environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Error: Missing required environment variables.');
    console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your .env.local file');
    process.exit(1);
  }

  console.log('Verifying database indexes...\n');

  // Test profiles table indexes
  console.log('Testing profiles table indexes...');
  
  // Test created_at index
  console.log('\nTesting created_at index...');
  const { data: createdData, error: createdError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (createdError) {
    console.error('Error testing created_at index:', createdError.message);
  } else {
    console.log('Created_at index working ✓');
  }

  // Test updated_at index
  console.log('\nTesting updated_at index...');
  const { data: updatedData, error: updatedError } = await supabase
    .from('profiles')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1);
  
  if (updatedError) {
    console.error('Error testing updated_at index:', updatedError.message);
  } else {
    console.log('Updated_at index working ✓');
  }

  // Test full_name index
  console.log('\nTesting full_name index...');
  const { data: nameData, error: nameError } = await supabase
    .from('profiles')
    .select('*')
    .ilike('full_name', '%')
    .limit(1);
  
  if (nameError) {
    console.error('Error testing full_name index:', nameError.message);
  } else {
    console.log('Full_name index working ✓');
  }

  // Test portfolios table indexes
  console.log('\nTesting portfolios table indexes...');
  
  // Test user_id index
  console.log('\nTesting user_id index...');
  const { data: userIdData, error: userIdError } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', '00000000-0000-0000-0000-000000000000')
    .limit(1);
  
  if (userIdError) {
    console.error('Error testing user_id index:', userIdError.message);
  } else {
    console.log('User_id index working ✓');
  }

  // Test portfolio created_at index
  console.log('\nTesting portfolio created_at index...');
  const { data: portfolioCreatedData, error: portfolioCreatedError } = await supabase
    .from('portfolios')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (portfolioCreatedError) {
    console.error('Error testing portfolio created_at index:', portfolioCreatedError.message);
  } else {
    console.log('Portfolio created_at index working ✓');
  }

  // Test portfolio updated_at index
  console.log('\nTesting portfolio updated_at index...');
  const { data: portfolioUpdatedData, error: portfolioUpdatedError } = await supabase
    .from('portfolios')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1);
  
  if (portfolioUpdatedError) {
    console.error('Error testing portfolio updated_at index:', portfolioUpdatedError.message);
  } else {
    console.log('Portfolio updated_at index working ✓');
  }

  // Test portfolio_securities indexes
  console.log('\nTesting portfolio_securities table indexes...');
  
  // Test portfolio_id index
  console.log('\nTesting portfolio_id index...');
  const { data: portfolioIdData, error: portfolioIdError } = await supabase
    .from('portfolio_securities')
    .select('*')
    .eq('portfolio_id', '00000000-0000-0000-0000-000000000000')
    .limit(1);
  
  if (portfolioIdError) {
    console.error('Error testing portfolio_id index:', portfolioIdError.message);
  } else {
    console.log('Portfolio_id index working ✓');
  }

  // Test security_id index
  console.log('\nTesting security_id index...');
  const { data: securityIdData, error: securityIdError } = await supabase
    .from('portfolio_securities')
    .select('*')
    .eq('security_id', '00000000-0000-0000-0000-000000000000')
    .limit(1);
  
  if (securityIdError) {
    console.error('Error testing security_id index:', securityIdError.message);
  } else {
    console.log('Security_id index working ✓');
  }

  // Test securities table indexes
  console.log('\nTesting securities table indexes...');
  
  // Test ticker index
  console.log('\nTesting ticker index...');
  const { data: tickerData, error: tickerError } = await supabase
    .from('securities')
    .select('*')
    .eq('ticker', 'AAPL')
    .limit(1);
  
  if (tickerError) {
    console.error('Error testing ticker index:', tickerError.message);
  } else {
    console.log('Ticker index working ✓');
  }

  // Test sector index
  console.log('\nTesting sector index...');
  const { data: sectorData, error: sectorError } = await supabase
    .from('securities')
    .select('*')
    .eq('sector', 'Technology')
    .limit(1);
  
  if (sectorError) {
    console.error('Error testing sector index:', sectorError.message);
  } else {
    console.log('Sector index working ✓');
  }

  // Test price index
  console.log('\nTesting price index...');
  const { data: priceData, error: priceError } = await supabase
    .from('securities')
    .select('*')
    .order('price', { ascending: false })
    .limit(1);
  
  if (priceError) {
    console.error('Error testing price index:', priceError.message);
  } else {
    console.log('Price index working ✓');
  }

  // Test yield index
  console.log('\nTesting yield index...');
  const { data: yieldData, error: yieldError } = await supabase
    .from('securities')
    .select('*')
    .order('yield', { ascending: false })
    .limit(1);
  
  if (yieldError) {
    console.error('Error testing yield index:', yieldError.message);
  } else {
    console.log('Yield index working ✓');
  }

  // Test sma200 index
  console.log('\nTesting sma200 index...');
  const { data: sma200Data, error: sma200Error } = await supabase
    .from('securities')
    .select('*')
    .eq('sma200', 'above')
    .limit(1);
  
  if (sma200Error) {
    console.error('Error testing sma200 index:', sma200Error.message);
  } else {
    console.log('Sma200 index working ✓');
  }

  // Test tags index
  console.log('\nTesting tags index...');
  const { data: tagsData, error: tagsError } = await supabase
    .from('securities')
    .select('*')
    .contains('tags', ['Growth'])
    .limit(1);
  
  if (tagsError) {
    console.error('Error testing tags index:', tagsError.message);
  } else {
    console.log('Tags index working ✓');
  }

  // Test dividends table indexes
  console.log('\nTesting dividends table indexes...');
  
  // Test security_id index
  console.log('\nTesting security_id index...');
  const { data: divSecurityIdData, error: divSecurityIdError } = await supabase
    .from('dividends')
    .select('*')
    .eq('security_id', '00000000-0000-0000-0000-000000000000')
    .limit(1);
  
  if (divSecurityIdError) {
    console.error('Error testing security_id index:', divSecurityIdError.message);
  } else {
    console.log('Security_id index working ✓');
  }

  // Test ex_date index
  console.log('\nTesting ex_date index...');
  const { data: exDateData, error: exDateError } = await supabase
    .from('dividends')
    .select('*')
    .order('ex_date', { ascending: false })
    .limit(1);
  
  if (exDateError) {
    console.error('Error testing ex_date index:', exDateError.message);
  } else {
    console.log('Ex_date index working ✓');
  }

  // Get index information from the database
  console.log('\nFetching index information...');
  const { data: indexInfo, error: indexError } = await supabase
    .rpc('get_table_indexes', { table_name: 'profiles' });
  
  if (indexError) {
    console.error('Error fetching index information:', indexError.message);
  } else {
    console.log('Index information for profiles:');
    console.log(JSON.stringify(indexInfo, null, 2));
  }

  // Get portfolio index information
  console.log('\nFetching portfolio index information...');
  const { data: portfolioIndexInfo, error: portfolioIndexError } = await supabase
    .rpc('get_table_indexes', { table_name: 'portfolios' });
  
  if (portfolioIndexError) {
    console.error('Error fetching portfolio index information:', portfolioIndexError.message);
  } else {
    console.log('Index information for portfolios:');
    console.log(JSON.stringify(portfolioIndexInfo, null, 2));
  }

  // Get portfolio_securities index information
  console.log('\nFetching portfolio_securities index information...');
  const { data: portfolioSecuritiesIndexInfo, error: portfolioSecuritiesIndexError } = await supabase
    .rpc('get_table_indexes', { table_name: 'portfolio_securities' });
  
  if (portfolioSecuritiesIndexError) {
    console.error('Error fetching portfolio_securities index information:', portfolioSecuritiesIndexError.message);
  } else {
    console.log('Index information for portfolio_securities:');
    console.log(JSON.stringify(portfolioSecuritiesIndexInfo, null, 2));
  }

  // Get securities index information
  console.log('\nFetching securities index information...');
  const { data: securitiesIndexInfo, error: securitiesIndexError } = await supabase
    .rpc('get_table_indexes', { table_name: 'securities' });
  
  if (securitiesIndexError) {
    console.error('Error fetching securities index information:', securitiesIndexError.message);
  } else {
    console.log('Index information for securities:');
    console.log(JSON.stringify(securitiesIndexInfo, null, 2));
  }

  // Get dividends index information
  console.log('\nFetching dividends index information...');
  const { data: dividendsIndexInfo, error: dividendsIndexError } = await supabase
    .rpc('get_table_indexes', { table_name: 'dividends' });
  
  if (dividendsIndexError) {
    console.error('Error fetching dividends index information:', dividendsIndexError.message);
  } else {
    console.log('Index information for dividends:');
    console.log(JSON.stringify(dividendsIndexInfo, null, 2));
  }
}

verifyIndexes().catch(console.error); 