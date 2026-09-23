'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Building2,
  Copy,
  Check,
  ExternalLink,
  Palette,
  RefreshCw,
  Phone,
  IndianRupee,
  Info,
  Shield,
  AlertCircle,
  Wand2,
  KeyRound,
  EyeOff,
  Loader2,
  Camera,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'

// ── Types ────────────────────────────────────────────────────────────────────
interface TeacherData {
  id: string
  name: string
  email: string
  phone: string | null
  avatar: string | null
  organization: {
    id: string
    name: string
    code: string
    accentColor: string
    status: string
    adminCommission: number
    gatewayCharge: number
    razorpayAccountId: string | null
    createdAt: string
  } | null
  studentCount: number
  createdAt: string
}

interface TeacherFormState {
  name: string
  email: string
  phone: string
  avatar?: string
  password: string
  platformName: string
  platformId: string
  accentColor: string
  status: string
  adminCommission: number
  gatewayCharge: number
  razorpayAccountId: string
}

const defaultFormState: TeacherFormState = {
  name: '',
  email: '',
  phone: '',
  avatar: '',
  password: '',
  platformName: '',
  platformId: '',
  accentColor: '#d97706',
  status: 'trial',
  adminCommission: 20,
  gatewayCharge: 2.36,
  razorpayAccountId: '',
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function generatePlatformId(name: string): string {
  if (!name) return ''
  const words = name.split(' ').filter(Boolean)
  const prefix = words.slice(0, 3).map(w => w[0]).join('').toUpperCase()
  const suffix = String(Math.floor(1000 + Math.random() * 9000))
  return prefix + suffix
}

function generateStrongPassword(): string {
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const digits = '0123456789'
  const special = '!@#$%&*'
  const all = lower + upper + digits + special

  let password = ''
  // Ensure at least one of each type
  password += lower[Math.floor(Math.random() * lower.length)]
  password += upper[Math.floor(Math.random() * upper.length)]
  password += digits[Math.floor(Math.random() * digits.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Fill remaining with random chars
  for (let i = 4; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }

  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

function getInitials(name: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
}

function formatStatus(status: string): string {
  if (!status) return 'Trial'
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
}

function getStatusBadge(status: string) {
  const formatted = formatStatus(status)
  switch (formatted) {
    case 'Active':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">{formatted}</Badge>
    case 'Inactive':
      return <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-0">{formatted}</Badge>
    case 'Trial':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">{formatted}</Badge>
    default:
      return <Badge variant="secondary">{formatted}</Badge>
  }
}

// ── Copy Button for Platform ID ─────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
      title="Copy Platform ID"
    >
      {text}
      {copied ? (
        <Check className="size-3 text-emerald-500" />
      ) : (
        <Copy className="size-3" />
      )}
    </button>
  )
}

// ── Payment Split Preview ────────────────────────────────────────────────────
function PaymentSplitPreview({ adminCommission, gatewayCharge }: { adminCommission: number; gatewayCharge: number }) {
  const gatewayAmount = (gatewayCharge / 100) * 100
  const adminAmount = (adminCommission / 100) * 100
  const teacherReceives = 100 - gatewayAmount - adminAmount

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
      <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
        <IndianRupee className="size-3.5" />
        Payment Split Preview
      </p>
      <p className="text-xs text-muted-foreground">For ₹100 payment:</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Gateway Charge ({gatewayCharge}%):</span>
          <span className="font-medium text-gray-800">₹{gatewayAmount.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Admin Commission ({adminCommission}%):</span>
          <span className="font-medium text-gray-800">₹{adminAmount.toFixed(2)}</span>
        </div>
        <Separator className="!my-1" />
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-emerald-700">Teacher Receives:</span>
          <span className="font-bold text-emerald-700">₹{Math.max(0, teacherReceives).toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}

// ── Teacher Form (shared between Add and Edit) ──────────────────────────────
function TeacherForm({
  form,
  setForm,
  error,
  isEdit,
  showPasswordChange,
  setShowPasswordChange,
  newPassword,
  setNewPassword,
  showNewPwd,
  setShowNewPwd,
}: {
  form: TeacherFormState
  setForm: React.Dispatch<React.SetStateAction<TeacherFormState>>
  error: string
  isEdit?: boolean
  showPasswordChange?: boolean
  setShowPasswordChange?: (v: boolean) => void
  newPassword?: string
  setNewPassword?: (v: string) => void
  showNewPwd?: boolean
  setShowNewPwd?: (v: boolean) => void
}) {
  const handlePlatformNameChange = (value: string) => {
    setForm(prev => ({
      ...prev,
      platformName: value,
      platformId: prev.platformId || generatePlatformId(value),
    }))
  }

  const [avatarUploading, setAvatarUploading] = useState(false)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarUploading(true)
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
        setForm(prev => ({ ...prev, avatar: data.url }))
        toast.success('Avatar uploaded successfully.')
      } else {
        toast.error(data.message || 'Failed to upload avatar')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setAvatarUploading(false)
    }
  }

  return (
    <div className="space-y-5 py-2">
      {/* ── Section 1: Teacher Details ── */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Users className="size-4 text-amber-600" />
          Teacher Details
        </h4>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="teacherName" className="text-xs font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="teacherName"
                  placeholder="e.g. Priya Sharma"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="teacherEmail" className="text-xs font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="teacherEmail"
                  type="email"
                  placeholder="e.g. priya@school.edu"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  className="h-10 text-sm"
                />
              </div>
            </div>
          </div>
          
          <div className="shrink-0 flex flex-col items-center justify-center gap-2 pr-4">
            <div className="relative group">
              {form.avatar ? (
                <img src={form.avatar} alt="Avatar" className="size-20 rounded-full object-cover shadow-sm border border-gray-200" />
              ) : (
                <div className="flex size-20 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold text-2xl shadow-sm">
                  {form.name ? form.name.charAt(0).toUpperCase() : 'T'}
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {avatarUploading ? (
                   <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                   <Camera className="size-5 text-white" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
              </label>
            </div>
            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Profile Logo</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="teacherPhone" className="text-xs font-medium text-gray-700">
              <span className="flex items-center gap-1">
                <Phone className="size-3" />
                Phone <span className="text-muted-foreground font-normal">(optional)</span>
              </span>
            </Label>
            <Input
              id="teacherPhone"
              type="tel"
              placeholder="e.g. +91 9876543210"
              value={form.phone}
              onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
              className="h-10 text-sm"
            />
          </div>
          {!isEdit ? (
            <div className="space-y-1.5">
              <Label htmlFor="teacherPassword" className="text-xs font-medium text-gray-700">
                Default Password <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="teacherPassword"
                  type="text"
                  placeholder="Min 8 chars"
                  value={form.password}
                  onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                  className="h-10 text-sm font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 px-3 shrink-0"
                  onClick={() => setForm(prev => ({ ...prev, password: generateStrongPassword() }))}
                  title="Auto-generate strong password"
                >
                  <Wand2 className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                <KeyRound className="size-3.5" />
                Password
              </Label>
              {!showPasswordChange ? (
                <button
                  type="button"
                  onClick={() => setShowPasswordChange?.(true)}
                  className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors cursor-pointer"
                >
                  <KeyRound className="size-4" />
                  Change Password
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showNewPwd ? 'text' : 'password'}
                        placeholder="Enter new password (min 8 chars)"
                        value={newPassword || ''}
                        onChange={(e) => setNewPassword?.(e.target.value)}
                        className="h-10 text-sm font-mono pr-10"
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPwd?.(!showNewPwd)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showNewPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 px-3 shrink-0"
                      onClick={() => setNewPassword?.(generateStrongPassword())}
                      title="Auto-generate strong password"
                    >
                      <Wand2 className="size-4" />
                    </Button>
                  </div>
                  {newPassword && newPassword.length < 8 && (
                    <p className="text-xs text-red-500">Password must be at least 8 characters</p>
                  )}
                  {newPassword && newPassword.length >= 8 && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <Check className="size-3" />
                      Password length is good
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordChange?.(false)
                      setNewPassword?.('')
                    }}
                    className="text-xs text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                  >
                    Cancel password change
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* ── Section 2: Platform / Institute Details ── */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Building2 className="size-4 text-amber-600" />
          Platform / Institute Details
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="platformName" className="text-xs font-medium text-gray-700">
              Institute Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="platformName"
              placeholder="e.g. Delhi Public School"
              value={form.platformName}
              onChange={(e) => handlePlatformNameChange(e.target.value)}
              className="h-10 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="platformId" className="text-xs font-medium text-gray-700">
              Platform ID / Institute ID <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="platformId"
                placeholder="e.g. DPS001"
                value={form.platformId}
                onChange={(e) => setForm(prev => ({ ...prev, platformId: e.target.value.toUpperCase() }))}
                className="h-10 text-sm font-mono uppercase"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 px-3 shrink-0"
                onClick={() => setForm(prev => ({ ...prev, platformId: generatePlatformId(form.platformName) }))}
                title="Regenerate Platform ID"
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
              <Palette className="size-3.5" />
              Accent Color
              <span className="text-muted-foreground font-normal">(for their platform branding)</span>
            </Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.accentColor}
                onChange={(e) => setForm(prev => ({ ...prev, accentColor: e.target.value }))}
                className="w-11 h-11 rounded-lg border border-gray-200 cursor-pointer p-1"
              />
              <div className="flex gap-1.5 flex-wrap">
                {['#d97706', '#059669', '#7c3aed', '#dc2626', '#0891b2', '#c026d3', '#ea580c', '#4f46e5'].map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, accentColor: color }))}
                    className={`size-7 rounded-full border-2 transition-all cursor-pointer ${form.accentColor === color ? 'border-gray-900 scale-110' : 'border-transparent hover:border-gray-300'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Section 3: Payment Split Details (Razorpay) ── */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <IndianRupee className="size-4 text-amber-600" />
          Payment Split Details
          <span className="text-muted-foreground font-normal text-xs">(Razorpay)</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="adminCommission" className="text-xs font-medium text-gray-700">
              Admin Commission %
            </Label>
            <Input
              id="adminCommission"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={form.adminCommission}
              onChange={(e) => setForm(prev => ({ ...prev, adminCommission: parseFloat(e.target.value) || 0 }))}
              className="h-10 text-sm"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="size-3 shrink-0" />
              Your commission from each payment
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gatewayCharge" className="text-xs font-medium text-gray-700">
              Gateway Charge %
            </Label>
            <Input
              id="gatewayCharge"
              type="number"
              min={0}
              step={0.01}
              value={form.gatewayCharge}
              onChange={(e) => setForm(prev => ({ ...prev, gatewayCharge: parseFloat(e.target.value) || 0 }))}
              className="h-10 text-sm"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="size-3 shrink-0" />
              Razorpay gateway processing fee
            </p>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="razorpayAccountId" className="text-xs font-medium text-gray-700">
            Razorpay Account ID
            <span className="text-muted-foreground font-normal ml-1">(optional)</span>
          </Label>
          <Input
            id="razorpayAccountId"
            placeholder="e.g. acc_xxxxxxxxxxxx"
            value={form.razorpayAccountId}
            onChange={(e) => setForm(prev => ({ ...prev, razorpayAccountId: e.target.value }))}
            className="h-10 text-sm font-mono"
          />
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Shield className="size-3 shrink-0" />
            Teacher&apos;s Razorpay linked account for payment split
          </p>
        </div>
        {/* Payment Split Preview */}
        <PaymentSplitPreview
          adminCommission={form.adminCommission}
          gatewayCharge={form.gatewayCharge}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="size-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
}

// ── Add Teacher Dialog ──────────────────────────────────────────────────────
function AddTeacherDialog({
  open,
  onOpenChange,
  onTeacherCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTeacherCreated: () => void
}) {
  const [form, setForm] = useState<TeacherFormState>(defaultFormState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const resetForm = useCallback(() => {
    setForm(defaultFormState)
    setError('')
    setSuccess(false)
  }, [])

  const handleClose = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      resetForm()
    }
    onOpenChange(isOpen)
  }, [onOpenChange, resetForm])

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Teacher name is required'); return }
    if (!form.email.trim()) { setError('Email is required'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { setError('Please enter a valid email address'); return }
    if (!form.password.trim()) { setError('Password is required'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (!form.platformName.trim()) { setError('Platform/Institute name is required'); return }
    if (!form.platformId.trim()) { setError('Platform ID is required'); return }

    setLoading(true)
    setError('')

    try {
      const res = await apiFetch('/api/admin/create-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          phone: form.phone.trim() || undefined,
          platformName: form.platformName.trim(),
          platformId: form.platformId.trim().toUpperCase(),
          accentColor: form.accentColor,
          status: form.status,
          adminCommission: form.adminCommission,
          gatewayCharge: form.gatewayCharge,
          razorpayAccountId: form.razorpayAccountId.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.message || 'Failed to create teacher')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        resetForm()
        onOpenChange(false)
        onTeacherCreated()
      }, 1200)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900">Add New Teacher</DialogTitle>
          <DialogDescription>
            Create a teacher account and their platform in one step. Each teacher gets their own white-labeled institute.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="flex items-center justify-center size-12 rounded-full bg-emerald-100">
              <Check className="size-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-emerald-700">Teacher & Platform created successfully!</p>
          </div>
        ) : (
          <TeacherForm form={form} setForm={setForm} error={error} />
        )}

        {!success && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => handleClose(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                <>
                  <Plus className="size-4 mr-1" />
                  Create Teacher & Platform
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Edit Teacher Dialog ──────────────────────────────────────────────────────
function EditTeacherDialog({
  open,
  onOpenChange,
  teacher,
  onTeacherUpdated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  teacher: TeacherData | null
  onTeacherUpdated: () => void
}) {
  const [form, setForm] = useState<TeacherFormState>(defaultFormState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [editNewPassword, setEditNewPassword] = useState('')
  const [showEditNewPwd, setShowEditNewPwd] = useState(false)

  // Pre-fill form when teacher changes
  useEffect(() => {
    if (teacher && open) {
      setForm({
        name: teacher.name || '',
        email: teacher.email || '',
        phone: teacher.phone || '',
        avatar: teacher.avatar || '',
        password: '',
        platformName: teacher.organization?.name || '',
        platformId: teacher.organization?.code || '',
        accentColor: teacher.organization?.accentColor || '#d97706',
        status: teacher.organization?.status || 'trial',
        adminCommission: teacher.organization?.adminCommission ?? 20,
        gatewayCharge: teacher.organization?.gatewayCharge ?? 2.36,
        razorpayAccountId: teacher.organization?.razorpayAccountId || '',
      })
      setError('')
      setSuccess(false)
      setShowPasswordChange(false)
      setEditNewPassword('')
      setShowEditNewPwd(false)
    }
  }, [teacher, open])

  const handleClose = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setError('')
      setSuccess(false)
      setShowPasswordChange(false)
      setEditNewPassword('')
    }
    onOpenChange(isOpen)
  }, [onOpenChange])

  const handleSubmit = async () => {
    if (!teacher) return
    if (!form.name.trim()) { setError('Teacher name is required'); return }
    if (!form.email.trim()) { setError('Email is required'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { setError('Please enter a valid email address'); return }
    if (!form.platformName.trim()) { setError('Platform/Institute name is required'); return }
    if (!form.platformId.trim()) { setError('Platform ID is required'); return }
    if (showPasswordChange && editNewPassword && editNewPassword.length < 8) {
      setError('New password must be at least 8 characters long.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 1. Update teacher details
      const res = await apiFetch('/api/admin/edit-teacher', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: teacher.id,
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || '',
          avatar: form.avatar || '',
          platformName: form.platformName.trim(),
          platformId: form.platformId.trim().toUpperCase(),
          accentColor: form.accentColor,
          status: form.status,
          adminCommission: form.adminCommission,
          gatewayCharge: form.gatewayCharge,
          razorpayAccountId: form.razorpayAccountId.trim() || '',
        }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.message || 'Failed to update teacher')
        setLoading(false)
        return
      }

      // 2. Reset password if provided
      if (showPasswordChange && editNewPassword && editNewPassword.length >= 8) {
        const pwdRes = await apiFetch('/api/admin/reset-teacher-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teacherId: teacher.id, newPassword: editNewPassword }),
        })
        const pwdData = await pwdRes.json()
        if (!pwdData.success) {
          setError(pwdData.message || 'Teacher updated but password reset failed.')
          setLoading(false)
          return
        }
      }

      setSuccess(true)
      toast.success(showPasswordChange && editNewPassword
        ? `Teacher & password updated for ${teacher.name}`
        : `Teacher updated successfully`
      )
      setTimeout(() => {
        setSuccess(false)
        onOpenChange(false)
        onTeacherUpdated()
      }, 1200)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900">Edit Teacher</DialogTitle>
          <DialogDescription>
            Update teacher details and platform settings.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="flex items-center justify-center size-12 rounded-full bg-emerald-100">
              <Check className="size-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-emerald-700">
              {showPasswordChange && editNewPassword
                ? 'Teacher details & password updated successfully!'
                : 'Teacher updated successfully!'}
            </p>
          </div>
        ) : (
          <TeacherForm
            form={form}
            setForm={setForm}
            error={error}
            isEdit
            showPasswordChange={showPasswordChange}
            setShowPasswordChange={setShowPasswordChange}
            newPassword={editNewPassword}
            setNewPassword={setEditNewPassword}
            showNewPwd={showEditNewPwd}
            setShowNewPwd={setShowEditNewPwd}
          />
        )}

        {!success && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => handleClose(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <>
                  <Check className="size-4 mr-1" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Loading Skeletons ────────────────────────────────────────────────────────
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-0 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-6 w-10" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="size-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<TeacherData[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<TeacherData | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingTeacher, setDeletingTeacher] = useState<TeacherData | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingTeacher, setViewingTeacher] = useState<TeacherData | null>(null)
  const [resetPwdDialogOpen, setResetPwdDialogOpen] = useState(false)
  const [resetPwdTeacher, setResetPwdTeacher] = useState<TeacherData | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [resetPwdLoading, setResetPwdLoading] = useState(false)
  const [resetPwdSuccess, setResetPwdSuccess] = useState(false)
  const setAdminPage = useAppStore((s) => s.setAdminPage)

  // ── Fetch teachers from API ──
  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true)
      setFetchError('')
      const res = await apiFetch('/api/admin/teachers')
      const data = await res.json()
      if (data.success) {
        setTeachers(data.teachers)
      } else {
        setFetchError(data.message || 'Failed to fetch teachers')
      }
    } catch {
      setFetchError('Failed to connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  // ── Computed values ──
  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (teacher.organization?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (teacher.organization?.code || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalStudents = teachers.reduce((sum, t) => sum + t.studentCount, 0)
  const activeCount = teachers.filter(t => t.organization?.status === 'active').length
  const trialCount = teachers.filter(t => t.organization?.status === 'trial').length

  // ── Handlers ──
  const handleEdit = (teacher: TeacherData) => {
    setEditingTeacher(teacher)
    setEditDialogOpen(true)
  }

  const handleDelete = (teacher: TeacherData) => {
    setDeletingTeacher(teacher)
    setDeleteDialogOpen(true)
  }

  const handleViewDetails = (teacher: TeacherData) => {
    setViewingTeacher(teacher)
    setViewDialogOpen(true)
  }

  const handleManagePlatform = (teacher: TeacherData) => {
    useAppStore.getState().setAdminSelectedTeacherId(teacher.id)
    setAdminPage('admin-module-access')
    toast.info(`Managing modules for ${teacher.name}'s platform.`)
  }

  const handleResetPassword = (teacher: TeacherData) => {
    setResetPwdTeacher(teacher)
    setNewPassword('')
    setShowPassword(false)
    setResetPwdLoading(false)
    setResetPwdSuccess(false)
    setResetPwdDialogOpen(true)
  }

  const handleResetPasswordSubmit = async () => {
    if (!resetPwdTeacher) return
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long.')
      return
    }
    setResetPwdLoading(true)
    try {
      const res = await apiFetch('/api/admin/reset-teacher-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: resetPwdTeacher.id, newPassword }),
      })
      const data = await res.json()
      if (data.success) {
        setResetPwdSuccess(true)
        toast.success(data.message || `Password changed for ${resetPwdTeacher.name}`)
      } else {
        toast.error(data.message || 'Failed to reset password')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setResetPwdLoading(false)
    }
  }

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage teachers and their platforms. Each teacher has their own white-labeled institute.
          </p>
        </div>
        <Button
          className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="size-4 mr-2" />
          Add Teacher
        </Button>
      </div>

      {/* Stats Row */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xs text-muted-foreground">Total Teachers</p>
              <p className="text-xl font-bold text-gray-900">{teachers.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-xl font-bold text-emerald-600">{activeCount}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xs text-muted-foreground">On Trial</p>
              <p className="text-xl font-bold text-amber-600">{trialCount}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xs text-muted-foreground">Total Students</p>
              <p className="text-xl font-bold text-gray-900">{totalStudents.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search / Filter Bar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, platform, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-50/80 border-gray-200"
              />
            </div>
            <Button variant="outline" className="border-gray-200">
              <Filter className="size-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {fetchError && (
        <Card className="border-0 shadow-sm border-l-4 border-l-red-400">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700">Failed to load teachers</p>
                <p className="text-xs text-red-500 mt-0.5">{fetchError}</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchTeachers} className="shrink-0">
                <RefreshCw className="size-3.5 mr-1.5" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teachers Table */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">All Teachers</CardTitle>
              <span className="text-xs text-muted-foreground">
                {filteredTeachers.length} teacher{filteredTeachers.length !== 1 ? 's' : ''}
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {filteredTeachers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Users className="size-10 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-500">No teachers found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {searchQuery ? 'Try a different search term' : 'Add your first teacher to get started'}
                </p>
              </div>
            ) : (
              <div className="space-y-3 px-4 pb-4">
                {filteredTeachers.map((teacher) => (
                  <div key={teacher.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all bg-white">
                    {/* Row 1: Avatar + Name + Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className="flex items-center justify-center size-10 rounded-full text-white text-sm font-bold shrink-0"
                          style={{ backgroundColor: teacher.organization?.accentColor || '#d97706' }}
                        >
                          {getInitials(teacher.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{teacher.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{teacher.email}</p>
                          {teacher.phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5">
                              <Phone className="size-2.5" />
                              {teacher.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {getStatusBadge(teacher.organization?.status || '')}
                      </div>
                    </div>

                    {/* Row 2: Platform & Stats */}
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: teacher.organization?.accentColor || '#d97706' }} />
                        <span className="font-medium text-gray-700 truncate max-w-[160px]">{teacher.organization?.name || '—'}</span>
                      </div>
                      {teacher.organization?.code && (
                        <CopyButton text={teacher.organization.code} />
                      )}
                      <span className="text-muted-foreground">{teacher.studentCount} students</span>
                      <span className="text-muted-foreground">Comm: {teacher.organization?.adminCommission ?? 20}%</span>
                      <span className="text-muted-foreground">GW: {teacher.organization?.gatewayCharge ?? 2.36}%</span>
                      <span className="text-muted-foreground">Joined {formatDate(teacher.createdAt)}</span>
                    </div>

                    {/* Row 3: Actions with ⋮ Menu */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{teacher.studentCount} students</span>
                        <span>&middot;</span>
                        <span>Comm: {teacher.organization?.adminCommission ?? 20}%</span>
                        <span>&middot;</span>
                        <span>GW: {teacher.organization?.gatewayCharge ?? 2.36}%</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-9 px-3 gap-1.5 text-xs font-medium border-gray-300 hover:bg-gray-50">
                            <MoreHorizontal className="size-4" />
                            Actions
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem onClick={() => handleViewDetails(teacher)} className="py-2">
                            <Eye className="mr-2 size-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(teacher)} className="py-2">
                            <Pencil className="mr-2 size-4" />
                            Edit Teacher
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(teacher)} className="py-2">
                            <KeyRound className="mr-2 size-4 text-amber-600" />
                            <span className="text-amber-700 font-medium">🔑 Change Password</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleManagePlatform(teacher)} className="py-2">
                            <Shield className="mr-2 size-4" />
                            Modules Access
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:text-red-600 py-2" onClick={() => handleDelete(teacher)}>
                            <Trash2 className="mr-2 size-4" />
                            Remove Teacher
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Teacher Dialog */}
      <AddTeacherDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onTeacherCreated={fetchTeachers}
      />

      {/* Edit Teacher Dialog */}
      <EditTeacherDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        teacher={editingTeacher}
        onTeacherUpdated={fetchTeachers}
      />

      {/* Delete Teacher Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">Remove Teacher</DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deletingTeacher && (
            <div className="space-y-3 py-2">
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-red-700">
                    You are about to permanently remove <strong>{deletingTeacher.name}</strong> ({deletingTeacher.email}).
                  </p>
                  <p className="text-xs text-red-600">
                    This will delete the teacher, their organization &quot;{deletingTeacher.organization?.name || 'Unknown'}&quot;, and ALL associated data including students, test series, tests, orders, and payments.
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Organization:</span>
                  <span className="font-medium text-gray-900">{deletingTeacher.organization?.name || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Platform ID:</span>
                  <span className="font-mono font-medium text-gray-900">{deletingTeacher.organization?.code || '—'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Students:</span>
                  <span className="font-medium text-gray-900">{deletingTeacher.studentCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Status:</span>
                  {getStatusBadge(deletingTeacher.organization?.status || '')}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!deletingTeacher) return
                try {
                  const res = await apiFetch('/api/admin/delete-teacher', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ teacherId: deletingTeacher.id }),
                  })
                  const data = await res.json()
                  if (data.success) {
                    toast.success(`Teacher "${deletingTeacher.name}" removed successfully.`)
                    setDeleteDialogOpen(false)
                    fetchTeachers()
                  } else {
                    toast.error(data.message || 'Failed to delete teacher')
                  }
                } catch {
                  toast.error('Something went wrong. Please try again.')
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="size-4 mr-1" />
              Remove Teacher
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={resetPwdDialogOpen} onOpenChange={setResetPwdDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <KeyRound className="size-5 text-amber-600" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for the teacher&apos;s login account.
            </DialogDescription>
          </DialogHeader>

          {resetPwdTeacher && (
            resetPwdSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <div className="flex items-center justify-center size-12 rounded-full bg-emerald-100">
                  <Check className="size-6 text-emerald-600" />
                </div>
                <p className="text-sm font-medium text-emerald-700">
                  Password for <strong>{resetPwdTeacher.name}</strong> has been changed successfully!
                </p>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                {/* Teacher Info */}
                <div className="flex items-center gap-3 rounded-lg border bg-gray-50 p-3">
                  <div
                    className="flex items-center justify-center size-10 rounded-full text-white text-xs font-semibold shrink-0"
                    style={{ backgroundColor: resetPwdTeacher.organization?.accentColor || '#d97706' }}
                  >
                    {getInitials(resetPwdTeacher.name)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{resetPwdTeacher.name}</p>
                    <p className="text-xs text-muted-foreground">{resetPwdTeacher.email}</p>
                  </div>
                </div>

                {/* New Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-xs font-medium text-gray-700">
                    New Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-10 text-sm font-mono pr-20"
                      minLength={8}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700"
                        onClick={() => setNewPassword(generateStrongPassword())}
                        title="Auto-generate strong password"
                      >
                        <Wand2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  {newPassword && newPassword.length < 8 && (
                    <p className="text-xs text-red-500">Password must be at least 8 characters</p>
                  )}
                  {newPassword && newPassword.length >= 8 && (
                    <p className="text-xs text-emerald-600">✓ Password length is good</p>
                  )}
                </div>
              </div>
            )
          )}

          {!resetPwdSuccess && (
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setResetPwdDialogOpen(false)} disabled={resetPwdLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleResetPasswordSubmit}
                disabled={resetPwdLoading || !newPassword || newPassword.length < 8}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {resetPwdLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Changing...
                  </span>
                ) : (
                  <>
                    <KeyRound className="size-4 mr-1" />
                    Change Password
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">Teacher Details</DialogTitle>
          </DialogHeader>

          {viewingTeacher && (
            <div className="space-y-4 py-2">
              {/* Teacher Info */}
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center size-12 rounded-full text-white text-sm font-semibold shrink-0"
                  style={{ backgroundColor: viewingTeacher.organization?.accentColor || '#d97706' }}
                >
                  {getInitials(viewingTeacher.name)}
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900">{viewingTeacher.name}</p>
                  <p className="text-sm text-muted-foreground">{viewingTeacher.email}</p>
                  {viewingTeacher.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5">
                      <Phone className="size-3" />
                      {viewingTeacher.phone}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Organization Info */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organization / Platform</h4>
                {viewingTeacher.organization ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="size-3 rounded-full" style={{ backgroundColor: viewingTeacher.organization.accentColor }} />
                      <span className="text-sm font-medium text-gray-900">{viewingTeacher.organization.name}</span>
                      {getStatusBadge(viewingTeacher.organization.status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-muted-foreground">Code:</span> <span className="font-mono font-medium">{viewingTeacher.organization.code}</span></div>
                      <div><span className="text-muted-foreground">Students:</span> <span className="font-medium">{viewingTeacher.studentCount}</span></div>
                      <div><span className="text-muted-foreground">Commission:</span> <span className="font-medium">{viewingTeacher.organization.adminCommission}%</span></div>
                      <div><span className="text-muted-foreground">Gateway:</span> <span className="font-medium">{viewingTeacher.organization.gatewayCharge}%</span></div>
                      {viewingTeacher.organization.razorpayAccountId && (
                        <div className="col-span-2"><span className="text-muted-foreground">Razorpay Account:</span> <span className="font-mono text-xs">{viewingTeacher.organization.razorpayAccountId}</span></div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created: {formatDate(viewingTeacher.organization.createdAt)}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No organization assigned.</p>
                )}
              </div>

              <Separator />

              {/* Account Info */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Joined:</span> <span className="font-medium">{formatDate(viewingTeacher.createdAt)}</span></div>
                  <div><span className="text-muted-foreground">Role:</span> <span className="font-medium">Teacher</span></div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setViewDialogOpen(false)
                    handleEdit(viewingTeacher)
                  }}
                >
                  <Pencil className="size-3.5 mr-1.5" />
                  Edit Teacher
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setViewDialogOpen(false)
                    handleResetPassword(viewingTeacher)
                  }}
                >
                  <KeyRound className="size-3.5 mr-1.5" />
                  Change Password
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setViewDialogOpen(false)
                    handleManagePlatform(viewingTeacher)
                  }}
                >
                  <ExternalLink className="size-3.5 mr-1.5" />
                  Manage Platform
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
