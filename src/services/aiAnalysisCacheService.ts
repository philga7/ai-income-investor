import { supabase } from '@/lib/supabase';
import { createHash } from 'crypto';
import { SupabaseClient } from '@supabase/supabase-js';

export interface AIAnalysisCache {
  id: string;
  portfolio_id: string;
  user_id: string;
  analysis_type: string;
  model_used: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost: number;
  analysis_content: string;
  portfolio_snapshot: any;
  portfolio_hash: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface AIAnalysisResponse {
  analysis: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
  model: string;
  timestamp: string;
  is_cached?: boolean;
  cache_id?: string;
}

export const aiAnalysisCacheService = {
  /**
   * Generate a hash of portfolio data for change detection
   */
  generatePortfolioHash(portfolioData: any): string {
    // Create a simplified version of portfolio data for hashing
    const hashData = {
      id: portfolioData.id,
      name: portfolioData.name,
      securities: portfolioData.securities?.map((sec: any) => ({
        id: sec.id,
        ticker: sec.ticker,
        shares: sec.shares,
        average_cost: sec.average_cost,
        price: sec.price,
        dividend: sec.dividend,
        yield: sec.yield
      })) || []
    };
    
    return createHash('sha256')
      .update(JSON.stringify(hashData))
      .digest('hex');
  },

  /**
   * Check if there's a valid cached analysis for the portfolio
   */
  async getCachedAnalysis(
    portfolioId: string, 
    userId: string, 
    analysisType: string = 'portfolio_analysis',
    supabaseClient: SupabaseClient = supabase
  ): Promise<AIAnalysisResponse | null> {
    try {
      const { data, error } = await supabaseClient
        .rpc('get_latest_ai_analysis', {
          p_portfolio_id: portfolioId,
          p_user_id: userId,
          p_analysis_type: analysisType
        });

      if (error) {
        console.error('Error fetching cached analysis:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const cachedAnalysis = data[0];
      
      return {
        analysis: cachedAnalysis.analysis_content,
        usage: {
          inputTokens: cachedAnalysis.input_tokens,
          outputTokens: cachedAnalysis.output_tokens,
          totalTokens: cachedAnalysis.total_tokens,
          estimatedCost: parseFloat(cachedAnalysis.estimated_cost.toString())
        },
        model: cachedAnalysis.model_used,
        timestamp: cachedAnalysis.created_at,
        is_cached: true,
        cache_id: cachedAnalysis.id
      };
    } catch (error) {
      console.error('Error in getCachedAnalysis:', error);
      return null;
    }
  },

  /**
   * Store a new AI analysis in the cache
   */
  async storeAnalysis(
    portfolioId: string,
    userId: string,
    portfolioData: any,
    analysisResponse: AIAnalysisResponse,
    analysisType: string = 'portfolio_analysis',
    supabaseClient: SupabaseClient = supabase
  ): Promise<string | null> {
    try {
      const portfolioHash = this.generatePortfolioHash(portfolioData);
      
      const { data, error } = await supabaseClient
        .from('ai_analysis_cache')
        .insert({
          portfolio_id: portfolioId,
          user_id: userId,
          analysis_type: analysisType,
          model_used: analysisResponse.model,
          input_tokens: analysisResponse.usage.inputTokens,
          output_tokens: analysisResponse.usage.outputTokens,
          total_tokens: analysisResponse.usage.totalTokens,
          estimated_cost: analysisResponse.usage.estimatedCost,
          analysis_content: analysisResponse.analysis,
          portfolio_snapshot: portfolioData,
          portfolio_hash: portfolioHash,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error storing analysis in cache:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error in storeAnalysis:', error);
      return null;
    }
  },

  /**
   * Check if portfolio has changed since last analysis
   */
  async hasPortfolioChanged(
    portfolioId: string,
    userId: string,
    currentPortfolioData: any,
    analysisType: string = 'portfolio_analysis',
    supabaseClient: SupabaseClient = supabase
  ): Promise<boolean> {
    try {
      const { data, error } = await supabaseClient
        .rpc('get_latest_ai_analysis', {
          p_portfolio_id: portfolioId,
          p_user_id: userId,
          p_analysis_type: analysisType
        });

      if (error || !data || data.length === 0) {
        return true; // No cached analysis, consider it "changed"
      }

      const cachedAnalysis = data[0];
      const currentHash = this.generatePortfolioHash(currentPortfolioData);
      
      return cachedAnalysis.portfolio_hash !== currentHash;
    } catch (error) {
      console.error('Error checking portfolio changes:', error);
      return true; // Assume changed on error
    }
  },

  /**
   * Get analysis history for a portfolio
   */
  async getAnalysisHistory(
    portfolioId: string,
    userId: string,
    analysisType: string = 'portfolio_analysis',
    limit: number = 10,
    supabaseClient: SupabaseClient = supabase
  ): Promise<AIAnalysisCache[]> {
    try {
      const { data, error } = await supabaseClient
        .from('ai_analysis_cache')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .eq('user_id', userId)
        .eq('analysis_type', analysisType)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching analysis history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAnalysisHistory:', error);
      return [];
    }
  },

  /**
   * Invalidate cache for a portfolio (mark as inactive)
   */
  async invalidateCache(
    portfolioId: string,
    userId: string,
    analysisType: string = 'portfolio_analysis',
    supabaseClient: SupabaseClient = supabase
  ): Promise<boolean> {
    try {
      const { error } = await supabaseClient
        .from('ai_analysis_cache')
        .update({ is_active: false })
        .eq('portfolio_id', portfolioId)
        .eq('user_id', userId)
        .eq('analysis_type', analysisType);

      if (error) {
        console.error('Error invalidating cache:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in invalidateCache:', error);
      return false;
    }
  },

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredCache(): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('cleanup_expired_ai_cache');

      if (error) {
        console.error('Error cleaning up expired cache:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error in cleanupExpiredCache:', error);
      return 0;
    }
  },

  /**
   * Get cache statistics for a user
   */
  async getCacheStats(userId: string): Promise<{
    totalAnalyses: number;
    totalTokens: number;
    totalCost: number;
    averageCost: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('ai_analysis_cache')
        .select('total_tokens, estimated_cost')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching cache stats:', error);
        return {
          totalAnalyses: 0,
          totalTokens: 0,
          totalCost: 0,
          averageCost: 0
        };
      }

      const analyses = data || [];
      const totalAnalyses = analyses.length;
      const totalTokens = analyses.reduce((sum, analysis) => sum + analysis.total_tokens, 0);
      const totalCost = analyses.reduce((sum, analysis) => sum + parseFloat(analysis.estimated_cost.toString()), 0);
      const averageCost = totalAnalyses > 0 ? totalCost / totalAnalyses : 0;

      return {
        totalAnalyses,
        totalTokens,
        totalCost,
        averageCost
      };
    } catch (error) {
      console.error('Error in getCacheStats:', error);
      return {
        totalAnalyses: 0,
        totalTokens: 0,
        totalCost: 0,
        averageCost: 0
      };
    }
  }
}; 