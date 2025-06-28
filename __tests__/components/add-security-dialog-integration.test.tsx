import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddSecurityDialog } from '@/components/portfolios/add-security-dialog';
import { MockProviders } from '@/__tests__/lib/mock-providers';
import { lotService } from '@/services/lotService';

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

const mockLotService = lotService as jest.Mocked<typeof lotService>;

describe('AddSecurityDialog Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(); // Ensure a fresh mock instance for each test
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clean up any remaining timers
    jest.clearAllTimers();
    cleanup(); // <-- Ensure DOM is reset between tests
  });

  it('should handle complete security addition flow with real service calls', async () => {
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
      if (url.includes('/api/portfolios/test-portfolio/securities')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: 'ps-1',
            security_id: 'sec-1',
            portfolio_id: 'test-portfolio',
            shares: 100,
            average_cost: 150.00
          })
        });
      }
      return Promise.reject('Unknown endpoint');
    });

    // Mock lot service
    mockLotService.createLots.mockResolvedValue([
      { 
        id: 'lot-1', 
        portfolio_id: 'test-portfolio',
        security_id: 'sec-1', 
        open_date: '2024-01-15', 
        quantity: 100, 
        price_per_share: 150.00,
        total_amount: 15000,
        notes: '',
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z'
      }
    ]);

    const onSecurityAdded = jest.fn();

    render(
      <MockProviders>
        <AddSecurityDialog 
          portfolioId="test-portfolio" 
          onSecurityAdded={onSecurityAdded}
        />
      </MockProviders>
    );

    // Open dialog
    await user.click(screen.getByText('Add Security'));

    // Search for security
    const searchInput = screen.getByPlaceholderText('Search by symbol or company name...');
    await user.type(searchInput, 'AAPL');
    await user.click(screen.getByText('Search'));

    // Wait for search results and select security - look for AAPL in the table
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });
    
    // Click the Select button for AAPL
    const selectButton = screen.getByRole('button', { name: /select/i });
    await user.click(selectButton);

    // Verify security is selected
    await waitFor(() => {
      expect(screen.getByText('Selected Security')).toBeInTheDocument();
    });

    // Fill in lot details
    const dateInput = screen.getByLabelText(/open date/i);
    const quantityInput = screen.getByLabelText(/quantity/i);
    const priceInput = screen.getByLabelText(/price per share/i);

    await user.type(dateInput, '2024-01-15');
    await user.type(quantityInput, '100');
    await user.type(priceInput, '150.00');

    // Debug: Check if inputs are filled
    await waitFor(() => {
      expect(dateInput).toHaveValue('2024-01-15');
      expect(quantityInput).toHaveValue(100);
      expect(priceInput).toHaveValue(150.00);
    });

    // Add security - use a more specific selector
    const submitButton = screen.getByRole('button', { name: /add security/i });
    await user.click(submitButton);

    // Verify success toast was called
    await waitFor(() => {
      const { toast } = require('sonner');
      expect(toast.success).toHaveBeenCalledWith('Security added successfully with lots');
    });

    // Verify the component rendered and basic interactions work
    expect(screen.getByText('Add Security')).toBeInTheDocument();
  });

  it('should handle form validation errors properly', async () => {
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
        <AddSecurityDialog portfolioId="test-portfolio" />
      </MockProviders>
    );

    // Open dialog
    await user.click(screen.getByText('Add Security'));

    // Search for security
    const searchInput = screen.getByPlaceholderText('Search by symbol or company name...');
    await user.type(searchInput, 'AAPL');
    await user.click(screen.getByText('Search'));

    // Wait for search results and select security
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });
    const selectButton = screen.getByRole('button', { name: /select/i });
    await user.click(selectButton);

    // Try to add security without filling lot details
    const submitButton = screen.getByRole('button', { name: /add security/i });
    await user.click(submitButton);

    // Should show validation error
    await waitFor(() => {
      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith('Please add at least one valid lot');
    });
  });

  it('should handle service errors gracefully', async () => {
    const user = userEvent.setup();

    // Mock search failure
    (global.fetch as jest.Mock).mockImplementation(() => Promise.resolve({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Search service unavailable' })
    }));

    render(
      <MockProviders>
        <AddSecurityDialog portfolioId="test-portfolio" />
      </MockProviders>
    );

    await user.click(screen.getByText('Add Security'));
    const searchInput = screen.getByPlaceholderText('Search by symbol or company name...');
    await user.type(searchInput, 'AAPL');
    await user.click(screen.getByText('Search'));

    await waitFor(() => {
      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith('Failed to search securities');
    });
  });

  it('should handle authentication errors', async () => {
    const user = userEvent.setup();

    // Mock authentication failure
    const { supabase } = require('@/lib/supabase');
    supabase.auth.getSession.mockResolvedValue({ data: { session: null } });

    render(
      <MockProviders>
        <AddSecurityDialog portfolioId="test-portfolio" />
      </MockProviders>
    );

    await user.click(screen.getByText('Add Security'));
    const searchInput = screen.getByPlaceholderText('Search by symbol or company name...');
    await user.type(searchInput, 'AAPL');
    await user.click(screen.getByText('Search'));

    await waitFor(() => {
      const { toast } = require('sonner');
      expect(toast.error).toHaveBeenCalledWith('Failed to search securities');
    });
  });

  it('should handle cash mode correctly', async () => {
    const user = userEvent.setup();

    render(
      <MockProviders>
        <AddSecurityDialog portfolioId="test-portfolio" mode="cash" />
      </MockProviders>
    );

    // Open dialog - in cash mode, the button should say "Add Cash"
    await user.click(screen.getByText('Add Cash'));

    // Should pre-fill with CASH security - use more specific selectors
    await waitFor(() => {
      expect(screen.getByDisplayValue('CASH')).toBeInTheDocument();
      // There may be multiple inputs with value '1.00', so check that at least one exists
      const priceInputs = screen.getAllByDisplayValue('1.00');
      expect(priceInputs.length).toBeGreaterThan(0);
    });
  });

  it('should render the dialog correctly', () => {
    render(
      <MockProviders>
        <AddSecurityDialog portfolioId="test-portfolio" />
      </MockProviders>
    );

    // Verify the component renders
    expect(screen.getByText('Add Security')).toBeInTheDocument();
  });

  it('should open dialog when trigger is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <MockProviders>
        <AddSecurityDialog portfolioId="test-portfolio" />
      </MockProviders>
    );

    // Click the trigger button
    await user.click(screen.getByText('Add Security'));

    // Verify dialog content is shown
    await waitFor(() => {
      expect(screen.getByText('Search for a security and add purchase lots to your portfolio')).toBeInTheDocument();
    });
  });
}); 