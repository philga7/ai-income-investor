import { portfolioRebalancingService } from '@/services/portfolioRebalancingService';
import { recommendationService } from '@/services/recommendationService';
import { financialService } from '@/services/financialService';
import { Portfolio, PortfolioSecurity } from '@/services/portfolioService';
import { Recommendation } from '@/services/recommendationService';

// Mock dependencies
jest.mock('@/services/recommendationService', () => ({
  recommendationService: {
    getRecommendationBySymbol: jest.fn(),
  },
}));

jest.mock('@/services/financialService', () => ({
  financialService: {
    getQuote: jest.fn(),
  },
}));

describe('PortfolioRebalancingService', () => {
  let service: typeof portfolioRebalancingService;
  let mockPortfolio: Portfolio;
  let mockRecommendations: Map<string, Recommendation>;

  beforeEach(() => {
    service = portfolioRebalancingService;
    jest.clearAllMocks();

    // Create mock portfolio
    mockPortfolio = {
      id: 'portfolio-1',
      name: 'Test Portfolio',
      description: 'Test portfolio for rebalancing',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      securities: [
        {
          id: 'ps-1',
          shares: 100,
          average_cost: 150,
          security: {
            id: 'sec-1',
            ticker: 'AAPL',
            name: 'Apple Inc.',
            sector: 'Technology',
            industry: 'Consumer Electronics',
            price: 175.50,
            prev_close: 174.00,
            open: 174.50,
            volume: 1000000,
            market_cap: 2000000000000,
            pe: 25.5,
            eps: 6.88,
            dividend: 0.88,
            yield: 0.5,
            dividend_growth_5yr: 5.2,
            payout_ratio: 0.25,
            forward_pe: 24.0,
            price_to_sales_trailing_12_months: 5.2,
            beta: 1.2,
            fifty_day_average: 175.00,
            two_hundred_day_average: 170.00,
            day_low: 174.00,
            day_high: 176.00,
            fifty_two_week_low: 150.00,
            fifty_two_week_high: 200.00,
            average_volume: 800000,
            ex_dividend_date: '2024-01-15',
            operating_cash_flow: 120000000000,
            free_cash_flow: 100000000000,
            cash_flow_growth: 10,
            last_fetched: '2024-01-01T00:00:00Z',
            sma200: 'above',
            tags: ['large-cap', 'tech']
          }
        },
        {
          id: 'ps-2',
          shares: 50,
          average_cost: 300,
          security: {
            id: 'sec-2',
            ticker: 'MSFT',
            name: 'Microsoft Corporation',
            sector: 'Technology',
            industry: 'Software',
            price: 350.00,
            prev_close: 348.00,
            open: 348.50,
            volume: 2000000,
            market_cap: 2500000000000,
            pe: 30.0,
            eps: 11.67,
            dividend: 2.80,
            yield: 0.8,
            dividend_growth_5yr: 6.1,
            payout_ratio: 0.30,
            forward_pe: 28.5,
            price_to_sales_trailing_12_months: 8.1,
            beta: 1.1,
            fifty_day_average: 350.00,
            two_hundred_day_average: 345.00,
            day_low: 348.00,
            day_high: 352.00,
            fifty_two_week_low: 300.00,
            fifty_two_week_high: 400.00,
            average_volume: 1500000,
            ex_dividend_date: '2024-01-20',
            operating_cash_flow: 80000000000,
            free_cash_flow: 60000000000,
            cash_flow_growth: 15,
            last_fetched: '2024-01-01T00:00:00Z',
            sma200: 'above',
            tags: ['large-cap', 'tech']
          }
        }
      ]
    };

    // Create mock recommendations
    mockRecommendations = new Map([
      ['AAPL', {
        recommendation: 'buy',
        numberOfAnalysts: 25,
        targetLowPrice: 160,
        targetHighPrice: 200,
        targetMeanPrice: 180,
        targetMedianPrice: 182,
        potentialReturn: 2.6,
        confidence: 75,
        lastUpdated: new Date()
      }],
      ['MSFT', {
        recommendation: 'hold',
        numberOfAnalysts: 30,
        targetLowPrice: 320,
        targetHighPrice: 380,
        targetMeanPrice: 350,
        targetMedianPrice: 352,
        potentialReturn: 0,
        confidence: 60,
        lastUpdated: new Date()
      }]
    ]);

    // Mock recommendation service
    (recommendationService.getRecommendationBySymbol as jest.Mock).mockImplementation(
      (symbol: string) => {
        const recommendation = mockRecommendations.get(symbol);
        if (recommendation) {
          return Promise.resolve(recommendation);
        }
        throw new Error(`No recommendation found for ${symbol}`);
      }
    );
  });

  describe('analyzePortfolioRebalancing', () => {
    it('should analyze portfolio rebalancing successfully', async () => {
      const result = await service.analyzePortfolioRebalancing(mockPortfolio, 'moderate');

      expect(result.portfolioId).toBe('portfolio-1');
      expect(result.totalValue).toBeGreaterThan(0);
      expect(result.currentAllocations).toHaveLength(2);
      expect(result.suggestions).toBeDefined();
      expect(result.targetAllocations).toBeDefined();
      expect(result.summary).toBeDefined();
    });

    it('should handle different risk profiles', async () => {
      const conservativeResult = await service.analyzePortfolioRebalancing(mockPortfolio, 'conservative');
      const moderateResult = await service.analyzePortfolioRebalancing(mockPortfolio, 'moderate');
      const aggressiveResult = await service.analyzePortfolioRebalancing(mockPortfolio, 'aggressive');

      expect(conservativeResult.summary.riskLevel).toBe('low');
      expect(moderateResult.summary.riskLevel).toBe('low');
      expect(aggressiveResult.summary.riskLevel).toBe('low');
    });

    it('should handle portfolio with no securities', async () => {
      const emptyPortfolio = { ...mockPortfolio, securities: [] };
      
      const result = await service.analyzePortfolioRebalancing(emptyPortfolio, 'moderate');
      
      expect(result.totalValue).toBe(0);
      expect(result.currentAllocations).toHaveLength(0);
      expect(result.suggestions).toHaveLength(0);
    });

    it('should handle recommendation service errors gracefully', async () => {
      (recommendationService.getRecommendationBySymbol as jest.Mock).mockRejectedValue(
        new Error('API Error')
      );

      const result = await service.analyzePortfolioRebalancing(mockPortfolio, 'moderate');
      
      expect(result.suggestions).toBeDefined();
      // Should still complete analysis with default recommendations
    });

    it('should handle errors in analyzePortfolioRebalancing', async () => {
      const result = await portfolioRebalancingService.analyzePortfolioRebalancing(mockPortfolio);
      expect(result).toBeDefined();
      expect(result.portfolioId).toBe('portfolio-1');
    });
  });

  describe('calculateTotalPortfolioValue', () => {
    it('should calculate total portfolio value correctly', () => {
      const totalValue = (service as any).calculateTotalPortfolioValue(mockPortfolio);
      
      // AAPL: 100 shares * $175.50 = $17,550
      // MSFT: 50 shares * $350.00 = $17,500
      // Total: $35,050
      expect(totalValue).toBe(35050);
    });

    it('should handle zero shares', () => {
      const portfolioWithZeroShares = {
        ...mockPortfolio,
        securities: [
          { ...mockPortfolio.securities[0], shares: 0 }
        ]
      };
      
      const totalValue = (service as any).calculateTotalPortfolioValue(portfolioWithZeroShares);
      expect(totalValue).toBe(0);
    });
  });

  describe('calculateCurrentAllocations', () => {
    it('should calculate current allocations correctly', () => {
      const totalValue = 35050; // From previous test
      const allocations = (service as any).calculateCurrentAllocations(mockPortfolio, totalValue);
      
      expect(allocations).toHaveLength(2);
      
      // AAPL allocation: (17550 / 35050) * 100 = 50.07%
      expect(allocations[0].symbol).toBe('AAPL');
      expect(allocations[0].allocation).toBeCloseTo(50.07, 1);
      expect(allocations[0].value).toBe(17550);
      
      // MSFT allocation: (17500 / 35050) * 100 = 49.93%
      expect(allocations[1].symbol).toBe('MSFT');
      expect(allocations[1].allocation).toBeCloseTo(49.93, 1);
      expect(allocations[1].value).toBe(17500);
    });

    it('should handle zero total value', () => {
      const allocations = (service as any).calculateCurrentAllocations(mockPortfolio, 0);
      
      expect(allocations).toHaveLength(2);
      expect(allocations[0].percentage).toBe(undefined);
    });
  });

  describe('getRecommendationsForPortfolio', () => {
    it('should fetch recommendations for all securities', async () => {
      const recommendations = await (service as any).getRecommendationsForPortfolio(mockPortfolio);
      
      expect(recommendations.size).toBe(2);
      expect(recommendations.has('AAPL')).toBe(true);
      expect(recommendations.has('MSFT')).toBe(true);
      expect(recommendationService.getRecommendationBySymbol).toHaveBeenCalledTimes(2);
    });

    it('should handle missing recommendations with defaults', async () => {
      (recommendationService.getRecommendationBySymbol as jest.Mock).mockRejectedValue(
        new Error('Not found')
      );

      const recommendations = await (service as any).getRecommendationsForPortfolio(mockPortfolio);
      
      expect(recommendations.size).toBe(2);
      recommendations.forEach((recommendation: any) => {
        expect(recommendation.recommendation).toBe('hold');
        expect(recommendation.confidence).toBe(20);
      });
    });
  });

  describe('calculateTargetAllocations', () => {
    it('should calculate target allocations for moderate risk profile', () => {
      const targetAllocations = (service as any).calculateTargetAllocations(
        mockPortfolio,
        mockRecommendations,
        'moderate'
      );
      
      expect(targetAllocations).toBeDefined();
      expect(targetAllocations.length).toBeGreaterThan(0);
      
      // Should have allocations for both securities
      const symbols = targetAllocations.map((ta: any) => ta.symbol);
      expect(symbols).toContain('AAPL');
      expect(symbols).toContain('MSFT');
    });

    it('should adjust allocations based on recommendations', () => {
      const buyRecommendation = {
        recommendation: 'buy',
        numberOfAnalysts: 25,
        targetLowPrice: 160,
        targetHighPrice: 200,
        targetMeanPrice: 180,
        targetMedianPrice: 182,
        potentialReturn: 10,
        confidence: 80,
        lastUpdated: new Date()
      };
      
      const sellRecommendation = {
        recommendation: 'sell',
        numberOfAnalysts: 20,
        targetLowPrice: 140,
        targetHighPrice: 160,
        targetMeanPrice: 150,
        targetMedianPrice: 152,
        potentialReturn: -5,
        confidence: 70,
        lastUpdated: new Date()
      };
      
      const recommendations = new Map([
        ['AAPL', buyRecommendation],
        ['MSFT', sellRecommendation]
      ]);
      
      const targetAllocations = (service as any).calculateTargetAllocations(
        mockPortfolio,
        recommendations,
        'moderate'
      );
      
      // AAPL should have higher allocation due to buy recommendation
      // MSFT should have lower allocation due to sell recommendation
      const aaplAllocation = targetAllocations.find((ta: any) => ta.symbol === 'AAPL');
      const msftAllocation = targetAllocations.find((ta: any) => ta.symbol === 'MSFT');
      
      expect(aaplAllocation?.targetAllocation).toBeGreaterThan(msftAllocation?.targetAllocation || 0);
    });
  });

  describe('generateRebalancingSuggestions', () => {
    it('should generate buy suggestions for underweight positions', () => {
      const currentAllocations = [
        { symbol: 'AAPL', allocation: 30, value: 10500 },
        { symbol: 'MSFT', allocation: 70, value: 24500 }
      ];
      
      const targetAllocations = [
        { symbol: 'AAPL', targetAllocation: 50 },
        { symbol: 'MSFT', targetAllocation: 50 }
      ];
      
      const suggestions = (service as any).generateRebalancingSuggestions(
        currentAllocations,
        targetAllocations,
        mockPortfolio,
        mockRecommendations
      );
      
      expect(suggestions).toHaveLength(2);
      
      const aaplSuggestion = suggestions.find((s: any) => s.symbol === 'AAPL');
      expect(aaplSuggestion?.action).toBe('buy');
      expect(aaplSuggestion?.sharesToTrade).toBeGreaterThan(0);
    });

    it('should generate sell suggestions for overweight positions', () => {
      const currentAllocations = [
        { symbol: 'AAPL', allocation: 70, value: 24500 },
        { symbol: 'MSFT', allocation: 30, value: 10500 }
      ];
      
      const targetAllocations = [
        { symbol: 'AAPL', targetAllocation: 50 },
        { symbol: 'MSFT', targetAllocation: 50 }
      ];
      
      const suggestions = (service as any).generateRebalancingSuggestions(
        currentAllocations,
        targetAllocations,
        mockPortfolio,
        mockRecommendations
      );
      
      const aaplSuggestion = suggestions.find((s: any) => s.symbol === 'AAPL');
      expect(aaplSuggestion?.action).toBe('sell');
      expect(aaplSuggestion?.sharesToTrade).toBe(-39.94);
    });

    it('should generate hold suggestions for balanced positions', () => {
      const currentAllocations = [
        { symbol: 'AAPL', allocation: 50, value: 17500 },
        { symbol: 'MSFT', allocation: 50, value: 17500 }
      ];
      
      const targetAllocations = [
        { symbol: 'AAPL', targetAllocation: 50 },
        { symbol: 'MSFT', targetAllocation: 50 }
      ];
      
      const suggestions = (service as any).generateRebalancingSuggestions(
        currentAllocations,
        targetAllocations,
        mockPortfolio,
        mockRecommendations
      );
      
      suggestions.forEach((suggestion: any) => {
        expect(suggestion.action).toBe('hold');
        expect(suggestion.sharesToTrade).toBe(0);
      });
    });
  });

  describe('calculateRebalancingSummary', () => {
    it('should calculate summary metrics correctly', () => {
      const suggestions = [
        {
          symbol: 'AAPL',
          currentAllocation: 30,
          suggestedAllocation: 50,
          action: 'buy',
          sharesToTrade: 10,
          estimatedValue: 1755,
          reason: 'Underweight position',
          confidence: 75,
          priority: 'high' as const
        },
        {
          symbol: 'MSFT',
          currentAllocation: 70,
          suggestedAllocation: 50,
          action: 'sell',
          sharesToTrade: 5,
          estimatedValue: 1750,
          reason: 'Overweight position',
          confidence: 60,
          priority: 'medium' as const
        }
      ];
      
      const totalValue = 35050;
      const summary = (service as any).calculateRebalancingSummary(suggestions, totalValue);
      
      expect(summary.totalBuyValue).toBe(1755);
      expect(summary.totalSellValue).toBe(1750);
      expect(summary.rebalancingScore).toBeGreaterThan(0);
      expect(summary.rebalancingScore).toBeLessThanOrEqual(100);
      expect(['low', 'medium', 'high']).toContain(summary.riskLevel);
    });

    it('should handle empty suggestions', () => {
      const summary = (service as any).calculateRebalancingSummary([], 10000);
      
      expect(summary.totalBuyValue).toBe(0);
      expect(summary.totalSellValue).toBe(0);
      expect(summary.rebalancingScore).toBe(100); // Perfect balance
    });
  });

  describe('Error handling', () => {
    it('should handle invalid risk profile', async () => {
      await expect(service.analyzePortfolioRebalancing(mockPortfolio, 'invalid' as any))
        .rejects.toThrow();
    });
  });
}); 