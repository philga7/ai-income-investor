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
import { PlusCircle, TrendingUp, TrendingDown, Target } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { portfolioService } from '@/services/portfolioService';
import { Portfolio } from '@/services/portfolioService';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

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
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-6">
          <PortfolioSummary />
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Buys and Sells Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle>Buys and Sells</CardTitle>
                  <CardDescription>Top investment opportunities</CardDescription>
                </div>
                <Target className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-2">Technical Analysis Coming Soon</p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>• SMA-50 and SMA-200 calculations</p>
                      <p>• Stochastics indicator implementation</p>
                      <p>• Buy/sell range calculations</p>
                      <p>• Position sizing rules</p>
                      <p>• Technical analysis visualization</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Link href="/portfolios" className="block">
              <DividendTimeline />
            </Link>
            <Link href="/securities" className="block">
              <MarketOverview />
            </Link>
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
      )}
    </ProtectedRoute>
  );
}