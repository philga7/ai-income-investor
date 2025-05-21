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
import { SecurityChart } from "@/components/securities/security-chart";
import { TechnicalIndicators } from "@/components/securities/technical-indicators";
import { DividendHistory } from "@/components/securities/dividend-history";

// Add generateStaticParams for static export
export async function generateStaticParams() {
  // Return an array of tickers you want to pre-render
  return [
    { ticker: 'MSFT' },
    { ticker: 'AAPL' },
    { ticker: 'ABBV' },
    { ticker: 'PEP' },
    { ticker: 'O' },
    { ticker: 'XOM' }
  ];
}

interface PageProps {
  params: Promise<{ ticker: string }>;
}

export default async function SecurityDetail({ params }: PageProps) {
  const { ticker } = await params;
  
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
      
      <Tabs defaultValue="overview">
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
                AI-powered insights for {ticker}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>AI analysis content will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}