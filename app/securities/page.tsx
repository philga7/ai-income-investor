'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight, AlertCircle, LineChart, Search, Filter } from "lucide-react";
import Link from "next/link";
import { ProtectedRoute } from '@/components/auth/protected-route';
import { securityService, Security } from '@/services/securityDataService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from '@/lib/auth';
import { SecuritiesListSkeleton } from '@/components/securities/SecuritiesListSkeleton';

export default function SecuritiesPage() {
  const [securities, setSecurities] = useState<Security[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    sector: 'all',
    minYield: 0,
    maxYield: 10,
    sma200: 'all' as 'above' | 'below' | 'all',
    sortBy: 'ticker' as 'ticker' | 'name' | 'yield' | 'price',
    sortOrder: 'asc' as 'asc' | 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    const fetchSecurities = async () => {
      if (!session?.access_token) {
        setLoading(false);
        return;
      }

      try {
        const data = await securityService.searchSecurities(searchQuery, {
          ...filters,
          sector: filters.sector === 'all' ? undefined : filters.sector,
          sma200: filters.sma200 === 'all' ? undefined : filters.sma200
        });
        setSecurities(data);
      } catch (error) {
        console.error('Error fetching securities:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchSecurities();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [session, searchQuery, filters]);

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-');
    setFilters(prev => ({
      ...prev,
      sortBy: newSortBy as 'ticker' | 'name' | 'yield' | 'price',
      sortOrder: newSortOrder as 'asc' | 'desc'
    }));
  };

  if (loading) {
    return <SecuritiesListSkeleton />;
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Securities</h1>
          </div>
          
          <div className="w-full md:w-auto flex gap-2">
            <div className="relative flex-1 md:w-[320px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search securities..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <Button>
              <LineChart className="mr-2 h-4 w-4" />
              AI Analyze
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sector</label>
                  <Select
                    value={filters.sector}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, sector: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Sectors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sectors</SelectItem>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Financial">Financial</SelectItem>
                      <SelectItem value="Consumer">Consumer</SelectItem>
                      <SelectItem value="Energy">Energy</SelectItem>
                      <SelectItem value="Utilities">Utilities</SelectItem>
                      <SelectItem value="Real Estate">Real Estate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Yield Range</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{filters.minYield}%</span>
                    <Slider
                      value={[filters.minYield, filters.maxYield]}
                      min={0}
                      max={10}
                      step={0.1}
                      onValueChange={([min, max]) => setFilters(prev => ({ ...prev, minYield: min, maxYield: max }))}
                      className="flex-1"
                    />
                    <span className="text-sm">{filters.maxYield}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">SMA-200</label>
                  <Select
                    value={filters.sma200}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, sma200: value as 'above' | 'below' | 'all' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="above">Above</SelectItem>
                      <SelectItem value="below">Below</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sort By</label>
                  <Select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onValueChange={handleSortChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ticker-asc">Ticker (A-Z)</SelectItem>
                      <SelectItem value="ticker-desc">Ticker (Z-A)</SelectItem>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                      <SelectItem value="yield-desc">Highest Yield</SelectItem>
                      <SelectItem value="yield-asc">Lowest Yield</SelectItem>
                      <SelectItem value="price-desc">Highest Price</SelectItem>
                      <SelectItem value="price-asc">Lowest Price</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticker</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Yield</TableHead>
                <TableHead className="text-right">SMA-200</TableHead>
                <TableHead className="hidden xl:table-cell">Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                // Group securities by SMA-200 status and sort within groups
                const belowSma200 = securities.filter(s => s.sma200 === 'below').sort((a, b) => a.ticker.localeCompare(b.ticker));
                const aboveSma200 = securities.filter(s => s.sma200 === 'above').sort((a, b) => a.ticker.localeCompare(b.ticker));
                const noSma200 = securities.filter(s => s.sma200 !== 'above' && s.sma200 !== 'below').sort((a, b) => a.ticker.localeCompare(b.ticker));
                
                // Combine in desired order: below, above, no data
                const orderedSecurities = [...belowSma200, ...aboveSma200, ...noSma200];
                
                return orderedSecurities.map((security) => (
                  <TableRow key={security.ticker} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link href={`/securities/${security.ticker}`} className="hover:underline block">
                        {security.ticker}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/securities/${security.ticker}`} className="block">
                        {security.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/securities/${security.ticker}`} className="block">
                        {security.sector}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/securities/${security.ticker}`} className="block">
                        ${security.price.toFixed(2)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/securities/${security.ticker}`} className="block">
                        {security.yield.toFixed(2)}%
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/securities/${security.ticker}`} className="block">
                        <Badge variant={security.sma200 === "above" ? "default" : "secondary"}>
                          {security.sma200 === "above" ? "Above" : security.sma200 === "below" ? "Below" : "N/A"}
                        </Badge>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <Link href={`/securities/${security.ticker}`} className="block">
                        <div className="flex flex-wrap gap-1">
                          {security.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </Link>
                    </TableCell>
                  </TableRow>
                ));
              })()}
            </TableBody>
          </Table>
        </div>
      </div>
    </ProtectedRoute>
  );
}