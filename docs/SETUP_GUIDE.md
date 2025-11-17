# Setup Guide

Complete guide to setting up the Girl Car Booking System from scratch.

## Prerequisites

Before you begin, ensure you have:

- ✅ Node.js 18 or higher installed
- ✅ npm or yarn package manager
- ✅ A Supabase account (free tier works)
- ✅ Git installed
- ✅ A code editor (VS Code recommended)

## Step 1: Create Supabase Project

### 1.1 Sign Up for Supabase

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email

### 1.2 Create New Project

1. Click "New Project"
2. Choose your organization
3. Enter project details:
   - **Name**: girl-car-booking (or your choice)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait 2-3 minutes for setup to complete

### 1.3 Get API Credentials

1. Go to Project Settings → API
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`
   - **Publishable key**: `sb_publishable_...`

## Step 2: Clone and Install

### 2.1 Clone Repository

```bash
git clone <repository-url>
cd bookingapp
```

### 2.2 Install Dependencies

```bash
npm install
```

This installs:
- Next.js 15
- React 19
- Supabase client libraries
- Tailwind CSS
- TypeScript

### 2.3 Configure Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key-here
   ```

## Step 3: Database Setup

### 3.1 Run Migrations

The database schema has already been created via MCP. Verify it:

1. Go to Supabase Dashboard → Table Editor
2. You should see these tables:
   - `user_roles`
   - `admin_codes`

### 3.2 Verify RLS Policies

1. Go to Authentication → Policies
2. Verify policies exist for:
   - `user_roles` table
   - `admin_codes` table

### 3.3 Check Admin Codes

1. Go to Table Editor → `admin_codes`
2. You should see 3 seeded codes:
   - `ADMIN-2024-INIT`
   - `ADMIN-2024-SETUP`
   - `ADMIN-2024-DEMO`

## Step 4: Configure Authentication

### 4.1 Email Settings (Optional)

For production, configure email templates:

1. Go to Authentication → Email Templates
2. Customize:
   - Confirm signup
   - Magic Link
   - Change Email Address
   - Reset Password

### 4.2 URL Configuration

1. Go to Authentication → URL Configuration
2. Add your site URL:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

### 4.3 Disable Email Confirmation (Development Only)

For easier testing:

1. Go to Authentication → Providers → Email
2. Uncheck "Confirm email"
3. Click "Save"

⚠️ **Re-enable this in production!**

## Step 5: Run the Application

### 5.1 Start Development Server

```bash
npm run dev
```

### 5.2 Open Browser

Navigate to [http://localhost:3000](http://localhost:3000)

You should see the landing page!

## Step 6: Create Test Accounts

### 6.1 Create Passenger Account

1. Click "Sign Up"
2. Enter email: `passenger@test.com`
3. Enter password: `password123`
4. Select role: "Passenger"
5. Click "Sign up"
6. You'll be redirected to `/passengers`

### 6.2 Create Driver Account

1. Sign out (if logged in)
2. Click "Sign Up"
3. Enter email: `driver@test.com`
4. Enter password: `password123`
5. Select role: "Driver"
6. Click "Sign up"
7. You'll be redirected to `/driver`

### 6.3 Create Admin Account

1. Sign out (if logged in)
2. Click "Sign Up"
3. Enter email: `admin@test.com`
4. Enter password: `password123`
5. Select role: "Admin"
6. Enter admin code: `ADMIN-2024-INIT`
7. Click "Sign up"
8. You'll be redirected to `/admin`

## Step 7: Verify Everything Works

### 7.1 Test Authentication

- ✅ Can sign up with all three roles
- ✅ Can log in with created accounts
- ✅ Redirected to correct dashboard
- ✅ Can sign out

### 7.2 Test Session Management

- ✅ Session persists on page refresh
- ✅ Can access protected routes when logged in
- ✅ Redirected to landing page when not logged in

### 7.3 Test Role-Based Access

- ✅ Passenger can only access `/passengers`
- ✅ Driver can only access `/driver`
- ✅ Admin can only access `/admin`
- ✅ Wrong role redirects to correct dashboard

## Step 8: Production Deployment

### 8.1 Prepare for Production

1. **Update Admin Codes**:
   ```sql
   -- Deactivate demo codes
   UPDATE public.admin_codes
   SET is_active = false
   WHERE code LIKE 'ADMIN-2024-%';

   -- Create production codes
   INSERT INTO public.admin_codes (code, is_active)
   VALUES ('YOUR-SECURE-CODE-HERE', true);
   ```

2. **Enable Email Confirmation**:
   - Go to Authentication → Providers → Email
   - Check "Confirm email"
   - Save

3. **Update Environment Variables**:
   - Set production Supabase URL
   - Update site URL in Supabase settings

### 8.2 Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
6. Click "Deploy"

### 8.3 Update Supabase URLs

1. Go to Supabase Dashboard
2. Authentication → URL Configuration
3. Add your Vercel URL:
   - `https://your-app.vercel.app`

## Troubleshooting

### Issue: "Invalid API key"

**Solution**:
- Verify `.env.local` has correct values
- Restart development server
- Check for typos in environment variables

### Issue: "Table does not exist"

**Solution**:
- Verify migrations ran successfully
- Check Supabase Dashboard → Table Editor
- Re-run migrations if needed

### Issue: "Admin code not working"

**Solution**:
- Check code exists in database
- Verify code is active
- Ensure code hasn't been used
- Check for typos (case-sensitive)

### Issue: "Session not persisting"

**Solution**:
- Clear browser cookies
- Check browser allows cookies
- Verify HTTPS in production
- Check Supabase project status

### Issue: "Cannot access protected routes"

**Solution**:
- Ensure you're logged in
- Check user role in database
- Verify RLS policies are enabled
- Check proxy.ts is running

## Next Steps

After setup is complete:

1. **Customize Branding**:
   - Update colors in Tailwind config
   - Change logo and app name
   - Customize landing page content

2. **Add Features**:
   - Implement booking functionality
   - Add payment integration
   - Create driver verification flow
   - Build admin management tools

3. **Enhance Security**:
   - Add rate limiting
   - Implement 2FA
   - Add audit logging
   - Set up monitoring

4. **Optimize Performance**:
   - Add caching
   - Optimize images
   - Implement lazy loading
   - Add CDN

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review the [API Documentation](./API_DOCUMENTATION.md)
3. Check [Session Management](./SESSION_MANAGEMENT.md) guide
4. Open an issue on GitHub
5. Contact support

## Checklist

Use this checklist to track your setup progress:

- [ ] Supabase project created
- [ ] API credentials obtained
- [ ] Repository cloned
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Database schema verified
- [ ] Admin codes seeded
- [ ] Development server running
- [ ] Test accounts created
- [ ] Authentication tested
- [ ] Session management verified
- [ ] Role-based access tested
- [ ] Production deployment planned
- [ ] Security measures reviewed

Congratulations! Your Girl Car Booking System is now set up and ready for development! 🎉
