'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  RefreshCw,
  Target,
  PieChart,
  BarChart3
} from 'lucide-react';
import type { 
  PortfolioRebalancingAnalysis, 
  RebalancingSuggestion 
} from '@/src/services/portfolioRebalancingService';

interface PortfolioRebalancingProps {
  portfolioId: string;
}

export function PortfolioRebalancing({ portfolioId }: PortfolioRebalancingProps) {
  const [analysis, setAnalysis] = useState<PortfolioRebalancingAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [riskProfile, setRiskProfile] = useState<'conservative' | 'moderate' | 'aggressive'>('moderate');
  const { session, loading: authLoading } = useAuth();

  const fetchRebalancingAnalysis = useCallback(async () => {
    if (authLoading) {
      return; // Don't fetch if auth is still loading
    }

    if (!session?.access_token) {
      toast.error('You must be logged in to view rebalancing suggestions');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/portfolios/${portfolioId}/rebalancing?riskProfile=${riskProfile}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch rebalancing analysis');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Error fetching rebalancing analysis:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch rebalancing analysis');
    } finally {
      setLoading(false);
    }
  }, [portfolioId, riskProfile, session, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      fetchRebalancingAnalysis();
    }
  }, [fetchRebalancingAnalysis, authLoading]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'buy':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'sell':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Portfolio Rebalancing Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Analyzing portfolio...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Rebalancing Analysis</CardTitle>
          <CardDescription>
            Get AI-powered suggestions to optimize your portfolio allocation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No rebalancing data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Portfolio Rebalancing Analysis
            </CardTitle>
            <CardDescription>
              AI-powered suggestions to optimize your portfolio allocation based on analyst recommendations
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={riskProfile} onValueChange={(value: any) => setRiskProfile(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">Conservative</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="aggressive">Aggressive</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRebalancingAnalysis}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
            <TabsTrigger value="allocations">Allocations</TabsTrigger>
            <TabsTrigger value="targets">Targets</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                      <p className="text-2xl font-bold">{formatCurrency(analysis.totalValue)}</p>
                    </div>
                    <PieChart className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Buy Value</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(analysis.summary.totalBuyValue)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Sell Value</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(analysis.summary.totalSellValue)}
                      </p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Rebalancing Score</p>
                      <p className="text-2xl font-bold">{analysis.summary.rebalancingScore.toFixed(0)}/100</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className={getRiskLevelColor(analysis.summary.riskLevel)}>
                      {analysis.summary.riskLevel.toUpperCase()} RISK
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on the magnitude of suggested changes and current portfolio composition.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysis.suggestions.filter(s => s.priority === 'high').slice(0, 3).map((suggestion, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        {getActionIcon(suggestion.action)}
                        <span className="font-medium">{suggestion.symbol}</span>
                      </div>
                      <Badge variant="outline" className={getPriorityColor(suggestion.priority)}>
                        {suggestion.action.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            <div className="space-y-4">
              {analysis.suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-lg font-medium">Portfolio is well-balanced!</p>
                  <p className="text-muted-foreground">No significant rebalancing actions needed.</p>
                </div>
              ) : (
                analysis.suggestions.map((suggestion, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getActionIcon(suggestion.action)}
                          <div>
                            <h4 className="font-semibold">{suggestion.symbol}</h4>
                            <p className="text-sm text-muted-foreground">{suggestion.reason}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(suggestion.priority)}>
                            {suggestion.priority.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {suggestion.confidence}% confidence
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Current Allocation</p>
                          <p className="font-medium">{formatPercentage(suggestion.currentAllocation)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Target Allocation</p>
                          <p className="font-medium">{formatPercentage(suggestion.suggestedAllocation)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Shares to {suggestion.action}</p>
                          <p className="font-medium">{Math.abs(suggestion.sharesToTrade).toFixed(0)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Estimated Value</p>
                          <p className="font-medium">{formatCurrency(suggestion.estimatedValue)}</p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Current: {formatPercentage(suggestion.currentAllocation)}</span>
                          <span>Target: {formatPercentage(suggestion.suggestedAllocation)}</span>
                        </div>
                        <Progress 
                          value={suggestion.currentAllocation} 
                          className="h-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="allocations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Portfolio Allocations</CardTitle>
                <CardDescription>
                  How your portfolio is currently distributed across securities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.currentAllocations.map((allocation, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="font-medium">{allocation.symbol}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(allocation.value)}
                        </span>
                        <span className="font-medium">{formatPercentage(allocation.allocation)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="targets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Target Allocations</CardTitle>
                <CardDescription>
                  Recommended allocation targets based on {riskProfile} risk profile and analyst recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysis.targetAllocations.map((target, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="font-medium">{target.symbol}</span>
                      </div>
                      <span className="font-medium">{formatPercentage(target.targetAllocation)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 