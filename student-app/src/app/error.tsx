'use client'

import { useEffect } from 'react'

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Student Portal Error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mb-6 rounded-full bg-red-50 p-6 dark:bg-red-900/10">
        <svg
          className="h-12 w-12 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="mb-3 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
        Oops! Something went wrong
      </h2>
      <p className="mb-8 max-w-lg text-lg text-gray-500 dark:text-gray-400">
        We're having trouble loading this page. Please try refreshing or check back later.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => window.history.back()}
          className="rounded-xl border border-gray-200 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          Go Back
        </button>
        <button
          onClick={() => reset()}
          className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
