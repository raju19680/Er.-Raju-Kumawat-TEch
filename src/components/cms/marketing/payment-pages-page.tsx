'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  Shield,
  AlertCircle,
  RefreshCw,
  Loader2,
  Key,
  Lock,
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Building,
  Settings,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────

interface OrgSettings {
  id: string
  name: string
  code: string
  razorpayKeyId: string | null
  razorpayAccountId: string | null
}

// ─── Component ────────────────────────────────────────────────────────────

export default function PaymentPagesPage() {
  const { orgCode } = useAppStore()

  // Data
  const [settings, setSettings] = useState<OrgSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form
  const [keyId, setKeyId] = useState('')
  const [keySecret, setKeySecret] = useState('')
  const [accountId, setAccountId] = useState('')
  const [showSecret, setShowSecret] = useState(false)

  // ─── Fetch ────────────────────────────────────────────────────────────

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/organization/settings')
      const data = await res.json()
      if (data.success && data.organization) {
        setSettings(data.organization)
        setKeyId(data.organization.razorpayKeyId || '')
        setAccountId(data.organization.razorpayAccountId || '')
        setKeySecret('')
      } else {
        setError(data.error || 'Failed to load settings')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // ─── Save ─────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true)
    try {
      const body: Record<string, string> = {}
      if (keyId !== (settings?.razorpayKeyId || '')) body.razorpayKeyId = keyId
      if (keySecret) body.razorpayKeySecret = keySecret
      if (accountId !== (settings?.razorpayAccountId || '')) body.razorpayAccountId = accountId

      if (Object.keys(body).length === 0) {
        toast.info('No changes to save')
        setSaving(false)
        return
      }

      const res = await apiFetch('/api/organization/settings', {
        method: 'PUT',
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Payment configuration saved')
        setKeySecret('')
        fetchSettings()
      } else {
        toast.error(data.error || 'Failed to save')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // ─── Mask key helper ──────────────────────────────────────────────────

  const maskKey = (key: string | null) => {
    if (!key) return 'Not configured'
    if (key.length <= 8) return '••••••••'
    return key.substring(0, 6) + '••••••••' + key.substring(key.length - 4)
  }

  // ─── Render ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <Card className="rounded-xl">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Pages</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure your payment gateway</p>
        </div>
        <Card className="rounded-xl">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="size-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <AlertCircle className="size-5 text-red-500" />
              </div>
              <p className="text-sm font-medium text-gray-900">Failed to load settings</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchSettings}>
                <RefreshCw className="size-3.5 mr-1.5" /> Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isConfigured = !!(settings?.razorpayKeyId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Pages</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your Razorpay payment gateway
        </p>
      </div>

      {/* Current Config Card */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="size-5" />
            Current Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            <div className={`size-10 rounded-full flex items-center justify-center ${isConfigured ? 'bg-emerald-100' : 'bg-amber-100'}`}>
              {isConfigured ? (
                <CheckCircle className="size-5 text-emerald-600" />
              ) : (
                <AlertCircle className="size-5 text-amber-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isConfigured ? 'Payment Gateway Configured' : 'Payment Gateway Not Configured'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isConfigured
                  ? 'Your Razorpay integration is active'
                  : 'Configure your Razorpay keys below to start accepting payments'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Key className="size-3" />
                Key ID
              </div>
              <p className="text-sm font-mono font-medium">{maskKey(settings?.razorpayKeyId || null)}</p>
            </div>
            <div className="p-3 rounded-lg border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Building className="size-3" />
                Account ID
              </div>
              <p className="text-sm font-mono font-medium">
                {settings?.razorpayAccountId || 'Not configured'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="size-5" />
            Update Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="key-id">Razorpay Key ID</Label>
            <Input
              id="key-id"
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              placeholder="rzp_test_xxxxxxxxxxxx"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">Found in your Razorpay Dashboard → API Keys</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="key-secret">Razorpay Key Secret</Label>
            <div className="relative">
              <Input
                id="key-secret"
                type={showSecret ? 'text' : 'password'}
                value={keySecret}
                onChange={(e) => setKeySecret(e.target.value)}
                placeholder="Enter new secret to update"
                className="font-mono pr-10"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Leave empty to keep the existing secret. We never display your secret after saving.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-id">Razorpay Account ID</Label>
            <Input
              id="account-id"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="acc_xxxxxxxxxxxx"
              className="font-mono"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-black hover:bg-gray-800 text-white min-w-[140px]"
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : null}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Flow Description */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="size-5" />
            Payment Flow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">1</span>
              </div>
              <p className="text-xs font-medium text-gray-900">Student</p>
              <p className="text-xs text-muted-foreground">Initiates payment</p>
            </div>
            <ArrowRight className="size-4 text-gray-400 hidden sm:block" />
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="size-10 rounded-full bg-amber-50 flex items-center justify-center">
                <span className="text-sm font-bold text-amber-600">2</span>
              </div>
              <p className="text-xs font-medium text-gray-900">Razorpay</p>
              <p className="text-xs text-muted-foreground">Processes securely</p>
            </div>
            <ArrowRight className="size-4 text-gray-400 hidden sm:block" />
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="size-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <span className="text-sm font-bold text-emerald-600">3</span>
              </div>
              <p className="text-xs font-medium text-gray-900">Webhook</p>
              <p className="text-xs text-muted-foreground">Verifies payment</p>
            </div>
            <ArrowRight className="size-4 text-gray-400 hidden sm:block" />
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="size-10 rounded-full bg-violet-50 flex items-center justify-center">
                <span className="text-sm font-bold text-violet-600">4</span>
              </div>
              <p className="text-xs font-medium text-gray-900">Access</p>
              <p className="text-xs text-muted-foreground">Content unlocked</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <Lock className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-700">Secure Payments</p>
              <p className="text-xs text-amber-600 mt-0.5">
                All payment data is processed securely through Razorpay. Your key secret is encrypted
                and never exposed in API responses.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
