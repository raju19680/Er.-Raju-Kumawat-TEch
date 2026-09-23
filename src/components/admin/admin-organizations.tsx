'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
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
  Building2,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Mail,
  Users,
  GraduationCap,
  RefreshCw,
  AlertCircle,
  Calendar,
  CreditCard,
  Pencil,
  Trash2,
  Phone,
  Palette,
  Shield,
  IndianRupee,
  Check,
  X,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ── Types ────────────────────────────────────────────────────────────────────
interface OrganizationData {
  id: string
  name: string
  code: string
  phone: string | null
  accentColor: string
  status: string
  adminCommission: number
  gatewayCharge: number
  razorpayKeyId: string | null
  razorpayKeySecret: string | null
  razorpayAccountId: string | null
  teacherCount: number
  studentCount: number
  createdAt: string
}

interface OrgFormState {
  name: string
  code: string
  phone: string
  accentColor: string
  status: string
  adminCommission: number
  gatewayCharge: number
  razorpayKeyId: string
  razorpaySecret: string
  razorpayAccountId: string
}

const defaultFormState: OrgFormState = {
  name: '',
  code: '',
  phone: '',
  accentColor: '#d97706',
  status: 'trial',
  adminCommission: 20,
  gatewayCharge: 2.36,
  razorpayKeyId: '',
  razorpaySecret: '',
  razorpayAccountId: '',
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case 'active':
      return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 border-0">Active</Badge>
    case 'inactive':
      return <Badge className="bg-slate-500/15 text-slate-500 hover:bg-slate-500/15 border-0">Inactive</Badge>
    case 'trial':
      return <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/15 border-0">Trial</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
  } catch {
    return dateStr
  }
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

// ── Loading Skeletons ────────────────────────────────────────────────────────
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="bg-white border-0 shadow-sm">
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
    <Card className="bg-white border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardHeader>
      <CardContent className="px-6 pb-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="size-9 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ── Organization Form (shared between Add and Edit) ──────────────────────────
function OrganizationForm({
  form,
  setForm,
  error,
  isEdit,
}: {
  form: OrgFormState
  setForm: React.Dispatch<React.SetStateAction<OrgFormState>>
  error: string
  isEdit?: boolean
}) {
  return (
    <div className="space-y-5 py-2">
      {/* ── Section 1: Basic Details ── */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Building2 className="size-4 text-amber-600" />
          Organization Details
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="orgName" className="text-xs font-medium text-gray-700">
              Organization Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="orgName"
              placeholder="e.g. Delhi Public School"
              value={form.name}
              onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
              className="h-10 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="orgCode" className="text-xs font-medium text-gray-700">
              Code / Institute ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="orgCode"
              placeholder="e.g. DPS001"
              value={form.code}
              onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
              className="h-10 text-sm font-mono uppercase"
              disabled={isEdit}
            />
            {isEdit && (
              <p className="text-xs text-muted-foreground">Code cannot be changed after creation.</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="orgPhone" className="text-xs font-medium text-gray-700 flex items-center gap-1">
              <Phone className="size-3" />
              Phone <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="orgPhone"
              type="tel"
              placeholder="e.g. +91 9876543210"
              value={form.phone}
              onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
              className="h-10 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
              <Palette className="size-3.5" />
              Accent Color
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
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-gray-700">Status</Label>
          <Select
            value={form.status}
            onValueChange={(value) => setForm(prev => ({ ...prev, status: value }))}
          >
            <SelectTrigger className="h-10 w-full sm:w-48">
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

      <Separator />

      {/* ── Section 2: Payment Details ── */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <IndianRupee className="size-4 text-amber-600" />
          Payment & Commission
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
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Section 3: Razorpay Details ── */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="size-4 text-amber-600" />
          Razorpay Configuration
          <span className="text-muted-foreground font-normal text-xs">(optional)</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="razorpayKeyId" className="text-xs font-medium text-gray-700">
              Razorpay Key ID
            </Label>
            <Input
              id="razorpayKeyId"
              placeholder="e.g. rzp_live_xxxxxxxx"
              value={form.razorpayKeyId}
              onChange={(e) => setForm(prev => ({ ...prev, razorpayKeyId: e.target.value }))}
              className="h-10 text-sm font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="razorpaySecret" className="text-xs font-medium text-gray-700">
              Razorpay Key Secret
            </Label>
            <Input
              id="razorpaySecret"
              type="password"
              placeholder="e.g. xxxxxxxxxxxxxxxx"
              value={form.razorpaySecret}
              onChange={(e) => setForm(prev => ({ ...prev, razorpaySecret: e.target.value }))}
              className="h-10 text-sm font-mono"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="razorpayAccountId" className="text-xs font-medium text-gray-700">
            Razorpay Account ID
          </Label>
          <Input
            id="razorpayAccountId"
            placeholder="e.g. acc_xxxxxxxxxxxx"
            value={form.razorpayAccountId}
            onChange={(e) => setForm(prev => ({ ...prev, razorpayAccountId: e.target.value }))}
            className="h-10 text-sm font-mono"
          />
        </div>
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

// ── Add Organization Dialog ──────────────────────────────────────────────────
function AddOrganizationDialog({
  open,
  onOpenChange,
  onOrgCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOrgCreated: () => void
}) {
  const [form, setForm] = useState<OrgFormState>(defaultFormState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const resetForm = useCallback(() => {
    setForm(defaultFormState)
    setError('')
    setSuccess(false)
  }, [])

  const handleClose = useCallback((isOpen: boolean) => {
    if (!isOpen) resetForm()
    onOpenChange(isOpen)
  }, [onOpenChange, resetForm])

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Organization name is required'); return }
    if (!form.code.trim()) { setError('Organization code is required'); return }

    setLoading(true)
    setError('')

    try {
      const res = await apiFetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          phone: form.phone.trim() || undefined,
          accentColor: form.accentColor,
          status: form.status,
          adminCommission: form.adminCommission,
          gatewayCharge: form.gatewayCharge,
          razorpayKeyId: form.razorpayKeyId.trim() || undefined,
          razorpayKeySecret: form.razorpaySecret.trim() || undefined,
          razorpayAccountId: form.razorpayAccountId.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!data.success) {
        setError(data.message || 'Failed to create organization')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        resetForm()
        onOpenChange(false)
        onOrgCreated()
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
          <DialogTitle className="text-lg font-bold text-gray-900">Add New Organization</DialogTitle>
          <DialogDescription>
            Create a new organization. You can assign teachers to it later.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="flex items-center justify-center size-12 rounded-full bg-emerald-100">
              <Check className="size-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-emerald-700">Organization created successfully!</p>
          </div>
        ) : (
          <OrganizationForm form={form} setForm={setForm} error={error} />
        )}

        {!success && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => handleClose(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </span>
              ) : (
                <>
                  <Plus className="size-4 mr-1" />
                  Create Organization
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Edit Organization Dialog ─────────────────────────────────────────────────
function EditOrganizationDialog({
  open,
  onOpenChange,
  org,
  onOrgUpdated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  org: OrganizationData | null
  onOrgUpdated: () => void
}) {
  const [form, setForm] = useState<OrgFormState>(defaultFormState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (org && open) {
      setForm({
        name: org.name || '',
        code: org.code || '',
        phone: org.phone || '',
        accentColor: org.accentColor || '#d97706',
        status: org.status || 'trial',
        adminCommission: org.adminCommission ?? 20,
        gatewayCharge: org.gatewayCharge ?? 2.36,
        razorpayKeyId: org.razorpayKeyId || '',
        razorpaySecret: '', // Never pre-fill secrets
        razorpayAccountId: org.razorpayAccountId || '',
      })
      setError('')
      setSuccess(false)
    }
  }, [org, open])

  const handleClose = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setError('')
      setSuccess(false)
    }
    onOpenChange(isOpen)
  }, [onOpenChange])

  const handleSubmit = async () => {
    if (!org) return
    if (!form.name.trim()) { setError('Organization name is required'); return }

    setLoading(true)
    setError('')

    try {
      const body: Record<string, any> = {
        organizationId: org.id,
        name: form.name.trim(),
        phone: form.phone.trim() || '',
        accentColor: form.accentColor,
        status: form.status,
        adminCommission: form.adminCommission,
        gatewayCharge: form.gatewayCharge,
        razorpayKeyId: form.razorpayKeyId.trim() || '',
        razorpayAccountId: form.razorpayAccountId.trim() || '',
      }
      // Only send secret if user entered a new one
      if (form.razorpaySecret.trim()) {
        body.razorpayKeySecret = form.razorpaySecret.trim()
      }

      const res = await apiFetch('/api/admin/organizations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!data.success) {
        setError(data.message || 'Failed to update organization')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onOpenChange(false)
        onOrgUpdated()
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
          <DialogTitle className="text-lg font-bold text-gray-900">Edit Organization</DialogTitle>
          <DialogDescription>
            Update organization details and payment settings.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="flex items-center justify-center size-12 rounded-full bg-emerald-100">
              <Check className="size-6 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-emerald-700">Organization updated successfully!</p>
          </div>
        ) : (
          <OrganizationForm form={form} setForm={setForm} error={error} isEdit />
        )}

        {!success && (
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => handleClose(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
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

// ── Delete Organization Dialog ───────────────────────────────────────────────
function DeleteOrganizationDialog({
  open,
  onOpenChange,
  org,
  onOrgDeleted,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  org: OrganizationData | null
  onOrgDeleted: () => void
}) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!org) return

    setLoading(true)
    try {
      const res = await apiFetch('/api/admin/organizations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: org.id }),
      })

      const data = await res.json()
      if (!data.success) {
        toast.error(data.message || 'Failed to delete organization')
        setLoading(false)
        return
      }

      toast.success(`Organization "${org.name}" deleted successfully.`)
      onOpenChange(false)
      onOrgDeleted()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900">Delete Organization</DialogTitle>
          <DialogDescription>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-red-700">
                You are about to permanently delete <strong>{org?.name}</strong> ({org?.code}).
              </p>
              <p className="text-xs text-red-600">
                This will delete all associated teachers, students, test series, tests, orders, payments, and all other data belonging to this organization.
              </p>
            </div>
          </div>

          {org && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Teachers:</span>
                <span className="font-medium text-gray-900">{org.teacherCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Students:</span>
                <span className="font-medium text-gray-900">{org.studentCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Status:</span>
                {getStatusBadge(org.status)}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </span>
            ) : (
              <>
                <Trash2 className="size-4 mr-1" />
                Delete Organization
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── View Details Dialog ──────────────────────────────────────────────────────
function ViewDetailsDialog({
  open,
  onOpenChange,
  org,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  org: OrganizationData | null
}) {
  if (!org) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <div
              className="flex items-center justify-center size-8 rounded-lg text-white text-xs font-semibold shrink-0"
              style={{ backgroundColor: org.accentColor || '#64748b' }}
            >
              {getInitials(org.name)}
            </div>
            {org.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Basic Info */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Basic Info</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Code:</span> <span className="font-mono font-medium">{org.code}</span></div>
              <div><span className="text-muted-foreground">Status:</span> {getStatusBadge(org.status)}</div>
              {org.phone && <div className="col-span-2"><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{org.phone}</span></div>}
              <div><span className="text-muted-foreground">Created:</span> <span className="font-medium">{formatDate(org.createdAt)}</span></div>
              <div><span className="text-muted-foreground">Accent:</span> <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded-full" style={{ backgroundColor: org.accentColor }} /> <span className="font-mono text-xs">{org.accentColor}</span></span></div>
            </div>
          </div>

          <Separator />

          {/* Stats */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stats</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Users className="size-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{org.teacherCount}</p>
                <p className="text-xs text-muted-foreground">Teachers</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <GraduationCap className="size-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{org.studentCount}</p>
                <p className="text-xs text-muted-foreground">Students</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <CreditCard className="size-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{org.adminCommission}%</p>
                <p className="text-xs text-muted-foreground">Commission</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Config */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment Config</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Gateway:</span> <span className="font-medium">{org.gatewayCharge}%</span></div>
              <div><span className="text-muted-foreground">Commission:</span> <span className="font-medium">{org.adminCommission}%</span></div>
              {org.razorpayKeyId && <div className="col-span-2"><span className="text-muted-foreground">Razorpay Key:</span> <span className="font-mono text-xs font-medium">{org.razorpayKeyId}</span></div>}
              {org.razorpayAccountId && <div className="col-span-2"><span className="text-muted-foreground">Razorpay Account:</span> <span className="font-mono text-xs font-medium">{org.razorpayAccountId}</span></div>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationData[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [emailSending, setEmailSending] = useState(false)
  const [selectedOrg, setSelectedOrg] = useState<OrganizationData | null>(null)

  // ── Fetch organizations from API ──
  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true)
      setFetchError('')
      const res = await apiFetch('/api/admin/organizations')
      const data = await res.json()
      if (data.success) {
        setOrganizations(data.organizations)
      } else {
        setFetchError(data.message || 'Failed to fetch organizations')
      }
    } catch {
      setFetchError('Failed to connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  // ── Computed values ──
  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || org.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const activeCount = organizations.filter(o => o.status === 'active').length
  const trialCount = organizations.filter(o => o.status === 'trial').length
  const totalStudents = organizations.reduce((sum, o) => sum + o.studentCount, 0)

  // ── Handlers ──
  const handleViewDetails = (org: OrganizationData) => {
    setSelectedOrg(org)
    setViewDialogOpen(true)
  }

  const handleEdit = (org: OrganizationData) => {
    setSelectedOrg(org)
    setEditDialogOpen(true)
  }

  const handleDelete = (org: OrganizationData) => {
    setSelectedOrg(org)
    setDeleteDialogOpen(true)
  }

  const handleSendEmail = (org: OrganizationData) => {
    setSelectedOrg(org)
    setEmailSubject('')
    setEmailBody('')
    setEmailDialogOpen(true)
  }

  const handleEmailSubmit = async () => {
    if (!selectedOrg) return
    if (!emailSubject.trim()) {
      toast.error('Please enter a subject')
      return
    }
    if (!emailBody.trim()) {
      toast.error('Please enter a message')
      return
    }
    setEmailSending(true)
    try {
      const res = await apiFetch('/api/admin/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_email',
          organizationId: selectedOrg.id,
          subject: emailSubject,
          body: emailBody,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`Email sent to "${selectedOrg.name}" successfully!`)
        setEmailDialogOpen(false)
      } else {
        toast.error(data.message || 'Failed to send email')
      }
    } catch {
      toast.error('Failed to send email. Please try again.')
    } finally {
      setEmailSending(false)
    }
  }

  const handleDeactivate = async (org: OrganizationData) => {
    const newStatus = org.status === 'active' ? 'inactive' : 'active'
    try {
      const res = await apiFetch('/api/admin/organizations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: org.id,
          status: newStatus,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Organization "${org.name}" ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully.`)
        fetchOrganizations()
      } else {
        toast.error(data.message || 'Failed to update status')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="size-6 text-amber-600" />
            Organizations
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all organizations and their platform details.
          </p>
        </div>
        <Button
          className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="size-4 mr-2" />
          Add Organization
        </Button>
      </div>

      {/* Stats Row */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-white border-0 shadow-sm border-l-4 border-l-amber-500">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xs text-muted-foreground">Total Organizations</p>
              <p className="text-xl font-bold text-gray-900">{organizations.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm border-l-4 border-l-emerald-500">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-xl font-bold text-emerald-600">{activeCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm border-l-4 border-l-amber-500">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xs text-muted-foreground">On Trial</p>
              <p className="text-xl font-bold text-amber-600">{trialCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm border-l-4 border-l-violet-500">
            <CardContent className="p-3 sm:p-4">
              <p className="text-xs text-muted-foreground">Total Students</p>
              <p className="text-xl font-bold text-gray-900">{totalStudents.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search / Filter Bar */}
      <Card className="bg-white border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-gray-50/80 border-gray-200"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px] border-gray-200">
                <Filter className="size-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {fetchError && (
        <Card className="bg-white border-0 shadow-sm border-l-4 border-l-red-400">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-700">Failed to load organizations</p>
                <p className="text-xs text-red-500 mt-0.5">{fetchError}</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchOrganizations} className="shrink-0">
                <RefreshCw className="size-3.5 mr-1.5" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organizations Table */}
      {loading ? (
        <TableSkeleton />
      ) : (
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">All Organizations</CardTitle>
              <span className="text-xs text-muted-foreground">
                {filteredOrgs.length} organization{filteredOrgs.length !== 1 ? 's' : ''}
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {filteredOrgs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Building2 className="size-10 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-500">No organizations found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {searchQuery || statusFilter !== 'all' ? 'Try a different search or filter' : 'Add your first organization to get started'}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-100 hover:bg-transparent">
                        <TableHead className="text-xs font-medium text-muted-foreground">Organization</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Code</TableHead>
                        <TableHead className="text-center text-xs font-medium text-muted-foreground">Teachers</TableHead>
                        <TableHead className="text-center text-xs font-medium text-muted-foreground">Students</TableHead>
                        <TableHead className="text-center text-xs font-medium text-muted-foreground">Commission</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                        <TableHead className="text-xs font-medium text-muted-foreground">Created</TableHead>
                        <TableHead className="text-right text-xs font-medium text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrgs.map((org) => (
                        <TableRow key={org.id} className="border-b border-gray-50 hover:bg-slate-50/50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className="flex items-center justify-center size-9 rounded-lg text-white text-xs font-semibold shrink-0"
                                style={{ backgroundColor: org.accentColor || '#64748b' }}
                              >
                                {getInitials(org.name)}
                              </div>
                              <div className="min-w-0">
                                <span className="text-sm font-medium text-gray-900 block truncate max-w-[180px]">{org.name}</span>
                                {org.phone && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                                    <Phone className="size-2.5" />
                                    {org.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-mono text-muted-foreground bg-gray-100 px-2 py-0.5 rounded">
                              {org.code}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Users className="size-3.5 text-muted-foreground" />
                              <span className="text-sm text-gray-600">{org.teacherCount}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <GraduationCap className="size-3.5 text-muted-foreground" />
                              <span className="text-sm text-gray-600">{org.studentCount.toLocaleString()}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <CreditCard className="size-3.5 text-muted-foreground" />
                              <span className="text-sm text-gray-600">{org.adminCommission}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(org.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{formatDate(org.createdAt)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleViewDetails(org)}>
                                  <Eye className="mr-2 size-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(org)}>
                                  <Pencil className="mr-2 size-4" />
                                  Edit Organization
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendEmail(org)}>
                                  <Mail className="mr-2 size-4" />
                                  Send Email
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeactivate(org)}>
                                  {org.status === 'active' ? (
                                    <>
                                      <X className="mr-2 size-4" />
                                      Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <Check className="mr-2 size-4" />
                                      Activate
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => handleDelete(org)}
                                >
                                  <Trash2 className="mr-2 size-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3 px-4 pb-4">
                  {filteredOrgs.map((org) => (
                    <div key={org.id} className="border border-gray-100 rounded-lg p-4 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex items-center justify-center size-9 rounded-lg text-white text-xs font-semibold shrink-0"
                            style={{ backgroundColor: org.accentColor || '#64748b' }}
                          >
                            {getInitials(org.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{org.name}</p>
                            <p className="text-xs font-mono text-muted-foreground">{org.code}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(org.status)}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="size-7">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleViewDetails(org)}>
                                <Eye className="mr-2 size-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(org)}>
                                <Pencil className="mr-2 size-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSendEmail(org)}>
                                <Mail className="mr-2 size-4" />
                                Send Email
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeactivate(org)}>
                                {org.status === 'active' ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleDelete(org)}
                              >
                                <Trash2 className="mr-2 size-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-50 rounded-md py-1.5">
                          <p className="text-xs text-muted-foreground">Teachers</p>
                          <p className="text-sm font-semibold text-gray-900">{org.teacherCount}</p>
                        </div>
                        <div className="bg-gray-50 rounded-md py-1.5">
                          <p className="text-xs text-muted-foreground">Students</p>
                          <p className="text-sm font-semibold text-gray-900">{org.studentCount}</p>
                        </div>
                        <div className="bg-gray-50 rounded-md py-1.5">
                          <p className="text-xs text-muted-foreground">Commission</p>
                          <p className="text-sm font-semibold text-gray-900">{org.adminCommission}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <AddOrganizationDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onOrgCreated={fetchOrganizations}
      />
      <EditOrganizationDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        org={selectedOrg}
        onOrgUpdated={fetchOrganizations}
      />
      <DeleteOrganizationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        org={selectedOrg}
        onOrgDeleted={fetchOrganizations}
      />
      <ViewDetailsDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        org={selectedOrg}
      />

      {/* Send Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Email to {selectedOrg?.name}</DialogTitle>
            <DialogDescription>
              Compose an email to be sent to all teacher accounts in this organization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                placeholder="Enter email subject..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-body">Message</Label>
              <textarea
                id="email-body"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter your message..."
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)} disabled={emailSending}>
              Cancel
            </Button>
            <Button onClick={handleEmailSubmit} disabled={emailSending}>
              {emailSending ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
