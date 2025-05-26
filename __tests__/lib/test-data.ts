// Common test data types
export interface TestUser {
  id: string;
  email: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TestAuthResponse {
  user: TestUser | null;
  error?: string;
  signIn: (email: string, password: string) => Promise<{ data: { user: TestUser | null }; error: string | null }>;
  signOut: () => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ data: { user: TestUser | null }; error: string | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: string | null }>;
  updateUser: (data: Partial<TestUser>) => Promise<{ data: { user: TestUser | null }; error: string | null }>;
  getUser: () => Promise<{ data: { user: TestUser | null }; error: string | null }>;
  onAuthStateChange: (callback: (event: string, session: any) => void) => { data: { subscription: { unsubscribe: () => void } } };
}

// Factory functions for creating test data
export const createTestUser = (overrides: Partial<TestUser> = {}): TestUser => ({
  id: '123',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createTestAuthResponse = (
  user: TestUser | null = createTestUser(),
  error?: string
): TestAuthResponse => ({
  user,
  error,
  signIn: jest.fn().mockResolvedValue({ data: { user }, error: null }),
  signOut: jest.fn().mockResolvedValue({ error: null }),
  signUp: jest.fn().mockResolvedValue({ data: { user }, error: null }),
  resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
  updateUser: jest.fn().mockResolvedValue({ data: { user }, error: null }),
  getUser: jest.fn().mockResolvedValue({ data: { user }, error: null }),
  onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
});

// Common form data
export const validSignInData = {
  email: 'test@example.com',
  password: 'password123',
};

export const validSignUpData = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User',
};

// Common error messages
export const errorMessages = {
  invalidEmail: 'Please enter a valid email address',
  invalidPassword: 'Password must be at least 8 characters',
  requiredField: 'This field is required',
  networkError: 'Network error occurred',
  serverError: 'Server error occurred',
};

// Common mock responses
export const mockResponses = {
  success: { success: true },
  error: { error: 'An error occurred' },
  networkError: new Error('Network error'),
  serverError: new Error('Server error'),
};

// Common test IDs
export const testIds = {
  signInForm: 'sign-in-form',
  signUpForm: 'sign-up-form',
  resetPasswordForm: 'reset-password-form',
  userProfile: 'user-profile',
  header: 'header',
  navigation: 'navigation',
  searchInput: 'search-input',
  themeToggle: 'theme-toggle',
}; 