"use client"

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Plus,
  Trash2,
  Edit,
  Calendar,
  Target
} from 'lucide-react';
import { PortfolioSecurity } from '@/services/portfolioService';
import { AddSecurityDialog } from './add-security-dialog';
import { DeleteSecurityDialog } from './delete-security-dialog';
import { EditSecurityDialog } from './edit-security-dialog';
import { dividendService } from '@/src/services/dividendService';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DividendSecuritiesProps {
  securities: PortfolioSecurity[];
  portfolioId: string;
  onSecurityDeleted: () => void;
  onSecurityAdded: () => void;
}

export function DividendSecurities({ 
  securities, 
  portfolioId, 
  onSecurityDeleted, 
  onSecurityAdded 
}: DividendSecuritiesProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedSecurity, setSelectedSecurity] = useState<PortfolioSecurity | null>(null);
  const [showAddCashDialog, setShowAddCashDialog] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getDividendReliability = (security: PortfolioSecurity) => {
    const payoutRatio = security.security.payout_ratio || 0;
    const growthRate = security.security.dividend_growth_5yr || 0;
    const dividendYield = security.security.yield || 0;

    if (payoutRatio < 60 && growthRate > 2 && dividendYield > 2) return 'high';
    if (payoutRatio < 80 && growthRate > 0) return 'medium';
    return 'low';
  };

  const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getGrowthIcon = (growthRate: number) => {
    if (growthRate > 3) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (growthRate > 0) return <TrendingUp className="h-4 w-4 text-blue-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const handleDeleteSecurity = (security: PortfolioSecurity) => {
    setSelectedSecurity(security);
    setShowDeleteDialog(true);
  };

  const handleEditSecurity = (security: PortfolioSecurity) => {
    setSelectedSecurity(security);
    setShowEditDialog(true);
  };

  const dividendSecurities = securities.filter(s => s.security.dividend && s.security.dividend > 0);
  const nonDividendSecurities = securities.filter(s => !s.security.dividend || s.security.dividend === 0);

  const hasCash = securities.some(s => s.security.ticker === 'CASH');

  return (
    <div className="space-y-6">
      {/* Dividend Securities Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Dividend-Paying Securities
              </CardTitle>
              <CardDescription>
                {dividendSecurities.length} securities generating income
              </CardDescription>
            </div>
            <div className="flex gap-2 justify-end">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button onClick={() => setShowAddCashDialog(true)} size="sm" variant="secondary" disabled={hasCash}>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Add Cash
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {hasCash ? 'Cash already added to this portfolio' : 'Add a cash position to your portfolio'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button onClick={() => setShowAddDialog(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Security
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dividendSecurities.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No dividend-paying securities</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add dividend stocks to start generating income
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Security</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Market Value</TableHead>
                  <TableHead>Dividend Yield</TableHead>
                  <TableHead>Annual Income</TableHead>
                  <TableHead>Growth Rate</TableHead>
                  <TableHead>Reliability</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dividendSecurities.map((security) => {
                  const isCash = security.security.ticker === 'CASH';
                  const marketValue = security.shares * security.security.price;
                  const annualIncome = marketValue * (security.security.yield / 100);
                  const reliability = getDividendReliability(security);
                  
                  return (
                    <TableRow key={security.security.id}
                      className={isCash ? 'bg-green-900/30 border-l-4 border-green-500' : ''}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isCash && <DollarSign className="h-5 w-5 text-green-600" />}
                          <div>
                            <div className="font-medium">{security.security.ticker}</div>
                            {!isCash && <div className="text-sm text-muted-foreground">{security.security.name}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{isCash ? '' : security.shares.toLocaleString()}</TableCell>
                      <TableCell>{isCash ? '' : formatCurrency(security.security.price)}</TableCell>
                      <TableCell>{isCash ? formatCurrency(security.shares) : formatCurrency(marketValue)}</TableCell>
                      {/* For CASH, render empty cells for all hidden columns to align the edit icon */}
                      {isCash ? (
                        <TableCell />
                      ) : (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3 text-muted-foreground" />
                            {formatPercentage(security.security.yield)}
                          </div>
                        </TableCell>
                      )}
                      {isCash ? (
                        <TableCell />
                      ) : (
                        <TableCell>
                          <div className="font-medium text-green-600">
                            {formatCurrency(annualIncome)}
                          </div>
                        </TableCell>
                      )}
                      {isCash ? (
                        <TableCell />
                      ) : (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getGrowthIcon(security.security.dividend_growth_5yr || 0)}
                            <span>{formatPercentage(security.security.dividend_growth_5yr || 0)}</span>
                          </div>
                        </TableCell>
                      )}
                      {isCash ? (
                        <TableCell />
                      ) : (
                        <TableCell>
                          <Badge className={getReliabilityColor(reliability)}>
                            {reliability.charAt(0).toUpperCase() + reliability.slice(1)}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditSecurity(security)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!isCash && (
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteSecurity(security)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Non-Dividend Securities Section */}
      {nonDividendSecurities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Non-Dividend Securities
            </CardTitle>
            <CardDescription>
              {nonDividendSecurities.length} securities not generating income
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Security</TableHead>
                  <TableHead>Shares</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Market Value</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nonDividendSecurities.map((security) => {
                  const marketValue = security.shares * security.security.price;
                  
                  return (
                    <TableRow key={security.security.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{security.security.ticker}</div>
                          <div className="text-sm text-muted-foreground">{security.security.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>{security.shares.toLocaleString()}</TableCell>
                      <TableCell>{formatCurrency(security.security.price)}</TableCell>
                      <TableCell>{formatCurrency(marketValue)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSecurity(security)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSecurity(security)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <AddSecurityDialog
        portfolioId={portfolioId}
        onSecurityAdded={() => {
          setShowAddCashDialog(false);
          onSecurityAdded();
        }}
        mode="cash"
        open={showAddCashDialog}
        onOpenChange={setShowAddCashDialog}
      />
      <AddSecurityDialog
        portfolioId={portfolioId}
        onSecurityAdded={() => {
          setShowAddDialog(false);
          onSecurityAdded();
        }}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />

      {selectedSecurity && (
        <>
          <DeleteSecurityDialog
            portfolioId={portfolioId}
            securityId={selectedSecurity.security.id}
            securityName={selectedSecurity.security.name}
            onDelete={() => {
              setSelectedSecurity(null);
              onSecurityDeleted();
            }}
          />

          <EditSecurityDialog
            isOpen={showEditDialog}
            onClose={() => setShowEditDialog(false)}
            portfolioId={portfolioId}
            security={selectedSecurity}
            onSecurityUpdated={() => {
              setShowEditDialog(false);
              setSelectedSecurity(null);
              onSecurityAdded(); // Refresh the list
            }}
          />
        </>
      )}
    </div>
  );
} 