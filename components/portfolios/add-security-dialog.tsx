import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { financialService } from '@/services/financialService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SearchResult } from '@/lib/financial/api/yahoo/types';
import { SecurityLotFormData } from '@/types/lots';
import { LotEntryForm } from './lot-entry-form';
import { LotSummary } from './lot-summary';
import { lotService } from '@/src/services/lotService';

interface AddSecurityDialogProps {
  portfolioId: string;
  onSecurityAdded?: () => void;
  existingTickers?: string[];
  mode?: 'cash';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddSecurityDialog({ portfolioId, onSecurityAdded, existingTickers = [], mode, open, onOpenChange }: AddSecurityDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof open === 'boolean' && typeof onOpenChange === 'function';
  const dialogOpen = isControlled ? open : internalOpen;
  const setDialogOpen = isControlled ? onOpenChange! : setInternalOpen;

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedSecurity, setSelectedSecurity] = useState<SearchResult | null>(null);
  const [lots, setLots] = useState<SecurityLotFormData[]>([
    {
      open_date: '',
      quantity: '',
      price_per_share: '',
      notes: ''
    }
  ]);
  const [totals, setTotals] = useState({
    totalShares: 0,
    totalCost: 0,
    averageCost: 0
  });

  const selectedSecurityRef = useRef<HTMLDivElement>(null);

  // Scroll to selected security section when security is selected
  useEffect(() => {
    if (selectedSecurity && selectedSecurityRef.current) {
      setTimeout(() => {
        selectedSecurityRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100); // Small delay to ensure the section is rendered
    }
  }, [selectedSecurity]);

  // If mode is 'cash', pre-fill and lock fields
  useEffect(() => {
    if (mode === 'cash' && dialogOpen) {
      setSearchQuery('CASH');
      setSelectedSecurity({
        symbol: 'CASH',
        shortname: 'Cash',
        longname: 'Cash',
        exchange: 'CASH',
        quoteType: 'CASH',
        score: 1,
        typeDisp: 'Cash',
        isYahooFinance: false
      });
      setLots([{
        open_date: '',
        quantity: '',
        price_per_share: '1.00',
        notes: ''
      }]);
      setTotals({
        totalShares: 0,
        totalCost: 0,
        averageCost: 1.00
      });
    }
  }, [mode, dialogOpen]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/securities/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to search securities');
      }

      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      toast.error('Failed to search securities');
      console.error('Error searching securities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSecurity = async () => {
    if (!selectedSecurity) return;

    // Validate lots
    const validLots = lots.filter(lot => 
      lot.open_date && lot.quantity && lot.price_per_share
    );

    if (validLots.length === 0) {
      toast.error('Please add at least one valid lot');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token found');
      }

      // First, ensure the security exists in the database
      const response = await fetch(`/api/portfolios/${portfolioId}/securities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ticker: selectedSecurity.symbol,
          shares: totals.totalShares,
          average_cost: totals.averageCost,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add security');
      }

      const portfolioSecurity = await response.json();

      // Now create the lots
      await lotService.createLots(portfolioId, portfolioSecurity.security_id, validLots);

      toast.success('Security added successfully with lots');
      onSecurityAdded?.();
      setDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add security');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedSecurity(null);
    setLots([{
      open_date: '',
      quantity: '',
      price_per_share: '',
      notes: ''
    }]);
    setTotals({
      totalShares: 0,
      totalCost: 0,
      averageCost: 0
    });
  };

  const handleTotalsChange = useCallback((newTotals: { totalShares: number; totalCost: number; averageCost: number }) => {
    setTotals(newTotals);
  }, []);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button>{mode === 'cash' ? 'Add Cash' : 'Add Security'}</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{mode === 'cash' ? 'Add Cash' : 'Add Security'}</DialogTitle>
          <DialogDescription>
            {mode === 'cash' ? 'Enter your cash balance for this portfolio.' : 'Search for a security and add purchase lots to your portfolio'}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {mode === 'cash' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ticker</label>
                  <Input value="CASH" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <Input value="Cash" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <Input value="1.00" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Dividend</label>
                  <Input value="0" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Yield</label>
                  <Input value="0" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cash Amount</label>
                  <Input
                    type="number"
                    min="0"
                    value={lots[0].quantity}
                    onChange={e => {
                      const val = e.target.value;
                      setLots([{ ...lots[0], quantity: val }]);
                      setTotals({ ...totals, totalShares: Number(val), totalCost: Number(val), averageCost: 1.00 });
                    }}
                    placeholder="Enter cash amount (e.g. 5000)"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by symbol or company name..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={isLoading}>
                Search
              </Button>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="border rounded-md overflow-x-auto overflow-y-hidden">
              <div className="max-h-[300px] overflow-y-auto min-w-[600px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-28">Symbol</TableHead>
                      <TableHead className="w-56">Name</TableHead>
                      <TableHead className="w-24">Exchange</TableHead>
                      <TableHead className="w-20">Type</TableHead>
                      <TableHead className="w-20 text-right"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((security, index) => {
                      const alreadyAdded = existingTickers.includes(security.symbol);
                      const uniqueKey = `${security.symbol}-${security.exchange}-${index}`;
                      return (
                        <TableRow key={uniqueKey}>
                          <TableCell className="font-medium">{security.symbol}</TableCell>
                          <TableCell>{security.shortname || security.longname}</TableCell>
                          <TableCell>{security.exchange}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{security.quoteType}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant={selectedSecurity?.symbol === security.symbol ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedSecurity(security)}
                              disabled={alreadyAdded}
                              title={alreadyAdded ? 'Already in portfolio' : ''}
                            >
                              {alreadyAdded ? 'Added' : selectedSecurity?.symbol === security.symbol ? 'Selected' : 'Select'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {selectedSecurity && (
            <div ref={selectedSecurityRef} className="space-y-6 border-t pt-4">
              <div className="space-y-2">
                <h4 className="font-medium">Selected Security</h4>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedSecurity.symbol}</span>
                  <span className="text-muted-foreground">{selectedSecurity.shortname || selectedSecurity.longname}</span>
                </div>
              </div>

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
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => setDialogOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (mode === 'cash') {
                setSelectedSecurity({
                  symbol: 'CASH',
                  shortname: 'Cash',
                  longname: 'Cash',
                  exchange: 'CASH',
                  quoteType: 'CASH',
                  score: 1,
                  typeDisp: 'Cash',
                  isYahooFinance: false
                });
                setTotals({
                  totalShares: Number(lots[0].quantity),
                  totalCost: Number(lots[0].quantity),
                  averageCost: 1.00
                });
                await handleAddSecurity();
              } else {
                await handleAddSecurity();
              }
            }}
            disabled={isLoading || (mode === 'cash' && (!lots[0].quantity || Number(lots[0].quantity) <= 0))}
          >
            {isLoading ? 'Adding...' : mode === 'cash' ? 'Add Cash' : 'Add Security'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 