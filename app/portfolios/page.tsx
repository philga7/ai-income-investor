'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Briefcase, TrendingUp, PieChart } from "lucide-react";
import Link from "next/link";
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';

interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  user_id: string;
}

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        if (!session?.access_token) {
          throw new Error('No access token available');
        }

        const response = await fetch('/api/portfolios', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch portfolios');
        }

        const data = await response.json();
        setPortfolios(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (session?.access_token) {
      fetchPortfolios();
    }
  }, [session]);

  return (
    <ProtectedRoute>
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
        
        {loading ? (
          <div className="text-center py-8">Loading portfolios...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : portfolios.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No portfolios found. Create your first portfolio to get started.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {portfolios.map((portfolio) => (
              <Link href={`/portfolios/${portfolio.id}`} key={portfolio.id}>
                <Card className="h-full transition-all hover:shadow-md">
                  <CardHeader className="relative pb-2">
                    <Briefcase className="h-5 w-5 absolute right-6 top-6 text-muted-foreground" />
                    <CardTitle>{portfolio.name}</CardTitle>
                    <CardDescription>
                      Created {new Date(portfolio.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {portfolio.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {portfolio.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}