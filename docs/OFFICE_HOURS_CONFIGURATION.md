# Office Hours Configuration Feature

## Overview

The office hours configuration feature allows administrators to dynamically set the time range during which the office hours pricing multiplier is applied to rides. This provides flexibility in managing peak-hour pricing based on business needs.

## Feature Details

### What Changed

**Before:**
- Office hours were hardcoded: 9:00 AM - 6:00 PM
- No way to change the time range without code modification

**After:**
- Office hours are configurable via Admin Pricing Management page
- Admins can set custom start and end times
- Changes take effect immediately for new ride bookings

---

## Database Changes

### New Columns in `pricing_settings` Table

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `office_hours_start` | TIME | `09:00:00` | Start time for office hours (24-hour format) |
| `office_hours_end` | TIME | `18:00:00` | End time for office hours (24-hour format) |

### Migration Applied

```sql
ALTER TABLE pricing_settings
ADD COLUMN office_hours_start TIME DEFAULT '09:00:00',
ADD COLUMN office_hours_end TIME DEFAULT '18:00:00';
```

---

## Admin Interface

### Pricing Management Page Updates

**Location**: `/admin/pricing`

**New UI Elements**:

1. **Office Hours Range Section**
   - Start Time input (time picker, 24-hour format)
   - End Time input (time picker, 24-hour format)
   - Current office hours display
   - Visual indicator showing configured range

2. **Visual Feedback**
   - Amber-colored info box showing current office hours
   - Real-time preview of configured time range
   - Clear explanation of when multiplier is applied

**Example Configuration**:
```
Start Time: 09:00
End Time: 18:00
Current Office Hours: 09:00 - 18:00
```

---

## How It Works

### Office Hours Detection Logic

```typescript
// Check if current time is within configured office hours (Monday-Friday)
const now = new Date()
const day = now.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
const currentTime = now.toTimeString().substring(0, 5) // HH:MM format

// Parse office hours from database (format: HH:MM:SS)
const startTime = pricing.office_hours_start?.substring(0, 5) || '09:00'
const endTime = pricing.office_hours_end?.substring(0, 5) || '18:00'

// Check if it's a weekday and within office hours
const isWeekday = day >= 1 && day <= 5
const isWithinTimeRange = currentTime >= startTime && currentTime < endTime
const isOfficeHours = isWeekday && isWithinTimeRange
```

### Pricing Calculation

```
base_cost = (distance_km × price_per_km) + driver_cost_per_ride

IF (isWeekday AND currentTime >= office_hours_start AND currentTime < office_hours_end):
    total_cost = base_cost × office_time_price_multiplier
ELSE:
    total_cost = base_cost
```

---

## Use Cases

### 1. Standard Business Hours
```
Start: 09:00
End: 18:00
Multiplier: 1.5
```
**Result**: 50% price increase during 9 AM - 6 PM on weekdays

### 2. Extended Peak Hours
```
Start: 07:00
End: 20:00
Multiplier: 1.3
```
**Result**: 30% price increase during 7 AM - 8 PM on weekdays

### 3. Lunch Rush Hours
```
Start: 12:00
End: 14:00
Multiplier: 2.0
```
**Result**: 100% price increase during lunch hours on weekdays

### 4. Evening Peak
```
Start: 17:00
End: 21:00
Multiplier: 1.8
```
**Result**: 80% price increase during evening rush on weekdays

---

## Admin Workflow

### Updating Office Hours

1. **Navigate to Pricing Management**
   - Go to Admin Dashboard
   - Click "Pricing Management"

2. **Configure Office Hours**
   - Scroll to "Office Hours Range" section
   - Set Start Time using time picker
   - Set End Time using time picker
   - Review current configuration in info box

3. **Save Changes**
   - Click "Save Settings" button
   - Wait for success confirmation
   - Changes take effect immediately

4. **Verify Changes**
   - Check "Last updated" timestamp
   - Test ride booking during configured hours
   - Verify multiplier is applied correctly

---

## Passenger Experience

### During Office Hours

**Booking Form Display**:
```
Cost Breakdown:
├─ Distance: 10.5 km
├─ Base Cost: ₹126.00
├─ Driver Cost: ₹50.00
├─ Office Hours (×1.5): Applied ✓
└─ Total Cost: ₹264.00
```

**Ride History**:
- Office hours indicator badge shown
- Amber-colored "Office hours" label
- Visible in both passenger and driver views

### Outside Office Hours

**Booking Form Display**:
```
Cost Breakdown:
├─ Distance: 10.5 km
├─ Base Cost: ₹126.00
├─ Driver Cost: ₹50.00
└─ Total Cost: ₹176.00
```

**Ride History**:
- No office hours indicator
- Standard pricing applied

---

## Technical Implementation

### Files Modified

1. **Database Schema**
   - Migration: `add_office_hours_range_to_pricing`
   - Table: `pricing_settings`

2. **TypeScript Types**
   - `lib/types/admin.ts` - Added office hours fields to PricingSettings interface

3. **Admin UI**
   - `app/admin/pricing/pricing-client.tsx` - Added time inputs and state management
   - `app/admin/pricing/actions.ts` - Updated to handle new fields

4. **Ride Calculation**
   - `app/passengers/actions.ts` - Updated calculateRideCost() to use dynamic hours

5. **Documentation**
   - `docs/DATABASE_SCHEMA.md` - Updated pricing_settings table documentation
   - `docs/OFFICE_HOURS_CONFIGURATION.md` - This document

---

## Validation & Constraints

### Input Validation

- **Time Format**: 24-hour format (HH:MM)
- **Start Time**: Must be before end time
- **End Time**: Must be after start time
- **Range**: Can span any hours within a day (00:00 - 23:59)

### Business Rules

1. **Weekday Only**: Office hours multiplier applies only Monday-Friday
2. **Immediate Effect**: Changes apply to new bookings immediately
3. **Existing Rides**: Already booked rides retain their original pricing
4. **Scheduled Rides**: Pricing calculated at booking time, not ride time

---

## Testing Scenarios

### Test Case 1: Standard Office Hours
```
Configuration: 09:00 - 18:00, Multiplier: 1.5
Test Time: Tuesday, 14:30
Expected: Multiplier applied ✓
```

### Test Case 2: Outside Office Hours
```
Configuration: 09:00 - 18:00, Multiplier: 1.5
Test Time: Tuesday, 20:00
Expected: No multiplier ✗
```

### Test Case 3: Weekend
```
Configuration: 09:00 - 18:00, Multiplier: 1.5
Test Time: Saturday, 14:00
Expected: No multiplier ✗ (Weekend)
```

### Test Case 4: Edge Case - Start Time
```
Configuration: 09:00 - 18:00, Multiplier: 1.5
Test Time: Tuesday, 09:00
Expected: Multiplier applied ✓ (Inclusive)
```

### Test Case 5: Edge Case - End Time
```
Configuration: 09:00 - 18:00, Multiplier: 1.5
Test Time: Tuesday, 18:00
Expected: No multiplier ✗ (Exclusive)
```

---

## API Response Example

### GET Pricing Settings

```json
{
  "id": "uuid",
  "petrol_price_per_liter": 106.00,
  "price_per_km": 12.00,
  "driver_cost_per_ride": 50.00,
  "office_time_price_multiplier": 1.5,
  "office_hours_start": "09:00:00",
  "office_hours_end": "18:00:00",
  "updated_by": "admin-uuid",
  "created_at": "2024-11-25T10:00:00Z",
  "updated_at": "2024-11-25T15:30:00Z"
}
```

### UPDATE Pricing Settings

```json
{
  "petrol_price_per_liter": 106.00,
  "price_per_km": 12.00,
  "driver_cost_per_ride": 50.00,
  "office_time_price_multiplier": 1.5,
  "office_hours_start": "07:00:00",
  "office_hours_end": "20:00:00"
}
```

---

## Future Enhancements

### Potential Improvements

1. **Multiple Time Ranges**
   - Support for multiple peak hour periods per day
   - Different multipliers for different time ranges

2. **Day-Specific Configuration**
   - Different office hours for different days
   - Weekend pricing options

3. **Holiday Calendar**
   - Mark specific dates as holidays
   - Apply/skip office hours on holidays

4. **Geographic Zones**
   - Different office hours for different cities
   - Location-based pricing rules

5. **Dynamic Multipliers**
   - Demand-based pricing
   - Real-time multiplier adjustments

6. **Scheduled Changes**
   - Pre-schedule office hours changes
   - Seasonal pricing configurations

---

## Troubleshooting

### Issue: Multiplier Not Applied

**Possible Causes**:
1. Current time is outside configured range
2. Current day is weekend (Saturday/Sunday)
3. Database not updated with new values

**Solution**:
- Verify current time and day
- Check admin panel for saved configuration
- Refresh pricing settings from database

### Issue: Wrong Time Displayed

**Possible Causes**:
1. Timezone mismatch
2. Browser time incorrect
3. Server time incorrect

**Solution**:
- Verify server timezone settings
- Check browser time
- Ensure consistent timezone handling

---

## Security Considerations

### Access Control

- Only users with `admin` role can modify office hours
- Changes are logged with `updated_by` field
- Audit trail maintained via `updated_at` timestamp

### Validation

- Input sanitization on time values
- Range validation (start < end)
- Type checking on numeric values

---

## Performance Impact

### Database Queries

- No additional queries required
- Office hours fetched with pricing settings
- Minimal performance overhead

### Calculation Speed

- Simple time comparison logic
- No complex date/time operations
- Negligible impact on ride cost calculation

---

## Monitoring & Analytics

### Metrics to Track

1. **Office Hours Usage**
   - Percentage of rides during office hours
   - Revenue from office hours multiplier

2. **Configuration Changes**
   - Frequency of office hours updates
   - Admin who made changes

3. **Pricing Impact**
   - Average ride cost during vs outside office hours
   - Passenger booking patterns

---

**Last Updated**: November 25, 2024
**Feature Version**: 1.0
**Status**: ✅ Implemented and Deployed
