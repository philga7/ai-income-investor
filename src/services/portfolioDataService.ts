import { supabase } from '@/lib/supabase';
import { handleYahooFinanceError } from '@/src/lib/financial/api/errors';
import { Portfolio, PortfolioSecurity } from './portfolioService';

export const portfolioDataService = {
  async updatePortfolioSecurities(portfolioId: string): Promise<PortfolioSecurity[]> {
    try {
      // First, get the portfolio securities from the database
      const { data: securities, error: securitiesError } = await supabase
        .from('portfolio_securities')
        .select(`
          *,
          security:securities(*)
        `)
        .eq('portfolio_id', portfolioId);

      if (securitiesError) {
        console.error('Error fetching portfolio securities:', securitiesError);
        throw new Error('Failed to fetch portfolio securities');
      }

      if (!securities) {
        return [];
      }

      // Update each security with fresh data from our backend API
      const updatedSecurities = await Promise.all(
        securities.map(async (security) => {
          try {
            // Get the user's session token
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
              throw new Error('No access token available');
            }

            // Fetch updated data from our backend API
            const response = await fetch(`/api/securities/${security.security.ticker}`, {
              headers: {
                'Authorization': `Bearer ${session.access_token}`
              }
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to fetch security data');
            }

            const quoteSummary = await response.json();
            
            if (!quoteSummary) {
              console.error('No data returned from API for ticker:', security.security.ticker);
              return security;
            }

            // Extract relevant data from quote summary
            const price = quoteSummary.price?.regularMarketPrice || 0;
            const dividendYield = quoteSummary.summaryDetail?.dividendYield || 0;
            const sma200 = price > (quoteSummary.summaryDetail?.twoHundredDayAverage || 0) ? 'above' : 'below';

            // Update the security in the database
            const { data: updatedSecurity, error: updateError } = await supabase
              .from('securities')
              .update({
                name: quoteSummary.price?.longName || quoteSummary.price?.shortName || security.security.ticker,
                sector: quoteSummary.assetProfile?.sector || 'Unknown',
                price,
                yield: dividendYield * 100, // Convert to percentage
                sma200,
                last_fetched: new Date().toISOString()
              })
              .eq('id', security.security.id)
              .select()
              .single();

            if (updateError) {
              console.error('Error updating security:', updateError);
              return security;
            }

            return {
              ...security,
              security: {
                ...security.security,
                ...updatedSecurity
              }
            };
          } catch (error) {
            console.error(`Error updating security ${security.security.ticker}:`, error);
            return security;
          }
        })
      );

      return updatedSecurities;
    } catch (error) {
      console.error('Error in updatePortfolioSecurities:', error);
      handleYahooFinanceError(error);
      throw error;
    }
  }
}; 