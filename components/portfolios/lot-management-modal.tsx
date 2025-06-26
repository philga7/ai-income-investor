import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { SecurityLot, SecurityLotFormData } from '@/types/lots';
import { lotService } from '@/src/services/lotService';
import { LotSummary } from './lot-summary';
import { CSVUpload } from './csv-upload';
import { format } from 'date-fns';

interface LotManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioId: string;
  securityId: string;
  securityTicker: string;
  securityName: string;
  currentPrice?: number;
  onLotsUpdated?: () => void;
}

export function LotManagementModal({
  isOpen,
  onClose,
  portfolioId,
  securityId,
  securityTicker,
  securityName,
  currentPrice,
  onLotsUpdated
}: LotManagementModalProps) {
  const [lots, setLots] = useState<SecurityLot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const [editForm, setEditForm] = useState<SecurityLotFormData>({
    open_date: '',
    quantity: '',
    price_per_share: '',
    notes: ''
  });
  const [newLotForm, setNewLotForm] = useState<SecurityLotFormData>({
    open_date: '',
    quantity: '',
    price_per_share: '',
    notes: ''
  });

  const loadLots = useCallback(async () => {
    setIsLoading(true);
    try {
      const lotsData = await lotService.getLotsForSecurity(portfolioId, securityId);
      setLots(lotsData);
    } catch (error) {
      toast.error('Failed to load lots');
      console.error('Error loading lots:', error);
    } finally {
      setIsLoading(false);
    }
  }, [portfolioId, securityId]);

  useEffect(() => {
    if (isOpen) {
      loadLots();
    }
  }, [isOpen, loadLots]);

  const handleEdit = (lot: SecurityLot) => {
    setIsEditing(lot.id);
    setEditForm({
      open_date: lot.open_date,
      quantity: lot.quantity.toString(),
      price_per_share: lot.price_per_share.toString(),
      notes: lot.notes || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!isEditing) return;

    try {
      await lotService.updateLot(isEditing, editForm);
      toast.success('Lot updated successfully');
      setIsEditing(null);
      loadLots();
      onLotsUpdated?.();
    } catch (error) {
      toast.error('Failed to update lot');
      console.error('Error updating lot:', error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setEditForm({
      open_date: '',
      quantity: '',
      price_per_share: '',
      notes: ''
    });
  };

  const handleDelete = async (lotId: string) => {
    if (!confirm('Are you sure you want to delete this lot?')) return;

    try {
      await lotService.deleteLot(lotId);
      toast.success('Lot deleted successfully');
      loadLots();
      onLotsUpdated?.();
    } catch (error) {
      toast.error('Failed to delete lot');
      console.error('Error deleting lot:', error);
    }
  };

  const handleAddLot = async () => {
    if (!newLotForm.open_date || !newLotForm.quantity || !newLotForm.price_per_share) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await lotService.createLots(portfolioId, securityId, [newLotForm]);
      toast.success('Lot added successfully');
      setIsAdding(false);
      setNewLotForm({
        open_date: '',
        quantity: '',
        price_per_share: '',
        notes: ''
      });
      loadLots();
      onLotsUpdated?.();
    } catch (error) {
      toast.error('Failed to add lot');
      console.error('Error adding lot:', error);
    }
  };

  const handleCSVLotsParsed = async (csvLots: SecurityLotFormData[]) => {
    try {
      await lotService.createLots(portfolioId, securityId, csvLots);
      toast.success(`${csvLots.length} lots imported successfully`);
      setIsUploadingCSV(false);
      loadLots();
      onLotsUpdated?.();
    } catch (error) {
      toast.error('Failed to import lots from CSV');
      console.error('Error importing CSV lots:', error);
    }
  };

  const totals = lotService.calculateTotalsFromLots(lots);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Manage Lots - {securityTicker}</DialogTitle>
          <DialogDescription>
            Manage purchase lots for {securityName} ({securityTicker})
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 min-h-0">
          {/* Summary Card */}
          <LotSummary 
            totalShares={totals.total_shares}
            totalCost={totals.total_cost}
            averageCost={totals.average_cost}
            currentPrice={currentPrice}
          />

          {/* Add New Lot */}
          {isAdding && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Add New Lot</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAdding(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Open Date</Label>
                  <Input
                    type="date"
                    value={newLotForm.open_date}
                    onChange={(e) => setNewLotForm({ ...newLotForm, open_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newLotForm.quantity}
                    onChange={(e) => setNewLotForm({ ...newLotForm, quantity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price per Share</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newLotForm.price_per_share}
                    onChange={(e) => setNewLotForm({ ...newLotForm, price_per_share: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={newLotForm.notes || ''}
                  onChange={(e) => setNewLotForm({ ...newLotForm, notes: e.target.value })}
                  rows={2}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleAddLot}>Add Lot</Button>
                <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* CSV Upload */}
          {isUploadingCSV && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Upload CSV File</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsUploadingCSV(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <CSVUpload 
                onLotsParsed={handleCSVLotsParsed}
                onCancel={() => setIsUploadingCSV(false)}
              />
            </div>
          )}

          {/* Lots Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Purchase Lots</h4>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUploadingCSV(true)}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdding(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Lot
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading lots...</p>
              </div>
            ) : lots.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No lots found for this security.</p>
                <p className="text-sm mt-2">Click &quot;Add Lot&quot; to manually add lots or &quot;Upload CSV&quot; to import from a file.</p>
              </div>
            ) : (
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Open Date</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Price per Share</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lots.map((lot) => (
                      <TableRow key={lot.id}>
                        {isEditing === lot.id ? (
                          <>
                            <TableCell>
                              <Input
                                type="date"
                                value={editForm.open_date}
                                onChange={(e) => setEditForm({ ...editForm, open_date: e.target.value })}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="1"
                                value={editForm.quantity}
                                onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={editForm.price_per_share}
                                onChange={(e) => setEditForm({ ...editForm, price_per_share: e.target.value })}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              ${(parseInt(editForm.quantity) * parseFloat(editForm.price_per_share)).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Textarea
                                value={editForm.notes || ''}
                                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                rows={1}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                                <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{format(new Date(lot.open_date), 'MMM dd, yyyy')}</TableCell>
                            <TableCell className="text-right">{lot.quantity.toLocaleString()}</TableCell>
                            <TableCell className="text-right">${lot.price_per_share.toFixed(2)}</TableCell>
                            <TableCell className="text-right">${lot.total_amount.toFixed(2)}</TableCell>
                            <TableCell>{lot.notes || '-'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(lot)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(lot.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 