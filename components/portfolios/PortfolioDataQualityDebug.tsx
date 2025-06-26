'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { PortfolioSecurity } from '@/services/portfolioService';

interface PortfolioDataQualityDebugProps {
  portfolioSecurities: PortfolioSecurity[];
}

export function PortfolioDataQualityDebug({ portfolioSecurities }: PortfolioDataQualityDebugProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const analysis = portfolioSecurities.map(ps => {
    const security = ps.security;
    const hasFinancialData = !!(security.total_cash || security.total_debt || security.current_ratio);
    const hasBalanceSheet = !!(security.total_assets || security.cash || security.inventory);
    const hasEarnings = !!security.earnings;
    const hasPrice = !!security.price;
    
    return {
      ticker: security.ticker,
      name: security.name,
      dataQuality: {
        price: hasPrice,
        financialData: hasFinancialData,
        balanceSheet: hasBalanceSheet,
        earnings: hasEarnings
      },
      completeness: [hasPrice, hasFinancialData, hasBalanceSheet, hasEarnings].filter(Boolean).length / 4 * 100,
      lastFetched: security.last_fetched
    };
  });

  const issues = analysis.filter(item => item.completeness < 100);
  const healthy = analysis.filter(item => item.completeness === 100);

  if (issues.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-green-800">
            <CheckCircle className="h-4 w-4" />
            Data Quality: All Good
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700">
            All {healthy.length} securities have complete fundamental data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          Data Quality Issues Detected
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{issues.length}</span> securities with missing data
            <span className="mx-2">•</span>
            <span className="font-medium text-foreground">{healthy.length}</span> healthy
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs"
          >
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>

        {isExpanded && (
          <div className="space-y-2">
            {issues.map((item) => (
              <div key={item.ticker} className="rounded border bg-muted/50 p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{item.ticker}</span>
                    <span className="text-xs text-muted-foreground ml-2">({item.name})</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.completeness.toFixed(0)}% complete
                  </Badge>
                </div>
                <div className="flex gap-1 mt-1">
                  <Badge variant={item.dataQuality.price ? "default" : "destructive"} className="text-xs">
                    Price
                  </Badge>
                  <Badge variant={item.dataQuality.financialData ? "default" : "destructive"} className="text-xs">
                    Financial
                  </Badge>
                  <Badge variant={item.dataQuality.balanceSheet ? "default" : "destructive"} className="text-xs">
                    Balance Sheet
                  </Badge>
                  <Badge variant={item.dataQuality.earnings ? "default" : "destructive"} className="text-xs">
                    Earnings
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Last updated: {item.lastFetched ? new Date(item.lastFetched).toLocaleString() : 'Never'}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-3 w-3" />
          Missing data may be due to Yahoo Finance API limitations
        </div>
      </CardContent>
    </Card>
  );
} 