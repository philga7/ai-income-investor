import {
  FinancialApiError,
  RateLimitError,
  InvalidSymbolError,
  NetworkError,
  TimeoutError,
  ServerError,
  DataValidationError,
  handleYahooFinanceError,
  validateResponse
} from '@/lib/financial/api/errors';

describe('Financial API Errors', () => {
  describe('FinancialApiError', () => {
    it('should create a FinancialApiError with message and code', () => {
      const error = new FinancialApiError('Test error', 'TEST_ERROR');
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('FinancialApiError');
      expect(error.originalError).toBeUndefined();
    });

    it('should create a FinancialApiError with original error', () => {
      const originalError = new Error('Original error');
      const error = new FinancialApiError('Test error', 'TEST_ERROR', originalError);
      
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('RateLimitError', () => {
    it('should create a RateLimitError with default message', () => {
      const error = new RateLimitError();
      
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(error.name).toBe('RateLimitError');
    });

    it('should create a RateLimitError with custom message', () => {
      const error = new RateLimitError('Custom rate limit message');
      
      expect(error.message).toBe('Custom rate limit message');
      expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
    });

    it('should create a RateLimitError with original error', () => {
      const originalError = new Error('Original error');
      const error = new RateLimitError(undefined, originalError);
      
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('InvalidSymbolError', () => {
    it('should create an InvalidSymbolError with symbol', () => {
      const error = new InvalidSymbolError('INVALID');
      
      expect(error.message).toBe('Invalid symbol: INVALID');
      expect(error.code).toBe('INVALID_SYMBOL');
      expect(error.name).toBe('InvalidSymbolError');
    });

    it('should create an InvalidSymbolError with original error', () => {
      const originalError = new Error('Original error');
      const error = new InvalidSymbolError('INVALID', originalError);
      
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('NetworkError', () => {
    it('should create a NetworkError with default message', () => {
      const error = new NetworkError();
      
      expect(error.message).toBe('Network error occurred');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.name).toBe('NetworkError');
    });

    it('should create a NetworkError with custom message', () => {
      const error = new NetworkError('Custom network message');
      
      expect(error.message).toBe('Custom network message');
      expect(error.code).toBe('NETWORK_ERROR');
    });
  });

  describe('TimeoutError', () => {
    it('should create a TimeoutError with default message', () => {
      const error = new TimeoutError();
      
      expect(error.message).toBe('Request timed out');
      expect(error.code).toBe('TIMEOUT');
      expect(error.name).toBe('TimeoutError');
    });

    it('should create a TimeoutError with custom message', () => {
      const error = new TimeoutError('Custom timeout message');
      
      expect(error.message).toBe('Custom timeout message');
      expect(error.code).toBe('TIMEOUT');
    });
  });

  describe('ServerError', () => {
    it('should create a ServerError with default message', () => {
      const error = new ServerError();
      
      expect(error.message).toBe('Server error occurred');
      expect(error.code).toBe('SERVER_ERROR');
      expect(error.name).toBe('ServerError');
    });

    it('should create a ServerError with custom message', () => {
      const error = new ServerError('Custom server message');
      
      expect(error.message).toBe('Custom server message');
      expect(error.code).toBe('SERVER_ERROR');
    });
  });

  describe('DataValidationError', () => {
    it('should create a DataValidationError with message', () => {
      const error = new DataValidationError('Validation failed');
      
      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe('DATA_VALIDATION_ERROR');
      expect(error.name).toBe('DataValidationError');
    });

    it('should create a DataValidationError with original error', () => {
      const originalError = { field: 'test' };
      const error = new DataValidationError('Validation failed', originalError);
      
      expect(error.originalError).toBe(originalError);
    });
  });

  describe('handleYahooFinanceError', () => {
    it('should re-throw FinancialApiError instances', () => {
      const originalError = new RateLimitError();
      
      expect(() => handleYahooFinanceError(originalError)).toThrow(RateLimitError);
    });

    it('should convert rate limit errors', () => {
      const yahooError = new Error('rate limit exceeded');
      
      expect(() => handleYahooFinanceError(yahooError)).toThrow(RateLimitError);
      expect(() => handleYahooFinanceError(yahooError)).toThrow('Rate limit exceeded');
    });

    it('should convert rate limit errors with different casing', () => {
      const yahooError = new Error('TOO MANY REQUESTS');
      
      expect(() => handleYahooFinanceError(yahooError)).toThrow(RateLimitError);
      expect(() => handleYahooFinanceError(yahooError)).toThrow('Rate limit exceeded');
    });

    it('should convert invalid symbol errors', () => {
      const yahooError = new Error('invalid symbol');
      
      expect(() => handleYahooFinanceError(yahooError)).toThrow(InvalidSymbolError);
      expect(() => handleYahooFinanceError(yahooError)).toThrow('Invalid symbol');
    });

    it('should convert not found errors', () => {
      const yahooError = new Error('symbol not found');
      
      expect(() => handleYahooFinanceError(yahooError)).toThrow(InvalidSymbolError);
      expect(() => handleYahooFinanceError(yahooError)).toThrow('Invalid symbol');
    });

    it('should convert network errors', () => {
      const yahooError = new Error('network error');
      
      expect(() => handleYahooFinanceError(yahooError)).toThrow(NetworkError);
      expect(() => handleYahooFinanceError(yahooError)).toThrow('Network error occurred');
    });

    it('should convert connection errors', () => {
      const yahooError = new Error('connection failed');
      
      expect(() => handleYahooFinanceError(yahooError)).toThrow(NetworkError);
      expect(() => handleYahooFinanceError(yahooError)).toThrow('Network error occurred');
    });

    it('should convert timeout errors', () => {
      const yahooError = new Error('request timeout');
      
      expect(() => handleYahooFinanceError(yahooError)).toThrow(TimeoutError);
      expect(() => handleYahooFinanceError(yahooError)).toThrow('Request timed out');
    });

    it('should convert timed out errors', () => {
      const yahooError = new Error('request timed out');
      
      expect(() => handleYahooFinanceError(yahooError)).toThrow(TimeoutError);
      expect(() => handleYahooFinanceError(yahooError)).toThrow('Request timed out');
    });

    it('should convert unknown errors to ServerError', () => {
      const yahooError = new Error('unknown error');
      
      expect(() => handleYahooFinanceError(yahooError)).toThrow(ServerError);
      expect(() => handleYahooFinanceError(yahooError)).toThrow('Server error occurred');
    });

    it('should handle non-Error objects', () => {
      const yahooError = 'string error';
      
      expect(() => handleYahooFinanceError(yahooError)).toThrow(ServerError);
      expect(() => handleYahooFinanceError(yahooError)).toThrow('Server error occurred');
    });

    it('should preserve original error in converted errors', () => {
      const originalError = new Error('original error');
      
      try {
        handleYahooFinanceError(originalError);
      } catch (error) {
        expect(error).toBeInstanceOf(ServerError);
        expect((error as ServerError).originalError).toBe(originalError);
      }
    });
  });

  describe('validateResponse', () => {
    it('should pass validation for valid response', () => {
      const response = { field1: 'value1', field2: 'value2' };
      
      expect(() => validateResponse(response, ['field1', 'field2'])).not.toThrow();
    });

    it('should pass validation for response with truthy values', () => {
      const response = { field1: 0, field2: false, field3: '' };
      
      expect(() => validateResponse(response, ['field1', 'field2', 'field3'])).toThrow(DataValidationError);
      expect(() => validateResponse(response, ['field1', 'field2', 'field3'])).toThrow('Missing required fields: field1, field2, field3');
    });

    it('should throw DataValidationError for missing required fields', () => {
      const response = { field1: 'value1', field2: undefined };
      
      expect(() => validateResponse(response, ['field1', 'field2'])).toThrow(DataValidationError);
      expect(() => validateResponse(response, ['field1', 'field2'])).toThrow('Missing required fields: field2');
    });

    it('should throw DataValidationError for null/undefined fields', () => {
      const response = { field1: 'value1', field2: null, field3: undefined };
      
      expect(() => validateResponse(response, ['field1', 'field2', 'field3'])).toThrow(DataValidationError);
      expect(() => validateResponse(response, ['field1', 'field2', 'field3'])).toThrow('Missing required fields: field2, field3');
    });

    it('should include response and missing fields in error', () => {
      const response = { field1: 'value1', field2: undefined };
      
      try {
        validateResponse(response, ['field1', 'field2']);
      } catch (error) {
        expect(error).toBeInstanceOf(DataValidationError);
        expect((error as DataValidationError).originalError).toEqual({
          response,
          missingFields: ['field2']
        });
      }
    });

    it('should handle empty required fields array', () => {
      const response = { field1: 'value1' };
      
      expect(() => validateResponse(response, [])).not.toThrow();
    });

    it('should handle empty response object', () => {
      const response = {};
      
      expect(() => validateResponse(response, [])).not.toThrow();
    });
  });
}); 