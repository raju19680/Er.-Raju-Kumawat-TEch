'use client'

import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Admin Area Error:', error)
  }, [error])

  return (
    <div className="flex h-[80vh] flex-col items-center justify-center p-6 text-center">
      <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/20 mb-6">
        <svg
          className="h-11 w-11 text-red-600 dark:text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
        Something went wrong!
      </h2>
      <p className="mb-8 max-w-md text-gray-600 dark:text-gray-400">
        We encountered an error while trying to load this page. Please try again or contact support if the issue persists.
      </p>
      <button
        onClick={() => reset()}
        className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
      >
        Try Again
      </button>
    </div>
  )
}
