"use client"

import { BarChart, ValueFormatter } from "@tremor/react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DividendHistoryProps {
  ticker: string;
}

interface DividendPayment {
  date: string;
  amount: number;
}

export function DividendHistory({ ticker }: DividendHistoryProps) {
  // Generate mock data for the past 5 years
  const generateDividendHistory = (): DividendPayment[] => {
    const history: DividendPayment[] = [];
    const today = new Date();
    
    // Base dividend amount based on ticker
    const baseDividend = ticker === "MSFT" ? 0.62 : 0.20;
    const growthRate = ticker === "MSFT" ? 0.10 : 0.08; // 10% or 8% annual growth
    
    // Generate quarterly dividends for 5 years
    for (let year = 0; year < 5; year++) {
      // Adjust dividend for growth each year
      const yearlyGrowthFactor = Math.pow(1 + growthRate, year);
      
      for (let quarter = 0; quarter < 4; quarter++) {
        const date = new Date(today.getFullYear() - 5 + year, quarter * 3, 15);
        const amount = baseDividend * yearlyGrowthFactor;
        
        history.push({
          date: date.toISOString().split('T')[0],
          amount: parseFloat(amount.toFixed(4)),
        });
      }
    }
    
    return history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };
  
  const dividendHistory = generateDividendHistory();
  
  // Prepare data for annual chart
  const annualData = dividendHistory.reduce((acc: any[], payment) => {
    const year = payment.date.split('-')[0];
    const existingYear = acc.find(item => item.year === year);
    
    if (existingYear) {
      existingYear.total += payment.amount;
    } else {
      acc.push({ 
        year, 
        total: payment.amount 
      });
    }
    
    return acc;
  }, []);
  
  // Format each year's total to have 2 decimal places
  annualData.forEach(item => {
    item.total = parseFloat(item.total.toFixed(2));
  });
  
  const valueFormatter: ValueFormatter = (value) => `$${value.toFixed(2)}`;
  
  return (
    <div className="space-y-6">
      <div className="h-80">
        <BarChart
          data={annualData}
          index="year"
          categories={["total"]}
          colors={["blue"]}
          valueFormatter={valueFormatter}
          yAxisWidth={60}
          showLegend={false}
          showAnimation={true}
          showGridLines={true}
          autoMinValue={true}
        />
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-4">Dividend Payment History</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payment Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Annual Rate</TableHead>
              <TableHead>YoY Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dividendHistory.slice(-8).reverse().map((payment, index) => {
              // Calculate annual rate (quarterly payment * 4)
              const annualRate = payment.amount * 4;
              
              // Calculate year-over-year change if we have data from a year ago
              let yoyChange = null;
              if (index < dividendHistory.slice(-8).length - 4) {
                const previousYearPayment = dividendHistory.slice(-8).reverse()[index + 4];
                yoyChange = ((payment.amount - previousYearPayment.amount) / previousYearPayment.amount) * 100;
              }
              
              return (
                <TableRow key={payment.date}>
                  <TableCell>
                    {new Date(payment.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>${payment.amount.toFixed(3)}</TableCell>
                  <TableCell>${annualRate.toFixed(2)}</TableCell>
                  <TableCell>
                    {yoyChange !== null ? (
                      <span className={yoyChange >= 0 ? "text-green-500" : "text-red-500"}>
                        {yoyChange >= 0 ? "+" : ""}{yoyChange.toFixed(1)}%
                      </span>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}