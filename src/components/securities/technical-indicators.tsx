'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TechnicalIndicatorsProps {
  ticker: string;
}

export function TechnicalIndicators({ ticker }: TechnicalIndicatorsProps) {
  // Mock data - replace with real data from your API
  const indicators = {
    sma50: 105.23,
    sma200: 102.45,
    rsi: 58.32,
    macd: {
      value: 2.34,
      signal: 1.89,
      histogram: 0.45
    },
    stochastics: {
      k: 65.43,
      d: 62.18
    },
    bollingerBands: {
      upper: 110.23,
      middle: 105.45,
      lower: 100.67
    }
  };

  const getSignal = (value: number, threshold: number) => {
    if (value > threshold) return { label: 'Overbought', variant: 'destructive' as const };
    if (value < -threshold) return { label: 'Oversold', variant: 'default' as const };
    return { label: 'Neutral', variant: 'secondary' as const };
  };

  const rsiSignal = getSignal(indicators.rsi - 50, 20);
  const macdSignal = getSignal(indicators.macd.histogram, 0.5);
  const stochSignal = getSignal(indicators.stochastics.k - 50, 20);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Moving Averages</CardTitle>
            <CardDescription>Price trend indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Indicator</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Signal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>SMA-50</TableCell>
                  <TableCell className="text-right">${indicators.sma50.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={indicators.sma50 > indicators.sma200 ? 'default' : 'destructive'}>
                      {indicators.sma50 > indicators.sma200 ? 'Bullish' : 'Bearish'}
                    </Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>SMA-200</TableCell>
                  <TableCell className="text-right">${indicators.sma200.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">Reference</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Momentum Indicators</CardTitle>
            <CardDescription>Price momentum and strength</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Indicator</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Signal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>RSI (14)</TableCell>
                  <TableCell className="text-right">{indicators.rsi.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={rsiSignal.variant}>{rsiSignal.label}</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>MACD</TableCell>
                  <TableCell className="text-right">{indicators.macd.value.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={macdSignal.variant}>{macdSignal.label}</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Stochastics</TableCell>
                  <TableCell className="text-right">
                    K: {indicators.stochastics.k.toFixed(2)}<br />
                    D: {indicators.stochastics.d.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={stochSignal.variant}>{stochSignal.label}</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bollinger Bands</CardTitle>
          <CardDescription>Volatility and price channels</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Band</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Signal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Upper Band</TableCell>
                <TableCell className="text-right">${indicators.bollingerBands.upper.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="destructive">Resistance</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Middle Band</TableCell>
                <TableCell className="text-right">${indicators.bollingerBands.middle.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">Baseline</Badge>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Lower Band</TableCell>
                <TableCell className="text-right">${indicators.bollingerBands.lower.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="default">Support</Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 