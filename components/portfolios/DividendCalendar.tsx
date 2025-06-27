"use client"

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Clock } from 'lucide-react';
import { Portfolio } from '@/services/portfolioService';
import { dividendService } from '@/src/services/dividendService';

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

export function DividendCalendar({ portfolio }: DividendCalendarProps) {
  const [dividendEvents, setDividendEvents] = useState<DividendEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDividendEvents() {
      try {
        setLoading(true);
        const dividends = await dividendService.getUpcomingDividends(portfolio);
        
        const events: DividendEvent[] = [];
        
        for (const dividend of dividends) {
          const security = portfolio.securities.find(s => s.security.id === dividend.security_id);
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
        console.error('Error loading dividend events:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDividendEvents();
  }, [portfolio]);

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

  if (loading) {
    return (
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
    );
  }

  if (dividendEvents.length === 0) {
    return (
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
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No upcoming dividend events</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add dividend-paying stocks to see calendar events
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group events by month
  const eventsByMonth = dividendEvents.reduce((acc, event) => {
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
  }, {} as Record<string, { monthName: string; events: DividendEvent[] }>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Dividend Calendar
        </CardTitle>
        <CardDescription>Upcoming dividend events and payments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.entries(eventsByMonth).map(([monthKey, monthData]) => (
            <div key={monthKey} className="space-y-3">
              <h3 className="font-semibold text-lg border-b pb-2">{monthData.monthName}</h3>
              <div className="space-y-3">
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
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 