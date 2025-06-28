export const YAHOO_FINANCE_CONFIG = {
  // API request settings
  requestTimeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 1000, // 1 second

  // Rate limiting settings
  rateLimit: {
    requestsPerMinute: 2000,
    burstSize: 100,
  },

  // Cache settings
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000, // Maximum number of cached items
  },

  // Retry settings for specific errors
  retry: {
    invalidCrumbRetries: 3,
    invalidCrumbDelay: 2000, // 2 seconds
    exponentialBackoff: true,
  },

  // Default modules to fetch in quote summary
  defaultModules: [
    'assetProfile',
    'balanceSheetHistory',
    'cashflowStatementHistory',
    'earnings',
    'financialData',
    'price',
    'summaryDetail',
    'defaultKeyStatistics',
    'calendarEvents',
  ] as const,

  // Error handling
  errorMessages: {
    rateLimitExceeded: 'Rate limit exceeded. Please try again later.',
    invalidSymbol: 'Invalid symbol provided.',
    networkError: 'Network error occurred. Please check your connection.',
    timeout: 'Request timed out. Please try again.',
    serverError: 'Server error occurred. Please try again later.',
    invalidCrumb: 'Yahoo Finance API authentication error. Please try again in a moment.',
  },
};

export type YahooFinanceModule =
  | 'assetProfile'
  | 'balanceSheetHistory'
  | 'cashflowStatementHistory'
  | 'earnings'
  | 'financialData'
  | 'price'
  | 'summaryDetail'
  | 'defaultKeyStatistics'
  | 'calendarEvents'; 