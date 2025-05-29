'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ProtectedRoute } from '@/components/auth/protected-route';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AddSecurityPageProps {
  params: Promise<{ id: string }>;
}

export default function AddSecurityPage({ params }: AddSecurityPageProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [portfolioId, setPortfolioId] = useState<string>('');
  const [formData, setFormData] = useState({
    ticker: '',
    shares: '',
    averageCost: '',
  });

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params;
      setPortfolioId(id);
    };
    getParams();
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error('Failed to get authentication session');
      }

      if (!session?.access_token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/portfolios/${portfolioId}/securities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ticker: formData.ticker.toUpperCase(),
          shares: parseInt(formData.shares),
          average_cost: parseFloat(formData.averageCost),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add security');
      }

      toast.success('Security added successfully');
      router.push(`/portfolios/${portfolioId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add security');
    } finally {
      setIsLoading(false);
    }
  };

  if (!portfolioId) {
    return null; // or a loading spinner
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Add Security to Portfolio</CardTitle>
            <CardDescription>
              Enter the security details to add it to your portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ticker">Ticker Symbol</Label>
                <Input
                  id="ticker"
                  placeholder="e.g., AAPL"
                  value={formData.ticker}
                  onChange={(e) => setFormData({ ...formData, ticker: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shares">Number of Shares</Label>
                <Input
                  id="shares"
                  type="number"
                  min="1"
                  placeholder="e.g., 100"
                  value={formData.shares}
                  onChange={(e) => setFormData({ ...formData, shares: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="averageCost">Average Cost per Share</Label>
                <Input
                  id="averageCost"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g., 150.00"
                  value={formData.averageCost}
                  onChange={(e) => setFormData({ ...formData, averageCost: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Security'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
} 