'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProtectedRoute } from '@/components/auth/protected-route';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';

export default function CreatePortfolioPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Debug session state
  useEffect(() => {
    console.log('Current session:', session);
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!session?.access_token) {
        throw new Error('No access token available');
      }

      console.log('Sending request with token:', session.access_token);
      console.log('Request URL:', '/api/portfolios');
      console.log('Request body:', formData);

      // First, try to create a portfolio
      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
        credentials: 'include',
      });
      
      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', data);
      
      // If we get a 400 error about missing profile, create one
      if (response.status === 400 && data.error?.includes('profile not found')) {
        console.log('Creating user profile...');
        const profileResponse = await fetch('/api/profiles', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          credentials: 'include',
        });

        if (!profileResponse.ok) {
          const profileData = await profileResponse.json();
          throw new Error(profileData.error || 'Failed to create profile');
        }

        // Now try creating the portfolio again
        console.log('Retrying portfolio creation...');
        const retryResponse = await fetch('/api/portfolios', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(formData),
          credentials: 'include',
        });

        const retryData = await retryResponse.json();
        if (!retryResponse.ok) {
          throw new Error(retryData.error || `Failed to create portfolio: ${retryResponse.status} ${retryResponse.statusText}`);
        }

        toast.success('Portfolio created successfully');
        router.push(`/portfolios/${retryData.id}`);
        return;
      }
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to create portfolio: ${response.status} ${response.statusText}`);
      }
      
      toast.success('Portfolio created successfully');
      router.push(`/portfolios/${data.id}`);
    } catch (error) {
      console.error('Error creating portfolio:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create portfolio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/portfolios">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Portfolio</h1>
            <p className="text-muted-foreground">
              Create a new dividend investment portfolio.
            </p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Portfolio Details</CardTitle>
              <CardDescription>
                Enter the details for your new portfolio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Portfolio Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Core Dividend Portfolio"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your portfolio's strategy and goals..."
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-4">
              <Link href="/portfolios">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Portfolio'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </ProtectedRoute>
  );
} 