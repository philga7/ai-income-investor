import { supabase } from '@/lib/supabase';
import { yahooFinanceClient } from '@/lib/financial/api/yahoo/client';
import { handleYahooFinanceError } from '@/lib/financial/api/errors';
import { dividendService } from './dividendService';

export interface Security {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  price: number;
  yield: number;
  sma200: 'above' | 'below';
  tags: string[];
  dividend_growth_5yr: number;
  last_fetched: string;
}

export const securityService = {
  async getSecurityData(ticker: string): Promise<Partial<Security> | null> {
    try {
      console.log('Getting security data for ticker:', ticker);
      // Get quote summary from Yahoo Finance
      const quoteSummary = await yahooFinanceClient.getQuoteSummary(ticker);
      
      if (!quoteSummary) {
        console.error('No data returned from Yahoo Finance for ticker:', ticker);
        return null;
      }

      console.log('Got quote summary for', ticker, quoteSummary);

      // Extract relevant data from quote summary
      const price = quoteSummary.price?.regularMarketPrice || 0;
      const dividendYield = quoteSummary.summaryDetail?.dividendYield || 0;
      const sma200 = price > (quoteSummary.summaryDetail?.twoHundredDayAverage || 0) ? 'above' as const : 'below' as const;
      
      // Get dividend data
      const exDate = quoteSummary.summaryDetail?.exDividendDate;
      const paymentDate = exDate ? new Date(exDate * 1000) : null; // Convert Unix timestamp to Date
      const estimatedPaymentDate = paymentDate ? new Date(paymentDate.getTime() + 30 * 24 * 60 * 60 * 1000) : null; // Estimate payment date as 30 days after ex-date
      
      const securityData: Partial<Security> = {
        name: quoteSummary.price?.longName || quoteSummary.price?.shortName || ticker,
        sector: quoteSummary.assetProfile?.sector || 'Unknown',
        price,
        yield: dividendYield * 100, // Convert to percentage
        sma200,
        tags: [quoteSummary.assetProfile?.sector || 'Unknown'],
        dividend_growth_5yr: quoteSummary.summaryDetail?.fiveYearAvgDividendYield || 0
      };

      // If we have dividend data, store it
      if (exDate && paymentDate && estimatedPaymentDate) {
        try {
          // Get the security ID from the database
          const { data: security } = await supabase
            .from('securities')
            .select('id')
            .eq('ticker', ticker)
            .single();

          if (security) {
            await dividendService.updateDividendDates(
              security.id,
              paymentDate.toISOString(),
              estimatedPaymentDate.toISOString()
            );
            console.log('Updated dividend dates for', ticker);
          }
        } catch (error) {
          console.error('Error updating dividend dates:', error);
        }
      }

      return securityData;
    } catch (error) {
      console.error('Error fetching security data:', error);
      handleYahooFinanceError(error);
      return null;
    }
  },

  async updateSecurityData(securityId: string): Promise<Security | null> {
    try {
      console.log('Starting security update for ID:', securityId);
      
      // Get the security from the database
      const { data: security, error: fetchError } = await supabase
        .from('securities')
        .select('*')
        .eq('id', securityId)
        .single();

      if (fetchError || !security) {
        console.error('Error fetching security:', fetchError);
        return null;
      }

      console.log('Fetched existing security:', security);

      // Get updated data
      const updatedData = await this.getSecurityData(security.ticker);
      if (!updatedData) {
        console.error('No updated data returned for ticker:', security.ticker);
        return security;
      }

      console.log('Got updated data from Yahoo Finance:', updatedData);

      // Update the security in the database
      const { data: updatedSecurity, error: updateError } = await supabase
        .from('securities')
        .update({
          name: updatedData.name || security.name,
          sector: updatedData.sector || security.sector,
          price: updatedData.price || security.price,
          yield: updatedData.yield || security.yield,
          sma200: updatedData.sma200 || security.sma200,
          tags: updatedData.tags || security.tags,
          updated_at: new Date().toISOString(),
          last_fetched: new Date().toISOString()
        })
        .eq('id', securityId)
        .select()
        .maybeSingle();

      if (updateError) {
        console.error('Error updating security:', updateError);
        console.error('Update error details:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint
        });
        return security;
      }

      console.log('Successfully updated security:', updatedSecurity);
      return updatedSecurity;
    } catch (error) {
      console.error('Error in updateSecurityData:', error);
      return null;
    }
  },

  async searchSecurities(query: string, filters?: {
    sector?: string;
    minYield?: number;
    maxYield?: number;
    sma200?: 'above' | 'below';
    sortBy?: 'ticker' | 'name' | 'yield' | 'price';
    sortOrder?: 'asc' | 'desc';
  }): Promise<Security[]> {
    try {
      let queryBuilder = supabase
        .from('securities')
        .select('*');

      // Apply search query if provided
      if (query) {
        queryBuilder = queryBuilder.or(`ticker.ilike.%${query}%,name.ilike.%${query}%`);
      }

      // Apply filters
      if (filters?.sector) {
        queryBuilder = queryBuilder.eq('sector', filters.sector);
      }

      if (filters?.minYield !== undefined) {
        queryBuilder = queryBuilder.gte('yield', filters.minYield);
      }

      if (filters?.maxYield !== undefined) {
        queryBuilder = queryBuilder.lte('yield', filters.maxYield);
      }

      if (filters?.sma200) {
        queryBuilder = queryBuilder.eq('sma200', filters.sma200);
      }

      // Apply sorting
      if (filters?.sortBy) {
        queryBuilder = queryBuilder.order(filters.sortBy, { 
          ascending: filters.sortOrder === 'asc' 
        });
      } else {
        // Default sorting by ticker
        queryBuilder = queryBuilder.order('ticker', { ascending: true });
      }

      const { data: securities, error } = await queryBuilder;

      if (error) {
        console.error('Error searching securities:', error);
        return [];
      }

      return securities.map(security => ({
        ...security,
        price: Number(security.price),
        yield: Number(security.yield)
      }));
    } catch (error) {
      console.error('Error in searchSecurities:', error);
      return [];
    }
  }
}; 