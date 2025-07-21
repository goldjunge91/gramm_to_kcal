# E2E Authentication Tests

Comprehensive end-to-end tests for authentication and middleware functionality using Playwright. These tests verify all the fixes implemented for GitHub issues #7-#12.

## 🎯 What These Tests Cover

### Core Auth Flow Tests
- **Login Flow** (`login.spec.ts`) - Form validation, successful authentication, error handling
- **Signup Flow** (`signup.spec.ts`) - User registration, email verification, validation
- **Logout Flow** (`logout.spec.ts`) - Session cleanup, cross-tab logout, redirect behavior

### Critical Bug Fix Tests
- **Session Persistence** (`session-persistence.spec.ts`) - Tests fix for issue #7 (session expiration on public routes)
- **Middleware Redirects** (`middleware-redirects.spec.ts`) - Tests fixes for issues #8 and #11 (auth page redirects and post-login redirects)
- **Rate Limiting** (`rate-limiting.spec.ts`) - Tests fix for issue #9 (production-ready Redis rate limiting)

## 🏃‍♂️ Running the Tests

### Prerequisites
1. Ensure your development server is running: `pnpm dev`
2. Make sure Supabase is configured and accessible
3. Optionally configure Redis for rate limiting tests

### Run All E2E Tests
```bash
npx playwright test
```

### Run Specific Test Suites
```bash
# Auth-specific tests only
npx playwright test __e2e__/auth/

# Specific test files
npx playwright test __e2e__/auth/login.spec.ts
npx playwright test __e2e__/auth/session-persistence.spec.ts
npx playwright test __e2e__/auth/middleware-redirects.spec.ts
```

### Run Tests in Debug Mode
```bash
npx playwright test --debug
```

### Run Tests with UI Mode
```bash
npx playwright test --ui
```

## 🔧 Test Configuration

Tests are configured via `playwright.config.ts`:
- **Base URL**: `http://localhost:3000`
- **Timeout**: 30 seconds per test
- **Auto-start**: Automatically starts dev server if not running
- **Screenshots**: Captured on failure
- **Videos**: Retained on failure
- **Traces**: Generated on first retry

## 📁 Test Structure

```
__e2e__/
├── auth/                      # Auth-specific tests
│   ├── login.spec.ts         # Login functionality
│   ├── signup.spec.ts        # Registration functionality  
│   ├── logout.spec.ts        # Logout and session cleanup
│   ├── session-persistence.spec.ts  # Issue #7 fix verification
│   ├── middleware-redirects.spec.ts # Issues #8, #11 fix verification
│   └── rate-limiting.spec.ts # Issue #9 fix verification
├── fixtures/
│   └── test-users.json       # Test user credentials
├── helpers/
│   └── auth-helpers.ts       # Shared auth utilities
└── barcode-scanner.spec.ts   # Existing barcode scanner test
```

## 🧪 Test Utilities

### Auth Helpers (`helpers/auth-helpers.ts`)
- `loginUser(page, user)` - Login with credentials
- `logoutUser(page)` - Logout current user
- `signupUser(page, user)` - Register new user
- `isLoggedIn(page)` - Check authentication state
- `clearAuthState(page)` - Clean browser state
- `testProtectedRoute(page, route)` - Test route protection
- `waitForRateLimitError(page)` - Wait for rate limit messages

### Test Fixtures (`fixtures/test-users.json`)
- Predefined test users for consistent testing
- Invalid users for error case testing
- Rate limiting test users

## 🎯 GitHub Issues Covered

| Issue | Test File | Description |
|-------|-----------|-------------|
| #7 | `session-persistence.spec.ts` | Session expiration on public routes |
| #8 | `middleware-redirects.spec.ts` | Redirect logged-in users from auth pages |
| #9 | `rate-limiting.spec.ts` | Production-ready rate limiting |
| #10 | All middleware tests | Simplified middleware matcher |
| #11 | `middleware-redirects.spec.ts` | Post-authentication redirects |
| #12 | All tests | Removed unused auth-middleware.ts |

## 🚀 Why Playwright Instead of Jest?

After extensive research and your experience, we chose Playwright because:

1. **Jest + Next.js middleware = Broken** 🚫
   - `cookies()` context issues
   - Middleware testing is notoriously problematic
   - Teams waste days trying to make it work

2. **Playwright + Real Browser = Works** ✅
   - Tests actual user experience
   - Real HTTP requests through Next.js server
   - No mocking required (aligns with your constraints)
   - Tests middleware behavior through actual browser navigation

3. **Production-Ready Testing** 🏭
   - Tests real Supabase connections
   - Tests real Redis rate limiting
   - Tests actual session management
   - Tests cross-tab behavior

## 🐛 Debugging Test Failures

### Common Issues
1. **Test timeout**: Check if dev server is running
2. **Element not found**: UI might have different selectors
3. **Rate limiting**: Previous test runs might have triggered limits
4. **Session state**: Clear browser state between test runs

### Debug Commands
```bash
# Run specific test with debug info
npx playwright test __e2e__/auth/login.spec.ts --debug

# Generate test report
npx playwright show-report

# View test traces
npx playwright show-trace test-results/trace.zip
```

## 🔄 Test Maintenance

### Updating Test Users
Edit `fixtures/test-users.json` to add new test users or update credentials.

### Adding New Tests
1. Create test file in appropriate directory
2. Import helpers from `../helpers/auth-helpers`
3. Use consistent `beforeEach`/`afterEach` patterns
4. Follow existing naming conventions

### UI Changes
Update selectors in `helpers/auth-helpers.ts` if UI elements change.

## ✅ Verification Checklist

After running all tests, verify:
- [ ] All login scenarios work correctly
- [ ] Session persists across public route navigation (Issue #7 fix)
- [ ] Authenticated users redirected from auth pages (Issue #8 fix)
- [ ] Rate limiting prevents brute force attacks (Issue #9 fix)
- [ ] Post-login redirects work correctly (Issue #11 fix)
- [ ] Protected routes require authentication
- [ ] Logout clears session properly
- [ ] Cross-tab authentication state sync works

## 🎉 Success Metrics

These tests verify that all 6 GitHub auth issues have been properly resolved using real browser interactions and production-like conditions, without the headaches of Jest + middleware compatibility issues.