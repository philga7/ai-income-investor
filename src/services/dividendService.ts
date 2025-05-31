import { Portfolio, PortfolioSecurity } from './portfolioService';

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

      securityDividends[security.security.id] = {
        annualDividend,
        monthlyDividend,
        yield: security.security.yield,
        contributionToPortfolioYield,
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
}; 