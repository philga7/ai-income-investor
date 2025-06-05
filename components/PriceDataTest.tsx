import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SecurityQuote } from '../src/services/financialService';

export function PriceDataTest() {
  const [symbol, setSymbol] = useState('');
  const [priceData, setPriceData] = useState<SecurityQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPriceData = async () => {
    if (!symbol) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/quotes?symbol=${encodeURIComponent(symbol)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch price data');
      }
      const data = await response.json();
      setPriceData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Price Data Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Enter symbol (e.g., AAPL)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && fetchPriceData()}
          />
          <Button onClick={fetchPriceData} disabled={loading || !symbol}>
            {loading ? 'Loading...' : 'Fetch Price'}
          </Button>
        </div>

        {error && (
          <div className="text-red-500 mb-4">
            {error}
          </div>
        )}

        {priceData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Current Price</p>
                <p className="text-lg">${priceData.price.regularMarketPrice?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Change</p>
                <p className={`text-lg ${(priceData.price.regularMarketChange ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {priceData.price.regularMarketChange?.toFixed(2)} ({priceData.price.regularMarketChangePercent?.toFixed(2)}%)
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Day Range</p>
                <p className="text-lg">
                  ${priceData.price.regularMarketDayLow?.toFixed(2)} - ${priceData.price.regularMarketDayHigh?.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Volume</p>
                <p className="text-lg">{priceData.price.regularMarketVolume?.toLocaleString()}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Summary Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">52 Week Range</p>
                  <p className="text-lg">
                    ${priceData.summaryDetail?.fiftyTwoWeekLow?.toFixed(2)} - ${priceData.summaryDetail?.fiftyTwoWeekHigh?.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Average Volume</p>
                  <p className="text-lg">{priceData.summaryDetail?.averageVolume?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Forward P/E</p>
                  <p className="text-lg">{priceData.summaryDetail?.forwardPE?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Price/Sales (TTM)</p>
                  <p className="text-lg">{priceData.summaryDetail?.priceToSalesTrailing12Months?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Beta</p>
                  <p className="text-lg">{priceData.summaryDetail?.beta?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">50 Day Average</p>
                  <p className="text-lg">${priceData.summaryDetail?.fiftyDayAverage?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">200 Day Average</p>
                  <p className="text-lg">${priceData.summaryDetail?.twoHundredDayAverage?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Ex-Dividend Date</p>
                  <p className="text-lg">
                    {priceData.summaryDetail?.exDividendDate ? new Date(priceData.summaryDetail.exDividendDate * 1000).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Financial Data</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Target Price Range</p>
                  <p className="text-lg">
                    ${priceData.financialData?.targetLowPrice?.toFixed(2)} - ${priceData.financialData?.targetHighPrice?.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Analyst Recommendation</p>
                  <p className="text-lg capitalize">{priceData.financialData?.recommendationKey} ({priceData.financialData?.numberOfAnalystOpinions} analysts)</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Cash</p>
                  <p className="text-lg">${(priceData.financialData?.totalCash || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Total Debt</p>
                  <p className="text-lg">${(priceData.financialData?.totalDebt || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Current Ratio</p>
                  <p className="text-lg">{priceData.financialData?.currentRatio?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Quick Ratio</p>
                  <p className="text-lg">{priceData.financialData?.quickRatio?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Debt to Equity</p>
                  <p className="text-lg">{priceData.financialData?.debtToEquity?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Return on Equity</p>
                  <p className="text-lg">{(priceData.financialData?.returnOnEquity || 0).toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Profit Margin</p>
                  <p className="text-lg">{(priceData.financialData?.profitMargins || 0).toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Operating Margin</p>
                  <p className="text-lg">{(priceData.financialData?.operatingMargins || 0).toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Revenue Growth</p>
                  <p className="text-lg">{(priceData.financialData?.revenueGrowth || 0).toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Earnings Growth</p>
                  <p className="text-lg">{(priceData.financialData?.earningsGrowth || 0).toFixed(2)}%</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Cash Flow Data</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Operating Cash Flow</p>
                  <p className="text-lg">${(priceData.financialData?.operatingCashflow || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Free Cash Flow</p>
                  <p className="text-lg">${(priceData.financialData?.freeCashflow || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Net Income</p>
                  <p className="text-lg">
                    {priceData.cashflowStatementHistory?.cashflowStatements[0]?.netIncome 
                      ? `$${(priceData.cashflowStatementHistory.cashflowStatements[0].netIncome).toLocaleString()}`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Capital Expenditures</p>
                  <p className="text-lg">
                    {priceData.cashflowStatementHistory?.cashflowStatements[0]?.capitalExpenditures 
                      ? `$${(priceData.cashflowStatementHistory.cashflowStatements[0].capitalExpenditures).toLocaleString()}`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Asset Profile</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Sector</p>
                  <p className="text-lg">{priceData.assetProfile?.sector || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Industry</p>
                  <p className="text-lg">{priceData.assetProfile?.industry || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Website</p>
                  <p className="text-lg">
                    {priceData.assetProfile?.website ? (
                      <a href={priceData.assetProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                        {priceData.assetProfile.website}
                      </a>
                    ) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Full Time Employees</p>
                  <p className="text-lg">{priceData.assetProfile?.fullTimeEmployees?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-lg">
                    {[
                      priceData.assetProfile?.address1,
                      priceData.assetProfile?.city,
                      priceData.assetProfile?.state,
                      priceData.assetProfile?.zip,
                      priceData.assetProfile?.country
                    ].filter(Boolean).join(', ') || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-lg">{priceData.assetProfile?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Business Summary</p>
                  <p className="text-lg line-clamp-3">{priceData.assetProfile?.longBusinessSummary || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Risk Metrics</p>
                  <div className="space-y-1">
                    <p>Audit Risk: {priceData.assetProfile?.auditRisk || 'N/A'}</p>
                    <p>Board Risk: {priceData.assetProfile?.boardRisk || 'N/A'}</p>
                    <p>Compensation Risk: {priceData.assetProfile?.compensationRisk || 'N/A'}</p>
                    <p>Shareholder Rights Risk: {priceData.assetProfile?.shareHolderRightsRisk || 'N/A'}</p>
                    <p>Overall Risk: {priceData.assetProfile?.overallRisk || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 