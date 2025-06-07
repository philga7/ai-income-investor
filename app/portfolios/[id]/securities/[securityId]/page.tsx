'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpRight, ArrowDownRight, BarChart3, PieChart, Calendar, Briefcase, MessageSquare, Download } from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from '@/components/auth/protected-route';
import { supabase } from '@/lib/supabase';
import { SecurityChart } from '@/components/securities/security-chart';
import { TechnicalIndicators } from '@/components/securities/technical-indicators';
import { DividendHistory } from '@/components/securities/dividend-history';
import { AnalystRecommendations } from '@/components/securities/analyst-recommendations';
import { BreadcrumbNav } from '@/components/ui/breadcrumb';

interface SecurityDetailPageProps {
  params: Promise<{ id: string; securityId: string }>;
}

interface PortfolioSecurity {
  id: string;
  portfolio_id: string;
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
    sma200: "above" | "below";
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
  };
}

export default function SecurityDetailPage({ params }: SecurityDetailPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [portfolioId, setPortfolioId] = useState<string>('');
  const [securityId, setSecurityId] = useState<string>('');
  const [security, setSecurity] = useState<PortfolioSecurity | null>(null);

  useEffect(() => {
    const getParams = async () => {
      const { id, securityId } = await params;
      setPortfolioId(id);
      setSecurityId(securityId);
      
      // Fetch security data
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      try {
        const response = await fetch(`/api/portfolios/${id}/securities/${securityId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch security details');
        }

        const data = await response.json();
        setSecurity(data);
      } catch (error) {
        toast.error('Failed to load security details');
        console.error('Error fetching security:', error);
      } finally {
        setIsLoading(false);
      }
    };
    getParams();
  }, [params]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!security) {
    return <div>Security not found</div>;
  }

  const marketValue = security.shares * security.security.price;
  const costBasis = security.shares * security.average_cost;
  const gainLoss = marketValue - costBasis;
  const gainLossPercentage = (gainLoss / costBasis) * 100;

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <BreadcrumbNav items={[
          { label: 'Portfolios', href: '/portfolios' },
          { label: 'Portfolio Details', href: `/portfolios/${portfolioId}` },
          { label: security.security.ticker, href: `/portfolios/${portfolioId}/securities/${securityId}` }
        ]} />

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{security.security.ticker}</h1>
              <Badge variant="outline">{security.security.sector}</Badge>
            </div>
            <p className="text-xl text-muted-foreground">
              {security.security.name}
            </p>
          </div>
          
          <div className="flex flex-col items-end">
            <div className="text-3xl font-bold">${security.security.price.toFixed(2)}</div>
            <div className={`flex items-center ${gainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {gainLoss >= 0 ? (
                <ArrowUpRight className="mr-1 h-4 w-4" />
              ) : (
                <ArrowDownRight className="mr-1 h-4 w-4" />
              )}
              <span>
                ${gainLoss.toFixed(2)} ({gainLossPercentage.toFixed(2)}%)
              </span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">Last updated: Today, 4:00 PM</div>
          </div>
        </div>
        
        <div className="flex justify-between gap-4 overflow-auto whitespace-nowrap rounded-lg border p-1">
          <Button 
            variant={security.security.sma200 === "below" ? "default" : "outline"}
            className={security.security.sma200 === "below" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <ArrowUpRight className="mr-2 h-4 w-4" />
            {security.security.sma200 === "below" ? "Buy Signal" : "Hold"}
          </Button>
          
          <Button variant="outline" onClick={() => router.push(`/portfolios/${portfolioId}/securities/${securityId}/edit`)}>
            <Briefcase className="mr-2 h-4 w-4" />
            Edit Position
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
                Position Details
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Shares</p>
                <p className="font-medium">{security.shares.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg. Cost</p>
                <p className="font-medium">${security.average_cost.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Market Value</p>
                <p className="font-medium">${marketValue.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Cost Basis</p>
                <p className="font-medium">${costBasis.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Gain/Loss</p>
                <p className={`font-medium ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${gainLoss.toLocaleString()} ({gainLossPercentage.toFixed(2)}%)
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Current Price</p>
                <p className="font-medium">${security.security.price.toFixed(2)}</p>
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
                <p className="font-medium">${(security.security.price * security.security.yield / 100).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  Projected: ${(security.security.price * security.security.yield / 100 * (1 + security.security.dividend_growth_5yr / 100)).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Yield</p>
                <p className="font-medium">{security.security.yield.toFixed(2)}%</p>
                <p className="text-xs text-muted-foreground">
                  Projected: {(security.security.yield * (1 + security.security.dividend_growth_5yr / 100)).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Annual Income</p>
                <p className="font-medium">${(marketValue * security.security.yield / 100).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  Projected: ${(marketValue * security.security.yield / 100 * (1 + security.security.dividend_growth_5yr / 100)).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Monthly Income</p>
                <p className="font-medium">${(marketValue * security.security.yield / 100 / 12).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  Projected: ${(marketValue * security.security.yield / 100 * (1 + security.security.dividend_growth_5yr / 100) / 12).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Technical Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">SMA-200 Status</p>
                <p className="font-medium capitalize">{security.security.sma200}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Trading Signal</p>
                <p className="font-medium">{security.security.sma200 === "below" ? "Buy" : "Hold"}</p>
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Stock Chart</CardTitle>
                  <CardDescription>
                    6-month price history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SecurityChart ticker={security.security.ticker} />
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Technical Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                  <TechnicalIndicators ticker={security.security.ticker} />
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Analyst Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <AnalystRecommendations symbol={security.security.ticker} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="technical">
            <Card>
              <CardHeader>
                <CardTitle>Technical Indicators</CardTitle>
                <CardDescription>
                  Technical analysis for {security.security.ticker}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TechnicalIndicators ticker={security.security.ticker} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="dividend">
            <Card>
              <CardHeader>
                <CardTitle>Dividend History</CardTitle>
                <CardDescription>
                  Historical dividend payments for {security.security.ticker}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DividendHistory ticker={security.security.ticker} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="ai-analysis">
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis</CardTitle>
                <CardDescription>
                  AI-powered insights for {security.security.ticker}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>AI analysis content will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
} 