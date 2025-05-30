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

interface PortfolioSecuritiesProps {
  securities: PortfolioSecurity[];
  portfolioId: string;
  onSecurityDeleted?: () => void;
}

export function PortfolioSecurities({ securities, portfolioId, onSecurityDeleted }: PortfolioSecuritiesProps) {
  return (
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
            <TableHead className="text-right">Gain/Loss</TableHead>
            <TableHead className="text-right">Yield</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {securities.map((ps) => {
            const marketValue = ps.shares * ps.security.price;
            const costBasis = ps.shares * ps.average_cost;
            const gainLoss = marketValue - costBasis;
            const gainLossPercentage = (gainLoss / costBasis) * 100;

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
                <TableCell className={`text-right ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${gainLoss.toLocaleString()} ({gainLossPercentage.toFixed(2)}%)
                </TableCell>
                <TableCell className="text-right">{ps.security.yield.toFixed(2)}%</TableCell>
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
  );
} 