import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Portfolio } from "@/services/portfolioService";
import { portfolioAnalyticsService } from "@/src/services/portfolioAnalyticsService";
import { performanceMetricsService } from "@/src/services/performanceMetricsService";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface PortfolioAnalyticsProps {
  portfolio: Portfolio;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function PortfolioAnalytics({ portfolio }: PortfolioAnalyticsProps) {
  const analytics = portfolioAnalyticsService.calculatePortfolioAnalytics(portfolio);
  const performanceMetrics = performanceMetricsService.calculatePerformanceMetrics(portfolio);

  // Prepare sector allocation data for pie chart
  const sectorData = Object.entries(performanceMetrics.sectorAllocation).map(([sector, data]) => ({
    name: sector,
    value: data.percentage
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="sectors">Sector Analysis</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="financials">Financial Metrics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">
                    {portfolioAnalyticsService.formatCurrency(analytics.valueMetrics.totalValue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                  <p className="text-2xl font-bold">
                    {portfolioAnalyticsService.formatCurrency(analytics.valueMetrics.totalCost)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Gain/Loss</p>
                  <p className="text-2xl font-bold">
                    {portfolioAnalyticsService.formatCurrency(analytics.valueMetrics.totalGainLoss)}
                    <span className="text-sm ml-2">
                      ({portfolioAnalyticsService.formatPercentage(analytics.valueMetrics.totalGainLossPercentage)})
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Portfolio Yield</p>
                  <p className="text-2xl font-bold">
                    {portfolioAnalyticsService.formatPercentage(analytics.dividendMetrics.portfolioYield)}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sectors" className="space-y-4">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectorData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sectorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {Object.entries(performanceMetrics.sectorAllocation).map(([sector, data]) => (
                  <div key={sector}>
                    <p className="text-sm font-medium text-muted-foreground">{sector}</p>
                    <p className="text-xl font-bold">
                      {portfolioAnalyticsService.formatPercentage(data.percentage)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Value: {portfolioAnalyticsService.formatCurrency(data.value)}
                    </p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">YTD Return</p>
                  <p className="text-2xl font-bold">
                    {portfolioAnalyticsService.formatPercentage(performanceMetrics.timeWeightedReturn.ytd)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">1 Year Return</p>
                  <p className="text-2xl font-bold">
                    {portfolioAnalyticsService.formatPercentage(performanceMetrics.timeWeightedReturn.yearly)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sharpe Ratio</p>
                  <p className="text-2xl font-bold">
                    {performanceMetrics.riskMetrics.sharpeRatio.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Max Drawdown</p>
                  <p className="text-2xl font-bold">
                    {portfolioAnalyticsService.formatPercentage(performanceMetrics.riskMetrics.maxDrawdown)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">vs S&P 500</p>
                  <p className="text-2xl font-bold">
                    {portfolioAnalyticsService.formatPercentage(performanceMetrics.relativePerformance.vsSpx500)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Volatility</p>
                  <p className="text-2xl font-bold">
                    {portfolioAnalyticsService.formatPercentage(performanceMetrics.riskMetrics.volatility)}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="financials" className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. P/E Ratio</p>
                  <p className="text-2xl font-bold">
                    {Object.values(analytics.valueMetrics.securityValues).reduce((sum, sv) => sum + (sv.peRatio || 0), 0) / 
                     Object.keys(analytics.valueMetrics.securityValues).length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Beta</p>
                  <p className="text-2xl font-bold">
                    {Object.values(analytics.valueMetrics.securityValues).reduce((sum, sv) => sum + (sv.beta || 0), 0) / 
                     Object.keys(analytics.valueMetrics.securityValues).length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg. Market Cap</p>
                  <p className="text-2xl font-bold">
                    {portfolioAnalyticsService.formatCurrency(
                      Object.values(analytics.valueMetrics.securityValues).reduce((sum, sv) => sum + (sv.marketCap || 0), 0) / 
                      Object.keys(analytics.valueMetrics.securityValues).length || 0
                    )}
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 