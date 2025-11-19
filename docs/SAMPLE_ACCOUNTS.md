# Sample Accounts Setup Guide

This guide will help you create test accounts for all three roles in Femway.

## Recommended Test Credentials

### Admin Account
- **Email**: admin@femway.com
- **Password**: Admin@123456
- **Admin Code**: ADMIN-2024-DEMO

### Driver Account
- **Email**: driver@femway.com
- **Password**: Driver@123456

### Passenger Account
- **Email**: passenger@femway.com
- **Password**: Passenger@123456

---

## How to Create Sample Accounts

### Method 1: Manual Creation (Recommended)

**Step 1: Create Passenger Account**
1. Navigate to `/signup` in your browser
2. Fill in the form:
   - Email: `passenger@femway.com`
   - Password: `Passenger@123456`
   - Role: Select **Passenger**
3. Click "Sign Up"
4. You'll be redirected to the passenger dashboard

**Step 2: Create Driver Account**
1. Sign out from the passenger account
2. Navigate to `/signup`
3. Fill in the form:
   - Email: `driver@femway.com`
   - Password: `Driver@123456`
   - Role: Select **Driver**
4. Click "Sign Up"
5. You'll be redirected to the driver dashboard
6. Click "Upload Documents" to add required verification documents

**Step 3: Create Admin Account**
1. Sign out from the driver account
2. Navigate to `/signup`
3. Fill in the form:
   - Email: `admin@femway.com`
   - Password: `Admin@123456`
   - Role: Select **Admin**
   - Admin Code: `ADMIN-2024-DEMO`
4. Click "Sign Up"
5. You'll be redirected to the admin dashboard

### Method 2: Automated Script (Requires Service Role Key)

If you have `SUPABASE_SERVICE_ROLE_KEY` in your `.env.local`:

```bash
node scripts/create-sample-accounts.js
```

---

## Using the Sample Accounts

### Admin Dashboard (`/admin`)
**Login**: admin@femway.com / Admin@123456

Features:
- View all drivers and their verification status
- Approve/reject driver documents
- Manage pricing settings (per km rate, driver cost, office hours multiplier)
- View all rides across the platform
- Manage admin codes

### Driver Dashboard (`/driver`)
**Login**: driver@femway.com / Driver@123456

Features:
- Upload verification documents (6 required):
  - Government ID
  - Selfie
  - Driving License
  - Car RC (Registration Certificate)
  - Number Plate Photo
  - Car Photos
- Request admin verification
- Accept/reject ride requests (after verification)
- Complete rides and set final cost
- View ride history and earnings

### Passenger Dashboard (`/passengers`)
**Login**: passenger@femway.com / Passenger@123456

Features:
- Book rides with pickup and dropoff locations
- View estimated cost before booking
- Select from available verified drivers
- Schedule rides for later
- View ride history
- Cancel pending rides

---

## Complete Testing Workflow

1. **Setup Phase**:
   - Create all three accounts using Method 1 above
   - Login as admin and set pricing in `/admin/pricing`

2. **Driver Verification**:
   - Login as driver
   - Click "Upload Documents" button
   - Upload all 6 required documents
   - Click "Request Verification"
   - Logout

3. **Admin Approval**:
   - Login as admin
   - Go to "Drivers" section
   - Click on the driver account
   - Review documents
   - Click "Verify Driver"
   - Logout

4. **Book a Ride**:
   - Login as passenger
   - Enter pickup location (e.g., "Connaught Place, Delhi")
   - Enter dropoff location (e.g., "India Gate, Delhi")
   - View estimated cost
   - Select the verified driver
   - Click "Book Ride"

5. **Accept Ride**:
   - Login as driver
   - View pending ride request
   - Click "Accept Ride"

6. **Complete Ride**:
   - As driver, click "Complete Ride"
   - Enter final cost (or use estimated cost)
   - Confirm completion

7. **View Results**:
   - As passenger: Check ride history
   - As driver: View earnings and completed rides
   - As admin: View all platform activity

---

## Available Admin Codes

Check your database `admin_codes` table for available codes:
- `ADMIN-2024-INIT`
- `ADMIN-2024-SETUP`
- `ADMIN-2024-DEMO`

**Note**: Each admin code can only be used once.

---

## Troubleshooting

**"Email already registered"**
- The account already exists. Try logging in instead.

**"Invalid admin code"**
- Check if the code exists in the `admin_codes` table
- Verify the code hasn't been used already
- Codes are case-sensitive

**"Driver not showing in available drivers"**
- Driver must upload all documents
- Admin must verify the driver
- Driver must not have an active ride

**"Cannot book ride"**
- Ensure pricing is set in admin dashboard
- Check that at least one verified driver exists
- Verify pickup and dropoff locations are valid

---

## Security Notes

- These are **test accounts only** - do not use in production
- Change passwords immediately if deploying to production
- Admin codes should be kept secure
- Service role keys should never be committed to version control
