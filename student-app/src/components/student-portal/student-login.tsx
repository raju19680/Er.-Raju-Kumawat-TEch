'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { MediaImage } from '@/components/ui/media-image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, ArrowRight, ArrowLeft, Eye, EyeOff, Loader2,
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
  onNavigateToHome?: () => void
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
function LeftPanel({ org, banners }: { org: OrgData | null, banners: any[] }) {
  const features = [
    { title: 'Learn Anytime, Anywhere', desc: 'Access your enrolled courses from any device' },
    { title: 'Track Your Progress', desc: 'Detailed analytics and performance metrics' },
    { title: 'Interactive Mock Tests', desc: 'Real exam environment with instant results' },
    { title: 'Stay Updated', desc: 'Get instant notifications and announcements' },
  ]

  const orgName = org?.name || 'Er. Raju Kumawat'
  const accent = org?.accentColor || '#D97706' // amber-600
  const heroImage = banners && banners.length > 0 ? banners[0].image : null

  return (
    <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden flex-col bg-slate-950">
      {/* Background Image / Color */}
      {heroImage ? (
        <div className="absolute inset-0">
          <MediaImage src={heroImage} alt="Hero" className="w-full h-full object-cover opacity-30 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-slate-950/40" />
        </div>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br" style={{ backgroundImage: `linear-gradient(to bottom right, ${accent}40, #020617)` }} />
          <GeometricPatterns />
        </>
      )}

      {/* Glass Overlay for Premium feel */}
      <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px]" />

      {/* Logo Area */}
      <div className="relative z-10 p-10 lg:p-12">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex items-center gap-4"
        >
          {org?.logo ? (
            <MediaImage src={org.logo} alt="Logo" className="w-12 h-12 object-contain rounded-xl bg-white/10 p-2 backdrop-blur-md border border-white/10 shadow-2xl" />
          ) : (
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md shadow-2xl border border-white/10" style={{ backgroundColor: `${accent}80` }}>
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
          )}
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-bold text-white tracking-tight drop-shadow-sm">{orgName}</span>
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-emerald-400 drop-shadow-sm opacity-90">Student Portal</span>
          </div>
        </motion.div>
      </div>

      {/* Center Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-10 lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-lg"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium tracking-wide text-slate-300">Welcome to your learning journey</span>
          </div>
          
          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-6">
            Elevate Your <span style={{ color: accent }} className="relative whitespace-nowrap">
              Education
              <svg className="absolute -bottom-2 left-0 w-full h-3 opacity-60" viewBox="0 0 100 10" preserveAspectRatio="none">
                <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
          </h1>
          <p className="text-lg text-slate-300/90 leading-relaxed mb-12 font-light max-w-md">
            Sign in to access premium courses, track your progress, and take the next step in your career.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                className="flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/80" />
                </div>
                <div>
                  <h3 className="text-slate-100 text-sm font-semibold mb-1">{feature.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="relative z-10 p-8">
        <p className="text-xs text-slate-300/60 font-medium">
          &copy; {new Date().getFullYear()} {orgName}. All Rights Reserved.
        </p>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function StudentLogin({
  onNavigateToSignup,
  onNavigateToForgotPassword,
  onNavigateToResetPassword,
  onNavigateToHome,
}: StudentLoginProps) {
  const loginToStore = useAppStore((s) => s.login)

  // Form fields
  const [orgId, setOrgId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  // Org verification
  const [verifiedOrg, setVerifiedOrg] = useState<OrgData | null>(null)
  const [portalData, setPortalData] = useState<any>(null)
  const [verifyingOrg, setVerifyingOrg] = useState(false)

  // Check for reset token and teacherId in URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    
    // Reset token
    const token = params.get('reset_token')
    if (token) {
      onNavigateToResetPassword(token)
      window.history.replaceState({}, '', '/')
      return
    }

    // Teacher connection
    const tId = params.get('teacherId') || params.get('t')
    if (tId) {
      setVerifyingOrg(true)
      fetch(`/api/student/portal-data?teacherId=${tId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data && data.data.organization) {
            setVerifiedOrg(data.data.organization)
            setPortalData(data.data)
            setOrgId(data.data.organization.code)
            useAppStore.getState().setOrg(data.data.organization.code, data.data.organization.name)
          }
        })
        .catch(err => console.error(err))
        .finally(() => setVerifyingOrg(false))
      return
    }

    // Fallback to default orgCode if no teacherId
    const defaultOrgCode = process.env.NEXT_PUBLIC_DEFAULT_ORG_CODE
    if (defaultOrgCode && !verifiedOrg) {
      setOrgId(defaultOrgCode)
      setVerifyingOrg(true)
      fetch(`/api/student/portal-data?orgCode=${defaultOrgCode}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data && data.data.organization) {
            setVerifiedOrg(data.data.organization)
            setPortalData(data.data)
            useAppStore.getState().setOrg(data.data.organization.code, data.data.organization.name)
          }
        })
        .catch(err => console.error(err))
        .finally(() => setVerifyingOrg(false))
      return
    }
  }, [onNavigateToResetPassword])

  // Debounced org verification when user types orgId manually
  useEffect(() => {
    if (verifyingOrg || (verifiedOrg && verifiedOrg.code === orgId)) return
    
    const trimmed = orgId.trim()
    if (!trimmed) {
      setVerifiedOrg(null)
      setPortalData(null)
      return
    }
    const timer = setTimeout(async () => {
      setVerifyingOrg(true)
      try {
        const res = await fetch(`/api/student/portal-data?orgCode=${trimmed}`)
        const data = await res.json()
        if (data.success && data.data && data.data.organization) {
          setVerifiedOrg(data.data.organization)
          setPortalData(data.data)
        } else {
          setVerifiedOrg(null)
          setPortalData(null)
        }
      } catch {
        setVerifiedOrg(null)
        setPortalData(null)
      } finally {
        setVerifyingOrg(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [orgId, verifiedOrg, verifyingOrg])



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
        u.email || email.trim().toLowerCase(),
        u.role || 'student',
        'student'
      )

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
      <LeftPanel org={verifiedOrg} banners={portalData?.banners || []} />

      {/* Right Panel - Login Form */}
      <div className="flex-1 lg:w-[50%] flex flex-col bg-white min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden px-6 py-5 flex items-center justify-between bg-slate-950 border-b border-white/10 shadow-sm relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-45deg] opacity-20 translate-x-[-100%]" />
          <div className="flex items-center gap-3 relative z-10">
            {verifiedOrg?.logo ? (
              <MediaImage src={verifiedOrg.logo} alt="Logo" className="w-11 h-11 object-contain rounded-xl bg-white/10 p-1.5 backdrop-blur-sm border border-white/20 shadow-md" />
            ) : (
              <div className="flex items-center justify-center w-11 h-11 rounded-xl shadow-md border border-white/20" style={{ backgroundColor: verifiedOrg?.accentColor || '#D97706' }}>
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold text-white tracking-tight">{verifiedOrg?.name || 'Er. Raju Kumawat'}</span>
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-emerald-400">Student Portal</span>
            </div>
          </div>
          {onNavigateToHome && (
            <button onClick={onNavigateToHome} className="text-xs text-white/80 hover:text-white underline cursor-pointer relative z-10">
              Home
            </button>
          )}
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-24 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
            className="w-full max-w-[420px]"
          >
            {/* Header */}
            <div className="mb-10 text-center lg:text-left">
              {onNavigateToHome && (
                <button
                  type="button"
                  onClick={onNavigateToHome}
                  className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 mb-4 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Home
                </button>
              )}
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">Welcome Back</h2>
              <p className="text-base text-slate-500">Sign in to access your student dashboard.</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleLogin() }} className="space-y-6">
              {/* Institute ID */}
              {!process.env.NEXT_PUBLIC_DEFAULT_ORG_CODE && (
                <div className="space-y-2">
                  <Label htmlFor="student-orgId" className="text-xs font-semibold tracking-wider uppercase text-slate-500">
                    Institute ID <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                      <KeyRound className="w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                    </div>
                    <Input
                      id="student-orgId"
                      type="text"
                      placeholder="Enter institute code"
                      value={orgId}
                      onChange={(e) => { setOrgId(e.target.value); if (authError) setAuthError('') }}
                      className="h-14 rounded-xl border-slate-200 bg-white text-base pl-12 pr-12 focus-visible:ring-1 focus-visible:ring-slate-900 focus-visible:border-slate-900 transition-all shadow-sm"
                      disabled={authLoading}
                      autoFocus
                      autoComplete="organization"
                      required
                    />
                    {verifyingOrg && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                      </div>
                    )}
                  </div>
                  <AnimatePresence>
                    {verifiedOrg && <VerifiedOrgBadge org={verifiedOrg} />}
                  </AnimatePresence>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="student-email" className="text-xs font-semibold tracking-wider uppercase text-slate-500">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                  </div>
                  <Input
                    id="student-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (authError) setAuthError('') }}
                    className="h-14 rounded-xl border-slate-200 bg-white text-base pl-12 pr-4 focus-visible:ring-1 focus-visible:ring-slate-900 focus-visible:border-slate-900 transition-all shadow-sm"
                    disabled={authLoading}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="student-password" className="text-xs font-semibold tracking-wider uppercase text-slate-500">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <button
                    type="button"
                    className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors cursor-pointer underline underline-offset-4 decoration-slate-200 hover:decoration-slate-400"
                    onClick={() => onNavigateToForgotPassword(orgId.trim() || undefined, email.trim() || undefined)}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                  </div>
                  <Input
                    id="student-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (authError) setAuthError('') }}
                    className="h-14 rounded-xl border-slate-200 bg-white text-base pl-12 pr-12 focus-visible:ring-1 focus-visible:ring-slate-900 focus-visible:border-slate-900 transition-all shadow-sm"
                    disabled={authLoading}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              <AnimatePresence>
                {authError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                      <Info className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-600 font-medium">{authError}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sign In button */}
              <Button
                type="submit"
                disabled={authLoading}
                className="w-full h-14 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-base font-semibold transition-all shadow-lg hover:shadow-xl active:scale-[0.99] cursor-pointer mt-4"
              >
                {authLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Sign In
                  </span>
                )}
              </Button>
            </form>

            {/* Signup link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  className="text-slate-900 hover:text-slate-700 font-semibold transition-colors cursor-pointer underline underline-offset-4 decoration-slate-300 hover:decoration-slate-900"
                  onClick={onNavigateToSignup}
                >
                  Create an account
                </button>
              </p>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-slate-100 text-center">
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
