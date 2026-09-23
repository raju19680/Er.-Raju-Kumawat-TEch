'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white"
    >
      <Printer className="size-4" />
      Print / Save as PDF
    </button>
  )
}
