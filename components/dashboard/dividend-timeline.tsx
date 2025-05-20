"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface DividendEvent {
  date: string;
  ticker: string;
  amount: number;
  type: "ex-date" | "payment";
}

const dividendEvents: DividendEvent[] = [
  { date: "2025-01-05", ticker: "JNJ", amount: 1.19, type: "ex-date" },
  { date: "2025-01-10", ticker: "MSFT", amount: 0.75, type: "payment" },
  { date: "2025-01-15", ticker: "PG", amount: 0.94, type: "ex-date" },
  { date: "2025-01-22", ticker: "KO", amount: 0.46, type: "payment" },
  { date: "2025-01-28", ticker: "VZ", amount: 0.66, type: "ex-date" },
];

export function DividendTimeline() {
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
      </CardContent>
    </Card>
  );
}