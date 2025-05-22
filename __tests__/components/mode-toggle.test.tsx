import '@testing-library/jest-dom';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ModeToggle } from '@/components/mode-toggle';
import { ThemeProvider } from 'next-themes';

// Mock the entire Radix UI DropdownMenu to render children inline
jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button role="menuitem" onClick={onClick}>{children}</button>
  ),
}));

// Mock Radix UI Portal to render children inline in tests
jest.mock('@radix-ui/react-portal', () => ({
  __esModule: true,
  Portal: ({ children }: { children: React.ReactNode }) => {
    console.log('Portal mock called with children:', children);
    return children;
  },
}));

describe('ModeToggle', () => {
  const renderWithTheme = (ui: React.ReactElement) => {
    return render(
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {ui}
      </ThemeProvider>
    );
  };

  it('renders the toggle button', () => {
    renderWithTheme(<ModeToggle />);
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
  });

  it('shows theme options when clicked', async () => {
    renderWithTheme(<ModeToggle />);
    
    // Click the button to open the dropdown
    const button = screen.getByRole('button', { name: /toggle theme/i });
    await act(async () => {
      fireEvent.click(button);
    });
    
    // Log the document body to inspect rendered content
    console.log('Document body after click:', document.body.innerHTML);
    
    // Wait for and verify the menu items
    const menuItems = await screen.findAllByRole('menuitem');
    expect(menuItems).toHaveLength(3);
    expect(menuItems[0]).toHaveTextContent('Light');
    expect(menuItems[1]).toHaveTextContent('Dark');
    expect(menuItems[2]).toHaveTextContent('System');
  });

  it('changes theme when option is selected', async () => {
    renderWithTheme(<ModeToggle />);
    
    // Click the button to open the dropdown
    const button = screen.getByRole('button', { name: /toggle theme/i });
    await act(async () => {
      fireEvent.click(button);
    });
    
    // Click the dark theme option
    const darkOption = await screen.findByRole('menuitem', { name: /dark/i });
    await act(async () => {
      fireEvent.click(darkOption);
    });
    
    // Verify the theme was changed (this would need to be adapted based on how you want to verify theme changes)
  });
});