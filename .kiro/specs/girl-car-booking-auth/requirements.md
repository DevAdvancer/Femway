# Requirements Document

## Introduction

This document outlines the requirements for a girl car booking system landing page with authentication and role-based access control. The system provides separate interfaces for passengers, drivers, and administrators, with Supabase handling authentication and data persistence. The system enforces 24-hour session duration and requires a special code for admin registration.

## Glossary

- **Authentication System**: The Supabase-based service that manages user identity verification and session management
- **Landing Page**: The initial page users see with login and signup options
- **Passenger Interface**: The web interface accessible at /passengers for booking rides
- **Driver Interface**: The web interface accessible at /driver for managing ride requests
- **Admin Interface**: The web interface accessible at /admin for system administration
- **Admin Code**: A specific verification code required during admin user registration
- **Session Token**: A time-limited credential that expires after 24 hours
- **User Role**: A classification (passenger, driver, or admin) that determines interface access
- **Navigation Bar**: The static top-level navigation component present across all pages

## Requirements

### Requirement 1

**User Story:** As a new user, I want to sign up for an account with my chosen role, so that I can access the appropriate interface for my needs

#### Acceptance Criteria

1. THE Authentication System SHALL provide a signup form that accepts email, password, and role selection
2. WHEN a user selects the passenger role, THE Authentication System SHALL create a passenger account without additional verification
3. WHEN a user selects the driver role, THE Authentication System SHALL create a driver account without additional verification
4. WHEN a user selects the admin role, THE Authentication System SHALL require an admin code input field
5. IF the admin code is incorrect, THEN THE Authentication System SHALL reject the signup request with an error message
6. WHEN signup is successful, THE Authentication System SHALL create a session token with 24-hour expiration
7. WHEN signup is successful, THE Authentication System SHALL redirect the user to their role-specific path

### Requirement 2

**User Story:** As an existing user, I want to log in with my credentials, so that I can access my role-specific interface

#### Acceptance Criteria

1. THE Authentication System SHALL provide a login form that accepts email and password
2. WHEN login credentials are valid, THE Authentication System SHALL create a session token with 24-hour expiration
3. WHEN login is successful for a passenger, THE Authentication System SHALL redirect to /passengers
4. WHEN login is successful for a driver, THE Authentication System SHALL redirect to /driver
5. WHEN login is successful for an admin, THE Authentication System SHALL redirect to /admin
6. IF login credentials are invalid, THEN THE Authentication System SHALL display an error message without redirecting

### Requirement 3

**User Story:** As a logged-in user, I want my session to remain active for 24 hours, so that I don't need to repeatedly log in during my usage period

#### Acceptance Criteria

1. WHEN a user authenticates successfully, THE Authentication System SHALL set session expiration to 24 hours from authentication time
2. WHILE the session token is valid, THEAuthentication System SHALL maintain user access to their role-specific interface
3. WHEN 24 hours have elapsed since authentication, THE Authentication System SHALL expire the session token
4. WHEN the session token expires, THE Authentication System SHALL redirect the user to the landing page
5. THE Authentication System SHALL validate session tokens on each protected route access

### Requirement 4

**User Story:** As a system administrator, I want user data and roles stored in a database, so that authentication and authorization can be managed persistently

#### Acceptance Criteria

1. THE Authentication System SHALL create a users table in Supabase with columns for id, email, encrypted password, role, and timestamps
2. THE Authentication System SHALL create a sessions table in Supabase with columns for user_id, token, expiration timestamp, and creation timestamp
3. WHEN a user signs up, THE Authentication System SHALL insert a new record into the users table
4. WHEN a user logs in, THE Authentication System SHALL create a new record in the sessions table
5. THE Authentication System SHALL use Supabase authentication policies to secure table access

### Requirement 5

**User Story:** As a user navigating the application, I want a consistent navigation bar, so that I have a familiar interface across all pages

#### Acceptance Criteria

1. THE Navigation Bar SHALL display the same layout and content on all pages
2. THE Navigation Bar SHALL not change based on user role or authentication status
3. THE Navigation Bar SHALL remain visible at the top of each page
4. THE Navigation Bar SHALL include branding elements for the girl car booking system

### Requirement 6

**User Story:** As a user, I want to access role-specific interfaces, so that I can perform tasks appropriate to my role

#### Acceptance Criteria

1. THE Authentication System SHALL provide a /passengers route accessible only to users with passenger role
2. THE Authentication System SHALL provide a /driver route accessible only to users with driver role
3. THE Authentication System SHALL provide a /admin route accessible only to users with admin role
4. WHEN a user attempts to access a route without proper role authorization, THE Authentication System SHALL redirect to the landing page
5. WHEN a user attempts to access a protected route without authentication, THE Authentication System SHALL redirect to the landing page
