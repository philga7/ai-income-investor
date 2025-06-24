"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, DollarSign, TrendingUp, AlertTriangle, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Portfolio } from '@/services/portfolioService';
import { enhancedPortfolioAnalysisService, EnhancedPortfolioAnalysis } from '@/src/services/enhancedPortfolioAnalysisService';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DividendTimingDashboardProps {
  portfolio: Portfolio;
}

export function DividendTimingDashboard({ portfolio }: DividendTimingDashboardProps) {
  const [analysis, setAnalysis] = useState<EnhancedPortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false); // Default to collapsed

  useEffect(() => {
    async function loadAnalysis() {
      try {
        setLoading(true);
        const enhancedAnalysis = await enhancedPortfolioAnalysisService.generateEnhancedAnalysis(portfolio);
        setAnalysis(enhancedAnalysis);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analysis');
      } finally {
        setLoading(false);
      }
    }

    loadAnalysis();
  }, [portfolio]);

  if (loading) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Dividend Timing Analysis
                {isOpen ? <ChevronDown className="h-4 w-4 ml-auto" /> : <ChevronRight className="h-4 w-4 ml-auto" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading dividend analysis...</p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  if (error) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Dividend Timing Analysis
                {isOpen ? <ChevronDown className="h-4 w-4 ml-auto" /> : <ChevronRight className="h-4 w-4 ml-auto" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-500">Error: {error}</p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  if (!analysis) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Dividend Timing Analysis
                {isOpen ? <ChevronDown className="h-4 w-4 ml-auto" /> : <ChevronRight className="h-4 w-4 ml-auto" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">No analysis data available</p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing': return 'text-green-600';
      case 'stable': return 'text-blue-600';
      case 'decreasing': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dividend Timing Analysis
              {isOpen ? <ChevronDown className="h-4 w-4 ml-auto" /> : <ChevronRight className="h-4 w-4 ml-auto" />}
            </CardTitle>
            <CardDescription>
              Current dividend income and timing analysis
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-6 p-6">
            {/* Portfolio Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Portfolio Income Overview
                </CardTitle>
                <CardDescription>
                  Current dividend income and timing analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(analysis.dividendMetrics.totalAnnualDividend)}
                    </div>
                    <div className="text-sm text-muted-foreground">Annual Income</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(analysis.dividendMetrics.totalMonthlyDividend)}
                    </div>
                    <div className="text-sm text-muted-foreground">Monthly Income</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {analysis.dividendMetrics.portfolioYield.toFixed(2)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Portfolio Yield</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {analysis.dividendMetrics.weightedAverageYield.toFixed(2)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Security Yield</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dividend Timing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Dividend Timing
                </CardTitle>
                <CardDescription>
                  Upcoming dividend events and timing analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Next Dividend Info */}
                  {analysis.dividendTiming.nextDividendDate && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Next Ex-Dividend Date</span>
                        </div>
                        <div className="text-2xl font-bold">
                          {new Date(analysis.dividendTiming.nextDividendDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {analysis.dividendTiming.daysUntilNextDividend} days from now
                        </div>
                      </div>
                      
                      {analysis.dividendTiming.nextPaymentDate && (
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-medium">Next Payment Date</span>
                          </div>
                          <div className="text-2xl font-bold">
                            {new Date(analysis.dividendTiming.nextPaymentDate).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {analysis.dividendTiming.daysUntilPayment} days from now
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Dividend Health Indicators */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-medium mb-1">Reliability</div>
                      <Badge className={getReliabilityColor(analysis.dividendTiming.dividendReliability)}>
                        {analysis.dividendTiming.dividendReliability}
                      </Badge>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium mb-1">Growth Trend</div>
                      <div className={`font-medium ${getTrendColor(analysis.dividendTiming.dividendGrowthTrend)}`}>
                        {analysis.dividendTiming.dividendGrowthTrend}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium mb-1">Payout Health</div>
                      <Badge className={getReliabilityColor(analysis.dividendTiming.payoutRatioHealth)}>
                        {analysis.dividendTiming.payoutRatioHealth}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Portfolio Insights
                </CardTitle>
                <CardDescription>
                  Key insights about your dividend portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Dividend Concentration</h4>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={
                            analysis.portfolioInsights.dividendConcentration === 'high' ? 80 :
                            analysis.portfolioInsights.dividendConcentration === 'medium' ? 50 : 20
                          } 
                          className="flex-1" 
                        />
                        <Badge variant="outline">
                          {analysis.portfolioInsights.dividendConcentration}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {analysis.portfolioInsights.dividendConcentration === 'high' 
                          ? 'High concentration in dividend-paying securities'
                          : analysis.portfolioInsights.dividendConcentration === 'medium'
                          ? 'Moderate dividend concentration'
                          : 'Low dividend concentration'
                        }
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Sector Diversification</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {analysis.portfolioInsights.sectorDiversification}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {analysis.portfolioInsights.sectorDiversification === 'well-diversified'
                          ? 'Good sector diversification across multiple industries'
                          : analysis.portfolioInsights.sectorDiversification === 'moderate'
                          ? 'Moderate sector diversification'
                          : 'Concentrated in few sectors'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Income Stability</h4>
                      <div className="flex items-center gap-2">
                        <Badge className={getReliabilityColor(analysis.portfolioInsights.incomeStability)}>
                          {analysis.portfolioInsights.incomeStability}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {analysis.portfolioInsights.incomeStability === 'stable'
                          ? 'Consistent dividend income across securities'
                          : analysis.portfolioInsights.incomeStability === 'moderate'
                          ? 'Moderate income stability'
                          : 'Volatile dividend income patterns'
                        }
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Next Income Event</h4>
                      {analysis.portfolioInsights.nextIncomeEvent ? (
                        <div>
                          <div className="font-medium">
                            {analysis.portfolioInsights.nextIncomeEvent.ticker} - {analysis.portfolioInsights.nextIncomeEvent.type}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(analysis.portfolioInsights.nextIncomeEvent.date).toLocaleDateString()} - 
                            {formatCurrency(analysis.portfolioInsights.nextIncomeEvent.amount)}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No upcoming income events
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Dividend Calendar */}
            {analysis.dividendTiming.exDividendCalendar.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Dividend Calendar
                  </CardTitle>
                  <CardDescription>
                    Next 10 dividend events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.dividendTiming.exDividendCalendar.slice(0, 10).map((event, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{event.ticker}</div>
                            <div className="text-sm text-muted-foreground">
                              {event.type} - {formatCurrency(event.amount)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {new Date(event.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
} 