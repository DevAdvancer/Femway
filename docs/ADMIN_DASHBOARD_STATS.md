# Admin Dashboard Statistics

## Overview

The admin dashboard now displays comprehensive platform statistics including real-time data for rides and revenue.

## Statistics Displayed

### Main Stats Cards (Top Row)

1. **Total Users**
   - Shows count of all registered users across all roles
   - Icon: User group
   - Color: Blue gradient

2. **Verified Drivers**
   - Shows count of drivers who have been verified by admin
   - Displays total drivers count as secondary info
   - Icon: Shield with checkmark
   - Color: Indigo/Purple gradient

3. **Total Rides**
   - Shows count of all rides (all statuses)
   - Displays pending rides count as secondary info
   - Icon: Lightning bolt
   - Color: Purple/Pink gradient

4. **Total Revenue**
   - Shows sum of all completed ride costs
   - Uses `final_cost` if available, otherwise `estimated_cost`
   - Icon: Currency symbol
   - Color: Green gradient
   - Format: ₹X.XX (Indian Rupees)

### Detailed Ride Statistics (Conditional Section)

This section appears only when there are rides in the system.

Shows 5 key metrics:
1. **Total Rides** - All rides regardless of status
2. **Pending** - Rides awaiting driver acceptance
3. **Completed** - Successfully completed rides
4. **Revenue** - Total earnings from completed rides
5. **Avg per Ride** - Average revenue per completed ride

## Data Sources

### Database Queries

```typescript
// Total users
SELECT COUNT(*) FROM user_roles

// Total drivers
SELECT COUNT(*) FROM user_roles WHERE role = 'driver'

// Verified drivers
SELECT COUNT(*) FROM driver_profiles WHERE profile_verified = true

// Total rides
SELECT COUNT(*) FROM rides

// Pending rides
SELECT COUNT(*) FROM rides WHERE status = 'pending'

// Completed rides with costs
SELECT final_cost, estimated_cost FROM rides WHERE status = 'completed'
```

### Revenue Calculation

```typescript
totalRevenue = completedRides.reduce((sum, ride) => {
  return sum + (ride.final_cost || ride.estimated_cost || 0)
}, 0)
```

The system prioritizes `final_cost` (set by driver at completion) over `estimated_cost` (calculated at booking).

## Features

- **Real-time Data**: Statistics update on every page load
- **Hover Effects**: Cards have subtle shadow effects on hover
- **Visual Icons**: Each stat has a relevant icon with gradient background
- **Conditional Display**: Detailed breakdown only shows when rides exist
- **Responsive Design**: Grid layout adapts to screen size

## Future Enhancements

Potential additions:
- Date range filters (today, this week, this month)
- Revenue trends chart
- Top performing drivers
- Peak hours analysis
- Ride status distribution pie chart
- Export statistics to CSV/PDF
- Real-time updates using Supabase subscriptions

## Related Files

- `app/admin/page.tsx` - Main admin dashboard
- `app/admin/drivers/page.tsx` - Driver management
- `app/admin/pricing/page.tsx` - Pricing configuration
