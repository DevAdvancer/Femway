# Girl Car Booking System

A secure, role-based car booking platform designed specifically for women's safety and comfort. Built with Next.js 15, Supabase, and TypeScript.

## Features

- 🔐 **Secure Authentication** - Email/password authentication with Supabase
- 👥 **Role-Based Access Control** - Three user roles: Passenger, Driver, and Admin
- ⏰ **24-Hour Sessions** - Automatic session management with secure expiration
- 🛡️ **Admin Verification** - Special codes required for admin account creation
- 📱 **Responsive Design** - Beautiful UI that works on all devices
- 🚀 **Modern Stack** - Next.js 15, TypeScript, Tailwind CSS, Supabase

## Quick Start

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bookingapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## User Roles

### Passenger
- Book rides with verified drivers
- View ride history
- Manage profile settings
- Access: `/passengers`

### Driver
- Accept ride requests
- Track earnings
- Manage documents
- Access: `/driver`

### Admin
- Manage users and drivers
- View platform analytics
- Generate admin codes
- Review support tickets
- Access: `/admin`

## Admin Setup

### Creating the First Admin Account

1. Use one of the seeded admin codes:
   - `ADMIN-2024-INIT`
   - `ADMIN-2024-SETUP`
   - `ADMIN-2024-DEMO`

2. Go to `/signup`
3. Select "Admin" role
4. Enter the admin code
5. Complete signup

⚠️ **Important**: Change or deactivate demo codes in production!

See [Admin Code Management](./docs/ADMIN_CODE_MANAGEMENT.md) for details.

## Project Structure

```
bookingapp/
├── app/                      # Next.js app directory
│   ├── (auth)/              # Authentication routes
│   │   ├── login/           # Login page
│   │   └── signup/          # Signup page
│   ├── passengers/          # Passenger dashboard
│   ├── driver/              # Driver dashboard
│   ├── admin/               # Admin dashboard
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page
│   └── error.tsx            # Error page
├── components/              # Reusable components
│   ├── navbar.tsx           # Navigation bar
│   ├── toast.tsx            # Toast notifications
│   └── loading-spinner.tsx  # Loading indicator
├── lib/                     # Utility libraries
│   └── supabase/            # Supabase clients
│       ├── client.ts        # Browser client
│       ├── server.ts        # Server client
│       ├── middleware.ts    # Session middleware
│       └── session-utils.ts # Session utilities
├── docs/                    # Documentation
│   ├── SESSION_MANAGEMENT.md
│   └── ADMIN_CODE_MANAGEMENT.md
├── proxy.ts                 # Next.js proxy (middleware)
└── .env.local              # Environment variables
```

## Database Schema

### Tables

#### `user_roles`
Stores user role assignments.

| Column     | Type      | Description                    |
|------------|-----------|--------------------------------|
| id         | UUID      | Primary key                    |
| user_id    | UUID      | Foreign key to auth.users      |
| role       | ENUM      | passenger, driver, or admin    |
| created_at | TIMESTAMP | Account creation time          |
| updated_at | TIMESTAMP | Last update time               |

#### `admin_codes`
Stores admin verification codes.

| Column     | Type      | Description                    |
|------------|-----------|--------------------------------|
| id         | UUID      | Primary key                    |
| code       | TEXT      | Unique admin code              |
| is_active  | BOOLEAN   | Whether code is active         |
| used_by    | UUID      | User who used the code         |
| used_at    | TIMESTAMP | When code was used             |
| created_at | TIMESTAMP | Code creation time             |

## Authentication Flow

### Signup Flow
```
User → Signup Form → Select Role → (Admin: Enter Code) →
Create Account → Assign Role → Redirect to Dashboard
```

### Login Flow
```
User → Login Form → Validate Credentials →
Fetch Role → Redirect to Role-Specific Dashboard
```

### Session Management
```
Request → Proxy Middleware → Validate Session →
Refresh Tokens → Update Cookies → Allow/Redirect
```

## Security Features

- ✅ Row Level Security (RLS) on all tables
- ✅ Server-side authentication validation
- ✅ 24-hour session expiration
- ✅ Secure cookie configuration
- ✅ Admin code verification
- ✅ PKCE flow for token exchange
- ✅ Automatic token refresh

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Environment Variables

| Variable                                  | Description                    | Required |
|-------------------------------------------|--------------------------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL`               | Supabase project URL           | Yes      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`          | Supabase anonymous key         | Yes      |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase publishable key | Yes      |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Render

## Documentation

- [Session Management](./docs/SESSION_MANAGEMENT.md) - How sessions work
- [Admin Code Management](./docs/ADMIN_CODE_MANAGEMENT.md) - Managing admin codes

## Troubleshooting

### "Invalid admin code" during signup
- Verify the code exists in the database
- Check if the code is active
- Ensure the code hasn't been used

### Session expires immediately
- Check cookie settings in browser
- Verify HTTPS in production
- Review Supabase project settings

### Cannot access protected routes
- Ensure you're logged in
- Check your user role in the database
- Clear cookies and log in again

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **Deployment**: Vercel-ready

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Your License Here]

## Support

For issues and questions:
- Open an issue on GitHub
- Contact: [your-email@example.com]

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [Supabase](https://supabase.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
