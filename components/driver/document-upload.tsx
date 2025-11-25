'use client'

import { useState, useRef } from 'react'
import { uploadDocument } from '@/app/driver/actions'
import type { DocumentType } from '@/lib/types/driver'
import { MAX_FILE_SIZE, ALLOWED_FILE_EXTENSIONS, DOCUMENT_LABELS } from '@/lib/types/driver'
import LoadingSpinner from '@/components/loading-spinner'

interface DocumentUploadProps {
  userId: string
  documentType: DocumentType
  currentUrl?: string | null
  onUploadComplete: () => void
  allowMultiple?: boolean
}

export default function DocumentUpload({
  userId,
  documentType,
  currentUrl,
  onUploadComplete,
  allowMultiple = false,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    setError(null)

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 10MB')
      return
    }

    // Validate file type
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_FILE_EXTENSIONS.includes(fileExt)) {
      setError('Please upload a JPEG, PNG, or PDF file')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await uploadDocument(userId, documentType, formData)

      if (result.success) {
        onUploadComplete()
      } else {
        setError(result.error || 'Upload failed')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={ALLOWED_FILE_EXTENSIONS.join(',')}
        onChange={handleChange}
        multiple={allowMultiple}
      />

      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className="mt-4">
            <button
              type="button"
              onClick={handleButtonClick}
              disabled={uploading}
              className="text-indigo-600 hover:text-indigo-500 font-medium"
            >
              {uploading ? 'Uploading...' : currentUrl ? 'Replace file' : 'Upload a file'}
            </button>
            <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            PNG, JPG, PDF up to 10MB
          </p>
        </div>

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
            <div className="flex flex-col items-center">
              <LoadingSpinner size="lg" color="purple" />
              <p className="mt-3 text-sm text-gray-600 font-medium">Uploading...</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600 flex items-center">
          <svg
            className="h-4 w-4 mr-1"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </div>
      )}
    </div>
  )
}
