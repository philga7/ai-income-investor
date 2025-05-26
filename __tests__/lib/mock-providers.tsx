import React, { createContext, useContext } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { TestAuthResponse, TestUser, createTestUser, createTestAuthResponse } from './test-data';
import { mockSupabaseClient } from './mock-supabase';

// Create a mock auth context
const AuthContext = createContext<TestAuthResponse | undefined>(undefined);

// Mock auth functions
export const mockAuth = {
  signIn: jest.fn(),
  signOut: jest.fn(),
  signUp: jest.fn(),
  resetPassword: jest.fn(),
  updatePassword: jest.fn(),
  updateEmail: jest.fn(),
  updateProfile: jest.fn(),
};

// Mock the auth context
export const MockAuthProvider: React.FC<{
  children: React.ReactNode;
  value?: Partial<TestAuthResponse>;
}> = ({ children, value = {} }) => {
  const defaultContext = createTestAuthResponse();
  const context = { ...defaultContext, ...value };

  return (
    <AuthContext.Provider value={context}>
      {children}
    </AuthContext.Provider>
  );
};

// Mock useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock the theme provider
export const MockThemeProvider: React.FC<{
  children: React.ReactNode;
  theme?: 'light' | 'dark' | 'system';
}> = ({ children, theme = 'system' }) => (
  <ThemeProvider attribute="class" defaultTheme={theme} enableSystem>
    {children}
  </ThemeProvider>
);

// Mock the toast provider
export const MockToastProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => (
  <>
    {children}
    <Toaster />
  </>
);

// Combined providers wrapper
export const MockProviders: React.FC<{
  children: React.ReactNode;
  authValue?: Partial<TestAuthResponse>;
  theme?: 'light' | 'dark' | 'system';
}> = ({ children, authValue, theme }) => (
  <MockAuthProvider value={authValue}>
    <MockThemeProvider theme={theme}>
      <MockToastProvider>
        {children}
      </MockToastProvider>
    </MockThemeProvider>
  </MockAuthProvider>
);

// Mock the router
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  pathname: '/',
  query: {},
};

// Mock the useRouter hook
export const useMockRouter = () => mockRouter;

// Mock the usePathname hook
export const useMockPathname = () => '/';

// Mock the useSearchParams hook
export const useMockSearchParams = () => new URLSearchParams();

// Mock the lib/auth.tsx module
jest.mock('@/lib/auth', () => ({
  useAuth: () => useAuth(),
  AuthProvider: MockAuthProvider,
})); 