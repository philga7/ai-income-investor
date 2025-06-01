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
  ArrowDownRight
} from "lucide-react";
import { SecurityChart } from "@/components/securities/security-chart";
import { TechnicalIndicators } from "@/components/securities/technical-indicators";
import { DividendHistory } from "@/components/securities/dividend-history";
import { useState, useEffect } from "react";
import { dividendService } from "@/services/dividendService";
import { supabase } from "@/lib/supabase";
import { BreadcrumbNav } from '@/components/ui/breadcrumb';

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
  dividendGrowth5yr: number;
  payoutRatio: number;
  sma200: string;
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
        // Fetch security data from the database
        const { data: securityData, error } = await supabase
          .from('securities')
          .select('*')
          .eq('ticker', ticker)
          .single();

        if (error) {
          console.error('Error fetching security data:', error);
          return;
        }

        if (!securityData) {
          console.error('Security not found');
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
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'Securities', href: '/securities' },
        { label: ticker, href: `/securities/${ticker}` }
      ]} />

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{security.ticker}</h1>
            <Badge variant="outline">{security.sector}</Badge>
          </div>
          <p className="text-xl text-muted-foreground">
            {security.name}
          </p>
        </div>
        
        <div className="flex flex-col items-end">
          <div className="text-3xl font-bold">${security.price?.toFixed(2) ?? 'N/A'}</div>
          <div className={`flex items-center ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {priceChange >= 0 ? (
              <ArrowUpRight className="mr-1 h-4 w-4" />
            ) : (
              <ArrowDownRight className="mr-1 h-4 w-4" />
            )}
            <span>
              {priceChange >= 0 ? '+' : ''}{priceChange?.toFixed(2) ?? 'N/A'} ({priceChangePercent?.toFixed(2) ?? 'N/A'}%)
            </span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">Last updated: Today, 4:00 PM</div>
        </div>
      </div>
      
      <div className="flex justify-between gap-4 overflow-auto whitespace-nowrap rounded-lg border p-1">
        <Button 
          variant={tradingSignal === "buy" ? "default" : "outline"}
          className={tradingSignal === "buy" ? "bg-green-600 hover:bg-green-700" : ""}
        >
          <ArrowUpRight className="mr-2 h-4 w-4" />
          {tradingSignal === "buy" ? "Buy Signal" : "Hold"}
        </Button>
        
        <Button variant="outline">
          <Briefcase className="mr-2 h-4 w-4" />
          Add to Portfolio
        </Button>
        
        <Button variant="outline">
          <MessageSquare className="mr-2 h-4 w-4" />
          AI Analysis
        </Button>
        
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              Market Data
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Open</p>
              <p className="font-medium">${security.open?.toFixed(2) ?? 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Prev Close</p>
              <p className="font-medium">${security.prevClose?.toFixed(2) ?? 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Volume</p>
              <p className="font-medium">{security.volume?.toLocaleString() ?? 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Market Cap</p>
              <p className="font-medium">${(security.marketCap / 1000000000000)?.toFixed(2) ?? 'N/A'}T</p>
            </div>
            <div>
              <p className="text-muted-foreground">P/E Ratio</p>
              <p className="font-medium">{security.pe?.toFixed(1) ?? 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">EPS</p>
              <p className="font-medium">${security.eps?.toFixed(2) ?? 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <PieChart className="mr-2 h-4 w-4" />
              Dividend Info
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Annual Dividend</p>
              <p className="font-medium">${security.dividend?.toFixed(2) ?? 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Yield</p>
              <p className="font-medium">{security.yield?.toFixed(1) ?? 'N/A'}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payout Ratio</p>
              <p className="font-medium">{security.payoutRatio ?? 'N/A'}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">5yr Growth</p>
              <p className="font-medium">{security.dividendGrowth5yr?.toFixed(1) ?? 'N/A'}%</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Upcoming Dividends
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Ex-Dividend Date</p>
              <p className="font-medium">
                {nextDividend?.ex_date ? new Date(nextDividend.ex_date).toLocaleDateString() : 'Not available'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment Date</p>
              <p className="font-medium">
                {nextDividend?.payment_date ? new Date(nextDividend.payment_date).toLocaleDateString() : 'Not available'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment Schedule</p>
              <p className="font-medium">Quarterly</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="technical">Technical Analysis</TabsTrigger>
          <TabsTrigger value="dividend">Dividend History</TabsTrigger>
          <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Stock Chart</CardTitle>
              <CardDescription>
                6-month price history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecurityChart ticker={ticker} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="technical">
          <Card>
            <CardHeader>
              <CardTitle>Technical Indicators</CardTitle>
              <CardDescription>
                Technical analysis for {ticker}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TechnicalIndicators ticker={ticker} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="dividend">
          <Card>
            <CardHeader>
              <CardTitle>Dividend History</CardTitle>
              <CardDescription>
                Historical dividend payments for {ticker}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DividendHistory ticker={ticker} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ai-analysis">
          <Card>
            <CardHeader>
              <CardTitle>AI Analysis</CardTitle>
              <CardDescription>
                AI-powered insights for {ticker}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>AI analysis content will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 