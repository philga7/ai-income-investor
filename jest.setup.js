const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch to always return a dummy successful response, with an array for /securities endpoints
global.fetch = jest.fn((url) => {
  if (typeof url === 'string' && url.includes('/securities')) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
      text: () => Promise.resolve(''),
    });
  }
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  });
});

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
