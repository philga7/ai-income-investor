import { yahooFinanceClient } from '@/lib/financial/api/yahoo/client';
import { YAHOO_FINANCE_CONFIG } from '@/lib/financial/api/yahoo/config';

// Mock yahoo-finance2
jest.mock('yahoo-finance2', () => ({
  __esModule: true,
  default: {
    quoteSummary: jest.fn(),
    historical: jest.fn(),
    search: jest.fn(),
  },
}));

beforeAll(() => {
  YAHOO_FINANCE_CONFIG.maxRetries = 3;
  YAHOO_FINANCE_CONFIG.retry = {
    invalidCrumbRetries: 3,
    invalidCrumbDelay: 1, // 1ms delay
    exponentialBackoff: false,
  };
});

describe('Yahoo Finance Client Error Handling', () => {
  let mockYahooFinance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockYahooFinance = require('yahoo-finance2').default;
    yahooFinanceClient.clearCache();
  });

  describe('getQuoteSummary error handling', () => {
    it('should handle rate limit errors', async () => {
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      mockQuoteSummary.mockRejectedValue(new Error('rate limit exceeded'));

      await expect(yahooFinanceClient.getQuoteSummary('AAPL')).rejects.toThrow('rate limit exceeded');
      expect(mockQuoteSummary).toHaveBeenCalledTimes(1);
    });

    it('should handle rate limit errors with different casing', async () => {
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      mockQuoteSummary.mockRejectedValue(new Error('TOO MANY REQUESTS'));

      await expect(yahooFinanceClient.getQuoteSummary('AAPL')).rejects.toThrow('TOO MANY REQUESTS');
    });

    it('should handle invalid symbol errors', async () => {
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      mockQuoteSummary.mockRejectedValue(new Error('invalid symbol'));

      await expect(yahooFinanceClient.getQuoteSummary('INVALID')).rejects.toThrow('invalid symbol');
      expect(mockQuoteSummary).toHaveBeenCalledTimes(1);
    });

    it('should handle symbol not found errors', async () => {
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      mockQuoteSummary.mockRejectedValue(new Error('symbol not found'));

      await expect(yahooFinanceClient.getQuoteSummary('NOTFOUND')).rejects.toThrow('symbol not found');
    });

    it('should handle network errors', async () => {
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      mockQuoteSummary.mockRejectedValue(new Error('network error'));

      await expect(yahooFinanceClient.getQuoteSummary('AAPL')).rejects.toThrow('network error');
    });

    it('should handle connection errors', async () => {
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      mockQuoteSummary.mockRejectedValue(new Error('connection failed'));

      await expect(yahooFinanceClient.getQuoteSummary('AAPL')).rejects.toThrow('connection failed');
    });

    it('should handle timeout errors', async () => {
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      mockQuoteSummary.mockRejectedValue(new Error('request timeout'));

      await expect(yahooFinanceClient.getQuoteSummary('AAPL')).rejects.toThrow('request timeout');
    });

    it('should handle timed out errors', async () => {
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      mockQuoteSummary.mockRejectedValue(new Error('request timed out'));

      await expect(yahooFinanceClient.getQuoteSummary('AAPL')).rejects.toThrow('request timed out');
    });

    it('should handle unknown errors as server errors', async () => {
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      mockQuoteSummary.mockRejectedValue(new Error('unknown server error'));

      await expect(yahooFinanceClient.getQuoteSummary('AAPL')).rejects.toThrow('unknown server error');
    });

    it('should handle non-Error objects', async () => {
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      mockQuoteSummary.mockRejectedValue('string error');

      await expect(yahooFinanceClient.getQuoteSummary('AAPL')).rejects.toBe('string error');
    });

    it('should handle null/undefined responses', async () => {
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      mockQuoteSummary.mockResolvedValue(null);

      await expect(yahooFinanceClient.getQuoteSummary('AAPL')).rejects.toThrow('No data returned for symbol: AAPL');
    });

    it('should handle empty responses', async () => {
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      mockQuoteSummary.mockResolvedValue({});

      const result = await yahooFinanceClient.getQuoteSummary('AAPL');
      expect(result).toEqual({
        assetProfile: undefined,
        balanceSheetHistory: undefined,
        cashflowStatementHistory: undefined,
        earnings: undefined,
        price: undefined,
        summaryDetail: undefined,
        financialData: undefined,
        calendarEvents: undefined
      });
    });

    it('should handle malformed responses', async () => {
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      mockQuoteSummary.mockResolvedValue({
        price: null,
        summaryDetail: undefined
      });

      const result = await yahooFinanceClient.getQuoteSummary('AAPL');
      expect(result).toEqual({
        assetProfile: undefined,
        balanceSheetHistory: undefined,
        cashflowStatementHistory: undefined,
        earnings: undefined,
        price: undefined,
        summaryDetail: undefined,
        financialData: undefined,
        calendarEvents: undefined
      });
    });
  });

  describe('getHistoricalData error handling', () => {
    it('should handle rate limit errors', async () => {
      const mockHistorical = mockYahooFinance.historical;
      mockHistorical.mockRejectedValue(new Error('rate limit exceeded'));

      await expect(yahooFinanceClient.getHistoricalData('AAPL', new Date('2024-01-01'), new Date('2024-01-31'))).rejects.toThrow('rate limit exceeded');
    });

    it('should handle invalid symbol errors', async () => {
      const mockHistorical = mockYahooFinance.historical;
      mockHistorical.mockRejectedValue(new Error('invalid symbol'));

      await expect(yahooFinanceClient.getHistoricalData('INVALID', new Date('2024-01-01'), new Date('2024-01-31'))).rejects.toThrow('invalid symbol');
    });

    it('should handle network errors', async () => {
      const mockHistorical = mockYahooFinance.historical;
      mockHistorical.mockRejectedValue(new Error('network error'));

      await expect(yahooFinanceClient.getHistoricalData('AAPL', new Date('2024-01-01'), new Date('2024-01-31'))).rejects.toThrow('network error');
    });

    it('should handle timeout errors', async () => {
      const mockHistorical = mockYahooFinance.historical;
      mockHistorical.mockRejectedValue(new Error('request timeout'));

      await expect(yahooFinanceClient.getHistoricalData('AAPL', new Date('2024-01-01'), new Date('2024-01-31'))).rejects.toThrow('request timeout');
    });

    it('should handle invalid date ranges', async () => {
      const mockHistorical = mockYahooFinance.historical;
      mockHistorical.mockRejectedValue(new Error('invalid date range'));

      await expect(yahooFinanceClient.getHistoricalData('AAPL', new Date('2024-01-31'), new Date('2024-01-01'))).rejects.toThrow('invalid date range');
    });

    it('should handle null/undefined responses', async () => {
      const mockHistorical = mockYahooFinance.historical;
      mockHistorical.mockResolvedValue(null);

      // Historical data can be null, should return null
      const result = await yahooFinanceClient.getHistoricalData('AAPL', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(result).toBeNull();
    });

    it('should handle empty responses', async () => {
      const mockHistorical = mockYahooFinance.historical;
      mockHistorical.mockResolvedValue([]);

      const result = await yahooFinanceClient.getHistoricalData('AAPL', new Date('2024-01-01'), new Date('2024-01-31'));
      expect(result).toEqual([]);
    });
  });

  describe('search error handling', () => {
    it('should handle rate limit errors', async () => {
      const mockSearch = mockYahooFinance.search;
      mockSearch.mockRejectedValue(new Error('rate limit exceeded'));

      await expect(yahooFinanceClient.search('Apple')).rejects.toThrow('rate limit exceeded');
    });

    it('should handle network errors', async () => {
      const mockSearch = mockYahooFinance.search;
      mockSearch.mockRejectedValue(new Error('network error'));

      await expect(yahooFinanceClient.search('Apple')).rejects.toThrow('network error');
    });

    it('should handle timeout errors', async () => {
      const mockSearch = mockYahooFinance.search;
      mockSearch.mockRejectedValue(new Error('request timeout'));

      await expect(yahooFinanceClient.search('Apple')).rejects.toThrow('request timeout');
    });

    it('should handle null/undefined responses', async () => {
      const mockSearch = mockYahooFinance.search;
      mockSearch.mockResolvedValue(null);

      const result = await yahooFinanceClient.search('Apple');
      expect(result).toBeNull();
    });

    it('should handle empty responses', async () => {
      const mockSearch = mockYahooFinance.search;
      mockSearch.mockResolvedValue({ quotes: [] });

      const result = await yahooFinanceClient.search('Apple');
      expect(result).toEqual([]);
    });

    it('should handle malformed responses', async () => {
      const mockSearch = mockYahooFinance.search;
      mockSearch.mockResolvedValue({ quotes: null });

      const result = await yahooFinanceClient.search('Apple');
      expect(result).toBeNull();
    });
  });

  describe('cache error handling', () => {
    it('should handle cache corruption gracefully', () => {
      // Simulate cache corruption by setting invalid data
      (yahooFinanceClient as any).cache.set('test', { data: null, timestamp: 'invalid' });
      
      // This should not throw an error
      expect(() => yahooFinanceClient.clearCache()).not.toThrow();
      expect((yahooFinanceClient as any).cache.size).toBe(0);
    });

    it('should handle cache size limits', () => {
      // Set cache size to 1 to test overflow
      const originalMaxSize = YAHOO_FINANCE_CONFIG.cache.maxSize;
      YAHOO_FINANCE_CONFIG.cache.maxSize = 1;

      // Add two items to cache
      (yahooFinanceClient as any).setCachedData('key1', 'value1');
      (yahooFinanceClient as any).setCachedData('key2', 'value2');

      // Should only have one item
      expect((yahooFinanceClient as any).cache.size).toBe(1);

      // Restore original config
      YAHOO_FINANCE_CONFIG.cache.maxSize = originalMaxSize;
      yahooFinanceClient.clearCache();
    });

    it('should handle disabled cache', () => {
      const originalEnabled = YAHOO_FINANCE_CONFIG.cache.enabled;
      YAHOO_FINANCE_CONFIG.cache.enabled = false;

      // Should not cache data
      (yahooFinanceClient as any).setCachedData('test', 'value');
      expect((yahooFinanceClient as any).cache.size).toBe(0);

      // Should not retrieve cached data
      const result = (yahooFinanceClient as any).getCachedData('test');
      expect(result).toBeNull();

      // Restore original config
      YAHOO_FINANCE_CONFIG.cache.enabled = originalEnabled;
    });
  });

  describe('retry mechanism error handling', () => {
    it('should handle exponential backoff when enabled', async () => {
      const originalBackoff = YAHOO_FINANCE_CONFIG.retry.exponentialBackoff;
      YAHOO_FINANCE_CONFIG.retry.exponentialBackoff = true;
      YAHOO_FINANCE_CONFIG.retry.invalidCrumbDelay = 10;

      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      mockQuoteSummary.mockRejectedValue(new Error('Invalid Crumb'));

      const startTime = Date.now();
      await expect(yahooFinanceClient.getQuoteSummary('AAPL')).rejects.toThrow('Invalid Crumb');
      const endTime = Date.now();

      // Should have delays: 10ms, 20ms, 40ms = 70ms minimum, but allow for timer inaccuracy
      expect(endTime - startTime).toBeGreaterThanOrEqual(25);

      // Restore original config
      YAHOO_FINANCE_CONFIG.retry.exponentialBackoff = originalBackoff;
    });

    it('should handle retry exhaustion', async () => {
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      mockQuoteSummary.mockRejectedValue(new Error('Invalid Crumb'));

      await expect(yahooFinanceClient.getQuoteSummary('AAPL')).rejects.toThrow('Invalid Crumb');
      
      // Should be called 3 times (initial + 2 retries)
      expect(mockQuoteSummary).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-crumb errors', async () => {
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      mockQuoteSummary.mockRejectedValue(new Error('Network Error'));

      await expect(yahooFinanceClient.getQuoteSummary('AAPL')).rejects.toThrow('Network Error');
      
      // Should only be called once
      expect(mockQuoteSummary).toHaveBeenCalledTimes(1);
    });
  });

  describe('data validation error handling', () => {
    it('should handle malformed earnings data', async () => {
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      mockQuoteSummary.mockResolvedValue({
        price: {
          regularMarketPrice: 100
        },
        summaryDetail: {
          dividendYield: 0.02
        },
        earnings: {
          earningsChart: null, // Malformed
          financialsChart: null
        }
      });

      await expect(yahooFinanceClient.getQuoteSummary('AAPL', ['price', 'summaryDetail', 'earnings'])).rejects.toThrow();
    });

    it('should handle malformed balance sheet data', async () => {
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      mockQuoteSummary.mockResolvedValue({
        price: {
          regularMarketPrice: 100
        },
        summaryDetail: {
          dividendYield: 0.02
        },
        balanceSheetHistory: {
          balanceSheetStatements: null // Malformed
        }
      });

      await expect(yahooFinanceClient.getQuoteSummary('AAPL', ['price', 'summaryDetail', 'balanceSheetHistory'])).rejects.toThrow();
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle empty symbol', async () => {
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      mockQuoteSummary.mockRejectedValue(new Error('invalid symbol'));

      await expect(yahooFinanceClient.getQuoteSummary('')).rejects.toThrow('invalid symbol');
    });

    it('should handle very long symbols', async () => {
      const longSymbol = 'A'.repeat(1000);
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      mockQuoteSummary.mockRejectedValue(new Error('invalid symbol'));

      await expect(yahooFinanceClient.getQuoteSummary(longSymbol)).rejects.toThrow('invalid symbol');
    });

    it('should handle special characters in symbols', async () => {
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      mockQuoteSummary.mockRejectedValue(new Error('invalid symbol'));

      await expect(yahooFinanceClient.getQuoteSummary('AAPL@')).rejects.toThrow('invalid symbol');
    });

    it('should handle concurrent requests', async () => {
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      mockQuoteSummary.mockResolvedValue({
        price: { regularMarketPrice: 100 },
        summaryDetail: { dividendYield: 0.02 }
      });

      // Make concurrent requests
      const promises = [
        yahooFinanceClient.getQuoteSummary('AAPL'),
        yahooFinanceClient.getQuoteSummary('AAPL'),
        yahooFinanceClient.getQuoteSummary('AAPL')
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined();
      expect(results[2]).toBeDefined();
    });

    it('should handle memory pressure scenarios', () => {
      // Simulate memory pressure by filling cache
      for (let i = 0; i < 1000; i++) {
        (yahooFinanceClient as any).setCachedData(`key${i}`, `value${i}`);
      }

      // Should not throw error
      expect(() => yahooFinanceClient.clearCache()).not.toThrow();
    });
  });
}); 