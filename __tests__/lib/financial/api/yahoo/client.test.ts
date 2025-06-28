import { yahooFinanceClient } from '@/lib/financial/api/yahoo/client';
import { YAHOO_FINANCE_CONFIG } from '@/lib/financial/api/yahoo/config';

beforeAll(() => {
  YAHOO_FINANCE_CONFIG.maxRetries = 3;
  YAHOO_FINANCE_CONFIG.retry = {
    invalidCrumbRetries: 3,
    invalidCrumbDelay: 1, // 1ms delay
    exponentialBackoff: false,
  };
});

// Mock yahoo-finance2
jest.mock('yahoo-finance2', () => ({
  __esModule: true,
  default: {
    quoteSummary: jest.fn(),
    historical: jest.fn(),
    search: jest.fn(),
  },
}));

describe('YahooFinanceClient', () => {
  let mockYahooFinance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockYahooFinance = require('yahoo-finance2').default;
  });

  describe('retry logic for invalid crumb errors', () => {
    it('should retry and clear cache on invalid crumb error', async () => {
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      
      // First call throws invalid crumb error, second call succeeds
      mockQuoteSummary
        .mockRejectedValueOnce(new Error('Invalid Crumb'))
        .mockResolvedValueOnce({
          price: { regularMarketPrice: 100 },
          summaryDetail: { dividendYield: 0.02 }
        });

      const result = await yahooFinanceClient.getQuoteSummary('AAPL', ['price', 'summaryDetail']);

      expect(mockQuoteSummary).toHaveBeenCalledTimes(2);
      expect(result).toBeDefined();
    });

    it('should not retry on other errors', async () => {
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      
      // Throw a different error
      mockQuoteSummary.mockRejectedValueOnce(new Error('Network Error'));

      await expect(yahooFinanceClient.getQuoteSummary('AAPL')).rejects.toThrow('Network Error');
      
      expect(mockQuoteSummary).toHaveBeenCalledTimes(1);
    });

    it('should respect max retry attempts', async () => {
      const mockQuoteSummary = mockYahooFinance.quoteSummary;
      
      // Always throw invalid crumb error
      mockQuoteSummary.mockRejectedValue(new Error('Invalid Crumb'));

      await expect(yahooFinanceClient.getQuoteSummary('AAPL')).rejects.toThrow('Invalid Crumb');
      
      // Should be called 3 times (initial + 2 retries)
      expect(mockQuoteSummary).toHaveBeenCalledTimes(3);
    });
  });

  describe('cache management', () => {
    it('should clear cache when manually called', () => {
      // Add some data to cache first
      (yahooFinanceClient as any).cache.set('test', { data: 'test', timestamp: Date.now() });
      expect((yahooFinanceClient as any).cache.size).toBe(1);

      yahooFinanceClient.clearCache();
      expect((yahooFinanceClient as any).cache.size).toBe(0);
    });
  });
}); 