"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowUpDown, 
  PlusCircle, 
  Pencil, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign,
  BarChart4, 
  PieChart 
} from "lucide-react";
import Link from "next/link";
import { PortfolioSecurityChart } from "@/components/portfolios/portfolio-security-chart";
import { PositionCalculator } from "@/components/portfolios/position-calculator";

interface PortfolioDetailProps {
  portfolioId: string;
}

export function PortfolioDetail({ portfolioId }: PortfolioDetailProps) {
  // This would be fetched from your API/database
  const portfolio = {
    id: portfolioId,
    name: "Core Dividend Portfolio",
    value: 124389.52,
    yield: 3.85,
    securities: 25,
    ytdDividends: 2345.67,
    projectedAnnualDividends: 4789.25,
  };
  
  const securities = [
    {
      ticker: "MSFT",
      name: "Microsoft Corp.",
      shares: 65,
      price: 410.78,
      costBasis: 365.42,
      value: 26700.70,
      yield: 0.8,
      annualDividend: 213.60,
      signalType: "buy",
    },
    {
      ticker: "AAPL",
      name: "Apple Inc.",
      shares: 100,
      price: 188.32,
      costBasis: 175.65,
      value: 18832.00,
      yield: 0.5,
      annualDividend: 94.16,
      signalType: "hold",
    },
    {
      ticker: "JNJ",
      name: "Johnson & Johnson",
      shares: 50,
      price: 156.76,
      costBasis: 145.25,
      value: 7838.00,
      yield: 3.2,
      annualDividend: 250.82,
      signalType: "buy",
    },
    {
      ticker: "PG",
      name: "Procter & Gamble Co.",
      shares: 75,
      price: 162.55,
      costBasis: 155.33,
      value: 12191.25,
      yield: 2.4,
      annualDividend: 292.59,
      signalType: "hold",
    },
    {
      ticker: "VZ",
      name: "Verizon Communications",
      shares: 120,
      price: 41.35,
      costBasis: 45.72,
      value: 4962.00,
      yield: 6.8,
      annualDividend: 337.42,
      signalType: "sell",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold tracking-tight mr-2">{portfolio.name}</h1>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit Portfolio Name</span>
            </Button>
          </div>
          <p className="text-muted-foreground">
            {portfolio.securities} securities · ${portfolio.value.toLocaleString()} portfolio value
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href={`/portfolios/${portfolioId}/add-security`}>
            <Button variant="outline" className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Security
            </Button>
          </Link>
          <Button className="w-full sm:w-auto">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Rebalance
          </Button>
        </div>
      </div>
      
      {/* Rest of your existing JSX */}
      {/* ... */}
    </div>
  );
} 