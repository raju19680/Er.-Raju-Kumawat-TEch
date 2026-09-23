import React from 'react'
import { Smartphone } from 'lucide-react'
import { PortalData } from './types'

const BLUE = '#2563EB'

export function Footer({ data }: { data: PortalData }) {
  const orgInitials = data.organization.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <footer className="bg-[#111827] text-gray-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center gap-6">
          {/* Org logo and name */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg text-white font-bold text-sm" style={{ backgroundColor: BLUE }}>
              {data.organization.logo ? (
                <img src={data.organization.logo} alt={data.organization.name} className="w-full h-full object-cover rounded-lg" />
              ) : orgInitials}
            </div>
            <span className="text-base font-bold text-white">{data.organization.name}</span>
          </div>

          {/* Legal links */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
            <span className="text-gray-700 hidden sm:inline">•</span>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
            <span className="text-gray-700 hidden sm:inline">•</span>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Refund Policy</a>
          </div>

          {/* Google Play badge placeholder */}
          <a href="#" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors">
            <Smartphone className="size-5 text-white" />
            <div className="flex flex-col leading-none">
              <span className="text-[9px] text-gray-400 uppercase tracking-wider">Get it on</span>
              <span className="text-sm font-semibold text-white">Google Play</span>
            </div>
          </a>

          {/* Copyright */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-4 border-t border-gray-800 w-full justify-center">
            <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} {data.organization.name}. All Rights Reserved.</p>
            <p className="text-gray-600 text-xs">Powered by <span style={{ color: BLUE }} className="font-medium">Er. Raju Kumawat Tech</span></p>
          </div>
        </div>
      </div>
    </footer>
  )
}
