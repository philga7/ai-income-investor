import { yahooFinanceClient } from './client';
import { YAHOO_FINANCE_CONFIG } from './config';
import type { 
  QuoteSummary, 
  YahooFinanceError, 
  BalanceSheetStatement, 
  CashflowStatement, 
  Earnings, 
  Price, 
  SummaryDetail, 
  FinancialData, 
  AssetProfile, 
  SearchResult, 
  YahooFinanceSearchResult, 
  YahooFinanceSearchQuote 
} from './types';

export interface HistoricalQuote {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose?: number;
}

// Export the main client
export { yahooFinanceClient };

// Export configuration
export { YAHOO_FINANCE_CONFIG };

// Export all types
export type {
  QuoteSummary,
  YahooFinanceError,
  BalanceSheetStatement,
  CashflowStatement,
  Earnings,
  Price,
  SummaryDetail,
  FinancialData,
  AssetProfile,
  SearchResult,
  YahooFinanceSearchResult,
  YahooFinanceSearchQuote
};

// Legacy API for backward compatibility
export const yahooFinanceApi = {
  async historical(symbol: string, options: { period1: Date; period2: Date; interval: '1d' | '1wk' | '1mo' }) {
    try {
      const params = new URLSearchParams({
        symbol,
        startDate: options.period1.toISOString(),
        endDate: options.period2.toISOString(),
        interval: options.interval
      });

      const response = await fetch(`/api/historical?${params}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch historical data');
      }

      const data = await response.json();

      return data.map((point: any) => ({
        date: new Date(point.date),
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
        volume: point.volume,
        adjClose: undefined // Not provided by our service
      }));
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }
}; 