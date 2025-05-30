import { render, screen, act } from '@testing-library/react';
import { PortfolioDetail } from '@/app/portfolios/[id]/portfolio-detail';
import { useAuth } from '@/lib/auth';

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

// Mock UI components
jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children }: { children: React.ReactNode }) => <div data-testid="alert">{children}</div>,
  AlertDescription: ({ children }: { children: React.ReactNode }) => <div data-testid="alert-description">{children}</div>,
}));

jest.mock('@/components/ui/breadcrumb', () => ({
  Breadcrumb: ({ items }: { items: Array<{ label: string; href: string }> }) => (
    <div data-testid="breadcrumb">
      {items.map((item) => (
        <span key={item.href}>{item.label}</span>
      ))}
    </div>
  ),
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
  });

  it('should show loading state initially', async () => {
    // Mock fetch to never resolve
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    await act(async () => {
      render(<PortfolioDetail portfolioId="123" />);
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show portfolio not found when portfolio is null', async () => {
    // Mock fetch to return null for portfolio
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
}); 