import { useState, useEffect } from 'react';

interface HistoricalDataPoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface UseHistoricalDataOptions {
  symbol: string;
  startDate: Date;
  endDate: Date;
  interval?: '1d' | '1wk' | '1mo';
  enabled?: boolean;
}

export function useHistoricalData({
  symbol,
  startDate,
  endDate,
  interval = '1d',
  enabled = true
}: UseHistoricalDataOptions) {
  const [data, setData] = useState<HistoricalDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !symbol) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          symbol,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          interval
        });

        const response = await fetch(`/api/historical?${params}`);
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to fetch historical data');
        }

        const result = await response.json();
        setData(result.map((point: any) => ({
          ...point,
          date: new Date(point.date)
        })));
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [symbol, startDate, endDate, interval, enabled]);

  return { data, isLoading, error };
} 