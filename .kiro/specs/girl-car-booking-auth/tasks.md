# Implementation Plan

- [x] 1. Set up Supabase configuration and environment
  - Install @supabase/supabase-js and @supabase/ssr packages
  - Create .env.local file with Supabase URL and anon key placeholders
  - Create Supabase client utilities for browser and server
  - Create middleware for session management and token refresh
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2. Create database schema using Supabase MCP
  - Create user_roles table with enum type for roles (passenger, driver, admin)
  - Create admin_codes table for admin verification
  - Enable Row Level Security on both tables
  - Create RLS policies for user_roles table
  - Create RLS policies for admin_codes table
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3. Build static navigation component
  - Create Navbar component with static branding
  - Style navbar with Tailwind CSS
  - Ensure navbar is consistent across all pages
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 4. Create landing page
  - Design landing page layout with hero section
  - Add Login and Signup buttons
  - Integrate static navbar
  - Style with Tailwind CSS
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 5. Implement authentication forms
- [x] 5.1 Create login page and form
  - Build login form with email and password inputs
  - Add form validation
  - Create login server action
  - Implement error handling and display
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 5.2 Create signup page and form
  - Build signup form with email, password, and role selector
  - Add conditional admin code input field
  - Create signup server action with role assignment
  - Implement admin code verification logic
  - Add form validation and error handling
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 6. Implement role-based routing and redirection
  - Create /passengers route with protected page
  - Create /driver route with protected page
  - Create /admin route with protected page
  - Implement server-side role verification for each route
  - Add redirection logic based on user role after authentication
  - _Requirements: 2.3, 2.4, 2.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7. Configure session management with 24-hour expiration
  - Configure Supabase client with 24-hour session duration
  - Implement cookie configuration with maxAge of 86400 seconds
  - Update middleware to enforce session expiration
  - Add automatic redirect on session expiration
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 8. Add error handling and user feedback
  - Implement toast notifications for errors
  - Add inline form error messages
  - Create error page for critical failures
  - Add loading states for async operations
  - _Requirements: 1.5, 1.6, 2.6_

- [x] 9. Seed initial admin codes in database
  - Create migration to insert sample admin codes
  - Document admin code management process
  - _Requirements: 1.4, 1.5_

- [x] 10. Create comprehensive documentation
  - Document environment setup process
  - Create README with setup instructions
  - Document admin code management
  - Add API documentation for server actions
  - _Requirements: All_
