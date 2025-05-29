import { Portfolio } from '@/services/portfolioService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PortfolioHeaderProps {
  portfolio: Portfolio;
}

export function PortfolioHeader({ portfolio }: PortfolioHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{portfolio.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {portfolio.description && (
          <p className="text-muted-foreground">{portfolio.description}</p>
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