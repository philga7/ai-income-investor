import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PortfolioSummary } from '@/components/dashboard/portfolio-summary';

// Mock data for testing
const mockPortfolioData = {
  securities: [
    {
      id: '1',
      shares: 100,
      average_cost: 150.00,
      security: {
        id: '1',
        ticker: 'AAPL',
        name: 'Apple Inc.',
        sector: 'Technology',
        price: 175.50,
        yield: 0.5
      }
    },
    {
      id: '2',
      shares: 50,
      average_cost: 200.00,
      security: {
        id: '2',
        ticker: 'ABBV',
        name: 'AbbVie Inc.',
        sector: 'Healthcare',
        price: 180.00,
        yield: 5.2
      }
    }
  ]
};

describe('PortfolioSummary', () => {
  beforeEach(() => {
    // Mock the portfolio data
    jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockPortfolioData),
      } as Response)
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('displays portfolio summary data correctly', async () => {
    render(<PortfolioSummary />);

    // Test card title and description
    expect(screen.getByText('Portfolio Summary')).toBeInTheDocument();
    expect(screen.getByText('Your investment overview')).toBeInTheDocument();

    // Test tab navigation
    expect(screen.getByRole('tab', { name: 'Value' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Yield' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Income' })).toBeInTheDocument();

    // Test Value tab content
    await waitFor(() => {
      expect(screen.getByText('Total Value')).toBeInTheDocument();
      const totalValue = screen.getByText('Total Value').closest('div')?.querySelector('.text-2xl');
      expect(totalValue).toHaveTextContent('$124,389.52');
    });

    // Test Yield tab content
    const yieldTab = screen.getByRole('tab', { name: 'Yield' });
    await act(async () => {
      await userEvent.click(yieldTab);
    });
    
    await waitFor(() => {
      const avgYield = screen.getByText('Avg. Yield').closest('div')?.querySelector('.text-2xl');
      expect(avgYield).toHaveTextContent('3.85%');
    });

    // Test Income tab content
    const incomeTab = screen.getByRole('tab', { name: 'Income' });
    await act(async () => {
      await userEvent.click(incomeTab);
    });
    
    await waitFor(() => {
      const annualIncome = screen.getByText('Annual Income').closest('div')?.querySelector('.text-2xl');
      expect(annualIncome).toHaveTextContent('$4,789.25');
    });
  });

  it('displays progress bars for value and income sections', async () => {
    render(<PortfolioSummary />);

    // Test Value tab progress bars
    const valueProgressBars = screen.getAllByRole('progressbar');
    expect(valueProgressBars).toHaveLength(2); // One for cash, one for equities

    // Test Income tab progress bar
    const incomeTab = screen.getByRole('tab', { name: 'Income' });
    await act(async () => {
      await userEvent.click(incomeTab);
    });
    
    await waitFor(() => {
      const incomeProgressBars = screen.getAllByRole('progressbar');
      expect(incomeProgressBars).toHaveLength(1); // One for YTD progress
    });
  });

  it('displays icons correctly', async () => {
    render(<PortfolioSummary />);

    // Test Value tab icons
    expect(screen.getByTestId('dollar-sign-icon')).toBeInTheDocument();
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