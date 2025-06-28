import Anthropic from '@anthropic-ai/sdk';

export interface AnthropicConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  context?: any;
  userId?: string;
}

export interface AIResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
  model: string;
  timestamp: Date;
}

export class AnthropicClient {
  private client: Anthropic;
  private config: AnthropicConfig;
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly rateLimit = 50; // requests per minute
  private readonly rateLimitWindow = 60000; // 1 minute in ms

  // Pricing per 1M tokens (as of 2024)
  private readonly pricing = {
    'claude-3-5-haiku-20241022': { input: 0.25, output: 1.25 }, // $0.25/$1.25 per 1M tokens
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 }, // $3.00/$15.00 per 1M tokens
    'claude-3-opus-20240229': { input: 15.00, output: 75.00 }, // $15.00/$75.00 per 1M tokens
  };

  constructor(config: AnthropicConfig) {
    this.config = {
      model: 'claude-3-5-haiku-20241022', // Use Haiku for cost optimization
      maxTokens: 4000,
      temperature: 0.7,
      timeout: 30000,
      ...config,
    };

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      timeout: this.config.timeout,
    });
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitWindow) {
      this.requestCount++;
      if (this.requestCount > this.rateLimit) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
    } else {
      this.requestCount = 1;
    }
    
    this.lastRequestTime = now;
  }

  private calculateCost(inputTokens: number, outputTokens: number, model: string): number {
    const modelPricing = this.pricing[model as keyof typeof this.pricing];
    if (!modelPricing) return 0;

    const inputCost = (inputTokens / 1000000) * modelPricing.input;
    const outputCost = (outputTokens / 1000000) * modelPricing.output;
    return inputCost + outputCost;
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    try {
      await this.checkRateLimit();

      const systemPrompt = request.systemPrompt || this.getDefaultSystemPrompt();
      
      const response = await this.client.messages.create({
        model: this.config.model!,
        max_tokens: this.config.maxTokens || 4000,
        temperature: this.config.temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: this.formatPrompt(request),
          },
        ],
      });

      const inputTokens = response.usage?.input_tokens || 0;
      const outputTokens = response.usage?.output_tokens || 0;
      const totalTokens = inputTokens + outputTokens;
      const estimatedCost = this.calculateCost(inputTokens, outputTokens, this.config.model!);

      // Handle different content types
      let content = '';
      if (response.content && response.content.length > 0) {
        const firstContent = response.content[0];
        if ('text' in firstContent) {
          content = firstContent.text;
        } else {
          content = 'Response contains non-text content';
        }
      }

      return {
        content,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens,
          estimatedCost,
        },
        model: this.config.model!,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw this.handleError(error);
    }
  }

  private formatPrompt(request: AIRequest): string {
    let prompt = request.prompt;
    
    if (request.context) {
      prompt = `Context: ${JSON.stringify(request.context, null, 2)}\n\nRequest: ${prompt}`;
    }
    
    return prompt;
  }

  private getDefaultSystemPrompt(): string {
    return `You are an AI financial advisor specializing in income investing. You help users analyze portfolios, evaluate dividend stocks, and make investment recommendations. Always provide clear, actionable advice while considering risk factors and market conditions. Keep responses concise and focused on practical insights.`;
  }

  private handleError(error: any): Error {
    if (error.status === 429) {
      return new Error('Rate limit exceeded. Please try again later.');
    }
    
    if (error.status === 401) {
      return new Error('Invalid API key. Please check your configuration.');
    }
    
    if (error.status === 400) {
      return new Error('Invalid request. Please check your input.');
    }
    
    if (error.code === 'ECONNABORTED') {
      return new Error('Request timed out. Please try again.');
    }
    
    return new Error(`AI service error: ${error.message || 'Unknown error'}`);
  }

  // Convenience methods for specific use cases
  async analyzePortfolio(portfolioData: any, userId?: string): Promise<AIResponse> {
    return this.generateResponse({
      prompt: `Analyze this portfolio and provide insights on diversification, risk, and potential improvements:\n${JSON.stringify(portfolioData, null, 2)}`,
      systemPrompt: `You are a portfolio analyst. Provide detailed analysis including:
- Diversification assessment
- Risk analysis
- Potential improvements
- Dividend sustainability
- Sector allocation insights

Keep your analysis concise and actionable.`,
      context: { portfolioData },
      userId,
    });
  }

  async getInvestmentRecommendations(criteria: any, userId?: string): Promise<AIResponse> {
    return this.generateResponse({
      prompt: `Based on these criteria, suggest suitable dividend stocks:\n${JSON.stringify(criteria, null, 2)}`,
      systemPrompt: `You are an investment advisor. Provide recommendations that include:
- Stock suggestions with reasoning
- Expected dividend yields
- Risk assessment
- Investment timeline
- Alternative options

Focus on practical, actionable recommendations.`,
      context: { criteria },
      userId,
    });
  }

  async evaluateSecurity(securityData: any, userId?: string): Promise<AIResponse> {
    return this.generateResponse({
      prompt: `Evaluate this security for income investing:\n${JSON.stringify(securityData, null, 2)}`,
      systemPrompt: `You are a security analyst. Provide evaluation including:
- Dividend sustainability
- Financial health
- Growth prospects
- Risk factors
- Buy/hold/sell recommendation

Provide clear, concise analysis with actionable insights.`,
      context: { securityData },
      userId,
    });
  }

  // Method to get current usage statistics
  getUsageStats() {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      rateLimit: this.rateLimit,
      rateLimitWindow: this.rateLimitWindow,
    };
  }

  // Method to switch models (useful for testing different models)
  switchModel(model: string) {
    if (this.pricing[model as keyof typeof this.pricing]) {
      this.config.model = model;
      console.log(`Switched to model: ${model}`);
    } else {
      throw new Error(`Unknown model: ${model}`);
    }
  }
}

// Singleton instance
let anthropicClient: AnthropicClient | null = null;

export function getAnthropicClient(config?: AnthropicConfig): AnthropicClient {
  if (!anthropicClient) {
    if (!config?.apiKey && !process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable or pass config.');
    }
    
    anthropicClient = new AnthropicClient({
      apiKey: config?.apiKey || process.env.ANTHROPIC_API_KEY!,
      ...config,
    });
  }
  
  return anthropicClient;
} 