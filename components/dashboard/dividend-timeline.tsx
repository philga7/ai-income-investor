"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { dividendService } from "@/services/dividendService";
import { portfolioService, Portfolio } from "@/services/portfolioService";

interface DividendEvent {
  date: string;
  ticker: string;
  amount: number;
  type: "ex-date" | "payment";
  portfolioName: string;
}

export function DividendTimeline() {
  const [dividendEvents, setDividendEvents] = useState<DividendEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDividendEvents() {
      try {
        const portfolios = await portfolioService.getPortfolios();
        
        if (portfolios.length === 0) {
          setDividendEvents([]);
          setLoading(false);
          return;
        }

        const allEvents: DividendEvent[] = [];

        // Collect dividend events from all portfolios
        for (const portfolio of portfolios) {
          try {
            const dividends = await dividendService.getUpcomingDividends(portfolio);
            
            for (const dividend of dividends) {
              const security = portfolio.securities.find(s => s.security.id === dividend.security_id);
              if (security) {
                allEvents.push({
                  date: dividend.ex_date,
                  ticker: security.security.ticker,
                  amount: dividend.amount,
                  type: "ex-date",
                  portfolioName: portfolio.name
                });
                allEvents.push({
                  date: dividend.payment_date,
                  ticker: security.security.ticker,
                  amount: dividend.amount,
                  type: "payment",
                  portfolioName: portfolio.name
                });
              }
            }
          } catch (error) {
            console.error(`Error loading dividends for portfolio ${portfolio.name}:`, error);
          }
        }

        // Sort events by date
        allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Limit to next 10 events to keep the UI clean
        setDividendEvents(allEvents.slice(0, 10));
      } catch (error) {
        console.error('Error loading dividend events:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDividendEvents();
  }, []);

  // Get current date for displaying relative days
  const today = new Date();
  
  return (
    <Card className="col-span-1 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer">
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
          <div className="text-center text-muted-foreground">
            <p>No upcoming dividend events</p>
            <p className="text-sm mt-1">Add dividend-paying stocks to see timeline</p>
          </div>
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
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium leading-none">
                        {event.ticker} - {event.type === "ex-date" ? "Ex-Dividend" : "Payment"}
                      </p>
                      <span className="text-xs text-muted-foreground">{event.portfolioName}</span>
                    </div>
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