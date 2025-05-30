'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface DividendHistoryProps {
  ticker: string;
}

export function DividendHistory({ ticker }: DividendHistoryProps) {
  // Mock data - replace with real data from your API
  const dividends = [
    {
      date: '2024-03-15',
      amount: 0.75,
      yield: 2.8,
      growth: 5.2,
      status: 'upcoming'
    },
    {
      date: '2023-12-15',
      amount: 0.71,
      yield: 2.7,
      growth: 4.8,
      status: 'paid'
    },
    {
      date: '2023-09-15',
      amount: 0.68,
      yield: 2.6,
      growth: 4.5,
      status: 'paid'
    },
    {
      date: '2023-06-15',
      amount: 0.65,
      yield: 2.5,
      growth: 4.2,
      status: 'paid'
    },
    {
      date: '2023-03-15',
      amount: 0.62,
      yield: 2.4,
      growth: 4.0,
      status: 'paid'
    }
  ];

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