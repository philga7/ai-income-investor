import { render, screen } from '@testing-library/react';
import { PortfolioSummary } from '../portfolio-summary';

describe('PortfolioSummary', () => {
  it('displays portfolio summary data correctly', () => {
    render(<PortfolioSummary />);

    // Test card title and description
    expect(screen.getByText('Portfolio Summary')).toBeInTheDocument();
    expect(screen.getByText('Your investment overview')).toBeInTheDocument();

    // Test tab navigation
    expect(screen.getByRole('tab', { name: 'Value' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Yield' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Income' })).toBeInTheDocument();

    // Test Value tab content
    expect(screen.getByText('Total Value')).toBeInTheDocument();
    expect(screen.getByText('$124,389.52')).toBeInTheDocument();
    expect(screen.getByText('+2.5%')).toBeInTheDocument();
    expect(screen.getByText('Cash')).toBeInTheDocument();
    expect(screen.getByText('$12,450.00')).toBeInTheDocument();
    expect(screen.getByText('Equities')).toBeInTheDocument();
    expect(screen.getByText('$111,939.52')).toBeInTheDocument();

    // Test Yield tab content
    const yieldTab = screen.getByRole('tab', { name: 'Yield' });
    yieldTab.click();
    expect(screen.getByText('Avg. Yield')).toBeInTheDocument();
    expect(screen.getByText('3.85%')).toBeInTheDocument();
    expect(screen.getByText('Highest Yield')).toBeInTheDocument();
    expect(screen.getByText('ABBV - 5.2%')).toBeInTheDocument();
    expect(screen.getByText('Lowest Yield')).toBeInTheDocument();
    expect(screen.getByText('AAPL - 0.5%')).toBeInTheDocument();

    // Test Income tab content
    const incomeTab = screen.getByRole('tab', { name: 'Income' });
    incomeTab.click();
    expect(screen.getByText('Annual Income')).toBeInTheDocument();
    expect(screen.getByText('$4,789.25')).toBeInTheDocument();
    expect(screen.getByText('YTD Received')).toBeInTheDocument();
    expect(screen.getByText('$2,345.67')).toBeInTheDocument();
    expect(screen.getByText('Next 30 Days')).toBeInTheDocument();
    expect(screen.getByText('$567.89')).toBeInTheDocument();
  });

  it('displays progress bars for value and income sections', () => {
    render(<PortfolioSummary />);

    // Test Value tab progress bars
    const valueProgressBars = screen.getAllByRole('progressbar');
    expect(valueProgressBars).toHaveLength(2); // One for cash, one for equities

    // Test Income tab progress bar
    const incomeTab = screen.getByRole('tab', { name: 'Income' });
    incomeTab.click();
    const incomeProgressBars = screen.getAllByRole('progressbar');
    expect(incomeProgressBars).toHaveLength(1); // One for YTD progress
  });

  it('displays icons correctly', () => {
    render(<PortfolioSummary />);

    // Test Value tab icons
    expect(screen.getByTestId('dollar-sign-icon')).toBeInTheDocument();
    expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument();

    // Test Income tab icons
    const incomeTab = screen.getByRole('tab', { name: 'Income' });
    incomeTab.click();
    expect(screen.getByTestId('calculator-icon')).toBeInTheDocument();
  });
}); 