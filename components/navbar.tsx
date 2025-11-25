'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <Image
                src="/FEMWAY.png"
                alt="Femway Logo"
                width={110}
                height={110}
                className="object-contain"
              />
              <span className="text-xl font-bold text-gray-900">
                Femway
              </span>
            </Link>
          </div>

          {/* Static Navigation Items */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`text-gray-600 hover:text-gray-900 transition-colors ${
                pathname === '/' ? 'text-purple-600 font-semibold' : ''
              }`}
            >
              Home
            </Link>
            <Link
              href="/#about"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              About
            </Link>
            <Link
              href="/#services"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Services
            </Link>
          </div>

          {/* Mobile menu button - placeholder for future enhancement */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-600 hover:text-gray-900 focus:outline-none"
              aria-label="Menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
