"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeDelta, AreaChart } from "@tremor/react";
import { ArrowUpDown } from "lucide-react";
import { SecurityQuote } from '@/services/financialService';
import { useAuth } from '@/lib/auth';

interface MarketIndexData {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
}

interface ChartDataPoint {
  date: string;
  [key: string]: number | string;
}

const indices = [
  { name: 'S&P 500', symbol: '^GSPC', displayName: 'S&P 500' },
  { name: 'Dow Jones', symbol: '^DJI', displayName: 'DJIA' },
  { name: 'Nasdaq', symbol: '^IXIC', displayName: 'NASDAQ' },
];

async function fetchJson(url: string, token: string | null) {
  if (!token) {
    throw new Error('Authentication token is not available.');
  }
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to fetch ${url}: ${response.statusText} - ${errorBody}`);
  }
  return response.json();
}

export function MarketOverview() {
  const { session } = useAuth();
  const [marketData, setMarketData] = useState<MarketIndexData[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMarketData() {
      if (!session) {
        setLoading(false);
        setError('You must be logged in to view market data.');
        return;
      }

      try {
        const quotePromises = indices.map(index => 
          fetchJson(`/api/quotes?symbol=${index.symbol}`, session.access_token)
        );

        const historicalPromises = indices.map(index => {
          const endDate = new Date().toISOString().split('T')[0];
          const startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];
          return fetchJson(`/api/historical?symbol=${index.symbol}&startDate=${startDate}&endDate=${endDate}`, session.access_token);
        });
        
        const indexQuotes: SecurityQuote[] = await Promise.all(quotePromises);
        const historicalData = await Promise.all(historicalPromises);

        const marketIndexData = indexQuotes.map((quote, i) => ({
          name: indices[i].displayName,
          symbol: quote.symbol,
          value: quote.price.regularMarketPrice || 0,
          change: quote.price.regularMarketChange || 0,
          changePercent: (quote.price.regularMarketChangePercent || 0) * 100,
        }));
        setMarketData(marketIndexData);
        
        // Normalize and format historical data for the chart
        const formattedChartData: ChartDataPoint[] = [];
        if (historicalData.every(h => h && h.length > 0)) {
          // Find the first valid data point for each index to use as a baseline
          const baselines = historicalData.map(h => h.find((p: any) => p.close !== null)?.close || 0);

          // Use the length of the first historical data array as the reference
          historicalData[0].forEach((point: any, i: number) => {
            const dateStr = new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const dataPoint: ChartDataPoint = { date: dateStr };

            indices.forEach((index, j) => {
              const currentClose = historicalData[j]?.[i]?.close;
              const baseline = baselines[j];
              if (currentClose !== null && currentClose !== undefined && baseline) {
                // Calculate percentage change from baseline
                dataPoint[index.displayName] = ((currentClose - baseline) / baseline) * 100;
              } else {
                dataPoint[index.displayName] = 0; // Default to 0 if data is missing
              }
            });
            formattedChartData.push(dataPoint);
          });
        }
        setChartData(formattedChartData);
        
      } catch (err: any) {
        console.error('Error fetching market data:', err);
        setError(err.message || 'Failed to load market data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadMarketData();
  }, [session]);

  if (loading) {
    return (
      <Card className="col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>Market Overview</CardTitle>
            <CardDescription>Major indices performance</CardDescription>
          </div>
          <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-1">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>Market Overview</CardTitle>
            <CardDescription>Major indices performance</CardDescription>
          </div>
          <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-red-500">
              <p>{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col col-span-1 overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Market Overview</CardTitle>
          <CardDescription>Major indices performance</CardDescription>
        </div>
        <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {marketData.map((index) => (
            <div key={index.name} className="space-y-1">
              <p className="text-xs text-muted-foreground">{index.name}</p>
              <p className="text-lg font-semibold">{index.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              <BadgeDelta
                deltaType={index.change >= 0 ? "increase" : "decrease"}
                size="xs"
              >
                {index.change > 0 ? "+" : ""}{index.changePercent.toFixed(2)}%
              </BadgeDelta>
            </div>
          ))}
        </div>
      </CardContent>
      
      <div className="flex-grow w-full">
        <AreaChart
          data={chartData}
          index="date"
          categories={indices.map((index) => index.displayName)}
          colors={["emerald", "cyan", "indigo"]}
          valueFormatter={(number: number) => `${number.toFixed(2)}%`}
          showLegend={false}
          showXAxis={false}
          showYAxis={false}
          showGridLines={false}
          showAnimation={true}
          startEndOnly={true}
          className="h-full w-full"
        />
      </div>
    </Card>
  );
}