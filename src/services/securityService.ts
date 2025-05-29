import { supabase } from '@/lib/supabase';

export interface Security {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  price: number;
  yield: number;
  sma200: 'above' | 'below';
  tags: string[];
}

export const securityService = {
  async getSecurityData(ticker: string): Promise<Partial<Security> | null> {
    try {
      // TODO: Replace with actual API call to get real-time data
      // For now, return mock data for AAPL
      if (ticker === 'AAPL') {
        return {
          name: 'Apple Inc.',
          sector: 'Technology',
          price: 190.00,
          yield: 0.5,
          sma200: 'above',
          tags: ['Technology', 'Large Cap', 'Growth']
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching security data:', error);
      return null;
    }
  },

  async updateSecurityData(securityId: string): Promise<Security | null> {
    try {
      // Get the security from the database
      const { data: security, error: fetchError } = await supabase
        .from('securities')
        .select('*')
        .eq('id', securityId)
        .single();

      if (fetchError || !security) {
        console.error('Error fetching security:', fetchError);
        return null;
      }

      // Get updated data
      const updatedData = await this.getSecurityData(security.ticker);
      if (!updatedData) {
        return security;
      }

      // Update the security in the database
      const { data: updatedSecurity, error: updateError } = await supabase
        .from('securities')
        .update({
          name: updatedData.name || security.name,
          sector: updatedData.sector || security.sector,
          price: updatedData.price || security.price,
          yield: updatedData.yield || security.yield,
          sma200: updatedData.sma200 || security.sma200,
          tags: updatedData.tags || security.tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', securityId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating security:', updateError);
        return security;
      }

      return updatedSecurity;
    } catch (error) {
      console.error('Error in updateSecurityData:', error);
      return null;
    }
  }
}; 