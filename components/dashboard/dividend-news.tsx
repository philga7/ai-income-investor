"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper } from "lucide-react";
import Link from "next/link";

interface NewsItem {
  title: string;
  source: string;
  date: string;
  url: string;
  category: "dividend-increase" | "market-news" | "analysis";
}

const newsItems: NewsItem[] = [
  {
    title: "Johnson & Johnson Raises Dividend by 5.3%, Marking 62nd Consecutive Year",
    source: "Dividend.com",
    date: "2025-01-02",
    url: "#",
    category: "dividend-increase",
  },
  {
    title: "10 High-Yield Dividend Stocks to Watch in 2025",
    source: "Seeking Alpha",
    date: "2025-01-03",
    url: "#",
    category: "analysis",
  },
  {
    title: "Federal Reserve Holds Rates Steady, Dividend Stocks Rally",
    source: "CNBC",
    date: "2025-01-04",
    url: "#",
    category: "market-news",
  },
  {
    title: "Coca-Cola Announces 3% Dividend Increase, 61st Annual Raise",
    source: "Bloomberg",
    date: "2025-01-05",
    url: "#",
    category: "dividend-increase",
  },
  {
    title: "Dividend Aristocrats Outlook: Analysts' Top Picks for 2025",
    source: "Morningstar",
    date: "2025-01-06",
    url: "#",
    category: "analysis",
  },
];

export function DividendNews() {
  // Get current date for displaying relative days
  const today = new Date();
  
  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Dividend News</CardTitle>
          <CardDescription>Latest updates and analysis</CardDescription>
        </div>
        <Newspaper className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {newsItems.map((item, index) => {
            const newsDate = new Date(item.date);
            const dayDiff = Math.ceil(
              (today.getTime() - newsDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            return (
              <div key={index} className="border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium">
                    <Link href={item.url} className="hover:underline">
                      {item.title}
                    </Link>
                  </h3>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="mr-2">{item.source}</span>
                  <span className="text-xs">
                    {dayDiff === 0 ? "Today" : `${dayDiff}d ago`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}