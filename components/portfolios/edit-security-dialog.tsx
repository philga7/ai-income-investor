import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { PortfolioSecurity } from '@/services/portfolioService';
import { SecurityLotFormData, SecurityLot } from '@/types/lots';
import { LotEntryForm } from './lot-entry-form';
import { LotSummary } from './lot-summary';
import { lotService } from '@/src/services/lotService';

interface EditSecurityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioId: string;
  security: PortfolioSecurity | null;
  onSecurityUpdated?: () => void;
}

export function EditSecurityDialog({ 
  isOpen, 
  onClose, 
  portfolioId, 
  security, 
  onSecurityUpdated 
}: EditSecurityDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('security');
  const [formData, setFormData] = useState({
    shares: '',
    averageCost: '',
  });
  const [lots, setLots] = useState<SecurityLotFormData[]>([]);
  const [existingLots, setExistingLots] = useState<SecurityLot[]>([]);
  const [totals, setTotals] = useState({
    totalShares: 0,
    totalCost: 0,
    averageCost: 0
  });
  const [lotUpdateMode, setLotUpdateMode] = useState<'add' | 'replace'>('add');

  const loadExistingLots = useCallback(async () => {
    if (!security) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/portfolios/${portfolioId}/securities/${security.security.id}/lots`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const lotsData = await response.json();
        setExistingLots(lotsData);
      }
    } catch (error) {
      console.error('Error loading lots:', error);
    }
  }, [security, portfolioId]);

  // Load existing lots when security changes
  useEffect(() => {
    if (security && isOpen) {
      loadExistingLots();
      // Set form data based on whether there are existing lots
      if (existingLots.length > 0) {
        setFormData({
          shares: security.shares.toString(),
          averageCost: security.average_cost.toString(),
        });
      } else {
        setFormData({
          shares: '0',
          averageCost: '0.00',
        });
      }
      
      // Initialize with one empty lot if no lots exist yet
      if (lots.length === 0) {
        setLots([{
          open_date: '',
          quantity: '',
          price_per_share: '',
          notes: ''
        }]);
      }
    }
  }, [security, isOpen, existingLots.length, loadExistingLots, lots.length]);

  // Update form data when existing lots change
  useEffect(() => {
    if (security && existingLots.length === 0) {
      setFormData({
        shares: '0',
        averageCost: '0.00',
      });
    } else if (security && existingLots.length > 0) {
      setFormData({
        shares: security.shares.toString(),
        averageCost: security.average_cost.toString(),
      });
    }
  }, [security, existingLots.length]);

  // Calculate totals from existing lots and update totals state
  useEffect(() => {
    if (existingLots.length > 0) {
      const totalShares = existingLots.reduce((sum, lot) => sum + lot.quantity, 0);
      const totalCost = existingLots.reduce((sum, lot) => sum + (lot.quantity * lot.price_per_share), 0);
      const averageCost = totalShares > 0 ? totalCost / totalShares : 0;
      
      setTotals({
        totalShares,
        totalCost,
        averageCost
      });
    } else {
      // Reset totals to zero when no existing lots
      setTotals({
        totalShares: 0,
        totalCost: 0,
        averageCost: 0
      });
    }
  }, [existingLots]);

  const handleLotsUpdate = async () => {
    if (!security || lots.length === 0) return;

    // Validate lots
    const validLots = lots.filter(lot => 
      lot.open_date && lot.quantity && lot.price_per_share
    );

    if (validLots.length === 0) {
      toast.error('Please add at least one valid lot');
      return;
    }

    // Confirm destructive action if replacing all lots
    if (lotUpdateMode === 'replace' && existingLots.length > 0) {
      const confirmed = confirm(
        `Are you sure you want to replace all ${existingLots.length} existing lots with ${validLots.length} new lots? This action cannot be undone.`
      );
      if (!confirmed) return;
    }

    setIsLoading(true);
    try {
      if (lotUpdateMode === 'replace') {
        // Delete existing lots first
        for (const lot of existingLots) {
          await lotService.deleteLot(lot.id);
        }
      }

      // Create new lots
      await lotService.createLots(portfolioId, security.security.id, validLots);

      const action = lotUpdateMode === 'replace' ? 'replaced' : 'added';
      toast.success(`Lots ${action} successfully`);
      onSecurityUpdated?.();
      setActiveTab('security');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update lots');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTotalsChange = useCallback((newTotals: { totalShares: number; totalCost: number; averageCost: number }) => {
    // If we're in 'add' mode and there are existing lots, combine the totals
    if (lotUpdateMode === 'add' && existingLots.length > 0) {
      const existingTotalShares = existingLots.reduce((sum, lot) => sum + lot.quantity, 0);
      const existingTotalCost = existingLots.reduce((sum, lot) => sum + (lot.quantity * lot.price_per_share), 0);
      
      const combinedTotalShares = existingTotalShares + newTotals.totalShares;
      const combinedTotalCost = existingTotalCost + newTotals.totalCost;
      const combinedAverageCost = combinedTotalShares > 0 ? combinedTotalCost / combinedTotalShares : 0;
      
      setTotals({
        totalShares: combinedTotalShares,
        totalCost: combinedTotalCost,
        averageCost: combinedAverageCost
      });
    } else {
      // In 'replace' mode or no existing lots, use the new totals directly
      setTotals(newTotals);
    }
  }, [lotUpdateMode, existingLots]);

  const handleClose = () => {
    setActiveTab('security');
    setLots([]);
    setExistingLots([]);
    setLotUpdateMode('add');
    onClose();
  };

  if (!security) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit {security.security.ticker}</DialogTitle>
          <DialogDescription>
            View security details and manage purchase lots
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="security">Security Details</TabsTrigger>
              <TabsTrigger value="lots">Purchase Lots</TabsTrigger>
            </TabsList>

            <TabsContent value="security" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="shares">Number of Shares</Label>
                  <Input
                    id="shares"
                    type="number"
                    value={formData.shares}
                    readOnly
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    This value is calculated from your purchase lots
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="averageCost">Average Cost per Share</Label>
                  <Input
                    id="averageCost"
                    type="number"
                    value={formData.averageCost}
                    readOnly
                    className="bg-muted"
                  />
                  <p className="text-sm text-muted-foreground">
                    This value is calculated from your purchase lots
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="lots" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <LotEntryForm 
                    lots={lots}
                    onChange={setLots}
                    onTotalsChange={handleTotalsChange}
                  />
                </div>
                <div>
                  <LotSummary 
                    totalShares={totals.totalShares}
                    totalCost={totals.totalCost}
                    averageCost={totals.averageCost}
                  />
                </div>
              </div>

              {existingLots.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Current Lots</h4>
                  <div className="space-y-2">
                    {existingLots.map((lot) => (
                      <div key={lot.id} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>
                          {new Date(lot.open_date).toLocaleDateString()} - 
                          {lot.quantity} shares @ ${lot.price_per_share}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Total: ${(lot.quantity * lot.price_per_share).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    <h5 className="font-medium text-sm">How would you like to handle the new lots?</h5>
                    <RadioGroup value={lotUpdateMode} onValueChange={(value) => setLotUpdateMode(value as 'add' | 'replace')}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="add" id="add" />
                        <Label htmlFor="add" className="text-sm">
                          Add new lots to existing ones (recommended)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="replace" id="replace" />
                        <Label htmlFor="replace" className="text-sm text-destructive">
                          Replace all existing lots with new ones
                        </Label>
                      </div>
                    </RadioGroup>
                    
                    {lotUpdateMode === 'add' && (
                      <p className="text-sm text-muted-foreground">
                        New lots will be added to your existing {existingLots.length} lot(s). Your total shares and average cost will be recalculated.
                      </p>
                    )}
                    
                    {lotUpdateMode === 'replace' && (
                      <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                        ⚠️ Warning: This will permanently delete all {existingLots.length} existing lot(s) and replace them with {lots.length} new lot(s). This action cannot be undone.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          {activeTab === 'lots' && (
            <Button
              onClick={handleLotsUpdate}
              disabled={isLoading}
              variant={lotUpdateMode === 'replace' ? 'destructive' : 'default'}
            >
              {isLoading ? 'Updating...' : lotUpdateMode === 'replace' ? 'Replace All Lots' : 'Add Lots'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 