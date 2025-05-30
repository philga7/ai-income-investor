"use client"

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowUpDown, 
  PlusCircle, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign,
  BarChart4, 
  PieChart,
  Pencil
} from "lucide-react";
import Link from "next/link";
import { PortfolioSecurityChart } from "@/components/portfolios/portfolio-security-chart";
import { PositionCalculator } from "@/components/portfolios/position-calculator";
import { EditPortfolioDialog } from "@/components/portfolios/edit-portfolio-dialog";
import { toast } from "sonner";
import { useAuth } from '@/lib/auth';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteSecurityDialog } from "@/components/portfolios/delete-security-dialog";

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  user_id: string;
}

interface PortfolioSecurity {
  id: string;
  portfolio_id: string;
  security_id: string;
  shares: number;
  average_cost: number;
  security: {
    id: string;
    ticker: string;
    name: string;
    sector: string;
    price: number;
    yield: number;
    sma200: string;
    tags: string[];
  };
}

interface PortfolioDetailProps {
  portfolioId: string;
  initialPortfolio?: Portfolio | null;
}

export function PortfolioDetail({ portfolioId, initialPortfolio }: PortfolioDetailProps) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(initialPortfolio || null);
  const [securities, setSecurities] = useState<PortfolioSecurity[]>([]);
  const [loading, setLoading] = useState(!initialPortfolio);
  const { session } = useAuth();

  const fetchPortfolio = useCallback(async () => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }

    try {
      const [portfolioResponse, securitiesResponse] = await Promise.all([
        fetch(`/api/portfolios/${portfolioId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }),
        fetch(`/api/portfolios/${portfolioId}/securities`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })
      ]);

      if (!portfolioResponse.ok) {
        throw new Error('Failed to fetch portfolio');
      }

      if (!securitiesResponse.ok) {
        throw new Error('Failed to fetch securities');
      }

      const [portfolioData, securitiesData] = await Promise.all([
        portfolioResponse.json(),
        securitiesResponse.json()
      ]);

      setPortfolio(portfolioData);
      setSecurities(securitiesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load portfolio details');
    } finally {
      setLoading(false);
    }
  }, [portfolioId, session]);

  useEffect(() => {
    if (!initialPortfolio) {
      fetchPortfolio();
    } else if (session?.access_token) {
      // If we have an initial portfolio, we should still fetch the securities
      fetch(`/api/portfolios/${portfolioId}/securities`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
        .then(response => response.json())
        .then(data => {
          setSecurities(data);
        })
        .catch(error => {
          console.error('Error fetching securities for initial portfolio:', error);
        });
    }
  }, [initialPortfolio, fetchPortfolio, portfolioId, session]);

  const handleSecurityDeleted = () => {
    fetchPortfolio();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!portfolio) {
    return <div>Portfolio not found</div>;
  }

  return (
    <div className="space-y-6">
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Currently displaying sample data. Real-time market data will be available when the financial API integration is complete.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center">
            <h1 className="text-3xl font-bold tracking-tight mr-2">{portfolio.name}</h1>
            <EditPortfolioDialog 
              portfolio={portfolio} 
              onPortfolioUpdated={fetchPortfolio}
            />
          </div>
          <p className="text-muted-foreground">
            Created {new Date(portfolio.created_at).toLocaleDateString()}
          </p>
          {portfolio.description && (
            <p className="text-muted-foreground mt-2">
              {portfolio.description}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href={`/portfolios/${portfolioId}/add-security`}>
            <Button variant="outline" className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Security
            </Button>
          </Link>
          <Button className="w-full sm:w-auto">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Rebalance
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Securities</CardTitle>
          <CardDescription>Your portfolio holdings</CardDescription>
        </CardHeader>
        <CardContent>
          {securities.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No securities added yet. Click &ldquo;Add Security&ldquo; to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticker</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Avg Cost</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Yield</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {securities.map((ps) => (
                  <TableRow key={ps.id}>
                    <TableCell className="font-medium">{ps.security.ticker}</TableCell>
                    <TableCell>{ps.security.name}</TableCell>
                    <TableCell>{ps.security.sector}</TableCell>
                    <TableCell className="text-right">{ps.shares}</TableCell>
                    <TableCell className="text-right">${ps.average_cost.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${ps.security.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      ${(ps.shares * ps.security.price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {ps.security.yield.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/portfolios/${portfolioId}/securities/${ps.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <DeleteSecurityDialog
                          portfolioId={portfolioId}
                          securityId={ps.id}
                          securityName={ps.security.name}
                          onDelete={handleSecurityDeleted}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 