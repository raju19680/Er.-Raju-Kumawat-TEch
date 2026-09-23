'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, ArrowRight, ArrowLeft, Loader2,
  CheckCircle2, KeyRound, Info, Hexagon, Triangle, Circle,
  Mail, CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ─── Types ──────────────────────────────────────────────────────────────────
interface OrgData {
  id: string
  name: string
  code: string
  logo: string | null
  accentColor: string
}

interface StudentForgotPasswordProps {
  onNavigateToLogin: () => void
  initialOrgId?: string
  initialEmail?: string
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
            Forgot Password?
          </h1>
          <p className="mt-5 text-lg text-amber-100/80 leading-relaxed">
            No worries! Enter your institute ID and email, and we&apos;ll send you a link to reset your password.
          </p>

          <div className="mt-10 space-y-4">
            {[
              'Check your inbox and spam folder',
              'Reset link expires in 1 hour',
              'Create a new secure password',
            ].map((feature, i) => (
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
export default function StudentForgotPassword({ onNavigateToLogin, initialOrgId, initialEmail }: StudentForgotPasswordProps) {
  // Form fields
  const [orgId, setOrgId] = useState(initialOrgId || '')
  const [email, setEmail] = useState(initialEmail || '')
  const [fpLoading, setFpLoading] = useState(false)
  const [fpError, setFpError] = useState('')
  const [fpSuccess, setFpSuccess] = useState(false)

  // Org verification
  const [verifiedOrg, setVerifiedOrg] = useState<OrgData | null>(null)
  const [verifyingOrg, setVerifyingOrg] = useState(false)

  // Debounced org verification
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
        setVerifiedOrg(data.success ? data.organization : null)
      } catch {
        setVerifiedOrg(null)
      } finally {
        setVerifyingOrg(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [orgId])

  // Handle Forgot Password
  const handleForgotPassword = async () => {
    if (!orgId.trim()) { setFpError('Please enter your Institute ID'); return }
    if (!email.trim()) { setFpError('Please enter your email address'); return }

    setFpLoading(true)
    setFpError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), orgId: orgId.trim(), source: 'student' }),
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

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <LeftPanel />

      {/* Right Panel */}
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
            {/* Back button */}
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-6 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </button>

            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-50 border border-amber-100">
                  <Mail className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Forgot Password</h2>
                  <p className="text-sm text-gray-500">Reset your password via email</p>
                </div>
              </div>
            </div>

            {fpSuccess ? (
              /* ── Success State ── */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5"
              >
                <div className="flex flex-col items-center text-center p-6 rounded-xl bg-emerald-50 border border-emerald-200">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                    className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4"
                  >
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-emerald-900 mb-2">Reset Link Sent!</h3>
                  <p className="text-sm text-emerald-700 leading-relaxed">
                    If an account exists for <strong>{email}</strong>, you will receive a password reset link shortly.
                  </p>
                  <p className="text-xs text-emerald-600 mt-3">
                    The link will expire in 1 hour. Check your spam folder if you don&apos;t see it.
                  </p>
                </div>

                <Button
                  onClick={onNavigateToLogin}
                  className="w-full h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold cursor-pointer"
                >
                  Back to Sign In <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            ) : (
              /* ── Form ── */
              <form onSubmit={(e) => { e.preventDefault(); handleForgotPassword() }} className="space-y-5">
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
                      placeholder="Enter institute code"
                      value={orgId}
                      onChange={(e) => { setOrgId(e.target.value); if (fpError) setFpError('') }}
                      className="h-12 rounded-xl border-gray-200 bg-gray-50/50 text-base pl-11 pr-10 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                      disabled={fpLoading}
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

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="fp-email" className="text-sm font-medium text-gray-700">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fp-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (fpError) setFpError('') }}
                    className="h-12 rounded-xl border-gray-200 bg-gray-50/50 text-base px-4 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                    disabled={fpLoading}
                    autoComplete="email"
                    required
                  />
                </div>

                {/* Error message */}
                {fpError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-500 flex items-center gap-1.5"
                  >
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    {fpError}
                  </motion.p>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={fpLoading}
                  className="w-full h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  {fpLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>Send Reset Link <Mail className="w-4 h-4 ml-1" /></>
                  )}
                </Button>
              </form>
            )}

            {/* Dev mode notice */}
            <div className="mt-6 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  In development mode, the reset link is logged to the server console. Check your terminal or the Email Log in admin panel.
                </p>
              </div>
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
