'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, ArrowRight, Eye, EyeOff, Loader2,
  CheckCircle2, KeyRound, Info, Building2, Hexagon, Triangle, Circle,
  UserPlus, Lock, Mail, BookOpen, Trophy, ClipboardList,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
// signIn removed — using /api/auth/direct-login instead

// ─── Types ──────────────────────────────────────────────────────────────────
interface OrgData {
  id: string
  name: string
  code: string
  logo: string | null
  accentColor: string
}

interface StudentLoginProps {
  onNavigateToSignup: () => void
  onNavigateToForgotPassword: (orgId?: string, email?: string) => void
  onNavigateToResetPassword: (token: string) => void
}

// ─── Verified Org Badge ────────────────────────────────────────────────────
function VerifiedOrgBadge({ org }: { org: OrgData }) {
  const accent = org.accentColor || '#D97706'
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

// ─── Decorative Geometric Patterns ───────────────────────────────────────────
function GeometricPatterns() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-orange-400/8 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-amber-300/5 blur-2xl" />
      <motion.div
        className="absolute top-[15%] right-[12%]"
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
      >
        <Hexagon className="w-16 h-16 text-amber-300/10 stroke-amber-300/20" strokeWidth={1} />
      </motion.div>
      <motion.div
        className="absolute bottom-[25%] left-[15%]"
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      >
        <Triangle className="w-12 h-12 text-orange-300/10 stroke-orange-300/20" strokeWidth={1} />
      </motion.div>
      <motion.div
        className="absolute top-[55%] right-[20%]"
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Circle className="w-8 h-8 text-amber-200/10 stroke-amber-200/20" strokeWidth={1} />
      </motion.div>
      <div
        className="absolute top-0 left-0 w-full h-full opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  )
}

// ─── Left Panel ──────────────────────────────────────────────────────────────
function LeftPanel() {
  const features = [
    'Access your enrolled courses anytime',
    'Take mock tests and track progress',
    'View detailed performance analytics',
    'Get instant notifications & updates',
  ]

  return (
    <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-amber-600 via-orange-500 to-amber-700 overflow-hidden flex-col">
      <GeometricPatterns />

      {/* Logo */}
      <div className="relative z-10 p-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/20 backdrop-blur-sm">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold text-white tracking-tight">Er. Raju Kumawat</span>
            <span className="text-xs font-semibold tracking-wider uppercase text-amber-200">Student Portal</span>
          </div>
        </div>
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
            Welcome Back, Student!
          </h1>
          <p className="mt-5 text-lg text-amber-100/80 leading-relaxed">
            Sign in to access your learning dashboard, track progress, and continue your educational journey.
          </p>

          <div className="mt-10 space-y-4">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
                className="flex items-center gap-3"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span className="text-amber-50 text-sm">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10 p-8">
        <p className="text-xs text-amber-200/60">
          &copy; {new Date().getFullYear()} Er. Raju Kumawat Tech. All Rights Reserved.
        </p>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function StudentLogin({ onNavigateToSignup, onNavigateToForgotPassword, onNavigateToResetPassword }: StudentLoginProps) {
  const loginToStore = useAppStore((s) => s.login)
  const checkoutIntent = useAppStore((s) => s.checkoutIntent)
  const setCheckoutIntent = useAppStore((s) => s.setCheckoutIntent)
  const openCheckout = useAppStore((s) => s.openCheckout)

  // Form fields
  const [orgId, setOrgId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  // Org verification
  const [verifiedOrg, setVerifiedOrg] = useState<OrgData | null>(null)
  const [verifyingOrg, setVerifyingOrg] = useState(false)

  // Check for reset token in URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const token = params.get('reset_token')
    if (token) {
      onNavigateToResetPassword(token)
      window.history.replaceState({}, '', '/')
    }
  }, [onNavigateToResetPassword])

  // Debounced org verification
  useEffect(() => {
    // If we have a hardcoded default org code from environment, use it instantly.
    const defaultOrgCode = process.env.NEXT_PUBLIC_DEFAULT_ORG_CODE
    if (defaultOrgCode && !verifiedOrg) {
      setOrgId(defaultOrgCode)
      setVerifyingOrg(true)
      fetch(`/api/auth/verify-org?code=${defaultOrgCode}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setVerifiedOrg(data.org)
            useAppStore.setState({ orgCode: data.org.code, orgName: data.org.name })
          }
        })
        .finally(() => setVerifyingOrg(false))
      return
    }

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
        setVerifiedOrg(data.success ? data.organization : null)
      } catch {
        setVerifiedOrg(null)
      } finally {
        setVerifyingOrg(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [orgId])



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

      // Save API token directly from login response
      if (data.apiToken) {
        useAppStore.getState().setApiToken(data.apiToken)
      }

      loginToStore(
        u.orgCode || '',
        u.orgName || 'Er. Raju Kumawat Tech',
        u.name || email.trim().split('@')[0],
        email.trim(),
        u.role || 'student',
        u.loginMode || 'student'
      )
      
      // Handle checkout intent
      if (checkoutIntent && (u.role === 'student' || u.role === 'user' || !u.role)) {
        const intent = checkoutIntent;
        setCheckoutIntent(null);
        setTimeout(() => {
          openCheckout(intent);
        }, 500);
      }

      if (!data.apiToken) {
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
      }

      setAuthLoading(false)
    } catch {
      setAuthError('Something went wrong. Please try again.')
      setAuthLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <LeftPanel />

      {/* Right Panel - Login Form */}
      <div className="flex-1 lg:w-[55%] flex flex-col bg-white min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden p-6 flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-600">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold text-gray-900 tracking-tight">Er. Raju Kumawat</span>
            <span className="text-xs font-semibold tracking-wider uppercase text-amber-600">Student Portal</span>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-20 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full max-w-md"
          >
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-50 border border-amber-100">
                  <Lock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Sign In</h2>
                  <p className="text-sm text-gray-500">Access your student portal</p>
                </div>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleLogin() }} className="space-y-5">
              {/* Institute ID */}
              {!process.env.NEXT_PUBLIC_DEFAULT_ORG_CODE && (
                <div className="space-y-2">
                  <Label htmlFor="student-orgId" className="text-sm font-medium text-gray-700">
                    Institute ID <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="student-orgId"
                      type="text"
                      placeholder="Enter institute code"
                      value={orgId}
                      onChange={(e) => { setOrgId(e.target.value); if (authError) setAuthError('') }}
                      className="h-12 rounded-xl border-gray-200 bg-gray-50/50 text-base pl-11 pr-10 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                      disabled={authLoading}
                      autoFocus
                      autoComplete="organization"
                      required
                    />
                    {verifyingOrg && (
                      <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                    )}
                  </div>
                  <AnimatePresence>
                    {verifiedOrg && <VerifiedOrgBadge org={verifiedOrg} />}
                  </AnimatePresence>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="student-email" className="text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="student-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (authError) setAuthError('') }}
                    className="h-12 rounded-xl border-gray-200 bg-gray-50/50 text-base pl-11 pr-4 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                    disabled={authLoading}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="student-password" className="text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <button
                    type="button"
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors cursor-pointer"
                    onClick={() => onNavigateToForgotPassword(orgId.trim() || undefined, email.trim() || undefined)}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="student-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (authError) setAuthError('') }}
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

              {/* Error message */}
              {authError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-500 flex items-center gap-1.5"
                >
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  {authError}
                </motion.p>
              )}

              {/* Sign In button */}
              <Button
                type="submit"
                disabled={authLoading}
                className="w-full h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {authLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </form>

            {/* Signup link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  className="text-amber-600 hover:text-amber-700 font-semibold transition-colors cursor-pointer"
                  onClick={onNavigateToSignup}
                >
                  Create Account
                </button>
              </p>
            </div>

            {/* Footer */}
            <div className="mt-10 pt-6 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-400">
                By signing in, you agree to our{' '}
                <span className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors">Terms of Service</span>
                {' '}and{' '}
                <span className="text-gray-500 hover:text-gray-700 cursor-pointer transition-colors">Privacy Policy</span>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Mobile-only copyright */}
        <div className="lg:hidden p-6">
          <p className="text-xs text-gray-400 text-center">
            &copy; {new Date().getFullYear()} Er. Raju Kumawat Tech. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
