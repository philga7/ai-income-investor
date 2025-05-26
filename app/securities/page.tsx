'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight, AlertCircle, LineChart, Search } from "lucide-react";
import Link from "next/link";
import { ProtectedRoute } from '@/components/auth/protected-route';

interface Security {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  yield: number;
  sma200: "above" | "below";
  tags: string[];
}

const securities: Security[] = [
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    sector: "Technology",
    price: 188.32,
    yield: 0.5,
    sma200: "above",
    tags: ["Growth", "Dividend Growth"],
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corp.",
    sector: "Technology",
    price: 410.78,
    yield: 0.8,
    sma200: "below",
    tags: ["Growth", "Large Cap"],
  },
  {
    ticker: "JNJ",
    name: "Johnson & Johnson",
    sector: "Healthcare",
    price: 156.76,
    yield: 3.2,
    sma200: "below",
    tags: ["Dividend Aristocrat", "Defensive"],
  },
  {
    ticker: "PG",
    name: "Procter & Gamble Co.",
    sector: "Consumer Staples",
    price: 162.55,
    yield: 2.4,
    sma200: "above",
    tags: ["Dividend King", "Defensive"],
  },
  {
    ticker: "KO",
    name: "Coca-Cola Co.",
    sector: "Consumer Staples",
    price: 60.33,
    yield: 3.0,
    sma200: "below",
    tags: ["Dividend Aristocrat", "Defensive"],
  },
  {
    ticker: "ABBV",
    name: "AbbVie Inc.",
    sector: "Healthcare",
    price: 165.42,
    yield: 3.8,
    sma200: "below",
    tags: ["Dividend Growth", "Healthcare"],
  },
  {
    ticker: "VZ",
    name: "Verizon Communications",
    sector: "Communication Services",
    price: 41.35,
    yield: 6.8,
    sma200: "above",
    tags: ["High Yield", "Telecom"],
  },
  {
    ticker: "O",
    name: "Realty Income Corp.",
    sector: "Real Estate",
    price: 53.67,
    yield: 5.4,
    sma200: "above",
    tags: ["REIT", "Monthly Dividend"],
  },
  {
    ticker: "PEP",
    name: "PepsiCo Inc.",
    sector: "Consumer Staples",
    price: 172.35,
    yield: 2.9,
    sma200: "below",
    tags: ["Consumer Defensive", "Dividend Growth"],
  },
  {
    ticker: "XOM",
    name: "Exxon Mobil Corp.",
    sector: "Energy",
    price: 107.89,
    yield: 3.5,
    sma200: "below",
    tags: ["Energy", "Value"],
  },
];

export default function SecuritiesPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Securities</h1>
            <p className="text-muted-foreground">
              Browse and analyze dividend stocks.
            </p>
          </div>
          
          <div className="w-full md:w-auto flex gap-2">
            <div className="relative flex-1 md:w-[320px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search securities..."
                className="w-full pl-8"
              />
            </div>
            <Button>
              <LineChart className="mr-2 h-4 w-4" />
              AI Analyze
            </Button>
          </div>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticker</TableHead>
                <TableHead className="hidden md:table-cell">Name</TableHead>
                <TableHead className="hidden lg:table-cell">Sector</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Yield</TableHead>
                <TableHead>Signal</TableHead>
                <TableHead className="hidden xl:table-cell">Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {securities.map((security) => (
                <TableRow key={security.ticker}>
                  <TableCell className="font-medium">
                    <Link href={`/securities/${security.ticker}`} className="hover:underline">
                      {security.ticker}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{security.name}</TableCell>
                  <TableCell className="hidden lg:table-cell">{security.sector}</TableCell>
                  <TableCell>${security.price.toFixed(2)}</TableCell>
                  <TableCell>{security.yield.toFixed(1)}%</TableCell>
                  <TableCell>
                    <Badge 
                      variant={security.sma200 === "below" ? "default" : "outline"}
                      className={security.sma200 === "below" ? "bg-green-600" : ""}
                    >
                      {security.sma200 === "below" ? (
                        <ArrowUpRight className="mr-1 h-3 w-3" />
                      ) : (
                        <AlertCircle className="mr-1 h-3 w-3" />
                      )}
                      {security.sma200 === "below" ? "Buy" : "Hold"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {security.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </ProtectedRoute>
  );
}