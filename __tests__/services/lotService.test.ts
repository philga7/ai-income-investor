import { lotService } from '@/services/lotService';
import { supabase } from '@/lib/supabase';
import { SecurityLot, SecurityLotFormData, SecurityLotTotals } from '@/types/lots';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('lotService', () => {
  let mockSupabase: any;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = require('@/lib/supabase').supabase;
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

    // Default mock session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-access-token'
        }
      }
    });
  });

  describe('createLots', () => {
    const mockLots: SecurityLotFormData[] = [
      {
        open_date: '2024-01-01',
        quantity: '100',
        price_per_share: '150.00',
        notes: 'Initial purchase'
      },
      {
        open_date: '2024-01-15',
        quantity: '50',
        price_per_share: '160.00',
        notes: 'Additional purchase'
      }
    ];

    const mockResponse: SecurityLot[] = [
      {
        id: 'lot-1',
        portfolio_id: 'portfolio-1',
        security_id: 'security-1',
        open_date: '2024-01-01',
        quantity: 100,
        price_per_share: 150.00,
        total_amount: 15000.00,
        notes: 'Initial purchase',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'lot-2',
        portfolio_id: 'portfolio-1',
        security_id: 'security-1',
        open_date: '2024-01-15',
        quantity: 50,
        price_per_share: 160.00,
        total_amount: 8000.00,
        notes: 'Additional purchase',
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z'
      }
    ];

    it('should create lots successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse)
      } as Response);

      const result = await lotService.createLots('portfolio-1', 'security-1', mockLots);

      expect(result).toEqual(mockResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/portfolios/portfolio-1/securities/security-1/lots',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-access-token'
          },
          body: JSON.stringify({ lots: mockLots })
        }
      );
    });

    it('should throw error when no authentication token', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null }
      });

      await expect(lotService.createLots('portfolio-1', 'security-1', mockLots))
        .rejects.toThrow('No authentication token found');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid data' })
      } as Response);

      await expect(lotService.createLots('portfolio-1', 'security-1', mockLots))
        .rejects.toThrow('Invalid data');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(lotService.createLots('portfolio-1', 'security-1', mockLots))
        .rejects.toThrow('Network error');
    });
  });

  describe('getLotsForSecurity', () => {
    const mockLots: SecurityLot[] = [
      {
        id: 'lot-1',
        portfolio_id: 'portfolio-1',
        security_id: 'security-1',
        open_date: '2024-01-01',
        quantity: 100,
        price_per_share: 150.00,
        total_amount: 15000.00,
        notes: 'Initial purchase',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }
    ];

    it('should fetch lots successfully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockLots)
      } as Response);

      const result = await lotService.getLotsForSecurity('portfolio-1', 'security-1');

      expect(result).toEqual(mockLots);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/portfolios/portfolio-1/securities/security-1/lots',
        {
          headers: {
            'Authorization': 'Bearer mock-access-token'
          }
        }
      );
    });

    it('should throw error when no authentication token', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null }
      });

      await expect(lotService.getLotsForSecurity('portfolio-1', 'security-1'))
        .rejects.toThrow('No authentication token found');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Security not found' })
      } as Response);

      await expect(lotService.getLotsForSecurity('portfolio-1', 'security-1'))
        .rejects.toThrow('Security not found');
    });

    it('should handle invalid JSON responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.reject(new Error('Invalid JSON'))
      } as Response);

      await expect(lotService.getLotsForSecurity('portfolio-1', 'security-1'))
        .rejects.toThrow('Failed to fetch lots');
    });
  });

  describe('updateLot', () => {
    const mockLot = {
      portfolio_id: 'portfolio-1',
      security_id: 'security-1'
    };

    const mockUpdates: Partial<SecurityLotFormData> = {
      quantity: '150',
      price_per_share: '155.00',
      notes: 'Updated purchase'
    };

    const mockUpdatedLot: SecurityLot = {
      id: 'lot-1',
      portfolio_id: 'portfolio-1',
      security_id: 'security-1',
      open_date: '2024-01-01',
      quantity: 150,
      price_per_share: 155.00,
      total_amount: 23250.00,
      notes: 'Updated purchase',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    };

    it('should update lot successfully', async () => {
      // Mock the initial fetch to get lot details
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockLot,
              error: null
            })
          })
        })
      });

      // Mock the update API call
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockUpdatedLot)
      } as Response);

      const result = await lotService.updateLot('lot-1', mockUpdates);

      expect(result).toEqual(mockUpdatedLot);
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/portfolios/portfolio-1/securities/security-1/lots/lot-1',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-access-token'
          },
          body: JSON.stringify(mockUpdates)
        }
      );
    });

    it('should throw error when no authentication token', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null }
      });

      await expect(lotService.updateLot('lot-1', mockUpdates))
        .rejects.toThrow('No authentication token found');
    });

    it('should handle lot not found error', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' }
            })
          })
        })
      });

      await expect(lotService.updateLot('lot-1', mockUpdates))
        .rejects.toThrow('Lot not found');
    });

    it('should handle API errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockLot,
              error: null
            })
          })
        })
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid update data' })
      } as Response);

      await expect(lotService.updateLot('lot-1', mockUpdates))
        .rejects.toThrow('Invalid update data');
    });
  });

  describe('deleteLot', () => {
    const mockLot = {
      portfolio_id: 'portfolio-1',
      security_id: 'security-1'
    };

    it('should delete lot successfully', async () => {
      // Mock the initial fetch to get lot details
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockLot,
              error: null
            })
          })
        })
      });

      // Mock the delete API call
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200
      } as Response);

      await lotService.deleteLot('lot-1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/portfolios/portfolio-1/securities/security-1/lots/lot-1',
        {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer mock-access-token'
          }
        }
      );
    });

    it('should throw error when no authentication token', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null }
      });

      await expect(lotService.deleteLot('lot-1'))
        .rejects.toThrow('No authentication token found');
    });

    it('should handle lot not found error', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' }
            })
          })
        })
      });

      await expect(lotService.deleteLot('lot-1'))
        .rejects.toThrow('Lot not found');
    });

    it('should handle API errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockLot,
              error: null
            })
          })
        })
      });

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' })
      } as Response);

      await expect(lotService.deleteLot('lot-1'))
        .rejects.toThrow('Server error');
    });
  });

  describe('calculateTotals', () => {
    const mockTotals: SecurityLotTotals = {
      total_shares: 150,
      total_cost: 23250.00,
      average_cost: 155.00
    };

    it('should calculate totals successfully', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [mockTotals],
        error: null
      });

      const result = await lotService.calculateTotals('portfolio-1', 'security-1');

      expect(result).toEqual(mockTotals);
      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        'calculate_portfolio_security_totals',
        {
          p_portfolio_id: 'portfolio-1',
          p_security_id: 'security-1'
        }
      );
    });

    it('should handle database errors', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      await expect(lotService.calculateTotals('portfolio-1', 'security-1'))
        .rejects.toThrow('Failed to calculate totals: Database error');
    });

    it('should return default values when no data', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await lotService.calculateTotals('portfolio-1', 'security-1');

      expect(result).toEqual({
        total_shares: 0,
        total_cost: 0,
        average_cost: 0
      });
    });
  });

  describe('calculateTotalsFromLots', () => {
    const mockLots: SecurityLot[] = [
      {
        id: 'lot-1',
        portfolio_id: 'portfolio-1',
        security_id: 'security-1',
        open_date: '2024-01-01',
        quantity: 100,
        price_per_share: 150.00,
        total_amount: 15000.00,
        notes: 'Initial purchase',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'lot-2',
        portfolio_id: 'portfolio-1',
        security_id: 'security-1',
        open_date: '2024-01-15',
        quantity: 50,
        price_per_share: 160.00,
        total_amount: 8000.00,
        notes: 'Additional purchase',
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z'
      }
    ];

    it('should calculate totals from lots correctly', () => {
      const result = lotService.calculateTotalsFromLots(mockLots);

      expect(result).toEqual({
        total_shares: 150, // 100 + 50
        total_cost: 23000.00, // 15000 + 8000
        average_cost: 153.33333333333334 // 23000 / 150
      });
    });

    it('should handle empty lots array', () => {
      const result = lotService.calculateTotalsFromLots([]);

      expect(result).toEqual({
        total_shares: 0,
        total_cost: 0,
        average_cost: 0
      });
    });

    it('should handle single lot', () => {
      const singleLot = [mockLots[0]];
      const result = lotService.calculateTotalsFromLots(singleLot);

      expect(result).toEqual({
        total_shares: 100,
        total_cost: 15000.00,
        average_cost: 150.00
      });
    });

    it('should handle zero quantity', () => {
      const zeroLot: SecurityLot = {
        ...mockLots[0],
        quantity: 0,
        total_amount: 0
      };

      const result = lotService.calculateTotalsFromLots([zeroLot]);

      expect(result).toEqual({
        total_shares: 0,
        total_cost: 0,
        average_cost: 0
      });
    });

    it('should handle fractional shares', () => {
      const fractionalLots: SecurityLot[] = [
        {
          ...mockLots[0],
          quantity: 100.5,
          total_amount: 15075.00
        },
        {
          ...mockLots[1],
          quantity: 50.25,
          total_amount: 8040.00
        }
      ];

      const result = lotService.calculateTotalsFromLots(fractionalLots);

      expect(result).toEqual({
        total_shares: 150.75, // 100.5 + 50.25
        total_cost: 23115.00, // 15075 + 8040
        average_cost: 153.33333333333334 // 23115 / 150.75
      });
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle malformed API responses', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(null)
      } as Response);

      const result = await lotService.getLotsForSecurity('portfolio-1', 'security-1');
      expect(result).toBeNull();
    });

    it('should handle network timeouts', async () => {
      mockFetch.mockRejectedValue(new Error('Request timeout'));

      await expect(lotService.getLotsForSecurity('portfolio-1', 'security-1'))
        .rejects.toThrow('Request timeout');
    });
  });
}); 