export interface YahooFinanceError {
  code: string;
  message: string;
  description?: string;
}

export interface CalendarEvents {
  exDividendDate?: number;
  dividendDate?: number;
  earnings?: Array<{ raw: number; fmt: string }>;
  earningsDate?: Array<{ raw: number; fmt: string }>;
}

export interface QuoteSummary {
  assetProfile?: AssetProfile;
  balanceSheetHistory?: BalanceSheetHistory;
  cashflowStatementHistory?: CashflowStatementHistory;
  earnings?: Earnings;
  financialData?: FinancialData;
  price?: Price;
  summaryDetail?: SummaryDetail;
  calendarEvents?: CalendarEvents;
}

export interface AssetProfile {
  address1?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  website?: string;
  industry?: string;
  industryKey?: string;
  industryDisp?: string;
  sector?: string;
  sectorKey?: string;
  sectorDisp?: string;
  longBusinessSummary?: string;
  fullTimeEmployees?: number;
  companyOfficers?: Array<{
    name?: string;
    age?: number;
    title?: string;
    yearBorn?: number;
    fiscalYear?: number;
    totalPay?: number;
    exercisedValue?: number;
    unexercisedValue?: number;
  }>;
  auditRisk?: number;
  boardRisk?: number;
  compensationRisk?: number;
  shareHolderRightsRisk?: number;
  overallRisk?: number;
  governanceEpochDate?: number;
  compensationAsOfEpochDate?: number;
  irWebsite?: string;
  executiveTeam?: Array<any>;
  maxAge?: number;
}

export interface BalanceSheetHistory {
  balanceSheetStatements: BalanceSheetStatement[];
  maxAge?: number;
}

export interface BalanceSheetStatement {
  endDate: number;
  totalAssets?: number;
  totalCurrentAssets?: number;
  totalLiab?: number;
  totalCurrentLiabilities?: number;
  totalStockholderEquity?: number;
  cash?: number;
  shortTermInvestments?: number;
  netReceivables?: number;
  inventory?: number;
  otherCurrentAssets?: number;
  longTermInvestments?: number;
  propertyPlantEquipment?: number;
  otherAssets?: number;
  intangibleAssets?: number;
  goodwill?: number;
  deferredLongTermAssetCharges?: number;
  accountsPayable?: number;
  shortLongTermDebt?: number;
  otherCurrentLiab?: number;
  longTermDebt?: number;
  otherLiab?: number;
  minorityInterest?: number;
  treasuryStock?: number;
  retainedEarnings?: number;
  commonStock?: number;
  capitalSurplus?: number;
  maxAge?: number;
}

export interface CashflowStatementHistory {
  cashflowStatements: CashflowStatement[];
  maxAge?: number;
}

export interface CashflowStatement {
  endDate: number;
  totalCashFromOperatingActivities?: number;
  capitalExpenditures?: number;
  dividendsPaid?: number;
  netIncome?: number;
  maxAge?: number;
}

export interface Earnings {
  maxAge: number;
  earningsDate: number[];
  earningsAverage: number;
  earningsLow: number;
  earningsHigh: number;
  earningsChart: {
    quarterly: {
      date: number;
      actual: number;
      estimate: number;
    }[];
    currentQuarterEstimate: number;
    currentQuarterEstimateDate: string;
    currentQuarterEstimateYear: number;
    earningsDate: number[];
    isEarningsDateEstimate: boolean;
  };
  financialsChart: {
    yearly: {
      date: number;
      revenue: number;
      earnings: number;
    }[];
    quarterly: {
      date: number;
      revenue: number;
      earnings: number;
    }[];
  };
  financialCurrency: string;
}

export interface FinancialData {
  maxAge?: number;
  currentPrice?: number;
  targetHighPrice?: number;
  targetLowPrice?: number;
  targetMeanPrice?: number;
  targetMedianPrice?: number;
  recommendationMean?: number;
  recommendationKey: string;
  numberOfAnalystOpinions?: number;
  totalCash?: number;
  totalCashPerShare?: number;
  ebitda?: number;
  totalDebt?: number;
  quickRatio?: number;
  currentRatio?: number;
  totalRevenue?: number;
  debtToEquity?: number;
  revenuePerShare?: number;
  returnOnAssets?: number;
  returnOnEquity?: number;
  grossProfits?: number;
  freeCashflow?: number;
  operatingCashflow?: number;
  earningsGrowth?: number;
  revenueGrowth?: number;
  grossMargins?: number;
  ebitdaMargins?: number;
  operatingMargins?: number;
  profitMargins?: number;
  financialCurrency?: string;
}

export interface Price {
  currency?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketTime?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketVolume?: number;
  marketCap?: number;
  regularMarketPreviousClose?: number;
  regularMarketOpen?: number;
  shortName?: string;
  longName?: string;
  symbol?: string;
}

export interface SummaryDetail {
  previousClose?: number;
  open?: number;
  dayLow?: number;
  dayHigh?: number;
  regularMarketPreviousClose?: number;
  regularMarketOpen?: number;
  regularMarketDayLow?: number;
  regularMarketDayHigh?: number;
  dividendRate?: number;
  dividendYield?: number;
  exDividendDate?: number;
  payoutRatio?: number;
  fiveYearAvgDividendYield?: number;
  beta?: number;
  trailingPE?: number;
  forwardPE?: number;
  volume?: number;
  regularMarketVolume?: number;
  averageVolume?: number;
  averageVolume10days?: number;
  averageDailyVolume10Day?: number;
  bid?: number;
  ask?: number;
  bidSize?: number;
  askSize?: number;
  marketCap?: number;
  yield?: number;
  ytdReturn?: number;
  totalAssets?: number;
  expireDate?: number;
  strikePrice?: number;
  openInterest?: number;
  fiftyTwoWeekLow?: number;
  fiftyTwoWeekHigh?: number;
  priceToSalesTrailing12Months?: number;
  fiftyDayAverage?: number;
  twoHundredDayAverage?: number;
  trailingAnnualDividendRate?: number;
  trailingAnnualDividendYield?: number;
}

export interface SearchResult {
  symbol: string;
  shortname: string;
  longname: string;
  exchange: string;
  quoteType: string;
  score: number;
  typeDisp: string;
  isYahooFinance: boolean;
}

export interface YahooFinanceSearchQuote {
  exchange: string;
  shortname?: string;
  quoteType: string;
  symbol: string;
  index: string;
  score: number;
  typeDisp: string;
  longname?: string;
  isYahooFinance: boolean;
  name?: string;
  permalink?: string;
  industry?: string;
  sector?: string;
  newListingDate?: Date;
  nameChangeDate?: Date;
  prevName?: string;
  exchDisp?: string;
}

export interface YahooFinanceSearchResult {
  quotes: YahooFinanceSearchQuote[];
  news: any[];
  nav: any[];
  lists: any[];
  researchReports: any[];
  totalTime: number;
  timeTakenForQuotes: number;
  timeTakenForNews: number;
  timeTakenForNav: number;
  timeTakenForLists: number;
  timeTakenForResearchReports: number;
} 