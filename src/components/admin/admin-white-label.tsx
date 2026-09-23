'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Palette, Globe, Smartphone, Download, Search, Building2, Users,
  Loader2, CheckCircle2, RefreshCw, AlertCircle, Shield, Trash2,
  ExternalLink, Lock, Unlock, Code2, FileArchive, Clock, Hammer,
  Monitor, Eye, Save, Plus, ArrowDownToLine, Info, Link2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'

// ── Types ─────────────────────────────────────────────────────────────────────
interface TeacherData {
  id: string
  name: string
  email: string
  phone: string | null
  avatar: string | null
  organization: {
    id: string
    name: string
    code: string
    accentColor: string
    status: string
  } | null
  studentCount: number
  createdAt: string
}

interface WhiteLabelConfig {
  id: string
  teacherId: string
  orgName: string
  logo: string | null
  favicon: string | null
  primaryColor: string
  secondaryColor: string | null
  accentColor: string
  fontFamily: string
  customCSS: string | null
  heroTitle: string | null
  heroSubtitle: string | null
  heroImage: string | null
  footerText: string | null
  socialLinks: string | null
  seoTitle: string | null
  seoDescription: string | null
  pwaEnabled: boolean
  analyticsId: string | null
  facebookPixelId: string | null
  templateId: string
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

interface BuildRecordData {
  id: string
  teacherId: string
  teacherName: string | null
  organizationId: string
  orgCode: string | null
  type: string
  status: string
  filename: string | null
  fileSize: number | null
  version: string
  changelog: string | null
  downloadUrl: string | null
  triggeredBy: string | null
  triggeredByName: string | null
  startedAt: string | null
  completedAt: string | null
  error: string | null
  createdAt: string
}

interface CustomDomainData {
  id: string
  teacherId: string
  domain: string
  isVerified: boolean
  sslEnabled: boolean
  dnsVerifiedAt: string | null
  sslProvisionedAt: string | null
  status: string
  targetType: string
  organizationId: string
  createdAt: string
  updatedAt: string
}

interface SocialLinksData {
  whatsapp?: string
  youtube?: string
  telegram?: string
  instagram?: string
  twitter?: string
  facebook?: string
}

interface ConfigFormState {
  orgName: string
  logo: string
  favicon: string
  primaryColor: string
  secondaryColor: string
  accentColor: string
  fontFamily: string
  customCSS: string
  heroTitle: string
  heroSubtitle: string
  heroImage: string
  footerText: string
  socialLinks: SocialLinksData
  seoTitle: string
  seoDescription: string
  pwaEnabled: boolean
  analyticsId: string
  facebookPixelId: string
  templateId: string
}

const defaultConfigForm: ConfigFormState = {
  orgName: '',
  logo: '',
  favicon: '',
  primaryColor: '#d97706',
  secondaryColor: '#1f2937',
  accentColor: '#d97706',
  fontFamily: 'Inter',
  customCSS: '',
  heroTitle: '',
  heroSubtitle: '',
  heroImage: '',
  footerText: '',
  socialLinks: {},
  seoTitle: '',
  seoDescription: '',
  pwaEnabled: false,
  analyticsId: '',
  facebookPixelId: '',
  templateId: 'default',
}

const FONT_OPTIONS = ['Inter', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat']
const TEMPLATE_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'modern', label: 'Modern' },
  { value: 'classic', label: 'Classic' },
  { value: 'minimal', label: 'Minimal' },
]
const BUILD_TYPES = [
  { value: 'website', label: 'Website', icon: Globe },
  { value: 'app_android', label: 'Android App', icon: Smartphone },
  { value: 'app_ios', label: 'iOS App', icon: Smartphone },
  { value: 'app_both', label: 'Both (Android + iOS)', icon: Smartphone },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch { return dateStr }
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getBuildTypeLabel(type: string): string {
  const map: Record<string, string> = {
    website: 'Website',
    app_android: 'Android App',
    app_ios: 'iOS App',
    app_both: 'Both Apps',
  }
  return map[type] || type
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
    case 'completed':
      return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 border-0 text-xs">{status === 'completed' ? 'Completed' : 'Active'}</Badge>
    case 'pending':
      return <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/15 border-0 text-xs">Pending</Badge>
    case 'verifying':
    case 'generating':
      return <Badge className="bg-sky-500/15 text-sky-600 hover:bg-sky-500/15 border-0 text-xs">{status === 'verifying' ? 'Verifying' : 'Generating'}</Badge>
    case 'failed':
    case 'error':
      return <Badge className="bg-red-500/15 text-red-600 hover:bg-red-500/15 border-0 text-xs">{status === 'failed' ? 'Failed' : 'Error'}</Badge>
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>
  }
}

function parseSocialLinks(raw: string | null): SocialLinksData {
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

// ── Loading Skeletons ─────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-9 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-96 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  )
}

// ── Live Preview Card ─────────────────────────────────────────────────────────
function LivePreviewCard({ config }: { config: ConfigFormState }) {
  return (
    <Card className="bg-white shadow-sm rounded-xl overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Eye className="size-4 text-amber-600" />
          Live Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="rounded-lg overflow-hidden border border-gray-200 shadow-inner">
          {/* Browser chrome */}
          <div className="bg-gray-100 border-b border-gray-200 px-3 py-1.5 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="size-2.5 rounded-full bg-red-400" />
              <div className="size-2.5 rounded-full bg-yellow-400" />
              <div className="size-2.5 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 bg-white rounded px-2 py-0.5 text-xs text-gray-400 font-mono truncate">
              {config.orgName || 'yourbrand'}.com
            </div>
          </div>
          {/* Page preview */}
          <div
            className="min-h-56 relative"
            style={{ fontFamily: config.fontFamily || 'Inter' }}
          >
            {/* Navbar */}
            <div
              className="flex items-center justify-between px-3 py-2"
              style={{ backgroundColor: config.primaryColor || '#d97706' }}
            >
              <div className="flex items-center gap-2">
                {config.logo ? (
                  <img src={config.logo} alt="Logo" className="size-5 rounded object-contain bg-white/20" />
                ) : (
                  <div className="size-5 rounded bg-white/25 flex items-center justify-center text-[8px] font-bold text-white">
                    {(config.orgName || 'B')[0]}
                  </div>
                )}
                <span className="text-white text-xs font-bold truncate max-w-[80px]">
                  {config.orgName || 'Brand Name'}
                </span>
              </div>
              <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="text-white/70 text-[7px]">Link {i}</div>
                ))}
              </div>
            </div>

            {/* Hero Section */}
            <div
              className="px-3 py-4 text-center relative"
              style={{
                backgroundColor: config.secondaryColor || '#1f2937',
                backgroundImage: config.heroImage ? `url(${config.heroImage})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {config.heroImage && <div className="absolute inset-0 bg-black/50" />}
              <div className="relative z-10">
                <h2 className="text-white text-sm font-bold mb-1 truncate">
                  {config.heroTitle || 'Welcome to ' + (config.orgName || 'Our Platform')}
                </h2>
                <p className="text-white/70 text-[9px] truncate">
                  {config.heroSubtitle || 'Learn from the best educators'}
                </p>
                <button
                  className="mt-2 px-3 py-1 rounded text-[8px] font-bold text-white"
                  style={{ backgroundColor: config.accentColor || '#d97706' }}
                >
                  Explore Now
                </button>
              </div>
            </div>

            {/* Content preview */}
            <div className="px-3 py-2 bg-white">
              <div className="grid grid-cols-2 gap-1.5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="rounded border border-gray-100 p-1.5">
                    <div className="h-6 rounded bg-gray-100 mb-1" />
                    <div className="h-1.5 bg-gray-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div
              className="px-3 py-1.5 text-center text-white text-[7px]"
              style={{ backgroundColor: config.primaryColor || '#d97706' }}
            >
              {config.footerText || `© ${new Date().getFullYear()} ${config.orgName || 'Brand'}. All rights reserved.`}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminWhiteLabelPage() {
  // ── State ──
  const [teachers, setTeachers] = useState<TeacherData[]>([])
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  // Config state
  const [config, setConfig] = useState<ConfigFormState>(defaultConfigForm)
  const [configLoading, setConfigLoading] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)

  // Domain state
  const [domains, setDomains] = useState<CustomDomainData[]>([])
  const [domainsLoading, setDomainsLoading] = useState(false)
  const [newDomain, setNewDomain] = useState('')
  const [newDomainTarget, setNewDomainTarget] = useState('website')
  const [addingDomain, setAddingDomain] = useState(false)
  const [deleteDomainId, setDeleteDomainId] = useState<string | null>(null)

  // Build state
  const [builds, setBuilds] = useState<BuildRecordData[]>([])
  const [buildsLoading, setBuildsLoading] = useState(false)
  const [buildDialogOpen, setBuildDialogOpen] = useState(false)
  const [buildType, setBuildType] = useState('website')
  const [buildChangelog, setBuildChangelog] = useState('')
  const [creatingBuild, setCreatingBuild] = useState(false)

  // Active tab
  const [activeTab, setActiveTab] = useState('branding')

  // ── Fetch teachers ──
  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true)
      setFetchError('')
      const res = await apiFetch('/api/admin/teachers')
      const data = await res.json()
      if (data.success) {
        setTeachers(data.teachers)
      } else {
        setFetchError(data.message || 'Failed to fetch teachers')
      }
    } catch {
      setFetchError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  // ── Fetch data when teacher changes ──
  const fetchConfig = useCallback(async () => {
    if (!selectedTeacherId) return
    try {
      setConfigLoading(true)
      const res = await apiFetch(`/api/admin/white-label?teacherId=${selectedTeacherId}&section=config`)
      const data = await res.json()
      if (data.success && data.config) {
        const c = data.config as WhiteLabelConfig
        setConfig({
          orgName: c.orgName || '',
          logo: c.logo || '',
          favicon: c.favicon || '',
          primaryColor: c.primaryColor || '#d97706',
          secondaryColor: c.secondaryColor || '#1f2937',
          accentColor: c.accentColor || '#d97706',
          fontFamily: c.fontFamily || 'Inter',
          customCSS: c.customCSS || '',
          heroTitle: c.heroTitle || '',
          heroSubtitle: c.heroSubtitle || '',
          heroImage: c.heroImage || '',
          footerText: c.footerText || '',
          socialLinks: parseSocialLinks(c.socialLinks),
          seoTitle: c.seoTitle || '',
          seoDescription: c.seoDescription || '',
          pwaEnabled: c.pwaEnabled || false,
          analyticsId: c.analyticsId || '',
          facebookPixelId: c.facebookPixelId || '',
          templateId: c.templateId || 'default',
        })
      }
    } catch {
      toast.error('Failed to load config')
    } finally {
      setConfigLoading(false)
    }
  }, [selectedTeacherId])

  const fetchDomains = useCallback(async () => {
    if (!selectedTeacherId) return
    try {
      setDomainsLoading(true)
      const res = await apiFetch(`/api/admin/white-label?teacherId=${selectedTeacherId}&section=domains`)
      const data = await res.json()
      if (data.success) {
        setDomains(data.domains || [])
      }
    } catch {
      toast.error('Failed to load domains')
    } finally {
      setDomainsLoading(false)
    }
  }, [selectedTeacherId])

  const fetchBuilds = useCallback(async () => {
    if (!selectedTeacherId) return
    try {
      setBuildsLoading(true)
      const res = await apiFetch(`/api/admin/white-label?teacherId=${selectedTeacherId}&section=builds`)
      const data = await res.json()
      if (data.success) {
        setBuilds(data.builds || [])
      }
    } catch {
      toast.error('Failed to load builds')
    } finally {
      setBuildsLoading(false)
    }
  }, [selectedTeacherId])

  useEffect(() => {
    if (selectedTeacherId) {
      fetchConfig()
      fetchDomains()
      fetchBuilds()
    } else {
      setConfig(defaultConfigForm)
      setDomains([])
      setBuilds([])
    }
  }, [selectedTeacherId, fetchConfig, fetchDomains, fetchBuilds])

  // Auto-refresh builds to catch simulated completions
  useEffect(() => {
    if (!selectedTeacherId) return
    const hasPendingBuilds = builds.some(b => b.status === 'pending' || b.status === 'generating')
    if (!hasPendingBuilds) return
    const interval = setInterval(() => fetchBuilds(), 4000)
    return () => clearInterval(interval)
  }, [selectedTeacherId, builds, fetchBuilds])

  // ── Selected teacher info ──
  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId)

  // ── Save config handler ──
  const handleSaveConfig = async () => {
    if (!selectedTeacherId) return
    try {
      setSavingConfig(true)
      const res = await apiFetch('/api/admin/white-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_config',
          teacherId: selectedTeacherId,
          config: {
            orgName: config.orgName,
            logo: config.logo || null,
            favicon: config.favicon || null,
            primaryColor: config.primaryColor,
            secondaryColor: config.secondaryColor || null,
            accentColor: config.accentColor,
            fontFamily: config.fontFamily,
            customCSS: config.customCSS || null,
            heroTitle: config.heroTitle || null,
            heroSubtitle: config.heroSubtitle || null,
            heroImage: config.heroImage || null,
            footerText: config.footerText || null,
            socialLinks: config.socialLinks,
            seoTitle: config.seoTitle || null,
            seoDescription: config.seoDescription || null,
            pwaEnabled: config.pwaEnabled,
            analyticsId: config.analyticsId || null,
            facebookPixelId: config.facebookPixelId || null,
            templateId: config.templateId,
          },
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Branding config saved!', { description: 'White-label settings updated successfully.' })
      } else {
        toast.error('Save failed', { description: data.message })
      }
    } catch {
      toast.error('Save failed', { description: 'Network error. Please try again.' })
    } finally {
      setSavingConfig(false)
    }
  }

  // ── Add domain handler ──
  const handleAddDomain = async () => {
    if (!selectedTeacherId || !newDomain.trim()) return
    if (!selectedTeacher?.organization?.id) {
      toast.error('Teacher has no organization')
      return
    }
    try {
      setAddingDomain(true)
      const res = await apiFetch('/api/admin/white-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_domain',
          teacherId: selectedTeacherId,
          domain: newDomain.trim(),
          organizationId: selectedTeacher.organization.id,
          targetType: newDomainTarget,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Domain added!', { description: `${newDomain} is now pending verification.` })
        setNewDomain('')
        fetchDomains()
      } else {
        toast.error('Failed to add domain', { description: data.message })
      }
    } catch {
      toast.error('Failed to add domain')
    } finally {
      setAddingDomain(false)
    }
  }

  // ── Verify domain handler ──
  const handleVerifyDomain = async (domainId: string) => {
    try {
      const res = await apiFetch('/api/admin/white-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_domain', domainId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Domain verified!', { description: 'SSL certificate has been provisioned.' })
        fetchDomains()
      } else {
        toast.error('Verification failed', { description: data.message })
      }
    } catch {
      toast.error('Verification failed')
    }
  }

  // ── Delete domain handler ──
  const handleDeleteDomain = async () => {
    if (!deleteDomainId) return
    try {
      const res = await apiFetch('/api/admin/white-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_domain', domainId: deleteDomainId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Domain removed')
        fetchDomains()
      } else {
        toast.error('Failed to delete domain', { description: data.message })
      }
    } catch {
      toast.error('Failed to delete domain')
    } finally {
      setDeleteDomainId(null)
    }
  }

  // ── Create build handler ──
  const handleCreateBuild = async () => {
    if (!selectedTeacherId) return
    try {
      setCreatingBuild(true)
      const res = await apiFetch('/api/admin/white-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rebuild',
          teacherId: selectedTeacherId,
          type: buildType,
          changelog: buildChangelog.trim() || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Build queued!', { description: `${getBuildTypeLabel(buildType)} build v${data.build?.version} has been started.` })
        setBuildDialogOpen(false)
        setBuildChangelog('')
        fetchBuilds()
      } else {
        toast.error('Build failed', { description: data.message })
      }
    } catch {
      toast.error('Build failed')
    } finally {
      setCreatingBuild(false)
    }
  }

  // ── Update social link helper ──
  const updateSocialLink = (key: keyof SocialLinksData, value: string) => {
    setConfig(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value },
    }))
  }

  // ── Render ──
  if (loading) return <PageSkeleton />

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-9 rounded-lg bg-amber-100">
              <Palette className="size-5 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">White-Label Builder</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1.5 ml-[46px]">
            Configure branding, domains &amp; builds for each teacher
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 border-amber-200 text-amber-700 hover:bg-amber-50 shrink-0 self-start sm:self-auto"
          onClick={fetchTeachers}
          disabled={loading}
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Error State */}
      {fetchError && (
        <Card className="bg-white shadow-sm rounded-xl border border-red-100">
          <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
            <div className="flex items-center justify-center size-14 rounded-full bg-red-50">
              <AlertCircle className="size-7 text-red-500" />
            </div>
            <p className="text-sm text-muted-foreground">{fetchError}</p>
            <Button variant="outline" size="sm" onClick={fetchTeachers} className="gap-2">
              <RefreshCw className="size-3.5" /> Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Teacher Selector */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <Card className="bg-white shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <Users className="size-4 text-amber-600" />
                <Label className="text-sm font-medium text-gray-700">Select Teacher</Label>
              </div>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger className="w-full sm:w-[360px] bg-white border-gray-200 focus:border-amber-300">
                  <SelectValue placeholder="Choose a teacher to configure..." />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: t.organization?.accentColor || '#d97706' }} />
                        <span>{t.name}</span>
                        <span className="text-muted-foreground text-xs">({t.organization?.name || 'No Org'})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTeacher && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="size-3.5" />
                  <span>{selectedTeacher.organization?.name || 'No Organization'}</span>
                  {selectedTeacher.organization?.code && (
                    <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                      {selectedTeacher.organization.code}
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* No teacher selected state */}
      {!selectedTeacherId && !fetchError && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="bg-white shadow-sm rounded-xl">
            <CardContent className="p-10 flex flex-col items-center justify-center gap-4">
              <div className="flex items-center justify-center size-16 rounded-full bg-amber-50">
                <Palette className="size-8 text-amber-400" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-gray-900">Select a teacher to begin</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a teacher from the dropdown above to manage their white-label branding, domains, and builds.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main Content */}
      {selectedTeacherId && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="bg-white border border-gray-200 shadow-sm rounded-lg p-1 h-auto">
              <TabsTrigger value="branding" className="gap-2 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 rounded-md px-4 py-2 text-sm">
                <Palette className="size-4" /> Branding
              </TabsTrigger>
              <TabsTrigger value="domains" className="gap-2 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 rounded-md px-4 py-2 text-sm">
                <Globe className="size-4" /> Domains
              </TabsTrigger>
              <TabsTrigger value="builds" className="gap-2 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700 rounded-md px-4 py-2 text-sm">
                <Hammer className="size-4" /> Build History
              </TabsTrigger>
            </TabsList>

            {/* ─── BRANDING TAB ──────────────────────────────────────────── */}
            <TabsContent value="branding" className="space-y-6 mt-4">
              {configLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <Card className="bg-white shadow-sm rounded-xl"><CardContent className="p-6"><div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div></CardContent></Card>
                  </div>
                  <Skeleton className="h-96 rounded-xl" />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Form fields */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Basic Branding */}
                    <Card className="bg-white shadow-sm rounded-xl">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Building2 className="size-4 text-amber-600" />
                          Basic Branding
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-700">Organization Name</Label>
                            <Input
                              value={config.orgName}
                              onChange={e => setConfig(prev => ({ ...prev, orgName: e.target.value }))}
                              placeholder="e.g. My Academy"
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-700">Font Family</Label>
                            <Select value={config.fontFamily} onValueChange={v => setConfig(prev => ({ ...prev, fontFamily: v }))}>
                              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {FONT_OPTIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-700">Logo URL</Label>
                            <div className="flex gap-2">
                              <Input
                                value={config.logo}
                                onChange={e => setConfig(prev => ({ ...prev, logo: e.target.value }))}
                                placeholder="https://..."
                                className="h-9 text-sm flex-1"
                              />
                              {config.logo && (
                                <img src={config.logo} alt="Logo preview" className="size-9 rounded border border-gray-200 object-contain bg-white p-0.5 shrink-0" />
                              )}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-700">Favicon URL</Label>
                            <Input
                              value={config.favicon}
                              onChange={e => setConfig(prev => ({ ...prev, favicon: e.target.value }))}
                              placeholder="https://..."
                              className="h-9 text-sm"
                            />
                          </div>
                        </div>

                        {/* Colors */}
                        <Separator />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-700">Primary Color</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={config.primaryColor}
                                onChange={e => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                                className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-1 shrink-0"
                              />
                              <Input
                                value={config.primaryColor}
                                onChange={e => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                                className="h-9 text-sm font-mono"
                              />
                              <div className="size-9 rounded-lg border border-gray-200 shrink-0" style={{ backgroundColor: config.primaryColor }} />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-700">Secondary Color</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={config.secondaryColor}
                                onChange={e => setConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                                className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-1 shrink-0"
                              />
                              <Input
                                value={config.secondaryColor}
                                onChange={e => setConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
                                className="h-9 text-sm font-mono"
                              />
                              <div className="size-9 rounded-lg border border-gray-200 shrink-0" style={{ backgroundColor: config.secondaryColor }} />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-700">Accent Color</Label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={config.accentColor}
                                onChange={e => setConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                                className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-1 shrink-0"
                              />
                              <Input
                                value={config.accentColor}
                                onChange={e => setConfig(prev => ({ ...prev, accentColor: e.target.value }))}
                                className="h-9 text-sm font-mono"
                              />
                              <div className="size-9 rounded-lg border border-gray-200 shrink-0" style={{ backgroundColor: config.accentColor }} />
                            </div>
                          </div>
                        </div>

                        {/* Color presets */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground font-medium">Presets:</span>
                          {['#d97706', '#059669', '#7c3aed', '#dc2626', '#0891b2', '#c026d3', '#ea580c', '#16a34a', '#0d9488', '#4f46e5'].map(color => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setConfig(prev => ({ ...prev, primaryColor: color, accentColor: color }))}
                              className={`size-6 rounded-full border-2 transition-all cursor-pointer ${
                                config.primaryColor === color ? 'border-gray-900 scale-110' : 'border-transparent hover:border-gray-300'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Hero Section */}
                    <Card className="bg-white shadow-sm rounded-xl">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Monitor className="size-4 text-amber-600" />
                          Hero Section
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-700">Hero Title</Label>
                            <Input
                              value={config.heroTitle}
                              onChange={e => setConfig(prev => ({ ...prev, heroTitle: e.target.value }))}
                              placeholder="Welcome to Our Platform"
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-700">Hero Subtitle</Label>
                            <Input
                              value={config.heroSubtitle}
                              onChange={e => setConfig(prev => ({ ...prev, heroSubtitle: e.target.value }))}
                              placeholder="Learn from the best educators"
                              className="h-9 text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-gray-700">Hero Image URL</Label>
                          <Input
                            value={config.heroImage}
                            onChange={e => setConfig(prev => ({ ...prev, heroImage: e.target.value }))}
                            placeholder="https://example.com/hero-bg.jpg"
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-gray-700">Footer Text</Label>
                          <Input
                            value={config.footerText}
                            onChange={e => setConfig(prev => ({ ...prev, footerText: e.target.value }))}
                            placeholder="© 2024 My Academy. All rights reserved."
                            className="h-9 text-sm"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* SEO & Social */}
                    <Card className="bg-white shadow-sm rounded-xl">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Search className="size-4 text-amber-600" />
                          SEO &amp; Social
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-700">SEO Title</Label>
                            <Input
                              value={config.seoTitle}
                              onChange={e => setConfig(prev => ({ ...prev, seoTitle: e.target.value }))}
                              placeholder="My Academy - Online Learning"
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-700">SEO Description</Label>
                            <Input
                              value={config.seoDescription}
                              onChange={e => setConfig(prev => ({ ...prev, seoDescription: e.target.value }))}
                              placeholder="Best online courses for exam preparation"
                              className="h-9 text-sm"
                            />
                          </div>
                        </div>

                        <Separator />
                        <p className="text-xs font-medium text-gray-700">Social Links</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            { key: 'whatsapp' as const, label: 'WhatsApp', placeholder: 'https://wa.me/...' },
                            { key: 'youtube' as const, label: 'YouTube', placeholder: 'https://youtube.com/...' },
                            { key: 'telegram' as const, label: 'Telegram', placeholder: 'https://t.me/...' },
                            { key: 'instagram' as const, label: 'Instagram', placeholder: 'https://instagram.com/...' },
                            { key: 'twitter' as const, label: 'Twitter / X', placeholder: 'https://x.com/...' },
                            { key: 'facebook' as const, label: 'Facebook', placeholder: 'https://facebook.com/...' },
                          ].map(({ key, label, placeholder }) => (
                            <div key={key} className="space-y-1">
                              <Label className="text-xs text-gray-600">{label}</Label>
                              <Input
                                value={config.socialLinks[key] || ''}
                                onChange={e => updateSocialLink(key, e.target.value)}
                                placeholder={placeholder}
                                className="h-8 text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Advanced */}
                    <Card className="bg-white shadow-sm rounded-xl">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Code2 className="size-4 text-amber-600" />
                          Advanced Settings
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-700">Template</Label>
                            <Select value={config.templateId} onValueChange={v => setConfig(prev => ({ ...prev, templateId: v }))}>
                              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {TEMPLATE_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-3 pt-5">
                            <Switch
                              checked={config.pwaEnabled}
                              onCheckedChange={v => setConfig(prev => ({ ...prev, pwaEnabled: v }))}
                            />
                            <Label className="text-sm text-gray-700">Enable PWA</Label>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-700">Google Analytics ID</Label>
                            <Input
                              value={config.analyticsId}
                              onChange={e => setConfig(prev => ({ ...prev, analyticsId: e.target.value }))}
                              placeholder="G-XXXXXXXXXX"
                              className="h-9 text-sm font-mono"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-gray-700">Facebook Pixel ID</Label>
                            <Input
                              value={config.facebookPixelId}
                              onChange={e => setConfig(prev => ({ ...prev, facebookPixelId: e.target.value }))}
                              placeholder="Pixel ID"
                              className="h-9 text-sm font-mono"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-gray-700">Custom CSS</Label>
                          <Textarea
                            value={config.customCSS}
                            onChange={e => setConfig(prev => ({ ...prev, customCSS: e.target.value }))}
                            placeholder="/* Custom styles */&#10;.hero { padding: 2rem; }"
                            className="text-xs font-mono min-h-[100px]"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Save Button */}
                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveConfig}
                        disabled={savingConfig}
                        className="bg-amber-600 hover:bg-amber-700 text-white gap-2 min-w-[140px]"
                      >
                        {savingConfig ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="size-4" />
                            Save Config
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="lg:col-span-1">
                    <div className="sticky top-6">
                      <LivePreviewCard config={config} />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ─── DOMAINS TAB ────────────────────────────────────────────── */}
            <TabsContent value="domains" className="space-y-4 mt-4">
              {/* Add Domain Form */}
              <Card className="bg-white shadow-sm rounded-xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Plus className="size-4 text-amber-600" />
                    Add Custom Domain
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs font-medium text-gray-700">Domain</Label>
                      <Input
                        value={newDomain}
                        onChange={e => setNewDomain(e.target.value)}
                        placeholder="courses.teachername.com"
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="w-full sm:w-48 space-y-1.5">
                      <Label className="text-xs font-medium text-gray-700">Target Type</Label>
                      <Select value={newDomainTarget} onValueChange={setNewDomainTarget}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="website">Website</SelectItem>
                          <SelectItem value="app_web">App (Web)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={handleAddDomain}
                        disabled={addingDomain || !newDomain.trim()}
                        className="bg-amber-600 hover:bg-amber-700 text-white gap-2 h-9"
                      >
                        {addingDomain ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                        Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Domains Table */}
              <Card className="bg-white shadow-sm rounded-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Globe className="size-4 text-amber-600" />
                      Custom Domains
                    </CardTitle>
                    <Badge variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-0 text-xs">
                      {domains.length} domain{domains.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  {domainsLoading ? (
                    <div className="space-y-3 px-6 pb-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="size-8 rounded-lg shrink-0" />
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                          <Skeleton className="h-4 w-20 ml-auto" />
                        </div>
                      ))}
                    </div>
                  ) : domains.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <Globe className="size-10 text-gray-300 mb-3" />
                      <p className="text-sm font-medium text-gray-500">No custom domains yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Add a domain above to get started</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-gray-100 hover:bg-transparent">
                            <TableHead className="text-xs font-medium text-muted-foreground">Domain</TableHead>
                            <TableHead className="text-xs font-medium text-muted-foreground">Target</TableHead>
                            <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                            <TableHead className="text-xs font-medium text-muted-foreground">SSL</TableHead>
                            <TableHead className="text-xs font-medium text-muted-foreground">Verified</TableHead>
                            <TableHead className="text-xs font-medium text-muted-foreground text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {domains.map(domain => (
                            <TableRow key={domain.id} className="border-b border-gray-50">
                              <TableCell className="text-sm font-medium">
                                <div className="flex items-center gap-2">
                                  <Globe className="size-3.5 text-muted-foreground" />
                                  {domain.domain}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {domain.targetType === 'website' ? 'Website' : 'App (Web)'}
                              </TableCell>
                              <TableCell>{getStatusBadge(domain.status)}</TableCell>
                              <TableCell>
                                {domain.sslEnabled ? (
                                  <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15 border-0 text-xs">
                                    <Lock className="size-3 mr-1" /> SSL
                                  </Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 border-0 text-xs">
                                    <Unlock className="size-3 mr-1" /> No SSL
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {domain.dnsVerifiedAt ? formatDate(domain.dnsVerifiedAt) : '—'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {domain.status !== 'active' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleVerifyDomain(domain.id)}
                                      className="h-7 text-xs gap-1 border-amber-200 text-amber-700 hover:bg-amber-50"
                                    >
                                      <Shield className="size-3" /> Verify
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteDomainId(domain.id)}
                                    className="h-7 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 gap-1"
                                  >
                                    <Trash2 className="size-3" /> Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* DNS Instructions */}
              <Card className="bg-white shadow-sm rounded-xl border-l-4 border-l-sky-400">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Info className="size-5 text-sky-500 shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900">DNS Configuration Instructions</p>
                      <p className="text-xs text-muted-foreground">
                        To point your custom domain to our platform, add the following DNS record with your domain registrar:
                      </p>
                      <div className="bg-gray-50 rounded-lg p-3 font-mono text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-16">Type:</span>
                          <span className="font-semibold">CNAME</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-16">Name:</span>
                          <span className="font-semibold">courses</span>
                          <span className="text-muted-foreground">(or your subdomain)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-16">Value:</span>
                          <span className="font-semibold">cname.yourplatform.com</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        After adding the CNAME record, click &ldquo;Verify&rdquo; to check DNS propagation. SSL certificates are automatically provisioned after verification.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delete Domain Dialog */}
              <AlertDialog open={!!deleteDomainId} onOpenChange={() => setDeleteDomainId(null)}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Domain</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove this domain? This will also remove any SSL certificates associated with it.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteDomain} className="bg-red-600 hover:bg-red-700 text-white">
                      Remove Domain
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TabsContent>

            {/* ─── BUILD HISTORY TAB ──────────────────────────────────────── */}
            <TabsContent value="builds" className="space-y-4 mt-4">
              {/* Build action */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileArchive className="size-4 text-amber-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {builds.length} build{builds.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <Button
                  onClick={() => setBuildDialogOpen(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                  disabled={!selectedTeacherId}
                >
                  <Plus className="size-4" />
                  Generate New Build
                </Button>
              </div>

              {/* Build History Table */}
              <Card className="bg-white shadow-sm rounded-xl">
                <CardContent className="px-0 pb-0">
                  {buildsLoading ? (
                    <div className="space-y-3 px-6 py-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <Skeleton className="size-8 rounded-lg shrink-0" />
                          <Skeleton className="h-4 w-36" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                          <Skeleton className="h-4 w-20 ml-auto" />
                        </div>
                      ))}
                    </div>
                  ) : builds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <Hammer className="size-10 text-gray-300 mb-3" />
                      <p className="text-sm font-medium text-gray-500">No builds yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Generate your first build to get started</p>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-96">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-gray-100 hover:bg-transparent">
                            <TableHead className="text-xs font-medium text-muted-foreground">Date</TableHead>
                            <TableHead className="text-xs font-medium text-muted-foreground">Type</TableHead>
                            <TableHead className="text-xs font-medium text-muted-foreground">Version</TableHead>
                            <TableHead className="text-xs font-medium text-muted-foreground">Status</TableHead>
                            <TableHead className="text-xs font-medium text-muted-foreground">Size</TableHead>
                            <TableHead className="text-xs font-medium text-muted-foreground">Triggered By</TableHead>
                            <TableHead className="text-xs font-medium text-muted-foreground text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <AnimatePresence>
                            {builds.map(build => {
                              const TypeIcon = build.type === 'website' ? Globe : Smartphone
                              return (
                                <motion.tr
                                  key={build.id}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 8 }}
                                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                                >
                                  <TableCell className="text-xs text-muted-foreground py-3">
                                    <div className="flex items-center gap-2">
                                      <Clock className="size-3 text-gray-400" />
                                      {formatDate(build.createdAt)}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1.5">
                                      <TypeIcon className="size-3.5 text-muted-foreground" />
                                      <span className="text-xs font-medium">{getBuildTypeLabel(build.type)}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs font-mono text-muted-foreground">
                                    v{build.version}
                                  </TableCell>
                                  <TableCell>{getStatusBadge(build.status)}</TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {formatFileSize(build.fileSize)}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground">
                                    {build.triggeredByName || '—'}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {build.status === 'completed' ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs gap-1 border-amber-200 text-amber-700 hover:bg-amber-50"
                                        onClick={() => {
                                          window.location.href = `/api/admin/download-build?buildId=${build.id}`
                                        }}
                                      >
                                        <ArrowDownToLine className="size-3" /> Download
                                      </Button>
                                    ) : build.status === 'pending' || build.status === 'generating' ? (
                                      <div className="flex items-center gap-1.5 text-xs text-amber-600 justify-end">
                                        <Loader2 className="size-3.5 animate-spin" />
                                        <span>Processing...</span>
                                      </div>
                                    ) : build.status === 'failed' ? (
                                      <span className="text-xs text-red-500">{build.error || 'Failed'}</span>
                                    ) : null}
                                  </TableCell>
                                </motion.tr>
                              )
                            })}
                          </AnimatePresence>
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Build Dialog */}
              <Dialog open={buildDialogOpen} onOpenChange={setBuildDialogOpen}>
                <DialogContent className="sm:max-w-[480px]">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Hammer className="size-5 text-amber-600" />
                      Generate New Build
                    </DialogTitle>
                    <DialogDescription>
                      Choose a build type and optionally add a changelog.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-700">Build Type</Label>
                      <Select value={buildType} onValueChange={setBuildType}>
                        <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {BUILD_TYPES.map(bt => (
                            <SelectItem key={bt.value} value={bt.value}>
                              <span className="flex items-center gap-2">
                                <bt.icon className="size-3.5" />
                                {bt.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-700">Changelog (optional)</Label>
                      <Textarea
                        value={buildChangelog}
                        onChange={e => setBuildChangelog(e.target.value)}
                        placeholder="What changed in this build?"
                        className="text-sm min-h-[80px]"
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => setBuildDialogOpen(false)} disabled={creatingBuild}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateBuild}
                      disabled={creatingBuild}
                      className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                    >
                      {creatingBuild ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Hammer className="size-4" />
                          Generate Build
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </div>
  )
}
