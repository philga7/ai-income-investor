"use client"

import { useEffect, useState } from "react";
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
  PieChart 
} from "lucide-react";
import Link from "next/link";
import { PortfolioSecurityChart } from "@/components/portfolios/portfolio-security-chart";
import { PositionCalculator } from "@/components/portfolios/position-calculator";
import { EditPortfolioDialog } from "@/components/portfolios/edit-portfolio-dialog";
import { toast } from "sonner";

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  user_id: string;
}

interface PortfolioDetailProps {
  portfolioId: string;
  initialPortfolio?: Portfolio | null;
}

export function PortfolioDetail({ portfolioId, initialPortfolio }: PortfolioDetailProps) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(initialPortfolio || null);
  const [loading, setLoading] = useState(!initialPortfolio);

  const fetchPortfolio = async () => {
    try {
      const response = await fetch(`/api/portfolios/${portfolioId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch portfolio');
      }

      const data = await response.json();
      setPortfolio(data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      toast.error('Failed to load portfolio details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialPortfolio) {
      fetchPortfolio();
    }
  }, [portfolioId, initialPortfolio]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!portfolio) {
    return <div>Portfolio not found</div>;
  }

  return (
    <div className="space-y-6">
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
      
      {/* Rest of your existing JSX */}
      {/* ... */}
    </div>
  );
} 