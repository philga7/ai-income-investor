import { enhancedPortfolioAnalysisService } from './enhancedPortfolioAnalysisService';

// Mock the dividend service
jest.mock('./dividendService', () => ({
  dividendService: {
    getUpcomingDividends: jest.fn().mockResolvedValue([
      {
        security_id: '1',
        ex_date: '2024-02-15',
        payment_date: '2024-03-01',
        amount: 0.50
      },
      {
        security_id: '2',
        ex_date: '2024-02-20',
        payment_date: '2024-03-05',
        amount: 0.75
      }
    ]),
    getNextDividendDates: jest.fn().mockResolvedValue({
      ex_date: '2024-02-15',
      payment_date: '2024-03-01',
      amount: 0.50
    })
  }
}));

// Mock the portfolio analytics service
jest.mock('./portfolioAnalyticsService', () => ({
  portfolioAnalyticsService: {
    calculatePortfolioAnalytics: jest.fn().mockReturnValue({
      valueMetrics: {
        totalValue: 10000,
        totalCost: 9500,
        totalGainLoss: 500,
        totalGainLossPercentage: 5.26,
        securityValues: {},
        portfolioMetrics: {}
      },
      dividendMetrics: {
        totalAnnualDividend: 400,
        totalMonthlyDividend: 33.33,
        portfolioYield: 4.0,
        weightedAverageYield: 4.2,
        securityDividends: {}
      }
    })
  }
}));

describe('Enhanced Portfolio Analysis Service', () => {
  const mockPortfolio = {
    id: '1',
    name: 'Test Portfolio',
    description: 'Test portfolio description',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    securities: [
      {
        id: 'ps1',
        shares: 100,
        average_cost: 50,
        security: {
          id: '1',
          ticker: 'AAPL',
          name: 'Apple Inc.',
          sector: 'Technology',
          industry: 'Consumer Electronics',
          price: 55,
          prev_close: 54,
          open: 54.5,
          volume: 50000000,
          market_cap: 2000000000000,
          pe: 25,
          eps: 2.2,
          dividend: 0.24,
          yield: 4.36,
          dividend_growth_5yr: 5.2,
          payout_ratio: 25,
          sma200: 'above' as const,
          tags: ['dividend', 'growth'],
          day_low: 54,
          day_high: 56,
          fifty_two_week_low: 40,
          fifty_two_week_high: 60,
          average_volume: 45000000,
          forward_pe: 23,
          price_to_sales_trailing_12_months: 5.2,
          beta: 1.2,
          fifty_day_average: 53,
          two_hundred_day_average: 52,
          ex_dividend_date: '2024-02-15',
          operating_cash_flow: 120000000000,
          free_cash_flow: 100000000000,
          cash_flow_growth: 8,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          last_fetched: '2024-01-01T00:00:00Z',
          return_on_equity: 15,
          return_on_assets: 8,
          profit_margins: 20,
          operating_margins: 25,
          debt_to_equity: 0.5,
          current_ratio: 1.5,
          quick_ratio: 1.2,
          revenue_growth: 8,
          earnings_growth: 10
        }
      },
      {
        id: 'ps2',
        shares: 50,
        average_cost: 80,
        security: {
          id: '2',
          ticker: 'JNJ',
          name: 'Johnson & Johnson',
          sector: 'Healthcare',
          industry: 'Pharmaceuticals',
          price: 85,
          prev_close: 84,
          open: 84.5,
          volume: 8000000,
          market_cap: 400000000000,
          pe: 18,
          eps: 4.7,
          dividend: 1.19,
          yield: 5.6,
          dividend_growth_5yr: 6.1,
          payout_ratio: 45,
          sma200: 'above' as const,
          tags: ['dividend', 'defensive'],
          day_low: 84,
          day_high: 86,
          fifty_two_week_low: 70,
          fifty_two_week_high: 90,
          average_volume: 7500000,
          forward_pe: 17,
          price_to_sales_trailing_12_months: 4.1,
          beta: 0.8,
          fifty_day_average: 83,
          two_hundred_day_average: 82,
          ex_dividend_date: '2024-02-20',
          operating_cash_flow: 25000000000,
          free_cash_flow: 20000000000,
          cash_flow_growth: 5,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          last_fetched: '2024-01-01T00:00:00Z',
          return_on_equity: 18,
          return_on_assets: 10,
          profit_margins: 22,
          operating_margins: 28,
          debt_to_equity: 0.3,
          current_ratio: 1.8,
          quick_ratio: 1.5,
          revenue_growth: 5,
          earnings_growth: 7
        }
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateEnhancedAnalysis', () => {
    it('should generate comprehensive portfolio analysis', async () => {
      const analysis = await enhancedPortfolioAnalysisService.generateEnhancedAnalysis(mockPortfolio);

      expect(analysis).toBeDefined();
      expect(analysis.portfolioId).toBe('1');
      expect(analysis.portfolioName).toBe('Test Portfolio');
      expect(analysis.totalValue).toBe(10000);
      expect(analysis.dividendMetrics.totalAnnualDividend).toBe(400);
      expect(analysis.securities).toHaveLength(2);
      expect(analysis.dividendTiming).toBeDefined();
      expect(analysis.portfolioInsights).toBeDefined();
    });

    it('should calculate dividend timing correctly', async () => {
      const analysis = await enhancedPortfolioAnalysisService.generateEnhancedAnalysis(mockPortfolio);

      expect(analysis.dividendTiming.nextDividendDate).toBe('2024-02-15');
      expect(analysis.dividendTiming.nextPaymentDate).toBe('2024-03-01');
      expect(analysis.dividendTiming.exDividendCalendar).toHaveLength(4); // 2 securities * 2 events each
      expect(analysis.dividendTiming.dividendReliability).toBeDefined();
      expect(analysis.dividendTiming.dividendGrowthTrend).toBeDefined();
      expect(analysis.dividendTiming.payoutRatioHealth).toBeDefined();
    });

    it('should analyze securities correctly', async () => {
      const analysis = await enhancedPortfolioAnalysisService.generateEnhancedAnalysis(mockPortfolio);

      expect(analysis.securities).toHaveLength(2);
      
      const aapl = analysis.securities.find(s => s.ticker === 'AAPL');
      expect(aapl).toBeDefined();
      expect(aapl?.shares).toBe(100);
      expect(aapl?.currentPrice).toBe(55);
      expect(aapl?.dividendYield).toBe(4.36);
      expect(aapl?.sector).toBe('Technology');
      expect(aapl?.dividendReliability).toBeDefined();
    });

    it('should generate portfolio insights', async () => {
      const analysis = await enhancedPortfolioAnalysisService.generateEnhancedAnalysis(mockPortfolio);

      expect(analysis.portfolioInsights.dividendConcentration).toBeDefined();
      expect(analysis.portfolioInsights.sectorDiversification).toBeDefined();
      expect(analysis.portfolioInsights.dividendReliability).toBeDefined();
      expect(analysis.portfolioInsights.incomeStability).toBeDefined();
    });
  });

  describe('formatForAIAnalysis', () => {
    it('should format analysis data for AI consumption', async () => {
      const analysis = await enhancedPortfolioAnalysisService.generateEnhancedAnalysis(mockPortfolio);
      const formatted = enhancedPortfolioAnalysisService.formatForAIAnalysis(analysis);

      expect(formatted).toContain('PORTFOLIO ANALYSIS: Test Portfolio');
      expect(formatted).toContain('Total Value: $10,000');
      expect(formatted).toContain('Annual Dividend Income: $400');
      expect(formatted).toContain('AAPL: 100 shares @ $55');
      expect(formatted).toContain('JNJ: 50 shares @ $85');
      expect(formatted).toContain('Next dividend ex-date:');
    });
  });

  describe('parseAIResponse', () => {
    it('should parse AI response into structured format', () => {
      const mockAIResponse = `
        Based on my analysis, I recommend:
        
        BUY AAPL - Strong dividend growth and low payout ratio
        HOLD JNJ - Stable dividend but consider reducing position
        SELL XYZ - High payout ratio concerns
        
        Overall risk is LOW with good dividend reliability.
        Dividend cut risk is MEDIUM due to sector concentration.
      `;

      const mockUsage = {
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        estimatedCost: 0.0025
      };

      const parsed = enhancedPortfolioAnalysisService.parseAIResponse(
        mockAIResponse,
        mockUsage,
        'claude-3-5-haiku-20241022'
      );

      expect(parsed.analysis).toBe(mockAIResponse);
      expect(parsed.usage).toEqual(mockUsage);
      expect(parsed.model).toBe('claude-3-5-haiku-20241022');
      expect(parsed.recommendations).toBeDefined();
      expect(parsed.dividendInsights).toBeDefined();
      expect(parsed.riskAssessment).toBeDefined();
    });

    it('should extract recommendations correctly', () => {
      const mockResponse = `
        BUY AAPL - Strong fundamentals
        SELL XYZ - Poor performance
        HOLD JNJ - Stable position
      `;

      const parsed = enhancedPortfolioAnalysisService.parseAIResponse(
        mockResponse,
        { inputTokens: 100, outputTokens: 50, totalTokens: 150, estimatedCost: 0.001 },
        'test-model'
      );

      expect(parsed.recommendations.length).toBeGreaterThan(0);
      expect(parsed.recommendations.some(r => r.type === 'buy')).toBe(true);
      expect(parsed.recommendations.some(r => r.type === 'sell')).toBe(true);
      expect(parsed.recommendations.some(r => r.type === 'hold')).toBe(true);
    });
  });

  describe('calculateDividendReliability', () => {
    it('should calculate high reliability for strong dividend stocks', () => {
      const portfolio = {
        ...mockPortfolio,
        securities: [
          {
            ...mockPortfolio.securities[0],
            security: {
              ...mockPortfolio.securities[0].security,
              payout_ratio: 30,
              dividend_growth_5yr: 8
            }
          }
        ]
      };

      const reliability = enhancedPortfolioAnalysisService.calculateDividendReliability(portfolio);
      expect(reliability).toBe('high');
    });

    it('should calculate medium reliability for moderate dividend stocks', () => {
      const portfolio = {
        ...mockPortfolio,
        securities: [
          {
            ...mockPortfolio.securities[0],
            security: {
              ...mockPortfolio.securities[0].security,
              payout_ratio: 60,
              dividend_growth_5yr: 2
            }
          }
        ]
      };

      const reliability = enhancedPortfolioAnalysisService.calculateDividendReliability(portfolio);
      expect(reliability).toBe('medium');
    });

    it('should calculate low reliability for weak dividend stocks', () => {
      const portfolio = {
        ...mockPortfolio,
        securities: [
          {
            ...mockPortfolio.securities[0],
            security: {
              ...mockPortfolio.securities[0].security,
              payout_ratio: 90,
              dividend_growth_5yr: -2
            }
          }
        ]
      };

      const reliability = enhancedPortfolioAnalysisService.calculateDividendReliability(portfolio);
      expect(reliability).toBe('low');
    });
  });
}); 