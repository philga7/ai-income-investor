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
  const { session } = useAuth();

  useEffect(() => {
    const fetchPortfolios = async () => {
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/portfolios', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch portfolios');
        }

        const data = await response.json();
        setPortfolios(data);
      } catch (error) {
        console.error('Error fetching portfolios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolios();
  }, [session]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Portfolios</h1>
          <Link href="/portfolios/create">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Portfolio
            </Button>
          </Link>
        </div>

        {portfolios.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No portfolios found. Create your first portfolio to get started.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {portfolios.map((portfolio) => (
              <Link 
                href={{
                  pathname: `/portfolios/${portfolio.id}`,
                  query: { portfolio: JSON.stringify(portfolio) }
                }} 
                key={portfolio.id}
              >
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