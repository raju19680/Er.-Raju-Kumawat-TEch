'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  User,
  Mail,
  Lock,
  Shield,
  Smartphone,
  Eye,
  EyeOff,
  Key,
  CheckCircle,
  AlertCircle,
  Bell,
  Globe,
  Camera,
  Save,
  Plus,
  Pencil,
  Trash2,
  Tag,
  MoreHorizontal,
  Phone,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'

// Category interface
interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  createdAt: string
}

export default function SettingsPage() {
  const { userName, userEmail } = useAppStore()
  const [activeTab, setActiveTab] = useState('profile')

  // ─── Profile State ──────────────────────────────────────────
  const [profileName, setProfileName] = useState(userName || '')
  const [profileEmail, setProfileEmail] = useState(userEmail || '')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileAvatar, setProfileAvatar] = useState('')
  const [profileAvatarUploading, setProfileAvatarUploading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)

  const fetchProfile = useCallback(async () => {
    if (profileLoaded || !userEmail) return
    try {
      const res = await apiFetch(`/api/teacher/profile?email=${encodeURIComponent(userEmail)}`)
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setProfileName(data.user.name || '')
          setProfileEmail(data.user.email || '')
          setProfilePhone(data.user.phone || '')
          setProfileAvatar(data.user.avatar || '')
          setProfileLoaded(true)
        }
      }
    } catch {
      // silently fail, use store values
    }
  }, [userEmail, profileLoaded])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      toast.error('Name is required')
      return
    }
    setProfileSaving(true)
    try {
      const res = await apiFetch('/api/teacher/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          name: profileName,
          phone: profilePhone,
          avatar: profileAvatar,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Profile updated successfully')
      } else {
        toast.error(data.error || 'Failed to update profile')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setProfileSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setProfileAvatarUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'avatars')

    try {
      const res = await apiFetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setProfileAvatar(data.url)
        toast.success('Avatar uploaded successfully. Click Save Changes to apply.')
      } else {
        toast.error(data.message || 'Failed to upload avatar')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setProfileAvatarUploading(false)
    }
  }

  // ─── Security State ─────────────────────────────────────────
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [changing, setChanging] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirm password do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    setChanging(true)
    try {
      const res = await apiFetch('/api/teacher/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast.success('Password changed successfully!')
        setChangePasswordOpen(false)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        toast.error(data.message || 'Failed to change password')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setChanging(false)
    }
  }

  const passwordStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: '', color: '' }
    let score = 0
    if (pwd.length >= 8) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++

    if (score <= 1) return { score, label: 'Weak', color: 'text-red-500' }
    if (score === 2) return { score, label: 'Fair', color: 'text-amber-500' }
    if (score === 3) return { score, label: 'Good', color: 'text-emerald-500' }
    return { score, label: 'Strong', color: 'text-emerald-600' }
  }

  const strength = passwordStrength(newPassword)

  // ─── Notifications State ────────────────────────────────────
  const [notifications, setNotifications] = useState({
    testResults: true,
    studentActivity: true,
    newSignups: false,
    orderNotifications: true,
    systemUpdates: false,
    weeklyReport: true,
  })

  const handleToggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
    toast.success(`${key.replace(/([A-Z])/g, ' $1').trim()} notifications ${!notifications[key] ? 'enabled' : 'disabled'}`)
  }

  // ─── Categories State ───────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [categorySlug, setCategorySlug] = useState('')
  const [categoryIcon, setCategoryIcon] = useState('')
  const [categorySaving, setCategorySaving] = useState(false)
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false)
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<Category | null>(null)

  const fetchCategories = useCallback(async () => {
    setCategoriesLoading(true)
    try {
      const res = await apiFetch('/api/teacher/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.items || [])
      }
    } catch {
      toast.error('Failed to load categories')
    } finally {
      setCategoriesLoading(false)
    }
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const openCreateCategory = () => {
    setEditingCategory(null)
    setCategoryName('')
    setCategorySlug('')
    setCategoryIcon('')
    setCategoryDialogOpen(true)
  }

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat)
    setCategoryName(cat.name)
    setCategorySlug(cat.slug)
    setCategoryIcon(cat.icon || '')
    setCategoryDialogOpen(true)
  }

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      toast.error('Category name is required')
      return
    }

    setCategorySaving(true)
    try {
      if (editingCategory) {
        // Update
        const res = await apiFetch('/api/teacher/categories', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingCategory.id,
            name: categoryName,
            slug: categorySlug || undefined,
            icon: categoryIcon || undefined,
          }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          toast.success('Category updated successfully')
          setCategoryDialogOpen(false)
          fetchCategories()
        } else {
          toast.error(data.error || 'Failed to update category')
        }
      } else {
        // Create
        const res = await apiFetch('/api/teacher/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: categoryName,
            slug: categorySlug || undefined,
            icon: categoryIcon || undefined,
          }),
        })
        const data = await res.json()
        if (res.ok && data.success) {
          toast.success('Category created successfully')
          setCategoryDialogOpen(false)
          fetchCategories()
        } else {
          toast.error(data.error || 'Failed to create category')
        }
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setCategorySaving(false)
    }
  }

  const handleDeleteCategory = async () => {
    if (!deleteCategoryTarget) return
    try {
      const res = await apiFetch(`/api/teacher/categories?id=${deleteCategoryTarget.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Category deleted successfully')
        setDeleteCategoryDialogOpen(false)
        setDeleteCategoryTarget(null)
        fetchCategories()
      } else {
        toast.error(data.error || 'Failed to delete category')
      }
    } catch {
      toast.error('Something went wrong')
    }
  }

  // Auto-generate slug from name
  const handleCategoryNameChange = (name: string) => {
    setCategoryName(name)
    if (!editingCategory) {
      setCategorySlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="profile" className="gap-2">
            <User className="size-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="size-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="size-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Tag className="size-4" />
            Categories
          </TabsTrigger>
        </TabsList>

        {/* ─── PROFILE TAB ─────────────────────────────────── */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card className="rounded-xl bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="size-5 text-amber-500" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal information and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  {profileAvatar ? (
                    <img src={profileAvatar} alt={profileName} className="size-20 rounded-full object-cover" />
                  ) : (
                    <div className="flex size-20 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-2xl shrink-0">
                      {profileName.charAt(0).toUpperCase() || 'T'}
                    </div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="size-5 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={profileAvatarUploading} />
                  </label>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{profileName || 'Teacher'}</h3>
                  <p className="text-sm text-muted-foreground">{profileEmail || 'teacher@teachx.in'}</p>
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200 mt-1">Teacher</Badge>
                </div>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile-name" className="text-sm font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="profile-name"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="pl-9"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email" className="text-sm font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="profile-email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="pl-9"
                      placeholder="Enter your email"
                      type="email"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Contact your admin to change your email</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-phone" className="text-sm font-medium">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                      id="profile-phone"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="pl-9"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                >
                  <Save className="size-4" />
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── SECURITY TAB ────────────────────────────────── */}
        <TabsContent value="security" className="space-y-6 mt-6">
          <Card className="rounded-xl bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Shield className="size-5 text-amber-500" />
                Security Settings
              </CardTitle>
              <CardDescription>Manage your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Change Password */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-amber-50">
                    <Key className="size-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Password</p>
                    <p className="text-xs text-muted-foreground">Change your account password</p>
                  </div>
                </div>
                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={() => setChangePasswordOpen(true)}
                >
                  <Lock className="mr-2 h-4 w-4" />
                  Change Password
                </Button>
              </div>

              {/* Two-Factor Auth */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-emerald-50">
                    <Smartphone className="size-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={(checked) => {
                      setTwoFactorEnabled(checked)
                      toast.success(`Two-factor authentication ${checked ? 'enabled' : 'disabled'}`)
                    }}
                  />
                  <Badge className={twoFactorEnabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                  }>
                    {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>

              {/* Session Info */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-sky-50">
                    <Globe className="size-5 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Active Sessions</p>
                    <p className="text-xs text-muted-foreground">Manage your active login sessions</p>
                  </div>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">1 Active</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Change Password Dialog */}
          <Dialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>
                  Enter your current password and choose a new secure password.
                </DialogDescription>
              </DialogHeader>
              <form
                id="change-password-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleChangePassword()
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <div className="relative">
                    <Input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 w-6 rounded-full ${
                              strength.score >= level
                                ? level <= 1 ? 'bg-red-400'
                                  : level <= 2 ? 'bg-amber-400'
                                  : 'bg-emerald-400'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-xs font-medium ${strength.color}`}>{strength.label}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      Passwords do not match
                    </p>
                  )}
                  {confirmPassword && newPassword === confirmPassword && newPassword.length > 0 && (
                    <p className="text-xs text-emerald-500 flex items-center gap-1">
                      <CheckCircle className="size-3" />
                      Passwords match
                    </p>
                  )}
                </div>
              </form>
              <DialogFooter>
                <Button variant="outline" onClick={() => setChangePasswordOpen(false)} disabled={changing} type="button">
                  Cancel
                </Button>
                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={handleChangePassword}
                  disabled={changing || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  type="submit"
                  form="change-password-form"
                >
                  {changing ? 'Changing...' : 'Change Password'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ─── NOTIFICATIONS TAB ──────────────────────────── */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card className="rounded-xl bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="size-5 text-amber-500" />
                Email Notification Preferences
              </CardTitle>
              <CardDescription>Choose which email notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                {
                  key: 'testResults' as const,
                  title: 'Test Results',
                  description: 'Get notified when students complete tests and view their scores',
                  icon: CheckCircle,
                  accentBg: 'bg-amber-50',
                  accentIcon: 'text-amber-600',
                },
                {
                  key: 'studentActivity' as const,
                  title: 'Student Activity',
                  description: 'Receive updates about student engagement and progress',
                  icon: User,
                  accentBg: 'bg-emerald-50',
                  accentIcon: 'text-emerald-600',
                },
                {
                  key: 'newSignups' as const,
                  title: 'New Signups',
                  description: 'Get notified when a new student registers on your platform',
                  icon: User,
                  accentBg: 'bg-sky-50',
                  accentIcon: 'text-sky-600',
                },
                {
                  key: 'orderNotifications' as const,
                  title: 'Order Notifications',
                  description: 'Receive notifications for new purchases and payments',
                  icon: Mail,
                  accentBg: 'bg-violet-50',
                  accentIcon: 'text-violet-600',
                },
                {
                  key: 'systemUpdates' as const,
                  title: 'System Updates',
                  description: 'Stay informed about platform updates and maintenance',
                  icon: Globe,
                  accentBg: 'bg-gray-100',
                  accentIcon: 'text-gray-600',
                },
                {
                  key: 'weeklyReport' as const,
                  title: 'Weekly Report',
                  description: 'Get a weekly summary of your test series performance',
                  icon: Mail,
                  accentBg: 'bg-amber-50',
                  accentIcon: 'text-amber-600',
                },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.key} className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-10 items-center justify-center rounded-full ${item.accentBg}`}>
                        <Icon className={`size-5 ${item.accentIcon}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications[item.key]}
                      onCheckedChange={() => handleToggleNotification(item.key)}
                    />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── CATEGORIES TAB ─────────────────────────────── */}
        <TabsContent value="categories" className="space-y-6 mt-6">
          <Card className="rounded-xl bg-white shadow-sm">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Tag className="size-5 text-amber-500" />
                    Categories
                  </CardTitle>
                  <CardDescription>Manage test series categories for your organization</CardDescription>
                </div>
                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-white gap-2 w-fit"
                  onClick={openCreateCategory}
                >
                  <Plus className="size-4" />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <div className="py-12 text-center">
                  <Tag className="mx-auto h-11 w-11 text-gray-300 mb-2" />
                  <p className="text-sm text-muted-foreground">No categories yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Create your first category to organize test series</p>
                  <Button
                    className="bg-amber-500 hover:bg-amber-600 text-white mt-4 gap-2"
                    onClick={openCreateCategory}
                  >
                    <Plus className="size-4" />
                    Create Category
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">S.NO</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Icon</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((cat, idx) => (
                        <TableRow key={cat.id}>
                          <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                <Tag className="size-4" />
                              </div>
                              <span className="font-medium text-sm">{cat.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">{cat.slug}</code>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {cat.icon || <span className="text-gray-300">—</span>}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(cat.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditCategory(cat)}>
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => {
                                    setDeleteCategoryTarget(cat)
                                    setDeleteCategoryDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add/Edit Category Dialog */}
          <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
                <DialogDescription>
                  {editingCategory ? 'Update category details' : 'Create a new category for organizing test series'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cat-name">Name *</Label>
                  <Input
                    id="cat-name"
                    value={categoryName}
                    onChange={(e) => handleCategoryNameChange(e.target.value)}
                    placeholder="e.g., JEE, NEET, UPSC"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat-slug">Slug</Label>
                  <Input
                    id="cat-slug"
                    value={categorySlug}
                    onChange={(e) => setCategorySlug(e.target.value)}
                    placeholder="auto-generated-from-name"
                  />
                  <p className="text-xs text-muted-foreground">Auto-generated from name. Edit if you need a custom slug.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat-icon">Icon (optional)</Label>
                  <Input
                    id="cat-icon"
                    value={categoryIcon}
                    onChange={(e) => setCategoryIcon(e.target.value)}
                    placeholder="e.g., 🎯, 📚, 🔬"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCategoryDialogOpen(false)} disabled={categorySaving}>
                  Cancel
                </Button>
                <Button
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                  onClick={handleSaveCategory}
                  disabled={categorySaving || !categoryName.trim()}
                >
                  {categorySaving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Category AlertDialog */}
          <AlertDialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Category</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete &quot;{deleteCategoryTarget?.name}&quot;? This action cannot be undone.
                  Test series using this category will not be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteCategory}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </div>
  )
}
