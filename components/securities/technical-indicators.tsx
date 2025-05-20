"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface TechnicalIndicatorsProps {
  ticker: string;
}

interface Indicator {
  name: string;
  value: string | number;
  signal: "buy" | "sell" | "neutral";
  strength: number; // 0-100
}

export function TechnicalIndicators({ ticker }: TechnicalIndicatorsProps) {
  // Mock data - in a real app, this would come from an API
  const indicators: Indicator[] = [
    {
      name: "200-Day SMA",
      value: ticker === "MSFT" ? "Price below SMA" : "Price above SMA",
      signal: ticker === "MSFT" ? "buy" : "sell",
      strength: ticker === "MSFT" ? 85 : 70,
    },
    {
      name: "50-Day SMA",
      value: ticker === "MSFT" ? "Price above SMA" : "Price above SMA",
      signal: ticker === "MSFT" ? "sell" : "sell",
      strength: 60,
    },
    {
      name: "Stochastic Oscillator",
      value: ticker === "MSFT" ? "30.5 (Oversold)" : "72.3 (Neutral)",
      signal: ticker === "MSFT" ? "buy" : "neutral",
      strength: ticker === "MSFT" ? 75 : 50,
    },
    {
      name: "MACD",
      value: ticker === "MSFT" ? "Bullish Crossover" : "Bearish Divergence",
      signal: ticker === "MSFT" ? "buy" : "sell",
      strength: ticker === "MSFT" ? 65 : 80,
    },
    {
      name: "RSI (14)",
      value: ticker === "MSFT" ? "42.3" : "68.7",
      signal: ticker === "MSFT" ? "neutral" : "neutral",
      strength: 50,
    },
    {
      name: "Volume",
      value: ticker === "MSFT" ? "Above Average" : "Below Average",
      signal: ticker === "MSFT" ? "buy" : "neutral",
      strength: ticker === "MSFT" ? 70 : 45,
    },
    {
      name: "Bollinger Bands",
      value: ticker === "MSFT" ? "Near Lower Band" : "Middle Band",
      signal: ticker === "MSFT" ? "buy" : "neutral",
      strength: ticker === "MSFT" ? 80 : 50,
    },
  ];

  // Calculate overall signal
  const buySignals = indicators.filter(i => i.signal === "buy").length;
  const sellSignals = indicators.filter(i => i.signal === "sell").length;
  const neutralSignals = indicators.filter(i => i.signal === "neutral").length;
  
  let overallSignal: "buy" | "sell" | "neutral" = "neutral";
  if (buySignals > sellSignals && buySignals > neutralSignals) {
    overallSignal = "buy";
  } else if (sellSignals > buySignals && sellSignals > neutralSignals) {
    overallSignal = "sell";
  }
  
  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Technical Summary</h3>
          <Badge 
            variant={overallSignal === "neutral" ? "outline" : "default"}
            className={overallSignal === "buy" ? "bg-green-600" : overallSignal === "sell" ? "bg-red-600" : ""}
          >
            {overallSignal === "buy" ? (
              <ArrowUpRight className="mr-1 h-3 w-3" />
            ) : overallSignal === "sell" ? (
              <ArrowDownRight className="mr-1 h-3 w-3" />
            ) : (
              <Minus className="mr-1 h-3 w-3" />
            )}
            {overallSignal.charAt(0).toUpperCase() + overallSignal.slice(1)}
          </Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500">{buySignals}</div>
            <div className="text-sm text-muted-foreground">Buy Signals</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-muted-foreground">{neutralSignals}</div>
            <div className="text-sm text-muted-foreground">Neutral</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-500">{sellSignals}</div>
            <div className="text-sm text-muted-foreground">Sell Signals</div>
          </div>
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Indicator</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Signal</TableHead>
            <TableHead>Strength</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {indicators.map((indicator, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{indicator.name}</TableCell>
              <TableCell>{indicator.value}</TableCell>
              <TableCell>
                <Badge 
                  variant={indicator.signal === "neutral" ? "outline" : "default"}
                  className={
                    indicator.signal === "buy" 
                      ? "bg-green-600" 
                      : indicator.signal === "sell" 
                        ? "bg-red-600" 
                        : ""
                  }
                >
                  {indicator.signal === "buy" ? (
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                  ) : indicator.signal === "sell" ? (
                    <ArrowDownRight className="mr-1 h-3 w-3" />
                  ) : (
                    <Minus className="mr-1 h-3 w-3" />
                  )}
                  {indicator.signal.charAt(0).toUpperCase() + indicator.signal.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={indicator.strength} className="h-2 w-24" />
                  <span className="text-xs">{indicator.strength}%</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}