# Session Management Documentation

## Overview

This application implements a 24-hour session expiration policy for all authenticated users. Sessions are managed using Supabase Auth with cookie-based storage.

## Configuration

### Session Duration
- **Duration**: 24 hours (86400 seconds)
- **Storage**: HTTP cookies
- **Refresh**: Automatic via middleware

### Cookie Settings
```typescript
{
  maxAge: 86400,        // 24 hours in seconds
  httpOnly: false,      // Accessible by client for refresh
  secure: true,         // HTTPS only in production
  sameSite: 'lax',      // CSRF protection
  path: '/'             // Available across all routes
}
```

## How It Works

### 1. Session Creation
When a user logs in or signs up:
- Supabase Auth creates an access token (JWT) and refresh token
- Tokens are stored in cookies with 24-hour maxAge
- The session is automatically managed by the middleware

### 2. Session Refresh
The proxy middleware (`proxy.ts`) automatically:
- Intercepts all requests
- Validates the current session using `getUser()`
- Refreshes tokens if needed
- Updates cookies with new expiration time
- Redirects to landing page if session is invalid

### 3. Session Expiration
After 24 hours:
- Cookies expire automatically
- Middleware detects invalid session
- User is redirected to landing page
- Must log in again to access protected routes

## Protected Routes

The following routes require valid authentication:
- `/passengers` - Passenger dashboard
- `/driver` - Driver dashboard
- `/admin` - Admin dashboard

### Route Protection Flow
```
Request → Middleware → Validate Session → Check Role → Allow/Redirect
```

1. **Middleware Check**: Validates session exists and is not expired
2. **Page-Level Check**: Verifies user has correct role for the route
3. **Auto-Redirect**: Sends user to correct dashboard if wrong role

## Session Utilities

### Available Functions

#### `validateSession()`
Validates if the current session is still valid.
```typescript
const user = await validateSession()
if (!user) {
  // Session expired or invalid
}
```

#### `getSessionExpiration()`
Gets the session expiration timestamp.
```typescript
const expirationTime = await getSessionExpiration()
// Returns timestamp in milliseconds or null
```

#### `isSessionExpiringSoon()`
Checks if session will expire within 5 minutes.
```typescript
const expiringSoon = await isSessionExpiringSoon()
if (expiringSoon) {
  // Show warning to user
}
```

## Security Considerations

### Why 24 Hours?
- Balances security with user convenience
- Reduces risk of session hijacking
- Complies with common security best practices
- Appropriate for a ride booking application

### Token Validation
- Always use `getUser()` on server-side (validates JWT)
- Never trust `getSession()` alone in server code
- Middleware validates on every request
- Page-level validation provides additional security

### Cookie Security
- `secure: true` in production (HTTPS only)
- `sameSite: 'lax'` prevents CSRF attacks
- `httpOnly: false` allows client-side refresh
- Tokens are encrypted by Supabase

## User Experience

### Automatic Refresh
- Users don't need to manually refresh
- Seamless experience while actively using the app
- Tokens refresh automatically before expiration

### Session Expiry Handling
- Clean redirect to landing page
- No error messages (graceful degradation)
- User can immediately log back in
- Previous session data is cleared

## Development vs Production

### Development
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
# Cookies work over HTTP
```

### Production
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# Cookies require HTTPS (secure flag)
```

## Troubleshooting

### Session Not Persisting
1. Check cookie settings in browser
2. Verify HTTPS in production
3. Check Supabase project settings
4. Ensure middleware is running

### Premature Expiration
1. Verify maxAge is set to 86400
2. Check server/client time sync
3. Review Supabase Auth settings
4. Check for cookie deletion

### Redirect Loops
1. Verify role assignment in database
2. Check middleware logic
3. Ensure user_roles table has correct data
4. Review page-level auth checks

## Testing

### Manual Testing
1. Log in as a user
2. Wait 24 hours
3. Try to access protected route
4. Should redirect to landing page

### Automated Testing
```typescript
// Test session expiration
test('session expires after 24 hours', async () => {
  // Mock time to 24 hours + 1 second
  // Attempt to access protected route
  // Expect redirect to landing page
})
```

## Monitoring

### Metrics to Track
- Average session duration
- Session expiration rate
- Re-authentication frequency
- Failed authentication attempts

### Logs to Review
- Session creation events
- Token refresh events
- Expiration redirects
- Authentication errors
