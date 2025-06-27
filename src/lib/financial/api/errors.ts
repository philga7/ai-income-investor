export class FinancialApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'FinancialApiError';
  }
}

export class RateLimitError extends FinancialApiError {
  constructor(message: string = 'Rate limit exceeded', originalError?: unknown) {
    super(message, 'RATE_LIMIT_EXCEEDED', originalError);
    this.name = 'RateLimitError';
  }
}

export class InvalidSymbolError extends FinancialApiError {
  constructor(symbol: string, originalError?: unknown) {
    super(`Invalid symbol: ${symbol}`, 'INVALID_SYMBOL', originalError);
    this.name = 'InvalidSymbolError';
  }
}

export class NetworkError extends FinancialApiError {
  constructor(message: string = 'Network error occurred', originalError?: unknown) {
    super(message, 'NETWORK_ERROR', originalError);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends FinancialApiError {
  constructor(message: string = 'Request timed out', originalError?: unknown) {
    super(message, 'TIMEOUT', originalError);
    this.name = 'TimeoutError';
  }
}

export class ServerError extends FinancialApiError {
  constructor(message: string = 'Server error occurred', originalError?: unknown) {
    super(message, 'SERVER_ERROR', originalError);
    this.name = 'ServerError';
  }
}

export class DataValidationError extends FinancialApiError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'DATA_VALIDATION_ERROR', originalError);
    this.name = 'DataValidationError';
  }
}

/**
 * Handles Yahoo Finance API errors and converts them to our custom error types
 */
export function handleYahooFinanceError(error: unknown): never {
  if (error instanceof FinancialApiError) {
    throw error;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);

  // Check for rate limiting
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    throw new RateLimitError(undefined, error);
  }

  // Check for invalid symbol
  if (errorMessage.includes('invalid symbol') || errorMessage.includes('not found')) {
    throw new InvalidSymbolError(errorMessage, error);
  }

  // Check for network errors
  if (errorMessage.includes('network') || errorMessage.includes('connection')) {
    throw new NetworkError(undefined, error);
  }

  // Check for timeout
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    throw new TimeoutError(undefined, error);
  }

  // Default to server error
  throw new ServerError(undefined, error);
}

/**
 * Validates required fields in API responses
 */
export function validateResponse<T extends object>(
  response: T,
  requiredFields: (keyof T)[]
): void {
  const missingFields = requiredFields.filter(field => !response[field]);
  
  if (missingFields.length > 0) {
    throw new DataValidationError(
      `Missing required fields: ${missingFields.join(', ')}`,
      { response, missingFields }
    );
  }
} 