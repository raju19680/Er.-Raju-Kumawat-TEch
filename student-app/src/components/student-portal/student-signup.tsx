'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { MediaImage } from '@/components/ui/media-image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, ArrowRight, ArrowLeft, Eye, EyeOff, Loader2,
  CheckCircle2, KeyRound, Info, Hexagon, Triangle, Circle,
  UserPlus, Mail, Lock, User, Phone, CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'

// ─── Types ──────────────────────────────────────────────────────────────────
interface OrgData {
  id: string
  name: string
  code: string
  logo: string | null
  accentColor: string
}

interface StudentSignupProps {
  onNavigateToLogin: () => void
  onNavigateToHome?: () => void
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

  const colors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-emerald-400', 'bg-emerald-600']
  const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
  const textColors = ['text-red-600', 'text-blue-600', 'text-yellow-600', 'text-emerald-500', 'text-emerald-700']

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= strength.score ? colors[strength.score] : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${textColors[strength.score]}`}>
          {labels[strength.score]}
        </span>
        {strength.feedback.length > 0 && strength.score < 4 && (
          <span className="text-xs text-slate-400">
            Need: {strength.feedback.join(', ')}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Verified Org Badge ────────────────────────────────────────────────────
function VerifiedOrgBadge({ org }: { org: OrgData }) {
  const accent = org.accentColor || '#4f46e5'
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
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-indigo-400/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-blue-400/8 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-indigo-300/5 blur-2xl" />
      <motion.div
        className="absolute top-[15%] right-[12%]"
        animate={{ rotate: 360 }}
        transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
      >
        <Hexagon className="w-16 h-16 text-indigo-300/10 stroke-indigo-300/20" strokeWidth={1} />
      </motion.div>
      <motion.div
        className="absolute bottom-[25%] left-[15%]"
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      >
        <Triangle className="w-12 h-12 text-blue-300/10 stroke-blue-300/20" strokeWidth={1} />
      </motion.div>
      <motion.div
        className="absolute top-[55%] right-[20%]"
        animate={{ y: [-10, 10, -10] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Circle className="w-8 h-8 text-indigo-200/10 stroke-indigo-200/20" strokeWidth={1} />
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
    'Create your student profile',
    'Enroll in courses and test series',
    'Track your learning progress',
    'Access exclusive study materials',
  ]

  const orgName = org?.name || 'Er. Raju Kumawat'
  const accent = org?.accentColor || '#4f46e5' // indigo-600
  const heroImage = banners && banners.length > 0 ? banners[0].image : null

  return (
    <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col bg-slate-900">
      {/* Background Image / Color */}
      {heroImage ? (
        <div className="absolute inset-0">
          <MediaImage src={heroImage} alt="Hero" className="w-full h-full object-cover opacity-40 mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40" />
        </div>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br" style={{ backgroundImage: `linear-gradient(to bottom right, ${accent}, #0f172a)` }} />
          <GeometricPatterns />
        </>
      )}

      {/* Logo */}
      <div className="relative z-10 p-8">
        <div className="flex items-center gap-3">
          {org?.logo ? (
            <MediaImage src={org.logo} alt="Logo" className="w-11 h-11 object-contain rounded-lg bg-white/10 p-1 backdrop-blur-sm" />
          ) : (
            <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-white/20 backdrop-blur-sm shadow-inner" style={{ backgroundColor: accent }}>
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold text-white tracking-tight drop-shadow-sm">{orgName}</span>
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-300 drop-shadow-sm">Student Portal</span>
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
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight drop-shadow-lg">
            Start Your Learning Journey
          </h1>
          <p className="mt-5 text-lg text-slate-200 leading-relaxed drop-shadow-md">
            Create an account to unlock access to courses, tests, and personalized learning resources.
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
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span className="text-slate-100 text-sm font-medium drop-shadow-sm">{feature}</span>
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
export default function StudentSignup({
  onNavigateToLogin,
  onNavigateToHome,
}: StudentSignupProps) {
  // Form fields
  const [orgId, setOrgId] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [signupSuccess, setSignupSuccess] = useState(false)

  // Org verification
  const [verifiedOrg, setVerifiedOrg] = useState<OrgData | null>(null)
  const [portalData, setPortalData] = useState<any>(null)
  const [verifyingOrg, setVerifyingOrg] = useState(false)

  // Debounced org verification via portal-data
  useEffect(() => {
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
  }, [orgId])

  // Handle Signup
  const handleSignup = async () => {
    if (!orgId.trim()) { setSignupError('Please enter your Institute ID'); return }
    if (!fullName.trim()) { setSignupError('Please enter your full name'); return }
    if (!email.trim()) { setSignupError('Please enter your email'); return }
    if (!phone.trim()) { setSignupError('Please enter your mobile number'); return }
    if (!password) { setSignupError('Please enter a password'); return }
    if (password.length < 8) { setSignupError('Password must be at least 8 characters'); return }
    if (password !== confirmPassword) { setSignupError('Passwords do not match'); return }
    if (!termsAccepted) { setSignupError('Please accept the terms and conditions'); return }

    setSignupLoading(true)
    setSignupError('')
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const teacherId = urlParams.get('teacherId') || urlParams.get('t')
      
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
          orgCode: orgId.trim(),
          role: 'student',
          teacherId: teacherId || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSignupSuccess(true)
        toast.success('Account created successfully!')
      } else {
        setSignupError(data.message || data.error || 'Registration failed. Please try again.')
      }
    } catch {
      setSignupError('Network error. Please check your connection and try again.')
    } finally {
      setSignupLoading(false)
    }
  }

  // Success state
  if (signupSuccess) {
    return (
      <div className="min-h-screen flex">
        <LeftPanel org={verifiedOrg} banners={portalData?.banners || []} />
        <div className="flex-1 lg:w-[55%] flex flex-col bg-white min-h-screen">
          <div className="lg:hidden p-6 flex items-center gap-3 bg-slate-900">
            {verifiedOrg?.logo ? (
              <MediaImage src={verifiedOrg.logo} alt="Logo" className="w-11 h-11 object-contain rounded-lg bg-white/10 p-1 backdrop-blur-sm" />
            ) : (
              <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ backgroundColor: verifiedOrg?.accentColor || '#4f46e5' }}>
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold text-white tracking-tight">{verifiedOrg?.name || 'Er. Raju Kumawat'}</span>
              <span className="text-xs font-semibold tracking-wider uppercase text-emerald-300">Student Portal</span>
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
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Account Created!</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Your student account has been created successfully. You can now sign in with your credentials.
              </p>
              <Button
                onClick={onNavigateToLogin}
                className="h-14 rounded-2xl text-white font-semibold px-8 cursor-pointer hover:opacity-90"
                style={{ backgroundColor: verifiedOrg?.accentColor || '#4f46e5' }}
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
      <LeftPanel org={verifiedOrg} banners={portalData?.banners || []} />

      {/* Right Panel - Signup Form */}
      <div className="flex-1 lg:w-[55%] flex flex-col bg-white min-h-screen">
        {/* Mobile Header */}
        <div className="lg:hidden p-6 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-3">
            {verifiedOrg?.logo ? (
              <MediaImage src={verifiedOrg.logo} alt="Logo" className="w-11 h-11 object-contain rounded-lg bg-white/10 p-1 backdrop-blur-sm" />
            ) : (
              <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ backgroundColor: verifiedOrg?.accentColor || '#4f46e5' }}>
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold text-white tracking-tight">{verifiedOrg?.name || 'Er. Raju Kumawat'}</span>
              <span className="text-xs font-semibold tracking-wider uppercase text-emerald-300">Student Portal</span>
            </div>
          </div>
          {onNavigateToHome && (
            <button onClick={onNavigateToHome} className="text-xs text-white/80 hover:text-white underline cursor-pointer">
              Home
            </button>
          )}
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
            <div className="mb-8 mt-6 lg:mt-0">
              {onNavigateToHome && (
                <button
                  type="button"
                  onClick={onNavigateToHome}
                  className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 mb-4 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Home
                </button>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100">
                  <UserPlus className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create Account</h2>
                  <p className="text-sm text-slate-500">Join as a student</p>
                </div>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSignup() }} className="space-y-4">
              {/* Institute ID */}
              {!process.env.NEXT_PUBLIC_DEFAULT_ORG_CODE && (
                <div className="space-y-2">
                  <Label htmlFor="signup-orgId" className="text-xs font-bold tracking-wide uppercase text-slate-700">
                    Institute ID <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="signup-orgId"
                      type="text"
                      placeholder="Enter institute code"
                      value={orgId}
                      onChange={(e) => { setOrgId(e.target.value); if (signupError) setSignupError('') }}
                      className="h-14 rounded-2xl border-slate-200 bg-slate-50 text-base shadow-sm text-base pl-11 pr-10 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500"
                      disabled={signupLoading}
                      autoFocus
                      autoComplete="organization"
                      required
                    />
                    {verifyingOrg && (
                      <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" />
                    )}
                  </div>
                  <AnimatePresence>
                    {verifiedOrg && <VerifiedOrgBadge org={verifiedOrg} />}
                  </AnimatePresence>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="signup-name" className="text-xs font-bold tracking-wide uppercase text-slate-700">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); if (signupError) setSignupError('') }}
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50 text-base shadow-sm text-base pl-11 pr-4 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500"
                    disabled={signupLoading}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-xs font-bold tracking-wide uppercase text-slate-700">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (signupError) setSignupError('') }}
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50 text-base shadow-sm text-base pl-11 pr-4 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500"
                    disabled={signupLoading}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="signup-phone" className="text-xs font-bold tracking-wide uppercase text-slate-700">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); if (signupError) setSignupError('') }}
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50 text-base shadow-sm text-base pl-11 pr-4 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500"
                    disabled={signupLoading}
                    autoComplete="tel"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-xs font-bold tracking-wide uppercase text-slate-700">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (signupError) setSignupError('') }}
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50 text-base shadow-sm text-base px-4 pr-12 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500"
                    disabled={signupLoading}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <PasswordStrengthIndicator password={password} />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password" className="text-xs font-bold tracking-wide uppercase text-slate-700">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); if (signupError) setSignupError('') }}
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50 text-base shadow-sm text-base px-4 pr-12 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500"
                    disabled={signupLoading}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
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

              {/* Terms & Conditions */}
              <div className="flex items-start gap-3 pt-1">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => { setTermsAccepted(checked === true); if (signupError) setSignupError('') }}
                  className="w-4 h-4 rounded mt-0.5 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                />
                <Label htmlFor="terms" className="text-sm text-slate-600 font-normal cursor-pointer select-none leading-relaxed">
                  I agree to the{' '}
                  <span className="text-indigo-600 hover:text-indigo-700 cursor-pointer font-medium">Terms of Service</span>
                  {' '}and{' '}
                  <span className="text-indigo-600 hover:text-indigo-700 cursor-pointer font-medium">Privacy Policy</span>
                </Label>
              </div>

              {/* Error message */}
              {signupError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-500 flex items-center gap-1.5"
                >
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  {signupError}
                </motion.p>
              )}

              {/* Sign Up button */}
              <Button
                type="submit"
                disabled={signupLoading}
                className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                {signupLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Create Account <ArrowRight className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </form>

            {/* Login link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors cursor-pointer"
                  onClick={onNavigateToLogin}
                >
                  Sign In
                </button>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Mobile-only copyright */}
        <div className="lg:hidden p-6">
          <p className="text-xs text-slate-400 text-center">
            &copy; {new Date().getFullYear()} Er. Raju Kumawat Tech. All Rights Reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
