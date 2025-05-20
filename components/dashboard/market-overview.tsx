"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeDelta, AreaChart } from "@tremor/react";
import { ArrowUpDown } from "lucide-react";

export function MarketOverview() {
  const marketData = [
    { date: "2024-12-01", "S&P 500": 4800, "DJIA": 38000, "NASDAQ": 16500 },
    { date: "2024-12-02", "S&P 500": 4820, "DJIA": 38200, "NASDAQ": 16600 },
    { date: "2024-12-03", "S&P 500": 4790, "DJIA": 38100, "NASDAQ": 16400 },
    { date: "2024-12-04", "S&P 500": 4830, "DJIA": 38300, "NASDAQ": 16700 },
    { date: "2024-12-05", "S&P 500": 4850, "DJIA": 38500, "NASDAQ": 16800 },
    { date: "2024-12-06", "S&P 500": 4840, "DJIA": 38400, "NASDAQ": 16750 },
    { date: "2024-12-07", "S&P 500": 4870, "DJIA": 38600, "NASDAQ": 16900 },
  ];

  const marketIndices = [
    { name: "S&P 500", value: 4870, change: 1.5 },
    { name: "DJIA", value: 38600, change: 0.8 },
    { name: "NASDAQ", value: 16900, change: 2.1 },
  ];

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Market Overview</CardTitle>
          <CardDescription>Major indices performance</CardDescription>
        </div>
        <ArrowUpDown className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {marketIndices.map((index) => (
            <div key={index.name} className="space-y-1">
              <p className="text-xs text-muted-foreground">{index.name}</p>
              <p className="text-lg font-semibold">{index.value.toLocaleString()}</p>
              <BadgeDelta
                deltaType={index.change >= 0 ? "increase" : "decrease"}
                size="xs"
              >
                {index.change > 0 ? "+" : ""}{index.change}%
              </BadgeDelta>
            </div>
          ))}
        </div>
        
        <div className="h-32">
          <AreaChart
            data={marketData}
            index="date"
            categories={["S&P 500"]}
            colors={["emerald"]}
            showLegend={false}
            showXAxis={false}
            showYAxis={false}
            showGridLines={false}
            showAnimation={true}
            startEndOnly={true}
          />
        </div>
      </CardContent>
    </Card>
  );
}