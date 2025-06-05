import { supabase } from '@/lib/supabase';
import { handleYahooFinanceError } from '@/src/lib/financial/api/errors';
import { Portfolio, PortfolioSecurity, Security } from './portfolioService';
import { QuoteSummary } from '@/lib/financial/api/yahoo/types';

interface DatabaseSecurity {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  address1?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  website?: string;
  industry_key?: string;
  industry_disp?: string;
  sector_key?: string;
  sector_disp?: string;
  long_business_summary?: string;
  full_time_employees?: number;
  audit_risk?: number;
  board_risk?: number;
  compensation_risk?: number;
  shareholder_rights_risk?: number;
  overall_risk?: number;
  governance_epoch_date?: string;
  compensation_as_of_epoch_date?: string;
  ir_website?: string;
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
  operating_cash_flow: number;
  free_cash_flow: number;
  cash_flow_growth: number;
  earnings?: {
    maxAge: number;
    earningsDate: number[];
    earningsAverage: number;
    earningsLow: number;
    earningsHigh: number;
    earningsChart: {
      quarterly: {
        date: number;
        actual: number;
        estimate: number;
      }[];
      currentQuarterEstimate: number;
      currentQuarterEstimateDate: string;
      currentQuarterEstimateYear: number;
      earningsDate: number[];
      isEarningsDateEstimate: boolean;
    };
    financialsChart: {
      yearly: {
        date: number;
        revenue: number;
        earnings: number;
      }[];
      quarterly: {
        date: number;
        revenue: number;
        earnings: number;
      }[];
    };
    financialCurrency: string;
  };
  last_fetched: string;
}

interface PortfolioSecurityRecord {
  id: string;
  security_id: string;
  shares: number;
  average_cost: number;
  security: Security;
}

interface BatchResponse {
  ticker: string;
  data: QuoteSummary;
}

interface SupabasePortfolioSecurity {
  id: string;
  security_id: string;
  shares: number;
  average_cost: number;
  security: {
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
    sma200: string;
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
  };
}

export const portfolioDataService = {
  async updatePortfolioSecurities(portfolioId: string): Promise<PortfolioSecurity[]> {
    try {
      // Helper function to format dates
      const formatDate = (timestamp: number | undefined, fieldName?: string) => {
        if (!timestamp) return null;
        try {
          // Special handling for epoch dates from Yahoo Finance
          if (fieldName === 'governance_epoch_date' || fieldName === 'compensation_as_of_epoch_date') {
            // These dates might be in a different format, try parsing as a regular date first
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              if (year >= 1900 && year <= 2100) {
                return date.toISOString();
              }
            }
            // If that fails, try the original epoch conversion
            const epochDate = new Date(timestamp * 1000);
            if (!isNaN(epochDate.getTime())) {
              const year = epochDate.getFullYear();
              if (year >= 1900 && year <= 2100) {
                return epochDate.toISOString();
              }
            }
            console.warn(`Invalid date format for ${fieldName}:`, timestamp);
            return null;
          }

          // Special handling for ex-dividend date
          if (fieldName === 'ex_dividend_date') {
            // Try parsing as a regular date first
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              if (year >= 1900 && year <= 2100) {
                return date.toISOString();
              }
            }
            // If that fails, try the epoch conversion
            const epochDate = new Date(timestamp * 1000);
            if (!isNaN(epochDate.getTime())) {
              const year = epochDate.getFullYear();
              if (year >= 1900 && year <= 2100) {
                return epochDate.toISOString();
              }
            }
            console.warn(`Invalid ex-dividend date format:`, timestamp);
            return null;
          }

          // Default handling for other dates
          if (isNaN(timestamp)) {
            console.warn(`Invalid timestamp for ${fieldName || 'unknown field'}:`, timestamp);
            return null;
          }
          const date = new Date(timestamp * 1000);
          if (isNaN(date.getTime())) {
            console.warn(`Invalid date from timestamp for ${fieldName || 'unknown field'}:`, timestamp);
            return null;
          }
          const year = date.getFullYear();
          if (year < 1900 || year > 2100) {
            console.warn(`Date year out of reasonable range for ${fieldName || 'unknown field'}:`, year);
            return null;
          }
          return date.toISOString();
        } catch (error) {
          console.error(`Error formatting date for ${fieldName || 'unknown field'}:`, error);
          return null;
        }
      };

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

      if (fetchError) {
        console.error('Error fetching portfolio securities:', fetchError);
        throw new Error(`Failed to fetch portfolio securities: ${fetchError.message}`);
      }
      if (!portfolioSecurities) {
        console.warn('No portfolio securities found for portfolio:', portfolioId);
        return [];
      }

      // Get all unique tickers
      const tickers = Array.from(new Set((portfolioSecurities as unknown as SupabasePortfolioSecurity[]).map(ps => ps.security.ticker)));
      if (tickers.length === 0) {
        console.warn('No tickers found in portfolio securities');
        return [];
      }

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session found');
        throw new Error('Authentication required: No active session');
      }

      // Fetch data for all securities in one batch
      const response = await fetch('/api/securities/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ tickers })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('API error response:', error);
        throw new Error(`Failed to fetch securities data: ${error.error || response.statusText}`);
      }

      const results = await response.json() as BatchResponse[];
      if (!results || results.length === 0) {
        console.warn('No results returned from securities batch API');
        return [];
      }

      // Create a map of ticker to quote summary for easy lookup
      const quoteSummaryMap = new Map(
        results.map(result => [result.ticker, result.data])
      );

      // Update each security with fresh data
      const updatedSecurities = await Promise.all(
        (portfolioSecurities as unknown as PortfolioSecurityRecord[]).map(async (ps) => {
          const quoteSummary = quoteSummaryMap.get(ps.security.ticker);
          if (!quoteSummary) return ps;

          const {
            price,
            summaryDetail,
            price: priceData,
            assetProfile,
            financialData,
            cashflowStatementHistory
          } = quoteSummary;

          // Update the security in the database
          const { data: updatedSecurity, error: updateError } = await supabase
            .from('securities')
            .update({
              name: priceData?.longName || priceData?.shortName || ps.security.ticker,
              sector: assetProfile?.sector || 'Unknown',
              industry: assetProfile?.industry || 'Unknown',
              address1: assetProfile?.address1,
              city: assetProfile?.city,
              state: assetProfile?.state,
              zip: assetProfile?.zip,
              country: assetProfile?.country,
              phone: assetProfile?.phone,
              website: assetProfile?.website,
              industry_key: assetProfile?.industryKey,
              industry_disp: assetProfile?.industryDisp,
              sector_key: assetProfile?.sectorKey,
              sector_disp: assetProfile?.sectorDisp,
              long_business_summary: assetProfile?.longBusinessSummary,
              full_time_employees: assetProfile?.fullTimeEmployees,
              audit_risk: assetProfile?.auditRisk,
              board_risk: assetProfile?.boardRisk,
              compensation_risk: assetProfile?.compensationRisk,
              shareholder_rights_risk: assetProfile?.shareHolderRightsRisk,
              overall_risk: assetProfile?.overallRisk,
              governance_epoch_date: assetProfile?.governanceEpochDate ? formatDate(assetProfile.governanceEpochDate, 'governance_epoch_date') : null,
              compensation_as_of_epoch_date: assetProfile?.compensationAsOfEpochDate ? formatDate(assetProfile.compensationAsOfEpochDate, 'compensation_as_of_epoch_date') : null,
              ir_website: assetProfile?.irWebsite,
              price: price?.regularMarketPrice || 0,
              prev_close: price?.regularMarketPreviousClose || 0,
              open: price?.regularMarketOpen || 0,
              volume: price?.regularMarketVolume || 0,
              market_cap: price?.marketCap || 0,
              pe: summaryDetail?.trailingPE || 0,
              eps: summaryDetail?.trailingPE || 0,
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
              ex_dividend_date: summaryDetail?.exDividendDate ? formatDate(summaryDetail.exDividendDate, 'ex_dividend_date') : null,
              // Add financial data fields
              target_low_price: financialData?.targetLowPrice || 0,
              target_high_price: financialData?.targetHighPrice || 0,
              recommendation_key: financialData?.recommendationKey || null,
              number_of_analyst_opinions: financialData?.numberOfAnalystOpinions || 0,
              total_cash: financialData?.totalCash || 0,
              total_debt: financialData?.totalDebt || 0,
              current_ratio: financialData?.currentRatio || 0,
              quick_ratio: financialData?.quickRatio || 0,
              debt_to_equity: financialData?.debtToEquity,
              return_on_equity: financialData?.returnOnEquity,
              profit_margins: financialData?.profitMargins,
              operating_margins: financialData?.operatingMargins,
              revenue_growth: financialData?.revenueGrowth,
              earnings_growth: financialData?.earningsGrowth,
              // Add cash flow data
              operating_cash_flow: financialData?.operatingCashflow,
              free_cash_flow: financialData?.freeCashflow,
              cash_flow_growth: cashflowStatementHistory?.cashflowStatements[0]?.totalCashFromOperatingActivities,
              // Add earnings data
              earnings: quoteSummary.earnings ? {
                maxAge: quoteSummary.earnings.maxAge,
                earningsDate: quoteSummary.earnings.earningsDate,
                earningsAverage: quoteSummary.earnings.earningsAverage,
                earningsLow: quoteSummary.earnings.earningsLow,
                earningsHigh: quoteSummary.earnings.earningsHigh,
                earningsChart: {
                  quarterly: quoteSummary.earnings.earningsChart.quarterly.map((q: { date: number; actual: number; estimate: number }) => ({
                    date: q.date,
                    actual: q.actual,
                    estimate: q.estimate
                  })),
                  currentQuarterEstimate: quoteSummary.earnings.earningsChart.currentQuarterEstimate,
                  currentQuarterEstimateDate: quoteSummary.earnings.earningsChart.currentQuarterEstimateDate,
                  currentQuarterEstimateYear: quoteSummary.earnings.earningsChart.currentQuarterEstimateYear,
                  earningsDate: quoteSummary.earnings.earningsChart.earningsDate,
                  isEarningsDateEstimate: quoteSummary.earnings.earningsChart.isEarningsDateEstimate
                },
                financialsChart: {
                  yearly: quoteSummary.earnings.financialsChart.yearly.map((y: { date: number; revenue: number; earnings: number }) => ({
                    date: y.date,
                    revenue: y.revenue,
                    earnings: y.earnings
                  })),
                  quarterly: quoteSummary.earnings.financialsChart.quarterly.map((q: { date: number; revenue: number; earnings: number }) => ({
                    date: q.date,
                    revenue: q.revenue,
                    earnings: q.earnings
                  }))
                },
                financialCurrency: quoteSummary.earnings.financialCurrency
              } : null,
              last_fetched: new Date().toISOString()
            })
            .eq('id', ps.security.id)
            .select()
            .single();

          if (updateError) {
            console.error('Error updating security:', {
              securityId: ps.security.id,
              ticker: ps.security.ticker,
              error: updateError
            });
            throw new Error(`Failed to update security ${ps.security.ticker}: ${updateError.message}`);
          }

          if (!updatedSecurity) {
            console.warn('No security data returned after update:', {
              securityId: ps.security.id,
              ticker: ps.security.ticker
            });
            return ps; // Return original security if update didn't return data
          }

          return {
            ...ps,
            security: updatedSecurity
          };
        })
      );

      return updatedSecurities;
    } catch (error) {
      console.error('Error updating portfolio securities:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        details: error
      });
      throw error;
    }
  }
}; 