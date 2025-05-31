import { Portfolio, PortfolioSecurity } from './portfolioService';
import { DividendMetrics, dividendService } from './dividendService';

export interface PortfolioValueMetrics {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  securityValues: {
    [securityId: string]: {
      value: number;
      cost: number;
      gainLoss: number;
      gainLossPercentage: number;
    };
  };
}

export interface PortfolioAnalytics {
  valueMetrics: PortfolioValueMetrics;
  dividendMetrics: DividendMetrics;
}

export const portfolioAnalyticsService = {
  calculatePortfolioAnalytics(portfolio: Portfolio): PortfolioAnalytics {
    return {
      valueMetrics: this.calculatePortfolioValue(portfolio),
      dividendMetrics: dividendService.calculateDividendMetrics(portfolio),
    };
  },

  calculatePortfolioValue(portfolio: Portfolio): PortfolioValueMetrics {
    const securityValues: PortfolioValueMetrics['securityValues'] = {};
    let totalValue = 0;
    let totalCost = 0;

    // Calculate individual security values and totals
    portfolio.securities.forEach((security) => {
      const value = security.shares * security.security.price;
      const cost = security.shares * security.average_cost;
      const gainLoss = value - cost;
      const gainLossPercentage = cost > 0 ? (gainLoss / cost) * 100 : 0;

      securityValues[security.security.id] = {
        value,
        cost,
        gainLoss,
        gainLossPercentage,
      };

      totalValue += value;
      totalCost += cost;
    });

    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercentage,
      securityValues,
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