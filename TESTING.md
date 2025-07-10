# Testing Strategy

This project uses a tiered testing approach to balance speed and coverage across different environments.

## Test Tiers

### 1. Critical Path Smoke Tests (PR Checks)
- **Purpose**: Quick feedback on critical functionality
- **Scope**: Login, basic navigation, page loading
- **Browser**: Chromium only
- **Duration**: ~2-3 minutes
- **Command**: `npm run test:e2e:cp-smoke`

### 2. Full Smoke Tests (Staging/Production)
- **Purpose**: Full regression testing
- **Scope**: All functionality, edge cases, interactions (excludes critical path smoke tests to avoid redundancy)
- **Browser**: Chromium + WebKit (Safari)
- **Duration**: ~6-8 minutes
- **Command**: `npm run test:e2e:full-smoke`

### 3. Full Test Suite (Manual/Development)
- **Purpose**: Complete testing during development
- **Scope**: All tests including original smoke tests
- **Browser**: Chromium + WebKit
- **Duration**: ~10-12 minutes
- **Command**: `npm run test:e2e`

## Test Files

- `tests/e2e/cp-smoke.spec.ts` - Critical path tests for CI
- `tests/e2e/smoke.spec.ts` - Comprehensive smoke tests
- `playwright.config.ts` - Fast configuration (Chromium only)
- `playwright.full-smoke.config.ts` - Full configuration (both browsers, excludes critical path smoke tests)

## Test Exclusion Strategy

- **Critical path tests** are excluded from full smoke runs to avoid redundancy
- **Full smoke tests** already cover all functionality that critical path tests cover
- This prevents running the same tests twice and improves CI performance

## CI/CD Integration

### Pull Request Workflow
- Runs critical path smoke tests only
- Provides quick feedback to developers
- Uses Chromium browser only

### Staging Deployment
- Runs full smoke tests
- Tests both Chromium and WebKit
- Ensures cross-browser compatibility

### Production Deployment
- Inherits staging test results
- Additional production-specific checks

## Performance Optimizations

1. **Browser Reduction**: PR checks use only Chromium
2. **Test Scope**: Fast tests focus on critical paths only
3. **Parallel Execution**: Tests run in parallel in both CI and local environments
4. **Caching**: Node modules and build artifacts are cached

## Running Tests Locally

```bash
# Critical path smoke tests (for quick feedback)
npm run test:e2e:cp-smoke

# Full smoke tests (for thorough testing)
npm run test:e2e:full-smoke

# Full test suite (for development)
npm run test:e2e

# Unit tests only
npm run test:unit

# All tests (unit + e2e)
npm run test
```

## Adding New Tests

- **Critical Path Tests**: Add to `cp-smoke.spec.ts` for critical functionality
- **Full Smoke Tests**: Add to `smoke.spec.ts` for detailed testing
- **New Test Files**: Create separate files for specific features

## Best Practices

1. Use `data-testid` attributes for reliable selectors
2. Keep fast tests focused on critical user journeys
3. Test user behavior, not implementation details
4. Use proper wait strategies (avoid arbitrary timeouts)
5. Clean up test data after each test 