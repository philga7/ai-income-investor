import { supabase } from '@/lib/supabase';
import { Security } from './portfolioService';
import { QuoteSummary } from '@/lib/financial/api/yahoo/types';

export type { Security };

export const securityService = {
  async getSecurityData(ticker: string): Promise<Security | null> {
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      // Fetch data from our API endpoint
      const response = await fetch(`/api/securities/${ticker}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch security data');
      }

      const quoteSummary = await response.json() as QuoteSummary;
      if (!quoteSummary) return null;

      // Extract relevant data from quote summary
      const price = quoteSummary.price?.regularMarketPrice || 0;
      const prev_close = quoteSummary.price?.regularMarketPreviousClose || 0;
      const open = quoteSummary.price?.regularMarketOpen || 0;
      const volume = quoteSummary.price?.regularMarketVolume || 0;
      const market_cap = quoteSummary.price?.marketCap || 0;
      const pe = quoteSummary.summaryDetail?.trailingPE || 0;
      const eps = quoteSummary.summaryDetail?.trailingPE || 0;
      const dividend = quoteSummary.summaryDetail?.dividendRate || 0;
      const dividendYield = (quoteSummary.summaryDetail?.dividendYield || 0) * 100;
      const dividend_growth_5yr = quoteSummary.summaryDetail?.fiveYearAvgDividendYield || 0;
      const payout_ratio = quoteSummary.summaryDetail?.payoutRatio || 0;
      const sma200 = price > (quoteSummary.summaryDetail?.twoHundredDayAverage || 0) ? 'above' : 'below';
      const day_low = quoteSummary.price?.regularMarketDayLow || 0;
      const day_high = quoteSummary.price?.regularMarketDayHigh || 0;
      const fifty_two_week_low = quoteSummary.summaryDetail?.fiftyTwoWeekLow || 0;
      const fifty_two_week_high = quoteSummary.summaryDetail?.fiftyTwoWeekHigh || 0;
      const average_volume = quoteSummary.summaryDetail?.averageVolume || 0;
      const forward_pe = quoteSummary.summaryDetail?.forwardPE || 0;
      const price_to_sales_trailing_12_months = quoteSummary.summaryDetail?.priceToSalesTrailing12Months || 0;
      const beta = quoteSummary.summaryDetail?.beta || 0;
      const fifty_day_average = quoteSummary.summaryDetail?.fiftyDayAverage || 0;
      const two_hundred_day_average = quoteSummary.summaryDetail?.twoHundredDayAverage || 0;

      // Format date to ISO string with timezone for PostgreSQL TIMESTAMP WITH TIME ZONE
      const formatDate = (timestamp: number | undefined) => {
        if (!timestamp) return null;
        try {
          if (isNaN(timestamp)) {
            console.warn('Invalid timestamp:', timestamp);
            return null;
          }

          const date = new Date(timestamp * 1000);
          
          if (isNaN(date.getTime())) {
            console.warn('Invalid date from timestamp:', timestamp);
            return null;
          }

          const year = date.getUTCFullYear();
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const day = String(date.getUTCDate()).padStart(2, '0');
          
          return `${year}-${month}-${day}`;
        } catch (error) {
          console.error('Error formatting date:', error);
          return null;
        }
      };

      const ex_dividend_date = formatDate(quoteSummary.summaryDetail?.exDividendDate);

      return {
        id: '', // Will be set by database
        ticker,
        name: quoteSummary.price?.longName || quoteSummary.price?.shortName || ticker,
        sector: quoteSummary.assetProfile?.sector || 'Unknown',
        industry: quoteSummary.assetProfile?.industry || 'Unknown',
        price,
        prev_close,
        open,
        volume,
        market_cap,
        pe,
        eps,
        dividend,
        yield: dividendYield,
        dividend_growth_5yr,
        payout_ratio,
        sma200,
        tags: [],
        day_low,
        day_high,
        fifty_two_week_low,
        fifty_two_week_high,
        average_volume,
        forward_pe,
        price_to_sales_trailing_12_months,
        beta,
        fifty_day_average,
        two_hundred_day_average,
        ex_dividend_date: ex_dividend_date || '',
        operating_cash_flow: quoteSummary.financialData?.operatingCashflow || 0,
        free_cash_flow: quoteSummary.financialData?.freeCashflow || 0,
        cash_flow_growth: quoteSummary.cashflowStatementHistory?.cashflowStatements[0]?.totalCashFromOperatingActivities || 0,
        last_fetched: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching security data:', error);
      return null;
    }
  },

  async updateSecurityData(securityId: string): Promise<Security | null> {
    try {
      // Get the security from the database to get its ticker
      const { data: security, error: securityError } = await supabase
        .from('securities')
        .select('*')
        .eq('id', securityId)
        .single();

      if (securityError) {
        console.error('Error fetching security:', securityError);
        return null;
      }

      // Get updated data using our API endpoint
      const updatedData = await this.getSecurityData(security.ticker);
      if (!updatedData) return null;

      // Update the security in the database
      const { data: updatedSecurity, error: updateError } = await supabase
        .from('securities')
        .update({
          name: updatedData.name,
          sector: updatedData.sector,
          industry: updatedData.industry,
          price: updatedData.price,
          prev_close: updatedData.prev_close,
          open: updatedData.open,
          volume: updatedData.volume,
          market_cap: updatedData.market_cap,
          pe: updatedData.pe,
          eps: updatedData.eps,
          dividend: updatedData.dividend,
          yield: updatedData.yield,
          dividend_growth_5yr: updatedData.dividend_growth_5yr,
          payout_ratio: updatedData.payout_ratio,
          sma200: updatedData.sma200,
          day_low: updatedData.day_low,
          day_high: updatedData.day_high,
          fifty_two_week_low: updatedData.fifty_two_week_low,
          fifty_two_week_high: updatedData.fifty_two_week_high,
          average_volume: updatedData.average_volume,
          forward_pe: updatedData.forward_pe,
          price_to_sales_trailing_12_months: updatedData.price_to_sales_trailing_12_months,
          beta: updatedData.beta,
          fifty_day_average: updatedData.fifty_day_average,
          two_hundred_day_average: updatedData.two_hundred_day_average,
          ex_dividend_date: updatedData.ex_dividend_date,
          operating_cash_flow: updatedData.operating_cash_flow,
          free_cash_flow: updatedData.free_cash_flow,
          cash_flow_growth: updatedData.cash_flow_growth,
          last_fetched: new Date().toISOString()
        })
        .eq('id', securityId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating security:', updateError);
        return null;
      }

      return updatedSecurity;
    } catch (error) {
      console.error('Error updating security data:', error);
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