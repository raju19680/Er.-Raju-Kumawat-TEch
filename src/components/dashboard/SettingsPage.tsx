'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Card, CardContent, CardHeader, CardTitle,
  CardDescription, CardFooter
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  User, Mail, Phone, Building2, Lock,
  Eye, EyeOff, Camera, Save, Shield,
  Palette, Bell, Globe, Loader2, CheckCircle2,
  AlertCircle, CreditCard, Key, RefreshCw,
  Smartphone, Paintbrush, Settings2,
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ProfileData {
  name: string
  email: string
  phone: string
  bio: string
  avatarUrl: string
}

interface OrgData {
  name: string
  accentColor: string
  logoUrl: string
}

// ─── Preset accent colors ───────────────────────────────────────────────────
const PRESET_COLORS = [
  '#7c3aed', '#2563eb', '#059669', '#d97706',
  '#dc2626', '#8b5cf6', '#ec4899', '#0ea5e9',
]

// ─── Color preview swatch ───────────────────────────────────────────────────
function ColorSwatch({ color, active, onClick }: { color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={color}
      className={`size-7 rounded-full border-2 transition-all hover:scale-110 ${active ? 'border-foreground scale-110 shadow-md' : 'border-transparent'}`}
      style={{ backgroundColor: color }}
    />
  )
}

// ─── Section header ─────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, description, color = 'text-primary' }: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  color?: string
}) {
  return (
    <div>
      <CardTitle className={`text-base flex items-center gap-2`}>
        <Icon className={`size-5 ${color}`} />
        {title}
      </CardTitle>
      {description && <CardDescription className="mt-0.5">{description}</CardDescription>}
    </div>
  )
}

// ─── Main Settings Page ──────────────────────────────────────────────────────
export function SettingsPage() {
  // Profile state
  const [profile, setProfile] = useState<ProfileData>({
    name: '', email: '', phone: '', bio: '', avatarUrl: ''
  })
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)

  // Password state
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false })
  const [pwdSaving, setPwdSaving] = useState(false)

  // Org state
  const [org, setOrg] = useState<OrgData>({
    name: '', accentColor: '#7c3aed', logoUrl: ''
  })
  const [orgLoading, setOrgLoading] = useState(true)
  const [orgSaving, setOrgSaving] = useState(false)

  // ─── Load profile ─────────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    setProfileLoading(true)
    try {
      const res = await fetch('/api/teacher/profile')
      const data = await res.json()
      if (data.success && data.profile) {
        setProfile({
          name: data.profile.name || '',
          email: data.profile.email || '',
          phone: data.profile.phone || '',
          bio: data.profile.bio || '',
          avatarUrl: data.profile.avatarUrl || '',
        })
      }
    } catch {
      toast.error('Could not load profile')
    } finally {
      setProfileLoading(false)
    }
  }, [])

  // ─── Load org settings ────────────────────────────────────────────────────
  const loadOrg = useCallback(async () => {
    setOrgLoading(true)
    try {
      const res = await fetch('/api/teacher/profile?section=org')
      const data = await res.json()
      if (data.success && data.org) {
        setOrg({
          name: data.org.name || '',
          accentColor: data.org.accentColor || '#7c3aed',
          logoUrl: data.org.logoUrl || '',
        })
      }
    } catch {
      // Silently ignore — use defaults
    } finally {
      setOrgLoading(false)
    }
  }, [])

  useEffect(() => { loadProfile(); loadOrg() }, [loadProfile, loadOrg])

  // ─── Save profile ─────────────────────────────────────────────────────────
  const saveProfile = async () => {
    if (!profile.name.trim()) { toast.error('Name is required'); return }
    setProfileSaving(true)
    try {
      const res = await fetch('/api/teacher/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'profile', ...profile }),
      })
      const data = await res.json()
      if (data.success) toast.success('Profile updated!')
      else throw new Error(data.error || 'Update failed')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setProfileSaving(false)
    }
  }

  // ─── Change password ──────────────────────────────────────────────────────
  const changePassword = async () => {
    if (!passwords.current || !passwords.new) { toast.error('All fields are required'); return }
    if (passwords.new.length < 8) { toast.error('New password must be at least 8 characters'); return }
    if (passwords.new !== passwords.confirm) { toast.error('Passwords do not match'); return }
    setPwdSaving(true)
    try {
      const res = await fetch('/api/teacher/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.new, confirmPassword: passwords.confirm }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Password changed successfully!')
        setPasswords({ current: '', new: '', confirm: '' })
      } else {
        throw new Error(data.error || 'Failed to change password')
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setPwdSaving(false)
    }
  }

  // ─── Save org settings ────────────────────────────────────────────────────
  const saveOrg = async () => {
    setOrgSaving(true)
    try {
      const res = await fetch('/api/teacher/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'org', ...org }),
      })
      const data = await res.json()
      if (data.success) toast.success('Organization settings saved!')
      else throw new Error(data.error || 'Save failed')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save org settings')
    } finally {
      setOrgSaving(false)
    }
  }

  // ─── Password strength ────────────────────────────────────────────────────
  const pwdStrength = passwords.new.length === 0 ? 0
    : passwords.new.length < 6 ? 1
    : passwords.new.length < 9 ? 2
    : passwords.new.length < 12 ? 3 : 4

  const pwdStrengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][pwdStrength]
  const pwdStrengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400', 'bg-purple-500'][pwdStrength]

  // ─── Initials from name ───────────────────────────────────────────────────
  const initials = profile.name
    ? profile.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'ME'

  return (
    <div className="space-y-6 pb-8">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings2 className="size-6 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-0.5 text-sm">Manage your account, organization, and preferences</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="gap-2"><User className="size-4" />Profile</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Shield className="size-4" />Security</TabsTrigger>
          <TabsTrigger value="organization" className="gap-2"><Building2 className="size-4" />Organization</TabsTrigger>
          <TabsTrigger value="payment" className="gap-2"><CreditCard className="size-4" />Payment</TabsTrigger>
        </TabsList>

        {/* ════ PROFILE TAB ════ */}
        <TabsContent value="profile">
          <Card className="border-border/60">
            <CardHeader>
              <SectionHeader icon={User} title="Profile Information" description="Your personal details and account information" color="text-purple-600" />
            </CardHeader>
            <CardContent className="space-y-6">
              {profileLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="size-20 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                  </div>
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <>
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {profile.avatarUrl ? (
                        <img src={profile.avatarUrl} alt={profile.name} className="size-20 rounded-full object-cover border-2 border-border" />
                      ) : (
                        <div className="size-20 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-2xl font-bold text-white">
                          {initials}
                        </div>
                      )}
                      <button className="absolute -bottom-1 -right-1 size-7 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors shadow-sm">
                        <Camera className="size-3.5" />
                      </button>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{profile.name || 'Your Name'}</h3>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                      <Badge className="mt-1 bg-purple-100 text-purple-700 hover:bg-purple-100 border-0 text-xs">
                        Teacher
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input id="name" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className="pl-9" placeholder="Your full name" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input id="email" type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} className="pl-9" placeholder="your@email.com" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input id="phone" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} className="pl-9" placeholder="+91 98765 43210" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio / About</Label>
                      <Input id="bio" value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} placeholder="A short bio about you..." />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button onClick={saveProfile} disabled={profileSaving || profileLoading} className="gap-2 bg-purple-600 hover:bg-purple-700">
                {profileSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ════ SECURITY TAB ════ */}
        <TabsContent value="security" className="space-y-6">
          {/* Change Password */}
          <Card className="border-border/60">
            <CardHeader>
              <SectionHeader icon={Lock} title="Change Password" description="Keep your account secure with a strong password" color="text-blue-600" />
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current password */}
              <div className="space-y-2">
                <Label htmlFor="current-pwd">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="current-pwd"
                    type={showPwd.current ? 'text' : 'password'}
                    value={passwords.current}
                    onChange={e => setPasswords({ ...passwords, current: e.target.value })}
                    className="pl-9 pr-10"
                    placeholder="Enter current password"
                  />
                  <button onClick={() => setShowPwd(s => ({ ...s, current: !s.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPwd.current ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="space-y-2">
                <Label htmlFor="new-pwd">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="new-pwd"
                    type={showPwd.new ? 'text' : 'password'}
                    value={passwords.new}
                    onChange={e => setPasswords({ ...passwords, new: e.target.value })}
                    className="pl-9 pr-10"
                    placeholder="Minimum 8 characters"
                  />
                  <button onClick={() => setShowPwd(s => ({ ...s, new: !s.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPwd.new ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {passwords.new && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(l => (
                        <div key={l} className={`h-1.5 flex-1 rounded-full transition-colors ${l <= pwdStrength ? pwdStrengthColor : 'bg-muted'}`} />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{pwdStrengthLabel} password</p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <Label htmlFor="confirm-pwd">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="confirm-pwd"
                    type={showPwd.confirm ? 'text' : 'password'}
                    value={passwords.confirm}
                    onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="pl-9 pr-10"
                    placeholder="Repeat new password"
                  />
                  <button onClick={() => setShowPwd(s => ({ ...s, confirm: !s.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPwd.confirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {passwords.confirm && passwords.new !== passwords.confirm && (
                  <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="size-3" /> Passwords do not match</p>
                )}
                {passwords.confirm && passwords.new === passwords.confirm && passwords.confirm.length > 0 && (
                  <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="size-3" /> Passwords match</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button onClick={changePassword} disabled={pwdSaving} className="gap-2 bg-blue-600 hover:bg-blue-700">
                {pwdSaving ? <Loader2 className="size-4 animate-spin" /> : <Key className="size-4" />}
                {pwdSaving ? 'Updating...' : 'Update Password'}
              </Button>
            </CardFooter>
          </Card>

          {/* Security Options */}
          <Card className="border-border/60">
            <CardHeader>
              <SectionHeader icon={Shield} title="Security Options" description="Additional security settings for your account" color="text-blue-600" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security with 2FA</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Smartphone className="size-4" />Enable
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Active Sessions</p>
                  <p className="text-xs text-muted-foreground">Manage your logged-in devices</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <RefreshCw className="size-4" />View
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════ ORGANIZATION TAB ════ */}
        <TabsContent value="organization">
          <Card className="border-border/60">
            <CardHeader>
              <SectionHeader icon={Building2} title="Organization Settings" description="Customize your institute's branding, appearance, and preferences" color="text-emerald-600" />
            </CardHeader>
            <CardContent className="space-y-6">
              {orgLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <>
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Organization Name</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input value={org.name} onChange={e => setOrg({ ...org, name: e.target.value })} className="pl-9" placeholder="Your institute name" />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Branding */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Paintbrush className="size-4 text-emerald-600" />
                      Branding & Appearance
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Accent Color */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Palette className="size-4" />Accent Color</Label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={org.accentColor}
                            onChange={e => setOrg({ ...org, accentColor: e.target.value })}
                            className="size-10 rounded-lg border border-border cursor-pointer bg-transparent"
                          />
                          <Input value={org.accentColor} onChange={e => setOrg({ ...org, accentColor: e.target.value })} className="w-28 font-mono text-sm" />
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {PRESET_COLORS.map(c => (
                            <ColorSwatch key={c} color={c} active={org.accentColor === c} onClick={() => setOrg({ ...org, accentColor: c })} />
                          ))}
                        </div>
                        {/* Live preview */}
                        <div className="mt-2 rounded-xl border border-border p-4 space-y-2">
                          <p className="text-xs text-muted-foreground">Preview</p>
                          <div className="flex gap-2 items-center">
                            <div className="size-9 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: org.accentColor }}>
                              {initials}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-foreground">{org.name || 'Your Institute'}</p>
                              <p className="text-xs" style={{ color: org.accentColor }}>Student Portal</p>
                            </div>
                            <Button size="sm" className="ml-auto text-xs h-7" style={{ backgroundColor: org.accentColor }}>
                              Enroll Now
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Logo */}
                      <div className="space-y-2">
                        <Label>Logo URL</Label>
                        {org.logoUrl ? (
                          <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border">
                            <img src={org.logoUrl} alt="Logo" className="size-14 object-contain rounded-lg" onError={e => (e.currentTarget.style.display = 'none')} />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground truncate">{org.logoUrl}</p>
                              <Button variant="ghost" size="sm" className="mt-1 text-xs h-6 text-red-500" onClick={() => setOrg({ ...org, logoUrl: '' })}>
                                Remove
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-border bg-muted/30">
                            <Camera className="size-6 text-muted-foreground mb-1" />
                            <p className="text-xs text-muted-foreground">Paste image URL below</p>
                          </div>
                        )}
                        <Input value={org.logoUrl} onChange={e => setOrg({ ...org, logoUrl: e.target.value })} placeholder="https://cdn.example.com/logo.png" className="text-sm" />
                      </div>
                    </div>
                  </div>


                </>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4 gap-3">
              <Button onClick={saveOrg} disabled={orgSaving || orgLoading} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                {orgSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {orgSaving ? 'Saving...' : 'Save Organization Settings'}
              </Button>
              <Button variant="outline" onClick={loadOrg} disabled={orgLoading}>
                <RefreshCw className={`size-4 mr-2 ${orgLoading ? 'animate-spin' : ''}`} />
                Reset
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* ════ PAYMENT TAB ════ */}
        <TabsContent value="payment" className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <SectionHeader icon={CreditCard} title="Payment Gateway" description="Configure how students pay for your courses and test series" color="text-orange-600" />
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Razorpay */}
              <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-lg bg-blue-600 flex items-center justify-center">
                      <CreditCard className="size-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Razorpay</p>
                      <p className="text-xs text-muted-foreground">India's most popular payment gateway</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-0">Active</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Key ID</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                      <Input placeholder="rzp_live_XXXX..." className="pl-8 text-sm font-mono" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Key Secret</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                      <Input type="password" placeholder="••••••••••••" className="pl-8 text-sm font-mono" />
                    </div>
                  </div>
                </div>
              </div>

              {/* UPI / Direct */}
              <div className="p-4 rounded-xl border border-dashed border-border bg-muted/10 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-orange-500 flex items-center justify-center">
                    <Smartphone className="size-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">UPI Direct</p>
                    <p className="text-xs text-muted-foreground">Accept payments via UPI ID</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Your UPI ID</Label>
                  <Input placeholder="yourname@upi" className="text-sm" />
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
                <p className="text-xs">Payment gateway keys are stored securely. Contact support to configure a different payment provider.</p>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
                <Save className="size-4" />
                Save Payment Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default SettingsPage
