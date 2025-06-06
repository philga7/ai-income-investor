import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { format } from 'date-fns';

export function HistoricalDataTest() {
  const [symbol, setSymbol] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [interval, setInterval] = useState<'1d' | '1wk' | '1mo'>('1d');
  const [enabled, setEnabled] = useState(false);

  // Memoize the date objects to prevent unnecessary re-renders
  const startDateObj = useMemo(() => new Date(startDate), [startDate]);
  const endDateObj = useMemo(() => new Date(endDate), [endDate]);

  const { data, isLoading, error } = useHistoricalData({
    symbol,
    startDate: startDateObj,
    endDate: endDateObj,
    interval,
    enabled
  });

  const handleFetch = () => {
    if (!symbol) return;
    setEnabled(true);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Historical Data Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter symbol (e.g., AAPL)"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            />
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value as '1d' | '1wk' | '1mo')}
              className="px-3 py-2 border rounded-md"
            >
              <option value="1d">Daily</option>
              <option value="1wk">Weekly</option>
              <option value="1mo">Monthly</option>
            </select>
            <Button onClick={handleFetch} disabled={isLoading || !symbol}>
              {isLoading ? 'Loading...' : 'Fetch Data'}
            </Button>
          </div>

          {error && (
            <div className="text-red-500">
              {error.message}
            </div>
          )}

          {data && data.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">First Date</p>
                  <p className="text-lg">{format(new Date(data[0].date), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last Date</p>
                  <p className="text-lg">{format(new Date(data[data.length - 1].date), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Data Points</p>
                  <p className="text-lg">{data.length}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Price Change</p>
                  <p className={`text-lg ${data[data.length - 1].close >= data[0].close ? 'text-green-500' : 'text-red-500'}`}>
                    {((data[data.length - 1].close - data[0].close) / data[0].close * 100).toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-background">
                    <tr>
                      <th className="text-left p-2">Date</th>
                      <th className="text-right p-2">Open</th>
                      <th className="text-right p-2">High</th>
                      <th className="text-right p-2">Low</th>
                      <th className="text-right p-2">Close</th>
                      <th className="text-right p-2">Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((point, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">{format(new Date(point.date), 'MMM d, yyyy')}</td>
                        <td className="text-right p-2">${point.open.toFixed(2)}</td>
                        <td className="text-right p-2">${point.high.toFixed(2)}</td>
                        <td className="text-right p-2">${point.low.toFixed(2)}</td>
                        <td className="text-right p-2">${point.close.toFixed(2)}</td>
                        <td className="text-right p-2">{point.volume.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 