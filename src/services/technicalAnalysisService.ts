import { financialService } from './financialService';

export interface TechnicalIndicator {
  name: string;
  value: number;
  signal: 'buy' | 'sell' | 'neutral';
  strength: number; // 0-100
  description: string;
}

export interface TechnicalAnalysis {
  symbol: string;
  currentPrice: number;
  indicators: TechnicalIndicator[];
  overallSignal: 'buy' | 'sell' | 'neutral';
  confidence: number;
  buySignals: number;
  sellSignals: number;
  neutralSignals: number;
  positionSizing: {
    recommendedAllocation: number; // percentage of portfolio
    maxPositionSize: number; // percentage of portfolio
    riskLevel: 'low' | 'medium' | 'high';
    stopLoss: number;
    targetPrice: number;
  };
  lastUpdated: Date;
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

class TechnicalAnalysisService {
  /**
   * Calculate Simple Moving Average
   */
  calculateSMA(prices: number[], period: number): number[] {
    const sma: number[] = [];
    
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        sma.push(NaN);
      } else {
        const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
      }
    }
    
    return sma;
  }

  /**
   * Calculate Stochastic Oscillator
   */
  calculateStochastic(data: HistoricalDataPoint[], period: number = 14): { k: number[], d: number[] } {
    const k: number[] = [];
    const d: number[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      const highestHigh = Math.max(...slice.map(d => d.high));
      const lowestLow = Math.min(...slice.map(d => d.low));
      const currentClose = data[i].close;
      
      const kValue = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
      k.push(kValue);
      
      // Calculate %D (3-period SMA of %K)
      if (k.length >= 3) {
        const dValue = k.slice(-3).reduce((a, b) => a + b, 0) / 3;
        d.push(dValue);
      } else {
        d.push(NaN);
      }
    }
    
    return { k, d };
  }

  /**
   * Calculate Relative Strength Index (RSI)
   */
  calculateRSI(prices: number[], period: number = 14): number[] {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];
    
    // Calculate price changes
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    // Calculate RSI
    for (let i = period; i < gains.length; i++) {
      const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      
      const rs = avgGain / avgLoss;
      const rsiValue = 100 - (100 / (1 + rs));
      rsi.push(rsiValue);
    }
    
    return rsi;
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): {
    macd: number[];
    signal: number[];
    histogram: number[];
  } {
    const ema12 = this.calculateEMA(prices, fastPeriod);
    const ema26 = this.calculateEMA(prices, slowPeriod);
    
    const macd: number[] = [];
    for (let i = 0; i < prices.length; i++) {
      if (!isNaN(ema12[i]) && !isNaN(ema26[i])) {
        macd.push(ema12[i] - ema26[i]);
      } else {
        macd.push(NaN);
      }
    }
    
    const signal = this.calculateEMA(macd.filter(x => !isNaN(x)), signalPeriod);
    const histogram: number[] = [];
    
    for (let i = 0; i < macd.length; i++) {
      if (!isNaN(macd[i]) && !isNaN(signal[i])) {
        histogram.push(macd[i] - signal[i]);
      } else {
        histogram.push(NaN);
      }
    }
    
    return { macd, signal, histogram };
  }

  /**
   * Calculate Exponential Moving Average
   */
  calculateEMA(prices: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    for (let i = 0; i < prices.length; i++) {
      if (i === 0) {
        ema.push(prices[i]);
      } else {
        const emaValue = (prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
        ema.push(emaValue);
      }
    }
    
    return ema;
  }

  /**
   * Calculate Bollinger Bands
   */
  calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): {
    upper: number[];
    middle: number[];
    lower: number[];
  } {
    const sma = this.calculateSMA(prices, period);
    const upper: number[] = [];
    const middle: number[] = [];
    const lower: number[] = [];
    
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        upper.push(NaN);
        middle.push(NaN);
        lower.push(NaN);
      } else {
        const slice = prices.slice(i - period + 1, i + 1);
        const mean = sma[i];
        const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
        const standardDeviation = Math.sqrt(variance);
        
        middle.push(mean);
        upper.push(mean + (standardDeviation * stdDev));
        lower.push(mean - (standardDeviation * stdDev));
      }
    }
    
    return { upper, middle, lower };
  }

  /**
   * Generate buy/sell signals based on technical indicators
   */
  generateSignals(data: HistoricalDataPoint[]): TechnicalIndicator[] {
    const prices = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const volumes = data.map(d => d.volume);
    
    const indicators: TechnicalIndicator[] = [];
    
    // SMA-50 and SMA-200
    const sma50 = this.calculateSMA(prices, 50);
    const sma200 = this.calculateSMA(prices, 200);
    
    if (sma50.length > 0 && sma200.length > 0) {
      const currentPrice = prices[prices.length - 1];
      const currentSMA50 = sma50[sma50.length - 1];
      const currentSMA200 = sma200[sma200.length - 1];
      
      // SMA-50 signal
      if (!isNaN(currentSMA50)) {
        const sma50Signal = currentPrice > currentSMA50 ? 'buy' : 'sell';
        const sma50Strength = Math.abs((currentPrice - currentSMA50) / currentSMA50) * 100;
        indicators.push({
          name: '50-Day SMA',
          value: currentSMA50,
          signal: sma50Signal,
          strength: Math.min(sma50Strength * 10, 100),
          description: currentPrice > currentSMA50 ? 'Price above SMA-50' : 'Price below SMA-50'
        });
      }
      
      // SMA-200 signal
      if (!isNaN(currentSMA200)) {
        const sma200Signal = currentPrice > currentSMA200 ? 'buy' : 'sell';
        const sma200Strength = Math.abs((currentPrice - currentSMA200) / currentSMA200) * 100;
        indicators.push({
          name: '200-Day SMA',
          value: currentSMA200,
          signal: sma200Signal,
          strength: Math.min(sma200Strength * 10, 100),
          description: currentPrice > currentSMA200 ? 'Price above SMA-200' : 'Price below SMA-200'
        });
      }
    }
    
    // Stochastic Oscillator
    const stochastic = this.calculateStochastic(data);
    if (stochastic.k.length > 0) {
      const currentK = stochastic.k[stochastic.k.length - 1];
      const currentD = stochastic.d[stochastic.d.length - 1];
      
      if (!isNaN(currentK)) {
        let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
        let strength = 50;
        
        if (currentK < 20) {
          signal = 'buy';
          strength = 80 + (20 - currentK) * 2;
        } else if (currentK > 80) {
          signal = 'sell';
          strength = 80 + (currentK - 80) * 2;
        }
        
        indicators.push({
          name: 'Stochastic Oscillator',
          value: currentK,
          signal,
          strength: Math.min(strength, 100),
          description: currentK < 20 ? 'Oversold' : currentK > 80 ? 'Overbought' : 'Neutral'
        });
      }
    }
    
    // RSI
    const rsi = this.calculateRSI(prices);
    if (rsi.length > 0) {
      const currentRSI = rsi[rsi.length - 1];
      
      if (!isNaN(currentRSI)) {
        let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
        let strength = 50;
        
        if (currentRSI < 30) {
          signal = 'buy';
          strength = 80 + (30 - currentRSI) * 2;
        } else if (currentRSI > 70) {
          signal = 'sell';
          strength = 80 + (currentRSI - 70) * 2;
        }
        
        indicators.push({
          name: 'RSI (14)',
          value: currentRSI,
          signal,
          strength: Math.min(strength, 100),
          description: currentRSI < 30 ? 'Oversold' : currentRSI > 70 ? 'Overbought' : 'Neutral'
        });
      }
    }
    
    // MACD
    const macd = this.calculateMACD(prices);
    if (macd.macd.length > 0 && macd.signal.length > 0) {
      const currentMACD = macd.macd[macd.macd.length - 1];
      const currentSignal = macd.signal[macd.signal.length - 1];
      const currentHistogram = macd.histogram[macd.histogram.length - 1];
      
      if (!isNaN(currentMACD) && !isNaN(currentSignal)) {
        let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
        let strength = 50;
        
        if (currentMACD > currentSignal && currentHistogram > 0) {
          signal = 'buy';
          strength = 70 + Math.abs(currentHistogram) * 10;
        } else if (currentMACD < currentSignal && currentHistogram < 0) {
          signal = 'sell';
          strength = 70 + Math.abs(currentHistogram) * 10;
        }
        
        indicators.push({
          name: 'MACD',
          value: currentMACD,
          signal,
          strength: Math.min(strength, 100),
          description: currentMACD > currentSignal ? 'Bullish Crossover' : 'Bearish Crossover'
        });
      }
    }
    
    // Volume analysis
    if (volumes.length >= 20) {
      const recentVolume = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
      const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
      const volumeRatio = recentVolume / avgVolume;
      
      let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
      let strength = 50;
      
      if (volumeRatio > 1.5) {
        signal = 'buy';
        strength = 60 + (volumeRatio - 1.5) * 20;
      } else if (volumeRatio < 0.5) {
        signal = 'sell';
        strength = 60 + (0.5 - volumeRatio) * 20;
      }
      
      indicators.push({
        name: 'Volume',
        value: volumeRatio,
        signal,
        strength: Math.min(strength, 100),
        description: volumeRatio > 1.5 ? 'Above Average' : volumeRatio < 0.5 ? 'Below Average' : 'Average'
      });
    }
    
    return indicators;
  }

  /**
   * Calculate position sizing recommendations
   */
  calculatePositionSizing(
    indicators: TechnicalIndicator[],
    currentPrice: number,
    portfolioValue: number = 100000
  ): TechnicalAnalysis['positionSizing'] {
    const buySignals = indicators.filter(i => i.signal === 'buy').length;
    const sellSignals = indicators.filter(i => i.signal === 'sell').length;
    const totalSignals = indicators.length;
    
    // Calculate confidence based on signal strength
    const avgBuyStrength = indicators
      .filter(i => i.signal === 'buy')
      .reduce((sum, i) => sum + i.strength, 0) / Math.max(buySignals, 1);
    
    const avgSellStrength = indicators
      .filter(i => i.signal === 'sell')
      .reduce((sum, i) => sum + i.strength, 0) / Math.max(sellSignals, 1);
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    if (buySignals > sellSignals && avgBuyStrength > 70) {
      riskLevel = 'low';
    } else if (sellSignals > buySignals && avgSellStrength > 70) {
      riskLevel = 'high';
    }
    
    // Calculate recommended allocation (1-10% of portfolio)
    const signalRatio = buySignals / totalSignals;
    const baseAllocation = signalRatio * 10; // 0-10%
    const strengthMultiplier = avgBuyStrength / 100;
    const recommendedAllocation = Math.min(baseAllocation * strengthMultiplier, 10);
    
    // Calculate stop loss and target price
    const volatility = 0.15; // Assume 15% volatility
    const stopLoss = currentPrice * (1 - volatility);
    const targetPrice = currentPrice * (1 + volatility * 2); // 2:1 risk-reward ratio
    
    return {
      recommendedAllocation,
      maxPositionSize: Math.min(recommendedAllocation * 1.5, 15), // Max 15% of portfolio
      riskLevel,
      stopLoss,
      targetPrice
    };
  }

  /**
   * Get comprehensive technical analysis for a symbol
   */
  async getTechnicalAnalysis(symbol: string): Promise<TechnicalAnalysis> {
    try {
      console.log(`Starting technical analysis for ${symbol}`);
      
      // Fetch historical data (last 200 days for SMA-200)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 250); // Extra days for calculations
      
      console.log(`Fetching historical data for ${symbol} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      const historicalData = await financialService.getHistoricalData(symbol, startDate, endDate);
      
      console.log(`Received ${historicalData.length} data points for ${symbol}`);
      
      if (!historicalData || historicalData.length === 0) {
        throw new Error('No historical data available');
      }
      
      // Convert to our format
      const data: HistoricalDataPoint[] = historicalData.map(quote => ({
        date: typeof quote.date === 'string' ? quote.date : quote.date.toISOString(),
        open: quote.open,
        high: quote.high,
        low: quote.low,
        close: quote.close,
        volume: quote.volume
      }));
      
      const currentPrice = data[data.length - 1].close;
      console.log(`Current price for ${symbol}: $${currentPrice}`);
      
      const indicators = this.generateSignals(data);
      console.log(`Generated ${indicators.length} indicators for ${symbol}`);
      
      // Calculate overall signal
      const buySignals = indicators.filter(i => i.signal === 'buy').length;
      const sellSignals = indicators.filter(i => i.signal === 'sell').length;
      const neutralSignals = indicators.filter(i => i.signal === 'neutral').length;
      
      let overallSignal: 'buy' | 'sell' | 'neutral' = 'neutral';
      if (buySignals > sellSignals && buySignals > neutralSignals) {
        overallSignal = 'buy';
      } else if (sellSignals > buySignals && sellSignals > neutralSignals) {
        overallSignal = 'sell';
      }
      
      // Calculate confidence
      const totalStrength = indicators.reduce((sum, i) => sum + i.strength, 0);
      const confidence = totalStrength / indicators.length;
      
      // Calculate position sizing
      const positionSizing = this.calculatePositionSizing(indicators, currentPrice);
      
      console.log(`Technical analysis complete for ${symbol}: ${overallSignal} signal with ${confidence.toFixed(1)}% confidence`);
      
      return {
        symbol,
        currentPrice,
        indicators,
        overallSignal,
        confidence,
        buySignals,
        sellSignals,
        neutralSignals,
        positionSizing,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error(`Error getting technical analysis for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Batch analyze multiple symbols efficiently
   */
  async batchAnalyzeSymbols(symbols: string[]): Promise<TechnicalAnalysis[]> {
    console.log(`Starting batch analysis of ${symbols.length} symbols`);
    
    const analyses: TechnicalAnalysis[] = [];
    const errors: string[] = [];
    
    // Process symbols in parallel with a reasonable concurrency limit
    const concurrencyLimit = 3; // Limit concurrent API calls to avoid rate limiting
    const batches = [];
    
    for (let i = 0; i < symbols.length; i += concurrencyLimit) {
      batches.push(symbols.slice(i, i + concurrencyLimit));
    }
    
    console.log(`Processing ${symbols.length} symbols in ${batches.length} batches of ${concurrencyLimit}`);
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`Processing batch ${batchIndex + 1}/${batches.length}: ${batch.join(', ')}`);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (symbol) => {
        try {
          return await this.getTechnicalAnalysis(symbol);
        } catch (error) {
          const errorMsg = `Error analyzing ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      analyses.push(...batchResults.filter((result): result is TechnicalAnalysis => result !== null));
      
      // Small delay between batches to be respectful to external APIs
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`Batch analysis complete. Successfully analyzed ${analyses.length} symbols. ${errors.length} symbols failed.`);
    
    if (errors.length > 0) {
      console.warn('Failed symbols:', errors);
    }
    
    return analyses;
  }

  /**
   * Get top buy/sell opportunities across multiple symbols (optimized)
   */
  async getTopOpportunities(symbols: string[], type: 'buy' | 'sell' = 'buy', limit: number = 5): Promise<TechnicalAnalysis[]> {
    console.log(`Starting optimized analysis of ${symbols.length} symbols for ${type} opportunities`);
    
    // Use batch analysis for better performance
    const allAnalyses = await this.batchAnalyzeSymbols(symbols);
    
    // Filter by signal type
    const filteredAnalyses = allAnalyses.filter(analysis => analysis.overallSignal === type);
    
    console.log(`Found ${filteredAnalyses.length} ${type} opportunities out of ${allAnalyses.length} total analyses`);
    
    // Sort by confidence and return top results
    return filteredAnalyses
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }
}

export const technicalAnalysisService = new TechnicalAnalysisService(); 