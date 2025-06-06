'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { PortfolioSummary } from '@/components/dashboard/portfolio-summary';
import { DividendTimeline } from '@/components/dashboard/dividend-timeline';
import { RecommendedStocks } from '@/components/dashboard/recommended-stocks';
import { MarketOverview } from '@/components/dashboard/market-overview';
import { DividendNews } from '@/components/dashboard/dividend-news';
import { PriceDataTest } from '@/components/PriceDataTest';
import { HistoricalDataTest } from '@/components/HistoricalDataTest';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { portfolioService } from '@/services/portfolioService';
import { Portfolio } from '@/services/portfolioService';

export default function Home() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPortfolio() {
      try {
        // Fetch the first portfolio for now - you might want to change this based on your requirements
        const portfolios = await portfolioService.getPortfolios();
        if (portfolios.length > 0) {
          setPortfolio(portfolios[0]);
        }
      } catch (error) {
        console.error('Error loading portfolio:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPortfolio();
  }, []);

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Your dividend investment overview and recommendations.
            </p>
          </div>
          <Link href="/portfolios/create">
            <Button className="w-full md:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Portfolio
            </Button>
          </Link>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <PortfolioSummary />
          {portfolio && <DividendTimeline portfolio={portfolio} />}
          <MarketOverview />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <RecommendedStocks />
          <DividendNews />
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>API Test Components</CardTitle>
              <CardDescription>
                Test components for Yahoo Finance API integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <PriceDataTest />
              <HistoricalDataTest />
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}