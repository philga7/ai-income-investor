import { yahooFinanceApi, HistoricalQuote } from '@/lib/financial/api/yahoo';
import { PortfolioSecurity } from './portfolioService';

export interface HistoricalPositionData {
  date: string;
  value: number;
  cost: number;
  gainLoss: number;
  gainLossPercentage: number;
}

export interface PositionPerformanceMetrics {
  totalGainLoss: number;
  averageGainLossPercentage: number;
  maxGainLoss: number;
  maxGainLossPercentage: number;
  minGainLoss: number;
  minGainLossPercentage: number;
}

export const historicalPositionService = {
  async getHistoricalPositionData(
    security: PortfolioSecurity,
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<HistoricalPositionData[]> {
    try {
      // Fetch historical data from Yahoo Finance
      const historicalData = await yahooFinanceApi.historical(security.security.ticker, {
        period1: startDate,
        period2: endDate,
        interval: '1d'
      });

      // Transform the data into our format
      return historicalData.map((quote: HistoricalQuote) => ({
        date: quote.date.toISOString(),
        value: security.shares * quote.close,
        cost: security.shares * security.average_cost,
        gainLoss: (security.shares * quote.close) - (security.shares * security.average_cost),
        gainLossPercentage: ((quote.close - security.average_cost) / security.average_cost) * 100
      }));
    } catch (error) {
      console.error('Error fetching historical position data:', error);
      throw error;
    }
  },

  calculatePositionPerformanceMetrics(
    historicalData: HistoricalPositionData[]
  ): PositionPerformanceMetrics {
    if (historicalData.length === 0) {
      return {
        totalGainLoss: 0,
        averageGainLossPercentage: 0,
        maxGainLoss: 0,
        maxGainLossPercentage: 0,
        minGainLoss: 0,
        minGainLossPercentage: 0
      };
    }

    const gainLosses = historicalData.map(data => data.gainLoss);
    const gainLossPercentages = historicalData.map(data => data.gainLossPercentage);

    return {
      totalGainLoss: gainLosses.reduce((sum, value) => sum + value, 0),
      averageGainLossPercentage: gainLossPercentages.reduce((sum, value) => sum + value, 0) / gainLossPercentages.length,
      maxGainLoss: Math.max(...gainLosses),
      maxGainLossPercentage: Math.max(...gainLossPercentages),
      minGainLoss: Math.min(...gainLosses),
      minGainLossPercentage: Math.min(...gainLossPercentages)
    };
  }
}; 