import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LotSummaryProps {
  totalShares: number;
  totalCost: number;
  averageCost: number;
  currentPrice?: number;
}

export function LotSummary({ totalShares, totalCost, averageCost, currentPrice }: LotSummaryProps) {
  const marketValue = currentPrice ? totalShares * currentPrice : 0;
  const gainLoss = marketValue - totalCost;
  const gainLossPercentage = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Position Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Shares</p>
            <p className="text-2xl font-bold">{totalShares.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Average Cost</p>
            <p className="text-2xl font-bold">${averageCost.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Cost</p>
            <p className="text-xl font-semibold">${totalCost.toFixed(2)}</p>
          </div>
          {currentPrice && (
            <div>
              <p className="text-sm text-muted-foreground">Market Value</p>
              <p className="text-xl font-semibold">${marketValue.toFixed(2)}</p>
            </div>
          )}
        </div>

        {currentPrice && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Gain/Loss</p>
              <Badge 
                variant={gainLoss >= 0 ? "default" : "destructive"}
                className={gainLoss >= 0 ? "bg-green-100 text-green-800" : ""}
              >
                {gainLoss >= 0 ? '+' : ''}${gainLoss.toFixed(2)} ({gainLossPercentage >= 0 ? '+' : ''}{gainLossPercentage.toFixed(2)}%)
              </Badge>
            </div>
          </div>
        )}

        {totalShares > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Based on {totalShares} share{totalShares !== 1 ? 's' : ''} across {totalShares > 0 ? 'multiple' : '0'} lot{totalShares > 0 ? 's' : ''}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 