import { render, screen } from '@testing-library/react';
import { CSVUpload } from '@/components/portfolios/csv-upload';

// Mock the toast
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    warning: jest.fn(),
  },
}));

// Mock Papa Parse
jest.mock('papaparse', () => ({
  parse: jest.fn(),
}));

describe('CSVUpload', () => {
  const mockOnLotsParsed = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders upload interface', () => {
    render(<CSVUpload onLotsParsed={mockOnLotsParsed} onCancel={mockOnCancel} />);
    
    expect(screen.getByText('Upload CSV File')).toBeInTheDocument();
  });
}); 