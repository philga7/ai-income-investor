import { AnthropicClient, getAnthropicClient } from './anthropic-client';

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ text: 'Test response from Claude' }],
          usage: {
            input_tokens: 100,
            output_tokens: 50,
          },
        }),
      },
    })),
  };
});

describe('AnthropicClient', () => {
  let client: AnthropicClient;

  beforeEach(() => {
    // Reset the singleton
    (getAnthropicClient as any) = null;
    
    client = new AnthropicClient({
      apiKey: 'test-api-key',
      model: 'claude-3-5-haiku-20241022',
    });
  });

  describe('constructor', () => {
    it('should use Claude Haiku as default model for cost optimization', () => {
      const client = new AnthropicClient({ apiKey: 'test' });
      expect(client['config'].model).toBe('claude-3-5-haiku-20241022');
    });

    it('should accept custom configuration', () => {
      const client = new AnthropicClient({
        apiKey: 'test',
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 8000,
        temperature: 0.5,
      });
      
      expect(client['config'].model).toBe('claude-3-5-sonnet-20241022');
      expect(client['config'].maxTokens).toBe(8000);
      expect(client['config'].temperature).toBe(0.5);
    });
  });

  describe('generateResponse', () => {
    it('should generate a response with usage information', async () => {
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

    it('should include system prompt in request', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        content: [{ text: 'Test response' }],
        usage: { input_tokens: 100, output_tokens: 50 },
      });

      client['client'].messages.create = mockCreate;

      await client.generateResponse({
        prompt: 'Test prompt',
        systemPrompt: 'Custom system prompt',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          system: 'Custom system prompt',
        })
      );
    });
  });

  describe('cost calculation', () => {
    it('should calculate correct cost for Haiku model', () => {
      const cost = client['calculateCost'](1000, 500, 'claude-3-5-haiku-20241022');
      // Expected: (1000/1000000 * 0.25) + (500/1000000 * 1.25) = 0.00025 + 0.000625 = 0.000875
      expect(cost).toBeCloseTo(0.000875, 6);
    });

    it('should calculate correct cost for Sonnet model', () => {
      const cost = client['calculateCost'](1000, 500, 'claude-3-5-sonnet-20241022');
      // Expected: (1000/1000000 * 3.00) + (500/1000000 * 15.00) = 0.003 + 0.0075 = 0.0105
      expect(cost).toBeCloseTo(0.0105, 6);
    });
  });

  describe('convenience methods', () => {
    it('should provide portfolio analysis method', async () => {
      const portfolioData = { stocks: ['AAPL', 'MSFT'], totalValue: 10000 };
      
      const response = await client.analyzePortfolio(portfolioData);
      
      expect(response.content).toBe('Test response from Claude');
      expect(response.model).toBe('claude-3-5-haiku-20241022');
    });

    it('should provide investment recommendations method', async () => {
      const criteria = { riskTolerance: 'moderate', investmentAmount: 5000 };
      
      const response = await client.getInvestmentRecommendations(criteria);
      
      expect(response.content).toBe('Test response from Claude');
      expect(response.model).toBe('claude-3-5-haiku-20241022');
    });

    it('should provide security evaluation method', async () => {
      const securityData = { ticker: 'AAPL', price: 150, dividendYield: 0.5 };
      
      const response = await client.evaluateSecurity(securityData);
      
      expect(response.content).toBe('Test response from Claude');
      expect(response.model).toBe('claude-3-5-haiku-20241022');
    });
  });

  describe('error handling', () => {
    it('should handle rate limit errors', async () => {
      const mockCreate = jest.fn().mockRejectedValue({ status: 429 });
      client['client'].messages.create = mockCreate;

      await expect(client.generateResponse({ prompt: 'test' })).rejects.toThrow(
        'Rate limit exceeded. Please try again later.'
      );
    });

    it('should handle authentication errors', async () => {
      const mockCreate = jest.fn().mockRejectedValue({ status: 401 });
      client['client'].messages.create = mockCreate;

      await expect(client.generateResponse({ prompt: 'test' })).rejects.toThrow(
        'Invalid API key. Please check your configuration.'
      );
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const client1 = getAnthropicClient({ apiKey: 'test' });
      const client2 = getAnthropicClient({ apiKey: 'test' });
      
      expect(client1).toBe(client2);
    });

    it('should throw error if no API key provided', () => {
      // Clear environment variable
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      
      expect(() => getAnthropicClient()).toThrow(
        'Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable or pass config.'
      );
      
      // Restore environment variable
      if (originalKey) {
        process.env.ANTHROPIC_API_KEY = originalKey;
      }
    });
  });
}); 