'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Phone,
  LogOut,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetch, apiFetchJSON } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

interface ProfileData {
  id: string
  name: string
  email: string
  phone: string | null
  avatar: string | null
  createdAt: string
}

export default function StudentProfile() {
  const { userName, userEmail, logout, orgName } = useAppStore()
  const [name, setName] = useState(userName)
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load profile data from API
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await apiFetchJSON<{ success: boolean; student: ProfileData }>('/api/student/profile')
        if (res.success && res.student) {
          setName(res.student.name)
          setPhone(res.student.phone || '')
        }
      } catch (err) {
        console.error('Profile load error:', err)
        setError('Failed to load profile data')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    // Re-trigger load
    window.location.reload()
  }

  const initials = userName
    ? userName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'ST'

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }

    setSaving(true)
    setSaved(false)
    try {
      const res = await apiFetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setSaved(true)
        toast.success('Profile updated successfully')
        setTimeout(() => setSaved(false), 3000)
      } else {
        toast.error(data.message || 'Failed to update profile')
      }
    } catch {
      toast.error('Failed to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div>
          <Skeleton className="h-8 w-40 mb-1" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card className="border-0 shadow-sm py-0">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="size-16 sm:size-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm py-0">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-4">
            <AlertCircle className="size-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Failed to Load Profile</h2>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <Button variant="outline" className="gap-2" onClick={handleRetry}>
            <RotateCcw className="size-4" /> Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-0 shadow-sm py-0">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="size-16 sm:size-20">
                  <AvatarFallback className="text-xl font-bold bg-amber-50 text-amber-700">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-md hover:bg-amber-700 transition-colors">
                  <Camera className="size-3.5" />
                </button>
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{userName}</h2>
                <p className="text-sm text-gray-500">{userEmail}</p>
                <Badge variant="secondary" className="mt-1 bg-amber-50 text-amber-700 text-xs">Student</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Profile Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-sm py-0">
          <CardHeader>
            <CardTitle className="text-base">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9"
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  id="email"
                  value={userEmail}
                  className="pl-9 bg-gray-50"
                  disabled
                />
              </div>
              <p className="text-xs text-gray-400">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-9"
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="size-4" />
              ) : null}
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-sm py-0">
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Organization</span>
              <span className="font-medium text-gray-900">{orgName}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Role</span>
              <Badge variant="secondary" className="bg-amber-50 text-amber-700">Student</Badge>
            </div>
            <Separator />
            <Button
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 gap-2"
              onClick={logout}
            >
              <LogOut className="size-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
