import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MarketOverview } from '@/components/dashboard/market-overview';
import { useAuth } from '@/lib/auth';

// Mock the auth hook
jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(),
}));

// Mock the financial service
jest.mock('@/services/financialService', () => ({
  SecurityQuote: jest.fn(),
}));

// Mock the fetchJson utility function
jest.mock('@/lib/api-utils', () => ({
  fetchJson: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('MarketOverview', () => {
  const mockUser = {
    id: 'mock-user-id',
    email: 'test@example.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    role: 'authenticated',
    email_confirmed_at: '2024-01-01T00:00:00Z',
    phone: undefined,
    confirmed_at: '2024-01-01T00:00:00Z',
    last_sign_in_at: '2024-01-01T00:00:00Z',
    banned_until: undefined,
    reauthentication_sent_at: undefined,
    recovery_sent_at: undefined,
    email_change_sent_at: undefined,
    new_email: undefined,
    invited_at: undefined,
    action_link: undefined,
    data: {},
  };

  const mockSession = {
    access_token: 'mock-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: mockUser,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      session: mockSession,
      user: mockUser,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      deleteAccount: jest.fn(),
      loading: false,
    });
  });

  it('renders loading state initially', () => {
    render(<MarketOverview />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders error state when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      session: null,
      user: null,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      deleteAccount: jest.fn(),
      loading: false,
    });

    render(<MarketOverview />);
    expect(screen.getByText('You must be logged in to view market data.')).toBeInTheDocument();
  });

  it('displays market data with points change and percentage change', async () => {
    // Import the mocked fetchJson function
    const { fetchJson } = require('@/lib/api-utils');
    const mockFetchJson = fetchJson as jest.MockedFunction<typeof fetchJson>;

    // Mock successful API responses for quotes
    mockFetchJson
      .mockResolvedValueOnce({
        symbol: '^GSPC',
        price: {
          regularMarketPrice: 4500.50,
          regularMarketChange: 25.75,
          regularMarketChangePercent: 0.0057,
        },
      })
      .mockResolvedValueOnce({
        symbol: '^DJI',
        price: {
          regularMarketPrice: 35000.25,
          regularMarketChange: -150.50,
          regularMarketChangePercent: -0.0043,
        },
      })
      .mockResolvedValueOnce({
        symbol: '^IXIC',
        price: {
          regularMarketPrice: 14000.75,
          regularMarketChange: 75.25,
          regularMarketChangePercent: 0.0054,
        },
      })
      // Mock historical data responses
      .mockResolvedValueOnce([{ date: '2024-01-01', close: 4500 }])
      .mockResolvedValueOnce([{ date: '2024-01-01', close: 35000 }])
      .mockResolvedValueOnce([{ date: '2024-01-01', close: 14000 }]);

    render(<MarketOverview />);

    await waitFor(() => {
      // Check that the indices are displayed
      expect(screen.getByText('S&P 500')).toBeInTheDocument();
      expect(screen.getByText('DJIA')).toBeInTheDocument();
      expect(screen.getByText('NASDAQ')).toBeInTheDocument();
    });

    await waitFor(() => {
      // Check for points change values
      expect(screen.getByText('+25.75')).toBeInTheDocument();
      expect(screen.getByText('-150.50')).toBeInTheDocument();
      expect(screen.getByText('+75.25')).toBeInTheDocument();
    });

    await waitFor(() => {
      // Check for percentage change values
      expect(screen.getByText('(+0.57%)')).toBeInTheDocument();
      expect(screen.getByText('(-0.43%)')).toBeInTheDocument();
      expect(screen.getByText('(+0.54%)')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    // Suppress expected error output
    const originalConsoleError = console.error;
    console.error = jest.fn();

    // Suppress unhandledRejection for this test
    const unhandledRejectionHandler = (reason: unknown) => {};
    process.on('unhandledRejection', unhandledRejectionHandler);

    // Import the mocked fetchJson function
    const { fetchJson } = require('@/lib/api-utils');
    const mockFetchJson = fetchJson as jest.MockedFunction<typeof fetchJson>;

    // Reject only the first call (quotes), resolve the rest (historical data)
    mockFetchJson
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValue([]);

    await act(async () => {
      render(<MarketOverview />);
    });

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });

    // Restore console.error
    console.error = originalConsoleError;
    // Remove unhandledRejection handler
    process.off('unhandledRejection', unhandledRejectionHandler);
  });
}); 