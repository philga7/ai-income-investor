"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";

interface Recommendation {
  recommendation: string;
  numberOfAnalysts: number;
  targetLowPrice: number;
  targetHighPrice: number;
  targetMeanPrice: number;
  targetMedianPrice: number;
  potentialReturn: number;
  confidence: number;
  lastUpdated: Date;
}

interface AnalystRecommendationsProps {
  symbol: string;
}

export function AnalystRecommendations({ symbol }: AnalystRecommendationsProps) {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecommendation() {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('Please sign in to view recommendations');
        }

        const response = await fetch(`/api/recommendations/${symbol}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch recommendation data');
        }

        const data = await response.json();
        setRecommendation(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load recommendation data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadRecommendation();
  }, [symbol]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analyst Recommendations</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-4" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (error || !recommendation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analyst Recommendations</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error || 'No analyst recommendations available for this symbol.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getRecommendationColor = (rec: string) => {
    switch (rec.toLowerCase()) {
      case 'buy':
      case 'strong buy':
        return 'bg-green-600';
      case 'sell':
      case 'strong sell':
        return 'bg-red-600';
      case 'hold':
        return 'bg-yellow-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyst Recommendations</CardTitle>
        <CardDescription>
          Based on {recommendation.numberOfAnalysts} analysts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Consensus</span>
            <Badge 
              className={getRecommendationColor(recommendation.recommendation)}
            >
              {recommendation.recommendation}
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Price Targets</span>
              <span className="font-medium">
                ${recommendation.targetLowPrice.toFixed(2)} - ${recommendation.targetHighPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Mean Target</span>
              <span className="font-medium">${recommendation.targetMeanPrice.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Median Target</span>
              <span className="font-medium">${recommendation.targetMedianPrice.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Potential Return</span>
              <span className={`font-medium ${recommendation.potentialReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {recommendation.potentialReturn.toFixed(1)}%
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Confidence</span>
                <span className="font-medium">{recommendation.confidence}%</span>
              </div>
              <Progress value={recommendation.confidence} className="h-2" />
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Last updated: {new Date(recommendation.lastUpdated).toLocaleString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 