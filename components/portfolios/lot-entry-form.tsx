import { useState, useEffect, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, Upload, FileText } from 'lucide-react';
import { SecurityLotFormData } from '@/types/lots';
import { CSVUpload } from './csv-upload';

interface LotEntryFormProps {
  lots: SecurityLotFormData[];
  onChange: (lots: SecurityLotFormData[]) => void;
  onTotalsChange: (totals: { totalShares: number; totalCost: number; averageCost: number }) => void;
}

export function LotEntryForm({ lots, onChange, onTotalsChange }: LotEntryFormProps) {
  const [entryMode, setEntryMode] = useState<'manual' | 'csv'>('manual');

  const addLot = () => {
    const newLot: SecurityLotFormData = {
      open_date: '',
      quantity: '',
      price_per_share: '',
      notes: ''
    };
    onChange([...lots, newLot]);
  };

  const removeLot = (index: number) => {
    const newLots = lots.filter((_, i) => i !== index);
    onChange(newLots);
  };

  const updateLot = (index: number, field: keyof SecurityLotFormData, value: string) => {
    const newLots = [...lots];
    newLots[index] = { ...newLots[index], [field]: value };
    onChange(newLots);
  };

  const handleCSVLotsParsed = (csvLots: SecurityLotFormData[]) => {
    // If there are existing lots, append CSV lots to them
    const combinedLots = [...lots, ...csvLots];
    onChange(combinedLots);
    setEntryMode('manual'); // Switch back to manual mode after import
  };

  // Calculate totals whenever lots change
  const totals = useMemo(() => {
    const totalShares = lots.reduce((sum, lot) => {
      const quantity = parseFloat(lot.quantity) || 0;
      return sum + quantity;
    }, 0);

    const totalCost = lots.reduce((sum, lot) => {
      const quantity = parseFloat(lot.quantity) || 0;
      const price = parseFloat(lot.price_per_share) || 0;
      return sum + (quantity * price);
    }, 0);

    const averageCost = totalShares !== 0 ? totalCost / totalShares : 0;

    return {
      totalShares,
      totalCost,
      averageCost
    };
  }, [lots]);

  // Update parent component when totals change
  useEffect(() => {
    onTotalsChange(totals);
  }, [totals, onTotalsChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Purchase Lots</h4>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={entryMode === 'csv' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setEntryMode('csv')}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLot}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Lot
          </Button>
        </div>
      </div>

      {entryMode === 'csv' ? (
        <CSVUpload 
          onLotsParsed={handleCSVLotsParsed}
          onCancel={() => setEntryMode('manual')}
        />
      ) : (
        <>
          {lots.map((lot, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-medium">Lot {index + 1}</h5>
                {lots.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLot(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`open-date-${index}`}>Open Date</Label>
                  <Input
                    id={`open-date-${index}`}
                    type="date"
                    value={lot.open_date}
                    onChange={(e) => updateLot(index, 'open_date', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g., 100 or 0.25"
                    value={lot.quantity}
                    onChange={(e) => updateLot(index, 'quantity', e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports fractional shares (e.g., 0.25 for DRIP purchases)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`price-${index}`}>Price per Share</Label>
                  <Input
                    id={`price-${index}`}
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g., 150.00"
                    value={lot.price_per_share}
                    onChange={(e) => updateLot(index, 'price_per_share', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`notes-${index}`}>Notes (Optional)</Label>
                <Textarea
                  id={`notes-${index}`}
                  placeholder="e.g., Bought during dip, dividend reinvestment, etc."
                  value={lot.notes || ''}
                  onChange={(e) => updateLot(index, 'notes', e.target.value)}
                  rows={2}
                />
              </div>

              {/* Show lot total */}
              {lot.quantity && lot.price_per_share && (
                <div className="text-sm text-muted-foreground">
                  Lot Total: ${(parseFloat(lot.quantity) * parseFloat(lot.price_per_share)).toFixed(2)}
                </div>
              )}
            </div>
          ))}

          {lots.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No lots added yet. Click &quot;Add Lot&quot; to get started or &quot;Upload CSV&quot; to import from a file.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
} 