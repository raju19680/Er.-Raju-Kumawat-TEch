'use client'

import React from 'react'
import { User, Mail, Phone, BookOpen, FileText, Award, Settings, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function ProfilePage() {
  const stats = [
    { icon: <BookOpen className="size-4 text-blue-600" />, label: 'Courses Enrolled', value: '3' },
    { icon: <FileText className="size-4 text-green-600" />, label: 'Tests Taken', value: '12' },
    { icon: <Award className="size-4 text-yellow-600" />, label: 'Certificates', value: '1' },
  ]

  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
            <Avatar className="size-20 border-2 border-blue-600">
              <AvatarFallback className="bg-blue-600 text-xl font-bold text-white">
                E
              </AvatarFallback>
            </Avatar>
            <div className="mt-4 sm:ml-5 sm:mt-0">
              <h1 className="text-xl font-bold text-gray-900">Student User</h1>
              <p className="mt-0.5 text-sm text-gray-500">student@example.com</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-700">
                  <span className="size-1.5 rounded-full bg-green-500" />
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg bg-gray-50 p-3 text-center"
              >
                <div className="flex justify-center">{stat.icon}</div>
                <p className="mt-1 text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Profile Details */}
        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-semibold text-gray-900">Profile Details</h2>
          <div className="space-y-3">
            {[
              { icon: <User className="size-4 text-gray-400" />, label: 'Full Name', value: 'Student User' },
              { icon: <Mail className="size-4 text-gray-400" />, label: 'Email', value: 'student@example.com' },
              { icon: <Phone className="size-4 text-gray-400" />, label: 'Phone', value: 'Not provided' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="text-sm text-gray-500">{item.label}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 space-y-2">
          <button className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
            <Settings className="size-4" />
            Account Settings
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50">
            <LogOut className="size-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
