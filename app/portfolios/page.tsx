'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Briefcase, TrendingUp, PieChart, Search, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { portfolioService, Portfolio } from '@/services/portfolioService';

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { session } = useAuth();

  useEffect(() => {
    const fetchPortfolios = async () => {
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      try {
        const data = await portfolioService.searchPortfolios(searchQuery, {
          sortBy,
          sortOrder
        });
        setPortfolios(data);
      } catch (error) {
        console.error('Error fetching portfolios:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchPortfolios();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [session, searchQuery, sortBy, sortOrder]);

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-');
    setSortBy(newSortBy as 'name' | 'created_at');
    setSortOrder(newSortOrder as 'asc' | 'desc');
  };

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

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search portfolios..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select
            value={`${sortBy}-${sortOrder}`}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="created_at-desc">Newest First</SelectItem>
              <SelectItem value="created_at-asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {portfolios.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'No portfolios found matching your search.' : 'No portfolios found. Create your first portfolio to get started.'}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {portfolios.map((portfolio) => (
              <Link 
                href={`/portfolios/${portfolio.id}`}
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