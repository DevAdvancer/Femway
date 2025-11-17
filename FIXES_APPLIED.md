# Fixes Applied

## Issue 1: "Failed to assign user role" Error

### Problem
Users were getting "Failed to assign user role" error during signup because:
1. The signup action was trying to use admin methods without proper permissions
2. Session might not have been fully established before role insertion

### Solution Applied
1. **Removed admin.deleteUser() call** - This required service role permissions we don't have with anon key
2. **Added session establishment wait** - Added 100ms delay to ensure session is ready
3. **Created new client instance** - Ensures we have the authenticated session
4. **Added role to user metadata** - Stores role as backup in user metadata
5. **Improved error logging** - Better error messages for debugging

### Changes Made
- File: `app/signup/actions.ts`
- Removed: `await supabase.auth.admin.deleteUser(authData.user.id)`
- Added: Session wait and new client creation
- Added: Role in user metadata during signup

## Issue 2: Placeholder Color Not Visible

### Problem
Input placeholder text was not visible or had poor contrast

### Solution Applied
1. **Added global CSS rules** for placeholder styling
2. **Added Tailwind placeholder classes** to all input fields
3. **Set placeholder color** to gray-400 for better visibility

### Changes Made

#### Global CSS (`app/globals.css`)
```css
/* Placeholder color styling */
input::placeholder,
textarea::placeholder,
select::placeholder {
  color: #9ca3af;
  opacity: 1;
}

input:focus::placeholder,
textarea:focus::placeholder,
select:focus::placeholder {
  color: #d1d5db;
}
```

#### Updated Files
- `app/login/page.tsx` - Added `placeholder:text-gray-400` to inputs
- `app/signup/page.tsx` - Added `placeholder:text-gray-400` to inputs

## Testing Instructions

### Test Signup Fix

1. **Go to signup page**: http://localhost:3000/signup

2. **Test Passenger Signup**:
   - Email: `test-passenger@example.com`
   - Password: `password123`
   - Role: Passenger
   - Click "Sign up"
   - Should redirect to `/passengers` without errors

3. **Test Driver Signup**:
   - Email: `test-driver@example.com`
   - Password: `password123`
   - Role: Driver
   - Click "Sign up"
   - Should redirect to `/driver` without errors

4. **Test Admin Signup**:
   - Email: `test-admin@example.com`
   - Password: `password123`
   - Role: Admin
   - Admin Code: `ADMIN-2024-INIT`
   - Click "Sign up"
   - Should redirect to `/admin` without errors

### Test Placeholder Colors

1. **Go to login page**: http://localhost:3000/login
2. **Check placeholders**:
   - Email field should show "you@example.com" in gray
   - Password field should show "••••••••" in gray
   - Placeholders should be clearly visible

3. **Go to signup page**: http://localhost:3000/signup
4. **Check placeholders**:
   - All input fields should have visible gray placeholders
   - Admin code field (when admin selected) should have visible placeholder

## Verification Checklist

- [ ] Passenger signup works without "Failed to assign user role" error
- [ ] Driver signup works without "Failed to assign user role" error
- [ ] Admin signup works with valid admin code
- [ ] Placeholders are visible in login form
- [ ] Placeholders are visible in signup form
- [ ] Placeholder color changes slightly on focus
- [ ] Users are redirected to correct dashboard after signup

## Additional Notes

### If Signup Still Fails

1. **Check Supabase Dashboard**:
   - Go to Authentication → Users
   - Verify user was created
   - Check if user_roles table has entry

2. **Check Browser Console**:
   - Look for detailed error messages
   - Check network tab for failed requests

3. **Verify RLS Policies**:
   ```sql
   SELECT * FROM pg_policies
   WHERE tablename = 'user_roles';
   ```

4. **Check Email Confirmation**:
   - If email confirmation is enabled in Supabase
   - Users need to confirm email before role can be assigned
   - Disable for testing: Authentication → Providers → Email → Uncheck "Confirm email"

### Placeholder Color Customization

To change placeholder colors, edit `app/globals.css`:

```css
/* Change to your preferred color */
input::placeholder {
  color: #your-color-here;
}
```

Or use Tailwind classes:
- `placeholder:text-gray-300` - Lighter
- `placeholder:text-gray-400` - Default (current)
- `placeholder:text-gray-500` - Darker
- `placeholder:text-purple-400` - Purple tint

## Rollback Instructions

If issues persist, you can rollback:

1. **Revert signup action**:
   ```bash
   git checkout HEAD -- app/signup/actions.ts
   ```

2. **Revert placeholder styles**:
   ```bash
   git checkout HEAD -- app/globals.css app/login/page.tsx app/signup/page.tsx
   ```

## Support

If you continue to experience issues:
1. Check the error message in browser console
2. Review Supabase logs in dashboard
3. Verify database schema and RLS policies
4. Ensure email confirmation is disabled for testing
