'use client'

import { FeaturedSection } from './public/FeaturedSection'
import { CoursesSection } from './public/CoursesSection'
import { BLUE, BLUE_BORDER, BLUE_LIGHT, BLUE_HOVER, BLUE_MEDIUM, cardGradients, tags } from './public/types'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, Search, Menu, BookOpen, ClipboardList, FileText,
  Link2, ArrowRight, ChevronDown, Home, HelpCircle, MessageCircle,
  Shield, Lock, RotateCcw, Mail, ExternalLink, AlertCircle,
  BookMarked, Play, Smartphone, Sparkles, Trophy, User, LogIn,
  X, Loader2, Newspaper, Bell, Info, ChevronRight, GraduationCap as Cap,
  Phone, MapPin, Clock, Users, Star, Download, ChevronLeft,
  Eye, EyeOff, KeyRound, CheckCircle, ArrowLeft, AlertTriangle, CheckCircle2,
} from 'lucide-react'

import { PublicNavbar } from './public/PublicNavbar'
import { HeroBanner } from './public/HeroBanner'
import { Footer } from './public/Footer'

import { BrowseTiles } from './public/BrowseTiles'



import { PortalData, PortalPage, AuthView, OrgData, CourseData, TestSeriesData, QuickLinkData, BannerData, CategoryData } from './public/types'

import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose,
} from '@/components/ui/sheet'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Carousel, CarouselContent, CarouselItem, type CarouselApi,
} from '@/components/ui/carousel'
import { Separator } from '@/components/ui/separator'
// signIn removed — using /api/auth/direct-login instead




// ─── Skeletons ──────────────────────────────────────────────────────────────

function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = React.useMemo(() => {
    if (!password) return { score: 0, feedback: [] as string[] }
    const feedback: string[] = []
    let metCount = 0
    if (password.length >= 8) metCount++; else feedback.push('8+ characters')
    if (/[A-Z]/.test(password)) metCount++; else feedback.push('uppercase letter')
    if (/[a-z]/.test(password)) metCount++; else feedback.push('lowercase letter')
    if (/\d/.test(password)) metCount++; else feedback.push('number')
    if (/[^A-Za-z0-9]/.test(password)) metCount++; else feedback.push('special character')
    let score: number
    if (metCount <= 2) { score = 1 }
    else if (metCount === 3) { score = 2 }
    else if (metCount === 4) { score = 3 }
    else { score = 4 }
    return { score, feedback }
  }, [password])

  if (!password) return null
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-400', 'bg-emerald-600']
  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
  const textColors = ['text-red-600', 'text-orange-600', 'text-yellow-600', 'text-emerald-500', 'text-emerald-700']

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength.score ? colors[strength.score] : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${textColors[strength.score]}`}>{labels[strength.score]}</span>
        {strength.feedback.length > 0 && strength.score < 4 && (
          <span className="text-xs text-gray-400">Need: {strength.feedback.join(', ')}</span>
        )}
      </div>
    </div>
  )
}

function VerifiedOrgBadge({ org }: { org: OrgData }) {
  const accent = org.accentColor || BLUE
  const initials = org.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
      <div className="flex items-center justify-center w-8 h-8 rounded-md text-white font-bold text-xs" style={{ backgroundColor: accent }}>{initials}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-emerald-900 truncate">{org.name}</p>
        <p className="text-xs text-emerald-600">Verified</p>
      </div>
      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
    </motion.div>
  )
}


function NavbarSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
      <div className="mx-auto max-w-7xl flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-lg" />
          <Skeleton className="w-32 h-5" />
        </div>
        <div className="hidden lg:flex items-center gap-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="w-16 h-8 rounded-md" />)}
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-9 h-9 rounded-full" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
      </div>
    </header>
  )
}

function CardSkeleton() {
  return (
    <Card className="rounded-xl overflow-hidden py-0">
      <Skeleton className="h-40 w-full" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-8 w-full rounded-lg" />
      </CardContent>
    </Card>
  )
}

// ─── Error / Empty ──────────────────────────────────────────────────────────
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
        <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-red-50 mx-auto mb-6">
          <AlertCircle className="size-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Something Went Wrong</h2>
        <p className="text-gray-500 mb-6">We couldn&apos;t load the portal data. Please try again.</p>
        <Button onClick={onRetry} className="gap-2 text-white" style={{ backgroundColor: BLUE }}>
          <RotateCcw className="size-4" /> Try Again
        </Button>
      </motion.div>
    </div>
  )
}

// ─── Student Auth Dialog ────────────────────────────────────────────────────
function StudentAuthDialog({ open, onOpenChange, initialView, orgData }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialView?: AuthView
  orgData: OrgData
}) {
  const loginToStore = useAppStore((s) => s.login)
  const [authView, setAuthView] = useState<AuthView>(initialView || 'login')

  // Login form state
  const [orgId, setOrgId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [verifiedOrg, setVerifiedOrg] = useState<OrgData | null>(null)
  const [verifyingOrg, setVerifyingOrg] = useState(false)

  // Forgot password state
  const [fpOrgId, setFpOrgId] = useState('')
  const [fpEmail, setFpEmail] = useState('')
  const [fpLoading, setFpLoading] = useState(false)
  const [fpError, setFpError] = useState('')
  const [fpSuccess, setFpSuccess] = useState(false)
  const [fpVerifiedOrg, setFpVerifiedOrg] = useState<OrgData | null>(null)
  const [fpVerifyingOrg, setFpVerifyingOrg] = useState(false)

  // Reset password state
  const [resetToken, setResetToken] = useState('')
  const [resetUser, setResetUser] = useState<{ name: string; email: string } | null>(null)
  const [tokenValidating, setTokenValidating] = useState(false)
  const [tokenError, setTokenError] = useState('')
  const [rpPassword, setRpPassword] = useState('')
  const [rpConfirmPassword, setRpConfirmPassword] = useState('')
  const [rpShowPassword, setRpShowPassword] = useState(false)
  const [rpShowConfirm, setRpShowConfirm] = useState(false)
  const [rpLoading, setRpLoading] = useState(false)
  const [rpError, setRpError] = useState('')

  // Sync with initialView prop changes
  useEffect(() => {
    if (initialView) setAuthView(initialView)
  }, [initialView])

  // Reset state when dialog closes
  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      setAuthView('login')
      setOrgId('')
      setEmail('')
      setPassword('')
      setAuthError('')
      setVerifiedOrg(null)
      setFpOrgId('')
      setFpEmail('')
      setFpError('')
      setFpSuccess(false)
      setFpVerifiedOrg(null)
      setResetToken('')
      setResetUser(null)
      setTokenError('')
      setRpPassword('')
      setRpConfirmPassword('')
      setRpError('')
    }
    onOpenChange(newOpen)
  }, [onOpenChange])

  // Verify org when orgId changes (debounced) - login form
  useEffect(() => {
    const trimmed = orgId.trim()
    if (!trimmed) { setVerifiedOrg(null); return }
    const timer = setTimeout(async () => {
      setVerifyingOrg(true)
      try {
        const res = await fetch('/api/auth/verify-org', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orgCode: trimmed }),
        })
        const data = await res.json()
        setVerifiedOrg(data.success ? data.organization : null)
      } catch { setVerifiedOrg(null) }
      finally { setVerifyingOrg(false) }
    }, 500)
    return () => clearTimeout(timer)
  }, [orgId])

  // Verify org for forgot password form (debounced)
  useEffect(() => {
    const trimmed = fpOrgId.trim()
    if (!trimmed) { setFpVerifiedOrg(null); return }
    const timer = setTimeout(async () => {
      setFpVerifyingOrg(true)
      try {
        const res = await fetch('/api/auth/verify-org', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orgCode: trimmed }),
        })
        const data = await res.json()
        setFpVerifiedOrg(data.success ? data.organization : null)
      } catch { setFpVerifiedOrg(null) }
      finally { setFpVerifyingOrg(false) }
    }, 500)
    return () => clearTimeout(timer)
  }, [fpOrgId])



  // Handle Login
  const handleLogin = async () => {
    if (!orgId.trim()) { setAuthError('Please enter your Institute ID'); return }
    if (!email.trim()) { setAuthError('Please enter your email'); return }
    if (!password.trim()) { setAuthError('Please enter your password'); return }

    setAuthLoading(true)
    setAuthError('')
    try {
      const res = await fetch('/api/auth/direct-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
          orgId: orgId.trim(),
        }),
      })
      const data = await res.json()

      if (!data.success) {
        setAuthError(data.message || 'Invalid email or password')
        setAuthLoading(false)
        return
      }

      // Login succeeded - use returned user data directly
      const u = data.user
      loginToStore(
        u.orgCode || '',
        u.orgName || 'Er. Raju Kumawat Tech',
        u.name || email.trim().split('@')[0],
        u.email || email.trim().toLowerCase(),
        u.role || 'student',
        u.loginMode || 'student'
      )

      // Fetch API token (non-critical)
      try {
        const tokenRes = await fetch('/api/auth/session-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: u.email, orgId: u.orgId }),
        })
        const tokenData = await tokenRes.json()
        if (tokenData.success && tokenData.token) {
          useAppStore.getState().setApiToken(tokenData.token)
        }
      } catch {}

      setAuthLoading(false)
      onOpenChange(false)
    } catch {
      setAuthError('Something went wrong. Please try again.')
      setAuthLoading(false)
    }
  }

  // Handle Forgot Password
  const handleForgotPassword = async () => {
    if (!fpOrgId.trim()) { setFpError('Please enter your Institute ID'); return }
    if (!fpEmail.trim()) { setFpError('Please enter your email address'); return }

    setFpLoading(true)
    setFpError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fpEmail.trim().toLowerCase(), orgId: fpOrgId.trim(), source: 'student' }),
      })
      const data = await res.json()
      if (data.success) { setFpSuccess(true) }
      else { setFpError(data.error || 'Something went wrong. Please try again.') }
    } catch {
      setFpError('Network error. Please check your connection and try again.')
    } finally { setFpLoading(false) }
  }

  // Handle Reset Password
  const handleResetPassword = async () => {
    if (!rpPassword) { setRpError('Please enter a new password'); return }
    if (rpPassword.length < 8) { setRpError('Password must be at least 8 characters long'); return }
    if (rpPassword !== rpConfirmPassword) { setRpError('Passwords do not match'); return }

    setRpLoading(true)
    setRpError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: rpPassword }),
      })
      const data = await res.json()
      if (data.success) { setAuthView('reset-success') }
      else { setRpError(data.error || 'Failed to reset password. Please try again.') }
    } catch {
      setRpError('Network error. Please check your connection and try again.')
    } finally { setRpLoading(false) }
  }

  // Navigate views
  const goToForgotPassword = () => {
    setAuthView('forgot-password')
    if (orgId.trim()) setFpOrgId(orgId.trim())
    if (email.trim()) setFpEmail(email.trim())
    setFpError('')
    setFpSuccess(false)
  }
  const goToLogin = () => { setAuthView('login'); setAuthError('') }

  // Load reset token from URL
  useEffect(() => {
    if (!open) return
    const params = new URLSearchParams(window.location.search)
    const token = params.get('reset_token')
    if (token) {
      setResetToken(token)
      setAuthView('reset-password')
      setTokenValidating(true)
      fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) { setResetUser(data.user); setTokenError('') }
          else { setTokenError(data.error || 'This reset link is invalid or has expired.') }
        })
        .catch(() => { setTokenError('Failed to validate reset link. Please try again.') })
        .finally(() => { setTokenValidating(false) })
      // Clean URL
      window.history.replaceState({}, '', '/')
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-white/20">
              <GraduationCap className="size-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white font-bold">
                {authView === 'login' && 'Sign In'}
                {authView === 'forgot-password' && 'Forgot Password'}
                {authView === 'reset-password' && 'Reset Password'}
                {authView === 'reset-success' && 'Success!'}
              </DialogTitle>
              <DialogDescription className="text-blue-100 text-xs">
                {authView === 'login' && 'Access your student portal'}
                {authView === 'forgot-password' && 'Reset your password via email'}
                {authView === 'reset-password' && 'Create a new password'}
                {authView === 'reset-success' && 'Your password has been reset'}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* ── Login View ── */}
            {authView === 'login' && (
              <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <form onSubmit={(e) => { e.preventDefault(); handleLogin() }} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Institute ID <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                      <Input value={orgId} onChange={(e) => { setOrgId(e.target.value); if (authError) setAuthError('') }}
                        placeholder="Enter institute code" className="h-11 pl-10 pr-10 rounded-lg" disabled={authLoading} required />
                      {verifyingOrg && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 animate-spin" />}
                    </div>
                    <AnimatePresence>{verifiedOrg && <VerifiedOrgBadge org={verifiedOrg} />}</AnimatePresence>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></Label>
                    <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (authError) setAuthError('') }}
                      placeholder="Enter your email" className="h-11 rounded-lg" disabled={authLoading} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); if (authError) setAuthError('') }}
                        placeholder="Enter your password" className="h-11 rounded-lg pr-10" disabled={authLoading} required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button type="button" className="text-sm font-medium hover:underline" style={{ color: BLUE }} onClick={goToForgotPassword}>
                      Forgot Password?
                    </button>
                  </div>
                  {authError && (
                    <p className="text-sm text-red-500 flex items-center gap-1.5">
                      <Info className="size-3.5 shrink-0" />{authError}
                    </p>
                  )}
                  <Button type="submit" disabled={authLoading} className="w-full h-11 text-white font-semibold rounded-lg" style={{ backgroundColor: BLUE }}>
                    {authLoading ? <Loader2 className="size-5 animate-spin" /> : <>Sign In <ArrowRight className="size-4 ml-1" /></>}
                  </Button>
                </form>
              </motion.div>
            )}

            {/* ── Forgot Password View ── */}
            {authView === 'forgot-password' && (
              <motion.div key="forgot" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <button type="button" onClick={goToLogin} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="size-4" /> Back to Sign In
                </button>

                {fpSuccess ? (
                  <div className="flex flex-col items-center text-center p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-3">
                      <CheckCircle className="size-7 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-emerald-900 mb-2">Reset Link Sent!</h3>
                    <p className="text-sm text-emerald-700 leading-relaxed">
                      If an account exists for <strong>{fpEmail}</strong>, you will receive a password reset link shortly.
                    </p>
                    <p className="text-xs text-emerald-600 mt-2">The link will expire in 1 hour.</p>
                    <Button onClick={goToLogin} className="mt-4 text-white" style={{ backgroundColor: BLUE }}>Back to Sign In</Button>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword() }} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Institute ID <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input value={fpOrgId} onChange={(e) => { setFpOrgId(e.target.value); if (fpError) setFpError('') }}
                          placeholder="Enter institute code" className="h-11 pl-10 pr-10 rounded-lg" disabled={fpLoading} required />
                        {fpVerifyingOrg && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 animate-spin" />}
                      </div>
                      <AnimatePresence>{fpVerifiedOrg && <VerifiedOrgBadge org={fpVerifiedOrg} />}</AnimatePresence>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Email Address <span className="text-red-500">*</span></Label>
                      <Input type="email" value={fpEmail} onChange={(e) => { setFpEmail(e.target.value); if (fpError) setFpError('') }}
                        placeholder="Enter your email" className="h-11 rounded-lg" disabled={fpLoading} required />
                    </div>
                    {fpError && (
                      <p className="text-sm text-red-500 flex items-center gap-1.5"><Info className="size-3.5 shrink-0" />{fpError}</p>
                    )}
                    <Button type="submit" disabled={fpLoading} className="w-full h-11 text-white font-semibold rounded-lg" style={{ backgroundColor: BLUE }}>
                      {fpLoading ? <Loader2 className="size-5 animate-spin" /> : <>Send Reset Link <Mail className="size-4 ml-1" /></>}
                    </Button>
                  </form>
                )}

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-start gap-2">
                    <Info className="size-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-700">In development mode, the reset link is logged to the server console. Check your terminal or the Email Log in admin panel.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Reset Password View ── */}
            {authView === 'reset-password' && (
              <motion.div key="reset" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                {tokenValidating ? (
                  <div className="flex flex-col items-center py-8">
                    <Loader2 className="size-8 text-blue-500 animate-spin mb-3" />
                    <p className="text-sm text-gray-500">Verifying reset link...</p>
                  </div>
                ) : tokenError ? (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center text-center p-4 rounded-xl bg-red-50 border border-red-200">
                      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-3">
                        <AlertTriangle className="size-7 text-red-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-red-900 mb-2">Invalid Link</h3>
                      <p className="text-sm text-red-700 leading-relaxed">{tokenError}</p>
                    </div>
                    <Button onClick={() => { setAuthView('forgot-password'); setTokenError('') }} className="w-full h-11 text-white font-semibold rounded-lg" style={{ backgroundColor: BLUE }}>
                      Request New Reset Link
                    </Button>
                    <button type="button" onClick={goToLogin} className="w-full text-center text-sm text-gray-500 hover:text-gray-700">
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); handleResetPassword() }} className="space-y-4">
                    {resetUser && (
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                        <p className="text-sm text-emerald-800">
                          Resetting password for <strong>{resetUser.name}</strong> ({resetUser.email})
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">New Password <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Input type={rpShowPassword ? 'text' : 'password'} value={rpPassword} onChange={(e) => { setRpPassword(e.target.value); if (rpError) setRpError('') }}
                          placeholder="Enter new password" className="h-11 rounded-lg pr-10" disabled={rpLoading} autoFocus required />
                        <button type="button" onClick={() => setRpShowPassword(!rpShowPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {rpShowPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      <PasswordStrengthIndicator password={rpPassword} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Confirm Password <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Input type={rpShowConfirm ? 'text' : 'password'} value={rpConfirmPassword} onChange={(e) => { setRpConfirmPassword(e.target.value); if (rpError) setRpError('') }}
                          placeholder="Confirm new password" className="h-11 rounded-lg pr-10" disabled={rpLoading} required />
                        <button type="button" onClick={() => setRpShowConfirm(!rpShowConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {rpShowConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      {rpConfirmPassword && rpPassword && rpConfirmPassword !== rpPassword && (
                        <p className="text-xs text-red-500">Passwords do not match</p>
                      )}
                      {rpConfirmPassword && rpPassword && rpConfirmPassword === rpPassword && (
                        <p className="text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="size-3" />Passwords match</p>
                      )}
                    </div>
                    {rpError && (
                      <p className="text-sm text-red-500 flex items-center gap-1.5"><Info className="size-3.5 shrink-0" />{rpError}</p>
                    )}
                    <Button type="submit" disabled={rpLoading} className="w-full h-11 text-white font-semibold rounded-lg" style={{ backgroundColor: BLUE }}>
                      {rpLoading ? <Loader2 className="size-5 animate-spin" /> : <>Reset Password <ArrowRight className="size-4 ml-1" /></>}
                    </Button>
                  </form>
                )}
              </motion.div>
            )}

            {/* ── Reset Success View ── */}
            {authView === 'reset-success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center text-center py-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                  <CheckCircle className="size-8 text-emerald-600" />
                </motion.div>
                <h2 className="text-xl font-bold text-emerald-900 mb-2">Password Reset!</h2>
                <p className="text-sm text-emerald-700 mb-6">Your password has been successfully reset. You can now sign in with your new password.</p>
                <Button onClick={goToLogin} className="text-white px-8" style={{ backgroundColor: BLUE }}>
                  Sign In Now <ArrowRight className="size-4 ml-1" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Navbar ──────────────────────────────────────────────────────────────────





// ─── Full Courses List Page ──────────────────────────────────────────────────
function CoursesListPage({ data, onLoginClick }: { data: PortalData; onLoginClick: () => void }) {
  const { isAuthenticated, openCheckout, userRole, setCheckoutIntent } = useAppStore()
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const allCats = [...new Set(data.courses.map(c => c.category).filter(Boolean))]
  const filtered = data.courses.filter(c => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false
    if (selectedCat && c.category !== selectedCat) return false
    return true
  })

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">All Courses</h2>
        <p className="text-gray-500 text-sm mb-6">{data.courses.length} courses available</p>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-lg border-gray-200" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button variant={selectedCat === null ? 'default' : 'outline'} size="sm"
              className={`shrink-0 rounded-full ${selectedCat === null ? 'text-white' : ''}`}
              style={selectedCat === null ? { backgroundColor: BLUE } : { borderColor: BLUE_BORDER, color: BLUE }}
              onClick={() => setSelectedCat(null)}>All</Button>
            {allCats.map(cat => (
              <Button key={cat} variant={selectedCat === cat ? 'default' : 'outline'} size="sm"
                className={`shrink-0 rounded-full ${selectedCat === cat ? 'text-white' : ''}`}
                style={selectedCat === cat ? { backgroundColor: BLUE } : { borderColor: BLUE_BORDER, color: BLUE }}
                onClick={() => setSelectedCat(cat)}>{cat}</Button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-16"><BookOpen className="size-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No courses found</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filtered.map((course, idx) => (
              <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="group cursor-pointer border border-gray-100 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg py-0">
                  <div className="relative h-40 flex items-center justify-center" style={{ backgroundColor: BLUE_LIGHT }}>
                    {course.thumbnail ? <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                      : <BookOpen className="size-12" style={{ color: BLUE, opacity: 0.4 }} />}
                    {course.category && <Badge className="absolute top-3 left-3 text-xs text-white" style={{ backgroundColor: BLUE }}>{course.category}</Badge>}
                  </div>
                  <CardContent className="p-4 flex flex-col gap-3">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{course.title}</h3>
                    <div className="flex items-end gap-2">
                      <span className="text-lg font-bold text-gray-900">&#8377;{course.price}</span>
                      {course.mrp > course.price && <><span className="text-sm text-gray-400 line-through">&#8377;{course.mrp}</span>
                        <span className="text-xs font-semibold text-emerald-600">{Math.round(((course.mrp - course.price) / course.mrp) * 100)}% off</span></>}
                    </div>
                    <Button variant="outline" className="w-full font-semibold rounded-lg"
                      style={{ borderColor: BLUE_BORDER, color: BLUE }}
                      onClick={() => { const payload = { id: course.id, type: 'course', title: course.title, price: course.price, mrp: course.mrp, thumbnail: course.thumbnail }; if (!isAuthenticated || !['student', 'user'].includes((userRole || '').toLowerCase())) { useAppStore.getState().setCheckoutIntent(payload); onLoginClick(); } else { openCheckout(payload); } }}>Enroll Now</Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Full Test Series List Page ──────────────────────────────────────────────
function TestSeriesListPage({ data, onLoginClick }: { data: PortalData; onLoginClick: () => void }) {
  const { isAuthenticated, openCheckout } = useAppStore()
  const [search, setSearch] = useState('')
  const filtered = data.testSeries.filter(ts => !search || ts.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">All Test Series</h2>
        <p className="text-gray-500 text-sm mb-6">{data.testSeries.length} test series available</p>
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <Input placeholder="Search test series..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-lg border-gray-200" />
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-16"><ClipboardList className="size-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No test series found</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map((item, idx) => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="group cursor-pointer border border-gray-100 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg py-0">
                  <div className={`relative h-36 bg-gradient-to-br ${cardGradients[idx % cardGradients.length]} flex items-center justify-center`}>
                    {item.thumbnail ? <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                      : <ClipboardList className="size-12 text-white/80" />}
                    <Badge className="absolute top-3 left-3 bg-white/90 text-gray-800 text-xs font-semibold">{tags[idx % tags.length]}</Badge>
                    {item.isCombo && <Badge className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-semibold">Combo</Badge>}
                  </div>
                  <CardContent className="p-4 flex flex-col gap-3">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{item.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">{item.testCount} Tests</Badge>
                      {item.category && <Badge variant="secondary" className="text-xs" style={{ backgroundColor: BLUE_LIGHT, color: BLUE }}>{item.category}</Badge>}
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-lg font-bold text-gray-900">&#8377;{item.price}</span>
                      {item.mrp > item.price && <><span className="text-sm text-gray-400 line-through">&#8377;{item.mrp}</span>
                        <span className="text-xs font-semibold text-emerald-600">{Math.round(((item.mrp - item.price) / item.mrp) * 100)}% off</span></>}
                    </div>
                    <Button className="w-full font-semibold rounded-lg text-white" style={{ backgroundColor: BLUE }}
                      onClick={() => { const payload = { id: item.id, type: 'test_series', title: item.title, price: item.price, mrp: item.mrp, thumbnail: item.thumbnail }; if (!isAuthenticated || !['student', 'user'].includes((userRole || '').toLowerCase())) { useAppStore.getState().setCheckoutIntent(payload); onLoginClick(); } else { openCheckout(payload); } }}>Buy Now</Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Docs Page ──────────────────────────────────────────────────────────────
function DocsPage({ data }: { data: PortalData }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Study Material & Docs</h2>
        <p className="text-gray-500 text-sm mb-6">Browse study resources organized by category</p>
        {data.categories.length === 0 ? (
          <div className="text-center py-16"><FileText className="size-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No categories available yet</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {data.categories.map((cat, idx) => (
              <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <Card className="border border-gray-100 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer py-0">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${cardGradients[idx % cardGradients.length]} text-white shrink-0`}>
                      <BookMarked className="size-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{cat.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{cat.slug}</p>
                    </div>
                    <ChevronRight className="size-5 text-gray-400 shrink-0" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Quick Links Page ───────────────────────────────────────────────────────
function QuickLinksPage({ data }: { data: PortalData }) {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Quick Links</h2>
        <p className="text-gray-500 text-sm mb-6">Important links and resources</p>
        {data.quickLinks.length === 0 ? (
          <div className="text-center py-16"><Link2 className="size-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No quick links available yet</p></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.quickLinks.map((link, idx) => (
              <motion.div key={link.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  <Card className="border border-gray-100 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-blue-200 py-0">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="flex items-center justify-center w-11 h-11 rounded-lg text-white shrink-0" style={{ backgroundColor: BLUE }}>
                        <Link2 className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 text-sm truncate">{link.title}</h3>
                      </div>
                      <ExternalLink className="size-4 text-gray-400 shrink-0" />
                    </CardContent>
                  </Card>
                </a>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── About Page ─────────────────────────────────────────────────────────────
function AboutPage({ data, onLoginClick }: { data: PortalData; onLoginClick: () => void }) {
  const orgInitials = data.organization.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl text-white font-bold text-2xl mx-auto mb-4"
            style={{ backgroundColor: BLUE }}>
            {data.organization.logo ? (
              <img src={data.organization.logo} alt={data.organization.name} className="w-full h-full object-cover rounded-2xl" />
            ) : orgInitials}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{data.organization.name}</h2>
          <p className="text-gray-500 mt-2">Empowering education through technology</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            { icon: BookOpen, label: 'Courses', value: data.courses.length },
            { icon: ClipboardList, label: 'Test Series', value: data.testSeries.length },
            { icon: FileText, label: 'Categories', value: data.categories.length },
            { icon: Link2, label: 'Quick Links', value: data.quickLinks.length },
          ].map(stat => (
            <Card key={stat.label} className="border border-gray-100 rounded-xl text-center py-0">
              <CardContent className="p-4 flex flex-col items-center gap-2">
                <stat.icon className="size-6" style={{ color: BLUE }} />
                <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                <span className="text-xs text-gray-500">{stat.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="border border-gray-100 rounded-xl py-0">
          <CardContent className="p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-4">About Our Platform</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              {data.organization.name} provides a comprehensive learning platform designed to help students
              achieve their academic goals. Our expert educators create high-quality courses and test series
              that cover all essential topics and exam patterns.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Join thousands of students who trust us for their exam preparation. Access courses, practice
              tests, and study material — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="text-white gap-2" style={{ backgroundColor: BLUE }}
                onClick={() => onLoginClick()}>
                <LogIn className="size-4" /> Login to Get Started
              </Button>
              <Button variant="outline" style={{ borderColor: BLUE_BORDER, color: BLUE }} className="gap-2">
                <Mail className="size-4" /> Contact Us
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


// ─── Main Component ──────────────────────────────────────────────────────────
export default function PublicPortal() {
  const [data, setData] = useState<PortalData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activePage, setActivePage] = useState<PortalPage>('home')
  const [authDialogOpen, setAuthDialogOpen] = useState(false)
  const [authInitialView, setAuthInitialView] = useState<AuthView>('login')

  const openAuthDialog = useCallback((view?: AuthView) => {
    setAuthInitialView(view || 'login')
    setAuthDialogOpen(true)
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/student/portal-data?orgCode=9680177120')
      const json = await res.json()
      if (json.success && json.data) {
        setData(json.data)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Check for reset_token in URL on mount — auto-open auth dialog with reset view
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const token = params.get('reset_token')
    if (token) {
      openAuthDialog('reset-password')
    }
  }, [openAuthDialog])

  // Check for redirect from main login after student password reset
  useEffect(() => {
    if (typeof window === 'undefined') return
    const openStudentLogin = sessionStorage.getItem('erkt_open_student_login')
    if (openStudentLogin === 'true') {
      sessionStorage.removeItem('erkt_open_student_login')
      // Small delay to ensure the component is fully mounted
      setTimeout(() => openAuthDialog('login'), 100)
    }
  }, [openAuthDialog])

  // Scroll to top on page change
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [activePage])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <NavbarSkeleton />
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          <div className="mx-auto max-w-7xl">
            <Skeleton className="h-48 sm:h-64 rounded-2xl mb-8" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return <ErrorState onRetry={fetchData} />
  }

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return (
          <>
            <HeroBanner data={data} />
            <BrowseTiles data={data} onNavigate={setActivePage} />
            <FeaturedSection data={data} onNavigate={setActivePage} onLoginClick={openAuthDialog} />
            <CoursesSection data={data} onNavigate={setActivePage} onLoginClick={openAuthDialog} />
          </>
        )
      case 'courses':
        return <CoursesListPage data={data} onLoginClick={openAuthDialog} />
      case 'test-series':
        return <TestSeriesListPage data={data} onLoginClick={openAuthDialog} />
      case 'docs':
        return <DocsPage data={data} />
      case 'quick-links':
        return <QuickLinksPage data={data} />
      case 'about':
        return <AboutPage data={data} onLoginClick={openAuthDialog} />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <PublicNavbar data={data} activePage={activePage} onNavigate={setActivePage} onLoginClick={openAuthDialog} />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div key={activePage} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer data={data} />
      {/* Auth Dialog — Login, Forgot Password, Reset Password */}
      <StudentAuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        initialView={authInitialView}
        orgData={data.organization}
      />
    </div>
  )
}
