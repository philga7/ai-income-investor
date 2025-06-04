import { supabase } from '@/lib/supabase';
import { handleYahooFinanceError } from '@/src/lib/financial/api/errors';
import { Portfolio, PortfolioSecurity, Security } from './portfolioService';
import { financialService } from './financialService';
import { QuoteSummary } from '@/lib/financial/api/yahoo/types';

interface DatabaseSecurity {
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
  last_fetched: string;
}

interface PortfolioSecurityRecord {
  id: string;
  security_id: string;
  shares: number;
  average_cost: number;
  security: DatabaseSecurity;
}

export const portfolioDataService = {
  async updatePortfolioSecurities(portfolioId: string): Promise<PortfolioSecurity[]> {
    try {
      // Fetch portfolio securities from the database
      const { data: portfolioSecurities, error: fetchError } = await supabase
        .from('portfolio_securities')
        .select(`
          id,
          security_id,
          shares,
          average_cost,
          security:securities (
            id,
            ticker,
            name,
            sector,
            industry,
            price,
            prev_close,
            open,
            volume,
            market_cap,
            pe,
            eps,
            dividend,
            yield,
            dividend_growth_5yr,
            payout_ratio,
            sma200,
            tags,
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
            ex_dividend_date,
            last_fetched
          )
        `)
        .eq('portfolio_id', portfolioId);

      if (fetchError) throw fetchError;
      if (!portfolioSecurities) return [];

      // Update each security with fresh data
      const updatedSecurities = await Promise.all(
        (portfolioSecurities as unknown as PortfolioSecurityRecord[]).map(async (ps) => {
          try {
            const quoteSummary = await financialService.getQuoteSummary(ps.security.ticker);
            if (!quoteSummary) return ps;

            const {
              price,
              summaryDetail,
              price: priceData
            } = quoteSummary;

            // Update the security in the database
            const { data: updatedSecurity, error: updateError } = await supabase
              .from('securities')
              .update({
                name: priceData?.longName || priceData?.shortName || ps.security.ticker,
                sector: quoteSummary.assetProfile?.sector || 'Unknown',
                industry: quoteSummary.assetProfile?.industry || 'Unknown',
                price: price?.regularMarketPrice || 0,
                prev_close: price?.regularMarketPreviousClose || 0,
                open: price?.regularMarketOpen || 0,
                volume: price?.regularMarketVolume || 0,
                market_cap: price?.marketCap || 0,
                pe: summaryDetail?.trailingPE || 0,
                eps: summaryDetail?.trailingPE || 0, // Using trailingPE as fallback since trailingEps is not available
                dividend: summaryDetail?.dividendRate || 0,
                yield: summaryDetail?.dividendYield ? summaryDetail.dividendYield * 100 : null,
                dividend_growth_5yr: summaryDetail?.fiveYearAvgDividendYield || 0,
                payout_ratio: summaryDetail?.payoutRatio || 0,
                sma200: (price?.regularMarketPrice || 0) > (summaryDetail?.twoHundredDayAverage || 0) ? 'above' : 'below',
                day_low: price?.regularMarketDayLow || 0,
                day_high: price?.regularMarketDayHigh || 0,
                fifty_two_week_low: price?.regularMarketDayLow || 0,
                fifty_two_week_high: price?.regularMarketDayHigh || 0,
                average_volume: summaryDetail?.averageVolume || 0,
                forward_pe: summaryDetail?.forwardPE || 0,
                price_to_sales_trailing_12_months: summaryDetail?.priceToSalesTrailing12Months || 0,
                beta: summaryDetail?.beta || 0,
                fifty_day_average: summaryDetail?.fiftyDayAverage || 0,
                two_hundred_day_average: summaryDetail?.twoHundredDayAverage || 0,
                ex_dividend_date: summaryDetail?.exDividendDate ? new Date(summaryDetail.exDividendDate * 1000).toISOString() : null,
                // Add financial data fields
                target_low_price: quoteSummary.financialData?.targetLowPrice || 0,
                target_high_price: quoteSummary.financialData?.targetHighPrice || 0,
                recommendation_key: quoteSummary.financialData?.recommendationKey || null,
                number_of_analyst_opinions: quoteSummary.financialData?.numberOfAnalystOpinions || 0,
                total_cash: quoteSummary.financialData?.totalCash || 0,
                total_debt: quoteSummary.financialData?.totalDebt || 0,
                current_ratio: quoteSummary.financialData?.currentRatio || 0,
                quick_ratio: quoteSummary.financialData?.quickRatio || 0,
                debt_to_equity: quoteSummary.financialData?.debtToEquity || 0,
                return_on_equity: quoteSummary.financialData?.returnOnEquity || 0,
                profit_margins: quoteSummary.financialData?.profitMargins || 0,
                operating_margins: quoteSummary.financialData?.operatingMargins || 0,
                revenue_growth: quoteSummary.financialData?.revenueGrowth || 0,
                earnings_growth: quoteSummary.financialData?.earningsGrowth || 0,
                last_fetched: new Date().toISOString()
              })
              .eq('ticker', ps.security.ticker)
              .select()
              .single();

            if (updateError) throw updateError;

            return {
              id: ps.id,
              shares: ps.shares,
              average_cost: ps.average_cost,
              security: {
                ...updatedSecurity,
                id: ps.security.id,
                ex_dividend_date: updatedSecurity.ex_dividend_date || ''
              } as Security
            } as PortfolioSecurity;
          } catch (error) {
            console.error(`Error updating security ${ps.security.ticker}:`, error);
            return {
              id: ps.id,
              shares: ps.shares,
              average_cost: ps.average_cost,
              security: {
                ...ps.security,
                ex_dividend_date: ps.security.ex_dividend_date || ''
              } as Security
            } as PortfolioSecurity;
          }
        })
      );

      return updatedSecurities;
    } catch (error) {
      console.error('Error updating portfolio securities:', error);
      handleYahooFinanceError(error);
      throw error;
    }
  }
}; 