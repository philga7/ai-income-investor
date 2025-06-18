import { Portfolio, PortfolioSecurity } from './portfolioService';
import { recommendationService, Recommendation } from './recommendationService';
import { financialService } from './financialService';

export interface RebalancingSuggestion {
  symbol: string;
  currentAllocation: number; // percentage
  suggestedAllocation: number; // percentage
  action: 'buy' | 'sell' | 'hold';
  sharesToTrade: number;
  estimatedValue: number;
  reason: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
}

export interface PortfolioRebalancingAnalysis {
  portfolioId: string;
  totalValue: number;
  currentAllocations: Array<{
    symbol: string;
    allocation: number;
    value: number;
  }>;
  suggestions: RebalancingSuggestion[];
  targetAllocations: Array<{
    symbol: string;
    targetAllocation: number;
  }>;
  summary: {
    totalBuyValue: number;
    totalSellValue: number;
    rebalancingScore: number; // 0-100, higher is better
    riskLevel: 'low' | 'medium' | 'high';
  };
}

class PortfolioRebalancingService {
  private readonly TARGET_ALLOCATION_RANGES = {
    // Conservative allocation targets
    conservative: {
      bonds: { min: 40, max: 60 },
      largeCap: { min: 20, max: 35 },
      midCap: { min: 10, max: 20 },
      smallCap: { min: 5, max: 15 },
      international: { min: 10, max: 25 },
      cash: { min: 5, max: 15 }
    },
    // Moderate allocation targets
    moderate: {
      bonds: { min: 25, max: 45 },
      largeCap: { min: 25, max: 40 },
      midCap: { min: 15, max: 25 },
      smallCap: { min: 10, max: 20 },
      international: { min: 15, max: 30 },
      cash: { min: 3, max: 10 }
    },
    // Aggressive allocation targets
    aggressive: {
      bonds: { min: 10, max: 30 },
      largeCap: { min: 30, max: 45 },
      midCap: { min: 20, max: 30 },
      smallCap: { min: 15, max: 25 },
      international: { min: 20, max: 35 },
      cash: { min: 2, max: 8 }
    }
  };

  async analyzePortfolioRebalancing(
    portfolio: Portfolio,
    riskProfile: 'conservative' | 'moderate' | 'aggressive' = 'moderate'
  ): Promise<PortfolioRebalancingAnalysis> {
    try {
      // Calculate current portfolio value and allocations
      const totalValue = this.calculateTotalPortfolioValue(portfolio);
      const currentAllocations = this.calculateCurrentAllocations(portfolio, totalValue);

      // Get recommendations for each security
      const recommendations = await this.getRecommendationsForPortfolio(portfolio);

      // Determine target allocations based on risk profile and recommendations
      const targetAllocations = this.calculateTargetAllocations(
        portfolio,
        recommendations,
        riskProfile
      );

      // Generate rebalancing suggestions
      const suggestions = this.generateRebalancingSuggestions(
        currentAllocations,
        targetAllocations,
        portfolio,
        recommendations
      );

      // Calculate summary metrics
      const summary = this.calculateRebalancingSummary(suggestions, totalValue);

      return {
        portfolioId: portfolio.id,
        totalValue,
        currentAllocations,
        suggestions,
        targetAllocations,
        summary
      };
    } catch (error) {
      console.error('Error analyzing portfolio rebalancing:', error);
      throw error;
    }
  }

  private calculateTotalPortfolioValue(portfolio: Portfolio): number {
    return portfolio.securities.reduce((total, security) => {
      return total + (security.shares * security.security.price);
    }, 0);
  }

  private calculateCurrentAllocations(
    portfolio: Portfolio,
    totalValue: number
  ): Array<{ symbol: string; allocation: number; value: number }> {
    return portfolio.securities.map(security => {
      const value = security.shares * security.security.price;
      const allocation = (value / totalValue) * 100;
      return {
        symbol: security.security.ticker,
        allocation: Math.round(allocation * 100) / 100,
        value: Math.round(value * 100) / 100
      };
    });
  }

  private async getRecommendationsForPortfolio(
    portfolio: Portfolio
  ): Promise<Map<string, Recommendation>> {
    const recommendations = new Map<string, Recommendation>();
    
    for (const security of portfolio.securities) {
      try {
        const recommendation = await recommendationService.getRecommendationBySymbol(
          security.security.ticker
        );
        recommendations.set(security.security.ticker, recommendation);
      } catch (error) {
        console.warn(`Could not get recommendation for ${security.security.ticker}:`, error);
        // Create a default recommendation
        recommendations.set(security.security.ticker, {
          recommendation: 'hold',
          numberOfAnalysts: 0,
          targetLowPrice: 0,
          targetHighPrice: 0,
          targetMeanPrice: 0,
          targetMedianPrice: 0,
          potentialReturn: 0,
          confidence: 20,
          lastUpdated: new Date()
        });
      }
    }

    return recommendations;
  }

  private calculateTargetAllocations(
    portfolio: Portfolio,
    recommendations: Map<string, Recommendation>,
    riskProfile: 'conservative' | 'moderate' | 'aggressive'
  ): Array<{ symbol: string; targetAllocation: number }> {
    const targetAllocations: Array<{ symbol: string; targetAllocation: number }> = [];
    const ranges = this.TARGET_ALLOCATION_RANGES[riskProfile];
    
    // Group securities by market cap and sector
    const securityGroups = this.groupSecuritiesByType(portfolio);
    
    // Calculate base allocations by security type
    let remainingAllocation = 100;
    
    // Allocate to bonds first (if any)
    if (securityGroups.bonds.length > 0) {
      const bondAllocation = Math.min(
        ranges.bonds.max,
        Math.max(ranges.bonds.min, remainingAllocation * 0.3)
      );
      const allocationPerBond = bondAllocation / securityGroups.bonds.length;
      
      securityGroups.bonds.forEach(symbol => {
        targetAllocations.push({ symbol, targetAllocation: allocationPerBond });
      });
      remainingAllocation -= bondAllocation;
    }

    // Allocate to large cap stocks
    if (securityGroups.largeCap.length > 0) {
      const largeCapAllocation = Math.min(
        ranges.largeCap.max,
        Math.max(ranges.largeCap.min, remainingAllocation * 0.4)
      );
      const allocationPerLargeCap = largeCapAllocation / securityGroups.largeCap.length;
      
      securityGroups.largeCap.forEach(symbol => {
        targetAllocations.push({ symbol, targetAllocation: allocationPerLargeCap });
      });
      remainingAllocation -= largeCapAllocation;
    }

    // Allocate to mid cap stocks
    if (securityGroups.midCap.length > 0) {
      const midCapAllocation = Math.min(
        ranges.midCap.max,
        Math.max(ranges.midCap.min, remainingAllocation * 0.3)
      );
      const allocationPerMidCap = midCapAllocation / securityGroups.midCap.length;
      
      securityGroups.midCap.forEach(symbol => {
        targetAllocations.push({ symbol, targetAllocation: allocationPerMidCap });
      });
      remainingAllocation -= midCapAllocation;
    }

    // Allocate to small cap stocks
    if (securityGroups.smallCap.length > 0) {
      const smallCapAllocation = Math.min(
        ranges.smallCap.max,
        Math.max(ranges.smallCap.min, remainingAllocation * 0.2)
      );
      const allocationPerSmallCap = smallCapAllocation / securityGroups.smallCap.length;
      
      securityGroups.smallCap.forEach(symbol => {
        targetAllocations.push({ symbol, targetAllocation: allocationPerSmallCap });
      });
      remainingAllocation -= smallCapAllocation;
    }

    // Allocate remaining to international
    if (securityGroups.international.length > 0) {
      const internationalAllocation = Math.min(
        ranges.international.max,
        Math.max(ranges.international.min, remainingAllocation)
      );
      const allocationPerInternational = internationalAllocation / securityGroups.international.length;
      
      securityGroups.international.forEach(symbol => {
        targetAllocations.push({ symbol, targetAllocation: allocationPerInternational });
      });
      remainingAllocation -= internationalAllocation;
    }

    // Adjust allocations based on recommendations
    this.adjustAllocationsByRecommendations(targetAllocations, recommendations);

    // Normalize allocations to ensure they sum to 100%
    this.normalizeAllocations(targetAllocations);

    return targetAllocations;
  }

  private groupSecuritiesByType(portfolio: Portfolio): {
    bonds: string[];
    largeCap: string[];
    midCap: string[];
    smallCap: string[];
    international: string[];
  } {
    const groups = {
      bonds: [] as string[],
      largeCap: [] as string[],
      midCap: [] as string[],
      smallCap: [] as string[],
      international: [] as string[]
    };

    portfolio.securities.forEach(security => {
      const ticker = security.security.ticker;
      const marketCap = security.security.market_cap || 0;
      const sector = security.security.sector?.toLowerCase() || '';

      // Categorize by market cap and sector
      if (sector.includes('bond') || ticker.includes('BOND') || ticker.includes('TLT') || ticker.includes('AGG')) {
        groups.bonds.push(ticker);
      } else if (marketCap > 10000000000) { // > $10B
        groups.largeCap.push(ticker);
      } else if (marketCap > 2000000000) { // $2B - $10B
        groups.midCap.push(ticker);
      } else if (marketCap > 300000000) { // $300M - $2B
        groups.smallCap.push(ticker);
      } else {
        // Assume international if we can't determine
        groups.international.push(ticker);
      }
    });

    return groups;
  }

  private adjustAllocationsByRecommendations(
    targetAllocations: Array<{ symbol: string; targetAllocation: number }>,
    recommendations: Map<string, Recommendation>
  ): void {
    targetAllocations.forEach(allocation => {
      const recommendation = recommendations.get(allocation.symbol);
      if (recommendation) {
        // Adjust allocation based on recommendation strength
        const adjustmentFactor = this.getRecommendationAdjustmentFactor(recommendation);
        allocation.targetAllocation *= adjustmentFactor;
      }
    });
  }

  private getRecommendationAdjustmentFactor(recommendation: Recommendation): number {
    const recommendationMap: { [key: string]: number } = {
      'strong_buy': 1.3,
      'buy': 1.15,
      'hold': 1.0,
      'sell': 0.85,
      'strong_sell': 0.7
    };

    const baseFactor = recommendationMap[recommendation.recommendation] || 1.0;
    const confidenceMultiplier = recommendation.confidence / 100;
    
    return baseFactor * confidenceMultiplier + (1 - confidenceMultiplier);
  }

  private normalizeAllocations(targetAllocations: Array<{ symbol: string; targetAllocation: number }>): void {
    const total = targetAllocations.reduce((sum, allocation) => sum + allocation.targetAllocation, 0);
    
    if (total > 0) {
      targetAllocations.forEach(allocation => {
        allocation.targetAllocation = (allocation.targetAllocation / total) * 100;
      });
    }
  }

  private generateRebalancingSuggestions(
    currentAllocations: Array<{ symbol: string; allocation: number; value: number }>,
    targetAllocations: Array<{ symbol: string; targetAllocation: number }>,
    portfolio: Portfolio,
    recommendations: Map<string, Recommendation>
  ): RebalancingSuggestion[] {
    const suggestions: RebalancingSuggestion[] = [];
    const totalValue = this.calculateTotalPortfolioValue(portfolio);

    targetAllocations.forEach(target => {
      const current = currentAllocations.find(c => c.symbol === target.symbol);
      const portfolioSecurity = portfolio.securities.find(s => s.security.ticker === target.symbol);
      const recommendation = recommendations.get(target.symbol);

      if (!current || !portfolioSecurity) return;

      const allocationDifference = target.targetAllocation - current.allocation;
      const valueDifference = (allocationDifference / 100) * totalValue;
      const sharesToTrade = valueDifference / portfolioSecurity.security.price;

      // Determine action based on allocation difference
      let action: 'buy' | 'sell' | 'hold' = 'hold';
      if (allocationDifference > 2) { // More than 2% difference
        action = 'buy';
      } else if (allocationDifference < -2) { // Less than -2% difference
        action = 'sell';
      }

      // Calculate priority based on difference magnitude and recommendation
      let priority: 'high' | 'medium' | 'low' = 'medium';
      if (Math.abs(allocationDifference) > 5) {
        priority = 'high';
      } else if (Math.abs(allocationDifference) < 1) {
        priority = 'low';
      }

      // Generate reason for the suggestion
      const reason = this.generateSuggestionReason(
        target.symbol,
        allocationDifference,
        recommendation,
        action
      );

      suggestions.push({
        symbol: target.symbol,
        currentAllocation: current.allocation,
        suggestedAllocation: target.targetAllocation,
        action,
        sharesToTrade: Math.round(sharesToTrade * 100) / 100,
        estimatedValue: Math.round(Math.abs(valueDifference) * 100) / 100,
        reason,
        confidence: recommendation?.confidence || 20,
        priority
      });
    });

    // Sort by priority and magnitude of change
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return Math.abs(b.suggestedAllocation - b.currentAllocation) - 
             Math.abs(a.suggestedAllocation - a.currentAllocation);
    });
  }

  private generateSuggestionReason(
    symbol: string,
    allocationDifference: number,
    recommendation: Recommendation | undefined,
    action: 'buy' | 'sell' | 'hold'
  ): string {
    const reasons: string[] = [];

    if (Math.abs(allocationDifference) > 5) {
      reasons.push('Significant allocation imbalance');
    } else if (Math.abs(allocationDifference) > 2) {
      reasons.push('Moderate allocation adjustment needed');
    }

    if (recommendation) {
      if (recommendation.recommendation === 'strong_buy' && action === 'buy') {
        reasons.push('Strong buy recommendation from analysts');
      } else if (recommendation.recommendation === 'buy' && action === 'buy') {
        reasons.push('Buy recommendation from analysts');
      } else if (recommendation.recommendation === 'sell' && action === 'sell') {
        reasons.push('Sell recommendation from analysts');
      } else if (recommendation.recommendation === 'strong_sell' && action === 'sell') {
        reasons.push('Strong sell recommendation from analysts');
      }
    }

    if (reasons.length === 0) {
      reasons.push('Portfolio rebalancing to maintain target allocation');
    }

    return reasons.join('. ');
  }

  private calculateRebalancingSummary(
    suggestions: RebalancingSuggestion[],
    totalValue: number
  ): {
    totalBuyValue: number;
    totalSellValue: number;
    rebalancingScore: number;
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const totalBuyValue = suggestions
      .filter(s => s.action === 'buy')
      .reduce((sum, s) => sum + s.estimatedValue, 0);

    const totalSellValue = suggestions
      .filter(s => s.action === 'sell')
      .reduce((sum, s) => sum + s.estimatedValue, 0);

    // Calculate rebalancing score (0-100)
    const totalChanges = suggestions.reduce((sum, s) => sum + Math.abs(s.currentAllocation - s.suggestedAllocation), 0);
    const rebalancingScore = Math.max(0, 100 - totalChanges);

    // Determine risk level based on changes
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (totalChanges > 20) {
      riskLevel = 'high';
    } else if (totalChanges > 10) {
      riskLevel = 'medium';
    }

    return {
      totalBuyValue: Math.round(totalBuyValue * 100) / 100,
      totalSellValue: Math.round(totalSellValue * 100) / 100,
      rebalancingScore: Math.round(rebalancingScore * 100) / 100,
      riskLevel
    };
  }
}

export const portfolioRebalancingService = new PortfolioRebalancingService(); 