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
  portfolioNames: string[];
  totalAmount: number;
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

        const eventMap = new Map<string, DividendEvent>();

        // Collect dividend events from all portfolios
        for (const portfolio of portfolios) {
          try {
            const dividends = await dividendService.getUpcomingDividends(portfolio);
            
            for (const dividend of dividends) {
              const security = portfolio.securities.find(s => s.security.id === dividend.security_id);
              if (security) {
                // Create unique keys for ex-date and payment events
                const exDateKey = `${security.security.ticker}-${dividend.ex_date}-ex-date`;
                const paymentKey = `${security.security.ticker}-${dividend.payment_date}-payment`;
                
                // Handle ex-date event
                if (eventMap.has(exDateKey)) {
                  const existingEvent = eventMap.get(exDateKey)!;
                  if (!existingEvent.portfolioNames.includes(portfolio.name)) {
                    existingEvent.portfolioNames.push(portfolio.name);
                  }
                  existingEvent.totalAmount += dividend.amount;
                } else {
                  eventMap.set(exDateKey, {
                    date: dividend.ex_date,
                    ticker: security.security.ticker,
                    amount: dividend.amount,
                    type: "ex-date",
                    portfolioNames: [portfolio.name],
                    totalAmount: dividend.amount
                  });
                }
                
                // Handle payment event
                if (eventMap.has(paymentKey)) {
                  const existingEvent = eventMap.get(paymentKey)!;
                  if (!existingEvent.portfolioNames.includes(portfolio.name)) {
                    existingEvent.portfolioNames.push(portfolio.name);
                  }
                  existingEvent.totalAmount += dividend.amount;
                } else {
                  eventMap.set(paymentKey, {
                    date: dividend.payment_date,
                    ticker: security.security.ticker,
                    amount: dividend.amount,
                    type: "payment",
                    portfolioNames: [portfolio.name],
                    totalAmount: dividend.amount
                  });
                }
              }
            }
          } catch (error) {
            console.error(`Error loading dividends for portfolio ${portfolio.name}:`, error);
          }
        }

        // Convert map to array and sort by date
        const allEvents = Array.from(eventMap.values());
        allEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Limit to next 5 events to keep the UI clean and focused
        setDividendEvents(allEvents.slice(0, 5));
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
                      <span className="text-xs text-muted-foreground">
                        {event.portfolioNames.length > 1 
                          ? `${event.portfolioNames.length} portfolios` 
                          : event.portfolioNames[0]}
                      </span>
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
                      {event.portfolioNames.length > 1 && (
                        <span className="text-xs text-muted-foreground ml-2">
                          (${event.totalAmount.toFixed(2)} total)
                        </span>
                      )}
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