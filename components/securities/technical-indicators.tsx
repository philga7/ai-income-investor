"use client"

import { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { TechnicalAnalysis, TechnicalIndicator } from '@/src/services/technicalAnalysisService';
import { useAuth } from '@/lib/auth';
import { fetchJson } from '@/lib/api-utils';

interface TechnicalIndicatorsProps {
  ticker: string;
}

export function TechnicalIndicators({ ticker }: TechnicalIndicatorsProps) {
  const [analysis, setAnalysis] = useState<TechnicalAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!session?.access_token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const data = await fetchJson(`/api/technical-analysis?symbol=${ticker}`, session.access_token);
        setAnalysis(data);
      } catch (err) {
        console.error('Error fetching technical analysis:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch technical analysis');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [ticker, session]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border p-4">
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {error || 'No technical analysis available for this symbol.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { indicators, overallSignal, buySignals, sellSignals, neutralSignals } = analysis;
  
  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Technical Summary</h3>
          <Badge 
            variant={overallSignal === "neutral" ? "outline" : "default"}
            className={overallSignal === "buy" ? "bg-green-600" : overallSignal === "sell" ? "bg-red-600" : ""}
          >
            {overallSignal === "buy" ? (
              <ArrowUpRight className="mr-1 h-3 w-3" />
            ) : overallSignal === "sell" ? (
              <ArrowDownRight className="mr-1 h-3 w-3" />
            ) : (
              <Minus className="mr-1 h-3 w-3" />
            )}
            {overallSignal.charAt(0).toUpperCase() + overallSignal.slice(1)}
          </Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500">{buySignals}</div>
            <div className="text-sm text-muted-foreground">Buy Signals</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-muted-foreground">{neutralSignals}</div>
            <div className="text-sm text-muted-foreground">Neutral</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-500">{sellSignals}</div>
            <div className="text-sm text-muted-foreground">Sell Signals</div>
          </div>
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Indicator</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Signal</TableHead>
            <TableHead>Strength</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {indicators.map((indicator, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{indicator.name}</TableCell>
              <TableCell>
                {indicator.name.includes('SMA') 
                  ? `$${indicator.value.toFixed(2)}`
                  : indicator.name === 'Volume'
                    ? `${indicator.value.toFixed(1)}x`
                    : indicator.value.toFixed(1)
                }
                <div className="text-xs text-muted-foreground">{indicator.description}</div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={indicator.signal === "neutral" ? "outline" : "default"}
                  className={
                    indicator.signal === "buy" 
                      ? "bg-green-600" 
                      : indicator.signal === "sell" 
                        ? "bg-red-600" 
                        : ""
                  }
                >
                  {indicator.signal === "buy" ? (
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                  ) : indicator.signal === "sell" ? (
                    <ArrowDownRight className="mr-1 h-3 w-3" />
                  ) : (
                    <Minus className="mr-1 h-3 w-3" />
                  )}
                  {indicator.signal.charAt(0).toUpperCase() + indicator.signal.slice(1)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={indicator.strength} className="h-2 w-24" />
                  <span className="text-xs">{indicator.strength.toFixed(0)}%</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}