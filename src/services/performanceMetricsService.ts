import { Portfolio } from './portfolioService';

export interface PerformanceMetrics {
  timeWeightedReturn: {
    daily: number;
    weekly: number;
    monthly: number;
    quarterly: number;
    yearly: number;
    ytd: number;
  };
  riskMetrics: {
    volatility: number;
    sharpeRatio: number;
    sortinoRatio: number;
    maxDrawdown: number;
  };
  relativePerformance: {
    vsSpx500: number;
    vsVti: number;
    vsVym: number;
  };
  sectorAllocation: {
    [sector: string]: {
      percentage: number;
      value: number;
      performance: number;
    };
  };
}

export const performanceMetricsService = {
  calculatePerformanceMetrics(portfolio: Portfolio): PerformanceMetrics {
    // For now, return mock data since we need historical price data
    // TODO: Implement actual calculations when historical data is available
    return {
      timeWeightedReturn: {
        daily: 0.5,
        weekly: 1.2,
        monthly: 3.5,
        quarterly: 8.2,
        yearly: 15.7,
        ytd: 12.3
      },
      riskMetrics: {
        volatility: 12.5,
        sharpeRatio: 1.8,
        sortinoRatio: 2.1,
        maxDrawdown: -8.3
      },
      relativePerformance: {
        vsSpx500: 2.5,
        vsVti: 1.8,
        vsVym: 0.5
      },
      sectorAllocation: this.calculateSectorAllocation(portfolio)
    };
  },

  calculateSectorAllocation(portfolio: Portfolio): PerformanceMetrics['sectorAllocation'] {
    const sectorAllocation: PerformanceMetrics['sectorAllocation'] = {};
    let totalValue = 0;

    // Calculate total portfolio value
    portfolio.securities.forEach(security => {
      totalValue += security.shares * security.security.price;
    });

    // Calculate sector allocations
    portfolio.securities.forEach(security => {
      const sector = security.security.sector;
      const value = security.shares * security.security.price;
      const percentage = (value / totalValue) * 100;

      if (!sectorAllocation[sector]) {
        sectorAllocation[sector] = {
          percentage: 0,
          value: 0,
          performance: 0
        };
      }

      sectorAllocation[sector].percentage += percentage;
      sectorAllocation[sector].value += value;
      // TODO: Calculate actual sector performance when historical data is available
      sectorAllocation[sector].performance = 0;
    });

    return sectorAllocation;
  },

  formatPercentage(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: 'always'
    }).format(value / 100);
  }
}; 