"use client"

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Clock, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { Portfolio } from '@/services/portfolioService';
import { dividendService } from '@/src/services/dividendService';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import React from 'react';

interface DividendEvent {
  date: string;
  ticker: string;
  amount: number;
  type: 'ex-date' | 'payment';
  shares: number;
  totalAmount: number;
}

interface DividendCalendarProps {
  portfolio: Portfolio;
}

// Error Boundary for the calendar
class CalendarErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('DividendCalendar error boundary caught:', error, errorInfo);
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Calendar className="h-5 w-5" />
              Dividend Calendar Error
            </CardTitle>
            <CardDescription>An error occurred while rendering the dividend calendar.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-destructive">{this.state.error?.message || 'Unknown error'}</div>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}

export function DividendCalendar({ portfolio }: DividendCalendarProps) {
  const [dividendEvents, setDividendEvents] = useState<DividendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failedSecurities, setFailedSecurities] = useState<Array<{ ticker: string; error: string }>>([]);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const loadDividendEvents = useCallback(async () => {
    try {
      setLoading(true);
      // Filter out 'Cash' securities before processing
      const filteredPortfolio = {
        ...portfolio,
        securities: portfolio.securities.filter(s => s.security.ticker !== 'CASH'),
      };
      const dividends = await dividendService.getUpcomingDividends(filteredPortfolio);
      
      const events: DividendEvent[] = [];
      
      for (const dividend of dividends) {
        const security = filteredPortfolio.securities.find(s => s.security.id === dividend.security_id);
        if (security) {
          const totalAmount = security.shares * dividend.amount;
          
          // Add ex-date event
          events.push({
            date: dividend.ex_date,
            ticker: security.security.ticker,
            amount: dividend.amount,
            type: 'ex-date',
            shares: security.shares,
            totalAmount
          });
          
          // Add payment event
          events.push({
            date: dividend.payment_date,
            ticker: security.security.ticker,
            amount: dividend.amount,
            type: 'payment',
            shares: security.shares,
            totalAmount
          });
        }
      }
      
      // Sort by date
      events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setDividendEvents(events);
    } catch (error) {
      // Defensive error handling
      console.error('Error loading dividend events:', error);
      setDividendEvents([]); // Ensure state is always set
    } finally {
      setLoading(false);
    }
  }, [portfolio]);

  const populateDividendData = async (forceRefresh: boolean = false) => {
    try {
      setRefreshing(true);
      toast.info(forceRefresh ? 'Force refreshing dividend data from Yahoo Finance...' : 'Fetching dividend data from Yahoo Finance...');
      
      // Call the dividend service to update portfolio dividend data
      const result = await dividendService.updatePortfolioDividendData(portfolio, forceRefresh);
      
      // Reload the dividend events
      await loadDividendEvents();
      
      // Show summary of results
      const { results: updateResults } = result;
      const successCount = updateResults.successful.length;
      const failureCount = updateResults.failed.length;
      const totalRecords = updateResults.totalDividendRecords;
      
      // Store failed securities for debugging
      setFailedSecurities(updateResults.failed);

      // Show upsert error if present
      if (updateResults.upsertError) {
        console.error('Dividends upsert error:', updateResults.upsertError);
        toast.error('Failed to insert dividend data into the database.', {
          description: updateResults.upsertError.message,
          duration: 12000
        });
      }

      // Show success/failure summary
      if (successCount > 0) {
        toast.success(`Updated ${successCount} securities successfully!`, {
          description: failureCount > 0 ? `${failureCount} securities failed to update` : undefined,
          duration: 5000
        });
      } else if (failureCount > 0) {
        toast.error(`Failed to update ${failureCount} securities`, {
          description: 'Check the debug button for details',
          duration: 8000
        });
      } else {
        toast.info('No securities needed updating (using cached data)', {
          description: forceRefresh ? 'Force refresh completed' : 'Smart cache strategy applied',
          duration: 3000
        });
      }

      console.log('Dividend update completed:', {
        successful: successCount,
        failed: failureCount,
        totalRecords,
        forceRefresh
      });
      
    } catch (error) {
      console.error('Error populating dividend data:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(
        'Failed to update dividend data. Please try again.',
        {
          description: errorMessage,
          duration: 8000
        }
      );
    } finally {
      setRefreshing(false);
    }
  };

  const debugFailedSecurities = async () => {
    if (failedSecurities.length === 0) {
      toast.info('No failed securities to debug');
      return;
    }

    try {
      toast.info(`Debugging ${failedSecurities.length} failed securities...`);
      
      // Use the retry method from the service
      const retryResults = await dividendService.retryFailedSecurities(failedSecurities);
      
      console.log('Retry results:', retryResults);
      
      if (retryResults.successful.length > 0) {
        toast.success(`Retry successful for ${retryResults.successful.length} securities!`);
        // Reload dividend events to show new data
        await loadDividendEvents();
      }
      
      if (retryResults.failed.length > 0) {
        const stillFailed = retryResults.failed.map(f => f.ticker).join(', ');
        toast.error(`Still failed: ${stillFailed}`);
        
        // Update the failed securities list
        setFailedSecurities(retryResults.failed);
      }
      
      // Also try direct API calls for detailed debugging
      for (const failed of failedSecurities) {
        console.log(`Direct API debug for ${failed.ticker}:`, failed.error);
        
        try {
          const response = await fetch(`/api/dividends?ticker=${failed.ticker}`, {
            headers: {
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            }
          });
          
          const data = await response.json();
          console.log(`Direct API result for ${failed.ticker}:`, {
            status: response.status,
            data: data
          });
          
        } catch (debugError) {
          console.error(`Direct API debug error for ${failed.ticker}:`, debugError);
        }
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
    } catch (error) {
      console.error('Error debugging failed securities:', error);
      toast.error('Error during debugging');
    }
  };

  useEffect(() => {
    loadDividendEvents();
  }, [loadDividendEvents]);

  // Initialize expanded months - only current month expanded by default
  useEffect(() => {
    if (dividendEvents.length > 0) {
      const today = new Date();
      const currentMonthKey = `${today.getFullYear()}-${today.getMonth()}`;
      setExpandedMonths(new Set([currentMonthKey]));
    }
  }, [dividendEvents]);

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey);
      } else {
        newSet.add(monthKey);
      }
      return newSet;
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    const eventDate = new Date(dateString);
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getEventColor = (type: 'ex-date' | 'payment') => {
    return type === 'ex-date' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  const getEventIcon = (type: 'ex-date' | 'payment') => {
    return type === 'ex-date' ? <Clock className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />;
  };

  return (
    <CalendarErrorBoundary>
      {/* Defensive: check for null/undefined dividendEvents and failedSecurities */}
      {loading ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Dividend Calendar
            </CardTitle>
            <CardDescription>Upcoming dividend events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading calendar...</p>
            </div>
          </CardContent>
        </Card>
      ) : (!dividendEvents || dividendEvents.length === 0) ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Dividend Calendar
                </CardTitle>
                <CardDescription>Upcoming dividend events</CardDescription>
              </div>
              <div className="flex gap-2">
                {failedSecurities.length > 0 && (
                  <Button 
                    onClick={debugFailedSecurities} 
                    size="sm"
                    variant="destructive"
                    title={`Debug ${failedSecurities.length} failed securities`}
                  >
                    Debug ({failedSecurities.length})
                  </Button>
                )}
                <Button 
                  onClick={() => populateDividendData(false)} 
                  disabled={refreshing}
                  size="sm"
                  variant="outline"
                >
                  {refreshing ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Smart Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No upcoming dividend events</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Click &quot;Fetch Dividends&quot; to populate calendar with data from Yahoo Finance
              </p>
              <div className="flex gap-2 justify-center">
                {failedSecurities.length > 0 && (
                  <Button 
                    onClick={debugFailedSecurities} 
                    disabled={refreshing}
                    variant="destructive"
                    size="sm"
                  >
                    Debug ({failedSecurities.length})
                  </Button>
                )}
                <Button 
                  onClick={() => populateDividendData(false)} 
                  disabled={refreshing}
                  className="flex-1"
                >
                  {refreshing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Fetching Dividend Data...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Smart Refresh
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Dividend Calendar
                </CardTitle>
                <CardDescription>Upcoming dividend events and payments</CardDescription>
              </div>
              <div className="flex gap-2">
                {failedSecurities.length > 0 && (
                  <Button 
                    onClick={debugFailedSecurities} 
                    size="sm"
                    variant="destructive"
                    title={`Debug ${failedSecurities.length} failed securities`}
                  >
                    Debug ({failedSecurities.length})
                  </Button>
                )}
                <Button 
                  onClick={() => populateDividendData(false)} 
                  disabled={refreshing}
                  size="sm"
                  variant="outline"
                >
                  {refreshing ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Smart Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(dividendEvents.reduce((acc, event) => {
                const date = new Date(event.date);
                const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
                const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                
                if (!acc[monthKey]) {
                  acc[monthKey] = {
                    monthName,
                    events: []
                  };
                }
                
                acc[monthKey].events.push(event);
                return acc;
              }, {} as Record<string, { monthName: string; events: DividendEvent[] }>)).map(([monthKey, monthData]) => (
                <Collapsible 
                  key={monthKey} 
                  open={expandedMonths.has(monthKey)}
                  onOpenChange={() => toggleMonth(monthKey)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <h3 className="font-semibold text-lg">{monthData.monthName}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{monthData.events.length} events</Badge>
                        {expandedMonths.has(monthKey) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-3 mt-3">
                      {monthData.events.map((event, index) => {
                        const daysUntil = getDaysUntil(event.date);
                        const isUpcoming = daysUntil >= 0;
                        
                        return (
                          <div key={`${event.date}-${event.ticker}-${event.type}-${index}`} 
                               className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${getEventColor(event.type)}`}>
                                {getEventIcon(event.type)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{event.ticker}</span>
                                  <Badge variant={event.type === 'ex-date' ? 'secondary' : 'default'}>
                                    {event.type === 'ex-date' ? 'Ex-Date' : 'Payment'}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {formatDate(event.date)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {formatCurrency(event.totalAmount)}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {event.shares} shares @ {formatCurrency(event.amount)}
                              </div>
                              {isUpcoming && (
                                <div className="text-xs text-muted-foreground">
                                  {daysUntil === 0 ? 'Today' : `${daysUntil} days`}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </CalendarErrorBoundary>
  );
} 