import { AnthropicClient, getAnthropicClient } from '@/lib/ai/anthropic-client';

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: function AnthropicMock() {
    return {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ text: 'Test response from Claude' }],
          usage: {
            input_tokens: 100,
            output_tokens: 50,
          },
        }),
      },
    };
  },
}));

describe('AnthropicClient', () => {
  describe('constructor', () => {
    it('should create an instance with default configuration', () => {
      const client = new AnthropicClient({ apiKey: 'test' });
      expect(client).toBeInstanceOf(AnthropicClient);
    });

    it('should create an instance with custom configuration', () => {
      const client = new AnthropicClient({
        apiKey: 'test',
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 8000,
        temperature: 0.5,
      });
      expect(client).toBeInstanceOf(AnthropicClient);
    });
  });

  describe('generateResponse', () => {
    it('should generate a response', async () => {
      const client = new AnthropicClient({
        apiKey: 'test-api-key',
        model: 'claude-3-5-haiku-20241022',
      });

      const response = await client.generateResponse({
        prompt: 'Test prompt',
      });

      expect(response.content).toBe('Test response from Claude');
      expect(response.model).toBe('claude-3-5-haiku-20241022');
      expect(response.usage).toBeDefined();
      expect(response.usage?.inputTokens).toBe(100);
      expect(response.usage?.outputTokens).toBe(50);
      expect(response.usage?.totalTokens).toBe(150);
      expect(response.usage?.estimatedCost).toBeGreaterThan(0);
    });
  });

  describe('convenience methods', () => {
    it('should provide portfolio analysis method', async () => {
      const client = new AnthropicClient({
        apiKey: 'test-api-key',
        model: 'claude-3-5-haiku-20241022',
      });

      const portfolioData = { stocks: ['AAPL', 'MSFT'], totalValue: 10000 };
      const response = await client.analyzePortfolio(portfolioData);
      
      expect(response.content).toBe('Test response from Claude');
      expect(response.model).toBe('claude-3-5-haiku-20241022');
    });

    it('should provide investment recommendations method', async () => {
      const client = new AnthropicClient({
        apiKey: 'test-api-key',
        model: 'claude-3-5-haiku-20241022',
      });

      const criteria = { riskTolerance: 'moderate', investmentAmount: 5000 };
      const response = await client.getInvestmentRecommendations(criteria);
      
      expect(response.content).toBe('Test response from Claude');
      expect(response.model).toBe('claude-3-5-haiku-20241022');
    });

    it('should provide security evaluation method', async () => {
      const client = new AnthropicClient({
        apiKey: 'test-api-key',
        model: 'claude-3-5-haiku-20241022',
      });

      const securityData = { ticker: 'AAPL', price: 150, dividendYield: 0.5 };
      const response = await client.evaluateSecurity(securityData);
      
      expect(response.content).toBe('Test response from Claude');
      expect(response.model).toBe('claude-3-5-haiku-20241022');
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const client1 = getAnthropicClient({ apiKey: 'test' });
      const client2 = getAnthropicClient({ apiKey: 'test' });
      
      expect(client1).toBe(client2);
    });

    it('should throw error if no API key provided', () => {
      // Save and clear the environment variable
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      // Reset the module registry so the singleton and env are re-evaluated
      jest.resetModules();

      // Re-import the function after resetting modules
      const { getAnthropicClient } = require('@/lib/ai/anthropic-client');

      expect(() => getAnthropicClient()).toThrow(
        'Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable or pass config.'
      );

      // Restore the environment variable
      if (originalKey) {
        process.env.ANTHROPIC_API_KEY = originalKey;
      }
    });
  });
}); 