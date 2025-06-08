"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { dividendService } from "@/services/dividendService";

interface DividendHistoryProps {
  ticker: string;
}

interface Dividend {
  currentDividend: number;
  yield: number;
  exDividendDate: string | null;
  payoutRatio: number;
  fiveYearAvgYield: number;
  growthRate: number;
}

export function DividendHistory({ ticker }: DividendHistoryProps) {
  const [dividend, setDividend] = useState<Dividend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDividendData = async () => {
      try {
        const data = await dividendService.fetchDividendData(ticker);
        setDividend(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dividend data');
      } finally {
        setLoading(false);
      }
    };

    fetchDividendData();
  }, [ticker]);

  if (loading) {
    return <div>Loading dividend data...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (!dividend) {
    return <div>No dividend data available</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dividend Information</CardTitle>
          <CardDescription>Current dividend metrics and growth</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium">Current Dividend</h4>
                <p className="text-2xl font-bold">${dividend.currentDividend.toFixed(2)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Dividend Yield</h4>
                <p className="text-2xl font-bold">{dividend.yield.toFixed(2)}%</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Payout Ratio</h4>
              <div className="flex items-center gap-2">
                <Progress value={dividend.payoutRatio} className="w-full" />
                <span className="text-sm">{dividend.payoutRatio.toFixed(1)}%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium">5-Year Average Yield</h4>
                <p className="text-lg">{dividend.fiveYearAvgYield.toFixed(2)}%</p>
              </div>
              <div>
                <h4 className="text-sm font-medium">Growth Rate</h4>
                <p className={`text-lg ${dividend.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {dividend.growthRate >= 0 ? '+' : ''}{dividend.growthRate.toFixed(2)}%
                </p>
              </div>
            </div>

            {dividend.exDividendDate && (
              <div>
                <h4 className="text-sm font-medium">Next Ex-Dividend Date</h4>
                <p className="text-lg">{new Date(dividend.exDividendDate).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}