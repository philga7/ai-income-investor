"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

interface RecommendedStock {
  ticker: string;
  name: string;
  price: number;
  yield: number;
  sma200: "above" | "below";
  tags: string[];
}

const recommendedStocks: RecommendedStock[] = [
  {
    ticker: "ABBV",
    name: "AbbVie Inc.",
    price: 165.42,
    yield: 3.8,
    sma200: "below",
    tags: ["Healthcare", "Value"],
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corp.",
    price: 410.78,
    yield: 0.8,
    sma200: "below",
    tags: ["Technology", "Growth"],
  },
  {
    ticker: "PEP",
    name: "PepsiCo Inc.",
    price: 172.35,
    yield: 2.9,
    sma200: "below",
    tags: ["Consumer Defensive", "Dividend Growth"],
  },
  {
    ticker: "O",
    name: "Realty Income Corp.",
    price: 53.67,
    yield: 5.4,
    sma200: "above",
    tags: ["REIT", "Monthly Dividend"],
  },
  {
    ticker: "XOM",
    name: "Exxon Mobil Corp.",
    price: 107.89,
    yield: 3.5,
    sma200: "below",
    tags: ["Energy", "Value"],
  },
];

export function RecommendedStocks() {
  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Recommended Stocks</CardTitle>
          <CardDescription>AI-powered recommendations</CardDescription>
        </div>
        <Sparkles className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Yield</TableHead>
              <TableHead>Signal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recommendedStocks.map((stock) => (
              <TableRow key={stock.ticker}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{stock.ticker}</span>
                    <span className="text-xs text-muted-foreground truncate">{stock.name}</span>
                  </div>
                </TableCell>
                <TableCell>${stock.price.toFixed(2)}</TableCell>
                <TableCell>{stock.yield.toFixed(1)}%</TableCell>
                <TableCell>
                  <Badge 
                    variant={stock.sma200 === "below" ? "default" : "outline"}
                    className={stock.sma200 === "below" ? "bg-green-600" : ""}
                  >
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                    {stock.sma200 === "below" ? "Buy" : "Hold"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}