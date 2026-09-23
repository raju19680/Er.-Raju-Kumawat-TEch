'use client'

import React from 'react'

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6 p-6 w-full animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded-md"></div>
        <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded-md"></div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded-md mb-4"></div>
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-900/20 rounded-xl p-6 border border-gray-200 dark:border-gray-800 min-h-[400px]">
        <div className="h-6 w-64 bg-gray-200 dark:bg-gray-800 rounded-md mb-6"></div>
        
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800/30 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                  <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                </div>
              </div>
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
