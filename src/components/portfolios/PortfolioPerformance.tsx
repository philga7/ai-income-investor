import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Portfolio } from "@/services/portfolioService";
import { performanceMetricsService } from "@/services/performanceMetricsService";
import { BarChart4, TrendingUp, AlertTriangle, PieChart } from "lucide-react";

interface PortfolioPerformanceProps {
  portfolio: Portfolio;
}

export function PortfolioPerformance({ portfolio }: PortfolioPerformanceProps) {
  const metrics = performanceMetricsService.calculatePerformanceMetrics(portfolio);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="returns" className="space-y-4">
          <TabsList>
            <TabsTrigger value="returns">
              <TrendingUp className="h-4 w-4 mr-2" />
              Returns
            </TabsTrigger>
            <TabsTrigger value="risk">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Risk
            </TabsTrigger>
            <TabsTrigger value="relative">
              <BarChart4 className="h-4 w-4 mr-2" />
              Relative
            </TabsTrigger>
            <TabsTrigger value="sectors">
              <PieChart className="h-4 w-4 mr-2" />
              Sectors
            </TabsTrigger>
          </TabsList>

          <TabsContent value="returns" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Daily</p>
                <p className="text-2xl font-bold">
                  {performanceMetricsService.formatPercentage(metrics.timeWeightedReturn.daily)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Weekly</p>
                <p className="text-2xl font-bold">
                  {performanceMetricsService.formatPercentage(metrics.timeWeightedReturn.weekly)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly</p>
                <p className="text-2xl font-bold">
                  {performanceMetricsService.formatPercentage(metrics.timeWeightedReturn.monthly)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Quarterly</p>
                <p className="text-2xl font-bold">
                  {performanceMetricsService.formatPercentage(metrics.timeWeightedReturn.quarterly)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Yearly</p>
                <p className="text-2xl font-bold">
                  {performanceMetricsService.formatPercentage(metrics.timeWeightedReturn.yearly)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">YTD</p>
                <p className="text-2xl font-bold">
                  {performanceMetricsService.formatPercentage(metrics.timeWeightedReturn.ytd)}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Volatility</p>
                <p className="text-2xl font-bold">
                  {performanceMetricsService.formatPercentage(metrics.riskMetrics.volatility)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sharpe Ratio</p>
                <p className="text-2xl font-bold">{metrics.riskMetrics.sharpeRatio.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sortino Ratio</p>
                <p className="text-2xl font-bold">{metrics.riskMetrics.sortinoRatio.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Max Drawdown</p>
                <p className="text-2xl font-bold">
                  {performanceMetricsService.formatPercentage(metrics.riskMetrics.maxDrawdown)}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="relative" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">vs S&P 500</p>
                <p className="text-2xl font-bold">
                  {performanceMetricsService.formatPercentage(metrics.relativePerformance.vsSpx500)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">vs VTI</p>
                <p className="text-2xl font-bold">
                  {performanceMetricsService.formatPercentage(metrics.relativePerformance.vsVti)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">vs VYM</p>
                <p className="text-2xl font-bold">
                  {performanceMetricsService.formatPercentage(metrics.relativePerformance.vsVym)}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sectors" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(metrics.sectorAllocation).map(([sector, data]) => (
                <div key={sector} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{sector}</p>
                    <p className="text-xs text-muted-foreground">
                      {performanceMetricsService.formatPercentage(data.performance)}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    {data.percentage.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 