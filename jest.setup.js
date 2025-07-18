const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill fetch for Node.js as a Jest mock that delegates to node-fetch
const realFetch = require('node-fetch');
if (typeof global.fetch === 'undefined' || !global.fetch._isMockFunction) {
  global.fetch = jest.fn((...args) => realFetch(...args));
}

// Only keep if you're actually using fetch in tests
const { Response, Request, Headers } = require('node-fetch');
global.Response = Response;
global.Request = Request;
global.Headers = Headers;

// Add BroadcastChannel polyfill
class BroadcastChannel {
  constructor() {}
  postMessage() {}
  close() {}
}
global.BroadcastChannel = BroadcastChannel;

// Mock ResizeObserver for Recharts components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

require('@testing-library/jest-dom');
require('@testing-library/user-event');
require('msw').setupServer;

// Mock Radix UI Portal to render children inline
jest.mock('@radix-ui/react-portal', () => ({
  __esModule: true,
  Portal: ({ children }) => children,
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    })),
    auth: {
      signIn: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

// Store original console methods
const originalConsole = {
  warn: console.warn,
  error: console.error,
  log: console.log
};

// Suppress console output during tests
beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
  console.log = jest.fn();
});

// Restore console methods after all tests
afterAll(() => {
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.log = originalConsole.log;
});
