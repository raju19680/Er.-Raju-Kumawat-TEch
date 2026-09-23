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
  MapPin,
  Building,
  Map,
  Hash,
  Lock,
  KeyRound
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetch, apiFetchJSON } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

interface ProfileData {
  id: string
  name: string
  email: string
  phone: string | null
  avatar: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  createdAt: string
}

export default function StudentProfile() {
  const { userName, userEmail, logout, orgName } = useAppStore()
  const [name, setName] = useState(userName)
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [stateName, setStateName] = useState('')
  const [pincode, setPincode] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [savingPersonal, setSavingPersonal] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
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
          setAddress(res.student.address || '')
          setCity(res.student.city || '')
          setStateName(res.student.state || '')
          setPincode(res.student.pincode || '')
          setAvatar(res.student.avatar || null)
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

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatar(event.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const getPayload = () => ({
    name: name.trim(),
    phone: phone.trim(),
    address: address.trim(),
    city: city.trim(),
    state: stateName.trim(),
    pincode: pincode.trim(),
    avatar: avatar,
  })

  const handleSavePersonal = async () => {
    if (!name.trim()) {
      toast.error('Name is required')
      return
    }
    setSavingPersonal(true)
    try {
      const res = await apiFetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getPayload()),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Personal information updated successfully')
      } else {
        toast.error(data.message || 'Failed to update personal info')
      }
    } catch {
      toast.error('Failed to save changes. Please try again.')
    } finally {
      setSavingPersonal(false)
    }
  }

  const handleSaveAddress = async () => {
    setSavingAddress(true)
    try {
      const res = await apiFetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getPayload()),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Address details updated successfully')
      } else {
        toast.error(data.message || 'Failed to update address')
      }
    } catch {
      toast.error('Failed to save changes. Please try again.')
    } finally {
      setSavingAddress(false)
    }
  }

  const handleSavePassword = async () => {
    if (!currentPassword) {
      toast.error('Current password is required')
      return
    }
    if (!newPassword) {
      toast.error('New password cannot be empty')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long')
      return
    }
    
    setSavingPassword(true)
    try {
      const payload: any = getPayload()
      payload.currentPassword = currentPassword
      payload.newPassword = newPassword
      
      const res = await apiFetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Password changed successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast.error(data.message || 'Failed to change password')
      }
    } catch {
      toast.error('Failed to save changes. Please try again.')
    } finally {
      setSavingPassword(false)
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
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
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
                  {avatar && <AvatarImage src={avatar} alt={name} className="object-cover" />}
                  <AvatarFallback className="text-xl font-bold bg-amber-50 text-amber-700">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-md hover:bg-amber-700 transition-colors cursor-pointer"
                >
                  <Camera className="size-3.5" />
                </label>
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
          </CardContent>
          <CardFooter className="bg-gray-50 px-5 py-3 sm:px-6 flex justify-end rounded-b-xl border-t">
            <Button onClick={handleSavePersonal} disabled={savingPersonal} className="bg-amber-600 hover:bg-amber-700 text-white">
              {savingPersonal ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Save Personal Info
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      {/* Address Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-0 shadow-sm py-0">
          <CardHeader>
            <CardTitle className="text-base">Address Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium text-gray-700">Street Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="pl-9"
                  placeholder="Your complete address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium text-gray-700">City</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="pl-9"
                    placeholder="City"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium text-gray-700">State</Label>
                <div className="relative">
                  <Map className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                  <Input
                    id="state"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="pl-9"
                    placeholder="State"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pincode" className="text-sm font-medium text-gray-700">Pincode</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  id="pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="pl-9 max-w-xs"
                  placeholder="e.g. 302001"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 px-5 py-3 sm:px-6 flex justify-end rounded-b-xl border-t">
            <Button onClick={handleSaveAddress} disabled={savingAddress} className="bg-amber-600 hover:bg-amber-700 text-white">
              {savingAddress ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Save Address Details
            </Button>
          </CardFooter>
        </Card>
      </motion.div>

      {/* Password Change Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-sm py-0">
          <CardHeader>
            <CardTitle className="text-base">Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">Current Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pl-9"
                  placeholder="Enter current password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-9"
                  placeholder="Enter new password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-9"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 px-5 py-3 sm:px-6 flex justify-end rounded-b-xl border-t">
            <Button onClick={handleSavePassword} disabled={savingPassword} className="bg-amber-600 hover:bg-amber-700 text-white">
              {savingPassword ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Change Password
            </Button>
          </CardFooter>
        </Card>
      </motion.div>



      {/* Account Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-0 shadow-sm py-0 mt-8">
          <CardHeader>
            <CardTitle className="text-base text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-500 mb-4">Sign out of your account on this device.</p>
            <Button
              variant="outline"
              className="w-full sm:w-auto text-red-600 border-red-200 hover:bg-red-50 gap-2"
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
