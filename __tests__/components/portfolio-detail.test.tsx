import { render, screen, act } from '@testing-library/react';
import { PortfolioDetail } from '@/app/portfolios/[id]/portfolio-detail';
import { useAuth } from '@/lib/auth';

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    })),
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: { access_token: 'mock-token' } } }))
    }
  }
}));

// Mock the auth hook
jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(),
}));

// Mock the portfolio service
jest.mock('@/services/portfolioService', () => ({
  portfolioService: {
    getPortfolio: jest.fn(),
    getSecurities: jest.fn(),
  },
}));

// Mock the portfolio analytics service
jest.mock('@/src/services/portfolioAnalyticsService', () => ({
  portfolioAnalyticsService: {
    calculatePortfolioAnalytics: jest.fn(() => ({
      totalValue: 0,
      totalCost: 0,
      totalGainLoss: 0,
      totalGainLossPercentage: 0,
      dividendMetrics: {
        securityDividends: {}
      }
    })),
    calculatePortfolioValue: jest.fn(() => ({
      totalValue: 0,
      totalCost: 0,
      totalGainLoss: 0,
      totalGainLossPercentage: 0
    })),
    formatCurrency: jest.fn((value) => `$${value}`),
    formatPercentage: jest.fn((value) => `${value}%`)
  }
}));

// Mock the performance metrics service
jest.mock('@/src/services/performanceMetricsService', () => ({
  performanceMetricsService: {
    calculatePerformanceMetrics: jest.fn(() => ({
      timeWeightedReturn: {
        daily: 0,
        weekly: 0,
        monthly: 0,
        quarterly: 0,
        yearly: 0,
        ytd: 0
      },
      riskMetrics: {
        volatility: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        maxDrawdown: 0
      },
      relativePerformance: {
        vsSpx500: 0,
        vsVti: 0,
        vsVym: 0
      },
      sectorAllocation: {}
    })),
    formatPercentage: jest.fn((value) => `${value}%`)
  }
}));

// Mock UI components
jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => <div data-testid="alert">{children}</div>,
  AlertDescription: ({ children }: { children: React.ReactNode }) => <div data-testid="alert-description">{children}</div>,
}));

jest.mock('@/components/ui/breadcrumb', () => ({
  BreadcrumbNav: ({ items }: { items: Array<{ label: string; href: string }> }) => (
    <div data-testid="breadcrumb">
      {items.map((item) => (
        <span key={item.href}>{item.label}</span>
      ))}
    </div>
  ),
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div data-testid="card-title">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div data-testid="card-content">{children}</div>,
}));

jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div data-testid="tabs">{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="tabs-trigger">{children}</div>,
  TabsContent: ({ children }: { children: React.ReactNode }) => <div data-testid="tabs-content">{children}</div>,
}));

jest.mock('@/components/ui/table', () => ({
  Table: ({ children }: { children: React.ReactNode }) => <table data-testid="table">{children}</table>,
  TableHeader: ({ children }: { children: React.ReactNode }) => <thead data-testid="table-header">{children}</thead>,
  TableBody: ({ children }: { children: React.ReactNode }) => <tbody data-testid="table-body">{children}</tbody>,
  TableRow: ({ children }: { children: React.ReactNode }) => <tr data-testid="table-row">{children}</tr>,
  TableHead: ({ children }: { children: React.ReactNode }) => <th data-testid="table-head">{children}</th>,
  TableCell: ({ children }: { children: React.ReactNode }) => <td data-testid="table-cell">{children}</td>,
}));

jest.mock('@/components/portfolios/delete-portfolio-dialog', () => ({
  DeletePortfolioDialog: () => <div data-testid="delete-portfolio-dialog" />,
}));

jest.mock('@/components/portfolios/delete-security-dialog', () => ({
  DeleteSecurityDialog: () => <div data-testid="delete-security-dialog" />,
}));

jest.mock('@/components/portfolios/edit-portfolio-dialog', () => ({
  EditPortfolioDialog: () => <div data-testid="edit-portfolio-dialog" />,
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('PortfolioDetail', () => {
  beforeEach(() => {
    // Mock auth hook to return a session
    (useAuth as jest.Mock).mockReturnValue({
      session: { access_token: 'mock-token' },
    });
    
    // Reset fetch mock
    (global.fetch as jest.Mock).mockReset();

    // Reset Supabase mocks
    jest.clearAllMocks();
  });

  it('should show loading state initially', async () => {
    // Mock Supabase to return empty data
    const mockSupabase = require('@/lib/supabase').supabase;
    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }));

    // Mock fetch to never resolve
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    await act(async () => {
      render(<PortfolioDetail portfolioId="123" />);
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show portfolio not found when portfolio is null', async () => {
    // Mock Supabase to return null for portfolio
    const mockSupabase = require('@/lib/supabase').supabase;
    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    }));

    // Mock fetch to return empty array for securities
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/securities')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(null),
      });
    });

    await act(async () => {
      render(<PortfolioDetail portfolioId="123" />);
    });

    // Wait for the loading state to disappear and check for "Portfolio not found"
    const notFoundText = await screen.findByText('Portfolio not found');
    expect(notFoundText).toBeInTheDocument();
  });

  it('should handle empty securities list', async () => {
    // Mock Supabase to return empty array for securities
    const mockSupabase = require('@/lib/supabase').supabase;
    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }));

    // Mock fetch to return a portfolio with empty securities
    (global.fetch as jest.Mock).mockImplementation(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        id: '123',
        name: 'Test Portfolio',
        description: 'Test Description',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        securities: []
      }),
    }));

    await act(async () => {
      render(<PortfolioDetail portfolioId="123" />);
    });

    // Wait for the loading state to disappear and check for portfolio name
    const portfolioTitles = await screen.findAllByTestId('card-title');
    expect(portfolioTitles.some(el => el.textContent === 'Test Portfolio')).toBe(true);

    // Check that the securities count is 0
    const securitiesCount = screen.getByText('0');
    expect(securitiesCount).toBeInTheDocument();
  });
}); 