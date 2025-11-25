'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import LoadingSpinner from './loading-spinner'

export default function RouteLoadingBar() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showOverlay, setShowOverlay] = useState(false)

  useEffect(() => {
    setLoading(true)
    setProgress(20)

    // Show overlay after 300ms if still loading (for slower navigations)
    const overlayTimer = setTimeout(() => {
      if (loading) setShowOverlay(true)
    }, 300)

    const timer1 = setTimeout(() => setProgress(40), 100)
    const timer2 = setTimeout(() => setProgress(60), 200)
    const timer3 = setTimeout(() => setProgress(80), 300)
    const timer4 = setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        setLoading(false)
        setShowOverlay(false)
        setProgress(0)
      }, 200)
    }, 500)

    return () => {
      clearTimeout(overlayTimer)
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [pathname])

  return (
    <>
      {/* Top Loading Bar */}
      {loading && (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent">
          <div
            className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 transition-all duration-300 ease-out shadow-lg"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-r from-transparent to-white/30 animate-pulse" />
          </div>
        </div>
      )}

      {/* Full Page Overlay for Slower Navigations */}
      {showOverlay && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[9998] flex items-center justify-center transition-opacity duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center">
            <LoadingSpinner size="lg" color="purple" />
            <p className="mt-4 text-gray-700 font-medium">Loading...</p>
          </div>
        </div>
      )}
    </>
  )
}
