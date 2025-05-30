"use client"

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  AlertCircle, 
  DollarSign,
  BarChart4, 
  PieChart,
  Pencil
} from "lucide-react";
import Link from "next/link";
import { EditPortfolioDialog } from "@/components/portfolios/edit-portfolio-dialog";
import { DeletePortfolioDialog } from "@/components/portfolios/delete-portfolio-dialog";
import { toast } from "sonner";
import { useAuth } from '@/lib/auth';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DeleteSecurityDialog } from "@/components/portfolios/delete-security-dialog";

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  securities: PortfolioSecurity[];
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
    sma200: "above" | "below";
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
      toast.error('You must be logged in to view portfolios');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch portfolio');
      }

      const data = await response.json();
      setPortfolio(data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch portfolio');
    } finally {
      setLoading(false);
    }
  }, [portfolioId, session]);

  const fetchSecurities = useCallback(async () => {
    if (!session?.access_token) {
      return;
    }

    try {
      const response = await fetch(`/api/portfolios/${portfolioId}/securities`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch securities');
      }

      const data = await response.json();
      setSecurities(data);
    } catch (error) {
      console.error('Error fetching securities:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch securities');
    }
  }, [portfolioId, session]);

  useEffect(() => {
    if (!initialPortfolio) {
      fetchPortfolio();
    }
    fetchSecurities();
  }, [initialPortfolio, fetchPortfolio, fetchSecurities]);

  const handlePortfolioUpdated = () => {
    fetchPortfolio();
  };

  const handleSecurityDeleted = () => {
    fetchSecurities();
  };

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
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">{portfolio.name}</CardTitle>
            {portfolio.description && (
              <CardDescription>{portfolio.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <EditPortfolioDialog portfolio={portfolio} onPortfolioUpdated={handlePortfolioUpdated} />
            <DeletePortfolioDialog portfolioId={portfolio.id} portfolioName={portfolio.name} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${securities.reduce((sum, ps) => sum + ps.shares * ps.security.price, 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Yield</CardTitle>
                <BarChart4 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {securities.length > 0
                    ? (securities.reduce((sum, ps) => sum + ps.security.yield * ps.shares * ps.security.price, 0) /
                        securities.reduce((sum, ps) => sum + ps.shares * ps.security.price, 0)).toFixed(2)
                    : '0.00'}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Positions</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securities.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${securities.length > 0
                    ? (securities.reduce((sum, ps) => sum + ps.average_cost * ps.shares, 0) /
                        securities.reduce((sum, ps) => sum + ps.shares, 0)).toFixed(2)
                    : '0.00'}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Securities</CardTitle>
          <CardDescription>
            Manage your portfolio securities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {securities.length === 0 ? (
            <div className="text-center py-8">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No securities found. Add your first security to get started.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticker</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Avg. Cost</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead className="text-right">Market Value</TableHead>
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