"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, LineChart } from "@tremor/react";
import { ArrowUpRight, ArrowDownRight, Target, TrendingUp, TrendingDown, ChevronDown, ChevronRight } from "lucide-react";
import { TechnicalAnalysis } from '@/src/services/technicalAnalysisService';

interface TechnicalAnalysisChartProps {
  symbol: string;
  className?: string;
  analysis?: TechnicalAnalysis | null;
  loading?: boolean;
  error?: string | null;
}

interface ChartDataPoint {
  date: string;
  price: number;
  sma50?: number;
  sma200?: number;
  rsi?: number;
  macd?: number;
  signal?: number;
  histogram?: number;
  stochastic?: number;
  volume?: number;
}

export function TechnicalAnalysisChart({ symbol, className, analysis, loading = false, error }: TechnicalAnalysisChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showSMA200, setShowSMA200] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  // Generate chart data when analysis is available
  useEffect(() => {
    if (analysis) {
      const data = generateChartData(symbol);
      setChartData(data);
    }
  }, [analysis, symbol]);

  const generateChartData = (ticker: string): ChartDataPoint[] => {
    const data: ChartDataPoint[] = [];
    const today = new Date();
    
    // Generate 200 days of data for SMA-200
    for (let i = 200; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Base price with some randomization
      const basePrice = ticker === "MSFT" ? 380 : ticker === "AAPL" ? 180 : 100;
      const modifier = Math.sin(i / 20) * 20 + Math.random() * 10;
      const price = basePrice + modifier;
      
      // Calculate SMAs
      let sma50, sma200;
      if (i <= 150) {
        // Calculate 50-day SMA
        let sum = 0;
        for (let j = 0; j < 50; j++) {
          if (data[data.length - j - 1]) {
            sum += data[data.length - j - 1].price;
          }
        }
        sma50 = sum / 50;
      }
      
      if (i <= 0) {
        // Calculate 200-day SMA
        let sum = 0;
        for (let j = 0; j < Math.min(200, data.length); j++) {
          sum += data[data.length - j - 1].price;
        }
        sma200 = sum / Math.min(200, data.length);
      }
      
      // Generate other indicators
      const rsi = 30 + Math.sin(i / 10) * 40 + Math.random() * 20; // 30-70 range
      const macd = Math.sin(i / 15) * 5 + Math.random() * 2;
      const signal = macd + Math.sin(i / 20) * 2;
      const histogram = macd - signal;
      const stochastic = 20 + Math.sin(i / 12) * 60 + Math.random() * 20; // 20-80 range
      const volume = 1000000 + Math.random() * 5000000;
      
      data.push({
        date: date.toISOString().split('T')[0],
        price,
        ...(sma50 && { sma50 }),
        ...(sma200 && { sma200 }),
        rsi: Math.max(0, Math.min(100, rsi)),
        macd,
        signal,
        histogram,
        stochastic: Math.max(0, Math.min(100, stochastic)),
        volume
      });
    }
    
    return data;
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
        return 'bg-green-600';
      case 'sell':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">{symbol}</CardTitle>
            <div className="animate-pulse h-6 w-16 bg-gray-200 rounded"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !analysis) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">{symbol}</CardTitle>
            <Badge variant="secondary">Error</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm">
              {error || 'No technical analysis available.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">{symbol}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Badge className={getSignalColor(analysis.overallSignal)}>
            {getSignalIcon(analysis.overallSignal)}
            {analysis.overallSignal.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <Tabs defaultValue="price" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="price">Price & SMAs</TabsTrigger>
              <TabsTrigger value="stochastic">Stochastic</TabsTrigger>
            </TabsList>

            <TabsContent value="price" className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={showSMA50 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowSMA50(!showSMA50)}
                >
                  SMA-50
                </Button>
                <Button
                  variant={showSMA200 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowSMA200(!showSMA200)}
                >
                  SMA-200
                </Button>
              </div>
              
              <div className="h-80">
                <AreaChart
                  data={chartData}
                  index="date"
                  categories={[
                    "price", 
                    ...(showSMA50 ? ["sma50"] : []), 
                    ...(showSMA200 ? ["sma200"] : [])
                  ]}
                  colors={["blue", "amber", "emerald"]}
                  valueFormatter={(value) => `$${value.toFixed(2)}`}
                  showLegend={true}
                  showAnimation={true}
                  yAxisWidth={60}
                  showGridLines={true}
                />
              </div>
            </TabsContent>

            <TabsContent value="stochastic" className="space-y-4">
              <div className="h-80">
                <LineChart
                  data={chartData}
                  index="date"
                  categories={["stochastic"]}
                  colors={["orange"]}
                  valueFormatter={(value) => value.toFixed(1)}
                  showLegend={true}
                  showAnimation={true}
                  yAxisWidth={60}
                  showGridLines={true}
                  minValue={0}
                  maxValue={100}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-2 bg-red-50 rounded">
                  <div className="font-medium text-red-600">Overbought</div>
                  <div className="text-xs text-muted-foreground">Above 80</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-medium">Neutral</div>
                  <div className="text-xs text-muted-foreground">20-80</div>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="font-medium text-green-600">Oversold</div>
                  <div className="text-xs text-muted-foreground">Below 20</div>
                </div>
              </div>
              
              {/* Actual Stochastic Data */}
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-3">Current Stochastic Values</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Current Value:</span>
                    <span className="ml-2 font-medium">
                      {chartData[chartData.length - 1]?.stochastic?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span className="ml-2 font-medium">
                      {(() => {
                        const current = chartData[chartData.length - 1]?.stochastic;
                        if (!current) return 'N/A';
                        if (current > 80) return 'Overbought';
                        if (current < 20) return 'Oversold';
                        return 'Neutral';
                      })()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">14-day High:</span>
                    <span className="ml-2 font-medium">
                      {Math.max(...chartData.slice(-14).map(d => d.stochastic || 0)).toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">14-day Low:</span>
                    <span className="ml-2 font-medium">
                      {Math.min(...chartData.slice(-14).map(d => d.stochastic || 0)).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Position Sizing Information */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-3">Position Sizing Recommendations</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="font-medium">Recommended Allocation</div>
                <div className="text-lg font-bold text-green-600">
                  {analysis.positionSizing.recommendedAllocation.toFixed(1)}%
                </div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="font-medium">Max Position Size</div>
                <div className="text-lg font-bold">
                  {analysis.positionSizing.maxPositionSize.toFixed(1)}%
                </div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="font-medium">Risk Level</div>
                <div className="text-lg font-bold capitalize">
                  {analysis.positionSizing.riskLevel}
                </div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="font-medium">Confidence</div>
                <div className="text-lg font-bold">
                  {analysis.confidence.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
} 