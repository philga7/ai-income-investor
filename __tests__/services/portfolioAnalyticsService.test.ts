import { portfolioAnalyticsService } from '@/services/portfolioAnalyticsService';
import { dividendService } from '@/services/dividendService';
import { Portfolio, PortfolioSecurity } from '@/services/portfolioService';
import { DividendMetrics } from '@/services/dividendService';

// Mock dependencies
jest.mock('@/services/dividendService');

const mockDividendService = dividendService as jest.Mocked<typeof dividendService>;

describe('portfolioAnalyticsService', () => {
  const mockPortfolio: Portfolio = {
    id: 'portfolio-1',
    name: 'Test Portfolio',
    description: 'Test portfolio for unit tests',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
          forward_pe: 24.2,
          price_to_sales_trailing_12_months: 6.8,
          beta: 1.2,
          fifty_day_average: 175.00,
          two_hundred_day_average: 170.00,
          day_low: 174.00,
          day_high: 176.00,
          fifty_two_week_low: 150.00,
          fifty_two_week_high: 200.00,
          average_volume: 800000,
          return_on_equity: 0.15,
          return_on_assets: 0.08,
          profit_margins: 0.25,
          operating_margins: 0.30,
          debt_to_equity: 0.5,
          current_ratio: 1.5,
          quick_ratio: 1.2,
          free_cash_flow: 100000000000,
          operating_cash_flow: 120000000000,
          cash_flow_growth: 10,
          revenue_growth: 0.08,
          earnings_growth: 0.12,
          ex_dividend_date: '2024-01-15',
          sma200: 'above' as const,
          tags: ['large-cap', 'technology'],
          last_fetched: new Date().toISOString()
        }
      },
      {
        id: 'ps-2',
        shares: 50,
        average_cost: 200,
        security: {
          id: 'sec-2',
          ticker: 'MSFT',
          name: 'Microsoft Corporation',
          sector: 'Technology',
          industry: 'Software',
          price: 380.00,
          prev_close: 378.00,
          open: 378.50,
          volume: 2000000,
          market_cap: 2800000000000,
          pe: 35.2,
          eps: 10.80,
          dividend: 3.04,
          yield: 0.8,
          dividend_growth_5yr: 8.5,
          payout_ratio: 0.30,
          forward_pe: 32.1,
          price_to_sales_trailing_12_months: 12.5,
          beta: 0.9,
          fifty_day_average: 380.00,
          two_hundred_day_average: 375.00,
          day_low: 378.00,
          day_high: 382.00,
          fifty_two_week_low: 300.00,
          fifty_two_week_high: 400.00,
          average_volume: 1500000,
          return_on_equity: 0.40,
          return_on_assets: 0.15,
          profit_margins: 0.35,
          operating_margins: 0.40,
          debt_to_equity: 0.3,
          current_ratio: 2.1,
          quick_ratio: 1.8,
          free_cash_flow: 60000000000,
          operating_cash_flow: 80000000000,
          cash_flow_growth: 15,
          revenue_growth: 0.15,
          earnings_growth: 0.20,
          ex_dividend_date: '2024-01-20',
          sma200: 'above' as const,
          tags: ['large-cap', 'technology'],
          last_fetched: new Date().toISOString()
        }
      }
    ]
  };

  const mockDividendMetrics: DividendMetrics = {
    totalAnnualDividend: 2500,
    totalMonthlyDividend: 208.33,
    portfolioYield: 3.2,
    weightedAverageYield: 2.8,
    securityDividends: {
      'sec-1': {
        annualDividend: 88,
        monthlyDividend: 7.33,
        yield: 0.5,
        contributionToPortfolioYield: 0.24
      },
      'sec-2': {
        annualDividend: 152,
        monthlyDividend: 12.67,
        yield: 0.8,
        contributionToPortfolioYield: 0.42
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock dividend service
    mockDividendService.calculateDividendMetrics.mockReturnValue(mockDividendMetrics);
  });

  describe('calculatePortfolioAnalytics', () => {
    it('should calculate complete portfolio analytics', () => {
      const result = portfolioAnalyticsService.calculatePortfolioAnalytics(mockPortfolio);

      expect(result).toHaveProperty('valueMetrics');
      expect(result).toHaveProperty('dividendMetrics');
      expect(result.valueMetrics).toBeDefined();
      expect(result.dividendMetrics).toEqual(mockDividendMetrics);
    });

    it('should handle null portfolio', () => {
      const result = portfolioAnalyticsService.calculatePortfolioAnalytics(null as any);

      expect(result.valueMetrics.totalValue).toBe(0);
      expect(result.valueMetrics.totalCost).toBe(0);
      expect(result.valueMetrics.totalGainLoss).toBe(0);
      expect(result.valueMetrics.totalGainLossPercentage).toBe(0);
      expect(result.valueMetrics.securityValues).toEqual({});
      expect(result.dividendMetrics).toEqual(mockDividendMetrics);
    });

    it('should handle portfolio with no securities', () => {
      const emptyPortfolio: Portfolio = {
        ...mockPortfolio,
        securities: []
      };

      const result = portfolioAnalyticsService.calculatePortfolioAnalytics(emptyPortfolio);

      expect(result.valueMetrics.totalValue).toBe(0);
      expect(result.valueMetrics.totalCost).toBe(0);
      expect(result.valueMetrics.totalGainLoss).toBe(0);
      expect(result.valueMetrics.totalGainLossPercentage).toBe(0);
      expect(result.valueMetrics.securityValues).toEqual({});
    });

    it('should handle portfolio with undefined securities', () => {
      const portfolioWithUndefinedSecurities: Portfolio = {
        ...mockPortfolio,
        securities: undefined as any
      };

      const result = portfolioAnalyticsService.calculatePortfolioAnalytics(portfolioWithUndefinedSecurities);

      expect(result.valueMetrics.totalValue).toBe(0);
      expect(result.valueMetrics.totalCost).toBe(0);
    });

    it('should handle dividend service errors gracefully', () => {
      mockDividendService.calculateDividendMetrics.mockImplementation(() => {
        throw new Error('Dividend service error');
      });

      // Should throw error when dividend service fails
      expect(() => portfolioAnalyticsService.calculatePortfolioAnalytics(mockPortfolio))
        .toThrow('Dividend service error');
    });
  });

  describe('calculatePortfolioValue', () => {
    it('should calculate portfolio value correctly', () => {
      const result = portfolioAnalyticsService.calculatePortfolioValue(mockPortfolio);

      // AAPL: 100 shares * $175.50 = $17,550
      // MSFT: 50 shares * $380.00 = $19,000
      // Total: $36,550
      const expectedTotalValue = (100 * 175.50) + (50 * 380.00);
      expect(result.totalValue).toBe(expectedTotalValue);

      // AAPL: 100 shares * $150 = $15,000
      // MSFT: 50 shares * $200 = $10,000
      // Total: $25,000
      const expectedTotalCost = (100 * 150) + (50 * 200);
      expect(result.totalCost).toBe(expectedTotalCost);

      // Total gain/loss: $36,550 - $25,000 = $11,550
      const expectedGainLoss = expectedTotalValue - expectedTotalCost;
      expect(result.totalGainLoss).toBe(expectedGainLoss);

      // Gain/loss percentage: ($11,550 / $25,000) * 100 = 46.2%
      const expectedGainLossPercentage = (expectedGainLoss / expectedTotalCost) * 100;
      expect(result.totalGainLossPercentage).toBe(expectedGainLossPercentage);
    });

    it('should calculate individual security values', () => {
      const result = portfolioAnalyticsService.calculatePortfolioValue(mockPortfolio);

      const aaplSecurity = result.securityValues['sec-1'];
      expect(aaplSecurity).toBeDefined();
      expect(aaplSecurity.value).toBe(100 * 175.50); // $17,550
      expect(aaplSecurity.cost).toBe(100 * 150); // $15,000
      expect(aaplSecurity.gainLoss).toBe((100 * 175.50) - (100 * 150)); // $2,550
      expect(aaplSecurity.gainLossPercentage).toBe(((100 * 175.50) - (100 * 150)) / (100 * 150) * 100); // 17%

      const msftSecurity = result.securityValues['sec-2'];
      expect(msftSecurity).toBeDefined();
      expect(msftSecurity.value).toBe(50 * 380.00); // $19,000
      expect(msftSecurity.cost).toBe(50 * 200); // $10,000
      expect(msftSecurity.gainLoss).toBe((50 * 380.00) - (50 * 200)); // $9,000
    });

    it('should calculate day change metrics', () => {
      const result = portfolioAnalyticsService.calculatePortfolioValue(mockPortfolio);

      const aaplSecurity = result.securityValues['sec-1'];
      expect(aaplSecurity.dayChange).toBe(175.50 - 174.00); // $1.50
      expect(aaplSecurity.dayChangePercentage).toBe((1.50 / 174.00) * 100); // 0.86%

      const msftSecurity = result.securityValues['sec-2'];
      expect(msftSecurity.dayChange).toBe(380.00 - 378.00); // $2.00
      expect(msftSecurity.dayChangePercentage).toBe((2.00 / 378.00) * 100); // 0.53%
    });

    it('should handle cash securities', () => {
      const portfolioWithCash: Portfolio = {
        ...mockPortfolio,
        securities: [
          {
            id: 'ps-cash',
            shares: 10000,
            average_cost: 1,
            security: {
              id: 'sec-cash',
              ticker: 'CASH',
              name: 'Cash',
              sector: 'Cash',
              industry: 'Cash',
              price: 1.00,
              prev_close: 1.00,
              open: 1.00,
              volume: 0,
              market_cap: 0,
              pe: 0,
              eps: 0,
              dividend: 0,
              yield: 0,
              dividend_growth_5yr: 0,
              payout_ratio: 0,
              forward_pe: 0,
              price_to_sales_trailing_12_months: 0,
              beta: 0,
              fifty_day_average: 1.00,
              two_hundred_day_average: 1.00,
              day_low: 1.00,
              day_high: 1.00,
              fifty_two_week_low: 1.00,
              fifty_two_week_high: 1.00,
              average_volume: 0,
              return_on_equity: 0,
              return_on_assets: 0,
              profit_margins: 0,
              operating_margins: 0,
              debt_to_equity: 0,
              current_ratio: 0,
              quick_ratio: 0,
              free_cash_flow: 0,
              operating_cash_flow: 0,
              cash_flow_growth: 0,
              revenue_growth: 0,
              earnings_growth: 0,
              ex_dividend_date: '',
              sma200: 'above' as const,
              tags: ['cash'],
              last_fetched: new Date().toISOString()
            }
          }
        ]
      };

      const result = portfolioAnalyticsService.calculatePortfolioValue(portfolioWithCash);

      const cashSecurity = result.securityValues['sec-cash'];
      expect(cashSecurity.value).toBe(10000); // $10,000
      expect(cashSecurity.cost).toBe(10000); // $10,000
      expect(cashSecurity.gainLoss).toBe(0); // No gain/loss for cash
      expect(cashSecurity.gainLossPercentage).toBe(0);
      expect(cashSecurity.dayChange).toBe(0);
      expect(cashSecurity.dayChangePercentage).toBe(0);
    });

    it('should handle securities with missing data', () => {
      const portfolioWithMissingData: Portfolio = {
        ...mockPortfolio,
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
              forward_pe: 24.2,
              price_to_sales_trailing_12_months: 6.8,
              beta: 1.2,
              fifty_day_average: 175.00,
              two_hundred_day_average: 170.00,
              day_low: 174.00,
              day_high: 176.00,
              fifty_two_week_low: 150.00,
              fifty_two_week_high: 200.00,
              average_volume: 800000,
              return_on_equity: 0.15,
              return_on_assets: 0.08,
              profit_margins: 0.25,
              operating_margins: 0.30,
              debt_to_equity: 0.5,
              current_ratio: 1.5,
              quick_ratio: 1.2,
              free_cash_flow: 100000000000,
              operating_cash_flow: 120000000000,
              cash_flow_growth: 10,
              revenue_growth: 0.08,
              earnings_growth: 0.12,
              ex_dividend_date: '2024-01-15',
              sma200: 'above' as const,
              tags: ['large-cap', 'technology'],
              last_fetched: new Date().toISOString()
              // Missing other properties
            }
          }
        ]
      };

      const result = portfolioAnalyticsService.calculatePortfolioValue(portfolioWithMissingData);

      expect(result.totalValue).toBe(100 * 175.50);
      expect(result.totalCost).toBe(100 * 150);
      expect(result.securityValues['sec-1']).toBeDefined();
    });

    it('should calculate portfolio metrics correctly', () => {
      const result = portfolioAnalyticsService.calculatePortfolioValue(mockPortfolio);

      expect(result.portfolioMetrics).toBeDefined();
      expect(result.portfolioMetrics.weightedAveragePE).toBeGreaterThan(0);
      expect(result.portfolioMetrics.weightedAverageForwardPE).toBeGreaterThan(0);
      expect(result.portfolioMetrics.weightedAverageBeta).toBeGreaterThan(0);
      expect(result.portfolioMetrics.totalFreeCashFlow).toBeGreaterThan(0);
      expect(result.portfolioMetrics.totalOperatingCashFlow).toBeGreaterThan(0);
    });
  });

  describe('calculatePortfolioMetrics', () => {
    it('should calculate weighted averages correctly', () => {
      const securityValues = {
        'sec-1': {
          value: 17550, // AAPL: 100 shares * $175.50
          cost: 15000,
          gainLoss: 2550,
          gainLossPercentage: 17,
          dayChange: 1.50,
          dayChangePercentage: 0.86,
          marketCap: 2000000000000,
          peRatio: 25.5,
          forwardPE: 24.2,
          priceToSales: 6.8,
          beta: 1.2,
          returnOnEquity: 0.15,
          returnOnAssets: 0.08,
          profitMargin: 0.25,
          operatingMargin: 0.30,
          debtToEquity: 0.5,
          currentRatio: 1.5,
          quickRatio: 1.2,
          freeCashFlow: 100000000000,
          operatingCashFlow: 120000000000,
          cashFlowGrowth: 10,
          revenueGrowth: 0.08,
          earningsGrowth: 0.12
        },
        'sec-2': {
          value: 19000, // MSFT: 50 shares * $380.00
          cost: 10000,
          gainLoss: 9000,
          gainLossPercentage: 90,
          dayChange: 2.00,
          dayChangePercentage: 0.53,
          marketCap: 2800000000000,
          peRatio: 35.2,
          forwardPE: 32.1,
          priceToSales: 12.5,
          beta: 0.9,
          returnOnEquity: 0.40,
          returnOnAssets: 0.15,
          profitMargin: 0.35,
          operatingMargin: 0.40,
          debtToEquity: 0.3,
          currentRatio: 2.1,
          quickRatio: 1.8,
          freeCashFlow: 60000000000,
          operatingCashFlow: 80000000000,
          cashFlowGrowth: 15,
          revenueGrowth: 0.15,
          earningsGrowth: 0.20
        }
      };

      const totalValue = 17550 + 19000; // $36,550

      const result = portfolioAnalyticsService.calculatePortfolioMetrics(securityValues, totalValue);

      // Weighted average PE: (25.5 * 17550 + 35.2 * 19000) / 36550
      const expectedWeightedPE = (25.5 * 17550 + 35.2 * 19000) / totalValue;
      expect(result.weightedAveragePE).toBeCloseTo(expectedWeightedPE, 2);

      // Weighted average beta: (1.2 * 17550 + 0.9 * 19000) / 36550
      const expectedWeightedBeta = (1.2 * 17550 + 0.9 * 19000) / totalValue;
      expect(result.weightedAverageBeta).toBeCloseTo(expectedWeightedBeta, 2);

      // Total free cash flow: 100B + 60B = 160B
      expect(result.totalFreeCashFlow).toBe(100000000000 + 60000000000);

      // Total operating cash flow: 120B + 80B = 200B
      expect(result.totalOperatingCashFlow).toBe(120000000000 + 80000000000);
    });

    it('should handle securities with missing metrics', () => {
      const securityValues = {
        'sec-1': {
          value: 17550,
          cost: 15000,
          gainLoss: 2550,
          gainLossPercentage: 17,
          dayChange: 1.50,
          dayChangePercentage: 0.86,
          marketCap: 2000000000000,
          peRatio: 25.5,
          forwardPE: 24.2,
          priceToSales: 6.8,
          beta: 1.2,
          // Missing other metrics
        }
      };

      const totalValue = 17550;

      const result = portfolioAnalyticsService.calculatePortfolioMetrics(securityValues, totalValue);

      expect(result.weightedAveragePE).toBe(25.5);
      expect(result.weightedAverageBeta).toBe(1.2);
      expect(result.totalFreeCashFlow).toBe(0);
      expect(result.totalOperatingCashFlow).toBe(0);
    });

    it('should handle zero total value', () => {
      const securityValues = {};
      const totalValue = 0;

      const result = portfolioAnalyticsService.calculatePortfolioMetrics(securityValues, totalValue);

      expect(result.weightedAveragePE).toBe(0);
      expect(result.weightedAverageForwardPE).toBe(0);
      expect(result.weightedAverageBeta).toBe(0);
      expect(result.totalFreeCashFlow).toBe(0);
      expect(result.totalOperatingCashFlow).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    it('should format positive numbers correctly', () => {
      expect(portfolioAnalyticsService.formatCurrency(1234.56)).toBe('$1,234.56');
      expect(portfolioAnalyticsService.formatCurrency(1000000)).toBe('$1,000,000.00');
      expect(portfolioAnalyticsService.formatCurrency(0)).toBe('$0.00');
    });

    it('should format negative numbers correctly', () => {
      expect(portfolioAnalyticsService.formatCurrency(-1234.56)).toBe('-$1,234.56');
      expect(portfolioAnalyticsService.formatCurrency(-1000000)).toBe('-$1,000,000.00');
    });

    it('should handle very large numbers', () => {
      expect(portfolioAnalyticsService.formatCurrency(1234567890.12)).toBe('$1,234,567,890.12');
    });

    it('should handle very small numbers', () => {
      expect(portfolioAnalyticsService.formatCurrency(0.001)).toBe('$0.00');
      expect(portfolioAnalyticsService.formatCurrency(0.01)).toBe('$0.01');
    });
  });

  describe('formatPercentage', () => {
    it('should format positive percentages correctly', () => {
      expect(portfolioAnalyticsService.formatPercentage(12.34)).toBe('12.34%');
      expect(portfolioAnalyticsService.formatPercentage(0)).toBe('0.00%');
      expect(portfolioAnalyticsService.formatPercentage(100)).toBe('100.00%');
    });

    it('should format negative percentages correctly', () => {
      expect(portfolioAnalyticsService.formatPercentage(-12.34)).toBe('-12.34%');
      expect(portfolioAnalyticsService.formatPercentage(-100)).toBe('-100.00%');
    });

    it('should handle very large percentages', () => {
      expect(portfolioAnalyticsService.formatPercentage(1234.56)).toBe('1,234.56%');
    });

    it('should handle very small percentages', () => {
      expect(portfolioAnalyticsService.formatPercentage(0.001)).toBe('0.00%');
      expect(portfolioAnalyticsService.formatPercentage(0.01)).toBe('0.01%');
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle securities with zero price', () => {
      const portfolioWithZeroPrice: Portfolio = {
        ...mockPortfolio,
        securities: [
          {
            ...mockPortfolio.securities[0],
            security: {
              ...mockPortfolio.securities[0].security,
              price: 0
            }
          }
        ]
      };

      const result = portfolioAnalyticsService.calculatePortfolioValue(portfolioWithZeroPrice);

      expect(result.totalValue).toBe(0);
      expect(result.totalGainLoss).toBe(-15000); // Loss of cost basis
      expect(result.totalGainLossPercentage).toBe(-100); // 100% loss
    });

    it('should handle securities with negative price', () => {
      const portfolioWithNegativePrice: Portfolio = {
        ...mockPortfolio,
        securities: [
          {
            ...mockPortfolio.securities[0],
            security: {
              ...mockPortfolio.securities[0].security,
              price: -10
            }
          }
        ]
      };

      const result = portfolioAnalyticsService.calculatePortfolioValue(portfolioWithNegativePrice);

      expect(result.totalValue).toBe(-1000); // 100 shares * -$10
      expect(result.totalGainLoss).toBe(-16000); // -$1000 - $15000
    });

    it('should handle securities with zero shares', () => {
      const portfolioWithZeroShares: Portfolio = {
        ...mockPortfolio,
        securities: [
          {
            ...mockPortfolio.securities[0],
            shares: 0
          }
        ]
      };

      const result = portfolioAnalyticsService.calculatePortfolioValue(portfolioWithZeroShares);

      expect(result.totalValue).toBe(0);
      expect(result.totalCost).toBe(0);
      expect(result.totalGainLoss).toBe(0);
      expect(result.totalGainLossPercentage).toBe(0);
    });

    it('should handle securities with undefined prev_close', () => {
      const portfolioWithUndefinedPrevClose: Portfolio = {
        ...mockPortfolio,
        securities: [
          {
            ...mockPortfolio.securities[0],
            security: {
              ...mockPortfolio.securities[0].security,
              prev_close: undefined as unknown as number
            }
          }
        ]
      };

      const result = portfolioAnalyticsService.calculatePortfolioValue(portfolioWithUndefinedPrevClose);

      const aaplSecurity = result.securityValues['sec-1'];
      expect(aaplSecurity.dayChange).toBe(0);
      expect(aaplSecurity.dayChangePercentage).toBe(0);
    });

    it('should handle securities with zero prev_close', () => {
      const portfolioWithZeroPrevClose: Portfolio = {
        ...mockPortfolio,
        securities: [
          {
            ...mockPortfolio.securities[0],
            security: {
              ...mockPortfolio.securities[0].security,
              prev_close: 0
            }
          }
        ]
      };

      const result = portfolioAnalyticsService.calculatePortfolioValue(portfolioWithZeroPrevClose);

      const aaplSecurity = result.securityValues['sec-1'];
      expect(aaplSecurity.dayChange).toBe(175.50);
      expect(aaplSecurity.dayChangePercentage).toBe(0); // Division by zero protection
    });
  });
}); 