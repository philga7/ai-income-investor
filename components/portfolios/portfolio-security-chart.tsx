"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DonutChart, Legend } from "@tremor/react";

const portfolioAllocation = [
  { name: "Technology", value: 25, color: "chart-1" },
  { name: "Healthcare", value: 18, color: "chart-2" },
  { name: "Consumer Staples", value: 15, color: "chart-3" },
  { name: "Financials", value: 12, color: "chart-4" },
  { name: "Industrials", value: 10, color: "chart-5" },
  { name: "Other Sectors", value: 20, color: "muted" },
];

export function PortfolioSecurityChart() {
  // Convert to the format expected by Tremor
  const chartData = portfolioAllocation.map(item => ({
    name: item.name,
    value: item.value,
  }));

  // Extract sector names for the legend
  const sectorNames = portfolioAllocation.map(item => item.name);
  
  // Extract colors for the chart (must be Tremor-compatible colors)
  const colors = ["emerald", "blue", "amber", "indigo", "rose", "gray"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Sector Allocation</CardTitle>
          <CardDescription>
            Portfolio breakdown by sector
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-4">
          <DonutChart
            data={chartData}
            variant="pie"
            valueFormatter={(value) => `${value}%`}
            colors={colors}
            showAnimation={true}
            category="value"
            index="name"
            className="mt-6 h-40 w-40"
          />
        </CardContent>
        <div className="p-4 pt-0">
          <Legend
            categories={sectorNames}
            colors={colors}
            className="justify-center space-x-4"
          />
        </div>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Yield Distribution</CardTitle>
          <CardDescription>
            Securities by dividend yield range
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-4">
          <DonutChart
            data={[
              { name: "0-1%", value: 15 },
              { name: "1-2%", value: 20 },
              { name: "2-3%", value: 25 },
              { name: "3-4%", value: 20 },
              { name: "4-5%", value: 10 },
              { name: ">5%", value: 10 },
            ]}
            variant="pie"
            valueFormatter={(value) => `${value}%`}
            colors={["slate", "violet", "indigo", "cyan", "green", "amber"]}
            showAnimation={true}
            category="value"
            index="name"
            className="mt-6 h-40 w-40"
          />
        </CardContent>
        <div className="p-4 pt-0">
          <Legend
            categories={["0-1%", "1-2%", "2-3%", "3-4%", "4-5%", ">5%"]}
            colors={["slate", "violet", "indigo", "cyan", "green", "amber"]}
            className="justify-center space-x-4"
          />
        </div>
      </Card>
    </div>
  );
}