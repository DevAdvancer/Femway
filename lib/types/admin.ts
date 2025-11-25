// Pricing settings
export interface PricingSettings {
  id: string
  petrol_price_per_liter: number
  price_per_km: number
  driver_cost_per_ride: number
  office_time_price_multiplier: number
  office_hours_start: string // Time in HH:MM:SS format
  office_hours_end: string // Time in HH:MM:SS format
  updated_by?: string | null
  created_at: string
  updated_at: string
}

// Driver with profile for admin view
export interface DriverWithProfile {
  user_id: string
  email: string
  driver_profile: {
    id: string
    user_id: string
    phone: string
    gender: string
    government_id_url?: string | null
    selfie_url?: string | null
    driving_license_url?: string | null
    car_rc_url?: string | null
    number_plate_url?: string | null
    car_photos_urls?: string[] | null
    government_id_uploaded_at?: string | null
    selfie_uploaded_at?: string | null
    driving_license_uploaded_at?: string | null
    car_rc_uploaded_at?: string | null
    number_plate_uploaded_at?: string | null
    car_photos_uploaded_at?: string | null
    documents_complete: boolean
    profile_verified: boolean
    created_at: string
    updated_at: string
  }
}

// Verification status filter
export type VerificationStatus = 'all' | 'pending' | 'verified' | 'rejected'
