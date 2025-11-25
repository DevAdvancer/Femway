# Femway Database Schema Documentation

## Overview

This document provides comprehensive documentation for the Femway ride-booking platform database schema. The database is built on PostgreSQL (via Supabase) and follows a relational model with proper foreign key constraints and data integrity c

## Database Architecture

The database consists of 6 main tables and 1 view:
- **user_roles** - User role management
- **admin_codes** - Admin verification codes
- **driver_profiles** - Driver information and documents
- **driver_availability** - Real-time driver availability tracking
- **pricing_settings** - Platform pricing configuration
- **rides** - Ride bookings and history
- **driver_profiles_with_email** (View) - Driver profiles with email information

---

## Tables

### 1. user_roles

**Purpose**: Manages user role assignments for role-based access control (RBAC).

**Columns**:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NO | - | Foreign key to `auth.users.id` (Unique) |
| `role` | user_role_enum | NO | - | User role: 'passenger', 'driver', or 'admin' |
| `created_at` | timestamptz | YES | `now()` | Record creation timestamp |
| `updated_at` | timestamptz | YES | `now()` | Last update timestamp |

**Constraints**:
- Primary Key: `id`
- Unique: `user_id`
- Foreign Key: `user_id` → `auth.users.id`
- Enum Values: `role` ∈ {'passenger', 'driver', 'admin'}

**Indexes**:
- Primary key index on `id`
- Unique index on `user_id`

**Usage**:
- Each user must have exactly one role
- Role determines access permissions and dashboard routing
- Used for authentication and authorization throughout the app

---

### 2. admin_codes

**Purpose**: Stores verification codes required for admin account registration.

**Columns**:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `code` | text | NO | - | Admin verification code (Unique) |
| `is_active` | boolean | YES | `true` | Whether code can still be used |
| `created_at` | timestamptz | YES | `now()` | Code creation timestamp |
| `used_by` | uuid | YES | - | Foreign key to `auth.users.id` |
| `used_at` | timestamptz | YES | - | When code was used |

**Constraints**:
- Primary Key: `id`
- Unique: `code`
- Foreign Key: `used_by` → `auth.users.id`

**Initial Codes**:
- `ADMIN-2024-INIT`
- `ADMIN-2024-SETUP`
- `ADMIN-2024-DEMO`

**Usage**:
- Required during admin signup
- Once used, code is marked inactive and linked to user
- Prevents unauthorized admin account creation

---

### 3. driver_profiles

**Purpose**: Stores driver profile information and document references for female drivers.

**Columns**:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | NO | - | Foreign key to `auth.users.id` (Unique) |
| `phone` | varchar(20) | NO | - | Driver phone number |
| `gender` | varchar(10) | NO | - | Must be 'female' |
| `government_id_url` | text | YES | - | URL to government ID document |
| `selfie_url` | text | YES | - | URL to selfie photo |
| `driving_license_url` | text | YES | - | URL to driving license |
| `car_rc_url` | text | YES | - | URL to car registration certificate |
| `number_plate_url` | text | YES | - | URL to number plate photo |
| `car_photos_urls` | text[] | YES | - | Array of car photo URLs |
| `government_id_uploaded_at` | timestamptz | YES | - | Upload timestamp |
| `selfie_uploaded_at` | timestamptz | YES | - | Upload timestamp |
| `driving_license_uploaded_at` | timestamptz | YES | - | Upload timestamp |
| `car_rc_uploaded_at` | timestamptz | YES | - | Upload timestamp |
| `number_plate_uploaded_at` | timestamptz | YES | - | Upload timestamp |
| `car_photos_uploaded_at` | timestamptz | YES | - | Upload timestamp |
| `documents_complete` | boolean | YES | `false` | All 6 documents uploaded |
| `profile_verified` | boolean | YES | `false` | Admin verified profile |
| `created_at` | timestamptz | YES | `now()` | Profile creation timestamp |
| `updated_at` | timestamptz | YES | `now()` | Last update timestamp |

**Constraints**:
- Primary Key: `id`
- Unique: `user_id`
- Foreign Key: `user_id` → `auth.users.id`
- Check: `gender = 'female'`

**Required Documents** (6 total):
1. Government ID
2. Selfie
3. Driving License
4. Car RC (Registration Certificate)
5. Number Plate Photo
6. Car Photos (multiple allowed)

**Document Verification Flow**:
1. Driver uploads all 6 documents
2. `documents_complete` automatically set to `true`
3. Driver requests verification
4. Admin reviews and sets `profile_verified` to `true`
5. Driver can now accept ride requests

---

### 4. driver_availability

**Purpose**: Tracks real-time driver availability to prevent concurrent bookings.

**Columns**:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `driver_id` | uuid | NO | - | Primary key, Foreign key to `auth.users.id` |
| `is_available` | boolean | YES | `true` | Driver available for new rides |
| `current_ride_id` | uuid | YES | - | Foreign key to `rides.id` |
| `last_updated` | timestamptz | YES | `now()` | Last availability update |

**Constraints**:
- Primary Key: `driver_id`
- Foreign Key: `driver_id` → `auth.users.id`
- Foreign Key: `current_ride_id` → `rides.id`

**Availability States**:
- `is_available = true, current_ride_id = null` → Available for bookings
- `is_available = false, current_ride_id = <uuid>` → Currently on a ride
- Updated automatically when rides are accepted/completed/cancelled

**Usage**:
- Prevents double-booking of drivers
- Only available drivers shown to passengers
- Automatically updated by ride status changes

---

### 5. pricing_settings

**Purpose**: Stores platform pricing configuration for ride cost calculations.

**Columns**:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `petrol_price_per_liter` | numeric | NO | `0` | Current petrol price (₹/liter) |
| `price_per_km` | numeric | NO | `0` | Base price per kilometer (₹/km) |
| `driver_cost_per_ride` | numeric | NO | `0` | Fixed driver cost per ride (₹) |
| `office_time_price_multiplier` | numeric | NO | `1.0` | Multiplier for office hours |
| `office_hours_start` | time | YES | `09:00:00` | Start time for office hours (24-hour format) |
| `office_hours_end` | time | YES | `18:00:00` | End time for office hours (24-hour format) |
| `updated_by` | uuid | YES | - | Foreign key to `auth.users.id` (admin) |
| `created_at` | timestamptz | YES | `now()` | Settings creation timestamp |
| `updated_at` | timestamptz | YES | `now()` | Last update timestamp |

**Constraints**:
- Primary Key: `id`
- Foreign Key: `updated_by` → `auth.users.id`

**Current Default Values**:
- `petrol_price_per_liter`: ₹106.00
- `price_per_km`: ₹12.00
- `driver_cost_per_ride`: ₹50.00
- `office_time_price_multiplier`: 1.5
- `office_hours_start`: 09:00:00
- `office_hours_end`: 18:00:00

**Pricing Formula**:
```
base_cost = (distance_km × price_per_km) + driver_cost_per_ride
total_cost = base_cost × office_time_multiplier (if during office hours)
```

**Office Hours**: Configurable via admin panel (Default: 9:00 AM - 6:00 PM, Monday - Friday)
- Office hours range can be customized by admins
- Multiplier is applied only during weekdays (Monday-Friday) within the configured time range

---

### 6. rides

**Purpose**: Stores all ride requests, bookings, and ride history.

**Columns**:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | NO | `gen_random_uuid()` | Primary key |
| `passenger_id` | uuid | NO | - | Foreign key to `auth.users.id` |
| `driver_id` | uuid | YES | - | Foreign key to `auth.users.id` |
| `pickup_address` | text | NO | - | Pickup location address |
| `pickup_lat` | numeric | NO | - | Pickup latitude |
| `pickup_lng` | numeric | NO | - | Pickup longitude |
| `dropoff_address` | text | NO | - | Drop-off location address |
| `dropoff_lat` | numeric | NO | - | Drop-off latitude |
| `dropoff_lng` | numeric | NO | - | Drop-off longitude |
| `distance_km` | numeric | NO | - | Route distance in kilometers |
| `estimated_cost` | numeric | NO | - | Calculated estimated cost (₹) |
| `final_cost` | numeric | YES | - | Actual final cost (₹) |
| `office_hours_applied` | boolean | YES | `false` | Office hours multiplier applied |
| `status` | varchar(20) | YES | `'pending'` | Current ride status |
| `is_scheduled` | boolean | YES | `false` | Is this a scheduled ride |
| `scheduled_date` | date | YES | - | Scheduled ride date |
| `scheduled_time` | time | YES | - | Scheduled ride time |
| `requested_at` | timestamptz | YES | `now()` | Ride request timestamp |
| `accepted_at` | timestamptz | YES | - | Driver acceptance timestamp |
| `started_at` | timestamptz | YES | - | Ride start timestamp |
| `completed_at` | timestamptz | YES | - | Ride completion timestamp |
| `cancelled_at` | timestamptz | YES | - | Cancellation timestamp |
| `created_at` | timestamptz | YES | `now()` | Record creation timestamp |
| `updated_at` | timestamptz | YES | `now()` | Last update timestamp |

**Constraints**:
- Primary Key: `id`
- Foreign Key: `passenger_id` → `auth.users.id`
- Foreign Key: `driver_id` → `auth.users.id`
- Check: `status` ∈ {'pending', 'accepted', 'in_progress', 'completed', 'cancelled'}

**Status Flow**:
```
pending → accepted → in_progress → completed
   ↓          ↓
cancelled  cancelled
```

**Status Descriptions**:
- **pending**: Ride requested, waiting for driver acceptance
- **accepted**: Driver accepted, ride not started yet
- **in_progress**: Ride currently in progress
- **completed**: Ride successfully completed
- **cancelled**: Ride cancelled by passenger or driver

**Ride Types**:
- **Immediate Rides**: `is_scheduled = false`, ride for now
- **Scheduled Rides**: `is_scheduled = true`, ride for future date/time

---

## Views

### driver_profiles_with_email

**Purpose**: Combines driver profile data with email from auth.users for admin dashboard.

**Source Tables**:
- `driver_profiles`
- `auth.users`

**Columns**: All columns from `driver_profiles` plus:
- `email` (varchar(255)) - User email from auth.users

**Usage**:
- Admin driver verification dashboard
- Driver listing with contact information
- Read-only view for convenience

---

## Relationships

### Entity Relationship Diagram

```
auth.users (Supabase Auth)
    ↓ (1:1)
user_roles
    ↓ (1:1 for drivers)
driver_profiles
    ↓ (1:1)
driver_availability
    ↓ (1:many)
rides ← (many:1) ← auth.users (passengers)
    ↓
pricing_settings (used for calculation)
```

### Foreign Key Relationships

1. **user_roles.user_id** → **auth.users.id**
   - Each user has one role

2. **admin_codes.used_by** → **auth.users.id**
   - Tracks which admin used which code

3. **driver_profiles.user_id** → **auth.users.id**
   - Each driver has one profile

4. **driver_availability.driver_id** → **auth.users.id**
   - Each driver has one availability record

5. **driver_availability.current_ride_id** → **rides.id**
   - Links driver to their current active ride

6. **rides.passenger_id** → **auth.users.id**
   - Each ride has one passenger

7. **rides.driver_id** → **auth.users.id**
   - Each ride has one driver (nullable until accepted)

8. **pricing_settings.updated_by** → **auth.users.id**
   - Tracks which admin updated pricing

---

## Data Types

### Custom Enums

**user_role_enum**:
- `passenger` - Regular user booking rides
- `driver` - Female driver providing rides
- `admin` - Platform administrator

### Common Types

- **uuid**: Universally unique identifier (primary keys, foreign keys)
- **text**: Variable-length text (addresses, URLs)
- **varchar(n)**: Variable-length text with max length
- **numeric**: Arbitrary precision numbers (prices, coordinates)
- **boolean**: True/false values
- **timestamptz**: Timestamp with timezone
- **date**: Calendar date
- **time**: Time of day without timezone
- **text[]**: Array of text values

---

## Indexes

### Primary Key Indexes (Automatic)
- All tables have primary key indexes on `id` or primary key column

### Unique Indexes
- `user_roles.user_id` - One role per user
- `admin_codes.code` - Unique verification codes
- `driver_profiles.user_id` - One profile per driver

### Foreign Key Indexes (Automatic)
- All foreign key columns have indexes for join performance

### Recommended Additional Indexes

```sql
-- For ride queries by status
CREATE INDEX idx_rides_status ON rides(status);

-- For ride queries by passenger
CREATE INDEX idx_rides_passenger_id ON rides(passenger_id);

-- For ride queries by driver
CREATE INDEX idx_rides_driver_id ON rides(driver_id);

-- For finding available drivers
CREATE INDEX idx_driver_availability_is_available ON driver_availability(is_available);

-- For driver verification queries
CREATE INDEX idx_driver_profiles_verified ON driver_profiles(profile_verified);
```

---

## Security & Access Control

### Row Level Security (RLS)

Currently, RLS is **disabled** on all tables. For production, consider enabling RLS with policies:

**Recommended Policies**:

```sql
-- Users can only read their own role
CREATE POLICY "Users can view own role"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Drivers can only update their own profile
CREATE POLICY "Drivers can update own profile"
  ON driver_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Passengers can view their own rides
CREATE POLICY "Passengers can view own rides"
  ON rides FOR SELECT
  USING (auth.uid() = passenger_id);

-- Drivers can view assigned rides
CREATE POLICY "Drivers can view assigned rides"
  ON rides FOR SELECT
  USING (auth.uid() = driver_id);

-- Only admins can update pricing
CREATE POLICY "Admins can update pricing"
  ON pricing_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
```

---

## Storage

### Supabase Storage Buckets

**driver-documents** bucket:
- Stores all driver verification documents
- Path structure: `{user_id}/{document_type}/{filename}`
- Document types:
  - `government_id`
  - `selfie`
  - `driving_license`
  - `car_rc`
  - `number_plate`
  - `car_photos`

**File Constraints**:
- Max file size: 10MB
- Allowed formats: JPEG, PNG, PDF
- Files are private, accessible only by driver and admin

---

## Triggers & Functions

### Automatic Timestamp Updates

```sql
-- Updates updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applied to tables with updated_at column
```

### Document Completion Check

```sql
-- Automatically sets documents_complete when all 6 documents uploaded
-- Triggered on driver_profiles UPDATE
```

### Driver Availability Management

```sql
-- Automatically updates driver_availability when ride status changes
-- Sets is_available = false when ride accepted
-- Sets is_available = true when ride completed/cancelled
```

---

## Sample Queries

### Get Available Verified Drivers

```sql
SELECT
  dp.*,
  u.email
FROM driver_profiles dp
JOIN auth.users u ON dp.user_id = u.id
JOIN driver_availability da ON dp.user_id = da.driver_id
WHERE
  dp.profile_verified = true
  AND dp.documents_complete = true
  AND da.is_available = true;
```

### Get Passenger Ride History

```sql
SELECT
  r.*,
  d.email as driver_email,
  dp.phone as driver_phone
FROM rides r
LEFT JOIN auth.users d ON r.driver_id = d.id
LEFT JOIN driver_profiles dp ON r.driver_id = dp.user_id
WHERE r.passenger_id = '<passenger_user_id>'
ORDER BY r.requested_at DESC;
```

### Calculate Total Revenue

```sql
SELECT
  COUNT(*) as total_rides,
  SUM(COALESCE(final_cost, estimated_cost)) as total_revenue,
  AVG(COALESCE(final_cost, estimated_cost)) as avg_ride_cost
FROM rides
WHERE status = 'completed';
```

### Get Pending Driver Verifications

```sql
SELECT
  dp.*,
  u.email,
  u.created_at as signup_date
FROM driver_profiles dp
JOIN auth.users u ON dp.user_id = u.id
WHERE
  dp.documents_complete = true
  AND dp.profile_verified = false
ORDER BY dp.updated_at DESC;
```

---

## Maintenance

### Regular Maintenance Tasks

1. **Vacuum and Analyze** (Weekly)
   ```sql
   VACUUM ANALYZE rides;
   VACUUM ANALYZE driver_profiles;
   ```

2. **Check for Orphaned Records** (Monthly)
   ```sql
   -- Find rides without valid users
   SELECT * FROM rides
   WHERE passenger_id NOT IN (SELECT id FROM auth.users)
      OR (driver_id IS NOT NULL AND driver_id NOT IN (SELECT id FROM auth.users));
   ```

3. **Archive Old Completed Rides** (Quarterly)
   ```sql
   -- Move rides older than 1 year to archive table
   -- (Create archive table first)
   ```

4. **Update Statistics** (Weekly)
   ```sql
   ANALYZE rides;
   ANALYZE driver_profiles;
   ```

---

## Backup & Recovery

### Backup Strategy

1. **Automated Backups** (Supabase)
   - Daily automatic backups
   - Point-in-time recovery available
   - Retention: 7 days (free tier), 30 days (pro)

2. **Manual Backups** (Before major changes)
   ```bash
   pg_dump -h <host> -U <user> -d <database> > backup.sql
   ```

3. **Critical Tables Priority**
   - rides (transaction data)
   - driver_profiles (verification data)
   - user_roles (access control)

---

## Migration History

### Initial Schema (v1.0)
- Created base tables: user_roles, driver_profiles, rides, pricing_settings
- Established foreign key relationships
- Added basic constraints

### Updates (v1.1)
- Added admin_codes table for admin verification
- Added driver_availability table for concurrent booking prevention
- Added scheduled ride fields to rides table

### Future Considerations
- Add ride ratings and reviews
- Add payment transaction history
- Add driver earnings tracking
- Add passenger payment methods
- Add ride cancellation reasons
- Add real-time location tracking

---

## Performance Considerations

### Query Optimization

1. **Use Indexes**: Ensure queries use appropriate indexes
2. **Limit Results**: Always use LIMIT for large result sets
3. **Avoid SELECT ***: Select only needed columns
4. **Use Joins Wisely**: Prefer JOINs over subqueries when possible

### Connection Pooling

- Use Supabase connection pooling for better performance
- Configure appropriate pool size based on load

### Caching Strategy

- Cache pricing_settings (rarely changes)
- Cache driver availability (update every 30 seconds)
- Cache user roles (changes infrequently)

---

## Monitoring

### Key Metrics to Monitor

1. **Database Size**: Track growth over time
2. **Query Performance**: Slow query log analysis
3. **Connection Count**: Monitor active connections
4. **Table Sizes**: Track largest tables
5. **Index Usage**: Ensure indexes are being used

### Alerts to Set Up

- Database size > 80% of limit
- Slow queries > 1 second
- Failed foreign key constraints
- Unusual spike in ride cancellations

---

## Contact & Support

For database-related questions or issues:
- Check Supabase documentation: https://supabase.com/docs
- Review this documentation
- Contact development team

---

**Last Updated**: November 25, 2024
**Schema Version**: 1.1
**Database**: PostgreSQL 15 (Supabase)
