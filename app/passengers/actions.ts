'use server'

import { createClient } from '@/lib/supabase/server'
import type { Ride, AvailableDriver, BookingRequest, RideCalculation } from '@/lib/types/ride'
import type { PricingSettings } from '@/lib/types/admin'

/**
 * Get current pricing settings
 */
export async function getPricingSettings(): Promise<PricingSettings | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('pricing_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching pricing:', error)
      return null
    }

    return data as PricingSettings
  } catch (error) {
    console.error('Error in getPricingSettings:', error)
    return null
  }
}

/**
 * Calculate ride cost
 */
export async function calculateRideCost(
  distance_km: number
): Promise<RideCalculation | null> {
  try {
    const pricing = await getPricingSettings()
    if (!pricing) return null

    // Check if current time is within configured office hours (Monday-Friday)
    const now = new Date()
    const day = now.getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const currentTime = now.toTimeString().substring(0, 5) // HH:MM format

    // Parse office hours (format: HH:MM:SS)
    const startTime = pricing.office_hours_start?.substring(0, 5) || '09:00'
    const endTime = pricing.office_hours_end?.substring(0, 5) || '18:00'

    // Check if it's a weekday and within office hours
    const isWeekday = day >= 1 && day <= 5
    const isWithinTimeRange = currentTime >= startTime && currentTime < endTime
    const isOfficeHours = isWeekday && isWithinTimeRange

    const base_cost = distance_km * pricing.price_per_km
    const driver_cost = pricing.driver_cost_per_ride
    const office_hours_multiplier = isOfficeHours ? pricing.office_time_price_multiplier : 1.0

    const total_cost = (base_cost + driver_cost) * office_hours_multiplier

    return {
      distance_km,
      base_cost,
      driver_cost,
      office_hours_multiplier,
      office_hours_applied: isOfficeHours,
      total_cost: Math.round(total_cost * 100) / 100, // Round to 2 decimals
    }
  } catch (error) {
    console.error('Error calculating ride cost:', error)
    return null
  }
}

/**
 * Get available verified drivers
 */
export async function getAvailableDrivers(): Promise<AvailableDriver[]> {
  try {
    const supabase = await createClient()

    // Get verified drivers with availability
    const { data, error } = await supabase
      .from('driver_profiles_with_email')
      .select('user_id, email, phone')
      .eq('profile_verified', true)

    if (error) {
      console.error('Error fetching drivers:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Get availability for each driver
    const driversWithAvailability: AvailableDriver[] = []

    for (const driver of data) {
      const { data: availability } = await supabase
        .from('driver_availability')
        .select('is_available, current_ride_id')
        .eq('driver_id', driver.user_id)
        .single()

      driversWithAvailability.push({
        user_id: driver.user_id,
        email: driver.email,
        phone: driver.phone,
        is_available: availability?.is_available ?? true,
        current_ride_id: availability?.current_ride_id,
      })
    }

    return driversWithAvailability
  } catch (error) {
    console.error('Error in getAvailableDrivers:', error)
    return []
  }
}

/**
 * Book a ride with concurrent booking prevention
 */
export async function bookRide(
  passengerId: string,
  booking: BookingRequest
): Promise<{ success: boolean; ride?: Ride; error?: string }> {
  try {
    const supabase = await createClient()

    // Check and create driver availability if it doesn't exist
    const { data: availability, error: availError } = await supabase
      .from('driver_availability')
      .select('is_available, current_ride_id')
      .eq('driver_id', booking.driver_id)
      .maybeSingle()

    // If no availability record exists, create one
    if (!availability && availError?.code === 'PGRST116') {
      const { error: insertError } = await supabase
        .from('driver_availability')
        .insert({
          driver_id: booking.driver_id,
          is_available: true,
          current_ride_id: null,
          last_updated: new Date().toISOString(),
        })

      if (insertError) {
        console.error('Error creating availability:', insertError)
        return { success: false, error: 'Failed to initialize driver availability' }
      }
    } else if (availError) {
      console.error('Error checking availability:', availError)
      return { success: false, error: 'Failed to check driver availability' }
    }

    // Check if driver is available
    if (availability && !availability.is_available) {
      return {
        success: false,
        error: 'This driver is no longer available. Please select another driver.',
      }
    }

    // Create the ride
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .insert({
        passenger_id: passengerId,
        driver_id: booking.driver_id,
        pickup_address: booking.pickup.address,
        pickup_lat: booking.pickup.lat,
        pickup_lng: booking.pickup.lng,
        dropoff_address: booking.dropoff.address,
        dropoff_lat: booking.dropoff.lat,
        dropoff_lng: booking.dropoff.lng,
        distance_km: booking.distance_km,
        estimated_cost: booking.estimated_cost,
        office_hours_applied: booking.office_hours_applied,
        is_scheduled: booking.is_scheduled || false,
        scheduled_date: booking.scheduled_date || null,
        scheduled_time: booking.scheduled_time || null,
        status: 'pending',
      })
      .select()
      .single()

    if (rideError) {
      console.error('Error creating ride:', rideError)
      return { success: false, error: 'Failed to create ride request' }
    }

    // Mark driver as unavailable
    const { error: updateError } = await supabase
      .from('driver_availability')
      .update({
        is_available: false,
        current_ride_id: ride.id,
        last_updated: new Date().toISOString(),
      })
      .eq('driver_id', booking.driver_id)

    if (updateError) {
      console.error('Error updating availability:', updateError)
      // Rollback: delete the ride
      await supabase.from('rides').delete().eq('id', ride.id)
      return { success: false, error: 'Failed to book driver' }
    }

    return { success: true, ride: ride as Ride }
  } catch (error) {
    console.error('Error in bookRide:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get passenger's rides
 */
export async function getPassengerRides(passengerId: string): Promise<Ride[]> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .eq('passenger_id', passengerId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching rides:', error)
      return []
    }

    return (data as Ride[]) || []
  } catch (error) {
    console.error('Error in getPassengerRides:', error)
    return []
  }
}

/**
 * Cancel a ride
 */
export async function cancelRide(
  rideId: string,
  passengerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get the ride
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .eq('passenger_id', passengerId)
      .single()

    if (rideError || !ride) {
      return { success: false, error: 'Ride not found' }
    }

    if (ride.status !== 'pending') {
      return { success: false, error: 'Only pending rides can be cancelled' }
    }

    // Update ride status
    const { error: updateError } = await supabase
      .from('rides')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', rideId)

    if (updateError) {
      console.error('Error cancelling ride:', updateError)
      return { success: false, error: 'Failed to cancel ride' }
    }

    // Make driver available again
    if (ride.driver_id) {
      await supabase
        .from('driver_availability')
        .update({
          is_available: true,
          current_ride_id: null,
          last_updated: new Date().toISOString(),
        })
        .eq('driver_id', ride.driver_id)
    }

    return { success: true }
  } catch (error) {
    console.error('Error in cancelRide:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
