# Admin Code Management

## Overview

Admin codes are special verification codes required to create admin accounts. This ensures that only authorized individuals can gain administrative access to the platform.

## Initial Admin Codes

The following admin codes have been seeded in the database for initial setup:

1. `ADMIN-2024-INIT` - For initial platform setup
2. `ADMIN-2024-SETUP` - For secondary admin account
3. `ADMIN-2024-DEMO` - For demonstration purposes

**⚠️ IMPORTANT**: These codes should be changed or deactivated after initial setup in production.

## How Admin Codes Work

### During Signup
1. User selects "Admin" role during signup
2. System displays admin code input field
3. User enters admin code
4. System validates code against database
5. If valid and active, account is created
6. Code is marked as used and deactivated

### Code Properties
- **Unique**: Each code can only be used once
- **Active Status**: Can be enabled/disabled
- **Usage Tracking**: Records who used the code and when
- **One-Time Use**: Automatically deactivated after use

## Managing Admin Codes

### Via SQL (Supabase Dashboard)

#### Create New Admin Code
```sql
INSERT INTO public.admin_codes (code, is_active)
VALUES ('YOUR-CUSTOM-CODE', true);
```

#### List All Admin Codes
```sql
SELECT
  code,
  is_active,
  used_by,
  used_at,
  created_at
FROM public.admin_codes
ORDER BY created_at DESC;
```

#### Deactivate a Code
```sql
UPDATE public.admin_codes
SET is_active = false
WHERE code = 'CODE-TO-DEACTIVATE';
```

#### Reactivate an Unused Code
```sql
UPDATE public.admin_codes
SET is_active = true
WHERE code = 'CODE-TO-REACTIVATE'
  AND used_by IS NULL;
```

#### Delete a Code (Not Recommended)
```sql
DELETE FROM public.admin_codes
WHERE code = 'CODE-TO-DELETE'
  AND used_by IS NULL;
```

## Best Practices

### Code Format
- Use uppercase letters and hyphens
- Include year or date for tracking
- Make codes memorable but secure
- Example: `ADMIN-2024-DEPT-001`

### Security
1. **Never share codes publicly**
2. **Generate unique codes for each admin**
3. **Deactivate codes after use**
4. **Regularly audit active codes**
5. **Use strong, unpredictable codes**

### Code Generation
Generate secure admin codes using:

```javascript
// Example code generator
function generateAdminCode() {
  const prefix = 'ADMIN'
  const year = new Date().getFullYear()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${year}-${random}`
}
```

Or use a password generator with these settings:
- Length: 16-20 characters
- Include: Uppercase, numbers, hyphens
- Format: ADMIN-YYYY-XXXXXX

## Production Setup

### Step 1: Remove Demo Codes
```sql
-- Deactivate all demo codes
UPDATE public.admin_codes
SET is_active = false
WHERE code LIKE 'ADMIN-2024-%';
```

### Step 2: Create Production Codes
```sql
-- Create secure production codes
INSERT INTO public.admin_codes (code, is_active) VALUES
  ('ADMIN-2024-PROD-A7X9K2', true),
  ('ADMIN-2024-PROD-M3N8P5', true);
```

### Step 3: Distribute Securely
- Send codes via secure channels (encrypted email, password manager)
- Never send via plain text or public channels
- Confirm receipt before deactivating backup codes

## Monitoring

### Check Code Usage
```sql
SELECT
  code,
  is_active,
  CASE
    WHEN used_by IS NOT NULL THEN 'Used'
    WHEN is_active THEN 'Active'
    ELSE 'Inactive'
  END as status,
  used_at,
  (SELECT email FROM auth.users WHERE id = used_by) as used_by_email
FROM public.admin_codes
ORDER BY created_at DESC;
```

### Audit Trail
```sql
-- View all admin accounts created
SELECT
  u.email,
  u.created_at,
  ac.code as admin_code_used
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.admin_codes ac ON u.id = ac.used_by
WHERE ur.role = 'admin'
ORDER BY u.created_at DESC;
```

## Troubleshooting

### "Invalid admin code" Error
- Check if code exists in database
- Verify code is active (`is_active = true`)
- Ensure code hasn't been used (`used_by IS NULL`)
- Check for typos (codes are case-sensitive)

### Code Not Working After Creation
- Verify code was inserted successfully
- Check `is_active` is set to `true`
- Ensure no whitespace in code
- Confirm RLS policies allow access

### Need to Reset a Used Code
```sql
-- Reset a code (use with caution)
UPDATE public.admin_codes
SET
  used_by = NULL,
  used_at = NULL,
  is_active = true
WHERE code = 'CODE-TO-RESET';
```

## Emergency Access

If all admin codes are exhausted or lost:

1. **Via Supabase Dashboard**:
   - Go to SQL Editor
   - Create new admin code
   - Use code to create admin account

2. **Via Direct Database Access**:
   ```sql
   -- Create emergency admin code
   INSERT INTO public.admin_codes (code, is_active)
   VALUES ('EMERGENCY-' || NOW()::text, true);
   ```

3. **Via Service Role**:
   - Use service role key to directly insert admin role
   - Only for emergency situations

## Automation (Future Enhancement)

Consider implementing:
- Admin dashboard for code management
- Automatic code generation
- Email notification on code usage
- Code expiration dates
- Bulk code generation
- Code usage analytics

## Related Documentation

- [Session Management](./SESSION_MANAGEMENT.md)
- [User Roles](./USER_ROLES.md)
- [Security Best Practices](./SECURITY.md)
