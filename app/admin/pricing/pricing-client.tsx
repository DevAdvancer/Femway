'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { PricingSettings } from '@/lib/types/admin'
import { updatePricingSettings, getPricingSettings } from './actions'

interface PricingManagementClientProps {
  user: User
  initialSettings: PricingSettings | null
}

export default function PricingManagementClient({
  user,
  initialSettings,
}: PricingManagementClientProps) {
  const router = useRouter()
  const [settings, setSettings] = useState(initialSettings)
  const [petrolPrice, setPetrolPrice] = useState(initialSettings?.petrol_price_per_liter.toString() || '0')
  const [pricePerKm, setPricePerKm] = useState(initialSettings?.price_per_km.toString() || '0')
  const [driverCost, setDriverCost] = useState(initialSettings?.driver_cost_per_ride.toString() || '0')
  const [officeTimeMultiplier, setOfficeTimeMultiplier] = useState(
    initialSettings?.office_time_price_multiplier.toString() || '1'
  )
  const [officeHoursStart, setOfficeHoursStart] = useState(
    initialSettings?.office_hours_start?.substring(0, 5) || '09:00'
  )
  const [officeHoursEnd, setOfficeHoursEnd] = useState(
    initialSettings?.office_hours_end?.substring(0, 5) || '18:00'
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSave = async () => {
    setError(null)
    setSuccess(false)
    setSaving(true)

    try {
      const result = await updatePricingSettings(user.id, {
        petrol_price_per_liter: parseFloat(petrolPrice),
        price_per_km: parseFloat(pricePerKm),
        driver_cost_per_ride: parseFloat(driverCost),
        office_time_price_multiplier: parseFloat(officeTimeMultiplier),
        office_hours_start: officeHoursStart + ':00',
        office_hours_end: officeHoursEnd + ':00',
      })

      if (result.success) {
        setSuccess(true)
        // Refresh settings
        const updatedSettings = await getPricingSettings()
        setSettings(updatedSettings)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || 'Failed to update settings')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
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
          <h1 className="text-3xl font-bold text-gray-900">Pricing Management</h1>
          <p className="text-gray-600 mt-2">Configure ride pricing and cost settings</p>
          {settings?.updated_at && (
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {formatDate(settings.updated_at)}
            </p>
          )}
        </div>

        {/* Pricing Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Pricing Settings</h2>

          <div className="space-y-6">
            {/* Petrol Price */}
            <div>
              <label htmlFor="petrolPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Petrol Price (per liter)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">₹</span>
                <input
                  type="number"
                  id="petrolPrice"
                  value={petrolPrice}
                  onChange={(e) => setPetrolPrice(e.target.value)}
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Current fuel cost per liter</p>
            </div>

            {/* Price per KM */}
            <div>
              <label htmlFor="pricePerKm" className="block text-sm font-medium text-gray-700 mb-2">
                Price per Kilometer
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">₹</span>
                <input
                  type="number"
                  id="pricePerKm"
                  value={pricePerKm}
                  onChange={(e) => setPricePerKm(e.target.value)}
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Base rate charged per kilometer</p>
            </div>

            {/* Driver Cost */}
            <div>
              <label htmlFor="driverCost" className="block text-sm font-medium text-gray-700 mb-2">
                Driver Cost (per ride)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">₹</span>
                <input
                  type="number"
                  id="driverCost"
                  value={driverCost}
                  onChange={(e) => setDriverCost(e.target.value)}
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Fixed cost paid to driver per ride</p>
            </div>

            {/* Office Time Multiplier */}
            <div>
              <label
                htmlFor="officeTimeMultiplier"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Office Time Price Multiplier
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">×</span>
                <input
                  type="number"
                  id="officeTimeMultiplier"
                  value={officeTimeMultiplier}
                  onChange={(e) => setOfficeTimeMultiplier(e.target.value)}
                  step="0.1"
                  min="1"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Multiplier applied during office hours (e.g., 1.5 = 50% increase)
              </p>
            </div>

            {/* Office Hours Range */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Office Hours Range</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="officeHoursStart"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Start Time
                  </label>
                  <input
                    type="time"
                    id="officeHoursStart"
                    value={officeHoursStart}
                    onChange={(e) => setOfficeHoursStart(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                  <p className="mt-1 text-xs text-gray-500">Office hours start (24-hour format)</p>
                </div>
                <div>
                  <label
                    htmlFor="officeHoursEnd"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    End Time
                  </label>
                  <input
                    type="time"
                    id="officeHoursEnd"
                    value={officeHoursEnd}
                    onChange={(e) => setOfficeHoursEnd(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                  />
                  <p className="mt-1 text-xs text-gray-500">Office hours end (24-hour format)</p>
                </div>
              </div>
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Current Office Hours:</strong> {officeHoursStart} - {officeHoursEnd}
                  <br />
                  The price multiplier will be applied to rides booked during this time range.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 flex items-center p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mt-6 flex items-center p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm">Pricing settings updated successfully!</span>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-8 w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </span>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8">
          <div className="flex items-start">
            <svg
              className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Pricing Information</h3>
              <p className="text-sm text-blue-700 mb-2">
                These settings control the base pricing for all rides. The final ride cost is calculated
                using: (Distance × Price per KM) + Driver Cost + (Office Time Multiplier if applicable).
                Petrol price is used for reference and future calculations.
              </p>
              <p className="text-sm text-blue-700">
                <strong>Office Hours:</strong> The price multiplier is automatically applied to rides
                requested during the configured office hours range. This helps manage demand during peak times.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
