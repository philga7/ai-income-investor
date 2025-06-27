import { supabase } from '@/lib/supabase';
import { Security } from './portfolioService';
import { QuoteSummary, SearchResult } from '@/lib/financial/api/yahoo/types';
import { yahooFinanceClient } from '@/lib/financial/api/yahoo/client';

export type { Security };

export const securityService = {
  async getSecurityData(ticker: string): Promise<Security | null> {
    try {
      console.log(`Fetching security data for ticker: ${ticker}`);
      
      // Use Yahoo Finance client directly instead of API route to avoid circular dependency
      const quoteSummary = await yahooFinanceClient.getQuoteSummary(ticker);
      
      if (!quoteSummary) {
        console.warn(`No quote summary returned for ticker: ${ticker}`);
        return null;
      }

      console.log(`Successfully fetched quote summary for ${ticker}:`, {
        hasPrice: !!quoteSummary.price,
        hasAssetProfile: !!quoteSummary.assetProfile,
        hasFinancialData: !!quoteSummary.financialData,
        hasBalanceSheet: !!quoteSummary.balanceSheetHistory,
        hasCashflow: !!quoteSummary.cashflowStatementHistory,
        balanceSheetStatements: quoteSummary.balanceSheetHistory?.balanceSheetStatements?.length || 0,
        financialDataKeys: quoteSummary.financialData ? Object.keys(quoteSummary.financialData) : []
      });

      // Log specific data availability for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(`${ticker} Data Availability:`, {
          price: !!quoteSummary.price?.regularMarketPrice,
          financialData: !!quoteSummary.financialData,
          balanceSheet: !!quoteSummary.balanceSheetHistory?.balanceSheetStatements?.[0],
          cashflow: !!quoteSummary.cashflowStatementHistory?.cashflowStatements?.[0],
          earnings: !!quoteSummary.earnings
        });
      }

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
      const formatDate = (timestamp: number | Date | undefined) => {
        if (!timestamp) return null;
        try {
          let date: Date;
          
          if (timestamp instanceof Date) {
            date = timestamp;
          } else if (typeof timestamp === 'number') {
            // Check if it's already in milliseconds (13 digits) or seconds (10 digits)
            if (timestamp.toString().length === 10) {
              date = new Date(timestamp * 1000);
            } else {
              date = new Date(timestamp);
            }
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Invalid timestamp type:', typeof timestamp, timestamp);
            }
            return null;
          }
          
          if (isNaN(date.getTime())) {
            if (process.env.NODE_ENV === 'development') {
              console.warn('Invalid date from timestamp:', timestamp);
            }
            return null;
          }

          // Format as YYYY-MM-DD for database storage
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          
          return `${year}-${month}-${day}`;
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error formatting date:', error);
          }
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
        address1: quoteSummary.assetProfile?.address1,
        city: quoteSummary.assetProfile?.city,
        state: quoteSummary.assetProfile?.state,
        zip: quoteSummary.assetProfile?.zip,
        country: quoteSummary.assetProfile?.country,
        phone: quoteSummary.assetProfile?.phone,
        website: quoteSummary.assetProfile?.website,
        industry_key: quoteSummary.assetProfile?.industryKey,
        industry_disp: quoteSummary.assetProfile?.industryDisp,
        sector_key: quoteSummary.assetProfile?.sectorKey,
        sector_disp: quoteSummary.assetProfile?.sectorDisp,
        long_business_summary: quoteSummary.assetProfile?.longBusinessSummary,
        full_time_employees: quoteSummary.assetProfile?.fullTimeEmployees,
        audit_risk: quoteSummary.assetProfile?.auditRisk,
        board_risk: quoteSummary.assetProfile?.boardRisk,
        compensation_risk: quoteSummary.assetProfile?.compensationRisk,
        shareholder_rights_risk: quoteSummary.assetProfile?.shareHolderRightsRisk,
        overall_risk: quoteSummary.assetProfile?.overallRisk,
        governance_epoch_date: formatDate(quoteSummary.assetProfile?.governanceEpochDate) || undefined,
        compensation_as_of_epoch_date: formatDate(quoteSummary.assetProfile?.compensationAsOfEpochDate) || undefined,
        ir_website: quoteSummary.assetProfile?.irWebsite,
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
        ex_dividend_date: ex_dividend_date || undefined,
        operating_cash_flow: quoteSummary.financialData?.operatingCashflow || 0,
        free_cash_flow: quoteSummary.financialData?.freeCashflow || 0,
        cash_flow_growth: quoteSummary.cashflowStatementHistory?.cashflowStatements[0]?.totalCashFromOperatingActivities || 0,
        target_low_price: quoteSummary.financialData?.targetLowPrice,
        target_high_price: quoteSummary.financialData?.targetHighPrice,
        recommendation_key: quoteSummary.financialData?.recommendationKey,
        number_of_analyst_opinions: quoteSummary.financialData?.numberOfAnalystOpinions,
        total_cash: quoteSummary.financialData?.totalCash,
        total_debt: quoteSummary.financialData?.totalDebt,
        current_ratio: quoteSummary.financialData?.currentRatio,
        quick_ratio: quoteSummary.financialData?.quickRatio,
        debt_to_equity: quoteSummary.financialData?.debtToEquity,
        revenue_per_share: quoteSummary.financialData?.revenuePerShare,
        return_on_assets: quoteSummary.financialData?.returnOnAssets,
        return_on_equity: quoteSummary.financialData?.returnOnEquity,
        gross_profits: quoteSummary.financialData?.grossProfits,
        earnings_growth: quoteSummary.financialData?.earningsGrowth,
        revenue_growth: quoteSummary.financialData?.revenueGrowth,
        gross_margins: quoteSummary.financialData?.grossMargins,
        ebitda_margins: quoteSummary.financialData?.ebitdaMargins,
        operating_margins: quoteSummary.financialData?.operatingMargins,
        profit_margins: quoteSummary.financialData?.profitMargins,
        total_assets: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.totalAssets || undefined,
        total_current_assets: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.totalCurrentAssets || undefined,
        total_liabilities: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.totalLiab || undefined,
        total_current_liabilities: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.totalCurrentLiabilities || undefined,
        total_stockholder_equity: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.totalStockholderEquity || undefined,
        cash: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.cash || undefined,
        short_term_investments: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.shortTermInvestments || undefined,
        net_receivables: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.netReceivables || undefined,
        inventory: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.inventory || undefined,
        other_current_assets: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.otherCurrentAssets || undefined,
        long_term_investments: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.longTermInvestments || undefined,
        property_plant_equipment: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.propertyPlantEquipment || undefined,
        other_assets: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.otherAssets || undefined,
        intangible_assets: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.intangibleAssets || undefined,
        goodwill: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.goodwill || undefined,
        accounts_payable: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.accountsPayable || undefined,
        short_long_term_debt: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.shortLongTermDebt || undefined,
        other_current_liabilities: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.otherCurrentLiab || undefined,
        long_term_debt: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.longTermDebt || undefined,
        other_liabilities: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.otherLiab || undefined,
        minority_interest: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.minorityInterest || undefined,
        treasury_stock: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.treasuryStock || undefined,
        retained_earnings: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.retainedEarnings || undefined,
        common_stock: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.commonStock || undefined,
        capital_surplus: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.capitalSurplus || undefined,
        earnings: quoteSummary.earnings ? {
          maxAge: quoteSummary.earnings.maxAge,
          earningsDate: quoteSummary.earnings.earningsDate,
          earningsAverage: quoteSummary.earnings.earningsAverage,
          earningsLow: quoteSummary.earnings.earningsLow,
          earningsHigh: quoteSummary.earnings.earningsHigh,
          earningsChart: {
            quarterly: quoteSummary.earnings.earningsChart.quarterly.map((q: any) => ({
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
            yearly: quoteSummary.earnings.financialsChart.yearly.map((y: any) => ({
              date: y.date,
              revenue: y.revenue,
              earnings: y.earnings
            })),
            quarterly: quoteSummary.earnings.financialsChart.quarterly.map((q: any) => ({
              date: q.date,
              revenue: q.revenue,
              earnings: q.earnings
            }))
          },
          financialCurrency: quoteSummary.earnings.financialCurrency
        } : undefined,
        last_fetched: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error fetching security data for ${ticker}:`, error);
      if (error instanceof Error) {
        console.error(`Error message: ${error.message}`);
        console.error(`Error stack: ${error.stack}`);
      }
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
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching security:', securityError);
        }
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
          earnings: updatedData.earnings,
          last_fetched: new Date().toISOString()
        })
        .eq('id', securityId)
        .select()
        .single();

      if (updateError) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error updating security:', updateError);
        }
        return null;
      }

      return updatedSecurity;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating security data:', error);
      }
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
        if (process.env.NODE_ENV === 'development') {
          console.error('Error searching securities:', error);
        }
        return [];
      }

      return securities.map(security => ({
        ...security,
        price: Number(security.price),
        yield: Number(security.yield)
      }));
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in searchSecurities:', error);
      }
      return [];
    }
  },

  async searchYahooFinance(query: string): Promise<SearchResult[]> {
    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      // Fetch data from our API endpoint
      const response = await fetch(`/api/securities/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to search securities');
      }

      const results = await response.json() as SearchResult[];
      return results || [];
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error searching securities:', error);
      }
      return [];
    }
  }
}; 