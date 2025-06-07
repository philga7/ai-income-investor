import { Portfolio } from '@/services/portfolioService';
import { portfolioAnalyticsService } from '@/services/portfolioAnalyticsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EditPortfolioDialog } from '@/components/portfolios/edit-portfolio-dialog';
import { DeletePortfolioDialog } from '@/components/portfolios/delete-portfolio-dialog';
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
            <p className="text-2xl font-bold">{portfolio.securities.length}</p>
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
            <p className={`text-2xl font-bold ${metrics.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioAnalyticsService.formatCurrency(metrics.totalGainLoss)} ({metrics.totalGainLossPercentage.toFixed(2)}%)
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Avg. P/E Ratio</p>
            <p className="text-2xl font-bold">
              {metrics.securityValues && Object.keys(metrics.securityValues).length > 0
                ? (Object.values(metrics.securityValues).reduce((sum, sv) => sum + (sv.peRatio || 0), 0) / 
                   Object.keys(metrics.securityValues).length).toFixed(2)
                : '0.00'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Avg. Beta</p>
            <p className="text-2xl font-bold">
              {metrics.securityValues && Object.keys(metrics.securityValues).length > 0
                ? (Object.values(metrics.securityValues).reduce((sum, sv) => sum + (sv.beta || 0), 0) / 
                   Object.keys(metrics.securityValues).length).toFixed(2)
                : '0.00'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Avg. Market Cap</p>
            <p className="text-2xl font-bold">
              {metrics.securityValues && Object.keys(metrics.securityValues).length > 0
                ? portfolioAnalyticsService.formatCurrency(
                    Object.values(metrics.securityValues).reduce((sum, sv) => sum + (sv.marketCap || 0), 0) / 
                    Object.keys(metrics.securityValues).length
                  )
                : portfolioAnalyticsService.formatCurrency(0)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Avg. Price/Sales</p>
            <p className="text-2xl font-bold">
              {metrics.securityValues && Object.keys(metrics.securityValues).length > 0
                ? (Object.values(metrics.securityValues).reduce((sum, sv) => sum + (sv.priceToSales || 0), 0) / 
                   Object.keys(metrics.securityValues).length).toFixed(2)
                : '0.00'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 