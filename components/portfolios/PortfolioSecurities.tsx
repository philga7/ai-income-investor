import { useState } from 'react';
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
import { DeleteSecurityDialog } from './delete-security-dialog';
import { AddSecurityDialog } from './add-security-dialog';
import { PositionPerformanceModal } from './PositionPerformanceModal';
import { EditSecurityDialog } from './edit-security-dialog';
import { portfolioAnalyticsService } from "@/src/services/portfolioAnalyticsService";

interface PortfolioSecuritiesProps {
  securities: PortfolioSecurity[];
  portfolioId: string;
  onSecurityDeleted?: () => void;
  onSecurityAdded?: () => void;
}

export function PortfolioSecurities({ securities, portfolioId, onSecurityDeleted, onSecurityAdded }: PortfolioSecuritiesProps) {
  const [selectedSecurity, setSelectedSecurity] = useState<PortfolioSecurity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSecurityForEdit, setSelectedSecurityForEdit] = useState<PortfolioSecurity | null>(null);

  // Ensure securities is always an array to prevent mapping errors
  const safeSecurities = securities || [];
  
  const analytics = portfolioAnalyticsService.calculatePortfolioAnalytics({
    id: portfolioId,
    name: '',
    description: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    securities: safeSecurities
  });

  const handleRowClick = (security: PortfolioSecurity) => {
    setSelectedSecurity(security);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSecurity(null);
  };

  const handleEditSecurity = (security: PortfolioSecurity, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSecurityForEdit(security);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedSecurityForEdit(null);
  };

  const handleSecurityUpdated = () => {
    // Refresh the portfolio data when security is updated
    onSecurityAdded?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <AddSecurityDialog 
          portfolioId={portfolioId} 
          onSecurityAdded={onSecurityAdded}
          existingTickers={safeSecurities.map(s => s.security.ticker)}
        />
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
            {safeSecurities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                  No securities added to this portfolio yet. Click &quot;Add Security&quot; to get started.
                </TableCell>
              </TableRow>
            ) : (
              safeSecurities.map((ps) => {
                const marketValue = ps.shares * ps.security.price;
                const costBasis = ps.shares * ps.average_cost;
                const gainLoss = marketValue - costBasis;
                const gainLossPercentage = (gainLoss / costBasis) * 100;
                const securityDividend = analytics.dividendMetrics.securityDividends[ps.security.id];
                const securityValue = analytics.valueMetrics.securityValues[ps.security.id];

                return (
                  <TableRow 
                    key={ps.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleRowClick(ps)}
                  >
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
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleEditSecurity(ps, e)}
                          title="Edit Security & Lots"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
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
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Position Performance Modal */}
      <PositionPerformanceModal
        security={selectedSecurity}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      {/* Edit Security Dialog */}
      <EditSecurityDialog
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        portfolioId={portfolioId}
        security={selectedSecurityForEdit}
        onSecurityUpdated={handleSecurityUpdated}
      />
    </div>
  );
} 