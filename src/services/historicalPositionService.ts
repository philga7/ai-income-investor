import { yahooFinanceApi, HistoricalQuote } from '@/lib/financial/api/yahoo';
import { PortfolioSecurity } from './portfolioService';

export interface HistoricalPositionData {
  date: string;
  value: number;
  cost: number;
  gainLoss: number;
  gainLossPercentage: number;
}

export interface HistoricalPositionDataWithSMA extends HistoricalPositionData {
  price: number;
  sma50?: number;
  sma200?: number;
}

export interface PositionPerformanceMetrics {
  totalGainLoss: number;
  averageGainLossPercentage: number;
  maxGainLoss: number;
  maxGainLossPercentage: number;
  minGainLoss: number;
  minGainLossPercentage: number;
}

// Helper function to calculate Simple Moving Average
function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(NaN); // Not enough data for SMA
    } else {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  
  return sma;
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

  async getHistoricalPositionDataWithSMA(
    security: PortfolioSecurity,
    months: number = 6
  ): Promise<HistoricalPositionDataWithSMA[]> {
    try {
      // Calculate start date (6 months ago)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      // Fetch historical data from Yahoo Finance
      const historicalData = await yahooFinanceApi.historical(security.security.ticker, {
        period1: startDate,
        period2: endDate,
        interval: '1d'
      });

      // Extract prices for SMA calculation
      const prices = historicalData.map((quote: HistoricalQuote) => quote.close);
      const sma50 = calculateSMA(prices, 50);
      const sma200 = calculateSMA(prices, 200);

      // Transform the data into our format with SMA values
      return historicalData.map((quote: HistoricalQuote, index: number) => ({
        date: quote.date.toISOString(),
        value: security.shares * quote.close,
        cost: security.shares * security.average_cost,
        gainLoss: (security.shares * quote.close) - (security.shares * security.average_cost),
        gainLossPercentage: ((quote.close - security.average_cost) / security.average_cost) * 100,
        price: quote.close,
        sma50: sma50[index] || undefined,
        sma200: sma200[index] || undefined
      }));
    } catch (error) {
      console.error('Error fetching historical position data with SMA:', error);
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