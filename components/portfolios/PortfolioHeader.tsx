import { Portfolio } from '@/services/portfolioService';
import { portfolioAnalyticsService } from '@/services/portfolioAnalyticsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EditPortfolioDialog } from '@/components/portfolios/edit-portfolio-dialog';
import { DeletePortfolioDialog } from '@/components/portfolios/delete-portfolio-dialog';
import { AITestAnalysis } from '@/components/portfolios/AITestAnalysis';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface PortfolioHeaderProps {
  portfolio: Portfolio;
  onPortfolioUpdated: () => void;
}

export function PortfolioHeader({ portfolio, onPortfolioUpdated }: PortfolioHeaderProps) {
  const metrics = portfolioAnalyticsService.calculatePortfolioValue(portfolio);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">{portfolio.name}</CardTitle>
        <div className="flex items-center space-x-2">
          <AITestAnalysis portfolioId={portfolio.id} />
          <EditPortfolioDialog portfolio={portfolio} onPortfolioUpdated={onPortfolioUpdated} />
          <DeletePortfolioDialog portfolioId={portfolio.id} portfolioName={portfolio.name} />
        </div>
      </CardHeader>
      <CardContent>
        {portfolio.description && (
          <p className="text-sm text-muted-foreground">{portfolio.description}</p>
        )}
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Securities</p>
            <p className="text-2xl font-bold">{portfolio.securities?.filter(s => s.security.ticker !== 'CASH').length || 0}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold">
              {portfolioAnalyticsService.formatCurrency(metrics.totalValue)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
            <p className="text-2xl font-bold">
              {portfolioAnalyticsService.formatCurrency(metrics.totalCost)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Gain/Loss</p>
            <span className={`text-2xl font-bold flex items-center gap-2 ${metrics.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {portfolioAnalyticsService.formatCurrency(metrics.totalGainLoss)}
              <span className="text-base font-semibold">({metrics.totalGainLossPercentage.toFixed(2)}%)</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 