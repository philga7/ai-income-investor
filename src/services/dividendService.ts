import { Portfolio, PortfolioSecurity } from './portfolioService';
import { supabase } from '@/lib/supabase';

export interface DividendMetrics {
  totalAnnualDividend: number;
  totalMonthlyDividend: number;
  portfolioYield: number;
  weightedAverageYield: number;
  securityDividends: {
    [securityId: string]: {
      annualDividend: number;
      monthlyDividend: number;
      yield: number;
      contributionToPortfolioYield: number;
      projectedAnnualDividend?: number;
      projectedMonthlyDividend?: number;
      projectedYield?: number;
      nextExDate?: string;
      nextPaymentDate?: string;
    };
  };
}

export interface ProjectedDividendMetrics {
  projectedAnnualDividend: number;
  projectedMonthlyDividend: number;
  projectedPortfolioYield: number;
  projectedSecurityDividends: {
    [securityId: string]: {
      projectedAnnualDividend: number;
      projectedMonthlyDividend: number;
      projectedYield: number;
      growthRate: number;
    };
  };
}

export const dividendService = {
  calculateDividendMetrics(portfolio: Portfolio): DividendMetrics {
    const securityDividends: DividendMetrics['securityDividends'] = {};
    let totalAnnualDividend = 0;
    let totalPortfolioValue = 0;
    let weightedYieldSum = 0;

    // Calculate individual security dividend metrics
    portfolio.securities.forEach((security) => {
      const marketValue = security.shares * security.security.price;
      const annualDividend = marketValue * (security.security.yield / 100);
      const monthlyDividend = annualDividend / 12;
      const contributionToPortfolioYield = (annualDividend / marketValue) * 100;

      // Calculate projected dividends based on historical growth rate
      const growthRate = security.security.dividendGrowth5yr || 0;
      const projectedAnnualDividend = annualDividend * (1 + growthRate / 100);
      const projectedMonthlyDividend = projectedAnnualDividend / 12;
      const projectedYield = (projectedAnnualDividend / marketValue) * 100;

      securityDividends[security.security.id] = {
        annualDividend,
        monthlyDividend,
        yield: security.security.yield,
        contributionToPortfolioYield,
        projectedAnnualDividend,
        projectedMonthlyDividend,
        projectedYield,
      };

      totalAnnualDividend += annualDividend;
      totalPortfolioValue += marketValue;
      weightedYieldSum += security.security.yield * (marketValue / totalPortfolioValue);
    });

    return {
      totalAnnualDividend,
      totalMonthlyDividend: totalAnnualDividend / 12,
      portfolioYield: totalPortfolioValue > 0 ? (totalAnnualDividend / totalPortfolioValue) * 100 : 0,
      weightedAverageYield: weightedYieldSum,
      securityDividends,
    };
  },

  calculateProjectedDividends(portfolio: Portfolio): ProjectedDividendMetrics {
    const projectedSecurityDividends: ProjectedDividendMetrics['projectedSecurityDividends'] = {};
    let projectedTotalAnnualDividend = 0;
    let totalPortfolioValue = 0;

    portfolio.securities.forEach((security) => {
      const marketValue = security.shares * security.security.price;
      const currentAnnualDividend = marketValue * (security.security.yield / 100);
      const growthRate = security.security.dividendGrowth5yr || 0;
      
      const projectedAnnualDividend = currentAnnualDividend * (1 + growthRate / 100);
      const projectedMonthlyDividend = projectedAnnualDividend / 12;
      const projectedYield = (projectedAnnualDividend / marketValue) * 100;

      projectedSecurityDividends[security.security.id] = {
        projectedAnnualDividend,
        projectedMonthlyDividend,
        projectedYield,
        growthRate,
      };

      projectedTotalAnnualDividend += projectedAnnualDividend;
      totalPortfolioValue += marketValue;
    });

    return {
      projectedAnnualDividend: projectedTotalAnnualDividend,
      projectedMonthlyDividend: projectedTotalAnnualDividend / 12,
      projectedPortfolioYield: totalPortfolioValue > 0 ? (projectedTotalAnnualDividend / totalPortfolioValue) * 100 : 0,
      projectedSecurityDividends,
    };
  },

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  },

  formatPercentage(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  },

  async getUpcomingDividends(portfolio: Portfolio) {
    const today = new Date();
    const { data: dividends, error } = await supabase
      .from('dividends')
      .select('*')
      .in('security_id', portfolio.securities.map(s => s.security.id))
      .gte('ex_date', today.toISOString())
      .order('ex_date', { ascending: true });

    if (error) {
      console.error('Error fetching upcoming dividends:', error);
      return [];
    }

    return dividends;
  },

  async getNextDividendDates(securityId: string) {
    const today = new Date();
    const { data: dividends, error } = await supabase
      .from('dividends')
      .select('*')
      .eq('security_id', securityId)
      .gte('ex_date', today.toISOString())
      .order('ex_date', { ascending: true })
      .limit(1);

    if (error) {
      console.error('Error fetching next dividend dates:', error);
      return null;
    }

    return dividends?.[0] || null;
  },

  async updateDividendDates(securityId: string, exDate: string, paymentDate: string) {
    const { error } = await supabase
      .from('dividends')
      .upsert({
        security_id: securityId,
        ex_date: exDate,
        payment_date: paymentDate,
        amount: 0, // This will be updated when the dividend amount is known
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating dividend dates:', error);
      throw error;
    }
  }
}; 