'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { DriverProfile, DocumentType } from '@/lib/types/driver'
import { getDriverProfile } from '../actions'
import DocumentUpload from '@/components/driver/document-upload'
import DocumentPreview from '@/components/driver/document-preview'
import DocumentStatus from '@/components/driver/document-status'
import ProfileForm from '@/components/driver/profile-form'
import LoadingSpinner from '@/components/loading-spinner'

interface DriverVerificationClientProps {
  user: User
  profile: DriverProfile | null
}

export default function DriverVerificationClient({
  user,
  profile: initialProfile,
}: DriverVerificationClientProps) {
  const router = useRouter()
  const [profile, setProfile] = useState<DriverProfile | null>(initialProfile)
  const [requesting, setRequesting] = useState(false)
  const [requestSuccess, setRequestSuccess] = useState(false)

  const refreshProfile = async () => {
    const updatedProfile = await getDriverProfile(user.id)
    setProfile(updatedProfile)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleRequestVerification = async () => {
    if (!profile?.documents_complete) {
      alert('Please upload all required documents before requesting verification.')
      return
    }

    setRequesting(true)

    // Simulate request - in future this will create a verification request
    setTimeout(() => {
      setRequesting(false)
      setRequestSuccess(true)
      setTimeout(() => setRequestSuccess(false), 5000)
    }, 1500)
  }

  const documents: DocumentType[] = [
    'government_id',
    'selfie',
    'driving_license',
    'car_rc',
    'number_plate',
    'car_photos',
  ]

  const getDocumentUrl = (docType: DocumentType): string | null => {
    if (!profile) return null
    if (docType === 'car_photos') {
      return profile.car_photos_urls?.[0] || null
    }
    const urlField = `${docType}_url` as keyof DriverProfile
    return (profile[urlField] as string) || null
  }

  const getDocumentUploadedAt = (docType: DocumentType): string | null => {
    if (!profile) return null
    const timestampField = `${docType}_uploaded_at` as keyof DriverProfile
    return (profile[timestampField] as string) || null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <button
                onClick={() => router.push('/driver')}
                className="flex items-center text-indigo-600 hover:text-indigo-700 mb-4"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back to Dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900">
    Document Verification
              </h1>
              <p className="text-gray-600 mt-2">
                Upload and manage your verification documents
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-6 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Request Verification Button */}
        {profile?.documents_complete && !profile?.profile_verified && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 mb-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Ready for Verification!</h2>
                <p className="text-indigo-100">
                  All documents uploaded. Request admin verification to activate your account.
                </p>
              </div>
              <button
                onClick={handleRequestVerification}
                disabled={requesting}
                className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2"
              >
                {requesting ? (
                  <>
                    <LoadingSpinner size="sm" color="purple" />
                    <span>Requesting...</span>
                  </>
                ) : (
                  'Request Verification'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {requestSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center">
              <svg
                className="w-6 h-6 text-green-600 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Verification Request Submitted!
                </h3>
                <p className="text-green-700 mt-1">
                  Your request has been sent to the admin. You'll be notified once your documents are reviewed.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Already Verified Message */}
        {profile?.profile_verified && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="flex items-center">
              <svg
                className="w-8 h-8 text-green-600 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h3 className="text-xl font-bold text-green-900">
                  Account Verified! ✓
                </h3>
                <p className="text-green-700 mt-1">
                  Your documents have been verified by the admin. You can now start accepting ride requests.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile & Status */}
          <div className="space-y-8">
            <ProfileForm
              userId={user.id}
              initialData={profile}
              onSave={refreshProfile}
            />
            <DocumentStatus profile={profile} />
          </div>

          {/* Right Column - Document Management */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Required Documents
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {documents.map((docType) => {
                  const documentUrl = getDocumentUrl(docType)
                  const uploadedAt = getDocumentUploadedAt(docType)

                  return (
                    <div key={docType} className="space-y-4">
                      {documentUrl ? (
                        <DocumentPreview
                          documentUrl={documentUrl}
                          documentType={docType}
                          uploadedAt={uploadedAt}
                        />
                      ) : (
                        <div>
                          <h3 className="text-sm font-medium text-gray-700 mb-3">
                            {docType === 'government_id' && 'Government ID'}
                            {docType === 'selfie' && 'Selfie'}
                            {docType === 'driving_license' && 'Driving License'}
                            {docType === 'car_rc' && 'Car RC'}
                            {docType === 'number_plate' && 'Number Plate Photo'}
                            {docType === 'car_photos' && 'Car Photos'}
                          </h3>
                          <DocumentUpload
                            userId={user.id}
                            documentType={docType}
                            currentUrl={documentUrl}
                            onUploadComplete={refreshProfile}
                            allowMultiple={docType === 'car_photos'}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Verification Instructions
          </h2>
          <div className="space-y-4 text-gray-700">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mr-3">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Upload All Documents</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Upload clear photos or PDFs of all 6 required documents (Government ID, Selfie, Driving License, Car RC, Number Plate, Car Photos).
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mr-3">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Complete Your Profile</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Make sure your phone number is added and all information is correct.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mr-3">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Request Verification</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Once all documents are uploaded, click the "Request Verification" button to submit your documents for admin review.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mr-3">
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Wait for Approval</h3>
                <p className="text-sm text-gray-600 mt-1">
                  The admin will review your documents and verify your account. You'll be notified once approved.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
