import yahooFinance from 'yahoo-finance2';
import { YAHOO_FINANCE_CONFIG, YahooFinanceModule } from './config';
import type { QuoteSummary, YahooFinanceError, BalanceSheetStatement, CashflowStatement, Earnings, Price, SummaryDetail, FinancialData, AssetProfile, SearchResult, YahooFinanceSearchResult, YahooFinanceSearchQuote } from './types';

class YahooFinanceClient {
  private static instance: YahooFinanceClient;
  private cache: Map<string, { data: any; timestamp: number }>;

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): YahooFinanceClient {
    if (!YahooFinanceClient.instance) {
      YahooFinanceClient.instance = new YahooFinanceClient();
    }
    return YahooFinanceClient.instance;
  }

  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < YAHOO_FINANCE_CONFIG.cache.ttl;
  }

  private getCachedData<T>(key: string): T | null {
    if (!YAHOO_FINANCE_CONFIG.cache.enabled) return null;
    if (!this.isCacheValid(key)) {
      this.cache.delete(key);
      return null;
    }
    return this.cache.get(key)?.data as T;
  }

  private setCachedData<T>(key: string, data: T): void {
    if (!YAHOO_FINANCE_CONFIG.cache.enabled) return;
    if (this.cache.size >= YAHOO_FINANCE_CONFIG.cache.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  public clearCache(): void {
    this.cache.clear();
    if (process.env.NODE_ENV === 'development') {
      console.log('YahooFinanceClient: Cache manually cleared');
    }
  }

  private clearCacheInternal(): void {
    this.cache.clear();
    if (process.env.NODE_ENV === 'development') {
      console.log('YahooFinanceClient: Cache cleared due to invalid crumb error');
    }
  }

  private async retryWithCacheClear<T>(
    operation: () => Promise<T>,
    maxRetries: number = YAHOO_FINANCE_CONFIG.maxRetries
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Check if it's an "Invalid Crumb" error
        if (errorMessage.includes('Invalid Crumb') || errorMessage.includes('invalid crumb')) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`YahooFinanceClient: Invalid crumb error on attempt ${attempt}, clearing cache and retrying...`);
          }
          this.clearCacheInternal();
          
          // Add a delay before retrying with exponential backoff
          if (attempt < maxRetries) {
            const delay = YAHOO_FINANCE_CONFIG.retry.exponentialBackoff 
              ? YAHOO_FINANCE_CONFIG.retry.invalidCrumbDelay * Math.pow(2, attempt - 1)
              : YAHOO_FINANCE_CONFIG.retry.invalidCrumbDelay;
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`YahooFinanceClient: Waiting ${delay}ms before retry ${attempt + 1}...`);
            }
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          continue;
        }
        
        // For other errors, don't retry
        throw error;
      }
    }
    
    throw lastError!;
  }

  private transformBalanceSheetStatement(stmt: any): BalanceSheetStatement {
    return {
      endDate: stmt.endDate.getTime(),
      totalAssets: stmt.totalAssets ?? undefined,
      totalCurrentAssets: stmt.totalCurrentAssets ?? undefined,
      totalLiab: stmt.totalLiab ?? undefined,
      totalCurrentLiabilities: stmt.totalCurrentLiabilities ?? undefined,
      totalStockholderEquity: stmt.totalStockholderEquity ?? undefined,
      cash: stmt.cash ?? undefined,
      shortTermInvestments: stmt.shortTermInvestments ?? undefined,
      netReceivables: stmt.netReceivables ?? undefined,
      inventory: stmt.inventory ?? undefined,
      otherCurrentAssets: stmt.otherCurrentAssets ?? undefined,
      longTermInvestments: stmt.longTermInvestments ?? undefined,
      propertyPlantEquipment: stmt.propertyPlantEquipment ?? undefined,
      otherAssets: stmt.otherAssets ?? undefined,
      intangibleAssets: stmt.intangibleAssets ?? undefined,
      goodwill: stmt.goodwill ?? undefined,
      deferredLongTermAssetCharges: stmt.deferredLongTermAssetCharges ?? undefined,
      accountsPayable: stmt.accountsPayable ?? undefined,
      shortLongTermDebt: stmt.shortLongTermDebt ?? undefined,
      otherCurrentLiab: stmt.otherCurrentLiab ?? undefined,
      longTermDebt: stmt.longTermDebt ?? undefined,
      otherLiab: stmt.otherLiab ?? undefined,
      minorityInterest: stmt.minorityInterest ?? undefined,
      treasuryStock: stmt.treasuryStock ?? undefined,
      retainedEarnings: stmt.retainedEarnings ?? undefined,
      commonStock: stmt.commonStock ?? undefined,
      capitalSurplus: stmt.capitalSurplus ?? undefined,
      maxAge: stmt.maxAge ?? undefined,
    };
  }

  private transformCashflowStatement(stmt: any): CashflowStatement {
    return {
      endDate: stmt.endDate.getTime(),
      totalCashFromOperatingActivities: stmt.totalCashFromOperatingActivities ?? undefined,
      capitalExpenditures: stmt.capitalExpenditures ?? undefined,
      dividendsPaid: stmt.dividendsPaid ?? undefined,
      netIncome: stmt.netIncome ?? undefined,
      maxAge: stmt.maxAge ?? undefined,
    };
  }

  private transformEarnings(earnings: any): Earnings {
    const safeDateConversion = (date: any): number => {
      try {
        if (date instanceof Date) {
          return date.getTime();
        }
        if (typeof date === 'number') {
          return date;
        }
        if (typeof date === 'string') {
          const converted = new Date(date);
          return isNaN(converted.getTime()) ? 0 : converted.getTime();
        }
        return 0;
      } catch (error) {
        return 0;
      }
    };

    return {
      maxAge: earnings.maxAge ?? 0,
      earningsDate: earnings.earningsChart.earningsDate.map((date: any) => safeDateConversion(date)),
      earningsAverage: earnings.earningsChart.currentQuarterEstimate ?? 0,
      earningsLow: earnings.earningsChart.quarterly[0]?.estimate ?? 0,
      earningsHigh: earnings.earningsChart.quarterly[0]?.estimate ?? 0,
      earningsChart: {
        quarterly: earnings.earningsChart.quarterly.map((q: any) => ({
          date: safeDateConversion(q.date),
          actual: q.actual ?? 0,
          estimate: q.estimate ?? 0
        })) ?? [],
        currentQuarterEstimate: earnings.earningsChart.currentQuarterEstimate ?? 0,
        currentQuarterEstimateDate: earnings.earningsChart.currentQuarterEstimateDate ?? '',
        currentQuarterEstimateYear: earnings.earningsChart.currentQuarterEstimateYear ?? 0,
        earningsDate: earnings.earningsChart.earningsDate.map((date: any) => safeDateConversion(date)) ?? [],
        isEarningsDateEstimate: earnings.earningsChart.isEarningsDateEstimate ?? false
      },
      financialsChart: {
        yearly: earnings.financialsChart.yearly.map((y: any) => ({
          date: safeDateConversion(y.date),
          revenue: y.revenue ?? 0,
          earnings: y.earnings ?? 0
        })) ?? [],
        quarterly: earnings.financialsChart.quarterly.map((q: any) => ({
          date: safeDateConversion(q.date),
          revenue: q.revenue ?? 0,
          earnings: q.earnings ?? 0
        })) ?? []
      },
      financialCurrency: earnings.financialCurrency ?? 'USD'
    };
  }

  private transformPrice(price: any): Price {
    const safeDateConversion = (date: any): number | undefined => {
      try {
        if (!date) return undefined;
        if (date instanceof Date) {
          return date.getTime();
        }
        if (typeof date === 'number') {
          return date;
        }
        if (typeof date === 'string') {
          const converted = new Date(date);
          return isNaN(converted.getTime()) ? undefined : converted.getTime();
        }
        return undefined;
      } catch (error) {
        return undefined;
      }
    };

    return {
      ...price,
      regularMarketTime: safeDateConversion(price.regularMarketTime),
    };
  }

  private transformSummaryDetail(summary: any): SummaryDetail {
    const safeDateConversion = (date: any): number | undefined => {
      try {
        if (!date) return undefined;
        if (date instanceof Date) {
          return date.getTime();
        }
        if (typeof date === 'number') {
          return date;
        }
        if (typeof date === 'string') {
          const converted = new Date(date);
          return isNaN(converted.getTime()) ? undefined : converted.getTime();
        }
        return undefined;
      } catch (error) {
        return undefined;
      }
    };

    return {
      previousClose: summary.previousClose,
      open: summary.open,
      dayLow: summary.dayLow,
      dayHigh: summary.dayHigh,
      regularMarketPreviousClose: summary.regularMarketPreviousClose,
      regularMarketOpen: summary.regularMarketOpen,
      regularMarketDayLow: summary.regularMarketDayLow,
      regularMarketDayHigh: summary.regularMarketDayHigh,
      dividendRate: summary.dividendRate,
      dividendYield: summary.dividendYield,
      exDividendDate: safeDateConversion(summary.exDividendDate),
      payoutRatio: summary.payoutRatio,
      fiveYearAvgDividendYield: summary.fiveYearAvgDividendYield,
      beta: summary.beta,
      trailingPE: summary.trailingPE,
      forwardPE: summary.forwardPE,
      volume: summary.volume,
      regularMarketVolume: summary.regularMarketVolume,
      averageVolume: summary.averageVolume,
      averageVolume10days: summary.averageVolume10days,
      averageDailyVolume10Day: summary.averageDailyVolume10Day,
      bid: summary.bid,
      ask: summary.ask,
      bidSize: summary.bidSize,
      askSize: summary.askSize,
      marketCap: summary.marketCap,
      yield: summary.yield,
      ytdReturn: summary.ytdReturn,
      totalAssets: summary.totalAssets,
      expireDate: safeDateConversion(summary.expireDate),
      strikePrice: summary.strikePrice,
      openInterest: summary.openInterest,
      fiftyTwoWeekLow: summary.fiftyTwoWeekLow,
      fiftyTwoWeekHigh: summary.fiftyTwoWeekHigh,
      priceToSalesTrailing12Months: summary.priceToSalesTrailing12Months,
      fiftyDayAverage: summary.fiftyDayAverage,
      twoHundredDayAverage: summary.twoHundredDayAverage,
      trailingAnnualDividendRate: summary.trailingAnnualDividendRate,
      trailingAnnualDividendYield: summary.trailingAnnualDividendYield
    };
  }

  private transformFinancialData(data: any): FinancialData {
    return {
      currentPrice: data.currentPrice,
      targetHighPrice: data.targetHighPrice,
      targetLowPrice: data.targetLowPrice,
      targetMeanPrice: data.targetMeanPrice,
      targetMedianPrice: data.targetMedianPrice,
      recommendationMean: data.recommendationMean,
      recommendationKey: data.recommendationKey,
      numberOfAnalystOpinions: data.numberOfAnalystOpinions,
      totalCash: data.totalCash,
      totalCashPerShare: data.totalCashPerShare,
      ebitda: data.ebitda,
      totalDebt: data.totalDebt,
      quickRatio: data.quickRatio,
      currentRatio: data.currentRatio,
      totalRevenue: data.totalRevenue,
      debtToEquity: data.debtToEquity,
      revenuePerShare: data.revenuePerShare,
      returnOnAssets: data.returnOnAssets,
      returnOnEquity: data.returnOnEquity,
      grossProfits: data.grossProfits,
      freeCashflow: data.freeCashflow,
      operatingCashflow: data.operatingCashflow,
      earningsGrowth: data.earningsGrowth,
      revenueGrowth: data.revenueGrowth,
      grossMargins: data.grossMargins,
      ebitdaMargins: data.ebitdaMargins,
      operatingMargins: data.operatingMargins,
      profitMargins: data.profitMargins,
      financialCurrency: data.financialCurrency
    };
  }

  private transformAssetProfile(profile: any): AssetProfile {
    const safeDateConversion = (date: any): number | undefined => {
      try {
        if (!date) return undefined;
        if (date instanceof Date) {
          return date.getTime();
        }
        if (typeof date === 'number') {
          return date;
        }
        if (typeof date === 'string') {
          const converted = new Date(date);
          return isNaN(converted.getTime()) ? undefined : converted.getTime();
        }
        return undefined;
      } catch (error) {
        return undefined;
      }
    };

    return {
      address1: profile.address1,
      city: profile.city,
      state: profile.state,
      zip: profile.zip,
      country: profile.country,
      phone: profile.phone,
      website: profile.website,
      industry: profile.industry,
      industryKey: profile.industryKey,
      industryDisp: profile.industryDisp,
      sector: profile.sector,
      sectorKey: profile.sectorKey,
      sectorDisp: profile.sectorDisp,
      longBusinessSummary: profile.longBusinessSummary,
      fullTimeEmployees: profile.fullTimeEmployees,
      companyOfficers: profile.companyOfficers?.map((officer: any) => ({
        name: officer.name,
        age: officer.age,
        title: officer.title,
        yearBorn: officer.yearBorn,
        fiscalYear: officer.fiscalYear,
        totalPay: officer.totalPay,
        exercisedValue: officer.exercisedValue,
        unexercisedValue: officer.unexercisedValue
      })),
      auditRisk: profile.auditRisk,
      boardRisk: profile.boardRisk,
      compensationRisk: profile.compensationRisk,
      shareHolderRightsRisk: profile.shareHolderRightsRisk,
      overallRisk: profile.overallRisk,
      governanceEpochDate: safeDateConversion(profile.governanceEpochDate),
      compensationAsOfEpochDate: safeDateConversion(profile.compensationAsOfEpochDate),
      irWebsite: profile.irWebsite,
      executiveTeam: profile.executiveTeam,
      maxAge: profile.maxAge
    };
  }

  public async getQuoteSummary(
    symbol: string,
    modules: readonly YahooFinanceModule[] = YAHOO_FINANCE_CONFIG.defaultModules
  ): Promise<QuoteSummary> {
    if (process.env.NODE_ENV === 'development') {
      console.log('YahooFinanceClient: Getting quote summary for', symbol);
    }
    const cacheKey = `quote_summary_${symbol}_${modules.join('_')}`;
    const cachedData = this.getCachedData<QuoteSummary>(cacheKey);
    if (cachedData) {
      if (process.env.NODE_ENV === 'development') {
        console.log('YahooFinanceClient: Using cached data for', symbol);
      }
      return cachedData;
    }

    return this.retryWithCacheClear(async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('YahooFinanceClient: Making API call for', symbol);
      }
      const result = await yahooFinance.quoteSummary(symbol, {
        modules: [...modules],
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('YahooFinanceClient: Got raw result for', symbol, result);
      }

      // Transform the result to match our QuoteSummary type
      const transformedResult: QuoteSummary = {
        ...result,
        assetProfile: result.assetProfile ? this.transformAssetProfile(result.assetProfile) : undefined,
        balanceSheetHistory: result.balanceSheetHistory ? {
          balanceSheetStatements: result.balanceSheetHistory.balanceSheetStatements.map(stmt => 
            this.transformBalanceSheetStatement(stmt)
          ),
          maxAge: result.balanceSheetHistory.maxAge,
        } : undefined,
        cashflowStatementHistory: result.cashflowStatementHistory ? {
          cashflowStatements: result.cashflowStatementHistory.cashflowStatements.map(stmt =>
            this.transformCashflowStatement(stmt)
          ),
          maxAge: result.cashflowStatementHistory.maxAge,
        } : undefined,
        earnings: result.earnings ? this.transformEarnings(result.earnings) : undefined,
        price: result.price ? this.transformPrice(result.price) : undefined,
        summaryDetail: result.summaryDetail ? this.transformSummaryDetail(result.summaryDetail) : undefined,
        financialData: result.financialData ? this.transformFinancialData(result.financialData) : undefined,
      };

      if (process.env.NODE_ENV === 'development') {
        console.log('YahooFinanceClient: Transformed result for', symbol, transformedResult);
      }

      this.setCachedData(cacheKey, transformedResult);
      return transformedResult;
    });
  }

  public async getHistoricalData(
    symbol: string,
    period1: Date,
    period2: Date,
    interval: '1d' | '1wk' | '1mo' = '1d'
  ) {
    const cacheKey = `historical_${symbol}_${period1.toISOString()}_${period2.toISOString()}_${interval}`;
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) return cachedData;

    return this.retryWithCacheClear(async () => {
      const result = await yahooFinance.historical(symbol, {
        period1,
        period2,
        interval,
      });

      this.setCachedData(cacheKey, result);
      return result;
    });
  }

  public async search(query: string): Promise<SearchResult[] | null> {
    const cacheKey = `search:${query}`;
    const cached = this.getCachedData<SearchResult[]>(cacheKey);
    if (cached) return cached;

    return this.retryWithCacheClear(async () => {
      const results = await yahooFinance.search(query, {
        quotesCount: 10,
        newsCount: 0,
        enableFuzzyQuery: true,
        quotesQueryId: 'tss_match_phrase_query',
        multiQuoteQueryId: 'multi_quote_single_token_query',
        enableCb: true,
        enableNavLinks: true,
        enableEnhancedTrivialQuery: true
      });

      if (!results || !results.quotes) {
        return null;
      }

      const transformedResults = results.quotes
        .filter((quote: any) => quote.isYahooFinance)
        .map((quote: any) => ({
          symbol: quote.symbol,
          shortname: quote.shortname || '',
          longname: quote.longname || '',
          exchange: quote.exchange,
          quoteType: quote.quoteType,
          score: quote.score,
          typeDisp: quote.typeDisp,
          isYahooFinance: quote.isYahooFinance
        }));

      this.setCachedData(cacheKey, transformedResults);
      return transformedResults;
    });
  }
}

// Export a singleton instance
export const yahooFinanceClient = YahooFinanceClient.getInstance(); 