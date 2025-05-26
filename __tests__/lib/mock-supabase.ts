import { SupabaseClient, AuthError, AuthResponse, UserResponse, Session, AuthChangeEvent, Subscription } from '@supabase/supabase-js';

type MockFunction<T extends (...args: any[]) => any> = jest.Mock<ReturnType<T>, Parameters<T>>;

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    signIn: jest.fn(),
    signOut: jest.fn(),
    signUp: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
  from: jest.fn(),
};

// Mock createClient function
export const createClient = jest.fn(() => mockSupabaseClient);

// Reset all Supabase mocks
export const resetSupabaseMocks = () => {
  mockSupabaseClient.auth.signIn.mockReset();
  mockSupabaseClient.auth.signOut.mockReset();
  mockSupabaseClient.auth.signUp.mockReset();
  mockSupabaseClient.auth.resetPasswordForEmail.mockReset();
  mockSupabaseClient.auth.updateUser.mockReset();
  mockSupabaseClient.auth.getUser.mockReset();
  mockSupabaseClient.auth.onAuthStateChange.mockReset();
  mockSupabaseClient.from.mockReset();
  createClient.mockReset();
}; 