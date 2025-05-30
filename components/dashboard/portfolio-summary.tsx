"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { DollarSign, TrendingUp, Calculator } from "lucide-react";

export function PortfolioSummary() {
  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Portfolio Summary</CardTitle>
          <CardDescription>Your investment overview</CardDescription>
        </div>
        <DollarSign className="h-5 w-5 text-muted-foreground" data-testid="dollar-sign-icon" />
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="value">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="value">Value</TabsTrigger>
            <TabsTrigger value="yield">Yield</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
          </TabsList>
          <TabsContent value="value" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">$124,389.52</p>
              </div>
              <div className="flex items-center text-sm text-green-500">
                <TrendingUp className="mr-1 h-4 w-4" data-testid="trending-up-icon" />
                +2.5%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">Cash</p>
                <p className="font-medium">$12,450.00</p>
              </div>
              <Progress value={10} className="h-2" />
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">Equities</p>
                <p className="font-medium">$111,939.52</p>
              </div>
              <Progress value={90} className="h-2" />
            </div>
          </TabsContent>
          <TabsContent value="yield" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Yield</p>
                <p className="text-2xl font-bold">3.85%</p>
              </div>
              <div className="flex items-center text-sm text-green-500">
                <TrendingUp className="mr-1 h-4 w-4" />
                +0.2%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">Highest Yield</p>
                <p className="font-medium">ABBV - 5.2%</p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">Lowest Yield</p>
                <p className="font-medium">AAPL - 0.5%</p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="income" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Annual Income</p>
                <p className="text-2xl font-bold">$4,789.25</p>
              </div>
              <Calculator className="h-5 w-5 text-muted-foreground" data-testid="calculator-icon" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">YTD Received</p>
                <p className="font-medium">$2,345.67</p>
              </div>
              <Progress value={49} className="h-2" />
              <div className="flex items-center justify-between text-sm">
                <p className="text-muted-foreground">Next 30 Days</p>
                <p className="font-medium">$567.89</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}