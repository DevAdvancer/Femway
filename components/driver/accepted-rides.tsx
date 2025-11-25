'use client'

import { useState } from 'react'
import type { Ride } from '@/lib/types/ride'
import LoadingSpinner from '@/components/loading-spinner'

interface AcceptedRidesProps {
  rides: Ride[]
  onComplete: (rideId: string, finalCost: number) => void
  onCancel: (rideId: string) => void
  processing: string | null
}

export default function AcceptedRides({ rides, onComplete, onCancel, processing }: AcceptedRidesProps) {
  const [selectedRide, setSelectedRide] = useState<string | null>(null)
  const [finalCost, setFinalCost] = useState<{ [key: string]: string }>({})

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-indigo-100 text-indigo-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const activeRides = rides.filter(ride =>
    ride.status === 'accepted' || ride.status === 'in_progress'
  )

  const handleComplete = (rideId: string) => {
    const cost = parseFloat(finalCost[rideId] || '0')
    if (cost <= 0) {
      alert('Please enter a valid final cost')
      return
    }
    onComplete(rideId, cost)
    setSelectedRide(null)
    setFinalCost({ ...finalCost, [rideId]: '' })
  }

  if (activeRides.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <svg
          className="w-16 h-16 text-gray-400 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Rides</h3>
        <p className="text-gray-600">Accepted rides will appear here.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Rides</h2>
      <div className="space-y-4">
        {activeRides.map((ride) => (
          <div
            key={ride.id}
            className="border-2 border-green-200 rounded-lg p-4 bg-green-50"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ride.status)}`}>
                    {ride.status === 'accepted' ? 'Accepted' : 'In Progress'}
                  </span>
                  {ride.is_scheduled && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      📅 Scheduled
                    </span>
                  )}
                  <span className="text-sm text-gray-500">
                    {ride.accepted_at ? formatDate(ride.accepted_at) : formatDate(ride.requested_at)}
                  </span>
                </div>

                {ride.is_scheduled && ride.scheduled_date && ride.scheduled_time && (
                  <div className="mb-3 p-2 bg-purple-100 rounded text-sm text-purple-900 font-medium">
                    📅 Scheduled for: {new Date(ride.scheduled_date).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} at {ride.scheduled_time}
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <circle cx="10" cy="10" r="8" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-700">Pickup</div>
                      <div className="text-gray-900">{ride.pickup_address}</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg
                      className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-700">Drop-off</div>
                      <div className="text-gray-900">{ride.dropoff_address}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="text-sm text-gray-600 mb-1">Estimated</div>
                <div className="text-xl font-bold text-green-600">
                  ₹{ride.estimated_cost.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">{ride.distance_km} km</div>
              </div>
            </div>

            {selectedRide === ride.id ? (
              <div className="mt-4 p-4 bg-white rounded-lg border-2 border-blue-300">
                <h4 className="font-semibold text-gray-900 mb-3">Complete Ride</h4>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Final Cost (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={finalCost[ride.id] || ride.estimated_cost.toFixed(2)}
                    onChange={(e) => setFinalCost({ ...finalCost, [ride.id]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder="Enter final cost"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Estimated: ₹{ride.estimated_cost.toFixed(2)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleComplete(ride.id)}
                    disabled={processing === ride.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                  >
                    {processing === ride.id ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>Completing...</span>
                      </>
                    ) : (
                      'Confirm Complete'
                    )}
                  </button>
                  <button
                    onClick={() => setSelectedRide(null)}
                    disabled={processing === ride.id}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => {
                    setSelectedRide(ride.id)
                    setFinalCost({ ...finalCost, [ride.id]: ride.estimated_cost.toFixed(2) })
                  }}
                  disabled={processing === ride.id}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Complete Ride
                </button>
                <button
                  onClick={() => onCancel(ride.id)}
                  disabled={processing === ride.id}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                >
                  {processing === ride.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                      <span>Cancelling...</span>
                    </>
                  ) : (
                    'Cancel Ride'
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
