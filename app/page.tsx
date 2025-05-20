import Image from 'next/image';
import { PortfolioSummary } from '@/components/dashboard/portfolio-summary';
import { DividendTimeline } from '@/components/dashboard/dividend-timeline';
import { RecommendedStocks } from '@/components/dashboard/recommended-stocks';
import { MarketOverview } from '@/components/dashboard/market-overview';
import { DividendNews } from '@/components/dashboard/dividend-news';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
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
        <DividendTimeline />
        <MarketOverview />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <RecommendedStocks />
        <DividendNews />
      </div>
    </div>
  );
}