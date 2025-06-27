import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PortfolioSecurity } from "@/services/portfolioService";
import { HistoricalPositionDataWithSMA, PositionPerformanceMetrics, historicalPositionService } from "@/src/services/historicalPositionService";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

interface PositionPerformanceModalProps {
  security: PortfolioSecurity | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PositionPerformanceModal({ security, isOpen, onClose }: PositionPerformanceModalProps) {
  const [historicalData, setHistoricalData] = useState<HistoricalPositionDataWithSMA[]>([]);
  const [metrics, setMetrics] = useState<PositionPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!security) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get 12-month data with SMA calculations
        const data = await historicalPositionService.getHistoricalPositionDataWithSMA(security, 12);
        
        setHistoricalData(data);
        setMetrics(historicalPositionService.calculatePositionPerformanceMetrics(data));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch historical data');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && security) {
      fetchData();
    }
  }, [security, isOpen]);

  const handleClose = () => {
    onClose();
  };

  if (!security) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="font-bold">{security.security.ticker}</span>
            <span className="text-muted-foreground">- {security.security.name}</span>
          </DialogTitle>
          <DialogDescription>
            View detailed performance metrics and historical price data for this security position.
          </DialogDescription>
        </DialogHeader>
        
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading historical data...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-500">Error: {error}</p>
          </div>
        )}

        {!loading && !error && metrics && historicalData.length > 0 && (
          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chart">Chart</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chart" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-medium">Current Price</div>
                  <div className="text-lg font-bold">${security.security.price.toFixed(2)}</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-medium">50-day SMA</div>
                  <div className="text-lg font-bold">
                    ${historicalData[historicalData.length - 1]?.sma50?.toFixed(2) || 'N/A'}
                  </div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-medium">200-day SMA</div>
                  <div className="text-lg font-bold">
                    ${historicalData[historicalData.length - 1]?.sma200?.toFixed(2) || 'N/A'}
                  </div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="font-medium">Position Value</div>
                  <div className="text-lg font-bold">${(security.shares * security.security.price).toLocaleString()}</div>
                </div>
              </div>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(new Date(date), 'MMM d')}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                      formatter={(value: number, name: string) => [
                        `$${value.toLocaleString()}`, 
                        name === 'price' ? 'Price' : 
                        name === 'sma50' ? '50-day SMA' : 
                        name === 'sma200' ? '200-day SMA' : name
                      ]}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      dot={false}
                      name="Price"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sma50" 
                      stroke="#f59e0b" 
                      strokeWidth={1.5}
                      dot={false}
                      name="50-day SMA"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sma200" 
                      stroke="#dc2626" 
                      strokeWidth={1.5}
                      dot={false}
                      name="200-day SMA"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="metrics" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Total Gain/Loss</h4>
                  <p className="text-2xl font-bold">
                    ${metrics.totalGainLoss.toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Average Gain/Loss %</h4>
                  <p className="text-2xl font-bold">
                    {metrics.averageGainLossPercentage.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Max Gain</h4>
                  <p className="text-2xl font-bold text-green-600">
                    ${metrics.maxGainLoss.toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Max Loss</h4>
                  <p className="text-2xl font-bold text-red-600">
                    ${metrics.minGainLoss.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Shares</h4>
                  <p className="text-xl font-bold">{security.shares.toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Average Cost</h4>
                  <p className="text-xl font-bold">${security.average_cost.toFixed(2)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Cost Basis</h4>
                  <p className="text-xl font-bold">${(security.shares * security.average_cost).toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Market Value</h4>
                  <p className="text-xl font-bold">${(security.shares * security.security.price).toLocaleString()}</p>
                </div>
              </div>

              {/* Security Financial Metrics */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Security Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">P/E Ratio</h4>
                    <p className="text-lg font-bold">
                      {security.security.pe ? security.security.pe.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Forward P/E</h4>
                    <p className="text-lg font-bold">
                      {security.security.forward_pe ? security.security.forward_pe.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Market Cap</h4>
                    <p className="text-lg font-bold">
                      {security.security.market_cap ? 
                        security.security.market_cap >= 1e12 ? `${(security.security.market_cap / 1e12).toFixed(2)}T` :
                        security.security.market_cap >= 1e9 ? `${(security.security.market_cap / 1e9).toFixed(2)}B` :
                        security.security.market_cap >= 1e6 ? `${(security.security.market_cap / 1e6).toFixed(2)}M` :
                        security.security.market_cap.toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Beta</h4>
                    <p className="text-lg font-bold">
                      {security.security.beta ? security.security.beta.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Dividend Yield</h4>
                    <p className="text-lg font-bold text-green-600">
                      {security.security.yield ? `${security.security.yield.toFixed(2)}%` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Payout Ratio</h4>
                    <p className="text-lg font-bold">
                      {security.security.payout_ratio ? `${security.security.payout_ratio.toFixed(1)}%` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">52-Week High</h4>
                    <p className="text-lg font-bold">
                      {security.security.fifty_two_week_high ? `$${security.security.fifty_two_week_high.toFixed(2)}` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">52-Week Low</h4>
                    <p className="text-lg font-bold">
                      {security.security.fifty_two_week_low ? `$${security.security.fifty_two_week_low.toFixed(2)}` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Financial Metrics */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Financial Ratios</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Price to Sales</h4>
                    <p className="text-lg font-bold">
                      {security.security.price_to_sales_trailing_12_months ? 
                        security.security.price_to_sales_trailing_12_months.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Return on Equity</h4>
                    <p className="text-lg font-bold">
                      {security.security.return_on_equity ? 
                        `${security.security.return_on_equity.toFixed(2)}%` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Return on Assets</h4>
                    <p className="text-lg font-bold">
                      {security.security.return_on_assets ? 
                        `${security.security.return_on_assets.toFixed(2)}%` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Current Ratio</h4>
                    <p className="text-lg font-bold">
                      {security.security.current_ratio ? 
                        security.security.current_ratio.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Debt to Equity</h4>
                    <p className="text-lg font-bold">
                      {security.security.debt_to_equity ? 
                        security.security.debt_to_equity.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Profit Margin</h4>
                    <p className="text-lg font-bold">
                      {security.security.profit_margins ? 
                        `${(security.security.profit_margins * 100).toFixed(2)}%` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Revenue Growth</h4>
                    <p className="text-lg font-bold">
                      {security.security.revenue_growth ? 
                        `${(security.security.revenue_growth * 100).toFixed(2)}%` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Earnings Growth</h4>
                    <p className="text-lg font-bold">
                      {security.security.earnings_growth ? 
                        `${(security.security.earnings_growth * 100).toFixed(2)}%` : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
} 