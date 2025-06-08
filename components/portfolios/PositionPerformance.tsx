import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PortfolioSecurity } from "@/services/portfolioService";
import { HistoricalPositionData, PositionPerformanceMetrics, historicalPositionService } from "@/src/services/historicalPositionService";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface PositionPerformanceProps {
  security: PortfolioSecurity;
}

export function PositionPerformance({ security }: PositionPerformanceProps) {
  const [historicalData, setHistoricalData] = useState<HistoricalPositionData[]>([]);
  const [metrics, setMetrics] = useState<PositionPerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get data for the last year
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        
        const data = await historicalPositionService.getHistoricalPositionData(
          security,
          startDate,
          endDate
        );
        
        setHistoricalData(data);
        setMetrics(historicalPositionService.calculatePositionPerformanceMetrics(data));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch historical data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [security]);

  if (loading) {
    return <div>Loading historical data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!metrics || historicalData.length === 0) {
    return <div>No historical data available</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Position Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chart">
          <TabsList>
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart">
            <div className="h-[300px]">
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
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#2563eb" 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="metrics">
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 