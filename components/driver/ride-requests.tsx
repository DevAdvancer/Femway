'use client'

import type { Ride } from '@/lib/types/ride'
import LoadingSpinner from '@/components/loading-spinner'

interface RideRequestsProps {
  rides: Ride[]
  onAccept: (rideId: string) => void
  onReject: (rideId: string) => void
  processing: string | null
}

export default function RideRequests({ rides, onAccept, onReject, processing }: RideRequestsProps) {
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

  const pendingRides = rides.filter(ride => ride.status === 'pending')

  if (pendingRides.length === 0) {
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Requests</h3>
        <p className="text-gray-600">New ride requests will appear here.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Ride Requests</h2>
      <div className="space-y-4">
        {pendingRides.map((ride) => (
          <div
            key={ride.id}
            className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    New Request
                  </span>
                  {ride.is_scheduled && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      📅 Scheduled
                    </span>
                  )}
                  <span className="text-sm text-gray-500">{formatDate(ride.requested_at)}</span>
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
                <div className="text-2xl font-bold text-green-600">
                  ₹{ride.estimated_cost.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">{ride.distance_km} km</div>
                {ride.office_hours_applied && (
                  <div className="text-xs text-amber-600 mt-1">Office hours</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={() => onAccept(ride.id)}
                disabled={processing === ride.id}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {processing === ride.id ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Accepting...</span>
                  </>
                ) : (
                  'Accept'
                )}
              </button>
              <button
                onClick={() => onReject(ride.id)}
                disabled={processing === ride.id}
                className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
              >
                {processing === ride.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></div>
                    <span>Rejecting...</span>
                  </>
                ) : (
                  'Reject'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
