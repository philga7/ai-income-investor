import { PortfolioSecurity } from '@/services/portfolioService';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { DeleteSecurityDialog } from './delete-security-dialog';
import { AddSecurityDialog } from './add-security-dialog';
import { portfolioAnalyticsService } from "@/src/services/portfolioAnalyticsService";
import { PositionPerformance } from './PositionPerformance';

interface PortfolioSecuritiesProps {
  securities: PortfolioSecurity[];
  portfolioId: string;
  onSecurityDeleted?: () => void;
  onSecurityAdded?: () => void;
}

export function PortfolioSecurities({ securities, portfolioId, onSecurityDeleted, onSecurityAdded }: PortfolioSecuritiesProps) {
  const analytics = portfolioAnalyticsService.calculatePortfolioAnalytics({
    id: portfolioId,
    name: '',
    description: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    securities
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddSecurityDialog portfolioId={portfolioId} onSecurityAdded={onSecurityAdded} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticker</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead className="text-right">Shares</TableHead>
              <TableHead className="text-right">Avg. Cost</TableHead>
              <TableHead className="text-right">Current Price</TableHead>
              <TableHead className="text-right">Market Value</TableHead>
              <TableHead className="text-right">Day Change</TableHead>
              <TableHead className="text-right">Gain/Loss</TableHead>
              <TableHead className="text-right">P/E Ratio</TableHead>
              <TableHead className="text-right">Yield</TableHead>
              <TableHead className="text-right">Annual Income</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {securities.map((ps) => {
              const marketValue = ps.shares * ps.security.price;
              const costBasis = ps.shares * ps.average_cost;
              const gainLoss = marketValue - costBasis;
              const gainLossPercentage = (gainLoss / costBasis) * 100;
              const securityDividend = analytics.dividendMetrics.securityDividends[ps.security.id];
              const securityValue = analytics.valueMetrics.securityValues[ps.security.id];

              return (
                <TableRow key={ps.id}>
                  <TableCell className="font-medium">{ps.security.ticker}</TableCell>
                  <TableCell>{ps.security.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{ps.security.sector}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{ps.shares.toLocaleString()}</TableCell>
                  <TableCell className="text-right">${ps.average_cost.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${ps.security.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${marketValue.toLocaleString()}</TableCell>
                  <TableCell className={`text-right ${securityValue.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${securityValue.dayChange.toFixed(2)} ({securityValue.dayChangePercentage.toFixed(2)}%)
                  </TableCell>
                  <TableCell className={`text-right ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${gainLoss.toLocaleString()} ({gainLossPercentage.toFixed(2)}%)
                  </TableCell>
                  <TableCell className="text-right">{securityValue.peRatio.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{ps.security.yield.toFixed(2)}%</TableCell>
                  <TableCell className="text-right">
                    {portfolioAnalyticsService.formatCurrency(securityDividend.annualDividend)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/portfolios/${portfolioId}/securities/${ps.id}/edit`}>
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DeleteSecurityDialog
                        portfolioId={portfolioId}
                        securityId={ps.id}
                        securityName={ps.security.name}
                        onDelete={onSecurityDeleted}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-4">
        {securities.map((security) => (
          <PositionPerformance key={security.id} security={security} />
        ))}
      </div>
    </div>
  );
} 