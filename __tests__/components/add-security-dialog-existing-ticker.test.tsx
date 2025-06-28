import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddSecurityDialog } from '@/components/portfolios/add-security-dialog';
import { MockProviders } from '@/__tests__/lib/mock-providers';

// Mock services
jest.mock('@/services/lotService');
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ 
        data: { session: { access_token: 'mock-token' } } 
      }))
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

describe('AddSecurityDialog Existing Ticker Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(); // Ensure a fresh mock instance for each test
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    cleanup();
  });

  it('should handle existing tickers validation', async () => {
    const user = userEvent.setup();

    // Mock successful search
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/securities/search')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { 
              symbol: 'AAPL', 
              shortname: 'Apple', 
              longname: 'Apple Inc.', 
              exchange: 'NMS', 
              quoteType: 'EQUITY' 
            }
          ])
        });
      }
      return Promise.reject('Unknown endpoint');
    });

    render(
      <MockProviders>
        <AddSecurityDialog 
          portfolioId="test-portfolio" 
          existingTickers={['AAPL']}
        />
      </MockProviders>
    );

    await user.click(screen.getByText('Add Security'));

    // Search for security
    const searchInput = screen.getByPlaceholderText('Search by symbol or company name...');
    await user.type(searchInput, 'AAPL');
    await user.click(screen.getByText('Search'));

    // Flush microtasks
    await new Promise(res => setTimeout(res, 0));

    // Wait for search results to appear
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('Apple')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Wait for the 'Added' button to appear and be disabled
    await waitFor(() => {
      const addedButton = screen.getByRole('button', { name: /added/i });
      expect(addedButton).toBeInTheDocument();
      expect(addedButton).toBeDisabled();
    }, { timeout: 5000 });
  });
}); 