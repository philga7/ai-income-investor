const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

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
