import { financialService } from './financialService';

export interface Recommendation {
  recommendation: string;
  numberOfAnalysts: number;
  targetLowPrice: number;
  targetHighPrice: number;
  targetMeanPrice: number;
  targetMedianPrice: number;
  potentialReturn: number;
  confidence: number;
  lastUpdated: Date;
}

class RecommendationService {
  async getRecommendationBySymbol(symbol: string): Promise<Recommendation> {
    try {
      const quoteSummary = await financialService.getQuoteSummary(symbol);
      
      if (!quoteSummary.financialData) {
        throw new Error('No financial data available for this symbol');
      }

      const {
        recommendationKey,
        numberOfAnalystOpinions,
        targetLowPrice,
        targetHighPrice,
        targetMeanPrice,
        targetMedianPrice,
      } = quoteSummary.financialData;

      const currentPrice = quoteSummary.price?.regularMarketPrice || 0;
      
      // Calculate potential return based on mean target price
      const potentialReturn = targetMeanPrice && currentPrice
        ? ((targetMeanPrice - currentPrice) / currentPrice) * 100
        : 0;

      // Calculate confidence based on number of analysts
      const confidence = this.calculateConfidence(numberOfAnalystOpinions || 0);

      return {
        recommendation: recommendationKey || 'N/A',
        numberOfAnalysts: numberOfAnalystOpinions || 0,
        targetLowPrice: targetLowPrice || 0,
        targetHighPrice: targetHighPrice || 0,
        targetMeanPrice: targetMeanPrice || 0,
        targetMedianPrice: targetMedianPrice || 0,
        potentialReturn,
        confidence,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error fetching recommendation:', error);
      throw error;
    }
  }

  calculateConfidence(numberOfAnalysts: number): number {
    // Base confidence on number of analysts
    // 0-5 analysts: 20-60%
    // 6-10 analysts: 60-80%
    // 11+ analysts: 80-100%
    if (numberOfAnalysts <= 0) return 20;
    if (numberOfAnalysts <= 5) return 20 + (numberOfAnalysts * 8);
    if (numberOfAnalysts <= 10) return 60 + ((numberOfAnalysts - 5) * 4);
    return Math.min(100, 80 + ((numberOfAnalysts - 10) * 2));
  }
}

export const recommendationService = new RecommendationService(); 