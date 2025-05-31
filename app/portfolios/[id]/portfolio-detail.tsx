"use client"

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from '@/lib/auth';
import { portfolioAnalyticsService } from "@/src/services/portfolioAnalyticsService";
import { PortfolioPerformance } from "@/components/portfolios/PortfolioPerformance";
import { PortfolioSecurities } from "@/components/portfolios/PortfolioSecurities";
import { PortfolioHeader } from "@/components/portfolios/PortfolioHeader";

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  securities: PortfolioSecurity[];
}

interface PortfolioSecurity {
  id: string;
  portfolio_id: string;
  security_id: string;
  shares: number;
  average_cost: number;
  security: {
    id: string;
    ticker: string;
    name: string;
    sector: string;
    price: number;
    yield: number;
    sma200: "above" | "below";
    tags: string[];
    dividendGrowth5yr: number;
  };
}

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
      const response = await fetch(`/api/portfolios/${portfolioId}/securities`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch securities');
      }

      const data = await response.json();
      setSecurities(data);
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
      <PortfolioHeader portfolio={portfolio} onPortfolioUpdated={handlePortfolioUpdated} />
      <PortfolioPerformance portfolio={portfolio} />
      <PortfolioSecurities
        securities={portfolio.securities}
        portfolioId={portfolio.id}
        onSecurityDeleted={handleSecurityDeleted}
      />
    </div>
  );
} 