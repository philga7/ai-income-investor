"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { DollarSign, TrendingUp, Calculator } from "lucide-react";
import { portfolioService, Portfolio } from "@/services/portfolioService";
import { portfolioAnalyticsService } from "@/services/portfolioAnalyticsService";
import { dividendService } from "@/services/dividendService";

interface PortfolioSummaryData {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  portfolioYield: number;
  totalAnnualDividend: number;
  ytdReceived: number;
  next30Days: number;
  highestYield: { ticker: string; yield: number } | null;
  lowestYield: { ticker: string; yield: number } | null;
  cashPercentage: number;
  equitiesPercentage: number;
}

export function PortfolioSummary() {
  const [selectedTab, setSelectedTab] = useState("value");
  const [summaryData, setSummaryData] = useState<PortfolioSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPortfolioSummary() {
      try {
        const portfolios = await portfolioService.getPortfolios();
        
        if (portfolios.length === 0) {
          setSummaryData(null);
          setLoading(false);
          return;
        }

        // Calculate aggregated data across all portfolios
        let totalValue = 0;
        let totalCost = 0;
        let totalAnnualDividend = 0;
        let totalWeightedYield = 0;
        let totalWeight = 0;
        const allSecurities: { ticker: string; yield: number }[] = [];

        for (const portfolio of portfolios) {
          const analytics = portfolioAnalyticsService.calculatePortfolioAnalytics(portfolio);
          
          totalValue += analytics.valueMetrics.totalValue;
          totalCost += analytics.valueMetrics.totalCost;
          totalAnnualDividend += analytics.dividendMetrics.totalAnnualDividend;
          
          // Calculate weighted yield
          const portfolioWeight = analytics.valueMetrics.totalValue;
          totalWeightedYield += analytics.dividendMetrics.portfolioYield * portfolioWeight;
          totalWeight += portfolioWeight;

          // Collect all securities for yield analysis
          portfolio.securities.forEach(security => {
            if (security.security.yield > 0) {
              allSecurities.push({
                ticker: security.security.ticker,
                yield: security.security.yield
              });
            }
          });
        }

        const totalGainLoss = totalValue - totalCost;
        const totalGainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
        const portfolioYield = totalWeight > 0 ? totalWeightedYield / totalWeight : 0;

        // Find highest and lowest yield securities
        const sortedSecurities = allSecurities.sort((a, b) => b.yield - a.yield);
        const highestYield = sortedSecurities.length > 0 ? sortedSecurities[0] : null;
        const lowestYield = sortedSecurities.length > 0 ? sortedSecurities[sortedSecurities.length - 1] : null;

        // For now, we'll use estimates for YTD and next 30 days
        // In a real implementation, you'd calculate these from actual dividend history
        const ytdReceived = totalAnnualDividend * 0.49; // Estimate: 49% of annual received
        const next30Days = totalAnnualDividend * 0.12; // Estimate: 12% of annual in next 30 days

        // For cash vs equities, we'll assume 10% cash for now
        // In a real implementation, you'd track cash positions in portfolios
        const cashPercentage = 10;
        const equitiesPercentage = 90;

        setSummaryData({
          totalValue,
          totalCost,
          totalGainLoss,
          totalGainLossPercentage,
          portfolioYield,
          totalAnnualDividend,
          ytdReceived,
          next30Days,
          highestYield,
          lowestYield,
          cashPercentage,
          equitiesPercentage
        });
      } catch (error) {
        console.error('Error loading portfolio summary:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPortfolioSummary();
  }, []);

  const handleContentClick = () => {
    // Navigate to portfolios page
    window.location.href = "/portfolios";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <Card className="col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>Portfolio Summary</CardTitle>
            <CardDescription>Your investment overview</CardDescription>
          </div>
          <DollarSign className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summaryData) {
    return (
      <Card className="col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>Portfolio Summary</CardTitle>
            <CardDescription>Your investment overview</CardDescription>
          </div>
          <DollarSign className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-muted-foreground">
              <p>No portfolios found</p>
              <p className="text-sm">Create your first portfolio to see summary data</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Portfolio Summary</CardTitle>
          <CardDescription>Your investment overview</CardDescription>
        </div>
        <DollarSign className="h-5 w-5 text-muted-foreground" data-testid="dollar-sign-icon" />
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3" aria-label="Portfolio Summary Tabs" role="tablist">
            <TabsTrigger value="value" asChild>
              <button role="tab">Value</button>
            </TabsTrigger>
            <TabsTrigger value="yield" asChild>
              <button role="tab">Yield</button>
            </TabsTrigger>
            <TabsTrigger value="income" asChild>
              <button role="tab">Income</button>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="value" className="space-y-4 pt-4">
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
              onClick={handleContentClick}
            >
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(summaryData.totalValue)}</p>
              </div>
              <div className="flex items-center text-sm text-green-500">
                <TrendingUp className="mr-1 h-4 w-4" data-testid="trending-up-icon" />
                {formatPercentage(summaryData.totalGainLossPercentage)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">Cash</p>
                <p className="font-medium">{formatCurrency(summaryData.totalValue * (summaryData.cashPercentage / 100))}</p>
              </div>
              <Progress value={summaryData.cashPercentage} className="h-2" />
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">Equities</p>
                <p className="font-medium">{formatCurrency(summaryData.totalValue * (summaryData.equitiesPercentage / 100))}</p>
              </div>
              <Progress value={summaryData.equitiesPercentage} className="h-2" />
            </div>
          </TabsContent>
          <TabsContent value="yield" className="space-y-4 pt-4">
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
              onClick={handleContentClick}
            >
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Yield</p>
                <p className="text-2xl font-bold">{formatPercentage(summaryData.portfolioYield)}</p>
              </div>
              <div className="flex items-center text-sm text-green-500">
                <TrendingUp className="mr-1 h-4 w-4" data-testid="trending-up-icon" />
                +0.2%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">Highest Yield</p>
                <p className="font-medium">
                  {summaryData.highestYield 
                    ? `${summaryData.highestYield.ticker} - ${formatPercentage(summaryData.highestYield.yield)}`
                    : 'N/A'
                  }
                </p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">Lowest Yield</p>
                <p className="font-medium">
                  {summaryData.lowestYield 
                    ? `${summaryData.lowestYield.ticker} - ${formatPercentage(summaryData.lowestYield.yield)}`
                    : 'N/A'
                  }
                </p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="income" className="space-y-4 pt-4">
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
              onClick={handleContentClick}
            >
              <div>
                <p className="text-sm font-medium text-muted-foreground">Annual Income</p>
                <p className="text-2xl font-bold">{formatCurrency(summaryData.totalAnnualDividend)}</p>
              </div>
              <Calculator className="h-5 w-5 text-muted-foreground" data-testid="calculator-icon" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">YTD Received</p>
                <p className="font-medium">{formatCurrency(summaryData.ytdReceived)}</p>
              </div>
              <Progress value={(summaryData.ytdReceived / summaryData.totalAnnualDividend) * 100} className="h-2" />
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">Next 30 Days</p>
                <p className="font-medium">{formatCurrency(summaryData.next30Days)}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}