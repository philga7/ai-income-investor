import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddSecurityDialog } from '@/components/portfolios/add-security-dialog';
import { MockProviders } from '@/__tests__/lib/mock-providers';

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: { access_token: 'mock-token' } } }))
    }
  }
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
  Toaster: () => null,
}));

describe('AddSecurityDialog', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock | undefined)?.mockReset?.();
    jest.clearAllMocks();
  });

  it('renders and opens dialog', () => {
    render(
      <MockProviders>
        <AddSecurityDialog portfolioId="test-portfolio" />
      </MockProviders>
    );
    expect(screen.getByText('Add Security')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Add Security'));
    expect(screen.getByText('Search for a security to add to your portfolio')).toBeInTheDocument();
  });

  it('shows loading and displays search results', async () => {
    (global.fetch as jest.Mock) = jest.fn((url) => {
      if (url.includes('/api/securities/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { symbol: 'AAPL', shortname: 'Apple', longname: 'Apple Inc.', exchange: 'NMS', quoteType: 'EQUITY' },
            { symbol: 'MSFT', shortname: 'Microsoft', longname: 'Microsoft Corp.', exchange: 'NMS', quoteType: 'EQUITY' }
          ])
        });
      }
      return Promise.reject('Unknown endpoint');
    });

    render(
      <MockProviders>
        <AddSecurityDialog portfolioId="test-portfolio" />
      </MockProviders>
    );
    fireEvent.click(screen.getByText('Add Security'));
    const input = screen.getByPlaceholderText('Search by symbol or company name...');
    fireEvent.change(input, { target: { value: 'AAPL' } });
    fireEvent.click(screen.getByText('Search'));
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('MSFT')).toBeInTheDocument();
    });
  });

  it('handles search error', async () => {
    (global.fetch as jest.Mock) = jest.fn(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: 'Search failed' })
    }));

    render(
      <MockProviders>
        <AddSecurityDialog portfolioId="test-portfolio" />
      </MockProviders>
    );
    fireEvent.click(screen.getByText('Add Security'));
    const input = screen.getByPlaceholderText('Search by symbol or company name...');
    fireEvent.change(input, { target: { value: 'FAIL' } });
    fireEvent.click(screen.getByText('Search'));
    await waitFor(() => {
      expect(require('sonner').toast.error).toHaveBeenCalledWith('Failed to search securities');
    });
  });

  it('allows selecting a security', async () => {
    (global.fetch as jest.Mock) = jest.fn((url) => {
      if (url.includes('/api/securities/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { symbol: 'AAPL', shortname: 'Apple', longname: 'Apple Inc.', exchange: 'NMS', quoteType: 'EQUITY' }
          ])
        });
      }
      return Promise.reject('Unknown endpoint');
    });

    render(
      <MockProviders>
        <AddSecurityDialog portfolioId="test-portfolio" />
      </MockProviders>
    );
    fireEvent.click(screen.getByText('Add Security'));
    const input = screen.getByPlaceholderText('Search by symbol or company name...');
    fireEvent.change(input, { target: { value: 'AAPL' } });
    fireEvent.click(screen.getByText('Search'));
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByText('Select')[0]);
    expect(screen.getByText('Selected Security')).toBeInTheDocument();
    expect(screen.getAllByText('AAPL').length).toBeGreaterThan(0);
  });
}); 