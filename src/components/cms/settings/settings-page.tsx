'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { Globe, Mail } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { MediaImage } from '@/components/ui/media-image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  User,
  ShieldBan,
  FolderOpen,
  Save,
  Upload,
  Pencil,
  Trash2,
  Plus,
  Unlock,
  Palette,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Check,
  X,
  Loader2,
  AlertCircle,
  Smartphone,
  MoreHorizontal,
  Copy,
  Key,
  QrCode,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/lib/store'
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────

interface BlockedStudent {
  id: string
  name: string
  email: string
  isActive: boolean
  createdAt: string
}

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  organizationId: string
  createdAt: string
  updatedAt: string
}

const ACCENT_COLORS = [
  { name: 'Emerald', value: '#10b981' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Slate', value: '#475569' },
]

// ─── Password Strength Helper ────────────────────────────────────────────

function getPasswordStrength(password: string) {
  const checks = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
  const passedCount = Object.values(checks).filter(Boolean).length
  let label = 'Very Weak'
  let color = 'bg-red-500'
  let textColor = 'text-red-600'
  if (passedCount === 5) { label = 'Strong'; color = 'bg-emerald-500'; textColor = 'text-emerald-600' }
  else if (passedCount >= 4) { label = 'Good'; color = 'bg-yellow-500'; textColor = 'text-yellow-600' }
  else if (passedCount >= 3) { label = 'Fair'; color = 'bg-orange-500'; textColor = 'text-orange-600' }
  else if (passedCount >= 2) { label = 'Weak'; color = 'bg-red-400'; textColor = 'text-red-500' }
  return { checks, passedCount, label, color, textColor }
}

// ─── Component ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const currentPage = useAppStore((s) => s.currentPage)
  const setCurrentPage = useAppStore((s) => s.setCurrentPage)
  const { orgName, userName, userEmail, orgCode, userRole } = useAppStore()
  const isAdmin = userRole === 'platform_admin' || userRole === 'admin'

  const defaultTab = useMemo(() => {
    if (currentPage === 'settings-blocked') return 'blocked'
    if (currentPage === 'settings-categories') return 'categories'
    if (currentPage === 'settings-security') return 'security'
    return 'profile'
  }, [currentPage])

  // ─── Profile state ──────────────────────────────────────────────────────
  const [profileAvatar, setProfileAvatar] = useState('')
  const [profileName, setProfileName] = useState(userName || '')
  const [profileEmail, setProfileEmail] = useState(userEmail || '')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileOrgName, setProfileOrgName] = useState(orgName || '')
  const [accentColor, setAccentColor] = useState('#10b981')
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)

  // ─── 2FA state ──────────────────────────────────────────────────────────
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)
  const [twoFactorSetupData, setTwoFactorSetupData] = useState<{ secret: string; otpauthUrl: string; backupCodes: string[] } | null>(null)
  const [twoFactorSetupStep, setTwoFactorSetupStep] = useState<'idle' | 'setup' | 'verify'>('idle')
  const [twoFactorVerifyCode, setTwoFactorVerifyCode] = useState('')

  // ─── Blocked users state ────────────────────────────────────────────────
  const [blockedUsers, setBlockedUsers] = useState<BlockedStudent[]>([])
  const [blockedLoading, setBlockedLoading] = useState(true)
  const [blockedError, setBlockedError] = useState<string | null>(null)
  const [unblockDialogOpen, setUnblockDialogOpen] = useState(false)
  const [userToUnblock, setUserToUnblock] = useState<BlockedStudent | null>(null)
  const [unblocking, setUnblocking] = useState(false)

  // ─── Categories state ───────────────────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [categoryDrawerOpen, setCategoryDrawerOpen] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [catName, setCatName] = useState('')
  const [catSlug, setCatSlug] = useState('')
  const [catIcon, setCatIcon] = useState('')
  const [categorySubmitting, setCategorySubmitting] = useState(false)
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

  // ─── Security / Change Password state ───────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})

  const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword])

  const isPasswordFormValid = useMemo(() => {
    return (
      currentPassword.length > 0 &&
      newPassword.length > 0 &&
      confirmPassword.length > 0 &&
      newPassword === confirmPassword &&
      passwordStrength.passedCount === 5
    )
  }, [currentPassword, newPassword, confirmPassword, passwordStrength.passedCount])

  // ─── Fetch Profile ──────────────────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    setProfileLoading(true)
    try {
      const res = await apiFetch('/api/auth/me')
      const data = await res.json()
      if (data.authenticated && data.user) {
        setProfileName(data.user.name || '')
        setProfileEmail(data.user.email || '')
        setProfilePhone(data.user.phone || '')
        setProfileAvatar(data.user.avatar || '')
        setTwoFactorEnabled(data.user.twoFactorEnabled || false)
        if (data.user.organizationId) {
          // Org name is already in the store
        }
      }
    } catch {
      // Silently fail — use store values as fallback
    } finally {
      setProfileLoading(false)
    }
  }, [])

  // ─── Fetch Blocked Users ────────────────────────────────────────────────

  const fetchBlockedUsers = useCallback(async () => {
    if (!orgCode) return
    setBlockedLoading(true)
    setBlockedError(null)
    try {
      const res = await apiFetch(`/api/students?status=inactive&limit=50&organizationId=${orgCode}`)
      const data = await res.json()
      if (data.items) {
        setBlockedUsers(data.items.filter((s: BlockedStudent) => !s.isActive))
      } else {
        setBlockedError(data.error || 'Failed to load blocked users')
      }
    } catch {
      setBlockedError('Network error. Please try again.')
    } finally {
      setBlockedLoading(false)
    }
  }, [orgCode])

  // ─── Fetch Categories ───────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    if (!orgCode) return
    setCategoriesLoading(true)
    setCategoriesError(null)
    try {
      const res = await apiFetch(`/api/categories?organizationId=${orgCode}`)
      const data = await res.json()
      if (data.items) {
        setCategories(data.items)
      } else {
        setCategoriesError(data.error || 'Failed to load categories')
      }
    } catch {
      setCategoriesError('Network error. Please try again.')
    } finally {
      setCategoriesLoading(false)
    }
  }, [orgCode])

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchProfile()
      fetchBlockedUsers()
      fetchCategories()
    }
    return () => { mounted = false }
  }, [fetchProfile, fetchBlockedUsers, fetchCategories])

  // ─── Profile handlers ──────────────────────────────────────────────────

  const handleSaveProfile = async () => {
    setProfileSaving(true)
    try {
      const res = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: profileName,
          phone: profilePhone,
          avatar: profileAvatar,
          orgName: profileOrgName,
          orgAccentColor: accentColor,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save profile')
      toast.success('Profile saved successfully')
      // Update store with new name if changed
      if (profileName !== userName) {
        useAppStore.getState().userName = profileName
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile')
    } finally {
      setProfileSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingLogo(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'x-auth-token': useAppStore.getState().apiToken
        },
        body: formData
      })
      const data = await res.json()
      
      if (res.ok && data.url) {
        setProfileAvatar(data.url)
        toast.success('Logo uploaded! Click Save to apply.')
      } else {
        throw new Error(data.error || 'Failed to upload image')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error uploading logo')
    } finally {
      setIsUploadingLogo(false)
      if (e.target) e.target.value = ''
    }
  }

  // ─── 2FA handlers ──────────────────────────────────────────────────────

  const handleToggle2FA = async () => {
    setTwoFactorLoading(true)
    try {
      if (twoFactorEnabled) {
        // Disable 2FA
        const res = await apiFetch('/api/auth/2fa/disable', { method: 'POST' })
        const data = await res.json()
        if (res.ok) {
          setTwoFactorEnabled(false)
          toast.success('Two-factor authentication disabled')
        } else {
          toast.error(data.error || 'Failed to disable 2FA')
        }
      } else {
        // Setup 2FA - get secret
        const res = await apiFetch('/api/auth/2fa/setup', { method: 'POST' })
        const data = await res.json()
        if (res.ok && data.secret) {
          setTwoFactorSetupData({
            secret: data.secret,
            otpauthUrl: data.otpauthUrl,
            backupCodes: data.backupCodes || [],
          })
          setTwoFactorSetupStep('setup')
          toast.info('Scan the QR code in your authenticator app, then enter the code below')
        } else {
          toast.error(data.error || 'Failed to setup 2FA')
        }
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleVerify2FA = async () => {
    if (!twoFactorVerifyCode.trim()) {
      toast.error('Please enter the verification code')
      return
    }
    setTwoFactorLoading(true)
    try {
      const res = await apiFetch('/api/auth/2fa/enable', {
        method: 'POST',
        body: JSON.stringify({ code: twoFactorVerifyCode, secret: twoFactorSetupData?.secret, backupCodes: twoFactorSetupData?.backupCodes }),
      })
      const data = await res.json()
      if (res.ok) {
        setTwoFactorEnabled(true)
        setTwoFactorSetupStep('idle')
        setTwoFactorSetupData(null)
        setTwoFactorVerifyCode('')
        toast.success('Two-factor authentication enabled successfully!')
      } else {
        toast.error(data.error || 'Invalid code. Please try again.')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setTwoFactorLoading(false)
    }
  }

  // ─── Unblock handler ──────────────────────────────────────────────────

  const handleUnblock = async () => {
    if (!userToUnblock) return
    setUnblocking(true)
    try {
      const res = await apiFetch(`/api/students/${userToUnblock.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: true, organizationId: orgCode }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`${userToUnblock.name} has been unblocked`)
        setBlockedUsers((prev) => prev.filter((u) => u.id !== userToUnblock.id))
      } else {
        toast.error(data.error || 'Failed to unblock user')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setUnblocking(false)
      setUnblockDialogOpen(false)
      setUserToUnblock(null)
    }
  }

  // ─── Category handlers ────────────────────────────────────────────────

  const openAddCategory = () => {
    setEditCategory(null)
    setCatName('')
    setCatSlug('')
    setCatIcon('')
    setCategoryDrawerOpen(true)
  }

  const openEditCategory = (cat: Category) => {
    setEditCategory(cat)
    setCatName(cat.name)
    setCatSlug(cat.slug)
    setCatIcon(cat.icon || '')
    setCategoryDrawerOpen(true)
  }

  const handleSaveCategory = async () => {
    if (!catName || !catSlug) {
      toast.error('Name and slug are required')
      return
    }
    setCategorySubmitting(true)
    try {
      if (editCategory) {
        const res = await apiFetch(`/api/categories/${editCategory.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: catName,
            slug: catSlug,
            icon: catIcon || null,
            organizationId: orgCode,
          }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          toast.success('Category updated')
          setCategoryDrawerOpen(false)
          fetchCategories()
        } else {
          toast.error(data.error || 'Failed to update category')
        }
      } else {
        const res = await apiFetch('/api/categories', {
          method: 'POST',
          body: JSON.stringify({
            name: catName,
            slug: catSlug,
            icon: catIcon || null,
            organizationId: orgCode,
          }),
        })
        const data = await res.json()
        if (res.ok) {
          toast.success('Category created')
          setCategoryDrawerOpen(false)
          fetchCategories()
        } else {
          toast.error(data.error || 'Failed to create category')
        }
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setCategorySubmitting(false)
    }
  }

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return
    setCategorySubmitting(true)
    try {
      const res = await apiFetch(`/api/categories/${categoryToDelete.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Category deleted')
        setDeleteCategoryDialogOpen(false)
        setCategoryToDelete(null)
        fetchCategories()
      } else {
        toast.error(data.error || 'Failed to delete category')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setCategorySubmitting(false)
    }
  }

  // ─── Change Password handler ──────────────────────────────────────────

  const handleChangePassword = async () => {
    const errors: Record<string, string> = {}
    if (!currentPassword) errors.currentPassword = 'Current password is required'
    if (!newPassword) errors.newPassword = 'New password is required'
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your new password'
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    if (newPassword && passwordStrength.passedCount < 5) {
      errors.newPassword = 'Password does not meet all requirements'
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors)
      return
    }

    setPasswordErrors({})
    setPasswordLoading(true)

    try {
      const res = await apiFetch('/api/teacher/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || data.message || 'Failed to change password')
        return
      }

      toast.success('Password changed successfully. Please sign in again with your new password.')

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowCurrentPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setPasswordLoading(false)
    }
  }

  // ─── Render helpers ────────────────────────────────────────────────────

  const renderError = (msg: string, onRetry: () => void) => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="size-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="size-5 text-red-500" />
      </div>
      <p className="text-sm font-medium text-gray-900">Something went wrong</p>
      <p className="text-xs text-muted-foreground mt-1">{msg}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
        Try Again
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your profile, security, blocked users, and categories
        </p>
      </div>

      <Tabs value={defaultTab} onValueChange={(v) => {
        const pageMap: Record<string, string> = { profile: 'settings-profile', security: 'settings-security', blocked: 'settings-blocked', categories: 'settings-categories' }
        if (pageMap[v]) setCurrentPage(pageMap[v] as any)
      }} className="space-y-6">
        <div className="w-full overflow-x-auto">
          <TabsList className="w-max min-w-full">
            <TabsTrigger value="profile" className="gap-1.5">
              <User className="size-3.5" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5">
              <Lock className="size-3.5" />
              Security
            </TabsTrigger>
            <TabsTrigger value="blocked" className="gap-1.5">
              <ShieldBan className="size-3.5" />
              Blocked Users
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1.5">
              <FolderOpen className="size-3.5" />
              Categories
            </TabsTrigger>
          
            {isAdmin && (
              <>
                <TabsTrigger value="platform" className="gap-1.5">
                  <Globe className="size-3.5" />
                  Platform Settings
                </TabsTrigger>
                <TabsTrigger value="smtp" className="gap-1.5">
                  <Mail className="size-3.5" />
                  SMTP & Email
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        {/* ─── Profile Tab ───────────────────────────────────────────── */}
        <TabsContent value="profile">
          <Card className="rounded-xl w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Edit Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {profileLoading ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <Skeleton className="size-16 rounded-full" />
                    <Skeleton className="h-8 w-28" />
                  </div>
                  <Skeleton className="h-px w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <>
                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label>Organization Logo</Label>
                    <div className="flex items-center gap-4">
                      <Avatar className="size-16">
                        {profileAvatar ? (
                          <MediaImage src={profileAvatar} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                          <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xl font-bold">
                            {profileOrgName ? profileOrgName.charAt(0) : 'L'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="relative">
                        <Input 
                          type="file" 
                          accept="image/*" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                          onChange={handleLogoUpload}
                          disabled={isUploadingLogo}
                        />
                        <Button variant="outline" size="sm" disabled={isUploadingLogo}>
                          {isUploadingLogo ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Upload className="size-4 mr-2" />}
                          Upload Logo
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Name</Label>
                    <Input
                      id="profile-name"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="profile-email">Email</Label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="profile-phone">Phone</Label>
                    <Input
                      id="profile-phone"
                      placeholder="+91 00000 00000"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                    />
                  </div>

                  {/* Organization Name */}
                  <div className="space-y-2">
                    <Label htmlFor="profile-org">Organization Name</Label>
                    <Input
                      id="profile-org"
                      value={profileOrgName}
                      onChange={(e) => setProfileOrgName(e.target.value)}
                    />
                  </div>

                  <Separator />

                  {/* Accent Color Picker */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-1.5">
                      <Palette className="size-4" />
                      Accent Color
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {ACCENT_COLORS.map((color) => (
                        <button
                          key={color.value}
                          className={`size-8 rounded-full border-2 transition-all ${
                            accentColor === color.value
                              ? 'border-gray-900 scale-110'
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setAccentColor(color.value)}
                          title={color.name}
                          aria-label={`Select ${color.name} accent color`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Selected: {ACCENT_COLORS.find((c) => c.value === accentColor)?.name}
                    </p>
                  </div>

                  <Separator />

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveProfile}
                      className="bg-black hover:bg-gray-800 text-white"
                      disabled={profileSaving}
                    >
                      {profileSaving ? (
                        <><Loader2 className="size-4 mr-2 animate-spin" />Saving...</>
                      ) : (
                        <><Save className="size-4 mr-2" />Save Changes</>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Security Tab ──────────────────────────────────────────── */}
        <TabsContent value="security" className="space-y-6">
          {/* 2FA Section */}
          <Card className="rounded-xl w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Smartphone className="size-5" />
                Two-Factor Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Idle state: 2FA not enabled */}
              {twoFactorSetupStep === 'idle' && !twoFactorEnabled && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">2FA is disabled</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleToggle2FA}
                      disabled={twoFactorLoading}
                      className="bg-black hover:bg-gray-800 text-white"
                    >
                      {twoFactorLoading ? (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                      ) : null}
                      Enable 2FA
                    </Button>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <Shield className="size-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Security Recommendation</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        We strongly recommend enabling 2FA to protect your account from unauthorized access.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Idle state: 2FA enabled */}
              {twoFactorSetupStep === 'idle' && twoFactorEnabled && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
                        <Check className="size-3 mr-1" /> Enabled
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Your account is protected with an authenticator app
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggle2FA}
                      disabled={twoFactorLoading}
                    >
                      {twoFactorLoading ? (
                        <Loader2 className="size-4 mr-2 animate-spin" />
                      ) : null}
                      Disable 2FA
                    </Button>
                  </div>
                </div>
              )}

              {/* Setup step: Show QR code, secret, and verify input */}
              {twoFactorSetupStep === 'setup' && twoFactorSetupData && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">
                      <QrCode className="size-3 mr-1" /> Setup in Progress
                    </Badge>
                  </div>

                  {/* QR Code */}
                  <div className="flex flex-col items-center gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50/50">
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      <QrCode className="size-4 text-amber-600" />
                      Scan with Authenticator App
                    </p>
                    <div className="p-3 bg-white rounded-lg border border-gray-200">
                      <QRCodeSVG value={twoFactorSetupData.otpauthUrl || twoFactorSetupData.secret} size={192} level="H" />
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Use Google Authenticator, Authy, or any TOTP-compatible app
                    </p>
                  </div>

                  {/* Secret Key */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Key className="size-4" /> Secret Key
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-gray-50 rounded-lg border border-gray-200 text-xs font-mono break-all">
                        {twoFactorSetupData.secret}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(twoFactorSetupData.secret)
                          toast.success('Secret key copied!')
                        }}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* OTP Auth URL */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <Key className="size-4 text-amber-600" /> Setup URL
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-gray-50 rounded-lg border border-gray-200 text-xs font-mono break-all max-h-20 overflow-y-auto">
                        {twoFactorSetupData.otpauthUrl}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(twoFactorSetupData.otpauthUrl)
                          toast.success('Setup URL copied!')
                        }}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Backup Codes */}
                  {twoFactorSetupData.backupCodes.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-amber-800 flex items-center gap-1.5">
                        <Shield className="size-4" /> Backup Codes
                      </p>
                      <p className="text-xs text-muted-foreground">Save these codes in a safe place. Each can only be used once.</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {twoFactorSetupData.backupCodes.map((code, i) => (
                          <code key={i} className="p-1.5 bg-amber-50 rounded border border-amber-200 text-xs font-mono text-center">
                            {code}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Verify Code Input */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Verify Setup</p>
                    <p className="text-xs text-muted-foreground">
                      Enter the 6-digit code from your authenticator app to complete setup.
                    </p>
                    <div className="flex items-center gap-3">
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        placeholder="000000"
                        value={twoFactorVerifyCode}
                        onChange={(e) => setTwoFactorVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-40 text-center text-lg font-mono tracking-widest h-12 rounded-xl"
                        disabled={twoFactorLoading}
                      />
                      <Button
                        onClick={handleVerify2FA}
                        disabled={twoFactorLoading || twoFactorVerifyCode.length !== 6}
                        className="bg-black hover:bg-gray-800 text-white"
                      >
                        {twoFactorLoading ? (
                          <Loader2 className="size-4 mr-2 animate-spin" />
                        ) : (
                          <Shield className="size-4 mr-2" />
                        )}
                        Verify &amp; Enable
                      </Button>
                    </div>
                  </div>

                  {/* Cancel */}
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setTwoFactorSetupStep('idle')
                      setTwoFactorSetupData(null)
                      setTwoFactorVerifyCode('')
                    }}
                    className="text-muted-foreground"
                  >
                    Cancel Setup
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card className="rounded-xl w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Shield className="size-5" />
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Enter your current password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value)
                      if (passwordErrors.currentPassword) {
                        setPasswordErrors((prev) => {
                          const next = { ...prev }
                          delete next.currentPassword
                          return next
                        })
                      }
                    }}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                  >
                    {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {passwordErrors.currentPassword && (
                  <p className="text-xs text-red-500">{passwordErrors.currentPassword}</p>
                )}
              </div>

              <Separator />

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      if (passwordErrors.newPassword) {
                        setPasswordErrors((prev) => {
                          const next = { ...prev }
                          delete next.newPassword
                          return next
                        })
                      }
                    }}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  >
                    {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {passwordErrors.newPassword && (
                  <p className="text-xs text-red-500">{passwordErrors.newPassword}</p>
                )}

                {/* Password Strength Indicator */}
                {newPassword.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.passedCount / 5) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium min-w-[70px] text-right ${passwordStrength.textColor}`}>
                        {passwordStrength.label}
                      </span>
                    </div>

                    {/* Requirements Checklist */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Password requirements:</p>
                      <ul className="space-y-1">
                        {[
                          { key: 'minLength' as const, label: 'At least 8 characters' },
                          { key: 'uppercase' as const, label: 'Uppercase letter' },
                          { key: 'lowercase' as const, label: 'Lowercase letter' },
                          { key: 'number' as const, label: 'Number' },
                          { key: 'special' as const, label: 'Special character' },
                        ].map(({ key, label }) => (
                          <li key={key} className="flex items-center gap-2 text-xs">
                            {passwordStrength.checks[key] ? (
                              <Check className="size-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <X className="size-3.5 text-gray-300 shrink-0" />
                            )}
                            <span className={passwordStrength.checks[key] ? 'text-emerald-600' : 'text-muted-foreground'}>
                              {label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (passwordErrors.confirmPassword) {
                        setPasswordErrors((prev) => {
                          const next = { ...prev }
                          delete next.confirmPassword
                          return next
                        })
                      }
                    }}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="text-xs text-red-500">{passwordErrors.confirmPassword}</p>
                )}
                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
                {confirmPassword.length > 0 && newPassword === confirmPassword && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <Check className="size-3" />
                    Passwords match
                  </p>
                )}
              </div>

              <Separator />

              {/* Security Notice */}
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <Shield className="size-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Security Notice</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    After changing your password, you&apos;ll need to sign in again with the new password.
                  </p>
                </div>
              </div>

              {/* Change Password Button */}
              <div className="flex justify-end">
                <Button
                  onClick={handleChangePassword}
                  disabled={!isPasswordFormValid || passwordLoading}
                  className="bg-black hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordLoading ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <Lock className="size-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Blocked Users Tab ──────────────────────────────────────── */}
        <TabsContent value="blocked">
          <Card className="rounded-xl">
            <CardContent className="p-0">
              {blockedLoading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-4 items-center">
                      <Skeleton className="size-7 rounded-full" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-7 w-20" />
                    </div>
                  ))}
                </div>
              ) : blockedError ? (
                renderError(blockedError, fetchBlockedUsers)
              ) : blockedUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <ShieldBan className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">No blocked users</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All users are in good standing
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Date Blocked</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blockedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="size-7">
                                <AvatarFallback className="bg-red-50 text-red-600 text-xs font-medium">
                                  {user.name.split(' ').map((n) => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium text-sm">{user.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(user.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => {
                                setUserToUnblock(user)
                                setUnblockDialogOpen(true)
                              }}
                            >
                              <Unlock className="size-3 mr-1" />
                              Unblock
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Categories Tab ─────────────────────────────────────────── */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={openAddCategory}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Plus className="size-4 mr-2" />
              Add Category
            </Button>
          </div>

          {categoriesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="rounded-xl">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-8" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : categoriesError ? (
            <Card className="rounded-xl">
              <CardContent className="p-0">{renderError(categoriesError, fetchCategories)}</CardContent>
            </Card>
          ) : categories.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="p-0">
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FolderOpen className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-gray-900">No categories yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Add your first course category</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <Card key={cat.id} className="rounded-xl">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat.icon || '📚'}</span>
                        <div>
                          <p className="font-semibold text-sm">{cat.name}</p>
                          <p className="text-xs text-muted-foreground">/{cat.slug}</p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditCategory(cat)}>
                            <Pencil className="size-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => {
                              setCategoryToDelete(cat)
                              setDeleteCategoryDialogOpen(true)
                            }}
                          >
                            <Trash2 className="size-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      

        {isAdmin && (
          <>
            {/* PLATFORM SETTINGS */}
            <TabsContent value="platform" className="space-y-6">
              <Card className="rounded-xl w-full max-w-2xl">
                <CardHeader>
                  <CardTitle>White-labeling & Global Toggles</CardTitle>
                  <CardDescription>Configure the platform branding and global features.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label>Organization Name</Label>
                    <Input placeholder="Er. Raju Kumawat Tech" />
                    <p className="text-xs text-slate-500 mt-1">Updates the name across the CMS and Student Portal.</p>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50/50">
                    <div>
                      <h4 className="font-medium text-sm text-slate-900">Maintenance Mode</h4>
                      <p className="text-xs text-slate-500">Lock out all non-admin users instantly.</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50/50">
                    <div>
                      <h4 className="font-medium text-sm text-slate-900">Disable Gamification</h4>
                      <p className="text-xs text-slate-500">Hide all streaks, points, and leaderboards globally.</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* SMTP SETTINGS */}
            <TabsContent value="smtp" className="space-y-6">
              <Card className="rounded-xl w-full max-w-2xl">
                <CardHeader>
                  <CardTitle>SMTP & Email Engine</CardTitle>
                  <CardDescription>Configure the outgoing mail server for welcome emails and receipts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>SMTP Host</Label>
                      <Input placeholder="smtp.gmail.com" />
                    </div>
                    <div className="space-y-1">
                      <Label>SMTP Port</Label>
                      <Input placeholder="587" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>SMTP Username</Label>
                    <Input placeholder="admin@example.com" />
                  </div>
                  <div className="space-y-1">
                    <Label>SMTP Password</Label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                  <Separator className="my-4" />
                  <Button className="w-full gap-2 bg-slate-900 hover:bg-slate-800" onClick={() => toast.success('SMTP Test Email Sent! (Mock)')}>
                    <Mail className="size-4" />
                    Test SMTP Connection
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}

      </Tabs>

      {/* ─── Unblock Confirmation Dialog ──────────────────────────────── */}
      <Dialog open={unblockDialogOpen} onOpenChange={setUnblockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unblock User</DialogTitle>
            <DialogDescription>
              Are you sure you want to unblock{' '}
              <span className="font-semibold text-foreground">{userToUnblock?.name}</span>? They will
              regain access to the platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnblockDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUnblock} disabled={unblocking}>
              {unblocking ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              Unblock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Add/Edit Category Drawer ─────────────────────────────────── */}
      <Sheet open={categoryDrawerOpen} onOpenChange={setCategoryDrawerOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editCategory ? 'Edit Category' : 'Add Category'}</SheetTitle>
            <SheetDescription>
              {editCategory ? 'Update category details' : 'Create a new course category'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Category Name</Label>
              <Input
                id="cat-name"
                placeholder="e.g., JEE Advanced"
                value={catName}
                onChange={(e) => {
                  setCatName(e.target.value)
                  if (!editCategory) {
                    setCatSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-slug">Slug</Label>
              <Input
                id="cat-slug"
                placeholder="e.g., jee-advanced"
                value={catSlug}
                onChange={(e) => setCatSlug(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                URL-friendly identifier. Auto-generated from name.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-icon">Icon / Emoji</Label>
              <Input
                id="cat-icon"
                placeholder="e.g., 🔬"
                value={catIcon}
                onChange={(e) => setCatIcon(e.target.value)}
                className="w-20"
              />
            </div>
          </div>

          <SheetFooter className="border-t pt-4">
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1" onClick={() => setCategoryDrawerOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-black hover:bg-gray-800 text-white"
                onClick={handleSaveCategory}
                disabled={categorySubmitting}
              >
                {categorySubmitting ? (
                  <><Loader2 className="size-4 mr-2 animate-spin" />{editCategory ? 'Saving...' : 'Creating...'}</>
                ) : (
                  editCategory ? 'Save Changes' : 'Add Category'
                )}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ─── Delete Category Dialog ───────────────────────────────────── */}
      <Dialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">{categoryToDelete?.name}</span>? This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCategory} disabled={categorySubmitting}>
              {categorySubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
