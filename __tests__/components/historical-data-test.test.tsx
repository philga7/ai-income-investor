import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HistoricalDataTest } from '@/components/HistoricalDataTest';
import { MockProviders } from '@/__tests__/lib/mock-providers';

// Mock the useHistoricalData hook
jest.mock('@/hooks/useHistoricalData', () => ({
  useHistoricalData: jest.fn().mockReturnValue({
    data: [],
    isLoading: false,
    error: null
  })
}));

describe('HistoricalDataTest', () => {
  const mockHistoricalData = [
    {
      date: new Date('2024-01-01'),
      open: 100,
      high: 105,
      low: 98,
      close: 103,
      volume: 1000000
    },
    {
      date: new Date('2024-01-02'),
      open: 103,
      high: 107,
      low: 102,
      close: 106,
      volume: 1200000
    }
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('renders the test component', () => {
    render(
      <MockProviders>
        <HistoricalDataTest />
      </MockProviders>
    );

    expect(screen.getByText('Historical Data Test')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter symbol (e.g., AAPL)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fetch Data' })).toBeInTheDocument();
  });

  it('displays historical data when fetched', async () => {
    const { useHistoricalData } = require('@/hooks/useHistoricalData');
    useHistoricalData.mockReturnValue({
      data: mockHistoricalData,
      isLoading: false,
      error: null
    });

    render(
      <MockProviders>
        <HistoricalDataTest />
      </MockProviders>
    );

    // Enter symbol and fetch data
    const symbolInput = screen.getByPlaceholderText('Enter symbol (e.g., AAPL)');
    fireEvent.change(symbolInput, { target: { value: 'AAPL' } });
    
    const fetchButton = screen.getByRole('button', { name: 'Fetch Data' });
    fireEvent.click(fetchButton);

    // Wait for data to be displayed
    await waitFor(() => {
      // Use more specific selectors
      const table = screen.getByRole('table');
      const rows = table.querySelectorAll('tbody tr');
      expect(rows).toHaveLength(2);
      
      // Check first row data
      const firstRow = rows[0];
      expect(firstRow).toHaveTextContent('Dec 31, 2023');
      expect(firstRow).toHaveTextContent('$100.00');
      expect(firstRow).toHaveTextContent('$105.00');
      expect(firstRow).toHaveTextContent('$98.00');
      expect(firstRow).toHaveTextContent('$103.00');
      expect(firstRow).toHaveTextContent('1,000,000');
    });
  });

  it('displays error message when fetch fails', async () => {
    const { useHistoricalData } = require('@/hooks/useHistoricalData');
    useHistoricalData.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch historical data')
    });

    render(
      <MockProviders>
        <HistoricalDataTest />
      </MockProviders>
    );

    // Enter symbol and fetch data
    const symbolInput = screen.getByPlaceholderText('Enter symbol (e.g., AAPL)');
    fireEvent.change(symbolInput, { target: { value: 'AAPL' } });
    
    const fetchButton = screen.getByRole('button', { name: 'Fetch Data' });
    fireEvent.click(fetchButton);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch historical data')).toBeInTheDocument();
    });
  });

  it('displays loading state while fetching', async () => {
    const { useHistoricalData } = require('@/hooks/useHistoricalData');
    useHistoricalData.mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    });

    render(
      <MockProviders>
        <HistoricalDataTest />
      </MockProviders>
    );

    // Enter symbol and fetch data
    const symbolInput = screen.getByPlaceholderText('Enter symbol (e.g., AAPL)');
    fireEvent.change(symbolInput, { target: { value: 'AAPL' } });
    
    const fetchButton = screen.getByRole('button', { name: 'Loading...' });
    expect(fetchButton).toBeDisabled();
  });
}); 