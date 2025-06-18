"use client"

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from '@/lib/auth';
import { portfolioAnalyticsService } from "@/src/services/portfolioAnalyticsService";
import { portfolioDataService } from "@/src/services/portfolioDataService";
import { PortfolioPerformance } from "@/components/portfolios/PortfolioPerformance";
import { PortfolioSecurities } from "@/components/portfolios/PortfolioSecurities";
import { PortfolioHeader } from "@/components/portfolios/PortfolioHeader";
import { PortfolioRebalancing } from "@/components/portfolios/PortfolioRebalancing";
import { BreadcrumbNav } from '@/components/ui/breadcrumb';
import { Portfolio, PortfolioSecurity } from "@/services/portfolioService";

interface PortfolioDetailProps {
  portfolioId: string;
  initialPortfolio?: Portfolio | null;
}

export function PortfolioDetail({ portfolioId, initialPortfolio }: PortfolioDetailProps) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(initialPortfolio || null);
  const [securities, setSecurities] = useState<PortfolioSecurity[]>([]);
  const [loading, setLoading] = useState(!initialPortfolio);
  const { session } = useAuth();
  const analytics = portfolio ? portfolioAnalyticsService.calculatePortfolioAnalytics(portfolio) : null;

  const fetchPortfolio = useCallback(async () => {
    if (!session?.access_token) {
      toast.error('You must be logged in to view portfolios');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch portfolio');
      }

      const data = await response.json();
      setPortfolio(data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch portfolio');
    } finally {
      setLoading(false);
    }
  }, [portfolioId, session]);

  const fetchSecurities = useCallback(async () => {
    if (!session?.access_token) {
      return;
    }

    try {
      // Use the new portfolioDataService to fetch and update securities
      const updatedSecurities = await portfolioDataService.updatePortfolioSecurities(portfolioId);
      setSecurities(updatedSecurities);
      setPortfolio(prev => prev ? { ...prev, securities: updatedSecurities } : null);
    } catch (error) {
      console.error('Error fetching securities:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch securities');
    }
  }, [portfolioId, session]);

  useEffect(() => {
    if (!initialPortfolio) {
      fetchPortfolio();
    }
    fetchSecurities();

    // Set up an interval to refresh securities data every 5 minutes
    const refreshInterval = setInterval(fetchSecurities, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [initialPortfolio, fetchPortfolio, fetchSecurities]);

  const handlePortfolioUpdated = () => {
    fetchPortfolio();
  };

  const handleSecurityDeleted = useCallback(() => {
    fetchSecurities();
  }, [fetchSecurities]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!portfolio) {
    return <div>Portfolio not found</div>;
  }

  return (
    <div className="space-y-6">
      <BreadcrumbNav items={[
        { label: 'Portfolios', href: '/portfolios' },
        { label: portfolio.name, href: `/portfolios/${portfolio.id}` }
      ]} />
      <PortfolioHeader portfolio={portfolio} onPortfolioUpdated={handlePortfolioUpdated} />
      <PortfolioPerformance portfolio={portfolio} />
      <PortfolioRebalancing portfolioId={portfolio.id} />
      <PortfolioSecurities
        securities={portfolio.securities}
        portfolioId={portfolio.id}
        onSecurityDeleted={handleSecurityDeleted}
      />
    </div>
  );
} 