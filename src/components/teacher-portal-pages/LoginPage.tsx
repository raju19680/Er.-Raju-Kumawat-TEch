'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useStudentStore } from '@/lib/student-store'
import { useAppStore } from '@/lib/store'
import { TEACHER_CONFIG } from '@/lib/tp-config'
// signIn removed — using /api/auth/direct-login instead
import {
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Shield,
  KeyRound,
  GraduationCap,
  X,
  Loader2,
  CheckCircle2,
  Info,
  Building2,
  Clock,
  CheckCircle,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────
interface OrgData {
  id: string
  name: string
  code: string
  logo: string | null
  accentColor: string
}

type LoginStep = 1 | 2 | 3
type AuthView = 'login' | 'forgot-password'

// ─── Account Lock Countdown ─────────────────────────────────────────────────
function AccountLockCountdown({ minutes, onComplete }: { minutes: number; onComplete: () => void }) {
  const [remaining, setRemaining] = useState(minutes * 60)

  useEffect(() => {
    if (remaining <= 0) {
      onComplete()
      return
    }
    const timer = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          onComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [remaining, onComplete])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
      <Clock className="size-4 shrink-0 text-red-500" />
      <div>
        <p className="text-xs font-medium text-red-700">Account temporarily locked</p>
        <p className="text-xs text-red-500">
          Try again in {mins}m {secs.toString().padStart(2, '0')}s
        </p>
      </div>
    </div>
  )
}

// ─── Verified Org Badge (compact for card) ──────────────────────────────────
function VerifiedOrgBadge({ org }: { org: OrgData }) {
  const accent = org.accentColor || '#111111'
  const initials = org.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2">
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
        style={{ backgroundColor: accent }}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-emerald-900">{org.name}</p>
        <p className="text-xs text-emerald-600">Institute verified</p>
      </div>
      <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Main LoginPage Component
// ═══════════════════════════════════════════════════════════════════════════
export default function LoginPage() {
  const { setActivePage } = useStudentStore()
  const loginToStore = useAppStore((s) => s.login)

  // ── View state ──
  const [authView, setAuthView] = useState<AuthView>('login')
  const [step, setStep] = useState<LoginStep>(1)
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp' | null>(null)

  // ── Login form state ──
  const [orgId, setOrgId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  // ── Org verification state ──
  const [verifiedOrg, setVerifiedOrg] = useState<OrgData | null>(null)
  const [verifyingOrg, setVerifyingOrg] = useState(false)

  // ── Account lock state ──
  const [accountLocked, setAccountLocked] = useState(false)
  const [lockMinutes, setLockMinutes] = useState(0)

  // ── OTP state ──
  const [otp, setOtp] = useState(['', '', '', ''])
  const [resendTimer, setResendTimer] = useState(30)
  const [canResend, setCanResend] = useState(false)
  const [timerKey, setTimerKey] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // ── Forgot Password state ──
  const [fpOrgId, setFpOrgId] = useState('')
  const [fpEmail, setFpEmail] = useState('')
  const [fpLoading, setFpLoading] = useState(false)
  const [fpError, setFpError] = useState('')
  const [fpSuccess, setFpSuccess] = useState(false)
  const [fpVerifiedOrg, setFpVerifiedOrg] = useState<OrgData | null>(null)
  const [fpVerifyingOrg, setFpVerifyingOrg] = useState(false)

  // ── Debounced org verification for login form ──
  useEffect(() => {
    const trimmed = orgId.trim()
    if (!trimmed) {
      setVerifiedOrg(null)
      return
    }
    const timer = setTimeout(async () => {
      setVerifyingOrg(true)
      try {
        const res = await fetch('/api/auth/verify-org', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orgCode: trimmed }),
        })
        const data = await res.json()
        if (data.success) {
          setVerifiedOrg(data.organization)
        } else {
          setVerifiedOrg(null)
        }
      } catch {
        setVerifiedOrg(null)
      } finally {
        setVerifyingOrg(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [orgId])

  // ── Debounced org verification for forgot password form ──
  useEffect(() => {
    const trimmed = fpOrgId.trim()
    if (!trimmed) {
      setFpVerifiedOrg(null)
      return
    }
    const timer = setTimeout(async () => {
      setFpVerifyingOrg(true)
      try {
        const res = await fetch('/api/auth/verify-org', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orgCode: trimmed }),
        })
        const data = await res.json()
        if (data.success) {
          setFpVerifiedOrg(data.organization)
        } else {
          setFpVerifiedOrg(null)
        }
      } catch {
        setFpVerifiedOrg(null)
      } finally {
        setFpVerifyingOrg(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [fpOrgId])

  // ── OTP resend timer ──
  const resetTimer = useCallback(() => {
    setResendTimer(30)
    setCanResend(false)
    setOtp(['', '', '', ''])
    otpRefs.current[0]?.focus()
  }, [])

  useEffect(() => {
    if (step !== 3) return
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true)
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [step, timerKey])

  // ── Lock countdown complete ──
  const handleLockComplete = useCallback(() => {
    setAccountLocked(false)
    setLockMinutes(0)
  }, [])



  // ── Handle Step 1: Validate org + email and proceed ──
  const handleStep1Submit = () => {
    if (!orgId.trim()) {
      setAuthError('Please enter your Institute ID')
      return
    }
    if (!email.trim()) {
      setAuthError('Please enter your email or phone')
      return
    }
    setAuthError('')
    setStep(2)
  }

  // ── Handle Password Login (Step 2) ──
  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setAuthError('Please enter your password')
      return
    }
    if (accountLocked) {
      setAuthError('Your account is temporarily locked. Please wait.')
      return
    }

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
        if (data.message === '2FA_REQUIRED') {
          setAuthError('Two-factor authentication is required. Please use the main login page.')
        } else if (data.message?.includes('temporarily locked')) {
          const minutesMatch = data.message.match(/(\d+)\s*minute/)
          const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 15
          setAccountLocked(true)
          setLockMinutes(minutes)
          setAuthError(data.message)
        } else {
          setAuthError(data.message || 'Invalid email or password')
        }
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
        u.role || '',
        u.loginMode || ''
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
    } catch {
      setAuthError('Something went wrong. Please try again.')
      setAuthLoading(false)
    }
  }

  // ── Handle OTP Login (Step 3) ──
  const handleOtpSubmit = async () => {
    if (!otp.every((d) => d !== '')) return

    setAuthLoading(true)
    setAuthError('')

    try {
      // For OTP, we send the OTP as password to direct-login
      const otpCode = otp.join('')
      const res = await fetch('/api/auth/direct-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: otpCode,
          orgId: orgId.trim(),
        }),
      })
      const data = await res.json()

      if (!data.success) {
        if (data.message?.includes('temporarily locked')) {
          const minutesMatch = data.message.match(/(\d+)\s*minute/)
          const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 15
          setAccountLocked(true)
          setLockMinutes(minutes)
        }
        setAuthError(data.message === 'Invalid email or password' ? 'Invalid OTP code' : (data.message || 'Invalid OTP code'))
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
        u.role || '',
        u.loginMode || ''
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
    } catch {
      setAuthError('Something went wrong. Please try again.')
      setAuthLoading(false)
    }
  }

  // ── Handle Forgot Password ──
  const handleForgotPassword = async () => {
    if (!fpOrgId.trim()) {
      setFpError('Please enter your Institute ID')
      return
    }
    if (!fpEmail.trim()) {
      setFpError('Please enter your email address')
      return
    }

    setFpLoading(true)
    setFpError('')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: fpEmail.trim().toLowerCase(),
          orgId: fpOrgId.trim(),
        }),
      })
      const data = await res.json()

      if (data.success) {
        setFpSuccess(true)
      } else {
        setFpError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setFpError('Network error. Please check your connection and try again.')
    } finally {
      setFpLoading(false)
    }
  }

  // ── OTP input handlers ──
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleResendOtp = () => {
    if (canResend) {
      resetTimer()
      setTimerKey((k) => k + 1)
    }
  }

  // ── Navigation helpers ──
  const goBack = () => {
    setAuthError('')
    setLoginMethod(null)
    if (step === 2) setStep(1)
    else if (step === 3) setStep(2)
  }

  const goToForgotPassword = () => {
    // Pre-fill fields from login form
    if (orgId.trim()) setFpOrgId(orgId.trim())
    if (email.trim()) setFpEmail(email.trim())
    setFpError('')
    setFpSuccess(false)
    setLoginMethod(null)
    setAuthView('forgot-password')
  }

  const goToLogin = () => {
    setAuthError('')
    setLoginMethod(null)
    setStep(1)
    setAuthView('login')
  }

  // ── Masked email/phone display ──
  const maskedIdentifier = email
    ? email.includes('@')
      ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
      : email.replace(/(.{2})(.*)(.{2})/, '$1****$3')
    : ''

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-gray-100/50 px-4 py-8">
      <Card className="relative w-full max-w-md overflow-hidden border-0 shadow-xl">
        {/* Close button */}
        <button
          onClick={() => setActivePage('home')}
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close"
          type="button"
        >
          <X className="size-5" />
        </button>

        {/* Teacher Photo Header */}
        <div className="relative flex flex-col items-center bg-gradient-to-br from-blue-600 to-indigo-700 px-6 pb-8 pt-6">
          <div className="mb-3 flex size-20 items-center justify-center rounded-full border-4 border-white/30 bg-white/20 shadow-lg">
            <GraduationCap className="size-10 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white">{TEACHER_CONFIG.name}</h2>
          <p className="text-sm text-blue-200">{TEACHER_CONFIG.institution}</p>
        </div>

        <CardContent className="px-6 pb-6 pt-6">
          {/* ═══════════════════════════════════════════════════════════════
              LOGIN VIEW
              ═══════════════════════════════════════════════════════════════ */}
          {authView === 'login' && (
            <>
              {/* ── Step 1: Institute ID + Email ── */}
              {step === 1 && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleStep1Submit()
                  }}
                  className="space-y-4"
                >
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900">Welcome</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Enter your Institute ID and email to continue
                    </p>
                  </div>

                  {/* Institute ID */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Institute ID <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Enter your Institute ID"
                        value={orgId}
                        onChange={(e) => {
                          setOrgId(e.target.value)
                          if (authError) setAuthError('')
                        }}
                        className="h-11 pl-9 pr-9 text-sm"
                        disabled={authLoading}
                        autoFocus
                      />
                      {verifyingOrg && (
                        <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-gray-400" />
                      )}
                    </div>
                    {verifiedOrg && <VerifiedOrgBadge org={verifiedOrg} />}
                  </div>

                  {/* Email / Phone */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Email / Phone <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {email.includes('@') ? (
                          <Mail className="size-4" />
                        ) : (
                          <Phone className="size-4" />
                        )}
                      </div>
                      <Input
                        type={email.includes('@') ? 'email' : 'tel'}
                        placeholder="Enter your email or phone"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value)
                          if (authError) setAuthError('')
                        }}
                        className="h-11 pl-9 text-sm"
                        disabled={authLoading}
                      />
                    </div>
                  </div>

                  {/* Error message */}
                  {authError && (
                    <div className="flex items-center gap-1.5 text-sm text-red-500">
                      <Info className="size-3.5 shrink-0" />
                      {authError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-blue-600 font-semibold hover:bg-blue-700"
                    disabled={!orgId.trim() || !email.trim() || authLoading}
                  >
                    {authLoading ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <>
                        Next
                        <ArrowRight className="ml-1 size-4" />
                      </>
                    )}
                  </Button>

                  <p className="text-center text-xs text-gray-400">
                    By continuing, you agree to our Terms &amp; Privacy Policy
                  </p>
                </form>
              )}

              {/* ── Step 2: Password + Login Method ── */}
              {step === 2 && (
                <div className="space-y-4">
                  {/* Back button */}
                  <button
                    onClick={() => {
                      if (loginMethod) {
                        setLoginMethod(null)
                      } else {
                        goBack()
                      }
                    }}
                    className="flex items-center gap-1 text-sm text-gray-500 transition hover:text-gray-700"
                    type="button"
                  >
                    <ArrowLeft className="size-4" />
                    Back
                  </button>

                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900">Login to your account</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Logging in as{' '}
                      <span className="font-medium text-gray-700">{maskedIdentifier}</span>
                    </p>
                  </div>

                  {/* Login Method Selection - only shown when no method selected yet */}
                  {!loginMethod && (
                    <div className="space-y-2.5">
                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full justify-start border-2 border-blue-100 py-4 text-left hover:border-blue-300 hover:bg-blue-50"
                        onClick={() => setLoginMethod('password')}
                        type="button"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100">
                            <Lock className="size-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Login with Password</p>
                            <p className="text-xs text-gray-500">Enter your password to login</p>
                          </div>
                        </div>
                      </Button>

                      <Button
                        size="lg"
                        variant="outline"
                        className="w-full justify-start border-2 border-blue-100 py-4 text-left hover:border-blue-300 hover:bg-blue-50"
                        onClick={() => {
                          resetTimer()
                          setStep(3)
                        }}
                        type="button"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-lg bg-green-100">
                            <KeyRound className="size-4 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">Login with OTP</p>
                            <p className="text-xs text-gray-500">Get a one-time password on your phone</p>
                          </div>
                        </div>
                      </Button>
                    </div>
                  )}

                  {/* Password Input Section - shown when password method is selected */}
                  {loginMethod === 'password' && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        handlePasswordSubmit()
                      }}
                      className="space-y-3"
                    >
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value)
                              if (authError) setAuthError('')
                            }}
                            className="h-11 pl-9 pr-9 text-sm"
                            autoFocus
                            disabled={authLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Account Lock Countdown */}
                      {accountLocked && (
                        <AccountLockCountdown minutes={lockMinutes} onComplete={handleLockComplete} />
                      )}

                      {/* Error message */}
                      {authError && (
                        <div className="flex items-center gap-1.5 text-sm text-red-500">
                          <Info className="size-3.5 shrink-0" />
                          {authError}
                        </div>
                      )}

                      <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-blue-600 font-semibold hover:bg-blue-700"
                        disabled={!password.trim() || authLoading || accountLocked}
                      >
                        {authLoading ? (
                          <Loader2 className="size-5 animate-spin" />
                        ) : (
                          <>
                            Login
                            <ArrowRight className="ml-1 size-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  )}

                  {/* Forgot Password - shown on both method selection and password views */}
                  <div className="text-center">
                    <button
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      onClick={goToForgotPassword}
                      type="button"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 3: OTP Verification ── */}
              {step === 3 && (
                <div className="space-y-4">
                  {/* Back button */}
                  <button
                    onClick={goBack}
                    className="flex items-center gap-1 text-sm text-gray-500 transition hover:text-gray-700"
                    type="button"
                  >
                    <ArrowLeft className="size-4" />
                    Back
                  </button>

                  <div className="text-center">
                    <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-green-100">
                      <Shield className="size-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Verify OTP</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Enter the 4-digit code sent to{' '}
                      <span className="font-medium text-gray-700">{maskedIdentifier}</span>
                    </p>
                  </div>

                  {/* 4-digit OTP Input */}
                  <div className="flex justify-center gap-3">
                    {otp.map((digit, idx) => (
                      <Input
                        key={idx}
                        ref={(el) => {
                          otpRefs.current[idx] = el
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={cn(
                          'h-14 w-14 rounded-xl border-2 text-center text-xl font-bold outline-none transition-colors',
                          digit
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-900'
                        )}
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>

                  {/* Account Lock Countdown */}
                  {accountLocked && (
                    <AccountLockCountdown minutes={lockMinutes} onComplete={handleLockComplete} />
                  )}

                  {/* Error message */}
                  {authError && (
                    <div className="flex items-center gap-1.5 text-sm text-red-500">
                      <Info className="size-3.5 shrink-0" />
                      {authError}
                    </div>
                  )}

                  <Button
                    size="lg"
                    className="w-full bg-blue-600 font-semibold hover:bg-blue-700"
                    onClick={handleOtpSubmit}
                    disabled={!otp.every((d) => d !== '') || authLoading}
                  >
                    {authLoading ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <>
                        Submit
                        <ArrowRight className="ml-1 size-4" />
                      </>
                    )}
                  </Button>

                  {/* Resend OTP */}
                  <div className="text-center">
                    {canResend ? (
                      <button
                        onClick={handleResendOtp}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                        type="button"
                      >
                        Resend OTP
                      </button>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Resend OTP in{' '}
                        <span className="font-semibold text-blue-600">{resendTimer}s</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              FORGOT PASSWORD VIEW (inline)
              ═══════════════════════════════════════════════════════════════ */}
          {authView === 'forgot-password' && (
            <div className="space-y-4">
              {/* Back button */}
              <button
                onClick={goToLogin}
                className="flex items-center gap-1 text-sm text-gray-500 transition hover:text-gray-700"
                type="button"
              >
                <ArrowLeft className="size-4" />
                Back to Login
              </button>

              <div className="text-center">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-blue-100">
                  <Mail className="size-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Forgot Password</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Enter your Institute ID and email to receive a reset link
                </p>
              </div>

              {fpSuccess ? (
                /* ── Forgot Password Success ── */
                <div className="space-y-4">
                  <div className="flex flex-col items-center rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                    <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle className="size-7 text-emerald-600" />
                    </div>
                    <h4 className="mb-1 text-base font-semibold text-emerald-900">Reset Link Sent!</h4>
                    <p className="text-sm text-emerald-700">
                      If an account exists for <strong>{fpEmail}</strong>, you will receive a password
                      reset link shortly.
                    </p>
                    <p className="mt-2 text-xs text-emerald-600">
                      The link will expire in 1 hour. Check your spam folder if you don&apos;t see it.
                    </p>
                  </div>

                  <Button
                    onClick={goToLogin}
                    className="w-full bg-blue-600 font-semibold hover:bg-blue-700"
                    size="lg"
                  >
                    Back to Login
                  </Button>
                </div>
              ) : (
                /* ── Forgot Password Form ── */
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleForgotPassword()
                  }}
                  className="space-y-4"
                >
                  {/* Institute ID */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Institute ID <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Enter your Institute ID"
                        value={fpOrgId}
                        onChange={(e) => {
                          setFpOrgId(e.target.value)
                          if (fpError) setFpError('')
                        }}
                        className="h-11 pl-9 pr-9 text-sm"
                        disabled={fpLoading}
                      />
                      {fpVerifyingOrg && (
                        <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-gray-400" />
                      )}
                    </div>
                    {fpVerifiedOrg && <VerifiedOrgBadge org={fpVerifiedOrg} />}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        value={fpEmail}
                        onChange={(e) => {
                          setFpEmail(e.target.value)
                          if (fpError) setFpError('')
                        }}
                        className="h-11 pl-9 text-sm"
                        disabled={fpLoading}
                      />
                    </div>
                  </div>

                  {/* Error message */}
                  {fpError && (
                    <div className="flex items-center gap-1.5 text-sm text-red-500">
                      <Info className="size-3.5 shrink-0" />
                      {fpError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-blue-600 font-semibold hover:bg-blue-700"
                    disabled={!fpOrgId.trim() || !fpEmail.trim() || fpLoading}
                  >
                    {fpLoading ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <>
                        Send Reset Link
                        <ArrowRight className="ml-1 size-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
