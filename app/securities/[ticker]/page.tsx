"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpRight, 
  MessageSquare, 
  BarChart3,
  PieChart, 
  Briefcase, 
  Calendar, 
  LineChart, 
  Download,
  ArrowDownRight
} from "lucide-react";
import { useParams } from "next/navigation";
import { SecurityChart } from "@/components/securities/security-chart";
import { TechnicalIndicators } from "@/components/securities/technical-indicators";
import { DividendHistory } from "@/components/securities/dividend-history";

export default function SecurityDetail() {
  const params = useParams();
  const ticker = params.ticker as string;
  
  // This would be fetched from your API/database
  const security = {
    ticker: ticker,
    name: ticker === "MSFT" ? "Microsoft Corporation" : "Apple Inc.",
    sector: "Technology",
    industry: "Software",
    price: ticker === "MSFT" ? 410.78 : 188.32,
    prevClose: ticker === "MSFT" ? 408.42 : 186.75,
    open: ticker === "MSFT" ? 409.50 : 187.45,
    volume: ticker === "MSFT" ? 25123456 : 42568123,
    marketCap: ticker === "MSFT" ? 3050000000000 : 2950000000000,
    pe: ticker === "MSFT" ? 37.5 : 32.1,
    eps: ticker === "MSFT" ? 10.95 : 5.86,
    dividend: ticker === "MSFT" ? 3.00 : 0.96,
    yield: ticker === "MSFT" ? 0.8 : 0.5,
    payoutRatio: ticker === "MSFT" ? 28 : 16,
    exDividendDate: "2025-02-15",
    paymentDate: "2025-03-12",
    dividendGrowth5yr: ticker === "MSFT" ? 10.2 : 7.8,
    sma200: ticker === "MSFT" ? "below" : "above",
  };
  
  // Calculate price change
  const priceChange = security.price - security.prevClose;
  const priceChangePercent = (priceChange / security.prevClose) * 100;
  
  // Calculate trading signal
  const tradingSignal = security.sma200 === "below" ? "buy" : "hold";
  
  const [activeTab, setActiveTab] = useState("overview");
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{security.ticker}</h1>
            <Badge variant="outline">{security.sector}</Badge>
          </div>
          <p className="text-xl text-muted-foreground">
            {security.name}
          </p>
        </div>
        
        <div className="flex flex-col items-end">
          <div className="text-3xl font-bold">${security.price.toFixed(2)}</div>
          <div className={`flex items-center ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {priceChange >= 0 ? (
              <ArrowUpRight className="mr-1 h-4 w-4" />
            ) : (
              <ArrowDownRight className="mr-1 h-4 w-4" />
            )}
            <span>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
            </span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">Last updated: Today, 4:00 PM</div>
        </div>
      </div>
      
      <div className="flex justify-between gap-4 overflow-auto whitespace-nowrap rounded-lg border p-1">
        <Button 
          variant={tradingSignal === "buy" ? "default" : "outline"}
          className={tradingSignal === "buy" ? "bg-green-600 hover:bg-green-700" : ""}
        >
          <ArrowUpRight className="mr-2 h-4 w-4" />
          {tradingSignal === "buy" ? "Buy Signal" : "Hold"}
        </Button>
        
        <Button variant="outline">
          <Briefcase className="mr-2 h-4 w-4" />
          Add to Portfolio
        </Button>
        
        <Button variant="outline">
          <MessageSquare className="mr-2 h-4 w-4" />
          AI Analysis
        </Button>
        
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              Market Data
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Open</p>
              <p className="font-medium">${security.open.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Prev Close</p>
              <p className="font-medium">${security.prevClose.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Volume</p>
              <p className="font-medium">{security.volume.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Market Cap</p>
              <p className="font-medium">${(security.marketCap / 1000000000000).toFixed(2)}T</p>
            </div>
            <div>
              <p className="text-muted-foreground">P/E Ratio</p>
              <p className="font-medium">{security.pe.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">EPS</p>
              <p className="font-medium">${security.eps.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <PieChart className="mr-2 h-4 w-4" />
              Dividend Info
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Annual Dividend</p>
              <p className="font-medium">${security.dividend.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Yield</p>
              <p className="font-medium">{security.yield.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payout Ratio</p>
              <p className="font-medium">{security.payoutRatio}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">5yr Growth</p>
              <p className="font-medium">{security.dividendGrowth5yr.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              Upcoming Dividends
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Ex-Dividend Date</p>
              <p className="font-medium">{new Date(security.exDividendDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment Date</p>
              <p className="font-medium">{new Date(security.paymentDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment Schedule</p>
              <p className="font-medium">Quarterly</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="technical">Technical Analysis</TabsTrigger>
          <TabsTrigger value="dividend">Dividend History</TabsTrigger>
          <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Stock Chart</CardTitle>
              <CardDescription>
                6-month price history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SecurityChart ticker={ticker} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="technical">
          <Card>
            <CardHeader>
              <CardTitle>Technical Indicators</CardTitle>
              <CardDescription>
                Technical analysis for {ticker}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TechnicalIndicators ticker={ticker} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="dividend">
          <Card>
            <CardHeader>
              <CardTitle>Dividend History</CardTitle>
              <CardDescription>
                Historical dividend payments for {ticker}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DividendHistory ticker={ticker} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ai-analysis">
          <Card>
            <CardHeader>
              <CardTitle>AI Analysis</CardTitle>
              <CardDescription>
                AI-powered investment analysis for {ticker}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4">
                <h3 className="text-lg font-medium mb-2">Dividend Sustainability</h3>
                <div className="mb-4">
                  <Badge className="bg-green-600">Strong</Badge>
                  <p className="text-sm mt-2">
                    {ticker} has a strong record of dividend increases with a sustainable payout ratio of {security.payoutRatio}%.
                    Their 5-year dividend growth rate of {security.dividendGrowth5yr.toFixed(1)}% indicates a commitment to returning value to shareholders.
                  </p>
                </div>
                
                <h3 className="text-lg font-medium mb-2">Technical Outlook</h3>
                <div>
                  {security.sma200 === "below" ? (
                    <div>
                      <Badge className="bg-green-600">Bullish</Badge>
                      <p className="text-sm mt-2">
                        {ticker} is currently trading below its 200-day SMA, indicating a potential buying opportunity
                        according to our dividend investment strategy. The stochastic oscillator shows an oversold condition,
                        suggesting a potential upward reversal.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Badge variant="outline">Neutral</Badge>
                      <p className="text-sm mt-2">
                        {ticker} is currently trading above its 200-day SMA. While the underlying business fundamentals remain strong,
                        the current price suggests waiting for a better entry point from a valuation perspective.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="rounded-lg border p-4">
                <h3 className="text-lg font-medium mb-2">Investment Recommendation</h3>
                
                {security.sma200 === "below" ? (
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-bold flex items-center">
                      <ArrowUpRight className="mr-2 h-5 w-5 text-green-500" />
                      Buy
                    </span>
                    <Badge className="bg-green-600">Strong Conviction</Badge>
                  </div>
                ) : (
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-bold">Hold</span>
                    <Badge variant="outline">Moderate Conviction</Badge>
                  </div>
                )}
                
                <p className="text-sm mb-4">
                  {security.sma200 === "below" 
                    ? `${ticker} currently presents a buying opportunity with its price below the 200-day SMA. The company has strong fundamentals with a sustainable dividend policy and growth potential.`
                    : `While ${ticker} has strong fundamentals and dividend growth, the current price above the 200-day SMA suggests waiting for a better entry point. Continue holding if already in your portfolio.`
                  }
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Maximum Position Size (5% Rule)</span>
                    <span className="font-medium">5.0%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Initial Position Size (1/3 Rule)</span>
                    <span className="font-medium">1.67%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Target Price</span>
                    <span className="font-medium">${(security.price * 1.15).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}