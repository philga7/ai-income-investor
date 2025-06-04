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
import { useState, useEffect } from "react";
import { dividendService } from "@/services/dividendService";
import { supabase } from "@/lib/supabase";
import { BreadcrumbNav } from '@/components/ui/breadcrumb';
import { yahooFinanceClient } from '@/lib/financial/api/yahoo/client';
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
  exDividendDate: string;
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
          throw new Error('Failed to fetch security data');
        }
        const quoteSummary = await response.json();
        
        if (!quoteSummary) {
          console.error('No data returned from API for ticker:', ticker);
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
        const fiftyTwoWeekLow = quoteSummary.price?.fiftyTwoWeekLow || 0;
        const fiftyTwoWeekHigh = quoteSummary.price?.fiftyTwoWeekHigh || 0;
        const averageVolume = quoteSummary.price?.regularMarketAverageVolume || 0;
        const forwardPE = quoteSummary.summaryDetail?.forwardPE || 0;
        const priceToSalesTrailing12Months = quoteSummary.summaryDetail?.priceToSalesTrailing12Months || 0;
        const beta = quoteSummary.summaryDetail?.beta || 0;
        const fiftyDayAverage = quoteSummary.price?.fiftyDayAverage || 0;
        const twoHundredDayAverage = quoteSummary.price?.twoHundredDayAverage || 0;
        
        // Format date to ISO string with timezone for PostgreSQL TIMESTAMP WITH TIME ZONE
        const formatDate = (timestamp: number | undefined) => {
          if (!timestamp) return null;
          try {
            // First check if the timestamp is a valid number
            if (isNaN(timestamp)) {
              console.warn('Invalid timestamp:', timestamp);
              return null;
            }

            // Convert Unix timestamp to milliseconds
            const date = new Date(timestamp * 1000);
            
            // Check if the date is valid
            if (isNaN(date.getTime())) {
              console.warn('Invalid date from timestamp:', timestamp);
              return null;
            }

            // Format as UTC date string (YYYY-MM-DD)
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

        // Update or insert into database
        const { data: securityData, error } = await supabase
          .from('securities')
          .upsert({
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
            return_on_equity: quoteSummary.financialData?.returnOnEquity,
            profit_margins: quoteSummary.financialData?.profitMargins,
            operating_margins: quoteSummary.financialData?.operatingMargins,
            revenue_growth: quoteSummary.financialData?.revenueGrowth,
            earnings_growth: quoteSummary.financialData?.earningsGrowth,
            last_fetched: currentDate
          }, {
            onConflict: 'ticker',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (error) {
          console.error('Error updating security data:', error);
          toast.error('Failed to update security data');
          return;
        }

        setSecurity(securityData);

        if (securityData.id) {
          try {
            const dividend = await dividendService.getNextDividendDates(securityData.id);
            setNextDividend(dividend);
          } catch (error) {
            console.error('Error fetching dividend data:', error);
            setNextDividend(null);
          }
        }
      } catch (error) {
        console.error('Error loading security data:', error);
        toast.error('Failed to load security data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [ticker]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!security) {
    return <div>Security not found</div>;
  }

  // Calculate price change
  const priceChange = security.price - security.prevClose;
  const priceChangePercent = (priceChange / security.prevClose) * 100;
  
  // Calculate trading signal
  const tradingSignal = security.sma200 === "below" ? "buy" : "hold";
  
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
                      {security.exDividendDate ? new Date(security.exDividendDate).toLocaleDateString() : 'N/A'}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 