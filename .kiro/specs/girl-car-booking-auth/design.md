# Design Document

## Overview

This design document outlines the architecture for a girl car booking system landing page with role-based authentication. The system uses Next.js 15 with the App Router, Supabase for authentication and database management, and implements a 24-hour session duration with role-based access control for three user types: passengers, drivers, and admins.

## Architecture

### Technology Stack

- **Frontend Framework**: Next.js 15 (App Router with TypeScript)
- **Authentication**: Supabase Auth with @supabase/ssr package
- **Database**: Supabase (PostgreSQL)
- **Session Management**: Cookie-based with PKCE flow
- **Styling**: Tailwind CSS (already configured in the project)

### High-Level Architecture

```mermaid
graph TD
    A[Landing Page] --> B{User Action}
    B -->|Login| C[Login Form]
    B -->|Signup| D[Signup Form]
    C --> E[Supabase Auth]
    D --> E
    E --> F{Role Check}
    F -->|Passenger| G[/passengers]
    F -->|Driver| H[/driver]
    F -->|Admin| I[/admin]
    G --> J[Session Validation]
    H --> J
    I --> J
    J -->|Valid| K[Protected Content]
    J -->|Invalid/Expired| A
```

## Components and Interfaces

### 1. Authentication Components

#### Landing Page (`app/page.tsx`)
- Static navigation bar
- Hero section with branding
- Login and Signup buttons
- No dynamic content based on auth state

#### Auth Forms (`app/(auth)/login/page.tsx` and `app/(auth)/signup/page.tsx`)
- Email and password inputs
- Role selector (passenger, driver, admin)
- Admin code input (conditional, shown only for admin role)
- Form validation
- Error message display
- Server actions for authentication

#### Server Actions (`app/(auth)/actions.ts`)
- `loginAction`: Handles login with email/password
- `signupAction`: Handles signup with role assignment and admin code verification
- Role-based redirection logic
- Error handling and validation

### 2. Supabase Client Configuration

#### Browser Client (`lib/supabase/client.ts`)
```typescript
- Uses createBrowserClient from @supabase/ssr
- Configured for client-side operations
- Accesses environment variables for URL and anon key
```

#### Server Client (`lib/supabase/server.ts`)
```typescript
- Uses createServerClient from @supabase/ssr
- Cookie-based session management
- Configured with 24-hour session duration
- Handles cookie operations (getAll, setAll)
```

#### Middleware (`middleware.ts`)
```typescript
- Intercepts all requests
- Refreshes auth tokens
- Validates session expiration
- Redirects expired sessions to landing page
- Updates cookies with refreshed tokens
```

### 3. Protected Routes

#### Route Structure
```
app/
├── page.tsx (landing)
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   └── signup/
│       └── page.tsx
├── passengers/
│   └── page.tsx (protected)
├── driver/
│   └── page.tsx (protected)
└── admin/
    └── page.tsx (protected)
```

#### Route Protection Mechanism
- Middleware checks for valid session
- Server-side validation using `supabase.auth.getUser()`
- Role verification against database
- Automatic redirect to landing page if unauthorized

### 4. Navigation Component

#### Static Navbar (`components/navbar.tsx`)
- Logo/branding
- Application name
- No dynamic elements
- Consistent across all pages
- No user-specific information displayed

## Data Models

### Database Schema

#### Users Table (Supabase Auth - `auth.users`)
```sql
-- Managed by Supabase Auth
-- Contains: id, email, encrypted_password, created_at, updated_at
```

#### User Roles Table (`public.user_roles`)
```sql
CREATE TYPE user_role_enum AS ENUM ('passenger', 'driver', 'admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role user_role_enum NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own role
CREATE POLICY "Users can read own role"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Service role can insert roles during signup
CREATE POLICY "Service role can insert roles"
  ON public.user_roles
  FOR INSERT
  TO service_role
  WITH CHECK (true);
```

#### Admin Codes Table (`public.admin_codes`)
```sql
CREATE TABLE public.admin_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.admin_codes ENABLE ROW LEVEL SECURITY;

-- No public access - only server-side validation
CREATE POLICY "No direct access"
  ON public.admin_codes
  FOR ALL
  TO authenticated
  USING (false);
```

### Session Management

#### Session Configuration
```typescript
{
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: cookieStorage,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-session-duration': '86400' // 24 hours in seconds
    }
  }
}
```

#### Cookie Configuration
```typescript
{
  name: 'sb-auth-token',
  maxAge: 86400, // 24 hours
  httpOnly: false, // Needs to be accessible by client for refresh
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/'
}
```

## Error Handling

### Authentication Errors

#### Login Errors
- Invalid credentials → Display "Invalid email or password"
- Network errors → Display "Connection error, please try again"
- Session expired → Redirect to landing page with message

#### Signup Errors
- Email already exists → Display "Email already registered"
- Invalid admin code → Display "Invalid admin code"
- Weak password → Display password requirements
- Network errors → Display "Connection error, please try again"

### Authorization Errors

#### Role Mismatch
- User attempts to access wrong role path → Redirect to correct path
- User has no role assigned → Redirect to landing page with error

#### Session Errors
- Expired session → Clear cookies and redirect to landing page
- Invalid token → Force re-authentication
- Missing session → Redirect to login

### Error Display Strategy
- Toast notifications for temporary errors
- Inline form errors for validation issues
- Full-page error for critical failures
- Automatic retry for network errors (max 3 attempts)

## Testing Strategy

### Unit Tests

#### Authentication Logic
- Test signup with valid passenger credentials
- Test signup with valid driver credentials
- Test signup with valid admin credentials and code
- Test signup with invalid admin code
- Test login with valid credentials
- Test login with invalid credentials
- Test role assignment during signup

#### Session Management
- Test session creation with 24-hour expiration
- Test session refresh before expiration
- Test session expiration after 24 hours
- Test cookie setting and retrieval
- Test middleware token refresh

#### Role Verification
- Test role extraction from database
- Test role-based redirection
- Test unauthorized access attempts

### Integration Tests

#### Authentication Flow
- Complete signup flow for each role
- Complete login flow with redirection
- Admin code validation during signup
- Session persistence across page refreshes

#### Protected Routes
- Access protected route with valid session
- Access protected route with expired session
- Access protected route without session
- Access wrong role route with valid session

#### Middleware Behavior
- Token refresh on valid session
- Redirect on expired session
- Cookie updates after refresh
- Session validation on each request

### End-to-End Tests

#### User Journeys
- New passenger signup and access to /passengers
- New driver signup and access to /driver
- New admin signup with code and access to /admin
- Existing user login and role-based redirect
- Session expiration after 24 hours
- Logout and re-login

#### Cross-Browser Testing
- Chrome, Firefox, Safari, Edge
- Mobile browsers (iOS Safari, Chrome Mobile)
- Cookie handling across browsers
- Session persistence across browsers

### Manual Testing Checklist
- [ ] Landing page displays correctly
- [ ] Navbar is static across all pages
- [ ] Login form validates inputs
- [ ] Signup form shows admin code field for admin role
- [ ] Invalid admin code prevents signup
- [ ] Successful login redirects to correct role path
- [ ] Protected routes require authentication
- [ ] Session expires after 24 hours
- [ ] Middleware refreshes tokens correctly
- [ ] Error messages display appropriately

## Security Considerations

### Authentication Security
- Passwords hashed by Supabase Auth (bcrypt)
- PKCE flow for secure token exchange
- Admin codes stored securely in database
- No sensitive data in client-side code

### Session Security
- HttpOnly cookies for refresh tokens (where possible)
- Secure flag in production
- SameSite=Lax to prevent CSRF
- 24-hour expiration enforced
- Automatic token refresh

### Authorization Security
- Row Level Security (RLS) enabled on all tables
- Server-side role verification
- No client-side role checks for security decisions
- Middleware validates every request

### Data Protection
- Environment variables for sensitive keys
- No API keys in client code
- Database credentials never exposed
- Admin codes one-time use (optional enhancement)

## Performance Considerations

### Optimization Strategies
- Server-side rendering for landing page
- Static generation where possible
- Lazy loading for protected routes
- Minimal client-side JavaScript
- Efficient database queries with indexes

### Caching Strategy
- Static assets cached by CDN
- No caching for authenticated pages
- Session data cached in cookies
- Database query results not cached (real-time data)

### Monitoring
- Track authentication success/failure rates
- Monitor session expiration patterns
- Log middleware performance
- Track database query performance
