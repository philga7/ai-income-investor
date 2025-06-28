import { supabase } from '@/lib/supabase';
import { SecurityLot, SecurityLotFormData, SecurityLotTotals } from '@/types/lots';

export const lotService = {
  async createLots(portfolioId: string, securityId: string, lots: SecurityLotFormData[]): Promise<SecurityLot[]> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`/api/portfolios/${portfolioId}/securities/${securityId}/lots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ lots })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create lots');
    }

    return await response.json();
  },

  async getLotsForSecurity(portfolioId: string, securityId: string): Promise<SecurityLot[]> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`/api/portfolios/${portfolioId}/securities/${securityId}/lots`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch (e) {
        throw new Error('Failed to fetch lots');
      }
      throw new Error(error.error || 'Failed to fetch lots');
    }

    return await response.json();
  },

  async updateLot(lotId: string, updates: Partial<SecurityLotFormData>): Promise<SecurityLot> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token found');
    }

    // We need to get the portfolio and security IDs from the lot
    // For now, we'll use a direct Supabase call to get the lot first
    const { data: lot, error: fetchError } = await supabase
      .from('security_lots')
      .select('portfolio_id, security_id')
      .eq('id', lotId)
      .single();

    if (fetchError || !lot) {
      throw new Error('Lot not found');
    }

    const response = await fetch(`/api/portfolios/${lot.portfolio_id}/securities/${lot.security_id}/lots/${lotId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update lot');
    }

    return await response.json();
  },

  async deleteLot(lotId: string): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token found');
    }

    // We need to get the portfolio and security IDs from the lot
    const { data: lot, error: fetchError } = await supabase
      .from('security_lots')
      .select('portfolio_id, security_id')
      .eq('id', lotId)
      .single();

    if (fetchError || !lot) {
      throw new Error('Lot not found');
    }

    const response = await fetch(`/api/portfolios/${lot.portfolio_id}/securities/${lot.security_id}/lots/${lotId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete lot');
    }
  },

  async calculateTotals(portfolioId: string, securityId: string): Promise<SecurityLotTotals> {
    const { data, error } = await supabase
      .rpc('calculate_portfolio_security_totals', {
        p_portfolio_id: portfolioId,
        p_security_id: securityId
      });

    if (error) {
      console.error('Error calculating totals:', error);
      throw new Error(`Failed to calculate totals: ${error.message}`);
    }

    return data?.[0] || { total_shares: 0, total_cost: 0, average_cost: 0 };
  },

  calculateTotalsFromLots(lots: SecurityLot[]): SecurityLotTotals {
    const totalShares = lots.reduce((sum, lot) => sum + lot.quantity, 0);
    const totalCost = lots.reduce((sum, lot) => sum + lot.total_amount, 0);
    const averageCost = totalShares > 0 ? totalCost / totalShares : 0;

    return {
      total_shares: totalShares,
      total_cost: totalCost,
      average_cost: averageCost
    };
  }
}; 