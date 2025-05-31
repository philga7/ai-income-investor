"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { dividendService } from "@/services/dividendService";
import { Portfolio } from "@/services/portfolioService";

interface DividendEvent {
  date: string;
  ticker: string;
  amount: number;
  type: "ex-date" | "payment";
}

interface DividendTimelineProps {
  portfolio: Portfolio;
}

export function DividendTimeline({ portfolio }: DividendTimelineProps) {
  const [dividendEvents, setDividendEvents] = useState<DividendEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDividendEvents() {
      try {
        const dividends = await dividendService.getUpcomingDividends(portfolio);
        const events: DividendEvent[] = [];

        for (const dividend of dividends) {
          const security = portfolio.securities.find(s => s.security.id === dividend.security_id);
          if (security) {
            events.push({
              date: dividend.ex_date,
              ticker: security.security.ticker,
              amount: dividend.amount,
              type: "ex-date"
            });
            events.push({
              date: dividend.payment_date,
              ticker: security.security.ticker,
              amount: dividend.amount,
              type: "payment"
            });
          }
        }

        // Sort events by date
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

  // Get current date for displaying relative days
  const today = new Date();
  
  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Dividend Timeline</CardTitle>
          <CardDescription>Upcoming dividend events</CardDescription>
        </div>
        <Calendar className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-muted-foreground">Loading...</div>
        ) : dividendEvents.length === 0 ? (
          <div className="text-center text-muted-foreground">No upcoming dividend events</div>
        ) : (
          <div className="space-y-6">
            {dividendEvents.map((event, index) => {
              const eventDate = new Date(event.date);
              const dayDiff = Math.ceil(
                (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              );
              
              return (
                <div key={index} className="flex items-start">
                  <div className="mr-4 flex h-8 w-8 items-center justify-center rounded-full border">
                    <span className="text-xs font-medium">{dayDiff}d</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {event.ticker} - {event.type === "ex-date" ? "Ex-Dividend" : "Payment"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }).format(eventDate)}
                    </p>
                    <p className="text-sm font-medium">
                      ${event.amount.toFixed(2)} per share
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}