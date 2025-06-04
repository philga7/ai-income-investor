import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SecurityQuote } from '../src/services/financialService';

export function PriceDataTest() {
  const [symbol, setSymbol] = useState('');
  const [priceData, setPriceData] = useState<SecurityQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPriceData = async () => {
    if (!symbol) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/quotes?symbol=${encodeURIComponent(symbol)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch price data');
      }
      const data = await response.json();
      setPriceData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Price Data Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Enter symbol (e.g., AAPL)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && fetchPriceData()}
          />
          <Button onClick={fetchPriceData} disabled={loading || !symbol}>
            {loading ? 'Loading...' : 'Fetch Price'}
          </Button>
        </div>

        {error && (
          <div className="text-red-500 mb-4">
            {error}
          </div>
        )}

        {priceData && (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Current Price</p>
                <p className="text-lg">${priceData.price.regularMarketPrice?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Change</p>
                <p className={`text-lg ${(priceData.price.regularMarketChange ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {priceData.price.regularMarketChange?.toFixed(2)} ({priceData.price.regularMarketChangePercent?.toFixed(2)}%)
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Day Range</p>
                <p className="text-lg">
                  ${priceData.price.regularMarketDayLow?.toFixed(2)} - ${priceData.price.regularMarketDayHigh?.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Volume</p>
                <p className="text-lg">{priceData.price.regularMarketVolume?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 