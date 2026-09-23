'use client'

import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Shield, FileText, RotateCcw } from 'lucide-react'

interface StudentFooterProps {
  teacherName: string
  teacherInstitution?: string
  teacherLogo?: string
}

export default function StudentFooter({
  teacherName,
  teacherInstitution = 'Education Institution',
  teacherLogo,
}: StudentFooterProps) {
  const currentYear = new Date().getFullYear()

  const legalLinks = [
    { label: 'Terms & Conditions', icon: <FileText className="size-3.5" /> },
    { label: 'Privacy Policy', icon: <Shield className="size-3.5" /> },
    { label: 'Refunds & Cancellation Policy', icon: <RotateCcw className="size-3.5" /> },
  ]

  return (
    <footer className="bg-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Left Column: Teacher Info */}
          <div className="flex flex-col items-center sm:items-start">
            <div className="flex items-center gap-3">
              <Avatar className="size-14 border-2 border-blue-400">
                {teacherLogo ? (
                  <AvatarImage src={teacherLogo} alt={teacherName} />
                ) : null}
                <AvatarFallback className="bg-blue-600 text-sm font-bold text-white">
                  {teacherName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-bold tracking-wide">
                  {teacherName.toUpperCase()}
                </h3>
                <p className="text-sm text-slate-300">
                  {teacherInstitution.toUpperCase()}
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-center text-sm leading-relaxed text-slate-400 sm:text-left">
              Empowering students with quality education and comprehensive exam
              preparation resources. Your success is our mission.
            </p>
          </div>

          {/* Center Column: Legal Links */}
          <div className="flex flex-col items-center sm:items-start">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-200">
              Legal
            </h4>
            <ul className="flex flex-col gap-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <button className="group flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white">
                    <span className="transition-transform group-hover:translate-x-0.5">
                      {link.icon}
                    </span>
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Download App */}
          <div className="flex flex-col items-center sm:items-start">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-200">
              Download App
            </h4>
            <p className="mb-4 text-sm text-slate-400">
              Get the best learning experience on our mobile app.
            </p>
            {/* Google Play Store Badge */}
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-3 transition-all hover:bg-slate-100 hover:shadow-md"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92z"
                  fill="#4285F4"
                />
                <path
                  d="M17.092 8.65l-3.3 3.35 3.3 3.35 3.724-2.086a1 1 0 000-1.738L17.092 8.65z"
                  fill="#FBBC04"
                />
                <path
                  d="M3.609 1.814L13.792 12l3.3-3.35L4.71 1.188a1.006 1.006 0 00-1.101.626z"
                  fill="#EA4335"
                />
                <path
                  d="M3.609 22.186L17.092 15.35 13.792 12 3.61 22.186z"
                  fill="#34A853"
                />
              </svg>
              <div className="flex flex-col">
                <span className="text-xs font-medium leading-tight text-gray-600">
                  GET IT ON
                </span>
                <span className="text-sm font-semibold leading-tight text-gray-900">
                  Google Play
                </span>
              </div>
            </a>
          </div>
        </div>

        <Separator className="my-8 bg-slate-700" />

        {/* Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-slate-500">
            &copy; {currentYear} {teacherName}. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">
            Powered by{' '}
            <span className="font-medium text-slate-400">APPX Education Platform</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
