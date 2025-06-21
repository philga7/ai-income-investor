"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Brain, Database, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

interface AIAnalysisResponse {
  analysis: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
  model: string;
  timestamp: string;
  is_cached?: boolean;
  cache_id?: string;
  message?: string;
}

interface AITestAnalysisProps {
  portfolioId: string;
}

export function AITestAnalysis({ portfolioId }: AITestAnalysisProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();

  const analyzePortfolio = async (forceRefresh = false) => {
    if (!session?.access_token) {
      toast.error('You must be logged in to use AI features');
      return;
    }

    console.log('Analyzing portfolio:', { portfolioId, forceRefresh, userId: session.user?.id });

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/analyze-portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          portfolioId,
          forceRefresh 
        }),
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('API error response:', errorData);
        throw new Error(errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: AIAnalysisResponse = await response.json();
      setAnalysis(data);
      
      if (data.is_cached) {
        toast.success('Analysis retrieved from cache');
      } else {
        toast.success('Fresh analysis generated');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const debugPortfolios = async () => {
    if (!session?.access_token) {
      toast.error('You must be logged in to use AI features');
      return;
    }

    try {
      const response = await fetch('/api/ai/analyze-portfolio', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      console.log('Debug portfolios:', data);
      
      if (data.portfolios && data.portfolios.length > 0) {
        toast.success(`Found ${data.count} portfolios`);
        console.log('Available portfolios:', data.portfolios);
        console.log('Current portfolio ID being passed:', portfolioId);
        console.log('Portfolio ID type:', typeof portfolioId);
        console.log('Portfolio IDs in database:', data.portfolios.map((p: any) => p.id));
        console.log('Portfolio ID match:', data.portfolios.some((p: any) => p.id === portfolioId));
      } else {
        toast.error('No portfolios found');
      }
    } catch (err) {
      console.error('Debug error:', err);
      toast.error('Debug failed');
    }
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(6)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Brain className="h-4 w-4" />
          AI Test Analysis
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Portfolio Analysis
          </DialogTitle>
          <DialogDescription>
            Analyze your portfolio using Claude AI to get insights on diversification, risk, and optimization opportunities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={() => analyzePortfolio(false)}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze Portfolio
                </>
              )}
            </Button>
            
            <Button 
              onClick={() => analyzePortfolio(true)}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Force Refresh
            </Button>

            <Button 
              onClick={debugPortfolios}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              Debug
            </Button>
          </div>

          {/* Cache Status */}
          {analysis && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Analysis Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={analysis.is_cached ? "secondary" : "default"}>
                    {analysis.is_cached ? "Cached" : "Fresh"}
                  </Badge>
                  {analysis.message && (
                    <span className="text-sm text-muted-foreground">
                      {analysis.message}
                    </span>
                  )}
                </div>
                {analysis.cache_id && (
                  <div className="text-xs text-muted-foreground">
                    Cache ID: {analysis.cache_id}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Usage Statistics */}
          {analysis && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Usage Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Model</div>
                    <div className="text-muted-foreground">{analysis.model}</div>
                  </div>
                  <div>
                    <div className="font-medium">Input Tokens</div>
                    <div className="text-muted-foreground">{analysis.usage.inputTokens.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="font-medium">Output Tokens</div>
                    <div className="text-muted-foreground">{analysis.usage.outputTokens.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="font-medium">Total Cost</div>
                    <div className="text-muted-foreground">{formatCost(analysis.usage.estimatedCost)}</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3 inline mr-1" />
                  Generated: {formatTimestamp(analysis.timestamp)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {error && (
            <Card className="border-destructive">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* AI Analysis */}
          {analysis && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">AI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md overflow-x-auto">
                    {analysis.analysis}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Full JSON Response */}
          {analysis && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Full JSON Response</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-4 rounded-md overflow-x-auto">
                  {JSON.stringify(analysis, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 