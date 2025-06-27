import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PortfolioSummary } from '@/components/dashboard/portfolio-summary';
// import { mockSupabaseClient } from '../../lib/mock-supabase';
import { portfolioAnalyticsService } from '@/services/portfolioAnalyticsService';
import { dividendService } from '@/services/dividendService';
import { Security, Portfolio } from '@/services/portfolioService';

jest.mock('@/lib/supabase', () => ({
  supabase: require('../../lib/mock-supabase').mockSupabaseClient,
}));

const createMockSecurity = (overrides: Partial<Security>): Security => ({
  id: 'default-id',
  ticker: 'DEFAULT',
  name: 'Default Security',
  sector: 'Default Sector',
  industry: 'Default Industry',
  price: 100,
  prev_close: 99,
  open: 101,
  volume: 1000000,
  market_cap: 1000000000,
  pe: 20,
  eps: 5,
  dividend: 2,
  yield: 2,
  dividend_growth_5yr: 0.05,
  payout_ratio: 0.4,
  sma200: 'above',
  tags: [],
  day_low: 99.5,
  day_high: 101.5,
  fifty_two_week_low: 80,
  fifty_two_week_high: 120,
  average_volume: 1200000,
  forward_pe: 18,
  price_to_sales_trailing_12_months: 5,
  beta: 1.1,
  fifty_day_average: 98,
  two_hundred_day_average: 95,
  ex_dividend_date: new Date().toISOString(),
  operating_cash_flow: 100000000,
  free_cash_flow: 50000000,
  cash_flow_growth: 0.1,
  ...overrides,
});

// Mock data for testing
const mockPortfolio = {
  id: '1',
  name: 'My Portfolio',
  description: 'Test portfolio',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  portfolio_securities: [
    {
      id: '1',
      shares: 100,
      average_cost: 150.00,
      security: createMockSecurity({
        id: '1',
        ticker: 'AAPL',
        name: 'Apple Inc.',
        sector: 'Technology',
        price: 175.50,
        yield: 0.52, // yield is in percent
        prev_close: 170.00,
        market_cap: 3000000000000,
        pe: 30,
      })
    },
    {
      id: '2',
      shares: 50,
      average_cost: 200.00,
      security: createMockSecurity({
        id: '2',
        ticker: 'ABBV',
        name: 'AbbVie Inc.',
        sector: 'Healthcare',
        price: 180.00,
        yield: 3.48, // yield is in percent
        prev_close: 182.00,
        market_cap: 300000000000,
        pe: 20,
      })
    }
  ]
};

// Transform to match what the service expects
const transformedPortfolio: Portfolio = {
  ...mockPortfolio,
  securities: mockPortfolio.portfolio_securities.map((ps) => ({
    id: ps.id,
    shares: Number(ps.shares),
    average_cost: Number(ps.average_cost),
    security: {
      ...ps.security,
      price: Number(ps.security.price),
      yield: Number(ps.security.yield),
    }
  }))
};


describe('PortfolioSummary', () => {
  beforeEach(() => {
    const { mockSupabaseClient } = require('../../lib/mock-supabase');
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [mockPortfolio],
          error: null,
        }),
      }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('displays loading state initially', () => {
    render(<PortfolioSummary />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays portfolio summary data correctly after loading', async () => {
    render(<PortfolioSummary />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Test card title and description
    expect(screen.getByText('Portfolio Summary')).toBeInTheDocument();
    expect(screen.getByText('Your investment overview')).toBeInTheDocument();

    // Calculate expected values
    const analytics = portfolioAnalyticsService.calculatePortfolioAnalytics(transformedPortfolio);
    const { valueMetrics, dividendMetrics } = analytics;

    const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    const formatPercentage = (value: number) => `${value.toFixed(2)}%`;

    // Test Value tab content
    expect(screen.getByText('Total Value')).toBeInTheDocument();
    const totalValueElements = screen.getAllByText(formatCurrency(valueMetrics.totalValue));
    expect(totalValueElements.length).toBeGreaterThan(0);
    expect(totalValueElements[0]).toBeInTheDocument();

    // Test Yield tab content
    const yieldTab = screen.getByRole('tab', { name: 'Yield' });
    await act(async () => {
      await userEvent.click(yieldTab);
    });
    
    await waitFor(() => {
        expect(screen.getByText('Avg. Yield')).toBeInTheDocument();
        const avgYield = screen.getByText(formatPercentage(dividendMetrics.portfolioYield));
        expect(avgYield).toBeInTheDocument();
    });

    // Test Income tab content
    const incomeTab = screen.getByRole('tab', { name: 'Income' });
    await act(async () => {
      await userEvent.click(incomeTab);
    });
    
    await waitFor(() => {
      expect(screen.getByText('Annual Income')).toBeInTheDocument();
      const annualIncome = screen.getByText(formatCurrency(dividendMetrics.totalAnnualDividend));
      expect(annualIncome).toBeInTheDocument();
    });
  });

  it('displays "No portfolios found" message when there are no portfolios', async () => {
    const { mockSupabaseClient } = require('../../lib/mock-supabase');
    mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

    render(<PortfolioSummary />);

    await waitFor(() => {
      expect(screen.getByText('No portfolios found')).toBeInTheDocument();
    });
  });

  it('displays icons correctly', async () => {
    render(<PortfolioSummary />);

    await waitFor(() => {
        expect(screen.getByTestId('dollar-sign-icon')).toBeInTheDocument();
    });

    // Test Value tab icons
    expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument();

    // Test Income tab icons
    const incomeTab = screen.getByRole('tab', { name: 'Income' });
    await act(async () => {
      await userEvent.click(incomeTab);
    });
    
    await waitFor(() => {
      expect(screen.getByTestId('calculator-icon')).toBeInTheDocument();
    });
  });
}); 