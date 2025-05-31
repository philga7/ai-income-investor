// Set up fetch mock before importing components
const mockFetch = jest.fn();
global.fetch = mockFetch;

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { PortfolioSummary } from '@/components/dashboard/portfolio-summary';

describe('PortfolioSummary Calculations', () => {
  let container: HTMLElement;

  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        totalValue: 124389.52,
        totalGainLoss: 2.5,
        totalGainLossAmount: 3109.74,
        cashBalance: 12450.00,
        equitiesValue: 111939.52,
        averageYield: 3.85,
        annualIncome: 4789.25,
        monthlyIncome: 399.10,
        weeklyIncome: 92.10,
        dailyIncome: 13.12
      })
    });
  });

  afterEach(() => {
    // Cleanup after each test
    if (container) {
      container.remove();
    }
  });

  const renderComponent = async () => {
    await act(async () => {
      const { container: renderedContainer } = render(<PortfolioSummary />);
      container = renderedContainer;
    });
  };

  it('displays portfolio summary data correctly', async () => {
    await renderComponent();

    // Wait for initial render and data loading
    await waitFor(() => {
      expect(screen.getByText('Portfolio Summary')).toBeInTheDocument();
      expect(screen.getByText('Your investment overview')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Test tab navigation
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Value' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Yield' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Income' })).toBeInTheDocument();
    }, { timeout: 3000 });

    // Test Value tab content
    await waitFor(() => {
      const totalValue = screen.getByText('Total Value').closest('div')?.querySelector('.text-2xl');
      expect(totalValue).toHaveTextContent('$124,389.52');
    }, { timeout: 3000 });

    // Test Yield tab content
    const yieldTab = screen.getByRole('tab', { name: 'Yield' });
    await act(async () => {
      await userEvent.click(yieldTab);
    });
    
    await waitFor(() => {
      const avgYield = screen.getByText('Avg. Yield').closest('div')?.querySelector('.text-2xl');
      expect(avgYield).toHaveTextContent('3.85%');
    }, { timeout: 3000 });

    // Test Income tab content
    const incomeTab = screen.getByRole('tab', { name: 'Income' });
    await act(async () => {
      await userEvent.click(incomeTab);
    });
    
    await waitFor(() => {
      const annualIncome = screen.getByText('Annual Income').closest('div')?.querySelector('.text-2xl');
      expect(annualIncome).toHaveTextContent('$4,789.25');
    }, { timeout: 3000 });
  });

  it('displays position sizes correctly', async () => {
    await renderComponent();
    
    await waitFor(() => {
      const cash = screen.getByText('Cash').closest('div')?.querySelector('.font-medium');
      expect(cash).toHaveTextContent('$12,450.00');
      
      const equities = screen.getByText('Equities').closest('div')?.querySelector('.font-medium');
      expect(equities).toHaveTextContent('$111,939.52');
    }, { timeout: 3000 });
  });

  it('displays gain/loss correctly', async () => {
    await renderComponent();
    
    await waitFor(() => {
      const gainLoss = screen.getByText('Total Value')
        .closest('div')?.parentElement
        ?.querySelector('.text-green-500');
      expect(gainLoss).toHaveTextContent('+2.5%');
    }, { timeout: 3000 });
  });

  it('displays progress bars correctly', async () => {
    await renderComponent();

    // Test Value tab progress bars
    await waitFor(() => {
      const valueProgressBars = screen.getAllByRole('progressbar');
      expect(valueProgressBars).toHaveLength(2);
    }, { timeout: 3000 });

    // Test Yield tab progress bars
    const yieldTab = screen.getByRole('tab', { name: 'Yield' });
    await act(async () => {
      await userEvent.click(yieldTab);
    });

    // No progress bars in Yield tab
    await waitFor(() => {
      const yieldProgressBars = screen.queryAllByRole('progressbar');
      expect(yieldProgressBars).toHaveLength(0);
    }, { timeout: 3000 });

    // Test Income tab progress bars
    const incomeTab = screen.getByRole('tab', { name: 'Income' });
    await act(async () => {
      await userEvent.click(incomeTab);
    });

    await waitFor(() => {
      const incomeProgressBars = screen.getAllByRole('progressbar');
      expect(incomeProgressBars).toHaveLength(1);
    }, { timeout: 3000 });
  });

  it('displays icons correctly', async () => {
    await renderComponent();

    // Test Value tab icons
    await waitFor(() => {
      expect(screen.getByTestId('dollar-sign-icon')).toBeInTheDocument();
      expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Test Yield tab icons
    const yieldTab = screen.getByRole('tab', { name: 'Yield' });
    await act(async () => {
      await userEvent.click(yieldTab);
    });

    await waitFor(() => {
      expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Test Income tab icons
    const incomeTab = screen.getByRole('tab', { name: 'Income' });
    await act(async () => {
      await userEvent.click(incomeTab);
    });

    await waitFor(() => {
      expect(screen.getByTestId('calculator-icon')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
}); 