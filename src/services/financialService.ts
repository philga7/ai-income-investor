import { yahooFinanceClient } from '@/lib/financial/api/yahoo/client';
import type { QuoteSummary, Price, FinancialData, SummaryDetail, CashflowStatementHistory, AssetProfile, Earnings, BalanceSheetHistory, SearchResult } from '@/lib/financial/api/yahoo/types';
import { 
  handleYahooFinanceError, 
  validateResponse, 
  DataValidationError
} from '@/lib/financial/api/errors';

export interface SecurityQuote {
  symbol: string;
  price: Price;
  financialData: FinancialData;
  summaryDetail: SummaryDetail;
  cashflowStatementHistory?: CashflowStatementHistory;
  assetProfile?: AssetProfile;
  earnings?: Earnings;
  balanceSheetHistory?: BalanceSheetHistory;
}

export interface HistoricalDataPoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface YahooHistoricalDataPoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface YahooSearchResult {
  quotes: Array<{
    symbol: string;
    shortname?: string;
    longname?: string;
    exchange: string;
    quoteType: string;
  }>;
}

class FinancialService {
  private static instance: FinancialService;

  private constructor() {}

  public static getInstance(): FinancialService {
    if (!FinancialService.instance) {
      FinancialService.instance = new FinancialService();
    }
    return FinancialService.instance;
  }

  /**
   * Get real-time quote data for a security
   */
  public async getQuote(symbol: string): Promise<SecurityQuote> {
    try {
      const quoteSummary = await yahooFinanceClient.getQuoteSummary(symbol, [
        'price',
        'financialData',
        'summaryDetail',
        'cashflowStatementHistory',
        'assetProfile',
        'earnings'
      ]);

      // Validate required fields
      validateResponse(quoteSummary, ['price', 'financialData', 'summaryDetail']);

      // After validation, we can safely assert these types
      const price = quoteSummary.price as Price;
      const financialData = quoteSummary.financialData as FinancialData;
      const summaryDetail = quoteSummary.summaryDetail as SummaryDetail;
      const cashflowStatementHistory = quoteSummary.cashflowStatementHistory;
      const assetProfile = quoteSummary.assetProfile;
      const earnings = quoteSummary.earnings;

      return {
        symbol,
        price,
        financialData,
        summaryDetail,
        cashflowStatementHistory,
        assetProfile,
        earnings
      };
    } catch (error) {
      if (error instanceof DataValidationError) {
        throw error;
      }
      handleYahooFinanceError(error);
    }
  }

  /**
   * Get historical price data for a security
   */
  public async getHistoricalData(
    symbol: string,
    startDate: Date,
    endDate: Date,
    interval: '1d' | '1wk' | '1mo' = '1d'
  ): Promise<HistoricalDataPoint[]> {
    try {
      const data = await yahooFinanceClient.getHistoricalData(symbol, startDate, endDate, interval) as YahooHistoricalDataPoint[];
      
      if (!Array.isArray(data)) {
        throw new DataValidationError('Historical data must be an array');
      }

      return data.map(point => {
        validateResponse(point, ['date', 'open', 'high', 'low', 'close', 'volume']);
        return {
          date: new Date(point.date),
          open: point.open,
          high: point.high,
          low: point.low,
          close: point.close,
          volume: point.volume
        };
      });
    } catch (error) {
      if (error instanceof DataValidationError) {
        throw error;
      }
      handleYahooFinanceError(error);
    }
  }

  /**
   * Search for securities by symbol or company name
   */
  public async searchSecurities(query: string) {
    try {
      const results = await yahooFinanceClient.search(query);
      
      if (!results) {
        return [];
      }

      return results.map(quote => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname,
        exchange: quote.exchange,
        type: quote.quoteType
      }));
    } catch (error) {
      if (error instanceof DataValidationError) {
        throw error;
      }
      handleYahooFinanceError(error);
    }
  }

  /**
   * Get detailed quote summary for a security
   */
  public async getQuoteSummary(symbol: string): Promise<QuoteSummary> {
    try {
      const summary = await yahooFinanceClient.getQuoteSummary(symbol);
      validateResponse(summary, ['price']); // At minimum, we expect price data
      return summary;
    } catch (error) {
      if (error instanceof DataValidationError) {
        throw error;
      }
      handleYahooFinanceError(error);
    }
  }
}

// Export a singleton instance
export const financialService = FinancialService.getInstance(); 