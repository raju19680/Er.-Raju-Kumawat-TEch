'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  User,
  Shield,
  Bell,
  Globe,
  Lock,
  Save,
  Mail,
  Phone,
  Key,
  Eye,
  EyeOff,
  Server,
  AlertCircle,
  Check,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import AdminTwoFactor from '@/components/admin/admin-two-factor'
import EmailLogViewer from '@/components/admin/email-log-viewer'

// ── Types ────────────────────────────────────────────────────────────────────
interface AdminProfile {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  createdAt: string
  lastLoginAt: string | null
  twoFactorEnabled: boolean
}

// ── Default platform settings (used when no DB records exist) ──
const DEFAULT_PLATFORM_SETTINGS = {
  emailNotifications: true,
  pushNotifications: true,
  maintenanceMode: false,
  autoBackup: true,
}

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  // Profile state
  const [profileLoading, setProfileLoading] = useState(true)
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)

  // Platform settings
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [autoBackup, setAutoBackup] = useState(true)

  // Store
  const userEmail = useAppStore((s) => s.userEmail)
  const userName = useAppStore((s) => s.userName)

  // ── Load profile + platform settings on mount ──
  const fetchProfile = useCallback(async () => {
    try {
      setProfileLoading(true)
      const res = await apiFetch('/api/admin/settings')
      const data = await res.json()
      if (data.success && data.profile) {
        setProfile(data.profile)
        // Split name into first/last
        const nameParts = (data.profile.name || '').split(' ')
        setFirstName(nameParts[0] || '')
        setLastName(nameParts.slice(1).join(' ') || '')
        setProfilePhone(data.profile.phone || '')
        setProfileEmail(data.profile.email || '')
      }
      // Load platform settings from API response
      if (data.success && data.platformSettings) {
        setEmailNotifications(data.platformSettings.emailNotifications ?? DEFAULT_PLATFORM_SETTINGS.emailNotifications)
        setPushNotifications(data.platformSettings.pushNotifications ?? DEFAULT_PLATFORM_SETTINGS.pushNotifications)
        setMaintenanceMode(data.platformSettings.maintenanceMode ?? DEFAULT_PLATFORM_SETTINGS.maintenanceMode)
        setAutoBackup(data.platformSettings.autoBackup ?? DEFAULT_PLATFORM_SETTINGS.autoBackup)
      }
    } catch {
      // Fallback to store values
      const nameParts = (userName || '').split(' ')
      setFirstName(nameParts[0] || '')
      setLastName(nameParts.slice(1).join(' ') || '')
      setProfileEmail(userEmail || '')
    } finally {
      setProfileLoading(false)
    }
  }, [userName, userEmail])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // ── Save platform settings to DB via API ──
  const updatePlatformSetting = async (key: string, value: boolean) => {
    const setters: Record<string, React.Dispatch<React.SetStateAction<boolean>>> = {
      emailNotifications: setEmailNotifications,
      pushNotifications: setPushNotifications,
      maintenanceMode: setMaintenanceMode,
      autoBackup: setAutoBackup,
    }
    if (setters[key]) setters[key](value)

    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformSettings: { [key]: value },
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Setting updated.')
      } else {
        // Revert on failure
        if (setters[key]) setters[key](!value)
        toast.error(data.message || 'Failed to update setting')
      }
    } catch {
      // Revert on failure
      if (setters[key]) setters[key](!value)
      toast.error('Something went wrong. Please try again.')
    }
  }

  // ── Save Profile ──
  const handleSaveProfile = async () => {
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
    if (!fullName) {
      toast.error('Name is required.')
      return
    }

    setProfileSaving(true)
    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          phone: profilePhone.trim() || '',
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Profile updated successfully!')
        fetchProfile()
      } else {
        toast.error(data.message || 'Failed to update profile')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setProfileSaving(false)
    }
  }

  // ── Change Password ──
  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error('Current password is required.')
      return
    }
    if (!newPassword) {
      toast.error('New password is required.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match.')
      return
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.')
      return
    }

    setPasswordSaving(true)
    try {
      const res = await apiFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Password changed successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast.error(data.message || 'Failed to change password')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setPasswordSaving(false)
    }
  }

  // ── Computed account info ──
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : '—'

  const lastLogin = profile?.lastLoginAt
    ? new Date(profile.lastLoginAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Today'

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your admin profile and platform configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile & Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Section */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="size-5 text-amber-600" />
                <CardTitle className="text-base font-semibold">Profile Information</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Update your personal details and contact information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileLoading ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="bg-gray-50/80 border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="bg-gray-50/80 border-gray-200"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1.5">
                      <Mail className="size-3.5" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileEmail}
                      disabled
                      className="bg-gray-100 border-gray-200 text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-1.5">
                      <Phone className="size-3.5" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="bg-gray-50/80 border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium">Role</Label>
                    <Input
                      id="role"
                      value="Platform Admin"
                      disabled
                      className="bg-gray-100 border-gray-200 text-muted-foreground"
                    />
                  </div>
                  <div className="pt-2">
                    <Button
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={handleSaveProfile}
                      disabled={profileSaving}
                    >
                      {profileSaving ? (
                        <span className="flex items-center gap-2">
                          <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        <>
                          <Save className="size-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Security Section */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="size-5 text-amber-600" />
                <CardTitle className="text-base font-semibold">Security</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Manage your password and security preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm font-medium flex items-center gap-1.5">
                  <Key className="size-3.5" />
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="bg-gray-50/80 border-gray-200 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700"
                  >
                    {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 8 chars)"
                    className="bg-gray-50/80 border-gray-200 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700"
                  >
                    {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="bg-gray-50/80 border-gray-200"
                />
              </div>
              <div className="pt-2">
                <Button
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={handleChangePassword}
                  disabled={passwordSaving}
                >
                  {passwordSaving ? (
                    <span className="flex items-center gap-2">
                      <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    <>
                      <Lock className="size-4 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication Section */}
          <AdminTwoFactor userEmail={userEmail} />

          {/* Email Log Viewer */}
          <EmailLogViewer />
        </div>

        {/* Right Column - Platform Settings */}
        <div className="space-y-6">
          {/* Platform Settings */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="size-5 text-amber-600" />
                <CardTitle className="text-base font-semibold">Platform Settings</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Configure platform-wide settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-9 rounded-lg bg-amber-50">
                    <Bell className="size-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Send email alerts</p>
                  </div>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={(v) => updatePlatformSetting('emailNotifications', v)}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-9 rounded-lg bg-sky-50">
                    <Bell className="size-4 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">Browser push alerts</p>
                  </div>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={(v) => updatePlatformSetting('pushNotifications', v)}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-9 rounded-lg bg-red-50">
                    <Server className="size-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Maintenance Mode</p>
                    <p className="text-xs text-muted-foreground">Disable public access</p>
                  </div>
                </div>
                <Switch
                  checked={maintenanceMode}
                  onCheckedChange={(v) => updatePlatformSetting('maintenanceMode', v)}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-9 rounded-lg bg-emerald-50">
                    <Server className="size-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Auto Backup</p>
                    <p className="text-xs text-muted-foreground">Daily database backups</p>
                  </div>
                </div>
                <Switch
                  checked={autoBackup}
                  onCheckedChange={(v) => updatePlatformSetting('autoBackup', v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Account Info Card */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Account Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profileLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Account Status</span>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Plan</span>
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">Super Admin</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Member Since</span>
                    <span className="text-sm font-medium text-gray-900">{memberSince}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Login</span>
                    <span className="text-sm font-medium text-gray-900">{lastLogin}</span>
                  </div>
                  {profile?.twoFactorEnabled !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">2FA</span>
                      <Badge className={profile.twoFactorEnabled ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0' : 'bg-gray-100 text-gray-600 hover:bg-gray-100 border-0'}>
                        {profile.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Platform</span>
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">v2.5.0</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
