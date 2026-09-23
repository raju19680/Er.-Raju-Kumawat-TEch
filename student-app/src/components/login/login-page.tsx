'use client'

import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { setApiToken as saveApiToken } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  Hexagon,
  Triangle,
  Circle,
  Loader2,
  Clock,
  CheckCircle2,
  Building2,
  Info,
  KeyRound,
  Mail,
  Lock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
// signIn removed — using /api/auth/direct-login instead

// ── Lazy loader with retry for stale chunks ───────────────────────────────
function lazyWithRetry<T>(importFn: () => Promise<T>, retries = 2): Promise<T> {
  return importFn().catch(async (error) => {
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      String(error?.message || '').includes('Failed to load chunk') ||
      String(error?.message || '').includes('Loading chunk')
    if (isChunkError && retries > 0) {
      await new Promise((r) => setTimeout(r, 400))
      return lazyWithRetry(importFn, retries - 1)
    }
    throw error
  })
}

const TwoFactorVerify = lazy(() => lazyWithRetry(() => import('@/components/login/two-factor-verify')))



// ─── Types ──────────────────────────────────────────────────────────────────
interface OrgData {
  id: string
  name: string
  code: string
  logo: string | null
  accentColor: string
}

type AuthView = 'login' | 'forgot-password' | 'reset-password' | 'reset-success'

// ─── Account Lock Countdown Component ───────────────────────────────────────
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
    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
      <Clock className="w-5 h-5 text-red-500 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-red-700">
          Account temporarily locked
        </p>
        <p className="text-xs text-red-500">
          Try again in {mins}m {secs.toString().padStart(2, '0')}s
        </p>
      </div>
    </div>
  )
}

// ─── Last Login Toast ───────────────────────────────────────────────────────
function LastLoginToast({ lastLoginAt, onDismiss }: { lastLoginAt: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const date = new Date(lastLoginAt)
  const formatted = date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 shadow-lg max-w-[calc(100vw-2rem)]"
    >
      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-emerald-800">Welcome back!</p>
        <p className="text-xs text-emerald-600">Last login: {formatted}</p>
      </div>
      <button onClick={onDismiss} className="ml-2 text-emerald-400 hover:text-emerald-600 cursor-pointer">
        ×
      </button>
    </motion.div>
  )
}

// ─── Brand Logo ──────────────────────────────────────────────────────────────
function BrandLogo({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
  const textColor = variant === 'dark' ? 'text-white' : 'text-gray-900'
  const accentColor = variant === 'dark' ? 'text-amber-400' : 'text-amber-600'

  return (
    <div className="flex items-center gap-3">
      <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${variant === 'dark' ? 'bg-amber-500' : 'bg-amber-600'}`}>
        <GraduationCap className="w-5 h-5 text-white" />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`text-base font-bold tracking-tight ${textColor}`}>
          Er. Raju Kumawat
        </span>
        <span className={`text-xs font-semibold tracking-wider uppercase ${accentColor}`}>
          Tech
        </span>
      </div>
    </div>
  )
}

// ─── Verified Org Badge ────────────────────────────────────────────────────
function VerifiedOrgBadge({ org }: { org: OrgData }) {
  const accent = org.accentColor || '#111111'
  const initials = org.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200"
    >
      <div
        className="flex items-center justify-center w-11 h-11 rounded-lg text-white font-bold text-sm"
        style={{ backgroundColor: accent }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-emerald-900 truncate">{org.name}</p>
        <p className="text-xs text-emerald-600">Institute verified</p>
      </div>
      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
    </motion.div>
  )
}

// ─── Password Strength Indicator ────────────────────────────────────────────
function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', feedback: [] as string[] }

    const feedback: string[] = []
    let metCount = 0

    if (password.length >= 8) metCount++; else feedback.push('8+ characters')
    if (/[A-Z]/.test(password)) metCount++; else feedback.push('uppercase letter')
    if (/[a-z]/.test(password)) metCount++; else feedback.push('lowercase letter')
    if (/\d/.test(password)) metCount++; else feedback.push('number')
    if (/[^A-Za-z0-9]/.test(password)) metCount++; else feedback.push('special character')

    let score: number
    let label: string
    if (metCount <= 0) { score = 0; label = 'very-weak' }
    else if (metCount <= 2) { score = 1; label = 'weak' }
    else if (metCount === 3) { score = 2; label = 'fair' }
    else if (metCount === 4) { score = 3; label = 'good' }
    else { score = 4; label = 'strong' }

    return { score, label, feedback }
  }, [password])

  if (!password) return null

  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-400', 'bg-emerald-600']
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  const textColors = ['text-red-600', 'text-orange-600', 'text-yellow-600', 'text-emerald-500', 'text-emerald-700']

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= strength.score ? colors[strength.score] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <span className={`text-xs font-medium ${textColors[strength.score]}`}>
          {labels[strength.score]}
        </span>
        {strength.feedback.length > 0 && strength.score < 4 && (
          <span className="text-xs text-gray-400">
            Need: {strength.feedback.join(', ')}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Decorative Geometric Patterns ───────────────────────────────────────────
function GeometricPatterns() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-amber-600/8 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-amber-400/5 blur-2xl" />
      <motion.div
        className="absolute top-[15%] right-[12%]"
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
      >
        <Hexagon className="w-16 h-16 text-amber-500/10 stroke-amber-500/20" strokeWidth={1} />
      </motion.div>
      <motion.div
        className="absolute bottom-[25%] left-[15%]"
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      >
        <Triangle className="w-12 h-12 text-amber-400/10 stroke-amber-400/20" strokeWidth={1} />
      </motion.div>
      <motion.div
        className="absolute top-[55%] right-[20%]"
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Circle className="w-8 h-8 text-amber-300/10 stroke-amber-300/20" strokeWidth={1} />
      </motion.div>
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  )
}

// ─── Left Panel Content (shared across views) ────────────────────────────────
function LeftPanel({ title, subtitle, features }: { title: React.ReactNode; subtitle: string; features: string[] }) {
  return (
    <div className="hidden lg:flex lg:w-[45%] relative bg-[#111827] overflow-hidden flex-col">
      <GeometricPatterns />

      {/* Logo */}
      <div className="relative z-10 p-8">
        <BrandLogo variant="dark" />
      </div>

      {/* Center content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-md text-center lg:text-left"
        >
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight">
            {title}
          </h1>
          <p className="mt-5 text-lg text-gray-400 leading-relaxed">
            {subtitle}
          </p>

          {features.length > 0 && (
            <div className="mt-10 space-y-4">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                  </div>
                  <span className="text-gray-300 text-sm">{feature}</span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Copyright */}
      <div className="relative z-10 p-8">
        <p className="text-xs text-gray-600">
          &copy; {new Date().getFullYear()} Er. Raju Kumawat Tech. All Rights Reserved.
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Login Page Component
// ═══════════════════════════════════════════════════════════════════════════
interface LoginPageProps {
  initialError?: string
}

export default function LoginPage({ initialError }: LoginPageProps = {}) {
  const loginToStore = useAppStore((s) => s.login)
  const setCurrentView = useAppStore((s) => s.setCurrentView)

  // ── Auth view state ──
  const [authView, setAuthView] = useState<AuthView>('login')
  const [resetToken, setResetToken] = useState('')
  const [resetUser, setResetUser] = useState<{ name: string; email: string } | null>(null)
  const [tokenValidating, setTokenValidating] = useState(false)
  const [tokenError, setTokenError] = useState('')

  // ── Track if reset came from student portal ──
  const [resetSource, setResetSource] = useState<string | null>(null)

  // Form fields - Login (initialized with clean defaults for SSR hydration safety)
  const [orgId, setOrgId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [captchaChecked, setCaptchaChecked] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState(initialError || '')

  // Org verification state
  const [verifiedOrg, setVerifiedOrg] = useState<OrgData | null>(null)
  const [verifyingOrg, setVerifyingOrg] = useState(false)
  const [orgNotFound, setOrgNotFound] = useState(false)

  // Security features state
  const [rememberMe, setRememberMe] = useState(false)

  // ── Load remembered values safely after mount (prevents SSR hydration mismatch) ──
  useEffect(() => {
    try {
      const savedOrgId = localStorage.getItem('erkt_remembered_orgId')
      const savedEmail = localStorage.getItem('erkt_remembered_email')
      if (savedOrgId) setOrgId(savedOrgId)
      if (savedEmail) {
        setEmail(savedEmail)
        setRememberMe(true)
      }
    } catch {}
  }, [])
  const [accountLocked, setAccountLocked] = useState(false)
  const [lockMinutes, setLockMinutes] = useState(0)
  const [lastLoginAt, setLastLoginAt] = useState<string | null>(null)

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false)
  const [twoFactorEmail, setTwoFactorEmail] = useState('')

  // ── Forgot Password state ──
  const [fpOrgId, setFpOrgId] = useState('')
  const [fpEmail, setFpEmail] = useState('')
  const [fpLoading, setFpLoading] = useState(false)
  const [fpError, setFpError] = useState('')
  const [fpSuccess, setFpSuccess] = useState(false)
  const [fpVerifiedOrg, setFpVerifiedOrg] = useState<OrgData | null>(null)
  const [fpVerifyingOrg, setFpVerifyingOrg] = useState(false)

  // ── Reset Password state ──
  const [rpPassword, setRpPassword] = useState('')
  const [rpConfirmPassword, setRpConfirmPassword] = useState('')
  const [rpShowPassword, setRpShowPassword] = useState(false)
  const [rpShowConfirm, setRpShowConfirm] = useState(false)
  const [rpLoading, setRpLoading] = useState(false)
  const [rpError, setRpError] = useState('')

  // ── Check for existing session & restore login state on mount ──
  useEffect(() => {
    if (typeof window === 'undefined') return

    const restoreSession = async () => {
      try {
        // ── FAST PATH: Check localStorage for persisted auth state ──
        // This is the most reliable method in cross-origin preview
        const savedToken = localStorage.getItem('erkt_api_token')
        const savedStore = localStorage.getItem('erkt-auth-store')
        
        if (savedStore) {
          try {
            const storeData = JSON.parse(savedStore)
            if (storeData.isAuthenticated && storeData.orgCode && savedToken) {
              // We have both persisted auth state AND a token
              // Restore directly without API call
              if (savedToken) {
                saveApiToken(savedToken)
              }
              loginToStore(
                storeData.orgCode || '',
                storeData.orgName || 'Er. Raju Kumawat Tech',
                storeData.userName || '',
                storeData.userEmail || '',
                storeData.userRole || '',
                storeData.loginMode || 'cms'
              )
              return // Don't continue to API call
            }
          } catch {}
        }

        // ── FALLBACK: Call /api/auth/me with token header ──
        if (savedToken) {
          try {
            const res = await fetch('/api/auth/me', {
              headers: { 'x-auth-token': savedToken },
              credentials: 'include',
            })
            const data = await res.json()
            if (data.authenticated && data.user) {
              const u = data.user
              const loginMode = u.role === 'platform_admin' ? 'admin' : u.role === 'student' ? 'student' : 'cms'
              saveApiToken(savedToken)
              loginToStore(
                u.orgCode || '',
                u.orgName || 'Er. Raju Kumawat Tech',
                u.name || '',
                u.email || '',
                u.role || '',
                loginMode
              )
              return
            }
          } catch {}
        }

        // ── LAST FALLBACK: Try without token (cookie-based) ──
        const res = await fetch('/api/auth/me', { credentials: 'include' })
        const data = await res.json()
        if (data.authenticated && data.user) {
          const u = data.user
          const loginMode = u.role === 'platform_admin' ? 'admin' : u.role === 'student' ? 'student' : 'cms'
          try {
            const tokenRes = await fetch('/api/auth/session-token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: u.email, orgId: u.organizationId || u.orgId }),
            })
            const tokenData = await tokenRes.json()
            if (tokenData.success && tokenData.token) {
              saveApiToken(tokenData.token)
            }
          } catch {}
          loginToStore(
            u.orgCode || '',
            u.orgName || 'Er. Raju Kumawat Tech',
            u.name || '',
            u.email || '',
            u.role || '',
            loginMode
          )
        }
      } catch {
        // No valid session, stay on login page
      }
    }

    restoreSession()
  }, [])

  // ── Check for reset token in URL on mount ──
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check for forgot-password redirect flag from other portals
    const showForgotPassword = sessionStorage.getItem('erkt_show_forgot_password')
    if (showForgotPassword === 'true') {
      sessionStorage.removeItem('erkt_show_forgot_password')
      setAuthView('forgot-password')
      return
    }

    const params = new URLSearchParams(window.location.search)
    const token = params.get('reset_token')
    const source = params.get('source')

    if (token) {
      setResetToken(token)
      setAuthView('reset-password')
      setTokenValidating(true)

      // Track the source (e.g., 'student') so we can redirect back after reset
      if (source) {
        setResetSource(source)
      }

      // Validate the token
      fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            setResetUser(data.user)
            setTokenError('')
          } else {
            setTokenError(data.error || 'This reset link is invalid or has expired.')
          }
        })
        .catch(() => {
          setTokenError('Failed to validate reset link. Please try again.')
        })
        .finally(() => {
          setTokenValidating(false)
        })

      // Clean the URL
      window.history.replaceState({}, '', '/')
    }
  }, [])

  // ── Verify org when orgId changes (login form - debounced) ──
  useEffect(() => {
    const trimmed = orgId.trim()
    if (!trimmed) {
      setVerifiedOrg(null)
      setOrgNotFound(false)
      return
    }

    setOrgNotFound(false)
    const timer = setTimeout(async () => {
      setVerifyingOrg(true)
      try {
        const res = await fetch('/api/auth/verify-org', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orgCode: trimmed }),
        })
        const data = await res.json()
        if (data.success && data.organization) {
          setVerifiedOrg(data.organization)
          setOrgNotFound(false)
        } else {
          setVerifiedOrg(null)
          setOrgNotFound(true)
        }
      } catch {
        setVerifiedOrg(null)
        setOrgNotFound(true)
      } finally {
        setVerifyingOrg(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [orgId])

  // ── Verify org for forgot password form (debounced) ──
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

  // ── Lock countdown complete ──
  const handleLockComplete = useCallback(() => {
    setAccountLocked(false)
    setLockMinutes(0)
  }, [])

  // ── Dismiss last login toast ──
  const dismissLastLogin = useCallback(() => {
    setLastLoginAt(null)
  }, [])

  // ── Handle 2FA Verified ──
  const handle2FAVerifyCode = useCallback(async (code: string): Promise<{ success: boolean; error?: string }> => {
    setAuthLoading(true)
    try {
      const res = await fetch('/api/auth/direct-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: twoFactorEmail,
          password: password,
          orgId: orgId.trim(),
          twoFactorCode: code,
        }),
      })
      const data = await res.json()

      if (!data.success) {
        setAuthLoading(false)
        return { success: false, error: data.message || 'Invalid verification code' }
      }

      const u = data.user
      // CRITICAL: Save API token to localStorage BEFORE loginToStore()
      if (data.apiToken) {
        saveApiToken(data.apiToken)
      } else {
        try {
          const tokenRes = await fetch('/api/auth/session-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: u.email, orgId: u.orgId }),
          })
          const tokenData = await tokenRes.json()
          if (tokenData.success && tokenData.token) {
            saveApiToken(tokenData.token)
          }
        } catch {}
      }
      // NOW log in to store (this triggers view change to dashboard)
      loginToStore(
        u.orgCode || '',
        u.orgName || 'Er. Raju Kumawat Tech',
        u.name || twoFactorEmail.split('@')[0],
        u.email || twoFactorEmail,
        u.role || '',
        u.loginMode || ''
      )

      setAuthLoading(false)
      return { success: true }
    } catch {
      setAuthLoading(false)
      return { success: false, error: 'Verification failed. Please try again.' }
    }
  }, [twoFactorEmail, password, orgId, loginToStore])



  // ── Handle Login ──
  const handleLogin = async () => {
    if (!orgId.trim()) {
      setAuthError('Please enter your Institute ID')
      return
    }
    if (verifyingOrg) {
      setAuthError('Please wait while we verify your Institute ID.')
      return
    }
    if (!verifiedOrg) {
      setAuthError('Invalid Institute ID. Please check and try again.')
      return
    }
    if (!email.trim()) {
      setAuthError('Please enter your email')
      return
    }
    if (!password.trim()) {
      setAuthError('Please enter your password')
      return
    }
    if (!captchaChecked) {
      setAuthError('Please verify the captcha')
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
          setRequires2FA(true)
          setTwoFactorEmail(email.trim().toLowerCase())
          setAuthLoading(false)
          return
        }
        if (data.message?.includes('temporarily locked')) {
          const minutesMatch = data.message.match(/(\d+)\s*minute/)
          const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 15
          setAccountLocked(true)
          setLockMinutes(minutes)
        }
        setAuthError(data.message || 'Invalid email or password')
        setAuthLoading(false)
        return
      }

      try {
        if (rememberMe) {
          localStorage.setItem('erkt_remembered_email', email.trim().toLowerCase())
          localStorage.setItem('erkt_remembered_orgId', orgId.trim())
        } else {
          localStorage.removeItem('erkt_remembered_email')
          localStorage.removeItem('erkt_remembered_orgId')
        }
      } catch {
        // localStorage not available
      }

      // Login succeeded - use returned user data directly
      const u = data.user

      // CRITICAL: Save API token to localStorage BEFORE loginToStore()
      // The token comes directly from the login response (no second request needed)
      if (data.apiToken) {
        saveApiToken(data.apiToken)
      } else {
        // Fallback: fetch token from session-token API
        try {
          const tokenRes = await fetch('/api/auth/session-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: u.email, orgId: u.orgId }),
          })
          const tokenData = await tokenRes.json()
          if (tokenData.success && tokenData.token) {
            saveApiToken(tokenData.token)
          }
        } catch {}
      }

      // NOW log in to store (this triggers view change to dashboard)
      loginToStore(
        u.orgCode || '',
        u.orgName || 'Er. Raju Kumawat Tech',
        u.name || email.trim().split('@')[0],
        u.email || email.trim().toLowerCase(),
        u.role || '',
        u.loginMode || ''
      )

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
    if (fpVerifyingOrg) {
      setFpError('Please wait while we verify your Institute ID.')
      return
    }
    if (!fpVerifiedOrg) {
      setFpError('Invalid Institute ID. Please check and try again.')
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

  // ── Handle Reset Password ──
  const handleResetPassword = async () => {
    if (!rpPassword) {
      setRpError('Please enter a new password')
      return
    }
    if (rpPassword.length < 8) {
      setRpError('Password must be at least 8 characters long')
      return
    }
    if (rpPassword !== rpConfirmPassword) {
      setRpError('Passwords do not match')
      return
    }

    setRpLoading(true)
    setRpError('')

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          password: rpPassword,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setAuthView('reset-success')
      } else {
        setRpError(data.error || 'Failed to reset password. Please try again.')
      }
    } catch {
      setRpError('Network error. Please check your connection and try again.')
    } finally {
      setRpLoading(false)
    }
  }

  // ── Handle Enter key ──
  const handleLoginKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }
  const handleFpKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleForgotPassword()
  }
  const handleRpKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleResetPassword()
  }

  // ── Navigate to forgot password ──
  const goToForgotPassword = () => {
    setAuthView('forgot-password')
    // Pre-fill orgId if already entered on login
    if (orgId.trim()) setFpOrgId(orgId.trim())
    if (email.trim()) setFpEmail(email.trim())
    setFpError('')
    setFpSuccess(false)
  }

  // ── Navigate back to login ──
  const goToLogin = () => {
    // If the reset came from the student portal, redirect there instead of the main login form
    if (resetSource === 'student') {
      sessionStorage.setItem('erkt_open_student_login', 'true')
      setCurrentView('student')
      setResetSource(null)
      return
    }
    setAuthView('login')
    setAuthError('')
  }

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: Login Form
  // ═══════════════════════════════════════════════════════════════════════
  const renderLoginForm = () => (
    <div className="flex-1 lg:w-[55%] flex flex-col bg-white min-h-screen">
      {/* Logo – top */}
      <div className="flex items-center justify-between p-4 sm:p-6 lg:p-8 lg:justify-end">
        <div className="lg:hidden"><BrandLogo variant="light" /></div>
        <div className="hidden lg:block"><BrandLogo variant="light" /></div>
      </div>

      {/* Form container */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-20 pb-8 sm:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-50 border border-amber-100">
                <Building2 className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Sign In</h2>
                <p className="text-xs sm:text-sm text-gray-500">Access your portal</p>
              </div>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin() }} className="space-y-4 sm:space-y-5">
            {/* Institute ID */}
            <div className="space-y-2">
              <Label htmlFor="orgId" className="text-sm font-medium text-gray-700">
                Institute ID <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="orgId"
                  type="text"
                  placeholder=""
                  value={orgId}
                  onChange={(e) => { setOrgId(e.target.value); if (authError) setAuthError('') }}
                  onKeyDown={handleLoginKeyDown}
                  className="h-12 rounded-xl border-gray-200 bg-gray-50/50 text-base pl-11 pr-10 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                  disabled={authLoading}
                  autoFocus
                  autoComplete="organization"
                  required
                />
                {verifyingOrg && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
              </div>
              {/* Show verification error when orgId is verified and not found */}
              {orgNotFound && !verifyingOrg && !verifiedOrg && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">Institute ID not found. Please check and try again.</p>
                </div>
              )}
              <AnimatePresence>{verifiedOrg && <VerifiedOrgBadge org={verifiedOrg} />}</AnimatePresence>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (authError) setAuthError('') }}
                onKeyDown={handleLoginKeyDown}
                className="h-12 rounded-xl border-gray-200 bg-gray-50/50 text-base px-4 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                disabled={authLoading}
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (authError) setAuthError('') }}
                  onKeyDown={handleLoginKeyDown}
                  className="h-12 rounded-xl border-gray-200 bg-gray-50/50 text-base px-4 pr-12 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                  disabled={authLoading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember-me"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                  className="w-4 h-4 rounded data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                />
                <Label htmlFor="remember-me" className="text-xs sm:text-sm text-gray-600 font-normal cursor-pointer select-none">
                  Remember me
                </Label>
              </div>
              <button
                type="button"
                className="text-xs sm:text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors cursor-pointer whitespace-nowrap"
                onClick={goToForgotPassword}
              >
                Forgot Password?
              </button>
            </div>

            {/* Account Lock Countdown */}
            {accountLocked && <AccountLockCountdown minutes={lockMinutes} onComplete={handleLockComplete} />}

            {/* Captcha */}
            <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border border-gray-200 bg-gray-50/50">
              <Checkbox
                id="captcha"
                checked={captchaChecked}
                onCheckedChange={(checked) => { setCaptchaChecked(checked === true); if (authError) setAuthError('') }}
                className="w-5 h-5 rounded data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
              />
              <Label htmlFor="captcha" className="text-sm text-gray-600 font-normal cursor-pointer select-none flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gray-400" />
                I&apos;m not a robot
              </Label>
              <div className="ml-auto flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-gray-300" />
                <div className="w-1 h-1 rounded-full bg-gray-300" />
                <div className="w-1 h-1 rounded-full bg-gray-300" />
              </div>
            </div>

            {/* Error message */}
            {authError && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 flex-shrink-0" />
                {authError}
              </motion.p>
            )}

            {/* Sign In button */}
            <Button
              type="submit"
              disabled={authLoading || accountLocked}
              className="w-full h-12 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors cursor-pointer"
            >
              {authLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </form>

          {/* Footer text */}
          <div className="mt-6 sm:mt-10 pt-4 sm:pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              By signing in, you agree to our{' '}
              <span className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors">Terms of Service</span>{' '}
              and{' '}
              <span className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors">Privacy Policy</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Mobile-only copyright */}
      <div className="lg:hidden p-4 sm:p-6">
        <p className="text-xs text-gray-400 text-center">
          &copy; {new Date().getFullYear()} Er. Raju Kumawat Tech. All Rights Reserved.
        </p>
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: Forgot Password Form
  // ═══════════════════════════════════════════════════════════════════════
  const renderForgotPasswordForm = () => (
    <div className="flex-1 lg:w-[55%] flex flex-col bg-white min-h-screen">
      <div className="flex items-center justify-between p-4 sm:p-6 lg:p-8 lg:justify-end">
        <div className="lg:hidden"><BrandLogo variant="light" /></div>
        <div className="hidden lg:block"><BrandLogo variant="light" /></div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-20 pb-8 sm:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Back button */}
          <button
            type="button"
            onClick={goToLogin}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </button>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-50 border border-amber-100">
                <Mail className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Forgot Password</h2>
                <p className="text-xs sm:text-sm text-gray-500">Reset your password via email</p>
              </div>
            </div>
          </div>

          {fpSuccess ? (
            /* ── Success State ── */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 sm:space-y-5"
            >
              <div className="flex flex-col items-center text-center p-4 sm:p-6 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-emerald-900 mb-2">Reset Link Sent!</h3>
                <p className="text-sm text-emerald-700 leading-relaxed">
                  If an account exists for <strong>{fpEmail}</strong>, you will receive a password reset link shortly.
                </p>
                <p className="text-xs text-emerald-600 mt-3">
                  The link will expire in 1 hour. Check your spam folder if you don&apos;t see it.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-amber-800 font-medium">Development Mode</p>
                    <p className="text-xs text-amber-600 mt-1">
                      Since email sending is log-based in development, the reset link is also logged to the server console. 
                      Check your terminal for the reset token, or use the Email Log in admin panel.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={goToLogin}
                className="w-full h-12 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors cursor-pointer"
              >
                Back to Sign In
              </Button>
            </motion.div>
          ) : (
            /* ── Forgot Password Form ── */
            <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword() }} className="space-y-4 sm:space-y-5">
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                Enter your Institute ID and email address. We&apos;ll send you a link to reset your password.
              </p>

              {/* Institute ID */}
              <div className="space-y-2">
                <Label htmlFor="fp-orgId" className="text-sm font-medium text-gray-700">
                  Institute ID <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="fp-orgId"
                    type="text"
                    placeholder="Enter your Institute ID"
                    value={fpOrgId}
                    onChange={(e) => { setFpOrgId(e.target.value); if (fpError) setFpError('') }}
                    onKeyDown={handleFpKeyDown}
                    className="h-12 rounded-xl border-gray-200 bg-gray-50/50 text-base pl-11 pr-10 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                    disabled={fpLoading}
                    autoFocus
                    required
                  />
                  {fpVerifyingOrg && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />}
                </div>
                {/* Show verification error when fpOrgId is typed but not verified */}
                {fpOrgId.trim() && !fpVerifyingOrg && !fpVerifiedOrg && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700">Institute ID not found. Please check and try again.</p>
                  </div>
                )}
                <AnimatePresence>{fpVerifiedOrg && <VerifiedOrgBadge org={fpVerifiedOrg} />}</AnimatePresence>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="fp-email" className="text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="fp-email"
                    type="email"
                    placeholder="Enter your email"
                    value={fpEmail}
                    onChange={(e) => { setFpEmail(e.target.value); if (fpError) setFpError('') }}
                    onKeyDown={handleFpKeyDown}
                    className="h-12 rounded-xl border-gray-200 bg-gray-50/50 text-base pl-11 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                    disabled={fpLoading}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Error */}
              {fpError && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-500 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  {fpError}
                </motion.p>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={fpLoading}
                className="w-full h-12 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors cursor-pointer"
              >
                {fpLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Send Reset Link <ArrowRight className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </form>
          )}
        </motion.div>
      </div>

      <div className="lg:hidden p-4 sm:p-6">
        <p className="text-xs text-gray-400 text-center">
          &copy; {new Date().getFullYear()} Er. Raju Kumawat Tech. All Rights Reserved.
        </p>
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: Reset Password Form
  // ═══════════════════════════════════════════════════════════════════════
  const renderResetPasswordForm = () => (
    <div className="flex-1 lg:w-[55%] flex flex-col bg-white min-h-screen">
      <div className="flex items-center justify-between p-4 sm:p-6 lg:p-8 lg:justify-end">
        <div className="lg:hidden"><BrandLogo variant="light" /></div>
        <div className="hidden lg:block"><BrandLogo variant="light" /></div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-20 pb-8 sm:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-50 border border-amber-100">
                <Lock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Reset Password</h2>
                <p className="text-xs sm:text-sm text-gray-500">Create a new password</p>
              </div>
            </div>
          </div>

          {tokenValidating ? (
            /* ── Token validation loading ── */
            <div className="flex flex-col items-center py-12">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
              <p className="text-sm text-gray-500">Verifying reset link...</p>
            </div>
          ) : tokenError ? (
            /* ── Invalid/expired token ── */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 sm:space-y-5"
            >
              <div className="flex flex-col items-center text-center p-6 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">Invalid Link</h3>
                <p className="text-sm text-red-700 leading-relaxed">{tokenError}</p>
              </div>

              <Button
                onClick={() => { setAuthView('forgot-password'); setTokenError('') }}
                className="w-full h-12 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors cursor-pointer"
              >
                Request New Reset Link
              </Button>

              <button
                type="button"
                onClick={goToLogin}
                className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            </motion.div>
          ) : (
            /* ── Reset Password Form ── */
            <form onSubmit={(e) => { e.preventDefault(); handleResetPassword() }} className="space-y-4 sm:space-y-5">
              {resetUser && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <p className="text-xs sm:text-sm text-emerald-800 break-words">
                    Resetting password for <strong>{resetUser.name}</strong> ({resetUser.email})
                  </p>
                </div>
              )}

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="rp-password" className="text-sm font-medium text-gray-700">
                  New Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="rp-password"
                    type={rpShowPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={rpPassword}
                    onChange={(e) => { setRpPassword(e.target.value); if (rpError) setRpError('') }}
                    onKeyDown={handleRpKeyDown}
                    className="h-12 rounded-xl border-gray-200 bg-gray-50/50 text-base px-4 pr-12 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                    disabled={rpLoading}
                    autoFocus
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setRpShowPassword(!rpShowPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {rpShowPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <PasswordStrengthIndicator password={rpPassword} />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="rp-confirm" className="text-sm font-medium text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="rp-confirm"
                    type={rpShowConfirm ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={rpConfirmPassword}
                    onChange={(e) => { setRpConfirmPassword(e.target.value); if (rpError) setRpError('') }}
                    onKeyDown={handleRpKeyDown}
                    className="h-12 rounded-xl border-gray-200 bg-gray-50/50 text-base px-4 pr-12 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                    disabled={rpLoading}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setRpShowConfirm(!rpShowConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {rpShowConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {rpConfirmPassword && rpPassword && rpConfirmPassword !== rpPassword && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Passwords do not match
                  </p>
                )}
                {rpConfirmPassword && rpPassword && rpConfirmPassword === rpPassword && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Passwords match
                  </p>
                )}
              </div>

              {/* Error */}
              {rpError && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-red-500 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  {rpError}
                </motion.p>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={rpLoading}
                className="w-full h-12 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors cursor-pointer"
              >
                {rpLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Reset Password <ArrowRight className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </form>
          )}
        </motion.div>
      </div>

      <div className="lg:hidden p-4 sm:p-6">
        <p className="text-xs text-gray-400 text-center">
          &copy; {new Date().getFullYear()} Er. Raju Kumawat Tech. All Rights Reserved.
        </p>
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER: Reset Password Success
  // ═══════════════════════════════════════════════════════════════════════
  const renderResetSuccess = () => (
    <div className="flex-1 lg:w-[55%] flex flex-col bg-white min-h-screen">
      <div className="flex items-center justify-between p-4 sm:p-6 lg:p-8 lg:justify-end">
        <div className="lg:hidden"><BrandLogo variant="light" /></div>
        <div className="hidden lg:block"><BrandLogo variant="light" /></div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-20 pb-8 sm:pb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="flex flex-col items-center text-center p-6 sm:p-8 rounded-2xl bg-emerald-50 border border-emerald-200">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6"
            >
              <CheckCircle className="w-11 h-11 text-emerald-600" />
            </motion.div>
            <h2 className="text-xl sm:text-2xl font-bold text-emerald-900 mb-3">Password Reset!</h2>
            <p className="text-sm text-emerald-700 leading-relaxed mb-6">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <Button
              onClick={goToLogin}
              className="w-full sm:w-auto h-12 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium transition-colors cursor-pointer px-8"
            >
              Sign In Now <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </motion.div>
      </div>

      <div className="lg:hidden p-4 sm:p-6">
        <p className="text-xs text-gray-400 text-center">
          &copy; {new Date().getFullYear()} Er. Raju Kumawat Tech. All Rights Reserved.
        </p>
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════════════════════════
  // Main Render — switch between views
  // ═══════════════════════════════════════════════════════════════════════
  const leftPanelConfig = {
    'login': {
      title: <>Ignite your{' '}<span className="bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">Digital Journey</span></>,
      subtitle: 'Empower your teaching with our comprehensive education platform',
      features: ['Create & manage courses effortlessly', 'Track student progress in real-time', 'Conduct tests with detailed analytics'],
    },
    'forgot-password': {
      title: <>Lost your{' '}<span className="bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">Password?</span></>,
      subtitle: 'Don\'t worry, it happens to the best of us. We\'ll help you get back on track.',
      features: ['Secure password reset via email', 'Reset link expires in 1 hour', 'Your account stays safe during the process'],
    },
    'reset-password': {
      title: <>Set a new{' '}<span className="bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">Password</span></>,
      subtitle: 'Choose a strong password to keep your account secure.',
      features: ['Minimum 8 characters required', 'Mix of letters, numbers & symbols', 'We\'ll confirm when it\'s all set'],
    },
    'reset-success': {
      title: <>You&apos;re all{' '}<span className="bg-gradient-to-r from-amber-400 to-amber-300 bg-clip-text text-transparent">Set!</span></>,
      subtitle: 'Your password has been reset. Sign in to continue your journey.',
      features: ['Password updated successfully', 'Account security restored', 'Ready to access your portal'],
    },
  }

  const currentConfig = leftPanelConfig[authView]

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <LeftPanel
        title={currentConfig.title}
        subtitle={currentConfig.subtitle}
        features={currentConfig.features}
      />

      {/* RIGHT PANEL — switches based on authView */}
      {authView === 'login' && renderLoginForm()}
      {authView === 'forgot-password' && renderForgotPasswordForm()}
      {authView === 'reset-password' && renderResetPasswordForm()}
      {authView === 'reset-success' && renderResetSuccess()}

      {/* 2FA Verification Overlay */}
      {requires2FA && (
        <Suspense fallback={null}>
          <TwoFactorVerify
            email={twoFactorEmail}
            onVerifyCode={handle2FAVerifyCode}
            onBack={() => {
              setRequires2FA(false)
              setTwoFactorEmail('')
              setAuthError('')
            }}
          />
        </Suspense>
      )}

      {/* Last Login Toast */}
      <AnimatePresence>
        {lastLoginAt && <LastLoginToast lastLoginAt={lastLoginAt} onDismiss={dismissLastLogin} />}
      </AnimatePresence>
    </div>
  )
}
