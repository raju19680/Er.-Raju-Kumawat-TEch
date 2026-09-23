'use client'

import React from 'react'

export default function StudentLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-7xl mx-auto animate-pulse">
      {/* Welcome Section Skeleton */}
      <div className="mb-6">
        <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-md mb-2"></div>
        <div className="h-5 w-48 bg-gray-200 dark:bg-gray-800 rounded-md"></div>
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
            {/* Thumbnail */}
            <div className="h-40 w-full bg-gray-200 dark:bg-gray-700"></div>
            
            {/* Content */}
            <div className="p-5 flex flex-col gap-3">
              <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
