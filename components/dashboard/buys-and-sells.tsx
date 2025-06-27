"use client"

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ArrowUpRight, ArrowDownRight, Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { TechnicalAnalysis } from '@/src/services/technicalAnalysisService';
import { useAuth } from '@/lib/auth';
import { fetchJson } from '@/lib/api-utils';

interface BuysAndSellsProps {
  className?: string;
}

export function BuysAndSells({ className }: BuysAndSellsProps) {
  const [buyOpportunities, setBuyOpportunities] = useState<TechnicalAnalysis[]>([]);
  const [sellOpportunities, setSellOpportunities] = useState<TechnicalAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { session } = useAuth();

  const fetchOpportunities = useCallback(async (forceRefresh = false) => {
    console.log('BuysAndSells: Starting fetch opportunities');
    console.log('BuysAndSells: Session:', session ? 'exists' : 'null');
    console.log('BuysAndSells: Access token:', session?.access_token ? 'exists' : 'null');
    
    if (!session?.access_token) {
      console.log('BuysAndSells: No access token available');
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      if (!forceRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      console.log('BuysAndSells: Fetching from API...');

      // Fetch buy opportunities
      console.log('BuysAndSells: Fetching buy opportunities...');
      const buyData = await fetchJson('/api/technical-analysis?type=buy&limit=5', session.access_token);
      console.log('BuysAndSells: Buy data received:', buyData);
      setBuyOpportunities(buyData);

      // Fetch sell opportunities
      console.log('BuysAndSells: Fetching sell opportunities...');
      const sellData = await fetchJson('/api/technical-analysis?type=sell&limit=5', session.access_token);
      console.log('BuysAndSells: Sell data received:', sellData);
      setSellOpportunities(sellData);

      setHasLoaded(true);

    } catch (err) {
      console.error('BuysAndSells: Error fetching opportunities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch opportunities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  const handleRefresh = () => {
    console.log('BuysAndSells: Manual refresh requested');
    fetchOpportunities(true);
  };

  const getSignalIcon = (signal: 'buy' | 'sell' | 'neutral') => {
    switch (signal) {
      case 'buy':
        return <ArrowUpRight className="h-3 w-3" />;
      case 'sell':
        return <ArrowDownRight className="h-3 w-3" />;
      default:
        return <Target className="h-3 w-3" />;
    }
  };

  const getSignalColor = (signal: 'buy' | 'sell' | 'neutral') => {
    switch (signal) {
      case 'buy':
        return 'bg-green-600 hover:bg-green-700';
      case 'sell':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-gray-600';
    }
  };

  const getRiskLevelColor = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
    }
  };

  const getRiskLevelIcon = (riskLevel: 'low' | 'medium' | 'high') => {
    switch (riskLevel) {
      case 'low':
        return <CheckCircle className="h-3 w-3" />;
      case 'medium':
        return <Target className="h-3 w-3" />;
      case 'high':
        return <AlertTriangle className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>Buys and Sells</CardTitle>
            <CardDescription>Top investment opportunities</CardDescription>
          </div>
          <Target className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>Buys and Sells</CardTitle>
            <CardDescription>Top investment opportunities</CardDescription>
          </div>
          <Target className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show initial state when no data has been loaded
  if (!hasLoaded) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>Buys and Sells</CardTitle>
            <CardDescription>Top investment opportunities</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Target className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Ready for Analysis</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click the refresh button to analyze your portfolio and discover top buy/sell opportunities based on technical indicators.
            </p>
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Analyzing...' : 'Start Analysis'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Buys and Sells</CardTitle>
          <CardDescription>Technical analysis opportunities</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Target className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="buy" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Buy ({buyOpportunities.length})
            </TabsTrigger>
            <TabsTrigger value="sell" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Sell ({sellOpportunities.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-4">
            {buyOpportunities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No strong buy signals found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Signal</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Allocation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buyOpportunities.map((opportunity) => (
                    <TableRow key={opportunity.symbol}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{opportunity.symbol}</span>
                          <span className="text-xs text-muted-foreground">
                            {opportunity.confidence.toFixed(0)}% confidence
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>${opportunity.currentPrice?.toFixed(2) || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={getSignalColor(opportunity.overallSignal)}>
                          {getSignalIcon(opportunity.overallSignal)}
                          {opportunity.overallSignal.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getRiskLevelIcon(opportunity.positionSizing.riskLevel)}
                          <span className={getRiskLevelColor(opportunity.positionSizing.riskLevel)}>
                            {opportunity.positionSizing.riskLevel}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {opportunity.positionSizing.recommendedAllocation.toFixed(1)}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Max: {opportunity.positionSizing.maxPositionSize.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="sell" className="space-y-4">
            {sellOpportunities.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No strong sell signals found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Signal</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Allocation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sellOpportunities.map((opportunity) => (
                    <TableRow key={opportunity.symbol}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{opportunity.symbol}</span>
                          <span className="text-xs text-muted-foreground">
                            {opportunity.confidence.toFixed(0)}% confidence
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>${opportunity.currentPrice?.toFixed(2) || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={getSignalColor(opportunity.overallSignal)}>
                          {getSignalIcon(opportunity.overallSignal)}
                          {opportunity.overallSignal.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getRiskLevelIcon(opportunity.positionSizing.riskLevel)}
                          <span className={getRiskLevelColor(opportunity.positionSizing.riskLevel)}>
                            {opportunity.positionSizing.riskLevel}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {opportunity.positionSizing.recommendedAllocation.toFixed(1)}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Max: {opportunity.positionSizing.maxPositionSize.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
            <div>
              <p className="font-medium mb-1">Buy Signals</p>
              <p>• SMA-50/200 crossovers</p>
              <p>• RSI oversold conditions</p>
              <p>• MACD bullish crossovers</p>
            </div>
            <div>
              <p className="font-medium mb-1">Sell Signals</p>
              <p>• Price below moving averages</p>
              <p>• RSI overbought conditions</p>
              <p>• Volume confirmation</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 