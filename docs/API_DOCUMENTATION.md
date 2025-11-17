# API Documentation

## Overview

This document describes the server actions (API endpoints) available in the Girl Car Booking System. All actions are implemented as Next.js Server Actions and handle authentication, authorization, and data management.

## Authentication Actions

### Login Action

**File**: `app/login/actions.ts`

**Function**: `loginAction(formData: FormData)`

Authenticates a user and redirects them to their role-specific dashboard.

#### Parameters

| Parameter | Type       | Description                    |
|-----------|------------|--------------------------------|
| formData  | FormData   | Form data containing credentials |

#### FormData Fields

| Field    | Type   | Required | Description           |
|----------|--------|----------|-----------------------|
| email    | string | Yes      | User's email address  |
| password | string | Yes      | User's password       |

#### Returns

```typescript
{ error?: string } | void (redirects on success)
```

#### Behavior

1. Validates email and password are provided
2. Attempts authentication with Supabase
3. Fetches user role from database
4. Redirects to role-specific dashboard:
   - Passenger → `/passengers`
   - Driver → `/driver`
   - Admin → `/admin`

#### Error Responses

| Error Message                    | Cause                           |
|----------------------------------|---------------------------------|
| "Email and password are required"| Missing credentials             |
| "Invalid email or password"      | Authentication failed           |
| "Unable to determine user role"  | Role not found in database      |
| "Invalid user role"              | Unknown role type               |

#### Example Usage

```typescript
// In a client component
async function handleLogin(formData: FormData) {
  const result = await loginAction(formData)
  if (result?.error) {
    console.error(result.error)
  }
}
```

---

### Signup Action

**File**: `app/signup/actions.ts`

**Function**: `signupAction(formData: FormData)`

Creates a new user account with role assignment and optional admin code verification.

#### Parameters

| Parameter | Type       | Description                    |
|-----------|------------|--------------------------------|
| formData  | FormData   | Form data containing user info |

#### FormData Fields

| Field     | Type   | Required | Description                    |
|-----------|--------|----------|--------------------------------|
| email     | string | Yes      | User's email address           |
| password  | string | Yes      | User's password (min 6 chars)  |
| role      | string | Yes      | passenger, driver, or admin    |
| adminCode | string | Conditional | Required only for admin role |

#### Returns

```typescript
{ error?: string } | void (redirects on success)
```

#### Behavior

1. Validates all required fields
2. If role is admin:
   - Verifies admin code exists
   - Checks code is active
   - Ensures code hasn't been used
3. Creates user account in Supabase Auth
4. Inserts role into `user_roles` table
5. If admin, marks code as used
6. Redirects to role-specific dashboard

#### Error Responses

| Error Message                              | Cause                           |
|--------------------------------------------|------------------------|
| "All fields are required"                  | Missing required fields         |
| "Password must be at least 6 characters"   | Password too short              |
| "Admin code is required for admin registration" | Admin role without code   |
| "Invalid admin code"                       | Code doesn't exist              |
| "This admin code has been deactivated"     | Code is inactive                |
| "This admin code has already been used"    | Code already used               |
| "Email already registered"                 | Email exists in system          |
| "Failed to assign user role"               | Database error                  |

#### Example Usage

```typescript
// In a client component
async function handleSignup(formData: FormData) {
  const result = await signupAction(formData)
  if (result?.error) {
    console.error(result.error)
  }
}
```

---

## Session Management

### Validate Session

**File**: `lib/supabase/session-utils.ts`

**Function**: `validateSession()`

Validates if the current session is still valid.

#### Returns

```typescript
Promise<User | null>
```

#### Example Usage

```typescript
const user = await validateSession()
if (!user) {
  // Session expired or invalid
  redirect('/')
}
```

---

### Get Session Expiration

**File**: `lib/supabase/session-utils.ts`

**Function**: `getSessionExpiration()`

Gets the session expiration timestamp.

#### Returns

```typescript
Promise<number | null>
```

Returns timestamp in milliseconds or null if no session.

#### Example Usage

```typescript
const expirationTime = await getSessionExpiration()
if (expirationTime) {
  const timeLeft = expirationTime - Date.now()
  console.log(`Session expires in ${timeLeft}ms`)
}
```

---

### Is Session Expiring Soon

**File**: `lib/supabase/session-utils.ts`

**Function**: `isSessionExpiringSoon()`

Checks if session will expire within 5 minutes.

#### Returns

```typescript
Promise<boolean>
```

#### Example Usage

```typescript
const expiringSoon = await isSessionExpiringSoon()
if (expiringSoon) {
  // Show warning to user
  showToast('Your session will expire soon', 'warning')
}
```

---

## Middleware

### Update Session

**File**: `lib/supabase/middleware.ts`

**Function**: `updateSession(request: NextRequest)`

Automatically refreshes auth tokens and validates sessions on every request.

#### Parameters

| Parameter | Type        | Description           |
|-----------|-------------|-----------------------|
| request   | NextRequest | Incoming HTTP request |

#### Returns

```typescript
Promise<NextResponse>
```

#### Behavior

1. Creates Supabase client with cookie handling
2. Validates current session using `getUser()`
3. Refreshes tokens if needed
4. Updates cookies with 24-hour maxAge
5. Redirects to landing page if:
   - No valid session
   - Accessing protected route

#### Protected Routes

- `/passengers`
- `/driver`
- `/admin`

---

## Client Utilities

### Create Browser Client

**File**: `lib/supabase/client.ts`

**Function**: `createClient()`

Creates a Supabase client for browser-side operations.

#### Returns

```typescript
SupabaseClient
```

#### Configuration

- Persistent sessions enabled
- Auto-refresh tokens enabled
- Detects session in URL

#### Example Usage

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'

export default function MyComponent() {
  const supabase = createClient()

  async function fetchData() {
    const { data } = await supabase
      .from('table')
      .select('*')
  }
}
```

---

### Create Server Client

**File**: `lib/supabase/server.ts`

**Function**: `createClient()`

Creates a Supabase client for server-side operations.

#### Returns

```typescript
Promise<SupabaseClient>
```

#### Configuration

- Cookie-based session storage
- 24-hour cookie maxAge
- Server-side only

#### Example Usage

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function ServerComponent() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  return <div>Welcome {user?.email}</div>
}
```

---

## Error Handling

### Error Types

#### Authentication Errors
- Invalid credentials
- Email already exists
- Weak password
- Network errors

#### Authorization Errors
- Invalid role
- Missing admin code
- Used admin code
- Inactive admin code

#### Session Errors
- Expired session
- Invalid token
- Missing session

### Error Response Format

All server actions return errors in this format:

```typescript
{
  error: string  // Human-readable error message
}
```

### Handling Errors

```typescript
const result = await loginAction(formData)

if (result?.error) {
  // Display error to user
  setError(result.error)

  // Log for debugging
  console.error('Login failed:', result.error)

  // Show toast notification
  showToast(result.error, 'error')
}
```

---

## Rate Limiting

Currently, there is no rate limiting implemented. Consider adding:

- Login attempt limits (e.g., 5 attempts per 15 minutes)
- Signup limits per IP
- Admin code verification limits

---

## Security Considerations

### Server Actions
- All actions run on the server
- No sensitive data exposed to client
- Automatic CSRF protection

### Authentication
- Passwords hashed by Supabase
- JWT tokens for session management
- Automatic token refresh

### Authorization
- Role verified on every request
- RLS policies enforce data access
- Admin codes one-time use

---

## Testing

### Testing Server Actions

```typescript
import { loginAction } from '@/app/login/actions'

describe('loginAction', () => {
  it('should login with valid credentials', async () => {
    const formData = new FormData()
    formData.append('email', 'test@example.com')
    formData.append('password', 'password123')

    const result = await loginAction(formData)
    expect(result).toBeUndefined() // Redirects on success
  })

  it('should return error with invalid credentials', async () => {
    const formData = new FormData()
    formData.append('email', 'test@example.com')
    formData.append('password', 'wrong')

    const result = await loginAction(formData)
    expect(result?.error).toBe('Invalid email or password')
  })
})
```

---

## Future Enhancements

- [ ] Password reset functionality
- [ ] Email verification
- [ ] Two-factor authentication
- [ ] OAuth providers (Google, Apple)
- [ ] Rate limiting
- [ ] Audit logging
- [ ] API versioning
- [ ] GraphQL API option
