'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Shield,
  Smartphone,
  Key,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  QrCode,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { QRCodeSVG } from 'qrcode.react'

// ─── Types ──────────────────────────────────────────────────────────────────
interface TwoFactorSetupProps {
  userEmail: string
}

type SetupStep = 'idle' | 'setup' | 'verify' | 'enabled'

// ─── Component ──────────────────────────────────────────────────────────────
export default function AdminTwoFactor({ userEmail }: TwoFactorSetupProps) {
  const [step, setStep] = useState<SetupStep>('idle')
  const [isEnabled, setIsEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Setup state
  const [secret, setSecret] = useState('')
  const [otpauthUrl, setOtpauthUrl] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [copiedItem, setCopiedItem] = useState<string | null>(null)

  // Verify state
  const [verifyCode, setVerifyCode] = useState('')

  // Disable state
  const [disableCode, setDisableCode] = useState('')
  const [showDisable, setShowDisable] = useState(false)

  // Check current 2FA status
  useEffect(() => {
    check2FAStatus()
  }, [])

  const check2FAStatus = async () => {
    try {
      const res = await apiFetch('/api/auth/me')
      const data = await res.json()
      if (data.authenticated && data.user) {
        // We need to check from the database directly
        const setupRes = await apiFetch('/api/auth/2fa/setup', { method: 'POST' })
        const setupData = await setupRes.json()
        if (setupData.success) {
          setIsEnabled(setupData.alreadyEnabled)
          setStep(setupData.alreadyEnabled ? 'enabled' : 'idle')
        }
      }
    } catch {
      // Default to not enabled
    }
  }

  // Start setup process
  const handleStartSetup = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/auth/2fa/setup', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setSecret(data.secret)
        setOtpauthUrl(data.otpauthUrl)
        setBackupCodes(data.backupCodes)
        setStep('setup')
      } else {
        setError(data.error || 'Failed to start 2FA setup')
      }
    } catch {
      setError('Failed to start 2FA setup. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Verify and enable 2FA
  const handleVerifyAndEnable = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      setError('Please enter the 6-digit code from your authenticator app')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: verifyCode,
          secret,
          backupCodes,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setIsEnabled(true)
        setStep('enabled')
        setVerifyCode('')
      } else {
        setError(data.error || 'Invalid code. Please try again.')
      }
    } catch {
      setError('Failed to enable 2FA. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Disable 2FA
  const handleDisable = async () => {
    if (!disableCode) {
      setError('Please enter a verification code to disable 2FA')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: disableCode }),
      })
      const data = await res.json()
      if (data.success) {
        setIsEnabled(false)
        setStep('idle')
        setDisableCode('')
        setShowDisable(false)
        setSecret('')
        setOtpauthUrl('')
        setBackupCodes([])
      } else {
        setError(data.error || 'Failed to disable 2FA')
      }
    } catch {
      setError('Failed to disable 2FA. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Copy to clipboard helper
  const copyToClipboard = async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedItem(item)
      setTimeout(() => setCopiedItem(null), 2000)
    } catch {
      // Fallback
    }
  }

  // Regenerate backup codes
  const handleRegenerateCodes = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/auth/2fa/setup', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setBackupCodes(data.backupCodes)
        setShowBackupCodes(true)
      }
    } catch {
      setError('Failed to regenerate backup codes')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-9 rounded-lg bg-purple-50">
            <Shield className="size-4 text-purple-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base font-semibold">Two-Factor Authentication</CardTitle>
            <CardDescription className="text-xs">
              Add an extra layer of security to your account
            </CardDescription>
          </div>
          <Badge
            className={
              isEnabled
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-100 border-0'
            }
          >
            {isEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Step: Idle - 2FA not enabled */}
        {step === 'idle' && !isEnabled && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <h4 className="text-sm font-medium text-amber-900 mb-1">
                Secure your account with 2FA
              </h4>
              <p className="text-xs text-amber-700 leading-relaxed">
                Two-factor authentication adds an extra layer of security by requiring a
                verification code from your authenticator app in addition to your password.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">1</div>
                Scan QR code with authenticator app
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">2</div>
                Enter the 6-digit code to verify
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">3</div>
                Save your backup codes in a safe place
              </div>
            </div>
            <Button
              onClick={handleStartSetup}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Smartphone className="w-4 h-4 mr-2" />
              )}
              Set Up 2FA
            </Button>
          </div>
        )}

        {/* Step: Setup - Show QR code and secret */}
        {step === 'setup' && (
          <div className="space-y-4">
            {/* QR Code section */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
              <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-amber-600" />
                Scan with Authenticator App
              </h4>
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <QRCodeSVG value={otpauthUrl || secret} size={192} level="H" />
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Use Google Authenticator, Authy, or any TOTP-compatible app
                </p>
              </div>
            </div>

            {/* Manual entry key */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Can&apos;t scan? Enter manually:
              </h4>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-white rounded-lg border border-gray-200 text-xs font-mono text-gray-700 break-all">
                  {secret}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(secret, 'secret')}
                  className="flex-shrink-0 cursor-pointer"
                >
                  {copiedItem === 'secret' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>

            {/* otpauth URL */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50">
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600" />
                Setup URL
              </h4>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-white rounded-lg border border-gray-200 text-xs font-mono text-gray-700 break-all max-h-20 overflow-y-auto">
                  {otpauthUrl}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(otpauthUrl, 'url')}
                  className="flex-shrink-0 cursor-pointer"
                >
                  {copiedItem === 'url' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Backup codes */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-amber-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Backup Codes
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBackupCodes(!showBackupCodes)}
                  className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 cursor-pointer"
                >
                  {showBackupCodes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-amber-700 mb-2">
                Save these codes in a safe place. Each can only be used once.
              </p>
              {showBackupCodes && (
                <div className="grid grid-cols-2 gap-1.5">
                  {backupCodes.map((code, i) => (
                    <code
                      key={i}
                      className="p-1.5 bg-white rounded border border-amber-200 text-xs font-mono text-center"
                    >
                      {code}
                    </code>
                  ))}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(backupCodes.join('\n'), 'codes')}
                className="mt-2 w-full border-amber-200 text-amber-700 hover:bg-amber-100 cursor-pointer"
              >
                {copiedItem === 'codes' ? (
                  <Check className="w-3.5 h-3.5 mr-1.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                )}
                {copiedItem === 'codes' ? 'Copied!' : 'Copy All Codes'}
              </Button>
            </div>

            <Separator />

            {/* Verify code input */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Verify Setup</h4>
              <p className="text-xs text-gray-500">
                Enter the 6-digit code from your authenticator app to complete setup.
              </p>
              <div className="flex items-center gap-3">
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => {
                    setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    if (error) setError('')
                  }}
                  className="w-40 text-center text-lg font-mono tracking-widest h-12 rounded-xl border-gray-200"
                  disabled={loading}
                />
                <Button
                  onClick={handleVerifyAndEnable}
                  disabled={loading || verifyCode.length !== 6}
                  className="bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Shield className="w-4 h-4 mr-2" />
                  )}
                  Enable 2FA
                </Button>
              </div>
            </div>

            {/* Cancel */}
            <Button
              variant="ghost"
              onClick={() => {
                setStep('idle')
                setSecret('')
                setOtpauthUrl('')
                setBackupCodes([])
                setVerifyCode('')
                setError('')
              }}
              className="text-gray-500 cursor-pointer"
            >
              Cancel Setup
            </Button>
          </div>
        )}

        {/* Step: Enabled - 2FA is active */}
        {step === 'enabled' && isEnabled && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-medium text-emerald-900">2FA is Active</h4>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Your account is protected with two-factor authentication. You&apos;ll need to
                enter a verification code each time you sign in.
              </p>
            </div>

            {/* Regenerate backup codes */}
            <Button
              variant="outline"
              onClick={handleRegenerateCodes}
              disabled={loading}
              className="w-full cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Regenerate Backup Codes
            </Button>

            {/* Show regenerated codes */}
            {showBackupCodes && backupCodes.length > 0 && (
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
                <h4 className="text-sm font-medium text-amber-900 mb-2">New Backup Codes</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {backupCodes.map((code, i) => (
                    <code
                      key={i}
                      className="p-1.5 bg-white rounded border border-amber-200 text-xs font-mono text-center"
                    >
                      {code}
                    </code>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(backupCodes.join('\n'), 'codes')}
                  className="mt-2 w-full border-amber-200 text-amber-700 hover:bg-amber-100 cursor-pointer"
                >
                  {copiedItem === 'codes' ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                  {copiedItem === 'codes' ? 'Copied!' : 'Copy All Codes'}
                </Button>
              </div>
            )}

            <Separator />

            {/* Disable 2FA */}
            <div>
              <Button
                variant="ghost"
                onClick={() => setShowDisable(!showDisable)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-0 h-auto font-medium text-sm cursor-pointer"
              >
                {showDisable ? 'Cancel' : 'Disable Two-Factor Authentication'}
              </Button>

              {showDisable && (
                <div className="mt-3 p-4 rounded-xl border border-red-200 bg-red-50/50 space-y-3">
                  <p className="text-xs text-red-700">
                    Enter a verification code from your authenticator app to disable 2FA.
                  </p>
                  <div className="flex items-center gap-3">
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="000000"
                      value={disableCode}
                      onChange={(e) => {
                        setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                        if (error) setError('')
                      }}
                      className="w-40 text-center text-lg font-mono tracking-widest h-12 rounded-xl border-red-200"
                      disabled={loading}
                    />
                    <Button
                      variant="destructive"
                      onClick={handleDisable}
                      disabled={loading || disableCode.length < 6}
                      className="cursor-pointer"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Disable 2FA
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
