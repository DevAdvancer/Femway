'use client'

import { useState, useEffect } from 'react'
import type { Location, RideCalculation, AvailableDriver } from '@/lib/types/ride'
import { calculateDistance } from '@/lib/utils/distance'

interface BookingFormProps {
  onCalculate: (pickup: Location, dropoff: Location, distance: number) => void
  onLocationUpdate: (location: Location, type: 'pickup' | 'dropoff') => void
  calculation: RideCalculation | null
  availableDrivers: AvailableDriver[]
  onBook: (driverId: string, isScheduled: boolean, scheduledDate?: string, scheduledTime?: string) => void
  booking: boolean
}

interface SearchResult {
  display_name: string
  lat: string
  lon: string
}

export default function BookingForm({
  onCalculate,
  onLocationUpdate,
  calculation,
  availableDrivers,
  onBook,
  booking,
}: BookingFormProps) {
  const [pickupSearch, setPickupSearch] = useState('')
  const [dropoffSearch, setDropoffSearch] = useState('')
  const [pickupResults, setPickupResults] = useState<SearchResult[]>([])
  const [dropoffResults, setDropoffResults] = useState<SearchResult[]>([])
  const [pickupLocation, setPickupLocation] = useState<Location | null>(null)
  const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null)
  const [selectedDriver, setSelectedDriver] = useState('')
  const [searching, setSearching] = useState<'pickup' | 'dropoff' | null>(null)
  const [gettingLocation, setGettingLocation] = useState<'pickup' | 'dropoff' | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  // Search for address using OpenStreetMap Nominatim (Free)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pickupSearch.length >= 3) {
        searchAddress(pickupSearch, 'pickup')
      } else {
        setPickupResults([])
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [pickupSearch])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (dropoffSearch.length >= 3) {
        searchAddress(dropoffSearch, 'dropoff')
      } else {
        setDropoffResults([])
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [dropoffSearch])

  const searchAddress = async (query: string, type: 'pickup' | 'dropoff') => {
    setSearching(type)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&countrycodes=in`
      )
      const data = await response.json()
      if (type === 'pickup') {
        setPickupResults(data)
      } else {
        setDropoffResults(data)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(null)
    }
  }

  // Select location from search results
  const selectLocation = (result: SearchResult, type: 'pickup' | 'dropoff') => {
    const location: Location = {
      address: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    }

    if (type === 'pickup') {
      setPickupLocation(location)
      setPickupSearch(result.display_name)
      setPickupResults([])
    } else {
      setDropoffLocation(location)
      setDropoffSearch(result.display_name)
      setDropoffResults([])
    }

    onLocationUpdate(location, type)
  }

  // Get current location with high accuracy
  const getCurrentLocation = async (type: 'pickup' | 'dropoff') => {
    if (!navigator.geolocation) {
      alert('❌ Geolocation is not supported by your browser')
      return
    }

    setGettingLocation(type)

    try {
      // Request location with high accuracy
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        )
      })

      const lat = position.coords.latitude
      const lng = position.coords.longitude
      const accuracy = position.coords.accuracy

      console.log('📍 Location obtained:', {
        lat,
        lng,
        accuracy: `${accuracy.toFixed(0)} meters`,
      })

      // Reverse geocode to get address
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`
        )
        const data = await response.json()

        const location: Location = {
          address: data.display_name || `Current Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
          lat,
          lng,
        }

        if (type === 'pickup') {
          setPickupLocation(location)
          setPickupSearch(location.address)
        } else {
          setDropoffLocation(location)
          setDropoffSearch(location.address)
        }

        onLocationUpdate(location, type)

        // Show success message with accuracy
        if (accuracy < 50) {
          console.log('✅ High accuracy location obtained')
        } else if (accuracy < 100) {
          console.log('⚠️ Moderate accuracy location obtained')
        } else {
          console.log('⚠️ Low accuracy location obtained')
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error)
        const location: Location = {
          address: `Current Location (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
          lat,
          lng,
        }
        if (type === 'pickup') {
          setPickupLocation(location)
          setPickupSearch(location.address)
        } else {
          setDropoffLocation(location)
          setDropoffSearch(location.address)
        }
        onLocationUpdate(location, type)
      }
    } catch (error: any) {
      console.error('Geolocation error:', error)

      let errorMessage = '❌ Unable to get your location.\n\n'

      if (error.code === 1) {
        errorMessage += 'Permission denied. Please allow location access in your browser settings.'
      } else if (error.code === 2) {
        errorMessage += 'Location unavailable. Please check your device settings.'
      } else if (error.code === 3) {
        errorMessage += 'Location request timed out. Please try again.'
      } else {
        errorMessage += 'An unknown error occurred. Please try again.'
      }

      alert(errorMessage)
    } finally {
      setGettingLocation(null)
    }
  }

  const handleCalculate = async () => {
    if (!pickupLocation || !dropoffLocation) {
      alert('Please select both pickup and drop-off locations')
      return
    }

    setCalculating(true)

    try {
      // Use OSRM (Open Source Routing Machine) for free routing
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pickupLocation.lng},${pickupLocation.lat};${dropoffLocation.lng},${dropoffLocation.lat}?overview=false`
      )

      if (!response.ok) {
        throw new Error('Failed to calculate route')
      }

      const data = await response.json()

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error('No route found')
      }

      // Get distance in meters and convert to km
      const distanceMeters = data.routes[0].distance
      const roadDistance = Math.round((distanceMeters / 1000) * 100) / 100
      const durationSeconds = data.routes[0].duration
      const durationMinutes = Math.round(durationSeconds / 60)

      // Calculate straight-line distance for comparison
      const straightDistance = calculateDistance(
        pickupLocation.lat,
        pickupLocation.lng,
        dropoffLocation.lat,
        dropoffLocation.lng
      )

      console.log('=== DISTANCE CALCULATION ===')
      console.log('Pickup:', pickupLocation.address)
      console.log('Coordinates:', `${pickupLocation.lat}, ${pickupLocation.lng}`)
      console.log('Dropoff:', dropoffLocation.address)
      console.log('Coordinates:', `${dropoffLocation.lat}, ${dropoffLocation.lng}`)
      console.log('---')
      console.log('Straight-line distance:', straightDistance.toFixed(2), 'km')
      console.log('Road distance (OSRM):', roadDistance, 'km')
      console.log('Difference:', (roadDistance - straightDistance).toFixed(2), 'km')
      console.log('Duration:', durationMinutes, 'minutes')
      console.log('============================')

      onCalculate(pickupLocation, dropoffLocation, roadDistance)
    } catch (error: any) {
      console.error('Route calculation error:', error)

      // Fallback to straight-line distance with multiplier
      const straightDistance = calculateDistance(
        pickupLocation.lat,
        pickupLocation.lng,
        dropoffLocation.lat,
        dropoffLocation.lng
      )
      const fallbackDistance = Math.round(straightDistance * 1.3 * 100) / 100

      alert(
        `⚠️ Could not calculate exact route.\n\nUsing estimated distance: ${fallbackDistance} km\n\n(Straight-line: ${straightDistance.toFixed(2)} km × 1.3)`
      )
      onCalculate(pickupLocation, dropoffLocation, fallbackDistance)
    } finally {
      setCalculating(false)
    }
  }

  const handleBook = () => {
    if (!selectedDriver) {
      alert('Please select a driver')
      return
    }

    if (isScheduled && (!scheduledDate || !scheduledTime)) {
      alert('Please select both date and time for scheduled ride')
      return
    }

    onBook(selectedDriver, isScheduled, scheduledDate, scheduledTime)
  }

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  return (
    <div className="space-y-6">
      {/* Pickup Location */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Pickup Location</h3>
          <button
            onClick={() => getCurrentLocation('pickup')}
            disabled={gettingLocation === 'pickup'}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            {gettingLocation === 'pickup' ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Getting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Current Location
              </>
            )}
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search for a place (e.g., Connaught Place, Delhi)"
            value={pickupSearch}
            onChange={(e) => setPickupSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
          />
          {searching === 'pickup' && (
            <div className="absolute right-3 top-2.5">
              <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
          {pickupResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {pickupResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => selectLocation(result, 'pickup')}
                  className="w-full text-left px-3 py-2 hover:bg-purple-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="text-sm text-gray-900">{result.display_name}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        {pickupLocation && (
          <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-800">
            ✓ Selected: {pickupLocation.address}
          </div>
        )}
      </div>

      {/* Dropoff Location */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Drop-off Location</h3>
          <button
            onClick={() => getCurrentLocation('dropoff')}
            disabled={gettingLocation === 'dropoff'}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            {gettingLocation === 'dropoff' ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Getting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Current Location
              </>
            )}
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search for a place (e.g., India Gate, Delhi)"
            value={dropoffSearch}
            onChange={(e) => setDropoffSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
          />
          {searching === 'dropoff' && (
            <div className="absolute right-3 top-2.5">
              <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
          {dropoffResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {dropoffResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => selectLocation(result, 'dropoff')}
                  className="w-full text-left px-3 py-2 hover:bg-purple-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="text-sm text-gray-900">{result.display_name}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        {dropoffLocation && (
          <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-800">
            ✓ Selected: {dropoffLocation.address}
          </div>
        )}
      </div>

      {/* Scheduling Option */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isScheduled}
            onChange={(e) => setIsScheduled(e.target.checked)}
            className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
          />
          <div>
            <h3 className="font-semibold text-gray-900">Schedule for Later</h3>
            <p className="text-sm text-gray-600">Book a ride for a specific date and time</p>
          </div>
        </label>

        {isScheduled && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={getMinDate()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              />
            </div>
          </div>
        )}
      </div>

      {/* Calculate Button */}
      <button
        onClick={handleCalculate}
        disabled={calculating}
        className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {calculating ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Calculating Route...
          </>
        ) : (
          'Calculate Cost'
        )}
      </button>

      {/* Cost Breakdown */}
      {calculation && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Cost Breakdown</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Distance:</span>
              <span className="font-medium text-gray-900">{calculation.distance_km} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Base Cost:</span>
              <span className="font-medium text-gray-900">₹{calculation.base_cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Driver Cost:</span>
              <span className="font-medium text-gray-900">₹{calculation.driver_cost.toFixed(2)}</span>
            </div>
            {calculation.office_hours_applied && (
              <div className="flex justify-between text-amber-600">
                <span>Office Hours (×{calculation.office_hours_multiplier}):</span>
                <span className="font-medium">Applied</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-purple-200">
              <span className="font-semibold text-gray-900">Total Cost:</span>
              <span className="font-bold text-purple-600 text-lg">
                ₹{calculation.total_cost.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-purple-200">
            <p className="text-xs text-gray-600">
              💡 Distance calculated using OSRM routing. Check browser console for details.
            </p>
          </div>
        </div>
      )}

      {/* Driver Selection */}
      {calculation && availableDrivers.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Select Driver</h3>
          <div className="space-y-2">
            {availableDrivers.map((driver) => (
              <label
                key={driver.user_id}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedDriver === driver.user_id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                } ${!driver.is_available ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  name="driver"
                  value={driver.user_id}
                  checked={selectedDriver === driver.user_id}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  disabled={!driver.is_available}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{driver.email}</div>
                  <div className="text-sm text-gray-600">{driver.phone}</div>
                </div>
                {driver.is_available ? (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    Available
                  </span>
                ) : (
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                    Busy
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Book Button */}
      {calculation && availableDrivers.length > 0 && (
        <button
          onClick={handleBook}
          disabled={!selectedDriver || booking}
          className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {booking ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Booking...
            </>
          ) : (
            'Book Ride'
          )}
        </button>
      )}

      {calculation && availableDrivers.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
          <p className="text-amber-800">No verified drivers available at the moment.</p>
          <p className="text-sm text-amber-600 mt-1">Please try again later.</p>
        </div>
      )}
    </div>
  )
}
