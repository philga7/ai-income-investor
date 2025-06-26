import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { SecurityLotFormData } from '@/types/lots';
import { toast } from 'sonner';
import Papa from 'papaparse';

interface CSVUploadProps {
  onLotsParsed: (lots: SecurityLotFormData[]) => void;
  onCancel: () => void;
}

interface CSVRow {
  open_date: string;
  quantity: string;
  price_per_share: string;
  notes?: string;
}

export function CSVUpload({ onLotsParsed, onCancel }: CSVUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<SecurityLotFormData[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const validateCSVRow = (row: any, rowIndex: number): CSVRow | null => {
    const errors: string[] = [];

    // Convert MM/DD/YYYY to YYYY-MM-DD if needed
    let openDate = row.open_date;
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(openDate)) {
      // mm/dd/yyyy or m/d/yyyy
      const [mm, dd, yyyy] = openDate.split('/');
      openDate = `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
    }

    // Check required fields
    if (!openDate) {
      errors.push(`Row ${rowIndex + 1}: Missing open_date`);
    }
    if (!row.quantity) {
      errors.push(`Row ${rowIndex + 1}: Missing quantity`);
    }
    if (!row.price_per_share) {
      errors.push(`Row ${rowIndex + 1}: Missing price_per_share`);
    }

    // Validate date format
    if (openDate) {
      const date = new Date(openDate);
      if (isNaN(date.getTime())) {
        errors.push(`Row ${rowIndex + 1}: Invalid date format for open_date`);
      }
    }

    // Validate numeric fields
    const quantity = Number(row.quantity);
    const pricePerShare = Number(row.price_per_share);
    
    if (isNaN(quantity) || quantity <= 0) {
      errors.push(`Row ${rowIndex + 1}: Invalid quantity "${row.quantity}" (must be a positive number)`);
    }
    if (isNaN(pricePerShare) || pricePerShare <= 0) {
      errors.push(`Row ${rowIndex + 1}: Invalid price_per_share "${row.price_per_share}" (must be a positive number)`);
    }

    if (errors.length > 0) {
      setErrors(prev => [...prev, ...errors]);
      return null;
    }

    return {
      open_date: openDate,
      quantity: quantity.toString(),
      price_per_share: pricePerShare.toString(),
      notes: row.notes || ''
    };
  };

  const parseCSV = (text: string): SecurityLotFormData[] => {
    const headerMap: Record<string, string> = {
      'opendate': 'open_date',
      'quantity': 'quantity',
      'price': 'price_per_share',
      'costshare': 'price_per_share',
      'cost/share': 'price_per_share',
      'pricepershare': 'price_per_share',
      'notes': 'notes',
    };
    const expectedHeaders = ['open_date', 'quantity', 'price_per_share'];

    // --- Auto-detect header row ---
    const allLines = text.split(/\r?\n/);
    let headerRowIdx = -1;
    let detectedHeaderFields: string[] = [];
    for (let i = 0; i < Math.min(10, allLines.length); i++) {
      const line = allLines[i];
      // Use PapaParse to parse this line as a header row
      const parsed = Papa.parse(line, { delimiter: ',', skipEmptyLines: true });
      if (!parsed.data || !parsed.data[0]) continue;
      const rawHeaders = (parsed.data[0] as string[]).map((h: string) => h.trim().replace(/^"(.+)"$/, '$1'));
      const normalized = rawHeaders.map((h: string) => {
        return (h || '').trim()
          .toLowerCase()
          .replace(/\s+/g, '')
          .replace(/[‐‑‒–—―]/g, '-')
          .replace(/[^a-z0-9/]/g, '');
      });
      const mapped = normalized.map(h => headerMap[h] || h);
      const missing = expectedHeaders.filter(h => !mapped.includes(h));
      if (missing.length === 0) {
        headerRowIdx = i;
        detectedHeaderFields = rawHeaders;
        break;
      }
    }
    if (headerRowIdx === -1) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Auto-detect header row failed. Here are the first 10 lines:', allLines.slice(0, 10));
      }
      for (let i = 0; i < Math.min(10, allLines.length); i++) {
        const line = allLines[i];
        const parsed = Papa.parse(line, { delimiter: ',', skipEmptyLines: true });
        if (!parsed.data || !parsed.data[0]) continue;
        const rawHeaders = (parsed.data[0] as string[]).map((h: string) => h.trim().replace(/^"(.+)"$/, '$1'));
        const normalized = rawHeaders.map((h: string) => {
          return (h || '').trim()
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[‐‑‒–—―]/g, '-')
            .replace(/[^a-z0-9/]/g, '');
        });
        const mapped = normalized.map(h => headerMap[h] || h);
        if (process.env.NODE_ENV === 'development') {
          console.log(`Line ${i}: rawHeaders=`, rawHeaders, 'normalized=', normalized, 'mapped=', mapped);
        }
      }
      throw new Error('Missing required headers. Please include columns named: Open Date, Quantity, and Cost/Share (case-insensitive, any order). Extra columns are allowed.');
    }

    // Remove all lines before the detected header row
    const chunk = allLines.slice(headerRowIdx).join('\n');

    const result = Papa.parse(chunk, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) =>
        header
          .trim()
          .replace(/^"(.+)"$/, '$1')
          .toLowerCase()
          .replace(/\s+/g, '')
          .replace(/[‐‑‒–—―]/g, '-')
          .replace(/[^a-z0-9/]/g, ''),
    });

    // Debug: log the detected headers
    if (process.env.NODE_ENV === 'development') {
      console.log('PapaParse detected headers:', result.meta.fields);
    }

    const rows = result.data as any[];
    setErrors([]);

    // Check for required headers (only first occurrence)
    const normalizedHeaders = (result.meta.fields || []) as string[];
    const seen = new Set<string>();
    const mappedHeaders: string[] = [];
    for (const h of normalizedHeaders) {
      const mapped = headerMap[h] || h;
      if (!seen.has(mapped)) {
        mappedHeaders.push(mapped);
        seen.add(mapped);
      }
    }
    const missingHeaders = expectedHeaders.filter(h => !mappedHeaders.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error('Missing required headers. Please include columns named: Open Date, Quantity, and Cost/Share (case-insensitive, any order). Extra columns are allowed.');
    }

    const lots: SecurityLotFormData[] = [];
    rows.forEach((row, i) => {
      // Build a mapped row with internal field names and clean values
      const mappedRow: any = {};
      for (const [key, value] of Object.entries(row)) {
        const mappedKey = headerMap[key] || key;
        let cleanValue = typeof value === 'string' ? value.trim().replace(/^"(.+)"$/, '$1') : String(value ?? '');
        // Remove $ for price fields and strip commas
        if (mappedKey === 'price_per_share' || mappedKey === 'quantity') {
          cleanValue = cleanValue.replace(/\$/g, '').replace(/,/g, '');
        }
        mappedRow[mappedKey] = cleanValue;
      }
      const validatedRow = validateCSVRow(mappedRow, i);
      if (validatedRow) {
        lots.push(validatedRow);
      }
    });

    if (lots.length === 0) {
      throw new Error('No valid lots found in CSV file');
    }

    return lots;
  };

  const handleFileSelect = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setIsProcessing(true);
    setErrors([]);
    setPreviewData([]);

    try {
      const text = await file.text();
      const lots = parseCSV(text);
      setPreviewData(lots);
      
      if (errors.length > 0) {
        toast.warning(`Parsed ${lots.length} lots with ${errors.length} warnings`);
      } else {
        toast.success(`Successfully parsed ${lots.length} lots`);
      }

      // Scroll to results section after processing
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    } catch (error) {
      console.error('CSV Import Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to parse CSV file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleConfirm = () => {
    if (previewData.length > 0) {
      onLotsParsed(previewData);
    }
  };

  const downloadTemplate = () => {
    const template = `open_date,quantity,price_per_share,notes
2024-01-15,100,150.00,Bought during market dip
2024-02-01,50,155.25,Dividend reinvestment
2024-03-10,75,148.75,Regular purchase
2024-04-15,0.25,152.50,DRIP fractional share
2024-05-01,0.5,149.75,Small DRIP purchase`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    // Use a more test-safe approach
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'lot_template.csv';
      a.style.display = 'none';
      
      // Only append to body if we're in a browser environment
      if (typeof document !== 'undefined' && document.body) {
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      
      URL.revokeObjectURL(url);
    } catch (error) {
      // Fallback for test environments
      console.warn('Download template failed:', error);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Upload CSV File</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadTemplate}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Download Template
        </Button>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop a CSV file here, or{' '}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-primary hover:underline"
          >
            browse
          </button>
        </p>
        <p className="text-xs text-muted-foreground">
          Expected columns: open_date, quantity, price_per_share, notes (optional)
          <br />
          Supports fractional shares (e.g., 0.25 for DRIP purchases)
        </p>
      </div>

      {isProcessing && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Processing CSV file...</p>
        </div>
      )}

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">CSV parsing warnings:</p>
              <ul className="text-sm space-y-1">
                {errors.slice(0, 5).map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
                {errors.length > 5 && (
                  <li>• ... and {errors.length - 5} more warnings</li>
                )}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {previewData.length > 0 && (
        <div ref={resultsRef} className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">
              Preview: {previewData.length} lots ready to import
            </span>
          </div>
          
          <div className="max-h-40 overflow-y-auto border rounded-lg p-3 bg-muted/50">
            <div className="space-y-2">
              {previewData.slice(0, 3).map((lot, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">Lot {index + 1}:</span>{' '}
                  {lot.open_date} - {lot.quantity} shares @ ${lot.price_per_share}
                  {lot.notes && ` (${lot.notes})`}
                </div>
              ))}
              {previewData.length > 3 && (
                <div className="text-sm text-muted-foreground">
                  ... and {previewData.length - 3} more lots
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleConfirm} size="sm">
              Import {previewData.length} Lots
            </Button>
            <Button variant="outline" onClick={onCancel} size="sm">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 