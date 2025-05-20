import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Briefcase, TrendingUp, PieChart } from "lucide-react";
import Link from "next/link";

interface PortfolioCard {
  id: string;
  name: string;
  value: number;
  yield: number;
  securities: number;
  ytdDividends: number;
}

const portfolios: PortfolioCard[] = [
  {
    id: "1",
    name: "Core Dividend Portfolio",
    value: 124389.52,
    yield: 3.85,
    securities: 25,
    ytdDividends: 2345.67,
  },
  {
    id: "2",
    name: "High Yield Income",
    value: 68745.23,
    yield: 5.32,
    securities: 18,
    ytdDividends: 1825.34,
  },
  {
    id: "3",
    name: "Dividend Growth",
    value: 95123.45,
    yield: 2.45,
    securities: 22,
    ytdDividends: 1156.78,
  },
];

export default function PortfoliosPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Portfolios</h1>
          <p className="text-muted-foreground">
            Manage your dividend investment portfolios.
          </p>
        </div>
        <Link href="/portfolios/create">
          <Button className="w-full md:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Portfolio
          </Button>
        </Link>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {portfolios.map((portfolio) => (
          <Link href={`/portfolios/${portfolio.id}`} key={portfolio.id}>
            <Card className="h-full transition-all hover:shadow-md">
              <CardHeader className="relative pb-2">
                <Briefcase className="h-5 w-5 absolute right-6 top-6 text-muted-foreground" />
                <CardTitle>{portfolio.name}</CardTitle>
                <CardDescription>{portfolio.securities} securities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center">
                      <TrendingUp className="mr-1 h-4 w-4" /> Value
                    </p>
                    <p className="text-lg font-semibold">
                      ${portfolio.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center">
                      <PieChart className="mr-1 h-4 w-4" /> Yield
                    </p>
                    <p className="text-lg font-semibold">
                      {portfolio.yield.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <p className="text-sm">
                  YTD Dividends: <span className="font-medium">${portfolio.ytdDividends.toLocaleString()}</span>
                </p>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}