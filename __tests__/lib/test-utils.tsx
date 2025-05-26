import React from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { MockProviders } from './mock-providers';
import { TestAuthResponse } from './test-data';
import { resetSupabaseMocks } from './mock-supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: require('./mock-supabase').mockSupabaseClient,
  createClient: require('./mock-supabase').createClient,
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Custom render function that includes all providers
export function render(
  ui: React.ReactElement,
  {
    authValue,
    ...renderOptions
  }: {
    authValue?: Partial<TestAuthResponse>;
  } & Omit<RenderOptions, 'wrapper'> = {}
) {
  return rtlRender(ui, {
    wrapper: ({ children }) => (
      <MockProviders authValue={authValue}>
        {children}
      </MockProviders>
    ),
    ...renderOptions,
  });
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Reset all mocks before each test
beforeEach(() => {
  resetSupabaseMocks();
});

// Helper to clear all mocks
export const clearAllMocks = () => {
  jest.clearAllMocks();
};

// Helper to wait for loading states
export const waitForLoadingToFinish = async () => {
  const loadingElements = document.querySelectorAll('[aria-busy="true"]');
  if (loadingElements.length > 0) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};

// Helper to simulate scroll
export const simulateScroll = (scrollY: number) => {
  Object.defineProperty(window, 'scrollY', {
    value: scrollY,
    writable: true,
  });
  window.dispatchEvent(new Event('scroll'));
};

// Helper to simulate window resize
export const simulateResize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    writable: true,
  });
  Object.defineProperty(window, 'innerHeight', {
    value: height,
    writable: true,
  });
  window.dispatchEvent(new Event('resize'));
}; 