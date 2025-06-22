"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Brain, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Target,
  Shield,
  BarChart3,
  Database
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { AIAnalysisResponse } from '@/src/services/enhancedPortfolioAnalysisService';

interface EnhancedAIAnalysisProps {
  portfolioId: string;
}

export function EnhancedAIAnalysis({ portfolioId }: EnhancedAIAnalysisProps) {
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
          forceRefresh,
          analysisType: 'comprehensive'
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || errorData.details || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: AIAnalysisResponse = await response.json();
      
      // Ensure all required properties exist with defaults
      const validatedData: AIAnalysisResponse = {
        analysis: data.analysis || '',
        recommendations: data.recommendations || [],
        dividendInsights: {
          nextDividendOpportunities: data.dividendInsights?.nextDividendOpportunities || [],
          dividendReliabilityAssessment: data.dividendInsights?.dividendReliabilityAssessment || 'No assessment available.',
          incomeProjection: {
            nextMonth: data.dividendInsights?.incomeProjection?.nextMonth || 0,
            nextQuarter: data.dividendInsights?.incomeProjection?.nextQuarter || 0,
            nextYear: data.dividendInsights?.incomeProjection?.nextYear || 0
          }
        },
        riskAssessment: {
          overallRisk: data.riskAssessment?.overallRisk || 'medium',
          dividendCutRisk: data.riskAssessment?.dividendCutRisk || 'medium',
          concentrationRisk: data.riskAssessment?.concentrationRisk || 'medium',
          marketRisk: data.riskAssessment?.marketRisk || 'medium',
          recommendations: data.riskAssessment?.recommendations || []
        },
        usage: {
          inputTokens: data.usage?.inputTokens || 0,
          outputTokens: data.usage?.outputTokens || 0,
          totalTokens: data.usage?.totalTokens || 0,
          estimatedCost: data.usage?.estimatedCost || 0
        },
        model: data.model || 'unknown',
        timestamp: data.timestamp || new Date().toISOString(),
        message: data.message
      };
      
      setAnalysis(validatedData);
      
      toast.success('Enhanced AI analysis completed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(6)}`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'buy': return 'text-green-600 bg-green-100';
      case 'sell': return 'text-red-600 bg-red-100';
      case 'hold': return 'text-blue-600 bg-blue-100';
      case 'add': return 'text-green-600 bg-green-100';
      case 'reduce': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Brain className="h-4 w-4" />
          Enhanced AI Analysis
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Enhanced AI Portfolio Analysis
          </DialogTitle>
          <DialogDescription>
            Get comprehensive dividend timing analysis and AI-powered recommendations for your portfolio.
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
                  Run Enhanced Analysis
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
          </div>

          {/* Error Display */}
          {error && (
            <Card className="border-destructive">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Analysis Results */}
          {analysis && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                <TabsTrigger value="dividend-insights">Dividend Insights</TabsTrigger>
                <TabsTrigger value="risk-assessment">Risk Assessment</TabsTrigger>
                <TabsTrigger value="raw-analysis">Raw Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Usage Statistics */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Analysis Statistics
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
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <div>
                        <Clock className="h-3 w-3 inline mr-1" />
                        Generated: {formatTimestamp(analysis.timestamp)}
                      </div>
                      {analysis.message?.includes('cache') && (
                        <Badge variant="secondary" className="flex items-center">
                          <Database className="h-3 w-3 mr-1" />
                          Cached
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Key Insights Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Recommendations Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Buy Recommendations:</span>
                          <Badge variant="outline" className="text-green-600">
                            {analysis.recommendations?.filter(r => r.type === 'buy').length || 0}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Sell Recommendations:</span>
                          <Badge variant="outline" className="text-red-600">
                            {analysis.recommendations?.filter(r => r.type === 'sell').length || 0}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Hold Recommendations:</span>
                          <Badge variant="outline" className="text-blue-600">
                            {analysis.recommendations?.filter(r => r.type === 'hold').length || 0}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Risk Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Overall Risk:</span>
                          <Badge className={getRiskColor(analysis.riskAssessment.overallRisk)}>
                            {analysis.riskAssessment.overallRisk}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Dividend Cut Risk:</span>
                          <Badge className={getRiskColor(analysis.riskAssessment.dividendCutRisk)}>
                            {analysis.riskAssessment.dividendCutRisk}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Concentration Risk:</span>
                          <Badge className={getRiskColor(analysis.riskAssessment.concentrationRisk)}>
                            {analysis.riskAssessment.concentrationRisk}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      AI Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysis.recommendations && analysis.recommendations.length > 0 ? (
                        analysis.recommendations.map((rec, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge className={getRecommendationColor(rec.type)}>
                                  {rec.type.toUpperCase()}
                                </Badge>
                                {rec.ticker && (
                                  <Badge variant="outline">{rec.ticker}</Badge>
                                )}
                                <Badge variant="outline">{rec.timeframe}</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Confidence:</span>
                                <Progress value={rec.confidence * 100} className="w-20" />
                                <span className="text-sm">{(rec.confidence * 100).toFixed(0)}%</span>
                              </div>
                            </div>
                            <p className="text-sm">{rec.reason}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No specific recommendations generated.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="dividend-insights" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Dividend Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Reliability Assessment</h4>
                        <p className="text-sm text-muted-foreground">
                          {analysis.dividendInsights.dividendReliabilityAssessment}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Income Projection</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">${analysis.dividendInsights.incomeProjection.nextMonth.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">Next Month</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">${analysis.dividendInsights.incomeProjection.nextQuarter.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">Next Quarter</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold">${analysis.dividendInsights.incomeProjection.nextYear.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">Next Year</div>
                          </div>
                        </div>
                      </div>

                      {analysis.dividendInsights.nextDividendOpportunities && analysis.dividendInsights.nextDividendOpportunities.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Next Dividend Opportunities</h4>
                          <div className="space-y-2">
                            {analysis.dividendInsights.nextDividendOpportunities.map((opp, index) => (
                              <div key={index} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <span className="font-medium">{opp.ticker}</span>
                                  <span className="text-sm text-muted-foreground ml-2">
                                    Ex-date: {new Date(opp.exDate).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">${opp.amount}</div>
                                  <div className="text-sm text-muted-foreground">{opp.recommendation}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="risk-assessment" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Risk Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold mb-1">Overall Risk</div>
                          <Badge className={getRiskColor(analysis.riskAssessment.overallRisk)}>
                            {analysis.riskAssessment.overallRisk}
                          </Badge>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold mb-1">Dividend Cut Risk</div>
                          <Badge className={getRiskColor(analysis.riskAssessment.dividendCutRisk)}>
                            {analysis.riskAssessment.dividendCutRisk}
                          </Badge>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold mb-1">Concentration Risk</div>
                          <Badge className={getRiskColor(analysis.riskAssessment.concentrationRisk)}>
                            {analysis.riskAssessment.concentrationRisk}
                          </Badge>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold mb-1">Market Risk</div>
                          <Badge className={getRiskColor(analysis.riskAssessment.marketRisk)}>
                            {analysis.riskAssessment.marketRisk}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Risk Recommendations</h4>
                        <ul className="space-y-1">
                          {analysis.riskAssessment.recommendations && analysis.riskAssessment.recommendations.length > 0 ? (
                            analysis.riskAssessment.recommendations.map((rec, index) => (
                              <li key={index} className="text-sm flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                {rec}
                              </li>
                            ))
                          ) : (
                            <li className="text-sm text-muted-foreground">No specific risk recommendations available.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="raw-analysis" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Raw AI Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md overflow-x-auto">
                        {analysis.analysis}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 