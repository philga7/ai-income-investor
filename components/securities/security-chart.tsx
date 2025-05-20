"use client"

import { Card } from "@/components/ui/card";
import { AreaChart, ValueFormatter } from "@tremor/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SecurityChartProps {
  ticker: string;
}

interface ChartData {
  date: string;
  price: number;
  sma50?: number;
  sma200?: number;
}

export function SecurityChart({ ticker }: SecurityChartProps) {
  const [showSMA50, setShowSMA50] = useState(true);
  const [showSMA200, setShowSMA200] = useState(true);
  
  // Generate mock data for chart
  const generateChartData = (): ChartData[] => {
    const data: ChartData[] = [];
    const today = new Date();
    // Generate 6 months of data
    for (let i = 180; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Base price with some randomization
      const basePrice = ticker === "MSFT" ? 380 : 170;
      const modifier = Math.sin(i / 20) * 20 + Math.random() * 10;
      const price = basePrice + modifier;
      
      // Calculate SMAs
      let sma50, sma200;
      if (i <= 130) {
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
      
      data.push({
        date: date.toISOString().split('T')[0],
        price,
        ...(sma50 && { sma50 }),
        ...(sma200 && { sma200 }),
      });
    }
    
    return data;
  };
  
  const chartData = generateChartData();
  
  const valueFormatter: ValueFormatter = (value) => `$${value.toFixed(2)}`;
  
  return (
    <div>
      <div className="flex gap-2 mb-4">
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
          valueFormatter={valueFormatter}
          showLegend={true}
          showAnimation={true}
          yAxisWidth={60}
          showGridLines={true}
          autoMinValue={true}
          minValue={Math.min(...chartData.map(d => d.price)) * 0.95}
          maxValue={Math.max(...chartData.map(d => d.price)) * 1.05}
        />
      </div>
    </div>
  );
}