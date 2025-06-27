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
      returnOnEquity?: number;
      returnOnAssets?: number;
      profitMargin?: number;
      operatingMargin?: number;
      debtToEquity?: number;
      currentRatio?: number;
      quickRatio?: number;
      freeCashFlow?: number;
      operatingCashFlow?: number;
      revenueGrowth?: number;
      earningsGrowth?: number;
    };
  };
  portfolioMetrics: {
    weightedAveragePE: number;
    weightedAverageForwardPE: number;
    weightedAverageBeta: number;
    weightedAverageROE: number;
    weightedAverageROA: number;
    weightedAverageProfitMargin: number;
    weightedAverageOperatingMargin: number;
    weightedAverageDebtToEquity: number;
    weightedAverageCurrentRatio: number;
    weightedAverageQuickRatio: number;
    totalFreeCashFlow: number;
    totalOperatingCashFlow: number;
    weightedAverageRevenueGrowth: number;
    weightedAverageEarningsGrowth: number;
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
          securityValues: {},
          portfolioMetrics: {
            weightedAveragePE: 0,
            weightedAverageForwardPE: 0,
            weightedAverageBeta: 0,
            weightedAverageROE: 0,
            weightedAverageROA: 0,
            weightedAverageProfitMargin: 0,
            weightedAverageOperatingMargin: 0,
            weightedAverageDebtToEquity: 0,
            weightedAverageCurrentRatio: 0,
            weightedAverageQuickRatio: 0,
            totalFreeCashFlow: 0,
            totalOperatingCashFlow: 0,
            weightedAverageRevenueGrowth: 0,
            weightedAverageEarningsGrowth: 0
          }
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
        securityValues: {},
        portfolioMetrics: {
          weightedAveragePE: 0,
          weightedAverageForwardPE: 0,
          weightedAverageBeta: 0,
          weightedAverageROE: 0,
          weightedAverageROA: 0,
          weightedAverageProfitMargin: 0,
          weightedAverageOperatingMargin: 0,
          weightedAverageDebtToEquity: 0,
          weightedAverageCurrentRatio: 0,
          weightedAverageQuickRatio: 0,
          totalFreeCashFlow: 0,
          totalOperatingCashFlow: 0,
          weightedAverageRevenueGrowth: 0,
          weightedAverageEarningsGrowth: 0
        }
      };
    }

    const securityValues: PortfolioValueMetrics['securityValues'] = {};
    let totalValue = 0;
    let totalCost = 0;
    let totalGainLoss = 0;

    // Calculate individual security values and totals
    portfolio.securities.forEach((security) => {
      const isCash = security.security.ticker === 'CASH';
      const price = isCash ? 1.00 : security.security.price;
      const value = security.shares * price;
      const cost = security.shares * security.average_cost;
      let gainLoss = 0;
      let gainLossPercentage = 0;
      let dayChange = 0;
      let dayChangePercentage = 0;

      if (!isCash) {
        gainLoss = value - cost;
        gainLossPercentage = cost > 0 ? (gainLoss / cost) * 100 : 0;
        const prevClose = security.security.prev_close || security.security.price;
        dayChange = security.security.price - prevClose;
        dayChangePercentage = prevClose > 0 ? (dayChange / prevClose) * 100 : 0;
        totalGainLoss += gainLoss;
      }
      // For CASH, gain/loss and day change are always 0

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
        beta: security.security.beta || 0,
        returnOnEquity: security.security.return_on_equity,
        returnOnAssets: security.security.return_on_assets,
        profitMargin: security.security.profit_margins,
        operatingMargin: security.security.operating_margins,
        debtToEquity: security.security.debt_to_equity,
        currentRatio: security.security.current_ratio,
        quickRatio: security.security.quick_ratio,
        freeCashFlow: security.security.free_cash_flow,
        operatingCashFlow: security.security.operating_cash_flow,
        revenueGrowth: security.security.revenue_growth,
        earningsGrowth: security.security.earnings_growth
      };

      totalValue += value;
      totalCost += cost;
    });

    const totalGainLossPercentage = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    // Calculate weighted averages for portfolio metrics
    const portfolioMetrics = this.calculatePortfolioMetrics(securityValues, totalValue);

    return {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercentage,
      securityValues,
      portfolioMetrics
    };
  },

  calculatePortfolioMetrics(
    securityValues: PortfolioValueMetrics['securityValues'],
    totalValue: number
  ): PortfolioValueMetrics['portfolioMetrics'] {
    let weightedPE = 0;
    let weightedForwardPE = 0;
    let weightedBeta = 0;
    let weightedROE = 0;
    let weightedROA = 0;
    let weightedProfitMargin = 0;
    let weightedOperatingMargin = 0;
    let weightedDebtToEquity = 0;
    let weightedCurrentRatio = 0;
    let weightedQuickRatio = 0;
    let totalFreeCashFlow = 0;
    let totalOperatingCashFlow = 0;
    let weightedRevenueGrowth = 0;
    let weightedEarningsGrowth = 0;

    Object.values(securityValues).forEach((security) => {
      const weight = security.value / totalValue;
      
      weightedPE += (security.peRatio || 0) * weight;
      weightedForwardPE += (security.forwardPE || 0) * weight;
      weightedBeta += (security.beta || 0) * weight;
      weightedROE += (security.returnOnEquity || 0) * weight;
      weightedROA += (security.returnOnAssets || 0) * weight;
      weightedProfitMargin += (security.profitMargin || 0) * weight;
      weightedOperatingMargin += (security.operatingMargin || 0) * weight;
      weightedDebtToEquity += (security.debtToEquity || 0) * weight;
      weightedCurrentRatio += (security.currentRatio || 0) * weight;
      weightedQuickRatio += (security.quickRatio || 0) * weight;
      totalFreeCashFlow += security.freeCashFlow || 0;
      totalOperatingCashFlow += security.operatingCashFlow || 0;
      weightedRevenueGrowth += (security.revenueGrowth || 0) * weight;
      weightedEarningsGrowth += (security.earningsGrowth || 0) * weight;
    });

    return {
      weightedAveragePE: weightedPE,
      weightedAverageForwardPE: weightedForwardPE,
      weightedAverageBeta: weightedBeta,
      weightedAverageROE: weightedROE,
      weightedAverageROA: weightedROA,
      weightedAverageProfitMargin: weightedProfitMargin,
      weightedAverageOperatingMargin: weightedOperatingMargin,
      weightedAverageDebtToEquity: weightedDebtToEquity,
      weightedAverageCurrentRatio: weightedCurrentRatio,
      weightedAverageQuickRatio: weightedQuickRatio,
      totalFreeCashFlow,
      totalOperatingCashFlow,
      weightedAverageRevenueGrowth: weightedRevenueGrowth,
      weightedAverageEarningsGrowth: weightedEarningsGrowth
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