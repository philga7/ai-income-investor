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
        .maybeSingle();

      if (updateError) {
        console.error('Error updating security:', updateError);
        return security;
      }

      return updatedSecurity;
    } catch (error) {
      console.error('Error in updateSecurityData:', error);
      return null;
    }
  },

  async searchSecurities(query: string, filters?: {
    sector?: string;
    minYield?: number;
    maxYield?: number;
    sma200?: 'above' | 'below';
    sortBy?: 'ticker' | 'name' | 'yield' | 'price';
    sortOrder?: 'asc' | 'desc';
  }): Promise<Security[]> {
    try {
      let queryBuilder = supabase
        .from('securities')
        .select('*');

      // Apply search query if provided
      if (query) {
        queryBuilder = queryBuilder.or(`ticker.ilike.%${query}%,name.ilike.%${query}%`);
      }

      // Apply filters
      if (filters?.sector) {
        queryBuilder = queryBuilder.eq('sector', filters.sector);
      }

      if (filters?.minYield !== undefined) {
        queryBuilder = queryBuilder.gte('yield', filters.minYield);
      }

      if (filters?.maxYield !== undefined) {
        queryBuilder = queryBuilder.lte('yield', filters.maxYield);
      }

      if (filters?.sma200) {
        queryBuilder = queryBuilder.eq('sma200', filters.sma200);
      }

      // Apply sorting
      if (filters?.sortBy) {
        queryBuilder = queryBuilder.order(filters.sortBy, { 
          ascending: filters.sortOrder === 'asc' 
        });
      } else {
        // Default sorting by ticker
        queryBuilder = queryBuilder.order('ticker', { ascending: true });
      }

      const { data: securities, error } = await queryBuilder;

      if (error) {
        console.error('Error searching securities:', error);
        return [];
      }

      return securities.map(security => ({
        ...security,
        price: Number(security.price),
        yield: Number(security.yield)
      }));
    } catch (error) {
      console.error('Error in searchSecurities:', error);
      return [];
    }
  }
}; 