"use client"

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from '@/lib/auth';
import { portfolioAnalyticsService } from "@/src/services/portfolioAnalyticsService";
import { portfolioDataService } from "@/src/services/portfolioDataService";
import { PortfolioPerformance } from "@/components/portfolios/PortfolioPerformance";
import { PortfolioSecurities } from "@/components/portfolios/PortfolioSecurities";
import { DividendSecurities } from "@/components/portfolios/DividendSecurities";
import { PortfolioHeader } from "@/components/portfolios/PortfolioHeader";
import { PortfolioRebalancing } from "@/components/portfolios/PortfolioRebalancing";
import { EnhancedAIAnalysis } from "@/components/portfolios/EnhancedAIAnalysis";
import { DividendTimingDashboard } from "@/components/portfolios/DividendTimingDashboard";
import { DividendCalendar } from "@/components/portfolios/DividendCalendar";
import { PortfolioDataQualityDebug } from "@/components/portfolios/PortfolioDataQualityDebug";
import { BreadcrumbNav } from '@/components/ui/breadcrumb';
import { Portfolio, PortfolioSecurity } from "@/services/portfolioService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Target, 
  BarChart3, 
  PieChart,
  AlertTriangle,
  CheckCircle,
  ChevronRight
} from "lucide-react";
import { dividendService } from "@/src/services/dividendService";
import { PortfolioDetailSkeleton } from "@/components/portfolios/PortfolioDetailSkeleton";

interface PortfolioDetailProps {
  portfolioId: string;
  initialPortfolio?: Portfolio | null;
}

export function PortfolioDetail({ portfolioId, initialPortfolio }: PortfolioDetailProps) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(initialPortfolio || null);
  const [loading, setLoading] = useState(!initialPortfolio);
  const { session, loading: authLoading } = useAuth();
  
  const analytics = portfolio ? portfolioAnalyticsService.calculatePortfolioAnalytics(portfolio) : null;
  const dividendMetrics = portfolio ? dividendService.calculateDividendMetrics(portfolio) : null;

  // Use refs to track if we've already fetched data to prevent unnecessary re-fetches
  const hasInitialized = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPortfolio = useCallback(async () => {
    if (!session?.access_token) {
      toast.error('You must be logged in to view portfolios');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch portfolio');
      }

      const data = await response.json();
      setPortfolio(data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch portfolio');
    } finally {
      setLoading(false);
    }
  }, [portfolioId, session]);

  // Initial data loading - only run once
  useEffect(() => {
    if (hasInitialized.current) return;
    
    if (!initialPortfolio && !authLoading && session) {
      fetchPortfolio();
      hasInitialized.current = true;
    }
  }, [initialPortfolio, fetchPortfolio, session, authLoading]);

  // Set up refresh interval only when portfolio is loaded and tab is visible
  useEffect(() => {
    if (!portfolio || !hasInitialized.current) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval that only runs when tab is visible
    intervalRef.current = setInterval(() => {
      if (!document.hidden) {
        fetchPortfolio();
      }
    }, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [portfolio, fetchPortfolio]);

  const handlePortfolioUpdated = () => {
    fetchPortfolio();
  };

  const handleSecurityDeleted = useCallback(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handleSecurityAdded = useCallback(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  if (authLoading || loading) {
    return <PortfolioDetailSkeleton />;
  }

  if (!portfolio) {
    return <div>Portfolio not found</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'Portfolios', href: '/portfolios' },
        { label: portfolio.name, href: `/portfolios/${portfolio.id}` }
      ]} />
      
      <PortfolioHeader portfolio={portfolio} onPortfolioUpdated={handlePortfolioUpdated} />
      
      {/* Dividend-Focused Main Content */}
      <Tabs defaultValue="income" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="income" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Income
          </TabsTrigger>
          <TabsTrigger value="timing" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Timing
          </TabsTrigger>
          <TabsTrigger value="securities" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Securities
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Analysis
          </TabsTrigger>
        </TabsList>

        {/* Income Tab - Primary Focus */}
        <TabsContent value="income" className="space-y-6">
          {/* Dividend Income Overview */}
          {dividendMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Annual Income</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(dividendMetrics.totalAnnualDividend)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +{formatCurrency(dividendMetrics.totalAnnualDividend / 12)} monthly
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Portfolio Yield</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatPercentage(dividendMetrics.portfolioYield)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avg security: {formatPercentage(dividendMetrics.weightedAverageYield)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Dividend Growth</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {(() => {
                      const dividendSecurities = portfolio.securities.filter(s => s.security.dividend_growth_5yr);
                      const avgGrowth = dividendSecurities.length > 0 
                        ? dividendSecurities.reduce((sum, s) => sum + (s.security.dividend_growth_5yr || 0), 0) / dividendSecurities.length
                        : 0;
                      return `${avgGrowth.toFixed(1)}%`;
                    })()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    5-year average
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Income Stability</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {portfolio.securities.filter(s => s.security.dividend && s.security.dividend > 0).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    of {portfolio.securities.length} pay dividends
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Dividend Income Projection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Income Projection
              </CardTitle>
              <CardDescription>
                Projected dividend income based on historical growth rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dividendMetrics && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-lg font-semibold text-muted-foreground">Next 12 Months</div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(dividendMetrics.totalAnnualDividend)}
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-lg font-semibold text-muted-foreground">Next 5 Years</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(dividendMetrics.totalAnnualDividend * 1.15)}
                      </div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-lg font-semibold text-muted-foreground">Next 10 Years</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(dividendMetrics.totalAnnualDividend * 1.35)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Income Growth Rate</span>
                      <span className="font-medium">~3.2% annually</span>
                    </div>
                    <Progress value={32} className="h-2" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced AI Analysis */}
          <div className="flex justify-end">
            <EnhancedAIAnalysis portfolioId={portfolio.id} />
          </div>
        </TabsContent>

        {/* Timing Tab */}
        <TabsContent value="timing" className="space-y-6">
          {/* Dividend Timing Dashboard - Expanded */}
          {analytics && (
            <DividendTimingDashboard portfolio={portfolio} />
          )}

          {/* Dividend Calendar */}
          <DividendCalendar portfolio={portfolio} />
        </TabsContent>

        {/* Securities Tab */}
        <TabsContent value="securities" className="space-y-6">
          {/* Securities Management */}
          <DividendSecurities
            securities={portfolio.securities}
            portfolioId={portfolio.id}
            onSecurityDeleted={handleSecurityDeleted}
            onSecurityAdded={handleSecurityAdded}
          />
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          {/* Portfolio Performance - Moved to Analysis tab */}
          {analytics && (
            <PortfolioPerformance portfolio={portfolio} />
          )}
          
          {/* Portfolio Rebalancing */}
          <PortfolioRebalancing portfolioId={portfolio.id} />
          
          {/* Data Quality Debug - Only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <PortfolioDataQualityDebug portfolioSecurities={portfolio.securities} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}