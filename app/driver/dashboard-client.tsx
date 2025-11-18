'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { DriverProfile } from '@/lib/types/driver'
import type { Ride } from '@/lib/types/ride'
import {
  getDriverProfile,
  getDriverRides,
  acceptRide,
  rejectRide,
  completeRide,
  cancelAcceptedRide
} from './actions'
import DocumentStatus from '@/components/driver/document-status'
import ProfileForm from '@/components/driver/profile-form'
import RideRequests from '@/components/driver/ride-requests'
import AcceptedRides from '@/components/driver/accepted-rides'
import RideHistory from '@/components/driver/ride-history'

interface DriverDashboardClientProps {
  user: User
  profile: DriverProfile | null
}

export default function DriverDashboardClient({
  user,
  profile: initialProfile,
}: DriverDashboardClientProps) {
  const router = useRouter()
  const [profile, setProfile] = useState<DriverProfile | null>(initialProfile)
  const [rides, setRides] = useState<Ride[]>([])
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'requests' | 'active' | 'history'>('profile')

  useEffect(() => {
    loadRides()
  }, [user.id])

  const loadRides = async () => {
    const ridesData = await getDriverRides(user.id)
    setRides(ridesData)
  }

  const refreshProfile = async () => {
    const updatedProfile = await getDriverProfile(user.id)
    setProfile(updatedProfile)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleAccept = async (rideId: string) => {
    setProcessing(rideId)
    setError(null)
    setSuccess(null)

    const result = await acceptRide(rideId, user.id)
    setProcessing(null)

    if (result.success) {
      setSuccess('Ride accepted successfully!')
      await loadRides()
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(result.error || 'Failed to accept ride')
    }
  }

  const handleReject = async (rideId: string) => {
    setProcessing(rideId)
    setError(null)
    setSuccess(null)

    const result = await rejectRide(rideId, user.id)
    setProcessing(null)

    if (result.success) {
      setSuccess('Ride rejected')
      await loadRides()
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(result.error || 'Failed to reject ride')
    }
  }

  const handleComplete = async (rideId: string, finalCost: number) => {
    setProcessing(rideId)
    setError(null)
    setSuccess(null)

    const result = await completeRide(rideId, user.id, finalCost)
    setProcessing(null)

    if (result.success) {
      setSuccess('Ride completed successfully!')
      await loadRides()
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(result.error || 'Failed to complete ride')
    }
  }

  const handleCancel = async (rideId: string) => {
    setProcessing(rideId)
    setError(null)
    setSuccess(null)

    const result = await cancelAcceptedRide(rideId, user.id)
    setProcessing(null)

    if (result.success) {
      setSuccess('Ride cancelled')
      await loadRides()
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError(result.error || 'Failed to cancel ride')
    }
  }

  const pendingCount = rides.filter(r => r.status === 'pending').length
  const activeCount = rides.filter(r => r.status === 'accepted' || r.status === 'in_progress').length
  const completedRides = rides.filter(r => r.status === 'completed')
  const totalRevenue = completedRides.reduce((sum, ride) => sum + (ride.final_cost || ride.estimated_cost), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Driver Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your profile and documents
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/driver/verification')}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload Documents
              </button>
              <button
                onClick={handleSignOut}
                className="px-6 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Document Upload Reminder */}
        {!profile?.documents_complete && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-lg p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  className="w-12 h-12 mr-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Complete Your Verification</h2>
                  <p className="text-amber-100">
                    Upload all required documents to start accepting ride requests and earning money.
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push('/driver/verification')}
                className="px-8 py-4 bg-white text-orange-600 font-bold rounded-lg hover:bg-amber-50 transition-colors shadow-lg whitespace-nowrap"
              >
                Upload Now →
              </button>
            </div>
          </div>
        )}

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-green-900 font-medium">{success}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-900 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Stats - 4 Sections */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Driver Requests */}
          <div
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => setActiveTab('requests')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Ride Requests</div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
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
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{pendingCount}</div>
            <div className="text-xs text-gray-500 mt-1">Pending requests</div>
          </div>

          {/* Active Rides */}
          <div
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => setActiveTab('active')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Active Rides</div>
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{activeCount}</div>
            <div className="text-xs text-gray-500 mt-1">In progress</div>
          </div>

          {/* Total Revenue */}
          <div
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => setActiveTab('history')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Total Revenue</div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">₹{totalRevenue.toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-1">{completedRides.length} completed rides</div>
          </div>

          {/* Verification Status */}
          <div
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => setActiveTab('profile')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Verification</div>
              <div className={`w-10 h-10 bg-gradient-to-br ${
                profile?.profile_verified
                  ? 'from-green-500 to-emerald-600'
                  : 'from-amber-500 to-orange-600'
              } rounded-lg flex items-center justify-center`}>
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {profile?.profile_verified ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  )}
                </svg>
              </div>
            </div>
            <div
              className={`text-2xl font-bold ${
                profile?.profile_verified ? 'text-green-600' : 'text-amber-600'
              }`}
            >
              {profile?.profile_verified ? 'Verified' : 'Pending'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {profile?.documents_complete ? 'Documents complete' : 'Documents incomplete'}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-2 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-3 rounded-lg font-medium transition-colors relative ${
                activeTab === 'requests'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Requests
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-3 rounded-lg font-medium transition-colors relative ${
                activeTab === 'active'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Active
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              History
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <ProfileForm
              userId={user.id}
              initialData={profile}
              onSave={refreshProfile}
            />
            <DocumentStatus profile={profile} />
          </div>
        )}

        {activeTab === 'requests' && (
          <RideRequests
            rides={rides}
            onAccept={handleAccept}
            onReject={handleReject}
            processing={processing}
          />
        )}

        {activeTab === 'active' && (
          <AcceptedRides
            rides={rides}
            onComplete={handleComplete}
            onCancel={handleCancel}
            processing={processing}
          />
        )}

        {activeTab === 'history' && (
          <RideHistory rides={rides} />
        )}

        {/* Account Info */}
        <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Account Information
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600">Email</span>
              <span className="font-medium text-gray-900">{user.email}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600">Role</span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                Driver
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <span className="text-gray-600">Phone Number</span>
              <span className="font-medium text-gray-900">
                {profile?.phone || 'Not set'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Account Status</span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  profile?.documents_complete
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {profile?.documents_complete ? 'Verified' : 'Pending Verification'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
