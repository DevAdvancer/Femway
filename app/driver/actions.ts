'use server'

import { createClient } from '@/lib/supabase/server'
import type { DriverProfile, DocumentType, UploadResponse } from '@/lib/types/driver'
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/lib/types/driver'

/**
 * Get driver profile by user ID
 */
export async function getDriverProfile(userId: string): Promise<DriverProfile | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No profile found
        return null
      }
      console.error('Error fetching driver profile:', error)
      return null
    }

    return data as DriverProfile
  } catch (error) {
    console.error('Error in getDriverProfile:', error)
    return null
  }
}

/**
 * Create or update driver profile
 */
export async function upsertDriverProfile(
  userId: string,
  data: Partial<DriverProfile>
): Promise<{ success: boolean; profile?: DriverProfile; error?: string }> {
  try {
    const supabase = await createClient()

    // Validate phone number
    if (data.phone && !isValidPhoneNumber(data.phone)) {
      return { success: false, error: 'Please enter a valid phone number' }
    }

    // Validate gender (must be female)
    if (data.gender && data.gender !== 'female') {
      return { success: false, error: 'Only female drivers can register' }
    }

    // Prepare upsert data
    const upsertData = {
      user_id: userId,
      phone: data.phone,
      gender: data.gender || 'female',
      updated_at: new Date().toISOString(),
    }

    const { data: profile, error } = await supabase
      .from('driver_profiles')
      .upsert(upsertData, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      console.error('Error upserting driver profile:', error)
      return { success: false, error: 'Failed to save profile' }
    }

    return { success: true, profile: profile as DriverProfile }
  } catch (error) {
    console.error('Error in upsertDriverProfile:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Validate phone number format
 */
function isValidPhoneNumber(phone: string): boolean {
  // Basic phone validation: 10-15 digits, optional + prefix
  const phoneRegex = /^\+?[1-9]\d{9,14}$/
  return phoneRegex.test(phone.replace(/[\s-()]/g, ''))
}

/**
 * Upload document to Supabase Storage and update profile
 */
export async function uploadDocument(
  userId: string,
  documentType: DocumentType,
  formData: FormData
): Promise<UploadResponse> {
  try {
    const supabase = await createClient()
    const file = formData.get('file') as File

    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'File size must be less than 10MB' }
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return { success: false, error: 'Please upload a JPEG, PNG, or PDF file' }
    }

    // Generate file path
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    let filePath: string

    if (documentType === 'car_photos') {
      filePath = `${userId}/car-photos/photo-${timestamp}.${fileExt}`
    } else {
      filePath = `${userId}/${documentType.replace('_', '-')}.${fileExt}`
    }

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('driver-documents')
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return { success: false, error: 'Failed to upload document' }
    }

    // Get public URL (even though bucket is private, we store the path)
    const { data: { publicUrl } } = supabase.storage
      .from('driver-documents')
      .getPublicUrl(filePath)

    // Update driver profile with document URL
    const urlField = `${documentType}_url`
    const timestampField = `${documentType}_uploaded_at`

    let updateData: Record<string, unknown> = {
      [timestampField]: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Handle car photos array
    if (documentType === 'car_photos') {
      const { data: currentProfile } = await supabase
        .from('driver_profiles')
        .select('car_photos_urls')
        .eq('user_id', userId)
        .single()

      const existingUrls = currentProfile?.car_photos_urls || []
      updateData[urlField] = [...existingUrls, filePath]
    } else {
      updateData[urlField] = filePath
    }

    // Check if all documents are complete
    const { data: profile } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (profile) {
      const allDocsComplete =
        profile.government_id_url &&
        profile.selfie_url &&
        profile.driving_license_url &&
        profile.car_rc_url &&
        profile.number_plate_url &&
        profile.car_photos_urls &&
        profile.car_photos_urls.length > 0

      updateData.documents_complete = !!allDocsComplete
    }

    const { error: updateError } = await supabase
      .from('driver_profiles')
      .update(updateData)
      .eq('user_id', userId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return { success: false, error: 'Failed to update profile' }
    }

    return { success: true, url: filePath }
  } catch (error) {
    console.error('Error in uploadDocument:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete document from storage and update profile
 */
export async function deleteDocument(
  userId: string,
  documentType: DocumentType,
  filePath?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // If filePath provided, delete from storage
    if (filePath) {
      const { error: deleteError } = await supabase.storage
        .from('driver-documents')
        .remove([filePath])

      if (deleteError) {
        console.error('Storage delete error:', deleteError)
        // Continue anyway to clear the database reference
      }
    }

    // Update profile to clear document reference
    const urlField = `${documentType}_url`
    const timestampField = `${documentType}_uploaded_at`

    const updateData: Record<string, unknown> = {
      [urlField]: null,
      [timestampField]: null,
      documents_complete: false,
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await supabase
      .from('driver_profiles')
      .update(updateData)
      .eq('user_id', userId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return { success: false, error: 'Failed to update profile' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in deleteDocument:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get signed URL for viewing private document
 */
export async function getDocumentUrl(filePath: string): Promise<string | null> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase.storage
      .from('driver-documents')
      .createSignedUrl(filePath, 3600) // 1 hour expiration

    if (error) {
      console.error('Error creating signed URL:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('Error in getDocumentUrl:', error)
    return null
  }
}

/**
 * Get driver's assigned rides
 */
export async function getDriverRides(driverId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .eq('driver_id', driverId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching driver rides:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getDriverRides:', error)
    return []
  }
}

/**
 * Accept a ride request
 */
export async function acceptRide(rideId: string, driverId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get the ride details
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .eq('driver_id', driverId)
      .eq('status', 'pending')
      .single()

    if (rideError || !ride) {
      return { success: false, error: 'Ride not found or already accepted' }
    }

    // Update ride status
    const { error: updateError } = await supabase
      .from('rides')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', rideId)
      .eq('driver_id', driverId)
      .eq('status', 'pending')

    if (updateError) {
      console.error('Error accepting ride:', updateError)
      return { success: false, error: 'Failed to accept ride' }
    }

    // Mark driver as unavailable and link to current ride
    await supabase
      .from('driver_availability')
      .update({
        is_available: false,
        current_ride_id: rideId,
        last_updated: new Date().toISOString(),
      })
      .eq('driver_id', driverId)

    return { success: true }
  } catch (error) {
    console.error('Error in acceptRide:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Reject a ride request
 */
export async function rejectRide(rideId: string, driverId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get the ride
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .eq('driver_id', driverId)
      .eq('status', 'pending')
      .single()

    if (rideError || !ride) {
      return { success: false, error: 'Ride not found' }
    }

    // Update ride status to cancelled
    const { error: updateError } = await supabase
      .from('rides')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', rideId)

    if (updateError) {
      console.error('Error rejecting ride:', updateError)
      return { success: false, error: 'Failed to reject ride' }
    }

    // Make driver available again (only if they were marked unavailable)
    // For scheduled rides, driver might still be available
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
          last_updated: new Date().toISOString(),
        })
        .eq('driver_id', driverId)
    }

    return { success: true }
  } catch (error) {
    console.error('Error in rejectRide:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Complete a ride
 */
export async function completeRide(
  rideId: string,
  driverId: string,
  finalCost: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Update ride status
    const { error: updateError } = await supabase
      .from('rides')
      .update({
        status: 'completed',
        final_cost: finalCost,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', rideId)
      .eq('driver_id', driverId)
      .in('status', ['accepted', 'in_progress'])

    if (updateError) {
      console.error('Error completing ride:', updateError)
      return { success: false, error: 'Failed to complete ride' }
    }

    // Make driver available again
    await supabase
      .from('driver_availability')
      .update({
        is_available: true,
        current_ride_id: null,
        last_updated: new Date().toISOString(),
      })
      .eq('driver_id', driverId)

    return { success: true }
  } catch (error) {
    console.error('Error in completeRide:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Cancel an accepted ride
 */
export async function cancelAcceptedRide(
  rideId: string,
  driverId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Update ride status
    const { error: updateError } = await supabase
      .from('rides')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', rideId)
      .eq('driver_id', driverId)
      .in('status', ['accepted', 'in_progress'])

    if (updateError) {
      console.error('Error cancelling ride:', updateError)
      return { success: false, error: 'Failed to cancel ride' }
    }

    // Make driver available again
    await supabase
      .from('driver_availability')
      .update({
        is_available: true,
        current_ride_id: null,
        last_updated: new Date().toISOString(),
      })
      .eq('driver_id', driverId)

    return { success: true }
  } catch (error) {
    console.error('Error in cancelAcceptedRide:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
