import { Portfolio, PortfolioSecurity } from './portfolioService';
import { supabase } from '@/lib/supabase';

export interface DividendMetrics {
  totalAnnualDividend: number;
  totalMonthlyDividend: number;
  portfolioYield: number;
  weightedAverageYield: number;
  securityDividends: {
    [securityId: string]: {
      annualDividend: number;
      monthlyDividend: number;
      yield: number;
      contributionToPortfolioYield: number;
      projectedAnnualDividend?: number;
      projectedMonthlyDividend?: number;
      projectedYield?: number;
      nextExDate?: string;
      nextPaymentDate?: string;
      growthRate?: number;
      payoutRatio?: number;
      fiveYearAvgYield?: number;
    };
  };
}

export interface ProjectedDividendMetrics {
  projectedAnnualDividend: number;
  projectedMonthlyDividend: number;
  projectedPortfolioYield: number;
  projectedSecurityDividends: {
    [securityId: string]: {
      projectedAnnualDividend: number;
      projectedMonthlyDividend: number;
      projectedYield: number;
      growthRate: number;
    };
  };
}

export const dividendService = {
  calculateDividendMetrics(portfolio: Portfolio): DividendMetrics {
    const securityDividends: DividendMetrics['securityDividends'] = {};
    let totalAnnualDividend = 0;
    let totalPortfolioValue = 0;
    let weightedYieldSum = 0;

    // Calculate individual security dividend metrics
    portfolio.securities.forEach((security) => {
      const marketValue = security.shares * security.security.price;
      const annualDividend = marketValue * (security.security.yield / 100);
      const monthlyDividend = annualDividend / 12;
      const contributionToPortfolioYield = (annualDividend / marketValue) * 100;

      // Calculate projected dividends based on historical growth rate
      const growthRate = security.security.dividend_growth_5yr || 0;
      const projectedAnnualDividend = annualDividend * (1 + growthRate / 100);
      const projectedMonthlyDividend = projectedAnnualDividend / 12;
      const projectedYield = (projectedAnnualDividend / marketValue) * 100;

      securityDividends[security.security.id] = {
        annualDividend,
        monthlyDividend,
        yield: security.security.yield,
        contributionToPortfolioYield,
        projectedAnnualDividend,
        projectedMonthlyDividend,
        projectedYield,
      };

      totalAnnualDividend += annualDividend;
      totalPortfolioValue += marketValue;
      weightedYieldSum += security.security.yield * (marketValue / totalPortfolioValue);
    });

    return {
      totalAnnualDividend,
      totalMonthlyDividend: totalAnnualDividend / 12,
      portfolioYield: totalPortfolioValue > 0 ? (totalAnnualDividend / totalPortfolioValue) * 100 : 0,
      weightedAverageYield: weightedYieldSum,
      securityDividends,
    };
  },

  calculateProjectedDividends(portfolio: Portfolio): ProjectedDividendMetrics {
    const projectedSecurityDividends: ProjectedDividendMetrics['projectedSecurityDividends'] = {};
    let projectedTotalAnnualDividend = 0;
    let totalPortfolioValue = 0;

    portfolio.securities.forEach((security) => {
      const marketValue = security.shares * security.security.price;
      const currentAnnualDividend = marketValue * (security.security.yield / 100);
      const growthRate = security.security.dividend_growth_5yr || 0;
      
      const projectedAnnualDividend = currentAnnualDividend * (1 + growthRate / 100);
      const projectedMonthlyDividend = projectedAnnualDividend / 12;
      const projectedYield = (projectedAnnualDividend / marketValue) * 100;

      projectedSecurityDividends[security.security.id] = {
        projectedAnnualDividend,
        projectedMonthlyDividend,
        projectedYield,
        growthRate,
      };

      projectedTotalAnnualDividend += projectedAnnualDividend;
      totalPortfolioValue += marketValue;
    });

    return {
      projectedAnnualDividend: projectedTotalAnnualDividend,
      projectedMonthlyDividend: projectedTotalAnnualDividend / 12,
      projectedPortfolioYield: totalPortfolioValue > 0 ? (projectedTotalAnnualDividend / totalPortfolioValue) * 100 : 0,
      projectedSecurityDividends,
    };
  },

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  },

  formatPercentage(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  },

  async getUpcomingDividends(portfolio: Portfolio) {
    // Filter out 'Cash' securities
    const filteredSecurities = portfolio.securities.filter(s => s.security.ticker !== 'CASH');
    const filteredPortfolio = { ...portfolio, securities: filteredSecurities };
    const today = new Date();
    const { data: dividends, error } = await supabase
      .from('dividends')
      .select('*')
      .in('security_id', filteredPortfolio.securities.map(s => s.security.id))
      .gte('ex_date', today.toISOString())
      .order('ex_date', { ascending: true });

    if (error) {
      console.error('Error fetching upcoming dividends:', error);
      return [];
    }

    return dividends;
  },

  async getNextDividendDates(securityId: string) {
    const today = new Date();
    const { data: dividends, error } = await supabase
      .from('dividends')
      .select('*')
      .eq('security_id', securityId)
      .gte('ex_date', today.toISOString())
      .order('ex_date', { ascending: true })
      .limit(1);

    if (error) {
      console.error('Error fetching next dividend dates:', error);
      return null;
    }

    return dividends?.[0] || null;
  },

  async updateDividendDates(securityId: string, exDate: string, paymentDate: string) {
    const { error } = await supabase
      .from('dividends')
      .upsert({
        security_id: securityId,
        ex_date: exDate,
        payment_date: paymentDate,
        amount: 0, // This will be updated when the dividend amount is known
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error updating dividend dates:', error);
      throw error;
    }
  },

  async fetchDividendData(ticker: string) {
    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error(`Session error: ${sessionError.message}`);
      }
      
      if (!session) {
        throw new Error('No active session - user not authenticated');
      }

      if (!session.access_token) {
        throw new Error('No access token in session');
      }

      console.log(`Making API request for ${ticker} with token:`, session.access_token.substring(0, 10) + '...');

      const response = await fetch(`/api/dividends?ticker=${ticker}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      console.log(`API response for ${ticker}:`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`API error for ${ticker}:`, errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate that we got the expected data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from dividend API');
      }

      // Validate and sanitize the ex-dividend date
      if (data.exDividendDate) {
        try {
          const exDate = new Date(data.exDividendDate);
          if (isNaN(exDate.getTime()) || exDate.getFullYear() < 1900 || exDate.getFullYear() > 2100) {
            console.warn(`Invalid ex-dividend date for ${ticker}: ${data.exDividendDate}, setting to null`);
            data.exDividendDate = null;
          } else {
            // Convert to ISO date string (YYYY-MM-DD)
            data.exDividendDate = exDate.toISOString().split('T')[0];
          }
        } catch (error) {
          console.warn(`Error parsing ex-dividend date for ${ticker}: ${data.exDividendDate}, setting to null`);
          data.exDividendDate = null;
        }
      }

      console.log(`Successfully fetched data for ${ticker}:`, {
        currentDividend: data.currentDividend,
        yield: data.yield,
        hasExDate: !!data.exDividendDate,
        exDate: data.exDividendDate
      });

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error fetching dividend data for ${ticker}:`, {
        message: errorMessage,
        type: error instanceof Error ? 'Error' : typeof error,
        ticker
      });
      throw error;
    }
  },

  async updateSecurityDividendData(securityId: string, ticker: string) {
    try {
      const dividendData = await this.fetchDividendData(ticker);
      
      // Update the security's dividend information in the database
      const { error } = await supabase
        .from('securities')
        .update({
          dividend: dividendData.currentDividend,
          yield: dividendData.yield,
          ex_dividend_date: dividendData.exDividendDate,
          payout_ratio: dividendData.payoutRatio,
          dividend_growth_5yr: dividendData.growthRate,
          five_year_avg_yield: dividendData.fiveYearAvgYield,
          updated_at: new Date().toISOString()
        })
        .eq('id', securityId);

      if (error) {
        throw error;
      }

      return dividendData;
    } catch (error) {
      console.error('Error updating security dividend data:', error);
      throw error;
    }
  },

  async updatePortfolioDividendData(portfolio: Portfolio, forceRefresh: boolean = false) {
    const results = {
      successful: [] as string[],
      failed: [] as Array<{ ticker: string; error: string }>,
      totalDividendRecords: 0,
      upsertError: null as null | { message: string; details?: any; data?: any }
    };

    try {
      const allDividendData: Array<{
        security_id: string;
        amount: number;
        ex_date: string;
        payment_date: string;
      }> = [];

      console.log(`Starting dividend data update for portfolio with ${portfolio.securities.length} securities`);

      // Filter securities that need refreshing based on smart cache strategy
      const securitiesToUpdate = portfolio.securities.filter(security => 
        this.shouldRefreshDividendData(security.security, forceRefresh)
      );

      console.log(`Smart cache strategy: ${securitiesToUpdate.length}/${portfolio.securities.length} securities need updating`);

      // Process each security that needs updating
      for (const security of securitiesToUpdate) {
        try {
          console.log(`Processing security: ${security.security.ticker} (ID: ${security.security.id})`);
          
          // Add a small delay between requests to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const dividendData = await this.fetchDividendData(security.security.ticker);
          
          console.log(`Fetched dividend data for ${security.security.ticker}:`, {
            currentDividend: dividendData.currentDividend,
            yield: dividendData.yield,
            exDividendDate: dividendData.exDividendDate,
            payoutRatio: dividendData.payoutRatio,
            growthRate: dividendData.growthRate,
            fiveYearAvgYield: dividendData.fiveYearAvgYield
          });

          // Update the security's dividend information in the database
          const { error: updateError } = await supabase
            .from('securities')
            .update({
              dividend: dividendData.currentDividend,
              yield: dividendData.yield,
              ex_dividend_date: dividendData.exDividendDate,
              payout_ratio: dividendData.payoutRatio,
              dividend_growth_5yr: dividendData.growthRate,
              five_year_avg_yield: dividendData.fiveYearAvgYield,
              updated_at: new Date().toISOString()
            })
            .eq('id', security.security.id);

          if (updateError) {
            throw updateError;
          }

          results.successful.push(security.security.ticker);

          // Generate future dividend dates if we have ex-dividend date and dividend rate
          if (dividendData.exDividendDate && dividendData.currentDividend > 0) {
            console.log(`Generating future dividends for ${security.security.ticker} with ex-date: ${dividendData.exDividendDate}`);
            const futureDividends = this.generateFutureDividendDates(
              security.security.id,
              dividendData.exDividendDate,
              dividendData.currentDividend
            );
            console.log(`Generated ${futureDividends.length} future dividend dates for ${security.security.ticker}`);
            allDividendData.push(...futureDividends);
          } else {
            console.log(`Skipping future dividend generation for ${security.security.ticker} - no ex-date or dividend rate`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Error processing security ${security.security.ticker}:`, {
            message: errorMessage,
            type: error instanceof Error ? 'Error' : typeof error,
            ticker: security.security.ticker,
            error: error
          });
          
          // Log detailed error information for any problematic ticker
          console.error(`Detailed error for ${security.security.ticker}:`, {
            error,
            stack: error instanceof Error ? error.stack : undefined,
            message: errorMessage,
            securityId: security.security.id
          });
          
          results.failed.push({
            ticker: security.security.ticker,
            error: errorMessage
          });
          continue; // Continue with next security
        }
      }

      console.log(`Total dividend data to insert: ${allDividendData.length} records`);
      results.totalDividendRecords = allDividendData.length;

      // Insert all dividend data into the database
      if (allDividendData.length > 0) {
        console.log('Inserting dividend data into database...');
        console.log('Dividend data to upsert:', allDividendData);
        
        // Use a batch insert approach to handle potential conflicts
        const { error: insertError, data: insertData } = await supabase
          .from('dividends')
          .upsert(allDividendData, {
            onConflict: 'security_id,ex_date',
            ignoreDuplicates: false
          });

        if (insertError) {
          console.error('Error inserting dividend data:', {
            error: insertError,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
            code: insertError.code,
            data: allDividendData
          });
          // Surface the error in the results object for UI display
          results.upsertError = {
            message: insertError.message || insertError.details || 'Unknown database error',
            details: insertError,
            data: allDividendData
          };
          // Don't throw here - we want to return partial results
          console.warn('Failed to insert dividend data, but continuing with partial results');
        } else {
          console.log('Successfully inserted dividend data into database:', insertData);
        }
      } else {
        console.log('No dividend data to insert');
      }

      console.log('Calculating dividend metrics...');
      const metrics = this.calculateDividendMetrics(portfolio);
      
      // Log summary
      console.log('Dividend update summary:', {
        successful: results.successful.length,
        failed: results.failed.length,
        totalDividendRecords: results.totalDividendRecords,
        successfulTickers: results.successful,
        failedTickers: results.failed.map(f => f.ticker),
        upsertError: results.upsertError
      });

      return {
        metrics,
        results
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error updating portfolio dividend data:', {
        message: errorMessage,
        type: error instanceof Error ? 'Error' : typeof error,
        error: error
      });
      
      // Create a more descriptive error message
      const descriptiveError = new Error(`Failed to update portfolio dividend data: ${errorMessage}`);
      throw descriptiveError;
    }
  },

  generateFutureDividendDates(
    securityId: string,
    baseExDate: string,
    annualDividendRate: number,
    monthsAhead: number = 12
  ): Array<{
    security_id: string;
    amount: number;
    ex_date: string;
    payment_date: string;
  }> {
    const dividendData: Array<{
      security_id: string;
      amount: number;
      ex_date: string;
      payment_date: string;
    }> = [];
    
    const baseDate = new Date(baseExDate);
    
    // Most dividend-paying stocks pay quarterly (every 3 months)
    // Some pay monthly, semi-annually, or annually
    // We'll assume quarterly for now, but this could be enhanced with actual frequency data
    
    for (let i = 0; i < monthsAhead; i += 3) {
      const exDate = new Date(baseDate);
      exDate.setMonth(exDate.getMonth() + i);
      
      // Skip if the date is in the past
      if (exDate <= new Date()) {
        continue;
      }
      
      const paymentDate = new Date(exDate);
      paymentDate.setDate(paymentDate.getDate() + 21); // 21 days after ex-date
      
      dividendData.push({
        security_id: securityId,
        amount: annualDividendRate / 4, // Quarterly dividend (annual rate / 4)
        ex_date: exDate.toISOString().split('T')[0],
        payment_date: paymentDate.toISOString().split('T')[0]
      });
    }
    
    return dividendData;
  },

  async retryFailedSecurities(failedSecurities: Array<{ ticker: string; error: string }>) {
    const results = {
      successful: [] as string[],
      failed: [] as Array<{ ticker: string; error: string }>,
      totalDividendRecords: 0
    };

    console.log(`Retrying ${failedSecurities.length} failed securities...`);

    for (const failed of failedSecurities) {
      try {
        console.log(`Retrying ${failed.ticker}...`);
        
        // Add a longer delay for retries
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const dividendData = await this.fetchDividendData(failed.ticker);
        
        console.log(`Retry successful for ${failed.ticker}:`, {
          currentDividend: dividendData.currentDividend,
          yield: dividendData.yield,
          exDividendDate: dividendData.exDividendDate
        });
        
        results.successful.push(failed.ticker);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Retry failed for ${failed.ticker}:`, errorMessage);
        results.failed.push({
          ticker: failed.ticker,
          error: errorMessage
        });
      }
    }

    return results;
  },

  /**
   * Smart cache strategy for dividend data updates
   * Determines when to refresh vs use cache based on multiple factors
   */
  shouldRefreshDividendData(security: any, forceRefresh: boolean = false): boolean {
    if (forceRefresh) return true;

    const now = new Date();
    const lastFetched = security.last_fetched ? new Date(security.last_fetched) : null;
    
    // If never fetched, always refresh
    if (!lastFetched) return true;

    const timeSinceLastFetch = now.getTime() - lastFetched.getTime();
    const fiveMinutes = 5 * 60 * 1000;
    const oneHour = 60 * 60 * 1000;

    // Check if within 5 minutes (use cache)
    if (timeSinceLastFetch < fiveMinutes) {
      return false;
    }

    // Check if it's market hours (9:30 AM - 4:00 PM ET)
    const isMarketHours = this.isMarketHours(now);
    
    // Check if approaching ex-dividend date (within 2 weeks)
    const isApproachingExDate = this.isApproachingExDividendDate(security);

    // Refresh if:
    // 1. More than 1 hour old during market hours
    // 2. Approaching ex-dividend date
    // 3. More than 24 hours old regardless
    return (
      (isMarketHours && timeSinceLastFetch > oneHour) ||
      isApproachingExDate ||
      timeSinceLastFetch > 24 * 60 * 60 * 1000
    );
  },

  /**
   * Check if current time is during market hours (9:30 AM - 4:00 PM ET)
   */
  isMarketHours(date: Date): boolean {
    // Convert to Eastern Time
    const easternTime = new Date(date.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const hours = easternTime.getHours();
    const minutes = easternTime.getMinutes();
    const timeInMinutes = hours * 60 + minutes;
    
    // Market hours: 9:30 AM (570 minutes) to 4:00 PM (960 minutes)
    return timeInMinutes >= 570 && timeInMinutes <= 960;
  },

  /**
   * Check if security is approaching its ex-dividend date (within 2 weeks)
   */
  isApproachingExDividendDate(security: any): boolean {
    if (!security.ex_dividend_date) return false;
    
    const exDate = new Date(security.ex_dividend_date);
    const now = new Date();
    const twoWeeks = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds
    
    return exDate.getTime() - now.getTime() <= twoWeeks;
  },
}; 