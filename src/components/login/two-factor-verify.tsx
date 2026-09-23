'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp'
import {
  Shield,
  Loader2,
  Key,
  ArrowLeft,
  Info,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────
interface TwoFactorVerifyProps {
  email: string
  onVerifyCode: (code: string) => Promise<{ success: boolean; error?: string }>
  onBack: () => void
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function TwoFactorVerify({ email, onVerifyCode, onBack }: TwoFactorVerifyProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [backupCode, setBackupCode] = useState('')
  const [failedAttempts, setFailedAttempts] = useState(0)

  // Verify the TOTP code
  const handleVerify = useCallback(async () => {
    const verifyValue = useBackupCode ? backupCode.trim() : code

    if (!verifyValue || (useBackupCode ? verifyValue.length < 8 : verifyValue.length !== 6)) {
      setError(useBackupCode ? 'Please enter a backup code' : 'Please enter the 6-digit code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await onVerifyCode(verifyValue)

      if (result.success) {
        // Parent handles login completion
      } else {
        const newFailed = failedAttempts + 1
        setFailedAttempts(newFailed)
        setError(result.error || 'Invalid verification code. Please try again.')
      }
    } catch {
      setError('Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [code, backupCode, useBackupCode, failedAttempts, onVerifyCode])

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleVerify()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 border border-purple-100">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Two-Factor Authentication
              </h2>
              <p className="text-sm text-gray-500">
                Verify your identity to continue
              </p>
            </div>
          </div>

          {/* Info banner */}
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 mb-6">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Enter the 6-digit code from your authenticator app
                ({email})
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!useBackupCode ? (
              <motion.div
                key="totp"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <Label className="text-sm font-medium text-gray-700">
                  Verification Code
                </Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={(value) => {
                      setCode(value)
                      if (error) setError('')
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="w-12 h-14 text-xl font-bold" />
                      <InputOTPSlot index={1} className="w-12 h-14 text-xl font-bold" />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={2} className="w-12 h-14 text-xl font-bold" />
                      <InputOTPSlot index={3} className="w-12 h-14 text-xl font-bold" />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={4} className="w-12 h-14 text-xl font-bold" />
                      <InputOTPSlot index={5} className="w-12 h-14 text-xl font-bold" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  onClick={handleVerify}
                  disabled={loading || code.length !== 6}
                  className="w-full h-12 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Verify & Continue'
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setUseBackupCode(true)
                      setError('')
                    }}
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Key className="w-3.5 h-3.5" />
                    Use a backup code instead
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="backup"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4"
              >
                <Label className="text-sm font-medium text-gray-700">
                  Backup Code
                </Label>
                <Input
                  type="text"
                  placeholder="Enter your 8-character backup code"
                  value={backupCode}
                  onChange={(e) => {
                    setBackupCode(e.target.value.toUpperCase())
                    if (error) setError('')
                  }}
                  onKeyDown={handleKeyDown}
                  className="h-12 rounded-xl border-gray-200 bg-gray-50/50 text-base text-center font-mono tracking-wider"
                  disabled={loading}
                  maxLength={8}
                />
                <p className="text-xs text-gray-500 text-center">
                  Each backup code can only be used once.
                </p>

                <Button
                  onClick={handleVerify}
                  disabled={loading || backupCode.length < 8}
                  className="w-full h-12 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Verify Backup Code'
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setUseBackupCode(false)
                      setError('')
                    }}
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Use authenticator code instead
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error message */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-500 flex items-center gap-1.5 mt-3"
            >
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              {error}
            </motion.p>
          )}

          {/* Failed attempts warning */}
          {failedAttempts > 0 && (
            <p className="text-xs text-gray-400 text-center mt-3">
              Failed attempts: {failedAttempts}
            </p>
          )}

          {/* Back to login */}
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to login
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
