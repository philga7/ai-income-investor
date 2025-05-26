'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your application preferences and API integrations.
          </p>
        </div>
        
        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="api">API Keys</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio Rules</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Display Settings</CardTitle>
                <CardDescription>
                  Customize your application display preferences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <RadioGroup defaultValue="usd" id="currency">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="usd" id="usd" />
                      <Label htmlFor="usd">USD ($)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="eur" id="eur" />
                      <Label htmlFor="eur">EUR (€)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="gbp" id="gbp" />
                      <Label htmlFor="gbp">GBP (£)</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive dividend payment alerts
                    </p>
                  </div>
                  <Switch id="notifications" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autosave">Autosave</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save changes
                    </p>
                  </div>
                  <Switch id="autosave" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Integrations</CardTitle>
                <CardDescription>
                  Connect to external data providers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="perplexity-api">Perplexity API Key</Label>
                  <Input id="perplexity-api" type="password" placeholder="pk-..." />
                  <p className="text-xs text-muted-foreground">
                    Used for AI-powered investment analysis
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="market-data-api">Market Data API Key</Label>
                  <Input id="market-data-api" type="password" placeholder="Enter API key" />
                  <p className="text-xs text-muted-foreground">
                    Used for real-time market data
                  </p>
                </div>
                
                <Button className="w-full sm:w-auto">Save API Keys</Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="portfolio" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Rules</CardTitle>
                <CardDescription>
                  Configure your investment rules and guidelines.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="max-position">Maximum Position Size (%)</Label>
                  <Input
                    id="max-position"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    defaultValue="5"
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
                    max="5"
                    step="0.01"
                    defaultValue="1.67"
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended starting position (1/3 of max)
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sma-signal">Use SMA200 for Buy/Sell Signals</Label>
                    <p className="text-sm text-muted-foreground">
                      Buy below SMA200, sell above
                    </p>
                  </div>
                  <Switch id="sma-signal" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="stochastic-signal">Use Stochastic Oscillator</Label>
                    <p className="text-sm text-muted-foreground">
                      For confirmation of trading signals
                    </p>
                  </div>
                  <Switch id="stochastic-signal" defaultChecked />
                </div>
                
                <Button className="w-full sm:w-auto">Save Portfolio Rules</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}