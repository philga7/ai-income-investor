import { supabase } from '@/lib/supabase';
import { yahooFinanceClient } from '@/lib/financial/api/yahoo/client';
import { handleYahooFinanceError } from '@/lib/financial/api/errors';
import { dividendService } from './dividendService';

export interface Security {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  price: number;
  prev_close: number;
  open: number;
  volume: number;
  market_cap: number;
  pe: number;
  eps: number;
  dividend: number;
  yield: number;
  dividend_growth_5yr: number;
  payout_ratio: number;
  sma200: 'above' | 'below';
  tags: string[];
  day_low: number;
  day_high: number;
  fifty_two_week_low: number;
  fifty_two_week_high: number;
  average_volume: number;
  forward_pe: number;
  price_to_sales_trailing_12_months: number;
  beta: number;
  fifty_day_average: number;
  two_hundred_day_average: number;
  ex_dividend_date: string;
  target_low_price: number;
  target_high_price: number;
  recommendation_key: string;
  number_of_analyst_opinions: number;
  total_cash: number;
  total_debt: number;
  current_ratio: number;
  quick_ratio: number;
  debt_to_equity: number;
  return_on_equity: number;
  profit_margins: number;
  operating_margins: number;
  revenue_growth: number;
  earnings_growth: number;
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
        dividend_growth_5yr: quoteSummary.summaryDetail?.fiveYearAvgDividendYield ? quoteSummary.summaryDetail.fiveYearAvgDividendYield * 100 : 0 // Convert to percentage
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
          industry: updatedData.industry || security.industry,
          price: updatedData.price || security.price,
          prev_close: updatedData.prev_close || security.prev_close,
          open: updatedData.open || security.open,
          volume: updatedData.volume || security.volume,
          market_cap: updatedData.market_cap || security.market_cap,
          pe: updatedData.pe || security.pe,
          eps: updatedData.eps || security.eps,
          dividend: updatedData.dividend || security.dividend,
          yield: updatedData.yield || security.yield,
          dividend_growth_5yr: updatedData.dividend_growth_5yr || security.dividend_growth_5yr,
          payout_ratio: updatedData.payout_ratio || security.payout_ratio,
          sma200: updatedData.sma200 || security.sma200,
          tags: updatedData.tags || security.tags,
          day_low: updatedData.day_low || security.day_low,
          day_high: updatedData.day_high || security.day_high,
          fifty_two_week_low: updatedData.fifty_two_week_low || security.fifty_two_week_low,
          fifty_two_week_high: updatedData.fifty_two_week_high || security.fifty_two_week_high,
          average_volume: updatedData.average_volume || security.average_volume,
          forward_pe: updatedData.forward_pe || security.forward_pe,
          price_to_sales_trailing_12_months: updatedData.price_to_sales_trailing_12_months || security.price_to_sales_trailing_12_months,
          beta: updatedData.beta || security.beta,
          fifty_day_average: updatedData.fifty_day_average || security.fifty_day_average,
          two_hundred_day_average: updatedData.two_hundred_day_average || security.two_hundred_day_average,
          ex_dividend_date: updatedData.ex_dividend_date || security.ex_dividend_date,
          target_low_price: updatedData.target_low_price || security.target_low_price,
          target_high_price: updatedData.target_high_price || security.target_high_price,
          recommendation_key: updatedData.recommendation_key || security.recommendation_key,
          number_of_analyst_opinions: updatedData.number_of_analyst_opinions || security.number_of_analyst_opinions,
          total_cash: updatedData.total_cash || security.total_cash,
          total_debt: updatedData.total_debt || security.total_debt,
          current_ratio: updatedData.current_ratio || security.current_ratio,
          quick_ratio: updatedData.quick_ratio || security.quick_ratio,
          debt_to_equity: updatedData.debt_to_equity || security.debt_to_equity,
          return_on_equity: updatedData.return_on_equity || security.return_on_equity,
          profit_margins: updatedData.profit_margins || security.profit_margins,
          operating_margins: updatedData.operating_margins || security.operating_margins,
          revenue_growth: updatedData.revenue_growth || security.revenue_growth,
          earnings_growth: updatedData.earnings_growth || security.earnings_growth,
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