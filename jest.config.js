module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/components/ui/(.*)$': '<rootDir>/components/ui/$1',
    '^@/components/portfolios/(.*)$': '<rootDir>/components/portfolios/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/__tests__/(.*)$': '<rootDir>/__tests__/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/src/(.*)$': '<rootDir>/src/$1',
    '^@/(.*)$': ['<rootDir>/src/$1', '<rootDir>/$1']
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
        },
        transform: {
          react: {
            runtime: 'automatic'
          }
        }
      }
    }]
  },
  testMatch: [
    '<rootDir>/__tests__/**/*.test.[jt]s?(x)',
    '<rootDir>/components/**/*.test.[jt]s?(x)',
    '<rootDir>/app/**/*.test.[jt]s?(x)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};