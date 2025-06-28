import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { LotEntryForm } from '@/components/portfolios/lot-entry-form';
import { MockProviders } from '@/__tests__/lib/mock-providers';
import { SecurityLotFormData } from '@/types/lots';

describe('Form Validation and Error States', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('LotEntryForm Validation', () => {
    it('should render and handle basic user interactions', async () => {
      const mockOnChange = jest.fn();
      const mockOnTotalsChange = jest.fn();

      const initialLots: SecurityLotFormData[] = [
        {
          open_date: '',
          quantity: '',
          price_per_share: '',
          notes: ''
        }
      ];

      render(
        <MockProviders>
          <LotEntryForm
            lots={initialLots}
            onChange={mockOnChange}
            onTotalsChange={mockOnTotalsChange}
          />
        </MockProviders>
      );

      // Check that inputs are required
      const dateInput = screen.getByLabelText(/open date/i);
      const quantityInput = screen.getByLabelText(/quantity/i);
      const priceInput = screen.getByLabelText(/price per share/i);

      expect(dateInput).toHaveAttribute('required');
      expect(quantityInput).toHaveAttribute('required');
      expect(priceInput).toHaveAttribute('required');

      // Fill in all fields using fireEvent
      await act(async () => {
        fireEvent.change(dateInput, { target: { value: '2024-01-15' } });
      });
      await act(async () => {
        fireEvent.change(quantityInput, { target: { value: '100' } });
      });
      await act(async () => {
        fireEvent.change(priceInput, { target: { value: '150.00' } });
      });

      // Verify onChange was called
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalled();
      });

      // Verify onTotalsChange was called
      await waitFor(() => {
        expect(mockOnTotalsChange).toHaveBeenCalled();
      });
    });

    it('should calculate totals correctly with valid inputs', async () => {
      const mockOnChange = jest.fn();
      const mockOnTotalsChange = jest.fn();

      const initialLots: SecurityLotFormData[] = [
        {
          open_date: '',
          quantity: '',
          price_per_share: '',
          notes: ''
        }
      ];

      const { rerender } = render(
        <MockProviders>
          <LotEntryForm
            lots={initialLots}
            onChange={mockOnChange}
            onTotalsChange={mockOnTotalsChange}
          />
        </MockProviders>
      );

      // Update with filled data
      const updatedLots: SecurityLotFormData[] = [
        {
          open_date: '2024-01-15',
          quantity: '100',
          price_per_share: '150.00',
          notes: ''
        }
      ];

      await act(async () => {
        rerender(
          <MockProviders>
            <LotEntryForm
              lots={updatedLots}
              onChange={mockOnChange}
              onTotalsChange={mockOnTotalsChange}
            />
          </MockProviders>
        );
      });

      // Verify totals calculation
      await waitFor(() => {
        const calls = mockOnTotalsChange.mock.calls;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall).toEqual({
          totalShares: 100,
          totalCost: 15000,
          averageCost: 150
        });
      });
    });

    it('should handle fractional shares correctly', async () => {
      const mockOnChange = jest.fn();
      const mockOnTotalsChange = jest.fn();

      const lotsWithFractional: SecurityLotFormData[] = [
        {
          open_date: '2024-01-15',
          quantity: '0.25',
          price_per_share: '150.00',
          notes: ''
        }
      ];

      render(
        <MockProviders>
          <LotEntryForm
            lots={lotsWithFractional}
            onChange={mockOnChange}
            onTotalsChange={mockOnTotalsChange}
          />
        </MockProviders>
      );

      await waitFor(() => {
        const calls = mockOnTotalsChange.mock.calls;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall).toEqual({
          totalShares: 0.25,
          totalCost: 37.5,
          averageCost: 150
        });
      });
    });

    it('should handle multiple lots with correct totals', async () => {
      const mockOnChange = jest.fn();
      const mockOnTotalsChange = jest.fn();

      const lotsWithMultiple: SecurityLotFormData[] = [
        {
          open_date: '2024-01-15',
          quantity: '100',
          price_per_share: '150.00',
          notes: ''
        },
        {
          open_date: '2024-02-15',
          quantity: '50',
          price_per_share: '160.00',
          notes: 'Second lot'
        }
      ];

      render(
        <MockProviders>
          <LotEntryForm
            lots={lotsWithMultiple}
            onChange={mockOnChange}
            onTotalsChange={mockOnTotalsChange}
          />
        </MockProviders>
      );

      // Verify updated totals
      await waitFor(() => {
        const calls = mockOnTotalsChange.mock.calls;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall.totalShares).toBe(150);
        expect(lastCall.totalCost).toBe(23000);
        expect(lastCall.averageCost).toBeCloseTo(153.33, 2);
      });
    });

    it('should handle large numbers in calculations', async () => {
      const mockOnChange = jest.fn();
      const mockOnTotalsChange = jest.fn();

      const lotsWithLargeNumbers: SecurityLotFormData[] = [
        {
          open_date: '2024-01-15',
          quantity: '999999999',
          price_per_share: '999999.99',
          notes: ''
        }
      ];

      render(
        <MockProviders>
          <LotEntryForm
            lots={lotsWithLargeNumbers}
            onChange={mockOnChange}
            onTotalsChange={mockOnTotalsChange}
          />
        </MockProviders>
      );

      await waitFor(() => {
        const calls = mockOnTotalsChange.mock.calls;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall.totalShares).toBe(999999999);
        expect(lastCall.totalCost).toBe(999999999 * 999999.99);
        expect(lastCall.averageCost).toBe(999999.99);
      });
    });

    it('should handle small decimal values in calculations', async () => {
      const mockOnChange = jest.fn();
      const mockOnTotalsChange = jest.fn();

      const lotsWithSmallNumbers: SecurityLotFormData[] = [
        {
          open_date: '2024-01-15',
          quantity: '0.0001',
          price_per_share: '0.0001',
          notes: ''
        }
      ];

      render(
        <MockProviders>
          <LotEntryForm
            lots={lotsWithSmallNumbers}
            onChange={mockOnChange}
            onTotalsChange={mockOnTotalsChange}
          />
        </MockProviders>
      );

      await waitFor(() => {
        const calls = mockOnTotalsChange.mock.calls;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall.totalShares).toBeCloseTo(0.0001, 10);
        expect(lastCall.totalCost).toBeCloseTo(0.00000001, 10);
        expect(lastCall.averageCost).toBeCloseTo(0.0001, 10);
      });
    });

    it('should handle negative values appropriately', async () => {
      const mockOnChange = jest.fn();
      const mockOnTotalsChange = jest.fn();

      const lotsWithNegative: SecurityLotFormData[] = [
        {
          open_date: '2024-01-15',
          quantity: '-10',
          price_per_share: '-50',
          notes: ''
        }
      ];

      render(
        <MockProviders>
          <LotEntryForm
            lots={lotsWithNegative}
            onChange={mockOnChange}
            onTotalsChange={mockOnTotalsChange}
          />
        </MockProviders>
      );

      // Verify that negative values are handled
      await waitFor(() => {
        const calls = mockOnTotalsChange.mock.calls;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall.totalShares).toBe(-10);
        expect(lastCall.totalCost).toBeCloseTo(500, 10);
        expect(lastCall.averageCost).toBe(-50);
      });
    });

    it('should handle zero values appropriately', async () => {
      const mockOnChange = jest.fn();
      const mockOnTotalsChange = jest.fn();

      const lotsWithZero: SecurityLotFormData[] = [
        {
          open_date: '2024-01-15',
          quantity: '0',
          price_per_share: '0',
          notes: ''
        }
      ];

      render(
        <MockProviders>
          <LotEntryForm
            lots={lotsWithZero}
            onChange={mockOnChange}
            onTotalsChange={mockOnTotalsChange}
          />
        </MockProviders>
      );

      await waitFor(() => {
        const calls = mockOnTotalsChange.mock.calls;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall.totalShares).toBe(0);
        expect(lastCall.totalCost).toBe(0);
        expect(lastCall.averageCost).toBe(0);
      });
    });

    it('should show lot totals when both quantity and price are provided', async () => {
      const mockOnChange = jest.fn();
      const mockOnTotalsChange = jest.fn();

      const lotsWithData: SecurityLotFormData[] = [
        {
          open_date: '2024-01-15',
          quantity: '100',
          price_per_share: '150.00',
          notes: ''
        }
      ];

      render(
        <MockProviders>
          <LotEntryForm
            lots={lotsWithData}
            onChange={mockOnChange}
            onTotalsChange={mockOnTotalsChange}
          />
        </MockProviders>
      );

      // Check that lot total is displayed
      await waitFor(() => {
        expect(screen.getByText('Lot Total: $15000.00')).toBeInTheDocument();
      });
    });

    it('should not show lot total when either quantity or price is missing', async () => {
      const mockOnChange = jest.fn();
      const mockOnTotalsChange = jest.fn();

      const lotsWithPartialData: SecurityLotFormData[] = [
        {
          open_date: '2024-01-15',
          quantity: '100',
          price_per_share: '',
          notes: ''
        }
      ];

      render(
        <MockProviders>
          <LotEntryForm
            lots={lotsWithPartialData}
            onChange={mockOnChange}
            onTotalsChange={mockOnTotalsChange}
          />
        </MockProviders>
      );

      // Lot total should not be displayed
      expect(screen.queryByText(/Lot Total:/)).not.toBeInTheDocument();
    });

    it('should handle empty lots array correctly', async () => {
      const mockOnChange = jest.fn();
      const mockOnTotalsChange = jest.fn();

      const emptyLots: SecurityLotFormData[] = [];

      render(
        <MockProviders>
          <LotEntryForm
            lots={emptyLots}
            onChange={mockOnChange}
            onTotalsChange={mockOnTotalsChange}
          />
        </MockProviders>
      );

      // Should show empty state message
      expect(screen.getByText(/No lots added yet/)).toBeInTheDocument();

      // Should calculate zero totals
      await waitFor(() => {
        const calls = mockOnTotalsChange.mock.calls;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall).toEqual({
          totalShares: 0,
          totalCost: 0,
          averageCost: 0
        });
      });
    });
  });
}); 