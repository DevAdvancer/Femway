# Femway Database - Entity Relationship Diagram

## Visual ER Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FEMWAY DATABASE SCHEMA                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   auth.users         │ (Supabase Auth)
│──────────────────────│
│ • id (PK)            │
│   email              │
│   encrypted_password │
│   created_at         │
└──────────────────────┘
         │
         │ 1:1
         ↓
┌──────────────────────┐
│   user_roles         │
│──────────────────────│
│ • id (PK)            │
│ • user_id (FK, UQ)   │───→ auth.users.id
│   role (ENUM)        │     ['passenger', 'driver', 'admin']
│   created_at         │
│   updated_at         │
└──────────────────────┘
         │
         │ 1:1 (if role = 'driver')
         ↓
┌──────────────────────────────────────┐
│   driver_profiles                    │
│──────────────────────────────────────│
│ • id (PK)                            │
│ • user_id (FK, UQ)                   │───→ auth.users.id
│   phone                              │
│   gender (CHECK = 'female')          │
│   government_id_url                  │
│   selfie_url                         │
│   driving_license_url                │
│   car_rc_url                         │
│   number_plate_url                   │
│   car_photos_urls[]                  │
│   government_ded_at          │
│   selfie_uploaded_at                 │
│   driving_license_uploaded_at        │
│   car_rc_uploaded_at                 │
│   number_plate_uploaded_at           │
│   car_photos_uploaded_at             │
│   documents_complete (BOOL)          │
│   profile_verified (BOOL)            │
│   created_at                         │
│   updated_at                         │
└──────────────────────────────────────┘
         │
         │ 1:1
         ↓
┌──────────────────────────────────────┐
│   driver_availability                │
│──────────────────────────────────────│
│ • driver_id (PK, FK)                 │───→ auth.users.id
│   is_available (BOOL)                │
│ • current_ride_id (FK)               │───┐
│   last_updated                       │   │
└──────────────────────────────────────┘   │
                                            │
                                            │
┌──────────────────────────────────────┐   │
│   rides                              │   │
│──────────────────────────────────────│   │
│ • id (PK)                            │←──┘
│ • passenger_id (FK)                  │───→ auth.users.id
│ • driver_id (FK, nullable)           │───→ auth.users.id
│   pickup_address                     │
│   pickup_lat                         │
│   pickup_lng                         │
│   dropoff_address                    │
│   dropoff_lat                        │
│   dropoff_lng                        │
│   distance_km                        │
│   estimated_cost                     │
│   final_cost                         │
│   office_hours_applied (BOOL)        │
│   status (ENUM)                      │     ['pending', 'accepted',
│   is_scheduled (BOOL)                │      'in_progress', 'completed',
│   scheduled_date                     │      'cancelled']
│   scheduled_time                     │
│   requested_at                       │
│   accepted_at                        │
│   started_at                         │
│   completed_at                       │
│   cancelled_at                       │
│   created_at                         │
│   updated_at                         │
└──────────────────────────────────────┘
         │
         │ (uses for calculation)
         ↓
┌──────────────────────────────────────┐
│   pricing_settings                   │
│──────────────────────────────────────│
│ • id (PK)                            │
│   petrol_price_per_liter             │
│   price_per_km                       │
│   driver_cost_per_ride               │
│   office_time_price_multiplier       │
│ • updated_by (FK)                    │───→ auth.users.id
│   created_at                         │
│   updated_at                         │
└──────────────────────────────────────┘


┌──────────────────────────────────────┐
│   admin_codes                        │
│──────────────────────────────────────│
│ • id (PK)                            │
│   code (UQ)                          │
│   is_active (BOOL)                   │
│   created_at                         │
│ • used_by (FK, nullable)             │───→ auth.users.id
│   used_at                            │
└──────────────────────────────────────┘


┌──────────────────────────────────────┐
│   driver_profiles_with_email (VIEW)  │
│──────────────────────────────────────│
│   All columns from driver_profiles   │
│   + email (from auth.users)          │
└──────────────────────────────────────┘
```

## Legend

- **•** = Primary Key (PK)
- **→** = Foreign Key (FK)
- **UQ** = Unique Constraint
- **ENUM** = Enumerated Type
- **BOOL** = Boolean
- **[]** = Array Type

---

## Relationship Cardinality

### One-to-One (1:1)
- `auth.users` ↔ `user_roles`
- `auth.users` (driver) ↔ `driver_profiles`
- `driver_profiles` ↔ `driver_availability`

### One-to-Many (1:N)
- `auth.users` (passenger) → `rides` (many rides per passenger)
- `auth.users` (driver) → `rides` (many rides per driver)
- `rides` ← `driver_availability.current_ride_id` (one active ride per driver)

### Many-to-One (N:1)
- `admin_codes` → `auth.users` (many codes can be used by one admin)
- `pricing_settings` → `auth.users` (many updates by one admin)

---

## Data Flow Diagrams

### User Registration Flow

```
┌─────────────┐
│ User Signs  │
│     Up      │
└──────┬──────┘
       │
       ↓
┌─────────────────────────────┐
│ auth.users record created   │
└──────┬──────────────────────┘
       │
       ↓
┌─────────────────────────────┐
│ user_roles record created   │
│ (passenger/driver/admin)    │
└──────┬──────────────────────┘
       │
       ├─→ If driver ─→ ┌──────────────────────────┐
       │                │ driver_profiles created  │
       │                └──────┬───────────────────┘
       │                       │
       │                       ↓
       │                ┌──────────────────────────────┐
       │                │ driver_availability created  │
       │                └──────────────────────────────┘
       │
       └─→ If admin ──→ ┌──────────────────────────┐
                        │ Validate admin_code      │
                        │ Mark code as used        │
                        └──────────────────────────┘
```

### Ride Booking Flow

```
┌──────────────────┐
│ Passenger books  │
│      ride        │
└────────┬─────────┘
         │
         ↓
┌─────────────────────────────────┐
│ rides record created            │
│ status = 'pending'              │
│ driver_id = null                │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ Available drivers see request  │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ Driver accepts ride             │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ rides.driver_id = driver_id     │
│ rides.status = 'accepted'       │
│ rides.accepted_at = now()       │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────┐
│ driver_availability updated             │
│ is_available = false                    │
│ current_ride_id = ride.id               │
└────────┬────────────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ Ride starts                     │
│ rides.status = 'in_progress'    │
│ rides.started_at = now()        │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────┐
│ Ride completes                  │
│ rides.status = 'completed'      │
│ rides.completed_at = now()      │
│ rides.final_cost = actual_cost  │
└────────┬────────────────────────┘
         │
         ↓
┌─────────────────────────────────────────┐
│ driver_availability updated             │
│ is_available = true                     │
│ current_ride_id = null                  │
└─────────────────────────────────────────┘
```

### Driver Verification Flow

```
┌──────────────────────┐
│ Driver signs up      │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────────────┐
│ driver_profiles created      │
│ documents_complete = false   │
│ profile_verified = false     │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Driver uploads 6 documents   │
│ - Government ID              │
│ - Selfie                     │
│ - Driving License            │
│ - Car RC                     │
│ - Number Plate               │
│ - Car Photos                 │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ documents_complete = true    │
│ (auto-updated)               │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Driver requests verification │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Admin reviews documents      │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ profile_verified = true      │
│ (admin sets)                 │
└──────┬───────────────────────┘
       │
       ↓
┌──────────────────────────────┐
│ Driver can accept rides      │
└──────────────────────────────┘
```

---

## Table Dependencies

### Dependency Order (for migrations/seeding)

1. **auth.users** (Supabase managed)
2. **user_roles** (depends on auth.users)
3. **admin_codes** (depends on auth.users for used_by)
4. **driver_profiles** (depends on auth.users)
5. **driver_availability** (depends on auth.users)
6. **pricing_settings** (depends on auth.users for updated_by)
7. **rides** (depends on auth.users, driver_availability)

### Deletion Order (to maintain referential integrity)

1. **rides** (has FKs to multiple tables)
2. **driver_availability** (has FK to rides)
3. **driver_profiles**
4. **admin_codes**
5. **pricing_settings**
6. **user_roles**
7. **auth.users** (last)

---

## Index Strategy

### Primary Indexes (Automatic)
```
user_roles(id)
admin_codes(id)
driver_profiles(id)
driver_availability(driver_id)
pricing_settings(id)
rides(id)
```

### Unique Indexes
```
user_roles(user_id)
admin_codes(code)
driver_profiles(user_id)
```

### Foreign Key Indexes (Automatic)
```
user_roles(user_id)
admin_codes(used_by)
driver_profiles(user_id)
driver_availability(driver_id)
driver_availability(current_ride_id)
rides(passenger_id)
rides(driver_id)
pricing_settings(updated_by)
```

### Recommended Additional Indexes
```
rides(status)                          -- For filtering by status
rides(requested_at DESC)               -- For chronological queries
driver_availability(is_available)      -- For finding available drivers
driver_profiles(profile_verified)      -- For admin verification queries
driver_profiles(documents_complete)    -- For document status queries
```

---

## Storage Structure

### Supabase Storage: driver-documents

```
driver-documents/
├── {user_id_1}/
│   ├── government_id/
│   │   └── {filename}.{ext}
│   ├── selfie/
│   │   └── {filename}.{ext}
│   ├── driving_license/
│   │   └── {filename}.{ext}
│   ├── car_rc/
│   │   └── {filename}.{ext}
│   ├── number_plate/
│   │   └── {filename}.{ext}
│   └── car_photos/
│       ├── {filename_1}.{ext}
│       ├── {filename_2}.{ext}
│       └── {filename_3}.{ext}
├── {user_id_2}/
│   └── ...
└── ...
```

**Access Control**:
- Drivers: Read/Write own documents
- Admins: Read all documents
- Passengers: No access

---

## Query Patterns

### Common Query Patterns

**1. Get User with Role**
```sql
SELECT u.*, ur.role
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE u.id = ?
```

**2. Get Available Verified Drivers**
```sql
SELECT dp.*, da.is_available
FROM driver_profiles dp
JOIN driver_availability da ON dp.user_id = da.driver_id
WHERE dp.profile_verified = true
  AND dp.documents_complete = true
  AND da.is_available = true
```

**3. Get Passenger Ride History**
```sql
SELECT r.*, u.email as driver_email
FROM rides r
LEFT JOIN auth.users u ON r.driver_id = u.id
WHERE r.passenger_id = ?
ORDER BY r.requested_at DESC
```

**4. Get Driver Active Ride**
```sql
SELECT r.*
FROM rides r
JOIN driver_availability da ON r.id = da.current_ride_id
WHERE da.driver_id = ?
  AND r.status IN ('accepted', 'in_progress')
```

---

**Last Updated**: November 25, 2024
**Schema Version**: 1.1
