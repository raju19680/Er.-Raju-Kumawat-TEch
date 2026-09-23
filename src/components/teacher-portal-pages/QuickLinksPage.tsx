'use client'

import React from 'react'
import { ExternalLink, Play, MessageCircle, BookOpen } from 'lucide-react'

const sampleLinks = [
  { id: '1', title: 'YouTube Channel', description: 'Watch free video lectures', url: '#', icon: <Play className="size-5 text-red-500" /> },
  { id: '2', title: 'Telegram Group', description: 'Join our study community', url: '#', icon: <MessageCircle className="size-5 text-blue-500" /> },
  { id: '3', title: 'WhatsApp Support', description: 'Get instant doubt resolution', url: '#', icon: <MessageCircle className="size-5 text-green-500" /> },
  { id: '4', title: 'Free Study Material', description: 'Access free PDFs & notes', url: '#', icon: <BookOpen className="size-5 text-orange-500" /> },
  { id: '5', title: 'Official Website', description: 'Visit our main website', url: '#', icon: <ExternalLink className="size-5 text-purple-500" /> },
  { id: '6', title: 'Instagram', description: 'Follow us for daily tips', url: '#', icon: <ExternalLink className="size-5 text-pink-500" /> },
]

export default function QuickLinksPage() {
  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Quick Links</h1>
          <p className="mt-2 text-gray-600">
            Important links and resources for your preparation journey
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sampleLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-gray-50 transition-colors group-hover:bg-blue-50">
                {link.icon}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                  {link.title}
                </h3>
                <p className="mt-0.5 text-sm text-gray-500">{link.description}</p>
              </div>
              <ExternalLink className="ml-auto size-4 shrink-0 text-gray-300 transition-colors group-hover:text-blue-400" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
