import { Portfolio } from '@/services/portfolioService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EditPortfolioDialog } from '@/components/portfolios/edit-portfolio-dialog';
import { DeletePortfolioDialog } from '@/components/portfolios/delete-portfolio-dialog';

interface PortfolioHeaderProps {
  portfolio: Portfolio;
  onPortfolioUpdated?: () => void;
}

export function PortfolioHeader({ portfolio, onPortfolioUpdated }: PortfolioHeaderProps) {
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
              ${portfolio.securities.reduce((total, ps) => 
                total + (ps.shares * ps.security.price), 0
              ).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
            <p className="text-2xl font-bold">
              ${portfolio.securities.reduce((total, ps) => 
                total + (ps.shares * ps.average_cost), 0
              ).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Gain/Loss</p>
            <p className="text-2xl font-bold">
              ${portfolio.securities.reduce((total, ps) => 
                total + (ps.shares * (ps.security.price - ps.average_cost)), 0
              ).toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 