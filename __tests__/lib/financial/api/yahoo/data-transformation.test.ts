import { yahooFinanceClient } from '@/lib/financial/api/yahoo/client';
import type { 
  BalanceSheetStatement, 
  CashflowStatement, 
  Earnings, 
  Price, 
  SummaryDetail, 
  FinancialData, 
  AssetProfile 
} from '@/lib/financial/api/yahoo/types';

// Access private methods for testing
const client = yahooFinanceClient as any;

describe('Yahoo Finance Client Data Transformation', () => {
  describe('transformBalanceSheetStatement', () => {
    it('should transform valid balance sheet statement', () => {
      const input = {
        endDate: new Date('2024-01-01'),
        totalAssets: 1000000,
        totalCurrentAssets: 500000,
        totalLiab: 400000,
        totalCurrentLiabilities: 200000,
        totalStockholderEquity: 600000,
        cash: 100000,
        shortTermInvestments: 50000,
        netReceivables: 150000,
        inventory: 200000,
        otherCurrentAssets: 50000,
        longTermInvestments: 300000,
        propertyPlantEquipment: 400000,
        otherAssets: 100000,
        intangibleAssets: 50000,
        goodwill: 75000,
        deferredLongTermAssetCharges: 25000,
        accountsPayable: 80000,
        shortLongTermDebt: 120000,
        otherCurrentLiab: 40000,
        longTermDebt: 280000,
        otherLiab: 60000,
        minorityInterest: 10000,
        treasuryStock: -50000,
        retainedEarnings: 450000,
        commonStock: 100000,
        capitalSurplus: 50000,
        maxAge: 86400
      };

      const result = client.transformBalanceSheetStatement(input);

      expect(result).toEqual({
        endDate: new Date('2024-01-01').getTime(),
        totalAssets: 1000000,
        totalCurrentAssets: 500000,
        totalLiab: 400000,
        totalCurrentLiabilities: 200000,
        totalStockholderEquity: 600000,
        cash: 100000,
        shortTermInvestments: 50000,
        netReceivables: 150000,
        inventory: 200000,
        otherCurrentAssets: 50000,
        longTermInvestments: 300000,
        propertyPlantEquipment: 400000,
        otherAssets: 100000,
        intangibleAssets: 50000,
        goodwill: 75000,
        deferredLongTermAssetCharges: 25000,
        accountsPayable: 80000,
        shortLongTermDebt: 120000,
        otherCurrentLiab: 40000,
        longTermDebt: 280000,
        otherLiab: 60000,
        minorityInterest: 10000,
        treasuryStock: -50000,
        retainedEarnings: 450000,
        commonStock: 100000,
        capitalSurplus: 50000,
        maxAge: 86400
      });
    });

    it('should handle missing optional fields', () => {
      const input = {
        endDate: new Date('2024-01-01'),
        totalAssets: 1000000
      };

      const result = client.transformBalanceSheetStatement(input);

      expect(result.endDate).toBe(new Date('2024-01-01').getTime());
      expect(result.totalAssets).toBe(1000000);
      expect(result.totalCurrentAssets).toBeUndefined();
      expect(result.cash).toBeUndefined();
    });

    it('should handle null and undefined values', () => {
      const input = {
        endDate: new Date('2024-01-01'),
        totalAssets: null,
        totalCurrentAssets: undefined,
        cash: null
      };

      const result = client.transformBalanceSheetStatement(input);

      expect(result.totalAssets).toBeUndefined();
      expect(result.totalCurrentAssets).toBeUndefined();
      expect(result.cash).toBeUndefined();
    });
  });

  describe('transformCashflowStatement', () => {
    it('should transform valid cashflow statement', () => {
      const input = {
        endDate: new Date('2024-01-01'),
        totalCashFromOperatingActivities: 500000,
        capitalExpenditures: -100000,
        dividendsPaid: -50000,
        netIncome: 400000,
        maxAge: 86400
      };

      const result = client.transformCashflowStatement(input);

      expect(result).toEqual({
        endDate: new Date('2024-01-01').getTime(),
        totalCashFromOperatingActivities: 500000,
        capitalExpenditures: -100000,
        dividendsPaid: -50000,
        netIncome: 400000,
        maxAge: 86400
      });
    });

    it('should handle missing optional fields', () => {
      const input = {
        endDate: new Date('2024-01-01'),
        netIncome: 400000
      };

      const result = client.transformCashflowStatement(input);

      expect(result.endDate).toBe(new Date('2024-01-01').getTime());
      expect(result.netIncome).toBe(400000);
      expect(result.totalCashFromOperatingActivities).toBeUndefined();
      expect(result.capitalExpenditures).toBeUndefined();
    });
  });

  describe('transformEarnings', () => {
    it('should transform valid earnings data', () => {
      const input = {
        maxAge: 86400,
        earningsChart: {
          earningsDate: [new Date('2024-01-01'), new Date('2024-04-01')],
          currentQuarterEstimate: 1.50,
          quarterly: [
            { date: new Date('2024-01-01'), actual: 1.45, estimate: 1.40 },
            { date: new Date('2023-10-01'), actual: 1.30, estimate: 1.35 }
          ]
        },
        financialsChart: {
          yearly: [
            { date: new Date('2024-01-01'), revenue: 1000000, earnings: 100000 },
            { date: new Date('2023-01-01'), revenue: 900000, earnings: 90000 }
          ],
          quarterly: [
            { date: new Date('2024-01-01'), revenue: 250000, earnings: 25000 },
            { date: new Date('2023-10-01'), revenue: 225000, earnings: 22500 }
          ]
        },
        financialCurrency: 'USD'
      };

      const result = client.transformEarnings(input);

      expect(result.maxAge).toBe(86400);
      expect(result.earningsDate).toEqual([
        new Date('2024-01-01').getTime(),
        new Date('2024-04-01').getTime()
      ]);
      expect(result.earningsAverage).toBe(1.50);
      expect(result.earningsLow).toBe(1.40);
      expect(result.earningsHigh).toBe(1.40);
      expect(result.financialCurrency).toBe('USD');
    });

    it('should handle various date formats safely', () => {
      const input = {
        maxAge: 86400,
        earningsChart: {
          earningsDate: [
            new Date('2024-01-01'),
            1704067200000, // timestamp
            '2024-01-01', // string
            null, // null
            'invalid-date' // invalid string
          ],
          currentQuarterEstimate: 1.50,
          quarterly: [
            { date: new Date('2024-01-01'), actual: 1.45, estimate: 1.40 }
          ]
        },
        financialsChart: {
          yearly: [
            { date: new Date('2024-01-01'), revenue: 1000000, earnings: 100000 }
          ],
          quarterly: [
            { date: new Date('2024-01-01'), revenue: 250000, earnings: 25000 }
          ]
        },
        financialCurrency: 'USD'
      };

      const result = client.transformEarnings(input);

      expect(result.earningsDate).toEqual([
        new Date('2024-01-01').getTime(),
        1704067200000,
        new Date('2024-01-01').getTime(),
        0, // null becomes 0
        0  // invalid date becomes 0
      ]);
    });

    it('should handle missing or null values', () => {
      const input = {
        maxAge: null,
        earningsChart: {
          earningsDate: [],
          currentQuarterEstimate: null,
          quarterly: []
        },
        financialsChart: {
          yearly: [],
          quarterly: []
        },
        financialCurrency: null
      };

      const result = client.transformEarnings(input);

      expect(result.maxAge).toBe(0);
      expect(result.earningsAverage).toBe(0);
      expect(result.earningsLow).toBe(0);
      expect(result.earningsHigh).toBe(0);
      expect(result.financialCurrency).toBe('USD');
    });
  });

  describe('transformPrice', () => {
    it('should transform valid price data', () => {
      const input = {
        currency: 'USD',
        regularMarketPrice: 150.50,
        regularMarketChange: 2.50,
        regularMarketChangePercent: 1.68,
        regularMarketTime: new Date('2024-01-01T16:00:00Z'),
        regularMarketDayHigh: 152.00,
        regularMarketDayLow: 148.00,
        regularMarketVolume: 1000000,
        marketCap: 2500000000,
        regularMarketPreviousClose: 148.00,
        regularMarketOpen: 149.00,
        shortName: 'Apple Inc.',
        longName: 'Apple Inc.',
        symbol: 'AAPL'
      };

      const result = client.transformPrice(input);

      expect(result).toEqual({
        currency: 'USD',
        regularMarketPrice: 150.50,
        regularMarketChange: 2.50,
        regularMarketChangePercent: 1.68,
        regularMarketTime: new Date('2024-01-01T16:00:00Z').getTime(),
        regularMarketDayHigh: 152.00,
        regularMarketDayLow: 148.00,
        regularMarketVolume: 1000000,
        marketCap: 2500000000,
        regularMarketPreviousClose: 148.00,
        regularMarketOpen: 149.00,
        shortName: 'Apple Inc.',
        longName: 'Apple Inc.',
        symbol: 'AAPL'
      });
    });

    it('should handle various date formats safely', () => {
      const input = {
        regularMarketTime: new Date('2024-01-01T16:00:00Z'),
        regularMarketPreviousClose: 148.00
      };

      const result = client.transformPrice(input);

      expect(result.regularMarketTime).toBe(new Date('2024-01-01T16:00:00Z').getTime());
      expect(result.regularMarketPreviousClose).toBe(148.00);
    });

    it('should handle null and undefined values', () => {
      const input = {
        currency: null,
        regularMarketPrice: undefined,
        regularMarketTime: null
      };

      const result = client.transformPrice(input);

      expect(result.currency).toBeNull();
      expect(result.regularMarketPrice).toBeUndefined();
      expect(result.regularMarketTime).toBeUndefined();
    });
  });

  describe('transformSummaryDetail', () => {
    it('should transform valid summary detail data', () => {
      const input = {
        previousClose: 148.00,
        open: 149.00,
        dayLow: 148.00,
        dayHigh: 152.00,
        dividendRate: 0.92,
        dividendYield: 0.62,
        exDividendDate: new Date('2024-02-15'),
        payoutRatio: 0.25,
        fiveYearAvgDividendYield: 0.58,
        beta: 1.25,
        trailingPE: 25.5,
        forwardPE: 23.2,
        volume: 1000000,
        regularMarketVolume: 1000000,
        averageVolume: 950000,
        averageVolume10days: 980000,
        averageDailyVolume10Day: 980000,
        bid: 150.45,
        ask: 150.55,
        bidSize: 100,
        askSize: 200,
        marketCap: 2500000000,
        yield: 0.62,
        ytdReturn: 0.05,
        totalAssets: 1000000000,
        expireDate: new Date('2024-12-31'),
        strikePrice: 150.00,
        openInterest: 5000,
        fiftyTwoWeekLow: 120.00,
        fiftyTwoWeekHigh: 180.00,
        priceToSalesTrailing12Months: 5.2,
        fiftyDayAverage: 145.00,
        twoHundredDayAverage: 140.00,
        trailingAnnualDividendRate: 0.92,
        trailingAnnualDividendYield: 0.62
      };

      const result = client.transformSummaryDetail(input);

      expect(result).toEqual({
        previousClose: 148.00,
        open: 149.00,
        dayLow: 148.00,
        dayHigh: 152.00,
        dividendRate: 0.92,
        dividendYield: 0.62,
        exDividendDate: new Date('2024-02-15').getTime(),
        payoutRatio: 0.25,
        fiveYearAvgDividendYield: 0.58,
        beta: 1.25,
        trailingPE: 25.5,
        forwardPE: 23.2,
        volume: 1000000,
        regularMarketVolume: 1000000,
        averageVolume: 950000,
        averageVolume10days: 980000,
        averageDailyVolume10Day: 980000,
        bid: 150.45,
        ask: 150.55,
        bidSize: 100,
        askSize: 200,
        marketCap: 2500000000,
        yield: 0.62,
        ytdReturn: 0.05,
        totalAssets: 1000000000,
        expireDate: new Date('2024-12-31').getTime(),
        strikePrice: 150.00,
        openInterest: 5000,
        fiftyTwoWeekLow: 120.00,
        fiftyTwoWeekHigh: 180.00,
        priceToSalesTrailing12Months: 5.2,
        fiftyDayAverage: 145.00,
        twoHundredDayAverage: 140.00,
        trailingAnnualDividendRate: 0.92,
        trailingAnnualDividendYield: 0.62
      });
    });

    it('should handle missing optional fields', () => {
      const input = {
        previousClose: 148.00,
        open: 149.00
      };

      const result = client.transformSummaryDetail(input);

      expect(result.previousClose).toBe(148.00);
      expect(result.open).toBe(149.00);
      expect(result.dividendYield).toBeUndefined();
      expect(result.beta).toBeUndefined();
    });
  });

  describe('transformFinancialData', () => {
    it('should transform valid financial data', () => {
      const input = {
        maxAge: 86400,
        currentPrice: 150.50,
        targetHighPrice: 180.00,
        targetLowPrice: 130.00,
        targetMeanPrice: 155.00,
        targetMedianPrice: 155.00,
        recommendationMean: 2.5,
        recommendationKey: 'buy',
        numberOfAnalystOpinions: 25,
        totalCash: 50000000,
        totalCashPerShare: 3.20,
        ebitda: 80000000,
        totalDebt: 100000000,
        quickRatio: 1.5,
        currentRatio: 2.0,
        totalRevenue: 400000000,
        debtToEquity: 0.3,
        revenuePerShare: 25.50,
        returnOnAssets: 0.15,
        returnOnEquity: 0.25,
        grossProfits: 150000000,
        freeCashflow: 60000000,
        operatingCashflow: 70000000,
        earningsGrowth: 0.10,
        revenueGrowth: 0.08,
        grossMargins: 0.375,
        ebitdaMargins: 0.20,
        operatingMargins: 0.18,
        profitMargins: 0.15,
        financialCurrency: 'USD'
      };

      const result = client.transformFinancialData(input);

      expect(result).toEqual({
        currentPrice: 150.50,
        targetHighPrice: 180.00,
        targetLowPrice: 130.00,
        targetMeanPrice: 155.00,
        targetMedianPrice: 155.00,
        recommendationMean: 2.5,
        recommendationKey: 'buy',
        numberOfAnalystOpinions: 25,
        totalCash: 50000000,
        totalCashPerShare: 3.20,
        ebitda: 80000000,
        totalDebt: 100000000,
        quickRatio: 1.5,
        currentRatio: 2.0,
        totalRevenue: 400000000,
        debtToEquity: 0.3,
        revenuePerShare: 25.50,
        returnOnAssets: 0.15,
        returnOnEquity: 0.25,
        grossProfits: 150000000,
        freeCashflow: 60000000,
        operatingCashflow: 70000000,
        earningsGrowth: 0.10,
        revenueGrowth: 0.08,
        grossMargins: 0.375,
        ebitdaMargins: 0.20,
        operatingMargins: 0.18,
        profitMargins: 0.15,
        financialCurrency: 'USD'
      });
    });

    it('should handle missing optional fields', () => {
      const input = {
        currentPrice: 150.50,
        recommendationKey: 'buy'
      };

      const result = client.transformFinancialData(input);

      expect(result.currentPrice).toBe(150.50);
      expect(result.recommendationKey).toBe('buy');
      expect(result.targetHighPrice).toBeUndefined();
      expect(result.totalCash).toBeUndefined();
    });
  });

  describe('transformAssetProfile', () => {
    it('should transform valid asset profile data', () => {
      const input = {
        address1: '1 Apple Park Way',
        city: 'Cupertino',
        state: 'CA',
        zip: '95014',
        country: 'United States',
        phone: '+1-408-996-1010',
        website: 'https://www.apple.com',
        industry: 'Consumer Electronics',
        industryKey: 'consumer_electronics',
        industryDisp: 'Consumer Electronics',
        sector: 'Technology',
        sectorKey: 'technology',
        sectorDisp: 'Technology',
        longBusinessSummary: 'Apple Inc. designs, manufactures, and markets smartphones...',
        fullTimeEmployees: 164000,
        companyOfficers: [
          {
            name: 'Tim Cook',
            age: 63,
            title: 'Chief Executive Officer',
            yearBorn: 1960,
            fiscalYear: 2024,
            totalPay: 63000000,
            exercisedValue: 1000000,
            unexercisedValue: 5000000
          }
        ],
        auditRisk: 1,
        boardRisk: 2,
        compensationRisk: 3,
        shareHolderRightsRisk: 4,
        overallRisk: 5,
        governanceEpochDate: new Date('2024-01-01'),
        compensationAsOfEpochDate: new Date('2024-01-01'),
        irWebsite: 'https://investor.apple.com',
        executiveTeam: [],
        maxAge: 86400
      };

      const result = client.transformAssetProfile(input);

      expect(result).toEqual({
        address1: '1 Apple Park Way',
        city: 'Cupertino',
        state: 'CA',
        zip: '95014',
        country: 'United States',
        phone: '+1-408-996-1010',
        website: 'https://www.apple.com',
        industry: 'Consumer Electronics',
        industryKey: 'consumer_electronics',
        industryDisp: 'Consumer Electronics',
        sector: 'Technology',
        sectorKey: 'technology',
        sectorDisp: 'Technology',
        longBusinessSummary: 'Apple Inc. designs, manufactures, and markets smartphones...',
        fullTimeEmployees: 164000,
        companyOfficers: [
          {
            name: 'Tim Cook',
            age: 63,
            title: 'Chief Executive Officer',
            yearBorn: 1960,
            fiscalYear: 2024,
            totalPay: 63000000,
            exercisedValue: 1000000,
            unexercisedValue: 5000000
          }
        ],
        auditRisk: 1,
        boardRisk: 2,
        compensationRisk: 3,
        shareHolderRightsRisk: 4,
        overallRisk: 5,
        governanceEpochDate: new Date('2024-01-01').getTime(),
        compensationAsOfEpochDate: new Date('2024-01-01').getTime(),
        irWebsite: 'https://investor.apple.com',
        executiveTeam: [],
        maxAge: 86400
      });
    });

    it('should handle missing optional fields', () => {
      const input = {
        industry: 'Technology',
        sector: 'Technology'
      };

      const result = client.transformAssetProfile(input);

      expect(result.industry).toBe('Technology');
      expect(result.sector).toBe('Technology');
      expect(result.address1).toBeUndefined();
      expect(result.fullTimeEmployees).toBeUndefined();
    });

    it('should handle various date formats safely', () => {
      const input = {
        governanceEpochDate: new Date('2024-01-01'),
        compensationAsOfEpochDate: 1704067200000 // timestamp
      };

      const result = client.transformAssetProfile(input);

      expect(result.governanceEpochDate).toBe(new Date('2024-01-01').getTime());
      expect(result.compensationAsOfEpochDate).toBe(1704067200000);
    });
  });
}); 