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

      const result = await portfolioDataService.updatePortfolioSecurities('123');
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

      const result = await portfolioDataService.updatePortfolioSecurities('123');
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

      const result = await portfolioDataService.updatePortfolioSecurities('123');
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

      const result = await portfolioDataService.updatePortfolioSecurities('123');
      expect(result).toHaveLength(1);
      expect(result[0].security.ticker).toBe('AAPL');
      expect(result[0].security.price).toBe(175.50);
      expect(result[0].security.yield).toBe(0.5);
    });
  });
}); 