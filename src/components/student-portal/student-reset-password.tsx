'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap, ArrowRight, Eye, EyeOff, Loader2,
  CheckCircle2, Info, Hexagon, Triangle, Circle,
  Lock, CheckCircle, AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// ─── Types ──────────────────────────────────────────────────────────────────
interface StudentResetPasswordProps {
  token: string
  onNavigateToLogin: () => void
  onNavigateToForgotPassword: () => void
}

// ─── Password Strength Indicator ────────────────────────────────────────────
function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, feedback: [] as string[] }
    const feedback: string[] = []
    let metCount = 0
    if (password.length >= 8) metCount++; else feedback.push('8+ characters')
    if (/[A-Z]/.test(password)) metCount++; else feedback.push('uppercase letter')
    if (/[a-z]/.test(password)) metCount++; else feedback.push('lowercase letter')
    if (/\d/.test(password)) metCount++; else feedback.push('number')
    if (/[^A-Za-z0-9]/.test(password)) metCount++; else feedback.push('special character')

    let score: number
    if (metCount <= 2) score = 1
    else if (metCount === 3) score = 2
    else if (metCount === 4) score = 3
    else score = 4
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
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= strength.score ? colors[strength.score] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
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
            Reset Your Password
          </h1>
          <p className="mt-5 text-lg text-amber-100/80 leading-relaxed">
            Create a strong, secure password to protect your account and keep your data safe.
          </p>

          <div className="mt-10 space-y-4">
            {[
              'Use at least 8 characters',
              'Mix uppercase, lowercase, and numbers',
              'Add special characters for extra security',
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
export default function StudentResetPassword({ token, onNavigateToLogin, onNavigateToForgotPassword }: StudentResetPasswordProps) {
  // Token validation state
  const [resetUser, setResetUser] = useState<{ name: string; email: string } | null>(null)
  const [tokenValidating, setTokenValidating] = useState(true)
  const [tokenError, setTokenError] = useState('')

  // Form fields
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rpLoading, setRpLoading] = useState(false)
  const [rpError, setRpError] = useState('')
  const [rpSuccess, setRpSuccess] = useState(false)

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenError('No reset token provided.')
      setTokenValidating(false)
      return
    }

    setTokenValidating(true)
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
  }, [token])

  // Handle Reset Password
  const handleResetPassword = async () => {
    if (!password) { setRpError('Please enter a new password'); return }
    if (password.length < 8) { setRpError('Password must be at least 8 characters long'); return }
    if (password !== confirmPassword) { setRpError('Passwords do not match'); return }

    setRpLoading(true)
    setRpError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (data.success) {
        setRpSuccess(true)
      } else {
        setRpError(data.error || 'Failed to reset password. Please try again.')
      }
    } catch {
      setRpError('Network error. Please check your connection and try again.')
    } finally {
      setRpLoading(false)
    }
  }

  // ── Success State ──
  if (rpSuccess) {
    return (
      <div className="min-h-screen flex">
        <LeftPanel />
        <div className="flex-1 lg:w-[55%] flex flex-col bg-white min-h-screen">
          <div className="lg:hidden p-6 flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-600">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold text-gray-900 tracking-tight">Er. Raju Kumawat</span>
              <span className="text-xs font-semibold tracking-wider uppercase text-amber-600">Student Portal</span>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center px-6 lg:px-20 pb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mx-auto mb-6"
              >
                <CheckCircle className="w-11 h-11 text-emerald-600" />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Password Reset!</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <Button
                onClick={onNavigateToLogin}
                className="h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold px-8 cursor-pointer"
              >
                Sign In Now <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    )
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
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-50 border border-amber-100">
                  <Lock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Reset Password</h2>
                  <p className="text-sm text-gray-500">Create a new secure password</p>
                </div>
              </div>
            </div>

            {/* Token Validating */}
            {tokenValidating ? (
              <div className="flex flex-col items-center py-12">
                <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
                <p className="text-sm text-gray-500">Verifying reset link...</p>
              </div>
            ) : tokenError ? (
              /* ── Token Error State ── */
              <div className="space-y-5">
                <div className="flex flex-col items-center text-center p-6 rounded-xl bg-red-50 border border-red-200">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Invalid Link</h3>
                  <p className="text-sm text-red-700 leading-relaxed">{tokenError}</p>
                </div>
                <Button
                  onClick={onNavigateToForgotPassword}
                  className="w-full h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold cursor-pointer"
                >
                  Request New Reset Link
                </Button>
                <button
                  type="button"
                  onClick={onNavigateToLogin}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              /* ── Reset Password Form ── */
              <form onSubmit={(e) => { e.preventDefault(); handleResetPassword() }} className="space-y-5">
                {resetUser && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <p className="text-sm text-emerald-800">
                      Resetting password for <strong>{resetUser.name}</strong> ({resetUser.email})
                    </p>
                  </div>
                )}

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="reset-password" className="text-sm font-medium text-gray-700">
                    New Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="reset-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (rpError) setRpError('') }}
                      className="h-12 rounded-xl border-gray-200 bg-gray-50/50 text-base px-4 pr-12 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                      disabled={rpLoading}
                      autoFocus
                      autoComplete="new-password"
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
                  <PasswordStrengthIndicator password={password} />
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="reset-confirm-password" className="text-sm font-medium text-gray-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="reset-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); if (rpError) setRpError('') }}
                      className="h-12 rounded-xl border-gray-200 bg-gray-50/50 text-base px-4 pr-12 focus-visible:ring-amber-500/30 focus-visible:border-amber-500"
                      disabled={rpLoading}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {confirmPassword && password && confirmPassword !== password && (
                    <p className="text-xs text-red-500">Passwords do not match</p>
                  )}
                  {confirmPassword && password && confirmPassword === password && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Passwords match
                    </p>
                  )}
                </div>

                {/* Error message */}
                {rpError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-500 flex items-center gap-1.5"
                  >
                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                    {rpError}
                  </motion.p>
                )}

                {/* Reset button */}
                <Button
                  type="submit"
                  disabled={rpLoading}
                  className="w-full h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-colors cursor-pointer"
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
