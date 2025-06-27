interface CachedTechnicalAnalysis {
  data: any;
  timestamp: number;
  symbol: string;
  type?: 'buy' | 'sell' | 'neutral';
}

interface CachedOpportunities {
  buyOpportunities: any[];
  sellOpportunities: any[];
  timestamp: number;
}

class TechnicalAnalysisCacheService {
  private cache = new Map<string, CachedTechnicalAnalysis>();
  private opportunitiesCache: CachedOpportunities | null = null;
  
  // TTL settings matching the portfolio data service
  private readonly cacheTtl = 5 * 60 * 1000; // 5 minutes in milliseconds
  private readonly newDataTtl = 30 * 1000; // 30 seconds for newly added data

  /**
   * Get cached technical analysis for a specific symbol
   */
  getCachedAnalysis(symbol: string): any | null {
    const cached = this.cache.get(symbol);
    if (!cached) return null;

    const now = Date.now();
    const timeSinceLastFetch = now - cached.timestamp;
    
    // Use standard TTL for all cached data
    const ttl = this.cacheTtl;
    
    if (timeSinceLastFetch > ttl) {
      console.log(`Technical analysis cache expired for ${symbol}, removing from cache`);
      this.cache.delete(symbol);
      return null;
    }

    console.log(`Using cached technical analysis for ${symbol} (age: ${Math.round(timeSinceLastFetch / 1000)}s)`);
    return cached.data;
  }

  /**
   * Cache technical analysis data for a symbol
   */
  setCachedAnalysis(symbol: string, data: any): void {
    console.log(`Caching technical analysis for ${symbol}`);
    this.cache.set(symbol, {
      data,
      timestamp: Date.now(),
      symbol
    });
  }

  /**
   * Get cached buy/sell opportunities
   */
  getCachedOpportunities(): { buyOpportunities: any[], sellOpportunities: any[] } | null {
    if (!this.opportunitiesCache) return null;

    const now = Date.now();
    const timeSinceLastFetch = now - this.opportunitiesCache.timestamp;
    
    // Use standard TTL for all cached data
    const ttl = this.cacheTtl;
    
    if (timeSinceLastFetch > ttl) {
      console.log('Buy/sell opportunities cache expired, removing from cache');
      this.opportunitiesCache = null;
      return null;
    }

    console.log(`Using cached buy/sell opportunities (age: ${Math.round(timeSinceLastFetch / 1000)}s)`);
    return {
      buyOpportunities: this.opportunitiesCache.buyOpportunities,
      sellOpportunities: this.opportunitiesCache.sellOpportunities
    };
  }

  /**
   * Cache buy/sell opportunities
   */
  setCachedOpportunities(buyOpportunities: any[], sellOpportunities: any[]): void {
    console.log('Caching buy/sell opportunities');
    this.opportunitiesCache = {
      buyOpportunities,
      sellOpportunities,
      timestamp: Date.now()
    };
  }

  /**
   * Clear cache for a specific symbol (useful when data is updated)
   */
  clearSymbolCache(symbol: string): void {
    console.log(`Clearing technical analysis cache for ${symbol}`);
    this.cache.delete(symbol);
  }

  /**
   * Clear all caches (useful for testing or manual refresh)
   */
  clearAllCaches(): void {
    console.log('Clearing all technical analysis caches');
    this.cache.clear();
    this.opportunitiesCache = null;
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats(): {
    symbolCacheSize: number;
    opportunitiesCacheAge: number | null;
    totalCachedSymbols: string[];
  } {
    const now = Date.now();
    return {
      symbolCacheSize: this.cache.size,
      opportunitiesCacheAge: this.opportunitiesCache 
        ? Math.round((now - this.opportunitiesCache.timestamp) / 1000)
        : null,
      totalCachedSymbols: Array.from(this.cache.keys())
    };
  }

  /**
   * Check if cache is valid for a symbol
   */
  isCacheValid(symbol: string): boolean {
    const cached = this.cache.get(symbol);
    if (!cached) return false;

    const now = Date.now();
    const timeSinceLastFetch = now - cached.timestamp;
    
    // Use standard TTL for all cached data
    const ttl = this.cacheTtl;
    
    return timeSinceLastFetch <= ttl;
  }

  /**
   * Check if opportunities cache is valid
   */
  isOpportunitiesCacheValid(): boolean {
    if (!this.opportunitiesCache) return false;

    const now = Date.now();
    const timeSinceLastFetch = now - this.opportunitiesCache.timestamp;
    
    // Use standard TTL for all cached data
    const ttl = this.cacheTtl;
    
    return timeSinceLastFetch <= ttl;
  }
}

// Export singleton instance
export const technicalAnalysisCacheService = new TechnicalAnalysisCacheService(); 