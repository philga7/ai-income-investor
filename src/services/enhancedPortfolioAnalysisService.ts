import { Portfolio, PortfolioSecurity } from './portfolioService';
import { DividendMetrics, dividendService } from './dividendService';
import { portfolioAnalyticsService } from './portfolioAnalyticsService';

export interface DividendTimingAnalysis {
  nextDividendDate: string | null;
  daysUntilNextDividend: number | null;
  nextPaymentDate: string | null;
  daysUntilPayment: number | null;
  dividendReliability: 'high' | 'medium' | 'low';
  dividendGrowthTrend: 'increasing' | 'stable' | 'decreasing';
  payoutRatioHealth: 'healthy' | 'moderate' | 'concerning';
  exDividendCalendar: Array<{
    date: string;
    ticker: string;
    amount: number;
    type: 'ex-date' | 'payment';
  }>;
}

export interface SecurityDividendAnalysis {
  ticker: string;
  name: string;
  shares: number;
  currentPrice: number;
  marketValue: number;
  dividend: number;
  dividendYield: number;
  nextExDate: string | null;
  nextPaymentDate: string | null;
  dividendReliability: 'high' | 'medium' | 'low';
  dividendGrowthRate: number;
  payoutRatio: number;
  sector: string;
  dividendTiming: DividendTimingAnalysis;
}

export interface EnhancedPortfolioAnalysis {
  portfolioId: string;
  portfolioName: string;
  analysisDate: string;
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  dividendMetrics: DividendMetrics;
  dividendTiming: DividendTimingAnalysis;
  securities: SecurityDividendAnalysis[];
  portfolioInsights: {
    dividendConcentration: 'high' | 'medium' | 'low';
    sectorDiversification: 'well-diversified' | 'moderate' | 'concentrated';
    dividendReliability: 'high' | 'medium' | 'low';
    incomeStability: 'stable' | 'moderate' | 'volatile';
    nextIncomeEvent: {
      date: string;
      amount: number;
      ticker: string;
      type: 'ex-date' | 'payment';
    } | null;
  };
}

export interface AIAnalysisRequest {
  portfolioId: string;
  analysisType: 'dividend_timing' | 'portfolio_optimization' | 'risk_assessment' | 'comprehensive';
  includeHistoricalData?: boolean;
  includeMarketContext?: boolean;
  focusAreas?: string[];
}

export interface AIAnalysisResponse {
  analysis: string;
  recommendations: Array<{
    type: 'buy' | 'sell' | 'hold' | 'add' | 'reduce';
    ticker?: string;
    reason: string;
    confidence: number;
    timeframe: 'immediate' | 'short-term' | 'long-term';
  }>;
  dividendInsights: {
    nextDividendOpportunities: Array<{
      ticker: string;
      exDate: string;
      amount: number;
      recommendation: string;
    }>;
    dividendReliabilityAssessment: string;
    incomeProjection: {
      nextMonth: number;
      nextQuarter: number;
      nextYear: number;
    };
  };
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high';
    dividendCutRisk: 'low' | 'medium' | 'high';
    concentrationRisk: 'low' | 'medium' | 'high';
    marketRisk: 'low' | 'medium' | 'high';
    recommendations: string[];
  };
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
  model: string;
  timestamp: string;
  message?: string;
}

export const enhancedPortfolioAnalysisService = {
  /**
   * Generate comprehensive portfolio analysis with dividend timing focus
   */
  async generateEnhancedAnalysis(
    portfolio: Portfolio,
    analysisType: AIAnalysisRequest['analysisType'] = 'comprehensive'
  ): Promise<EnhancedPortfolioAnalysis> {
    const analytics = portfolioAnalyticsService.calculatePortfolioAnalytics(portfolio);
    const dividendTiming = await this.analyzeDividendTiming(portfolio);
    const securities = await this.analyzeSecurities(portfolio);
    const insights = this.generatePortfolioInsights(analytics, dividendTiming, securities);

    return {
      portfolioId: portfolio.id,
      portfolioName: portfolio.name,
      analysisDate: new Date().toISOString(),
      totalValue: analytics.valueMetrics.totalValue,
      totalCost: analytics.valueMetrics.totalCost,
      totalGainLoss: analytics.valueMetrics.totalGainLoss,
      totalGainLossPercentage: analytics.valueMetrics.totalGainLossPercentage,
      dividendMetrics: analytics.dividendMetrics,
      dividendTiming,
      securities,
      portfolioInsights: insights
    };
  },

  /**
   * Analyze dividend timing for the portfolio
   */
  async analyzeDividendTiming(portfolio: Portfolio): Promise<DividendTimingAnalysis> {
    const today = new Date();
    const exDividendCalendar: DividendTimingAnalysis['exDividendCalendar'] = [];
    
    let nextDividendDate: string | null = null;
    let nextPaymentDate: string | null = null;
    let daysUntilNextDividend: number | null = null;
    let daysUntilPayment: number | null = null;

    // Get upcoming dividends for all securities
    const upcomingDividends = await dividendService.getUpcomingDividends(portfolio);
    
    for (const dividend of upcomingDividends) {
      const security = portfolio.securities.find(s => s.security.id === dividend.security_id);
      if (security) {
        // Add ex-date event
        exDividendCalendar.push({
          date: dividend.ex_date,
          ticker: security.security.ticker,
          amount: dividend.amount,
          type: 'ex-date'
        });

        // Add payment event
        exDividendCalendar.push({
          date: dividend.payment_date,
          ticker: security.security.ticker,
          amount: dividend.amount,
          type: 'payment'
        });

        // Find next ex-date
        if (!nextDividendDate || new Date(dividend.ex_date) < new Date(nextDividendDate)) {
          nextDividendDate = dividend.ex_date;
          daysUntilNextDividend = Math.ceil((new Date(dividend.ex_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        }

        // Find next payment
        if (!nextPaymentDate || new Date(dividend.payment_date) < new Date(nextPaymentDate)) {
          nextPaymentDate = dividend.payment_date;
          daysUntilPayment = Math.ceil((new Date(dividend.payment_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        }
      }
    }

    // Sort calendar by date
    exDividendCalendar.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate dividend reliability based on portfolio metrics
    const dividendReliability = this.calculateDividendReliability(portfolio);
    const dividendGrowthTrend = this.calculateDividendGrowthTrend(portfolio);
    const payoutRatioHealth = this.calculatePayoutRatioHealth(portfolio);

    return {
      nextDividendDate,
      daysUntilNextDividend,
      nextPaymentDate,
      daysUntilPayment,
      dividendReliability,
      dividendGrowthTrend,
      payoutRatioHealth,
      exDividendCalendar
    };
  },

  /**
   * Analyze individual securities for dividend characteristics
   */
  async analyzeSecurities(portfolio: Portfolio): Promise<SecurityDividendAnalysis[]> {
    const securities: SecurityDividendAnalysis[] = [];

    for (const portfolioSecurity of portfolio.securities) {
      const security = portfolioSecurity.security;
      const marketValue = portfolioSecurity.shares * security.price;
      
      // Get next dividend dates for this security
      const nextDividend = await dividendService.getNextDividendDates(security.id);
      
      // Calculate dividend timing analysis for this security
      const dividendTiming = await this.analyzeSecurityDividendTiming(security.id);

      securities.push({
        ticker: security.ticker,
        name: security.name,
        shares: portfolioSecurity.shares,
        currentPrice: security.price,
        marketValue,
        dividend: security.dividend || 0,
        dividendYield: security.yield || 0,
        nextExDate: nextDividend?.ex_date || null,
        nextPaymentDate: nextDividend?.payment_date || null,
        dividendReliability: this.calculateSecurityDividendReliability(security),
        dividendGrowthRate: security.dividend_growth_5yr || 0,
        payoutRatio: security.payout_ratio || 0,
        sector: security.sector || 'Unknown',
        dividendTiming
      });
    }

    return securities;
  },

  /**
   * Analyze dividend timing for a single security
   */
  async analyzeSecurityDividendTiming(securityId: string): Promise<DividendTimingAnalysis> {
    const nextDividend = await dividendService.getNextDividendDates(securityId);
    const today = new Date();

    return {
      nextDividendDate: nextDividend?.ex_date || null,
      daysUntilNextDividend: nextDividend?.ex_date ? 
        Math.ceil((new Date(nextDividend.ex_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null,
      nextPaymentDate: nextDividend?.payment_date || null,
      daysUntilPayment: nextDividend?.payment_date ? 
        Math.ceil((new Date(nextDividend.payment_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null,
      dividendReliability: 'medium', // Will be calculated based on security data
      dividendGrowthTrend: 'stable',
      payoutRatioHealth: 'healthy',
      exDividendCalendar: []
    };
  },

  /**
   * Generate portfolio insights based on analysis
   */
  generatePortfolioInsights(
    analytics: any,
    dividendTiming: DividendTimingAnalysis,
    securities: SecurityDividendAnalysis[]
  ) {
    // Calculate dividend concentration
    const dividendSecurities = securities.filter(s => s.dividend > 0);
    const dividendConcentration = dividendSecurities.length / securities.length;
    
    // Calculate sector diversification
    const sectors = new Set(securities.map(s => s.sector));
    const sectorDiversification = sectors.size >= 5 ? 'well-diversified' : 
                                 sectors.size >= 3 ? 'moderate' : 'concentrated';

    // Calculate overall dividend reliability
    const reliabilityScores = securities.map(s => {
      switch (s.dividendReliability) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 0;
      }
    });
    const avgReliability = reliabilityScores.reduce((a: number, b: number) => a + b, 0) / reliabilityScores.length;
    const dividendReliability = avgReliability >= 2.5 ? 'high' : avgReliability >= 1.5 ? 'medium' : 'low';

    // Calculate income stability based on yield variance
    const yields = securities.map(s => s.dividendYield).filter(yieldValue => yieldValue > 0);
    const yieldVariance = yields.length > 1 ? 
      Math.sqrt(yields.reduce((sum, yieldValue) => sum + Math.pow(yieldValue - (yields.reduce((a, b) => a + b, 0) / yields.length), 2), 0) / yields.length) : 0;
    const incomeStability = yieldVariance < 1 ? 'stable' : yieldVariance < 3 ? 'moderate' : 'volatile';

    // Find next income event
    const nextIncomeEvent = dividendTiming.exDividendCalendar.length > 0 ? 
      dividendTiming.exDividendCalendar[0] : null;

    return {
      dividendConcentration: (dividendConcentration > 0.7 ? 'high' : 
                            dividendConcentration > 0.4 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      sectorDiversification: sectorDiversification as 'well-diversified' | 'moderate' | 'concentrated',
      dividendReliability: dividendReliability as 'high' | 'medium' | 'low',
      incomeStability: incomeStability as 'stable' | 'moderate' | 'volatile',
      nextIncomeEvent
    };
  },

  /**
   * Calculate dividend reliability for the portfolio
   */
  calculateDividendReliability(portfolio: Portfolio): 'high' | 'medium' | 'low' {
    const dividendSecurities = portfolio.securities.filter(s => s.security.dividend && s.security.dividend > 0);
    
    if (dividendSecurities.length === 0) return 'low';

    const avgPayoutRatio = dividendSecurities.reduce((sum, s) => sum + (s.security.payout_ratio || 0), 0) / dividendSecurities.length;
    const avgGrowthRate = dividendSecurities.reduce((sum, s) => sum + (s.security.dividend_growth_5yr || 0), 0) / dividendSecurities.length;

    if (avgPayoutRatio < 60 && avgGrowthRate > 2) return 'high';
    if (avgPayoutRatio < 80 && avgGrowthRate > 0) return 'medium';
    return 'low';
  },

  /**
   * Calculate dividend growth trend
   */
  calculateDividendGrowthTrend(portfolio: Portfolio): 'increasing' | 'stable' | 'decreasing' {
    const dividendSecurities = portfolio.securities.filter(s => s.security.dividend && s.security.dividend > 0);
    
    if (dividendSecurities.length === 0) return 'stable';

    const avgGrowthRate = dividendSecurities.reduce((sum, s) => sum + (s.security.dividend_growth_5yr || 0), 0) / dividendSecurities.length;

    if (avgGrowthRate > 3) return 'increasing';
    if (avgGrowthRate > -2) return 'stable';
    return 'decreasing';
  },

  /**
   * Calculate payout ratio health
   */
  calculatePayoutRatioHealth(portfolio: Portfolio): 'healthy' | 'moderate' | 'concerning' {
    const dividendSecurities = portfolio.securities.filter(s => s.security.dividend && s.security.dividend > 0);
    
    if (dividendSecurities.length === 0) return 'healthy';

    const avgPayoutRatio = dividendSecurities.reduce((sum, s) => sum + (s.security.payout_ratio || 0), 0) / dividendSecurities.length;

    if (avgPayoutRatio < 60) return 'healthy';
    if (avgPayoutRatio < 80) return 'moderate';
    return 'concerning';
  },

  /**
   * Calculate dividend reliability for a single security
   */
  calculateSecurityDividendReliability(security: any): 'high' | 'medium' | 'low' {
    const payoutRatio = security.payout_ratio || 0;
    const growthRate = security.dividend_growth_5yr || 0;
    const dividendYield = security.yield || 0;

    if (payoutRatio < 60 && growthRate > 2 && dividendYield > 2) return 'high';
    if (payoutRatio < 80 && growthRate > 0) return 'medium';
    return 'low';
  },

  /**
   * Format analysis data for AI consumption
   */
  formatForAIAnalysis(analysis: EnhancedPortfolioAnalysis): string {
    const nextDividend = analysis.dividendTiming.nextDividendDate ? 
      `Next dividend ex-date: ${new Date(analysis.dividendTiming.nextDividendDate).toLocaleDateString()} (${analysis.dividendTiming.daysUntilNextDividend} days)` : 
      'No upcoming dividends';

    const nextPayment = analysis.dividendTiming.nextPaymentDate ? 
      `Next payment date: ${new Date(analysis.dividendTiming.nextPaymentDate).toLocaleDateString()} (${analysis.dividendTiming.daysUntilPayment} days)` : 
      'No upcoming payments';

    const securitiesSummary = analysis.securities.map(sec => 
      `${sec.ticker}: ${sec.shares} shares @ $${sec.currentPrice}, Yield: ${sec.dividendYield.toFixed(2)}%, ` +
      `Reliability: ${sec.dividendReliability}, Next ex-date: ${sec.nextExDate ? new Date(sec.nextExDate).toLocaleDateString() : 'Unknown'}`
    ).join('\n');

    return `
PORTFOLIO ANALYSIS: ${analysis.portfolioName}
Analysis Date: ${new Date(analysis.analysisDate).toLocaleDateString()}

PORTFOLIO SUMMARY:
- Total Value: $${analysis.totalValue.toLocaleString()}
- Total Cost: $${analysis.totalCost.toLocaleString()}
- Gain/Loss: $${analysis.totalGainLoss.toLocaleString()} (${analysis.totalGainLossPercentage.toFixed(2)}%)
- Annual Dividend Income: $${analysis.dividendMetrics.totalAnnualDividend.toLocaleString()}
- Portfolio Yield: ${analysis.dividendMetrics.portfolioYield.toFixed(2)}%

DIVIDEND TIMING:
- ${nextDividend}
- ${nextPayment}
- Dividend Reliability: ${analysis.dividendTiming.dividendReliability}
- Growth Trend: ${analysis.dividendTiming.dividendGrowthTrend}
- Payout Health: ${analysis.dividendTiming.payoutRatioHealth}

PORTFOLIO INSIGHTS:
- Dividend Concentration: ${analysis.portfolioInsights.dividendConcentration}
- Sector Diversification: ${analysis.portfolioInsights.sectorDiversification}
- Income Stability: ${analysis.portfolioInsights.incomeStability}

SECURITIES:
${securitiesSummary}

UPCOMING DIVIDEND CALENDAR:
${analysis.dividendTiming.exDividendCalendar.slice(0, 10).map(event => 
  `${event.date}: ${event.ticker} ${event.type} $${event.amount}`
).join('\n')}
    `.trim();
  },

  /**
   * Parse AI response into structured format
   */
  parseAIResponse(aiResponse: string, usage: any, model: string): AIAnalysisResponse {
    // Extract recommendations using regex patterns
    const buyRecommendations = this.extractRecommendations(aiResponse, 'buy');
    const sellRecommendations = this.extractRecommendations(aiResponse, 'sell');
    const holdRecommendations = this.extractRecommendations(aiResponse, 'hold');

    const recommendations = [
      ...buyRecommendations.map(r => ({ ...r, type: 'buy' as const })),
      ...sellRecommendations.map(r => ({ ...r, type: 'sell' as const })),
      ...holdRecommendations.map(r => ({ ...r, type: 'hold' as const }))
    ];

    // Extract dividend insights
    const dividendInsights = this.extractDividendInsights(aiResponse);

    // Extract risk assessment
    const riskAssessment = this.extractRiskAssessment(aiResponse);

    return {
      analysis: aiResponse,
      recommendations,
      dividendInsights,
      riskAssessment,
      usage,
      model,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Extract recommendations from AI response
   */
  extractRecommendations(response: string, type: string): Array<{
    ticker?: string;
    reason: string;
    confidence: number;
    timeframe: 'immediate' | 'short-term' | 'long-term';
  }> {
    const recommendations: Array<{
      ticker?: string;
      reason: string;
      confidence: number;
      timeframe: 'immediate' | 'short-term' | 'long-term';
    }> = [];

    // Simple pattern matching - in production, you might use more sophisticated NLP
    const lines = response.split('\n');
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes(type) && (lowerLine.includes('ticker') || lowerLine.includes('stock') || lowerLine.includes('security'))) {
        const tickerMatch = line.match(/\b[A-Z]{1,5}\b/);
        const ticker = tickerMatch ? tickerMatch[0] : undefined;
        
        // Extract timeframe
        let timeframe: 'immediate' | 'short-term' | 'long-term' = 'short-term';
        if (lowerLine.includes('immediate') || lowerLine.includes('now')) timeframe = 'immediate';
        else if (lowerLine.includes('long-term') || lowerLine.includes('long term')) timeframe = 'long-term';

        // Estimate confidence based on language
        let confidence = 0.7; // default
        if (lowerLine.includes('strong') || lowerLine.includes('high')) confidence = 0.9;
        else if (lowerLine.includes('moderate') || lowerLine.includes('medium')) confidence = 0.7;
        else if (lowerLine.includes('weak') || lowerLine.includes('low')) confidence = 0.5;

        recommendations.push({
          ticker,
          reason: line.trim(),
          confidence,
          timeframe
        });
      }
    }

    return recommendations;
  },

  /**
   * Extract dividend insights from AI response
   */
  extractDividendInsights(response: string) {
    // Extract next dividend opportunities
    const opportunities: Array<{
      ticker: string;
      exDate: string;
      amount: number;
      recommendation: string;
    }> = [];

    // Extract income projection
    const incomeProjection = {
      nextMonth: 0,
      nextQuarter: 0,
      nextYear: 0
    };

    return {
      nextDividendOpportunities: opportunities,
      dividendReliabilityAssessment: 'Based on current analysis, dividend reliability appears stable.',
      incomeProjection
    };
  },

  /**
   * Extract risk assessment from AI response
   */
  extractRiskAssessment(response: string) {
    const lowerResponse = response.toLowerCase();
    
    // Determine overall risk
    let overallRisk: 'low' | 'medium' | 'high' = 'medium';
    if (lowerResponse.includes('low risk') || lowerResponse.includes('conservative')) overallRisk = 'low';
    else if (lowerResponse.includes('high risk') || lowerResponse.includes('aggressive')) overallRisk = 'high';

    // Determine dividend cut risk
    let dividendCutRisk: 'low' | 'medium' | 'high' = 'medium';
    if (lowerResponse.includes('dividend cut') || lowerResponse.includes('sustainability concern')) dividendCutRisk = 'high';
    else if (lowerResponse.includes('stable dividend') || lowerResponse.includes('reliable')) dividendCutRisk = 'low';

    return {
      overallRisk,
      dividendCutRisk,
      concentrationRisk: 'medium' as const,
      marketRisk: 'medium' as const,
      recommendations: ['Monitor dividend sustainability', 'Diversify across sectors']
    };
  }
}; 