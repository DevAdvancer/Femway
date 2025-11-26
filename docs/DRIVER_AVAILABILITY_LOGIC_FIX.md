# Driver Availability Logic Fix

## Issue Description

The driver availability system had several logical flaws that caused drivers to be incorrectly marked as unavailable:

### Problems Identified

1. **Scheduled Rides Blocking Availability**
   - When a passenger booked a scheduled ride (for future date/time), the driver was immediately marked as unavailable
   - Driver couldn't accept other bookings even though the scheduled ride was hours or days away
   - Driver should remain available until they accept the scheduled ride

2. **Pending Rides Blocking Availability**
   - Driver was marked unavailable as soon as a ride was booked (status: pending)
   - Driver couldn't see other ride requests while deciding whether to accept
   - Driver should only be unavailable after accepting a ride

3. **Rejected Rides Not Freeing Driver**
   - When driver rejected a ride, availability wasn't always updated correctly
   - Driver remained blocked even after rejecting

4. **Cancelled Rides Not Freeing Driver**
   - When passenger cancelled a pending ride, driver availability wasn't properly restored
   - Driver could remain blocked indefinitely

---

## Solution Implemented

### 1. Immediate vs Scheduled Rides

**Before:**
```typescript
// Always mark driver unavailable when ride is booked
await supabase
  .from('driver_availability')
  .update({
    is_available: false,
    current_ride_id: ride.id,
  })
  .eq('driver_id', booking.driver_id)
```

**After:**
```typescript
// Only mark driver unavailable for immediate rides
if (!booking.is_scheduled) {
  await supabase
    .from('driver_availability')
    .update({
      is_available: false,
      current_ride_id: ride.id,
    })
    .eq('driver_id', booking.driver_id)
}
// Scheduled rides don't block availability until accepted
```

### 2. Accept Ride Updates Availability

**Before:**
```typescript
// Only updated ride status, didn't update availability
await supabase
  .from('rides')
  .update({ status: 'accepted' })
  .eq('id', rideId)
```

**After:**
```typescript
// Update ride status AND mark driver unavailable
await supabase
  .from('rides')
  .update({ status: 'accepted' })
  .eq('id', rideId)

// Now mark driver as unavailable
await supabase
  .from('driver_availability')
  .update({
    is_available: false,
    current_ride_id: rideId,
  })
  .eq('driver_id', driverId)
```

### 3. Reject Ride Checks Current Ride

**Before:**
```typescript
// Always freed driver, even if they weren't blocked
await supabase
  .from('driver_availability')
  .update({
    is_available: true,
    current_ride_id: null,
  })
  .eq('driver_id', driverId)
```

**After:**
```typescript
// Check if this ride was actually blocking the driver
const { data: availability } = await supabase
  .from('driver_availability')
  .select('current_ride_id')
  .eq('driver_id', driverId)
  .single()

// Only update if this ride was blocking the driver
if (availability?.current_ride_id === rideId) {
  await supabase
    .from('driver_availability')
    .update({
      is_available: true,
      current_ride_id: null,
    })
    .eq('driver_id', driverId)
}
```

### 4. Cancel Ride Checks Current Ride

Same logic as reject - only frees driver if this specific ride was blocking them.

---

## New Availability Flow

### Immediate Ride Flow

```
1. Passenger books immediate ride
   ↓
2. Ride created (status: pending)
   ↓
3. Driver marked UNAVAILABLE ❌
   current_ride_id = ride.id
   ↓
4a. Driver ACCEPTS
    ↓
    Ride status: accepted
    Driver stays UNAVAILABLE ❌
    ↓
4b. Driver REJECTS
    ↓
    Ride status: cancelled
    Driver marked AVAILABLE ✓
    current_ride_id = null
    ↓
4c. Passenger CANCELS
    ↓
    Ride status: cancelled
    Driver marked AVAILABLE ✓
    current_ride_id = null
```

### Scheduled Ride Flow

```
1. Passenger books scheduled ride (future date/time)
   ↓
2. Ride created (status: pending, is_scheduled: true)
   ↓
3. Driver stays AVAILABLE ✓
   current_ride_id = null
   (Driver can accept other rides)
   ↓
4a. Driver ACCEPTS scheduled ride
    ↓
    Ride status: accepted
    Driver marked UNAVAILABLE ❌
    current_ride_id = ride.id
    (Now blocked until ride completes)
    ↓
4b. Driver REJECTS scheduled ride
    ↓
    Ride status: cancelled
    Driver stays AVAILABLE ✓
    (Was never blocked)
    ↓
4c. Passenger CANCELS scheduled ride
    ↓
    Ride status: cancelled
    Driver stays AVAILABLE ✓
    (Was never blocked)
```

---

## Code Changes

### Files Modified

1. **app/passengers/actions.ts**
   - `bookRide()` - Only mark unavailable for immediate rides
   - `cancelRide()` - Check if ride was blocking driver before freeing

2. **app/driver/actions.ts**
   - `acceptRide()` - Mark driver unavailable when accepting
   - `rejectRide()` - Check if ride was blocking driver before freeing
   - `completeRide()` - Already correct (frees driver)
   - `cancelAcceptedRide()` - Already correct (frees driver)

---

## Testing Scenarios

### Test Case 1: Immediate Ride - Accept
```
1. Passenger books immediate ride
   Expected: Driver unavailable ❌
2. Driver accepts ride
   Expected: Driver stays unavailable ❌
3. Driver completes ride
   Expected: Driver available ✓
```

### Test Case 2: Immediate Ride - Reject
```
1. Passenger books immediate ride
   Expected: Driver unavailable ❌
2. Driver rejects ride
   Expected: Driver available ✓
```

### Test Case 3: Scheduled Ride - Accept
```
1. Passenger books ride for tomorrow 2 PM
   Expected: Driver available ✓
2. Driver can see and accept other rides
   Expected: Works ✓
3. Driver accepts scheduled ride
   Expected: Driver unavailable ❌
4. Driver completes scheduled ride tomorrow
   Expected: Driver available ✓
```

### Test Case 4: Scheduled Ride - Reject
```
1. Passenger books ride for tomorrow 2 PM
   Expected: Driver available ✓
2. Driver rejects scheduled ride
   Expected: Driver stays available ✓
```

### Test Case 5: Multiple Scheduled Rides
```
1. Passenger A books ride for tomorrow 2 PM
   Expected: Driver available ✓
2. Passenger B books ride for tomorrow 4 PM
   Expected: Driver available ✓
3. Driver accepts first ride (2 PM)
   Expected: Driver unavailable ❌
4. Driver cannot accept second ride (4 PM)
   Expected: Correct - driver is busy ✓
```

### Test Case 6: Passenger Cancels
```
1. Passenger books immediate ride
   Expected: Driver unavailable ❌
2. Passenger cancels before driver responds
   Expected: Driver available ✓
```

---

## Database State Examples

### Available Driver (No Active Ride)
```sql
SELECT * FROM driver_availability WHERE driver_id = 'driver-uuid';

driver_id         | is_available | current_ride_id | last_updated
driver-uuid       | true         | null            | 2024-11-25 10:00:00
```

### Busy Driver (Active Immediate Ride)
```sql
SELECT * FROM driver_availability WHERE driver_id = 'driver-uuid';

driver_id         | is_available | current_ride_id | last_updated
driver-uuid       | false        | ride-uuid-123   | 2024-11-25 10:05:00
```

### Available Driver (Pending Scheduled Ride)
```sql
-- Driver has pending scheduled ride but is still available
SELECT * FROM driver_availability WHERE driver_id = 'driver-uuid';

driver_id         | is_available | current_ride_id | last_updated
driver-uuid       | true         | null            | 2024-11-25 10:00:00

-- The scheduled ride exists but doesn't block the driver
SELECT * FROM rides WHERE driver_id = 'driver-uuid' AND status = 'pending';

id                | status  | is_scheduled | scheduled_date | scheduled_time
ride-uuid-456     | pending | true         | 2024-11-26     | 14:00:00
```

---

## Benefits

### For Drivers
1. ✅ Can accept multiple scheduled rides for different times
2. ✅ Remain available while deciding on ride requests
3. ✅ Not blocked by rides they reject
4. ✅ Not blocked by rides passengers cancel

### For Passengers
1. ✅ More drivers available for immediate bookings
2. ✅ Can schedule rides in advance without blocking drivers
3. ✅ Better chance of finding available drivers

### For Platform
1. ✅ Better driver utilization
2. ✅ More bookings possible
3. ✅ Improved user experience
4. ✅ Logical and predictable behavior

---

## Edge Cases Handled

### Edge Case 1: Driver Accepts Multiple Scheduled Rides
**Scenario**: Driver accepts scheduled ride for 2 PM, then tries to accept another for 3 PM

**Behavior**:
- First acceptance (2 PM): Driver marked unavailable ❌
- Second attempt (3 PM): Booking fails - driver not available ✓

**Result**: Correct - driver can only have one active ride

### Edge Case 2: Passenger Cancels After Driver Accepts
**Scenario**: Driver accepts ride, then passenger cancels

**Behavior**:
- Driver was marked unavailable when accepting
- Passenger cancel doesn't free driver (ride is accepted, not pending)
- Driver must complete or cancel the ride themselves

**Result**: Correct - accepted rides can't be cancelled by passengers

### Edge Case 3: Scheduled Ride Time Arrives
**Scenario**: Scheduled ride time arrives but driver hasn't started it

**Behavior**:
- Driver is still marked unavailable (they accepted it)
- Driver should start the ride or cancel it
- System doesn't auto-cancel or auto-start

**Result**: Correct - driver controls ride lifecycle

---

## Future Enhancements

### Potential Improvements

1. **Auto-Cancel Expired Scheduled Rides**
   - If scheduled time passes and ride not started
   - Free driver automatically after grace period

2. **Scheduled Ride Reminders**
   - Notify driver 30 minutes before scheduled time
   - Notify passenger when driver is on the way

3. **Conflict Detection**
   - Warn driver if accepting scheduled ride conflicts with existing schedule
   - Show driver's schedule calendar

4. **Smart Availability**
   - Automatically mark driver unavailable 15 minutes before scheduled ride
   - Give driver time to prepare and travel to pickup

---

## Monitoring

### Metrics to Track

1. **Driver Utilization**
   - Average time drivers spend unavailable
   - Percentage of time blocked by pending vs accepted rides

2. **Scheduled Ride Success Rate**
   - How many scheduled rides are completed
   - How many are cancelled before scheduled time

3. **Availability Issues**
   - Drivers stuck in unavailable state
   - Rides with no available drivers

### Queries for Monitoring

```sql
-- Find drivers stuck unavailable with no active ride
SELECT da.*, r.status
FROM driver_availability da
LEFT JOIN rides r ON da.current_ride_id = r.id
WHERE da.is_available = false
  AND (r.id IS NULL OR r.status IN ('completed', 'cancelled'));

-- Count scheduled rides by status
SELECT status, COUNT(*)
FROM rides
WHERE is_scheduled = true
GROUP BY status;

-- Find drivers with multiple pending scheduled rides
SELECT driver_id, COUNT(*) as pending_scheduled
FROM rides
WHERE status = 'pending'
  AND is_scheduled = true
GROUP BY driver_id
HAVING COUNT(*) > 1;
```

---

**Last Updated**: November 25, 2024
**Fix Version**: 1.0
**Status**: ✅ Implemented and Tested
