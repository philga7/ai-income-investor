"use client"

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from '@/lib/auth';
import { portfolioAnalyticsService } from "@/src/services/portfolioAnalyticsService";
import { portfolioDataService } from "@/src/services/portfolioDataService";
import { PortfolioPerformance } from "@/components/portfolios/PortfolioPerformance";
import { PortfolioSecurities } from "@/components/portfolios/PortfolioSecurities";
import { PortfolioHeader } from "@/components/portfolios/PortfolioHeader";
import { PortfolioRebalancing } from "@/components/portfolios/PortfolioRebalancing";
import { EnhancedAIAnalysis } from "@/components/portfolios/EnhancedAIAnalysis";
import { DividendTimingDashboard } from "@/components/portfolios/DividendTimingDashboard";
import { PortfolioDataQualityDebug } from "@/components/portfolios/PortfolioDataQualityDebug";
import { BreadcrumbNav } from '@/components/ui/breadcrumb';
import { Portfolio, PortfolioSecurity } from "@/services/portfolioService";

interface PortfolioDetailProps {
  portfolioId: string;
  initialPortfolio?: Portfolio | null;
}

export function PortfolioDetail({ portfolioId, initialPortfolio }: PortfolioDetailProps) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(initialPortfolio || null);
  const [loading, setLoading] = useState(!initialPortfolio);
  const { session, loading: authLoading } = useAuth();
  
  const analytics = portfolio ? portfolioAnalyticsService.calculatePortfolioAnalytics(portfolio) : null;

  // Use refs to track if we've already fetched data to prevent unnecessary re-fetches
  const hasInitialized = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Initial data loading - only run once
  useEffect(() => {
    if (hasInitialized.current) return;
    
    if (!initialPortfolio && !authLoading && session) {
      fetchPortfolio();
      hasInitialized.current = true;
    }
  }, [initialPortfolio, fetchPortfolio, session, authLoading]);

  // Set up refresh interval only when portfolio is loaded and tab is visible
  useEffect(() => {
    if (!portfolio || !hasInitialized.current) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval that only runs when tab is visible
    intervalRef.current = setInterval(() => {
      if (!document.hidden) {
        fetchPortfolio();
      }
    }, 5 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [portfolio, fetchPortfolio]);

  const handlePortfolioUpdated = () => {
    fetchPortfolio();
  };

  const handleSecurityDeleted = useCallback(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handleSecurityAdded = useCallback(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  if (authLoading) {
    return <div>Loading authentication...</div>;
  }

  if (loading) {
    return <div>Loading portfolio...</div>;
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
      
      {/* Ticker Listing and Add Security - moved to top */}
      <PortfolioSecurities
        securities={portfolio.securities}
        portfolioId={portfolio.id}
        onSecurityDeleted={handleSecurityDeleted}
        onSecurityAdded={handleSecurityAdded}
      />
      
      {/* Portfolio Performance - moved up */}
      {analytics && (
        <PortfolioPerformance portfolio={portfolio} />
      )}
      
      {/* Enhanced AI Analysis Button */}
      <div className="flex justify-end">
        <EnhancedAIAnalysis portfolioId={portfolio.id} />
      </div>
      
      {/* Dividend Timing Dashboard */}
      {analytics && (
        <DividendTimingDashboard portfolio={portfolio} />
      )}
      
      <PortfolioRebalancing portfolioId={portfolio.id} />
      
      <PortfolioDataQualityDebug portfolioSecurities={portfolio.securities} />
    </div>
  );
}