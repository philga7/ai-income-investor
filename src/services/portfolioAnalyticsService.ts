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
      dayChange: number;
      dayChangePercentage: number;
      marketCap: number;
      peRatio: number;
      forwardPE: number;
      priceToSales: number;
      beta: number;
    };
  };
}

export interface PortfolioAnalytics {
  valueMetrics: PortfolioValueMetrics;
  dividendMetrics: DividendMetrics;
}

export const portfolioAnalyticsService = {
  calculatePortfolioAnalytics(portfolio: Portfolio): PortfolioAnalytics {
    if (!portfolio || !portfolio.securities) {
      return {
        valueMetrics: {
          totalValue: 0,
          totalCost: 0,
          totalGainLoss: 0,
          totalGainLossPercentage: 0,
          securityValues: {}
        },
        dividendMetrics: {
          totalAnnualDividend: 0,
          totalMonthlyDividend: 0,
          portfolioYield: 0,
          weightedAverageYield: 0,
          securityDividends: {}
        }
      };
    }

    return {
      valueMetrics: this.calculatePortfolioValue(portfolio),
      dividendMetrics: dividendService.calculateDividendMetrics(portfolio),
    };
  },

  calculatePortfolioValue(portfolio: Portfolio): PortfolioValueMetrics {
    if (!portfolio || !portfolio.securities) {
      return {
        totalValue: 0,
        totalCost: 0,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        securityValues: {}
      };
    }

    const securityValues: PortfolioValueMetrics['securityValues'] = {};
    let totalValue = 0;
    let totalCost = 0;

    // Calculate individual security values and totals
    portfolio.securities.forEach((security) => {
      const value = security.shares * security.security.price;
      const cost = security.shares * security.average_cost;
      const gainLoss = value - cost;
      const gainLossPercentage = cost > 0 ? (gainLoss / cost) * 100 : 0;
      
      // Calculate day change
      const prevClose = security.security.prev_close || security.security.price;
      const dayChange = security.security.price - prevClose;
      const dayChangePercentage = prevClose > 0 ? (dayChange / prevClose) * 100 : 0;

      securityValues[security.security.id] = {
        value,
        cost,
        gainLoss,
        gainLossPercentage,
        dayChange,
        dayChangePercentage,
        marketCap: security.security.market_cap || 0,
        peRatio: security.security.pe || 0,
        forwardPE: security.security.forward_pe || 0,
        priceToSales: security.security.price_to_sales_trailing_12_months || 0,
        beta: security.security.beta || 0
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