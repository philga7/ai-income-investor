import { portfolioDataService } from '@/services/portfolioDataService';
import { supabase } from '@/lib/supabase';

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: {
          session: {
            access_token: 'mock-access-token'
          }
        }
      })
    }
  }
}));

// Mock console.warn
let originalConsoleWarn: typeof console.warn;
beforeAll(() => {
  originalConsoleWarn = console.warn;
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  console.warn = originalConsoleWarn;
});

describe('portfolioDataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updatePortfolioSecurities', () => {
    it('should handle empty portfolio securities', async () => {
      // Mock Supabase to return empty array
      const mockSupabase = require('@/lib/supabase').supabase;
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      }));

      const result = await portfolioDataService.updatePortfolioSecurities('123', mockSupabase);
      expect(result).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith('No tickers found in portfolio securities');
    });

    it('should handle null portfolio securities', async () => {
      // Mock Supabase to return null
      const mockSupabase = require('@/lib/supabase').supabase;
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: null,
            error: null
          }))
        }))
      }));

      const result = await portfolioDataService.updatePortfolioSecurities('123', mockSupabase);
      expect(result).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith('No portfolio securities found for portfolio:', '123');
    });

    it('should handle portfolio securities with no tickers', async () => {
      // Mock Supabase to return an empty array of securities
      const mockSupabase = require('@/lib/supabase').supabase;
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        }))
      }));

      // Mock fetch to prevent undefined.ok error
      (global.fetch as jest.Mock).mockImplementation(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      }));

      const result = await portfolioDataService.updatePortfolioSecurities('123', mockSupabase);
      expect(result).toEqual([]);
      expect(console.warn).toHaveBeenCalledWith('No tickers found in portfolio securities');
    });

    it('should handle successful update of portfolio securities', async () => {
      // Mock Supabase to return valid securities
      const mockSupabase = require('@/lib/supabase').supabase;
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({
            data: [{
              id: '1',
              security_id: '1',
              shares: 100,
              average_cost: 150,
              security: {
                id: '1',
                ticker: 'AAPL',
                name: 'Apple Inc.',
                sector: 'Technology',
                price: 175.50,
                yield: 0.5
              }
            }],
            error: null
          }))
        })),
        update: jest.fn(() => ({
          eq: jest.fn(() => ({
            select: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({
                data: {
                  id: '1',
                  security_id: '1',
                  shares: 100,
                  average_cost: 150,
                  security: {
                    id: '1',
                    ticker: 'AAPL',
                    name: 'Apple Inc.',
                    sector: 'Technology',
                    price: 175.50,
                    yield: 0.5
                  }
                },
                error: null
              }))
            }))
          }))
        }))
      }));

      // Mock fetch for successful API response
      (global.fetch as jest.Mock).mockImplementation(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{
          ticker: 'AAPL',
          price: 175.50,
          yield: 0.5
        }])
      }));

      const result = await portfolioDataService.updatePortfolioSecurities('123', mockSupabase);
      expect(result).toHaveLength(1);
      expect(result[0].security.ticker).toBe('AAPL');
      expect(result[0].security.price).toBe(175.50);
      expect(result[0].security.yield).toBe(0.5);
    });

    it('should handle database errors gracefully', async () => {
      const mockSupabase = require('@/lib/supabase').supabase;
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      });

      // The function should throw an error when there's a database error
      await expect(portfolioDataService.updatePortfolioSecurities('123', mockSupabase))
        .rejects.toThrow('Failed to fetch portfolio securities: Database error');
    });

    it('should update securities when TTL expires', async () => {
      const mockSupabase = require('@/lib/supabase').supabase;
      const oldDate = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{
              id: '1',
              shares: 100,
              average_cost: 50,
              security: {
                id: 'sec1',
                ticker: 'AAPL',
                name: 'Apple Inc.',
                last_fetched: oldDate.toISOString(),
                price: 100,
                yield: 2.5,
                sector: 'Technology',
                sma200: 'above',
                tags: []
              }
            }],
            error: null
          })
        })
      });

      const result = await portfolioDataService.updatePortfolioSecurities('123', mockSupabase);
      expect(result).toHaveLength(1);
      expect(result[0].security.ticker).toBe('AAPL');
      expect(result[0].security.price).toBe(100);
      expect(result[0].security.yield).toBe(2.5);
    });
  });
}); 