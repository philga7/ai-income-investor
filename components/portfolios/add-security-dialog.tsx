import { useState, useRef, useEffect } from 'react';
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

interface AddSecurityDialogProps {
  portfolioId: string;
  onSecurityAdded?: () => void;
  existingTickers?: string[];
}

export function AddSecurityDialog({ portfolioId, onSecurityAdded, existingTickers = [] }: AddSecurityDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedSecurity, setSelectedSecurity] = useState<SearchResult | null>(null);
  const [formData, setFormData] = useState({
    shares: '',
    averageCost: '',
  });

  // Ref for Number of Shares input
  const sharesInputRef = useRef<HTMLInputElement>(null);

  // Focus Number of Shares input when a security is selected
  useEffect(() => {
    if (selectedSecurity && sharesInputRef.current) {
      sharesInputRef.current.focus();
    }
  }, [selectedSecurity]);

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

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/portfolios/${portfolioId}/securities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ticker: selectedSecurity.symbol,
          shares: parseInt(formData.shares),
          average_cost: parseFloat(formData.averageCost),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add security');
      }

      toast.success('Security added successfully');
      onSecurityAdded?.();
      setIsOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedSecurity(null);
      setFormData({ shares: '', averageCost: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add security');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Add Security</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Add Security</DialogTitle>
          <DialogDescription>
            Search for a security to add to your portfolio
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
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
                    {searchResults.map((security) => {
                      const alreadyAdded = existingTickers.includes(security.symbol);
                      return (
                        <TableRow key={security.symbol}>
                          <TableCell className="font-medium">{security.symbol}</TableCell>
                          <TableCell>{security.shortname || security.longname}</TableCell>
                          <TableCell>{security.exchange}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{security.quoteType}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSecurity(security)}
                              disabled={alreadyAdded}
                              title={alreadyAdded ? 'Already in portfolio' : ''}
                            >
                              {alreadyAdded ? 'Added' : 'Select'}
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
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <h4 className="font-medium">Selected Security</h4>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedSecurity.symbol}</span>
                  <span className="text-muted-foreground">{selectedSecurity.shortname || selectedSecurity.longname}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Number of Shares</label>
                  <Input
                    ref={sharesInputRef}
                    type="number"
                    min="1"
                    placeholder="e.g., 100"
                    value={formData.shares}
                    onChange={(e) => setFormData({ ...formData, shares: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Average Cost per Share</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g., 150.00"
                    value={formData.averageCost}
                    onChange={(e) => setFormData({ ...formData, averageCost: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddSecurity}
            disabled={isLoading || !selectedSecurity || !formData.shares || !formData.averageCost}
          >
            {isLoading ? 'Adding...' : 'Add Security'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 