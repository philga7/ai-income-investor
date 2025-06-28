"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpRight, 
  MessageSquare, 
  BarChart3,
  PieChart, 
  Briefcase, 
  Calendar, 
  LineChart, 
  Download,
  ArrowDownRight,
  DollarSign
} from "lucide-react";
import { SecurityChart } from "@/components/securities/security-chart";
import { TechnicalIndicators } from "@/components/securities/technical-indicators";
import { DividendHistory } from "@/components/securities/dividend-history";
import { AnalystRecommendations } from "@/components/securities/analyst-recommendations";
import { SecurityDetailSkeleton } from "@/components/portfolios/SecurityDetailSkeleton";
import { useState, useEffect } from "react";
import { dividendService } from "@/services/dividendService";
import { supabase } from "@/lib/supabase";
import { BreadcrumbNav } from '@/components/ui/breadcrumb';
import { toast } from 'sonner';

interface Security {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  price: number;
  prevClose: number;
  open: number;
  volume: number;
  marketCap: number;
  pe: number;
  eps: number;
  dividend: number;
  yield: number;
  dividend_growth_5yr: number;
  payoutRatio: number;
  sma200: string;
  dayLow: number;
  dayHigh: number;
  fiftyTwoWeekLow: number;
  fiftyTwoWeekHigh: number;
  averageVolume: number;
  forwardPE: number;
  priceToSalesTrailing12Months: number;
  beta: number;
  fiftyDayAverage: number;
  twoHundredDayAverage: number;
  exDividendDate: number;
  calendarExDividendDate?: number;
  operating_cash_flow: number;
  free_cash_flow: number;
  cash_flow_growth: number;
  ebitda_margins: number;
  // Balance sheet fields
  total_assets: number;
  total_current_assets: number;
  total_liabilities: number;
  total_current_liabilities: number;
  total_stockholder_equity: number;
  cash: number;
  short_term_investments: number;
  net_receivables: number;
  inventory: number;
  other_current_assets: number;
  long_term_investments: number;
  property_plant_equipment: number;
  other_assets: number;
  intangible_assets: number;
  goodwill: number;
  accounts_payable: number;
  short_long_term_debt: number;
  other_current_liabilities: number;
  long_term_debt: number;
  other_liabilities: number;
  minority_interest: number;
  treasury_stock: number;
  retained_earnings: number;
  common_stock: number;
  capital_surplus: number;
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

interface SecurityDetailClientProps {
  ticker: string;
}

export function SecurityDetailClient({ ticker }: SecurityDetailClientProps) {
  const [security, setSecurity] = useState<Security | null>(null);
  const [nextDividend, setNextDividend] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast.error('Please sign in to view security details');
          return;
        }

        // First fetch from our API endpoint
        const response = await fetch(`/api/securities/${ticker}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API response error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          throw new Error(errorData.error || `Failed to fetch security data: ${response.statusText}`);
        }
        
        const quoteSummary = await response.json();
        
        if (!quoteSummary) {
          console.error('No data returned from API for ticker:', ticker);
          toast.error('No data available for this security');
          return;
        }

        // Extract relevant data from quote summary
        const price = quoteSummary.price?.regularMarketPrice || 0;
        const prevClose = quoteSummary.price?.regularMarketPreviousClose || 0;
        const open = quoteSummary.price?.regularMarketOpen || 0;
        const volume = quoteSummary.price?.regularMarketVolume || 0;
        const marketCap = quoteSummary.price?.marketCap || 0;
        const pe = quoteSummary.summaryDetail?.trailingPE || 0;
        const eps = quoteSummary.summaryDetail?.trailingPE || 0;
        const dividend = quoteSummary.summaryDetail?.dividendRate || 0;
        const dividendYield = (quoteSummary.summaryDetail?.dividendYield || 0) * 100;
        const dividend_growth_5yr = quoteSummary.summaryDetail?.fiveYearAvgDividendYield || 0;
        const payoutRatio = quoteSummary.summaryDetail?.payoutRatio || 0;
        const sma200 = price > (quoteSummary.summaryDetail?.twoHundredDayAverage || 0) ? 'above' : 'below';
        const dayLow = quoteSummary.price?.regularMarketDayLow || 0;
        const dayHigh = quoteSummary.price?.regularMarketDayHigh || 0;
        const fiftyTwoWeekLow = quoteSummary.summaryDetail?.fiftyTwoWeekLow || 0;
        const fiftyTwoWeekHigh = quoteSummary.summaryDetail?.fiftyTwoWeekHigh || 0;
        const averageVolume = quoteSummary.summaryDetail?.averageVolume || 0;
        const forwardPE = quoteSummary.summaryDetail?.forwardPE || 0;
        const priceToSalesTrailing12Months = quoteSummary.summaryDetail?.priceToSalesTrailing12Months || 0;
        const beta = quoteSummary.summaryDetail?.beta || 0;
        const fiftyDayAverage = quoteSummary.summaryDetail?.fiftyDayAverage || 0;
        const twoHundredDayAverage = quoteSummary.summaryDetail?.twoHundredDayAverage || 0;

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

        const exDividendDate = formatDate(quoteSummary.summaryDetail?.exDividendDate);
        const currentDate = new Date().toISOString().split('T')[0];

        // Prepare the data for upsert
        const securityData = {
          ticker,
          name: quoteSummary.price?.longName || quoteSummary.price?.shortName || ticker,
          sector: quoteSummary.assetProfile?.sector || 'Unknown',
          industry: quoteSummary.assetProfile?.industry || 'Unknown',
          price,
          prev_close: prevClose,
          open,
          volume,
          market_cap: marketCap,
          pe,
          eps,
          dividend,
          yield: dividendYield,
          dividend_growth_5yr,
          payout_ratio: payoutRatio,
          sma200,
          day_low: dayLow,
          day_high: dayHigh,
          fifty_two_week_low: fiftyTwoWeekLow,
          fifty_two_week_high: fiftyTwoWeekHigh,
          average_volume: averageVolume,
          forward_pe: forwardPE,
          price_to_sales_trailing_12_months: priceToSalesTrailing12Months,
          beta,
          fifty_day_average: fiftyDayAverage,
          two_hundred_day_average: twoHundredDayAverage,
          ex_dividend_date: exDividendDate,
          // Add financial data fields
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
          // Add balance sheet fields
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
          last_fetched: currentDate
        };

        if (process.env.NODE_ENV === 'development') {
          console.log('Attempting to upsert security data:', {
            ticker,
            dataKeys: Object.keys(securityData)
          });
        }

        // Update or insert into database
        const { data: dbSecurityData, error: upsertError } = await supabase
          .from('securities')
          .upsert(securityData, {
            onConflict: 'ticker',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (upsertError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error updating security data:', {
              error: upsertError,
              code: upsertError.code,
              message: upsertError.message,
              details: upsertError.details,
              hint: upsertError.hint
            });
          }
          throw new Error(`Failed to update security data: ${upsertError.message}`);
        }

        if (!dbSecurityData) {
          console.error('No security data returned after upsert');
          toast.error('Failed to save security data');
          return;
        }

        // Transform the data to match our Security interface
        const transformedSecurity: Security = {
          id: dbSecurityData.id,
          ticker: dbSecurityData.ticker,
          name: dbSecurityData.name,
          sector: dbSecurityData.sector,
          industry: dbSecurityData.industry,
          price: dbSecurityData.price,
          prevClose: dbSecurityData.prev_close,
          open: dbSecurityData.open,
          volume: dbSecurityData.volume,
          marketCap: dbSecurityData.market_cap,
          pe: dbSecurityData.pe,
          eps: dbSecurityData.eps,
          dividend: dbSecurityData.dividend,
          yield: dbSecurityData.yield,
          dividend_growth_5yr: dbSecurityData.dividend_growth_5yr,
          payoutRatio: dbSecurityData.payout_ratio,
          sma200: dbSecurityData.sma200,
          dayLow: dbSecurityData.day_low,
          dayHigh: dbSecurityData.day_high,
          fiftyTwoWeekLow: dbSecurityData.fifty_two_week_low,
          fiftyTwoWeekHigh: dbSecurityData.fifty_two_week_high,
          averageVolume: dbSecurityData.average_volume,
          forwardPE: dbSecurityData.forward_pe,
          priceToSalesTrailing12Months: dbSecurityData.price_to_sales_trailing_12_months,
          beta: dbSecurityData.beta,
          fiftyDayAverage: dbSecurityData.fifty_day_average,
          twoHundredDayAverage: dbSecurityData.two_hundred_day_average,
          exDividendDate: dbSecurityData.ex_dividend_date,
          calendarExDividendDate: dbSecurityData.calendarExDividendDate,
          operating_cash_flow: dbSecurityData.operating_cash_flow,
          free_cash_flow: dbSecurityData.free_cash_flow,
          cash_flow_growth: dbSecurityData.cash_flow_growth,
          ebitda_margins: dbSecurityData.ebitda_margins,
          // Add balance sheet fields
          total_assets: dbSecurityData.total_assets,
          total_current_assets: dbSecurityData.total_current_assets,
          total_liabilities: dbSecurityData.total_liabilities,
          total_current_liabilities: dbSecurityData.total_current_liabilities,
          total_stockholder_equity: dbSecurityData.total_stockholder_equity,
          cash: dbSecurityData.cash,
          short_term_investments: dbSecurityData.short_term_investments,
          net_receivables: dbSecurityData.net_receivables,
          inventory: dbSecurityData.inventory,
          other_current_assets: dbSecurityData.other_current_assets,
          long_term_investments: dbSecurityData.long_term_investments,
          property_plant_equipment: dbSecurityData.property_plant_equipment,
          other_assets: dbSecurityData.other_assets,
          intangible_assets: dbSecurityData.intangible_assets,
          goodwill: dbSecurityData.goodwill,
          accounts_payable: dbSecurityData.accounts_payable,
          short_long_term_debt: dbSecurityData.short_long_term_debt,
          other_current_liabilities: dbSecurityData.other_current_liabilities,
          long_term_debt: dbSecurityData.long_term_debt,
          other_liabilities: dbSecurityData.other_liabilities,
          minority_interest: dbSecurityData.minority_interest,
          treasury_stock: dbSecurityData.treasury_stock,
          retained_earnings: dbSecurityData.retained_earnings,
          common_stock: dbSecurityData.common_stock,
          capital_surplus: dbSecurityData.capital_surplus,
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
          } : undefined
        };

        setSecurity(transformedSecurity);

        if (dbSecurityData.id) {
          // Fetch next dividend if available
          try {
            const nextDividendData = await dividendService.getNextDividendDates(dbSecurityData.id);
            setNextDividend(nextDividendData);
          } catch (error) {
            console.error('Error fetching next dividend:', error);
            // Don't throw here, as this is not critical
          }
        }
      } catch (error) {
        console.error('Error in loadData:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load security data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [ticker]);

  if (loading) {
    return <SecurityDetailSkeleton />;
  }

  if (!security) {
    return <div>Security not found</div>;
  }

  // Calculate price change
  const priceChange = security.price - security.prevClose;
  const priceChangePercent = (priceChange / security.prevClose) * 100;
  
  // Calculate trading signal
  const tradingSignal = security.sma200 === "below" ? "buy" : "hold";
  
  function formatCurrency(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  }

  function formatPercentage(value: number | null | undefined): string {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  }

  return (
    <div className="container mx-auto p-4">
      <BreadcrumbNav items={[
        { label: 'Securities', href: '/securities' },
        { label: ticker, href: `/securities/${ticker}` }
      ]} />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${security.price?.toFixed(2) || '0.00'}</div>
            <p className={`text-xs ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange?.toFixed(2) || '0.00'} ({priceChangePercent?.toFixed(2) || '0.00'}%)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dividend Yield</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{security.yield?.toFixed(2) || '0.00'}%</div>
            <p className="text-xs text-muted-foreground">
              5yr Avg: {security.dividend_growth_5yr?.toFixed(2) || '0.00'}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payout Ratio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{((security.payoutRatio || 0) * 100).toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">
              {(security.payoutRatio || 0) < 0.6 ? 'Sustainable' : 'High'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">200 SMA</CardTitle>
            <LineChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={security.sma200 === 'above' ? 'default' : 'destructive'}>
                {(security.sma200 || 'unknown').toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {security.sma200 === 'above' ? 'Bullish' : 'Bearish'} Trend
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
          <TabsTrigger value="dividends">Dividends</TabsTrigger>
          <TabsTrigger value="summary">Summary Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Price History</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <SecurityChart ticker={ticker} />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Technical Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <TechnicalIndicators ticker={ticker} />
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Analyst Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <AnalystRecommendations symbol={ticker} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technical Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <TechnicalIndicators ticker={ticker} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dividends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dividend History</CardTitle>
            </CardHeader>
            <CardContent>
              <DividendHistory ticker={ticker} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Market Data</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Open</dt>
                    <dd className="text-sm font-medium">${security.open?.toFixed(2) || '0.00'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Day Range</dt>
                    <dd className="text-sm font-medium">${security.dayLow?.toFixed(2) || '0.00'} - ${security.dayHigh?.toFixed(2) || '0.00'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">52 Week Range</dt>
                    <dd className="text-sm font-medium">${security.fiftyTwoWeekLow?.toFixed(2) || '0.00'} - ${security.fiftyTwoWeekHigh?.toFixed(2) || '0.00'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Volume</dt>
                    <dd className="text-sm font-medium">{(security.volume || 0).toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Avg Volume</dt>
                    <dd className="text-sm font-medium">{(security.averageVolume || 0).toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Market Cap</dt>
                    <dd className="text-sm font-medium">${((security.marketCap || 0) / 1e9).toFixed(2)}B</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Valuation</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">P/E Ratio</dt>
                    <dd className="text-sm font-medium">{security.pe?.toFixed(2) || '0.00'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Forward P/E</dt>
                    <dd className="text-sm font-medium">{security.forwardPE?.toFixed(2) || '0.00'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">P/S Ratio</dt>
                    <dd className="text-sm font-medium">{security.priceToSalesTrailing12Months?.toFixed(2) || '0.00'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Beta</dt>
                    <dd className="text-sm font-medium">{security.beta?.toFixed(2) || '0.00'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">50 Day Avg</dt>
                    <dd className="text-sm font-medium">${security.fiftyDayAverage?.toFixed(2) || '0.00'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">200 Day Avg</dt>
                    <dd className="text-sm font-medium">${security.twoHundredDayAverage?.toFixed(2) || '0.00'}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dividend Info</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Dividend Rate</dt>
                    <dd className="text-sm font-medium">${security.dividend?.toFixed(2) || '0.00'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Dividend Yield</dt>
                    <dd className="text-sm font-medium">{security.yield?.toFixed(2) || '0.00'}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Payout Ratio</dt>
                    <dd className="text-sm font-medium">{((security.payoutRatio || 0) * 100).toFixed(2)}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">5yr Avg Yield</dt>
                    <dd className="text-sm font-medium">{security.dividend_growth_5yr?.toFixed(2) || '0.00'}%</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-muted-foreground">Ex-Dividend Date</dt>
                    <dd className="text-sm font-medium">
                      {(() => {
                        const ms = security.exDividendDate;
                        const sec = security.calendarExDividendDate;
                        if (ms && typeof ms === 'number' && ms > 0) {
                          const d = new Date(ms);
                          if (!isNaN(d.getTime())) return d.toLocaleDateString();
                        }
                        if (sec && typeof sec === 'number' && sec > 0) {
                          const d = new Date(sec * 1000);
                          if (!isNaN(d.getTime())) return d.toLocaleDateString();
                        }
                        return 'N/A';
                      })()}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Operating Cash Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(security.operating_cash_flow)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Free Cash Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(security.free_cash_flow)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cash Flow Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(security.cash_flow_growth)}
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Balance Sheet Data */}
          <div>
            <h4 className="font-medium mb-2">Balance Sheet</h4>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-600 mb-2">Assets</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total Assets</span>
                      <span className="text-sm font-medium">${formatCurrency(security.total_assets)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total Current Assets</span>
                      <span className="text-sm font-medium">${formatCurrency(security.total_current_assets)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Cash</span>
                      <span className="text-sm font-medium">${formatCurrency(security.cash)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Short Term Investments</span>
                      <span className="text-sm font-medium">${formatCurrency(security.short_term_investments)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Net Receivables</span>
                      <span className="text-sm font-medium">${formatCurrency(security.net_receivables)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Inventory</span>
                      <span className="text-sm font-medium">${formatCurrency(security.inventory)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-600 mb-2">Liabilities & Equity</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total Liabilities</span>
                      <span className="text-sm font-medium">${formatCurrency(security.total_liabilities)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total Current Liabilities</span>
                      <span className="text-sm font-medium">${formatCurrency(security.total_current_liabilities)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Total Stockholder Equity</span>
                      <span className="text-sm font-medium">${formatCurrency(security.total_stockholder_equity)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Long Term Debt</span>
                      <span className="text-sm font-medium">${formatCurrency(security.long_term_debt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Retained Earnings</span>
                      <span className="text-sm font-medium">${formatCurrency(security.retained_earnings)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Common Stock</span>
                      <span className="text-sm font-medium">${formatCurrency(security.common_stock)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Earnings Section */}
      <div className="bg-card shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Earnings</h2>
        
        {/* Next Earnings */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Next Earnings</h3>
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-muted-foreground">
                  {security.earnings?.earningsChart?.currentQuarterEstimateDate} {security.earnings?.earningsChart?.currentQuarterEstimateYear}
                </p>
                <p className="text-sm text-muted-foreground">Estimate: ${security.earnings?.earningsChart?.currentQuarterEstimate.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Range</p>
                <p className="font-medium">
                  ${security.earnings?.earningsLow.toFixed(2)} - ${security.earnings?.earningsHigh.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quarterly Financials */}
          <div>
            <h3 className="text-lg font-medium mb-3">Quarterly Financials</h3>
            <div className="space-y-4">
              {security.earnings?.financialsChart?.quarterly.slice(0, 4).map((quarter: { date: number; revenue: number; earnings: number }, index: number) => (
                <div key={index} className="border-b pb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {(() => {
                        const d = quarter.date;
                        if (!d || d === 0) return 'N/A';
                        if (typeof d === 'string' && /^\d{4}$/.test(d)) return d; // string year
                        if (typeof d === 'number' && d >= 1900 && d <= 2100) return d; // number year
                        if (typeof d === 'number') {
                          const date = d.toString().length === 10 ? new Date(d * 1000) : new Date(d);
                          if (!isNaN(date.getTime())) return date.toLocaleDateString();
                        }
                        return 'N/A';
                      })()}
                    </span>
                    <span className="font-medium">
                      ${quarter.earnings.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Revenue: ${quarter.revenue.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Annual Financials */}
          <div>
            <h3 className="text-lg font-medium mb-3">Annual Financials</h3>
            <div className="space-y-4">
              {security.earnings?.financialsChart?.yearly.slice(0, 4).map((year: { date: number; revenue: number; earnings: number }, index: number) => (
                <div key={index} className="border-b pb-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      {(() => {
                        const d = year.date;
                        if (!d || d === 0) return 'N/A';
                        if (typeof d === 'string' && /^\d{4}$/.test(d)) return d; // string year
                        if (typeof d === 'number' && d >= 1900 && d <= 2100) return d; // number year
                        if (typeof d === 'number') {
                          const date = d.toString().length === 10 ? new Date(d * 1000) : new Date(d);
                          if (!isNaN(date.getTime())) return date.getFullYear();
                        }
                        return 'N/A';
                      })()}
                    </span>
                    <span className="font-medium">
                      ${year.earnings.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Revenue: ${year.revenue.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Historical Earnings */}
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Historical Earnings</h3>
          <div className="space-y-4">
            {security.earnings?.earningsChart?.quarterly.slice(0, 4).map((earning: { date: number; actual: number; estimate: number }, index: number) => (
              <div key={index} className="border-b pb-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">
                    {(() => {
                      const d = earning.date;
                      if (!d || d === 0) return 'N/A';
                      if (typeof d === 'string' && /^\d{4}$/.test(d)) return d; // string year
                      if (typeof d === 'number' && d >= 1900 && d <= 2100) return d; // number year
                      if (typeof d === 'number') {
                        const date = d.toString().length === 10 ? new Date(d * 1000) : new Date(d);
                        if (!isNaN(date.getTime())) return date.toLocaleDateString();
                      }
                      return 'N/A';
                    })()}
                  </span>
                  <span className={`font-medium ${earning.actual >= earning.estimate ? 'text-green-600' : 'text-red-600'}`}>
                    ${earning.actual.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Estimate: ${earning.estimate.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 