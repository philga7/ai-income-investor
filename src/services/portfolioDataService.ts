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
  target_low_price?: number;
  target_high_price?: number;
  recommendation_key?: string;
  number_of_analyst_opinions?: number;
  total_cash?: number;
  total_debt?: number;
  current_ratio?: number;
  quick_ratio?: number;
  debt_to_equity?: number;
  revenue_per_share?: number;
  return_on_assets?: number;
  return_on_equity?: number;
  gross_profits?: number;
  earnings_growth?: number;
  revenue_growth?: number;
  gross_margins?: number;
  ebitda_margins?: number;
  operating_margins?: number;
  profit_margins?: number;
  // Balance sheet fields
  total_assets?: number;
  total_current_assets?: number;
  total_liabilities?: number;
  total_current_liabilities?: number;
  total_stockholder_equity?: number;
  cash?: number;
  short_term_investments?: number;
  net_receivables?: number;
  inventory?: number;
  other_current_assets?: number;
  long_term_investments?: number;
  property_plant_equipment?: number;
  other_assets?: number;
  intangible_assets?: number;
  goodwill?: number;
  accounts_payable?: number;
  short_long_term_debt?: number;
  other_current_liabilities?: number;
  long_term_debt?: number;
  other_liabilities?: number;
  minority_interest?: number;
  treasury_stock?: number;
  retained_earnings?: number;
  common_stock?: number;
  capital_surplus?: number;
  last_fetched?: string;
  // Earnings data
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
    operating_cash_flow?: number;
    free_cash_flow?: number;
    cash_flow_growth?: number;
    target_low_price?: number;
    target_high_price?: number;
    recommendation_key?: string;
    number_of_analyst_opinions?: number;
    total_cash?: number;
    total_debt?: number;
    current_ratio?: number;
    quick_ratio?: number;
    debt_to_equity?: number;
    revenue_per_share?: number;
    return_on_assets?: number;
    return_on_equity?: number;
    gross_profits?: number;
    earnings_growth?: number;
    revenue_growth?: number;
    gross_margins?: number;
    ebitda_margins?: number;
    operating_margins?: number;
    profit_margins?: number;
    total_assets?: number;
    total_current_assets?: number;
    total_liabilities?: number;
    total_current_liabilities?: number;
    total_stockholder_equity?: number;
    cash?: number;
    short_term_investments?: number;
    net_receivables?: number;
    inventory?: number;
    other_current_assets?: number;
    long_term_investments?: number;
    property_plant_equipment?: number;
    other_assets?: number;
    intangible_assets?: number;
    goodwill?: number;
    accounts_payable?: number;
    short_long_term_debt?: number;
    other_current_liabilities?: number;
    long_term_debt?: number;
    other_liabilities?: number;
    minority_interest?: number;
    treasury_stock?: number;
    retained_earnings?: number;
    common_stock?: number;
    capital_surplus?: number;
    last_fetched: string;
    earnings?: any;
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
                return date.toISOString();
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
            address1,
            city,
            state,
            zip,
            country,
            phone,
            website,
            industry_key,
            industry_disp,
            sector_key,
            sector_disp,
            long_business_summary,
            full_time_employees,
            audit_risk,
            board_risk,
            compensation_risk,
            shareholder_rights_risk,
            overall_risk,
            governance_epoch_date,
            compensation_as_of_epoch_date,
            ir_website,
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
            operating_cash_flow,
            free_cash_flow,
            cash_flow_growth,
            target_low_price,
            target_high_price,
            recommendation_key,
            number_of_analyst_opinions,
            total_cash,
            total_debt,
            current_ratio,
            quick_ratio,
            debt_to_equity,
            revenue_per_share,
            return_on_assets,
            return_on_equity,
            gross_profits,
            earnings_growth,
            revenue_growth,
            gross_margins,
            ebitda_margins,
            operating_margins,
            profit_margins,
            total_assets,
            total_current_assets,
            total_liabilities,
            total_current_liabilities,
            total_stockholder_equity,
            cash,
            short_term_investments,
            net_receivables,
            inventory,
            other_current_assets,
            long_term_investments,
            property_plant_equipment,
            other_assets,
            intangible_assets,
            goodwill,
            accounts_payable,
            short_long_term_debt,
            other_current_liabilities,
            long_term_debt,
            other_liabilities,
            minority_interest,
            treasury_stock,
            retained_earnings,
            common_stock,
            capital_surplus,
            last_fetched,
            earnings
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
      if (Array.isArray(portfolioSecurities) && portfolioSecurities.length === 0) {
        console.warn('No tickers found in portfolio securities');
        return [];
      }

      // Check if any securities need updating based on last_fetched timestamp
      const cacheTtl = 5 * 60 * 1000; // 5 minutes in milliseconds
      const now = new Date();
      const securitiesNeedingUpdate = (portfolioSecurities as unknown as SupabasePortfolioSecurity[]).filter(ps => {
        if (!ps.security.last_fetched) return true;
        const lastFetched = new Date(ps.security.last_fetched);
        const timeSinceLastFetch = now.getTime() - lastFetched.getTime();
        return timeSinceLastFetch > cacheTtl;
      });

      // If no securities need updating, return the current data
      if (securitiesNeedingUpdate.length === 0) {
        console.log('All securities are up to date, returning cached data');
        return (portfolioSecurities as unknown as SupabasePortfolioSecurity[]).map(ps => ({
          id: ps.id,
          shares: ps.shares,
          average_cost: ps.average_cost,
          security: {
            id: ps.security.id,
            ticker: ps.security.ticker,
            name: ps.security.name,
            sector: ps.security.sector,
            industry: ps.security.industry,
            address1: ps.security.address1,
            city: ps.security.city,
            state: ps.security.state,
            zip: ps.security.zip,
            country: ps.security.country,
            phone: ps.security.phone,
            website: ps.security.website,
            industry_key: ps.security.industry_key,
            industry_disp: ps.security.industry_disp,
            sector_key: ps.security.sector_key,
            sector_disp: ps.security.sector_disp,
            long_business_summary: ps.security.long_business_summary,
            full_time_employees: ps.security.full_time_employees,
            audit_risk: ps.security.audit_risk,
            board_risk: ps.security.board_risk,
            compensation_risk: ps.security.compensation_risk,
            shareholder_rights_risk: ps.security.shareholder_rights_risk,
            overall_risk: ps.security.overall_risk,
            governance_epoch_date: ps.security.governance_epoch_date,
            compensation_as_of_epoch_date: ps.security.compensation_as_of_epoch_date,
            ir_website: ps.security.ir_website,
            price: ps.security.price,
            prev_close: ps.security.prev_close,
            open: ps.security.open,
            volume: ps.security.volume,
            market_cap: ps.security.market_cap,
            pe: ps.security.pe,
            eps: ps.security.eps,
            dividend: ps.security.dividend,
            yield: ps.security.yield,
            dividend_growth_5yr: ps.security.dividend_growth_5yr,
            payout_ratio: ps.security.payout_ratio,
            sma200: ps.security.sma200 as 'above' | 'below',
            tags: ps.security.tags,
            day_low: ps.security.day_low,
            day_high: ps.security.day_high,
            fifty_two_week_low: ps.security.fifty_two_week_low,
            fifty_two_week_high: ps.security.fifty_two_week_high,
            average_volume: ps.security.average_volume,
            forward_pe: ps.security.forward_pe,
            price_to_sales_trailing_12_months: ps.security.price_to_sales_trailing_12_months,
            beta: ps.security.beta,
            fifty_day_average: ps.security.fifty_day_average,
            two_hundred_day_average: ps.security.two_hundred_day_average,
            ex_dividend_date: ps.security.ex_dividend_date,
            operating_cash_flow: ps.security.operating_cash_flow || 0,
            free_cash_flow: ps.security.free_cash_flow || 0,
            cash_flow_growth: ps.security.cash_flow_growth || 0,
            target_low_price: ps.security.target_low_price,
            target_high_price: ps.security.target_high_price,
            recommendation_key: ps.security.recommendation_key,
            number_of_analyst_opinions: ps.security.number_of_analyst_opinions,
            total_cash: ps.security.total_cash,
            total_debt: ps.security.total_debt,
            current_ratio: ps.security.current_ratio,
            quick_ratio: ps.security.quick_ratio,
            debt_to_equity: ps.security.debt_to_equity,
            revenue_per_share: ps.security.revenue_per_share,
            return_on_assets: ps.security.return_on_assets,
            return_on_equity: ps.security.return_on_equity,
            gross_profits: ps.security.gross_profits,
            earnings_growth: ps.security.earnings_growth,
            revenue_growth: ps.security.revenue_growth,
            gross_margins: ps.security.gross_margins,
            ebitda_margins: ps.security.ebitda_margins,
            operating_margins: ps.security.operating_margins,
            profit_margins: ps.security.profit_margins,
            total_assets: ps.security.total_assets,
            total_current_assets: ps.security.total_current_assets,
            total_liabilities: ps.security.total_liabilities,
            total_current_liabilities: ps.security.total_current_liabilities,
            total_stockholder_equity: ps.security.total_stockholder_equity,
            cash: ps.security.cash,
            short_term_investments: ps.security.short_term_investments,
            net_receivables: ps.security.net_receivables,
            inventory: ps.security.inventory,
            other_current_assets: ps.security.other_current_assets,
            long_term_investments: ps.security.long_term_investments,
            property_plant_equipment: ps.security.property_plant_equipment,
            other_assets: ps.security.other_assets,
            intangible_assets: ps.security.intangible_assets,
            goodwill: ps.security.goodwill,
            accounts_payable: ps.security.accounts_payable,
            short_long_term_debt: ps.security.short_long_term_debt,
            other_current_liabilities: ps.security.other_current_liabilities,
            long_term_debt: ps.security.long_term_debt,
            other_liabilities: ps.security.other_liabilities,
            minority_interest: ps.security.minority_interest,
            treasury_stock: ps.security.treasury_stock,
            retained_earnings: ps.security.retained_earnings,
            common_stock: ps.security.common_stock,
            capital_surplus: ps.security.capital_surplus,
            last_fetched: ps.security.last_fetched,
            earnings: ps.security.earnings,
          }
        }));
      }

      // Get tickers that need updating
      const tickersToUpdate = Array.from(new Set(securitiesNeedingUpdate.map(ps => ps.security.ticker)));
      console.log(`Updating ${tickersToUpdate.length} securities: ${tickersToUpdate.join(', ')}`);

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session found');
        throw new Error('Authentication required: No active session');
      }

      // Fetch data for securities that need updating
      const response = await fetch('/api/securities/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ tickers: tickersToUpdate })
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

      // Update only the securities that need updating
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
              yield: (summaryDetail?.dividendYield || 0) * 100,
              dividend_growth_5yr: summaryDetail?.fiveYearAvgDividendYield || 0,
              payout_ratio: summaryDetail?.payoutRatio || 0,
              sma200: (price?.regularMarketPrice || 0) > (summaryDetail?.twoHundredDayAverage || 0) ? 'above' : 'below',
              day_low: price?.regularMarketDayLow || 0,
              day_high: price?.regularMarketDayHigh || 0,
              fifty_two_week_low: summaryDetail?.fiftyTwoWeekLow || 0,
              fifty_two_week_high: summaryDetail?.fiftyTwoWeekHigh || 0,
              average_volume: summaryDetail?.averageVolume || 0,
              forward_pe: summaryDetail?.forwardPE || 0,
              price_to_sales_trailing_12_months: summaryDetail?.priceToSalesTrailing12Months || 0,
              beta: summaryDetail?.beta || 0,
              fifty_day_average: summaryDetail?.fiftyDayAverage || 0,
              two_hundred_day_average: summaryDetail?.twoHundredDayAverage || 0,
              ex_dividend_date: summaryDetail?.exDividendDate ? formatDate(summaryDetail.exDividendDate, 'ex_dividend_date') : null,
              target_low_price: financialData?.targetLowPrice || null,
              target_high_price: financialData?.targetHighPrice || null,
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
              // Add balance sheet data
              total_assets: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.totalAssets,
              total_current_assets: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.totalCurrentAssets,
              total_liabilities: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.totalLiab,
              total_current_liabilities: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.totalCurrentLiabilities,
              total_stockholder_equity: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.totalStockholderEquity,
              cash: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.cash,
              short_term_investments: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.shortTermInvestments,
              net_receivables: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.netReceivables,
              inventory: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.inventory,
              other_current_assets: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.otherCurrentAssets,
              long_term_investments: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.longTermInvestments,
              property_plant_equipment: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.propertyPlantEquipment,
              other_assets: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.otherAssets,
              intangible_assets: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.intangibleAssets,
              goodwill: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.goodwill,
              accounts_payable: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.accountsPayable,
              short_long_term_debt: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.shortLongTermDebt,
              other_current_liabilities: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.otherCurrentLiab,
              long_term_debt: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.longTermDebt,
              other_liabilities: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.otherLiab,
              minority_interest: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.minorityInterest,
              treasury_stock: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.treasuryStock,
              retained_earnings: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.retainedEarnings,
              common_stock: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.commonStock,
              capital_surplus: quoteSummary.balanceSheetHistory?.balanceSheetStatements[0]?.capitalSurplus,
              last_fetched: new Date().toISOString()
            })
            .eq('id', ps.security.id)
            .select()
            .single();

          if (updateError) {
            console.error(`Error updating security ${ps.security.ticker}:`, updateError);
            return ps;
          }

          // Return the updated security data
          return {
            id: ps.id,
            shares: ps.shares,
            average_cost: ps.average_cost,
            security: {
              id: updatedSecurity.id,
              ticker: updatedSecurity.ticker,
              name: updatedSecurity.name,
              sector: updatedSecurity.sector,
              industry: updatedSecurity.industry,
              address1: updatedSecurity.address1,
              city: updatedSecurity.city,
              state: updatedSecurity.state,
              zip: updatedSecurity.zip,
              country: updatedSecurity.country,
              phone: updatedSecurity.phone,
              website: updatedSecurity.website,
              industry_key: updatedSecurity.industry_key,
              industry_disp: updatedSecurity.industry_disp,
              sector_key: updatedSecurity.sector_key,
              sector_disp: updatedSecurity.sector_disp,
              long_business_summary: updatedSecurity.long_business_summary,
              full_time_employees: updatedSecurity.full_time_employees,
              audit_risk: updatedSecurity.audit_risk,
              board_risk: updatedSecurity.board_risk,
              compensation_risk: updatedSecurity.compensation_risk,
              shareholder_rights_risk: updatedSecurity.shareholder_rights_risk,
              overall_risk: updatedSecurity.overall_risk,
              governance_epoch_date: updatedSecurity.governance_epoch_date,
              compensation_as_of_epoch_date: updatedSecurity.compensation_as_of_epoch_date,
              ir_website: updatedSecurity.ir_website,
              price: updatedSecurity.price,
              prev_close: updatedSecurity.prev_close,
              open: updatedSecurity.open,
              volume: updatedSecurity.volume,
              market_cap: updatedSecurity.market_cap,
              pe: updatedSecurity.pe,
              eps: updatedSecurity.eps,
              dividend: updatedSecurity.dividend,
              yield: updatedSecurity.yield,
              dividend_growth_5yr: updatedSecurity.dividend_growth_5yr,
              payout_ratio: updatedSecurity.payout_ratio,
              sma200: updatedSecurity.sma200 as 'above' | 'below',
              tags: updatedSecurity.tags,
              day_low: updatedSecurity.day_low,
              day_high: updatedSecurity.day_high,
              fifty_two_week_low: updatedSecurity.fifty_two_week_low,
              fifty_two_week_high: updatedSecurity.fifty_two_week_high,
              average_volume: updatedSecurity.average_volume,
              forward_pe: updatedSecurity.forward_pe,
              price_to_sales_trailing_12_months: updatedSecurity.price_to_sales_trailing_12_months,
              beta: updatedSecurity.beta,
              fifty_day_average: updatedSecurity.fifty_day_average,
              two_hundred_day_average: updatedSecurity.two_hundred_day_average,
              ex_dividend_date: updatedSecurity.ex_dividend_date,
              operating_cash_flow: updatedSecurity.operating_cash_flow || 0,
              free_cash_flow: updatedSecurity.free_cash_flow || 0,
              cash_flow_growth: updatedSecurity.cash_flow_growth || 0,
              target_low_price: updatedSecurity.target_low_price,
              target_high_price: updatedSecurity.target_high_price,
              recommendation_key: updatedSecurity.recommendation_key,
              number_of_analyst_opinions: updatedSecurity.number_of_analyst_opinions,
              total_cash: updatedSecurity.total_cash,
              total_debt: updatedSecurity.total_debt,
              current_ratio: updatedSecurity.current_ratio,
              quick_ratio: updatedSecurity.quick_ratio,
              debt_to_equity: updatedSecurity.debt_to_equity,
              revenue_per_share: updatedSecurity.revenue_per_share,
              return_on_assets: updatedSecurity.return_on_assets,
              return_on_equity: updatedSecurity.return_on_equity,
              gross_profits: updatedSecurity.gross_profits,
              earnings_growth: updatedSecurity.earnings_growth,
              revenue_growth: updatedSecurity.revenue_growth,
              gross_margins: updatedSecurity.gross_margins,
              ebitda_margins: updatedSecurity.ebitda_margins,
              operating_margins: updatedSecurity.operating_margins,
              profit_margins: updatedSecurity.profit_margins,
              total_assets: updatedSecurity.total_assets,
              total_current_assets: updatedSecurity.total_current_assets,
              total_liabilities: updatedSecurity.total_liabilities,
              total_current_liabilities: updatedSecurity.total_current_liabilities,
              total_stockholder_equity: updatedSecurity.total_stockholder_equity,
              cash: updatedSecurity.cash,
              short_term_investments: updatedSecurity.short_term_investments,
              net_receivables: updatedSecurity.net_receivables,
              inventory: updatedSecurity.inventory,
              other_current_assets: updatedSecurity.other_current_assets,
              long_term_investments: updatedSecurity.long_term_investments,
              property_plant_equipment: updatedSecurity.property_plant_equipment,
              other_assets: updatedSecurity.other_assets,
              intangible_assets: updatedSecurity.intangible_assets,
              goodwill: updatedSecurity.goodwill,
              accounts_payable: updatedSecurity.accounts_payable,
              short_long_term_debt: updatedSecurity.short_long_term_debt,
              other_current_liabilities: updatedSecurity.other_current_liabilities,
              long_term_debt: updatedSecurity.long_term_debt,
              other_liabilities: updatedSecurity.other_liabilities,
              minority_interest: updatedSecurity.minority_interest,
              treasury_stock: updatedSecurity.treasury_stock,
              retained_earnings: updatedSecurity.retained_earnings,
              common_stock: updatedSecurity.common_stock,
              capital_surplus: updatedSecurity.capital_surplus,
              last_fetched: updatedSecurity.last_fetched,
              earnings: updatedSecurity.earnings,
            }
          };
        })
      );

      return updatedSecurities;
    } catch (error) {
      console.error('Error updating portfolio securities:', error);
      throw error;
    }
  }
}; 