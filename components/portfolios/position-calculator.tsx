"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PositionCalculatorProps {
  portfolioValue: number;
}

export function PositionCalculator({ portfolioValue }: PositionCalculatorProps) {
  const [ticker, setTicker] = useState("");
  const [price, setPrice] = useState<number | "">(0);
  const [maxPositionPercent, setMaxPositionPercent] = useState<number>(5);
  const [initialPositionPercent, setInitialPositionPercent] = useState<number>(1.67);
  
  // Calculate position sizes
  const maxPositionSize = portfolioValue * (maxPositionPercent / 100);
  const initialPositionSize = portfolioValue * (initialPositionPercent / 100);
  
  // Calculate share counts
  const maxShares = price ? Math.floor(maxPositionSize / (price as number)) : 0;
  const initialShares = price ? Math.floor(initialPositionSize / (price as number)) : 0;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Calculator className="h-4 w-4" />
        <p>Based on portfolio value: ${portfolioValue.toLocaleString()}</p>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ticker">Security Ticker</Label>
          <Input
            id="ticker"
            placeholder="e.g., AAPL"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="price">Current Price ($)</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={price}
            onChange={(e) => setPrice(e.target.value ? parseFloat(e.target.value) : "")}
          />
        </div>
      </div>
      
      <Separator className="my-4" />
      
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="max-position">Max Position Size (%)</Label>
          <Input
            id="max-position"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={maxPositionPercent}
            onChange={(e) => setMaxPositionPercent(parseFloat(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">
            Maximum allocation for any single position
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="initial-position">Initial Position Size (%)</Label>
          <Input
            id="initial-position"
            type="number"
            min="0"
            max={maxPositionPercent}
            step="0.01"
            value={initialPositionPercent}
            onChange={(e) => setInitialPositionPercent(parseFloat(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">
            Recommended starting position (1/3 of max)
          </p>
        </div>
      </div>
      
      <Separator className="my-4" />
      
      <div className="rounded-md bg-muted p-4">
        <h4 className="font-medium mb-2">Position Calculator Results</h4>
        
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Max Position ($)</p>
            <p className="text-lg font-semibold">${maxPositionSize.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {maxShares} shares @ ${price}
            </p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Initial Position ($)</p>
            <p className="text-lg font-semibold">${initialPositionSize.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {initialShares} shares @ ${price}
            </p>
          </div>
        </div>
        
        <Alert>
          <AlertTitle className="text-sm font-medium">Position Strategy</AlertTitle>
          <AlertDescription className="text-xs">
            Start with the initial position ({initialPositionPercent}%) and gradually build up to the maximum position ({maxPositionPercent}%) as the investment thesis proves out.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}