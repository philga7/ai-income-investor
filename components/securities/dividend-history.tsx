"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface DividendHistoryProps {
  ticker: string;
}

interface Dividend {
  date: string;
  amount: number;
  yield: number;
  growth: number;
  status: 'upcoming' | 'paid';
}

export function DividendHistory({ ticker }: DividendHistoryProps) {
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDividends = async () => {
      try {
        const response = await fetch(`/api/dividends?ticker=${ticker}`);
        if (!response.ok) {
          throw new Error('Failed to fetch dividend history');
        }
        const data = await response.json();
        setDividends(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch dividend history');
      } finally {
        setLoading(false);
      }
    };

    fetchDividends();
  }, [ticker]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming':
        return <Badge variant="default">Upcoming</Badge>;
      case 'paid':
        return <Badge variant="secondary">Paid</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading) {
    return <div>Loading dividend history...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dividend History</CardTitle>
          <CardDescription>Recent dividend payments and growth</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Yield</TableHead>
                <TableHead className="text-right">Growth</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dividends.map((dividend, index) => (
                <TableRow key={index}>
                  <TableCell>{new Date(dividend.date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">${dividend.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{dividend.yield.toFixed(1)}%</TableCell>
                  <TableCell className="text-right">
                    <span className={dividend.growth > 0 ? 'text-green-600' : 'text-red-600'}>
                      {dividend.growth > 0 ? '+' : ''}{dividend.growth.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {getStatusBadge(dividend.status)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dividend Growth</CardTitle>
            <CardDescription>5-year compound annual growth rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">4.7%</div>
            <p className="text-sm text-muted-foreground mt-1">
              Based on historical dividend payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payout Ratio</CardTitle>
            <CardDescription>Dividend sustainability metric</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">45%</div>
            <p className="text-sm text-muted-foreground mt-1">
              Based on trailing twelve months earnings
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}