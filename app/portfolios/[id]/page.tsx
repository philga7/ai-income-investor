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
import { useParams } from "next/navigation";
import { PortfolioSecurityChart } from "@/components/portfolios/portfolio-security-chart";
import { PositionCalculator } from "@/components/portfolios/position-calculator";

export default function PortfolioDetail() {
  const params = useParams();
  const portfolioId = params.id as string;
  
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
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <DollarSign className="mr-2 h-4 w-4" />
              Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${portfolio.value.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Updated just now</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <PieChart className="mr-2 h-4 w-4" />
              Dividend Yield
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolio.yield.toFixed(2)}%</div>
            <div className="text-sm text-muted-foreground">
              ${portfolio.projectedAnnualDividends.toLocaleString()} yearly income
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <BarChart4 className="mr-2 h-4 w-4" />
              YTD Dividends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${portfolio.ytdDividends.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">
              {((portfolio.ytdDividends / portfolio.projectedAnnualDividends) * 100).toFixed(0)}% of annual projection
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="securities">
        <TabsList>
          <TabsTrigger value="securities">Securities</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="dividends">Dividends</TabsTrigger>
          <TabsTrigger value="calculator">Position Calculator</TabsTrigger>
        </TabsList>
        
        <TabsContent value="securities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Securities</CardTitle>
              <CardDescription>
                Manage your portfolio holdings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticker</TableHead>
                    <TableHead className="hidden md:table-cell">Shares</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="hidden lg:table-cell">Value</TableHead>
                    <TableHead className="hidden lg:table-cell">Yield</TableHead>
                    <TableHead>Signal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securities.map((security) => (
                    <TableRow key={security.ticker}>
                      <TableCell className="font-medium">
                        <Link href={`/securities/${security.ticker}`} className="hover:underline">
                          <div>
                            {security.ticker}
                            <div className="text-xs text-muted-foreground md:hidden">
                              {security.shares} shares
                            </div>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{security.shares}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>${security.price.toFixed(2)}</span>
                          <span className={`text-xs ${security.price > security.costBasis ? 'text-green-500' : 'text-red-500'}`}>
                            {security.price > security.costBasis ? (
                              <span className="flex items-center">
                                <ArrowUpRight className="mr-1 h-3 w-3" />
                                {(((security.price - security.costBasis) / security.costBasis) * 100).toFixed(1)}%
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <ArrowDownRight className="mr-1 h-3 w-3" />
                                {(((security.costBasis - security.price) / security.costBasis) * 100).toFixed(1)}%
                              </span>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">${security.value.toLocaleString()}</TableCell>
                      <TableCell className="hidden lg:table-cell">{security.yield.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Badge 
                          variant={security.signalType === "buy" ? "default" : (security.signalType === "sell" ? "destructive" : "outline")}
                          className={security.signalType === "buy" ? "bg-green-600" : ""}
                        >
                          {security.signalType === "buy" ? (
                            <ArrowUpRight className="mr-1 h-3 w-3" />
                          ) : security.signalType === "sell" ? (
                            <AlertCircle className="mr-1 h-3 w-3" />
                          ) : (
                            <></>
                          )}
                          {security.signalType.charAt(0).toUpperCase() + security.signalType.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Analysis</CardTitle>
              <CardDescription>
                AI-powered insights and recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="text-lg font-medium mb-2">Current Portfolio Overview</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your portfolio has a good dividend yield of 3.85% which is above the S&P 500 average of 1.5%. 
                  The portfolio contains 25 securities with a strong focus on dividend growth stocks. 
                </p>
                
                <h4 className="text-md font-medium mb-2">Recommendations:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <ArrowUpRight className="mr-2 h-4 w-4 text-green-500 mt-0.5" />
                    <span>
                      <strong>Increase exposure to utilities</strong> - Your portfolio is underweight in utilities (4% vs. target 8%). 
                      Consider adding positions in NEE or SO.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <ArrowDownRight className="mr-2 h-4 w-4 text-red-500 mt-0.5" />
                    <span>
                      <strong>Reduce VZ position</strong> - Currently 5.2% of your portfolio is in VZ, which has cut its dividend in the past. 
                      Consider trimming to 2.5% to reduce risk.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <DollarSign className="mr-2 h-4 w-4 text-blue-500 mt-0.5" />
                    <span>
                      <strong>Add SCHD for diversification</strong> - This ETF would add exposure to 100+ quality dividend payers while 
                      maintaining your yield targets.
                    </span>
                  </li>
                </ul>
              </div>
              
              <PortfolioSecurityChart />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="dividends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dividend Calendar</CardTitle>
              <CardDescription>
                Upcoming dividend payments for your portfolio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { month: "January", amount: 1245.67 },
                    { month: "February", amount: 945.32 },
                    { month: "March", amount: 1102.45 },
                    { month: "April", amount: 1245.67 },
                    { month: "May", amount: 945.32 },
                    { month: "June", amount: 1102.45 },
                    { month: "July", amount: 1245.67 },
                    { month: "August", amount: 945.32 },
                    { month: "September", amount: 1102.45 },
                    { month: "October", amount: 1245.67 },
                    { month: "November", amount: 945.32 },
                    { month: "December", amount: 1102.45 },
                  ].map((item) => (
                    <div key={item.month} className="border rounded-lg p-3">
                      <div className="text-sm text-muted-foreground">{item.month}</div>
                      <div className="text-lg font-semibold">${item.amount.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Dividend Growth</CardTitle>
              <CardDescription>
                Year-over-year dividend growth by security.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Security</TableHead>
                    <TableHead>Current Yield</TableHead>
                    <TableHead>5yr Growth Rate</TableHead>
                    <TableHead>Annual Income</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securities.map((security) => (
                    <TableRow key={`${security.ticker}-dividend`}>
                      <TableCell>{security.ticker}</TableCell>
                      <TableCell>{security.yield.toFixed(1)}%</TableCell>
                      <TableCell>{(Math.random() * 15).toFixed(1)}%</TableCell>
                      <TableCell>${security.annualDividend.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="calculator">
          <Card>
            <CardHeader>
              <CardTitle>Position Calculator</CardTitle>
              <CardDescription>
                Calculate position size based on your portfolio rules.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PositionCalculator portfolioValue={portfolio.value} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}