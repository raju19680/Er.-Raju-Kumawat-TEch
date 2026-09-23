'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  SlidersHorizontal,
  Plus,
  Trash2,
  RefreshCw,
  Pencil,
  Eye,
  EyeOff,
  LayoutDashboard,
  BarChart3,
  Table,
  List,
  Palette,
  PanelLeft,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Check,
  RotateCcw,
  Sparkles,
  Monitor,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// ── Types ────────────────────────────────────────────────────────────────────
interface DashboardWidget {
  id: string
  widgetKey: string
  title: string
  type: string
  config: string | null
  dataSource: string | null
  size: string
  order: number
  isVisible: boolean
  refreshedAt: string | null
  createdAt: string
  updatedAt: string
}

interface PlatformTheme {
  id: string
  key: string
  name: string
  primaryColor: string
  secondaryColor: string | null
  accentColor: string
  backgroundColor: string
  sidebarStyle: string
  sidebarColor: string
  topbarStyle: string
  borderRadius: string
  fontFamily: string
  customCSS: string | null
  logo: string | null
  favicon: string | null
  loginBackground: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface SidebarConfigItem {
  id: string
  key: string
  label: string
  icon: string
  targetPage: string
  order: number
  isVisible: boolean
  parentId: string | null
  badge: string | null
  createdAt: string
  updatedAt: string
}

// ── Animation variants ───────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// ── Constants ────────────────────────────────────────────────────────────────
const WIDGET_TEMPLATES = [
  { widgetKey: 'revenue_chart', title: 'Revenue Chart', type: 'chart', size: 'large', dataSource: '/api/admin/analytics', config: '{"chartType":"line","period":"30d"}' },
  { widgetKey: 'student_stats', title: 'Student Stats', type: 'stat', size: 'small', dataSource: '/api/admin/analytics', config: '{"metric":"totalStudents"}' },
  { widgetKey: 'recent_orders', title: 'Recent Orders', type: 'list', size: 'medium', dataSource: '/api/admin/orders', config: '{"limit":5}' },
  { widgetKey: 'active_teachers', title: 'Active Teachers', type: 'stat', size: 'small', dataSource: '/api/admin/teachers', config: '{"metric":"activeTeachers"}' },
  { widgetKey: 'platform_health', title: 'Platform Health', type: 'stat', size: 'small', dataSource: '/api/admin/health', config: '{}' },
  { widgetKey: 'content_overview', title: 'Content Overview', type: 'table', size: 'full', dataSource: '/api/admin/content', config: '{}' },
]

const WIDGET_TYPE_OPTIONS = [
  { value: 'stat', label: 'Stat', icon: BarChart3 },
  { value: 'chart', label: 'Chart', icon: LayoutDashboard },
  { value: 'table', label: 'Table', icon: Table },
  { value: 'list', label: 'List', icon: List },
  { value: 'custom', label: 'Custom', icon: Sparkles },
]

const WIDGET_SIZE_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'full', label: 'Full Width' },
]

const THEME_KEY_OPTIONS = [
  { value: 'admin_theme', label: 'Admin Theme' },
  { value: 'cms_theme', label: 'CMS Theme' },
  { value: 'student_theme', label: 'Student Theme' },
]

const SIDEBAR_STYLE_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'compact', label: 'Compact' },
  { value: 'wide', label: 'Wide' },
  { value: 'hidden', label: 'Hidden' },
]

const TOPBAR_STYLE_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'compact', label: 'Compact' },
  { value: 'hidden', label: 'Hidden' },
]

const FONT_OPTIONS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Poppins', 'Nunito', 'Raleway', 'Montserrat', 'Playfair Display', 'Source Sans Pro',
]

const LUCIDE_ICONS = [
  'LayoutDashboard', 'Users', 'GraduationCap', 'BarChart3', 'Settings', 'Shield',
  'Building2', 'CreditCard', 'DollarSign', 'TrendingUp', 'UserCog', 'Bell',
  'Receipt', 'BookOpen', 'IndianRupee', 'Hammer', 'FileText', 'Upload',
  'Wallet', 'Activity', 'Megaphone', 'Flag', 'Mail', 'Database',
  'BellRing', 'Smartphone', 'Palette', 'Globe2', 'SlidersHorizontal',
  'ClipboardList', 'Home', 'Calendar', 'Heart', 'Star', 'Zap',
]

const ADMIN_PAGE_OPTIONS: { value: string; label: string }[] = [
  { value: 'admin-dashboard', label: 'Dashboard' },
  { value: 'admin-teachers', label: 'Teachers' },
  { value: 'admin-students', label: 'Students' },
  { value: 'admin-organizations', label: 'Organizations' },
  { value: 'admin-analytics', label: 'Analytics' },
  { value: 'admin-orders', label: 'Orders' },
  { value: 'admin-notifications', label: 'Notifications' },
  { value: 'admin-settings', label: 'Settings' },
  { value: 'admin-module-access', label: 'Module Access' },
  { value: 'admin-content', label: 'Content' },
  { value: 'admin-security', label: 'Security' },
  { value: 'admin-commissions', label: 'Commissions' },
  { value: 'admin-builds', label: 'Builds' },
  { value: 'admin-audit-log', label: 'Audit Log' },
  { value: 'admin-bulk-ops', label: 'Bulk Ops' },
  { value: 'admin-payouts', label: 'Payouts' },
  { value: 'admin-health', label: 'Health' },
  { value: 'admin-announcements', label: 'Announcements' },
  { value: 'admin-feature-flags', label: 'Feature Flags' },
  { value: 'admin-email-templates', label: 'Email Templates' },
  { value: 'admin-scheduled-notifications', label: 'Scheduled Alerts' },
  { value: 'admin-db-backup', label: 'DB Backup' },
  { value: 'admin-app-versions', label: 'App Versions' },
  { value: 'admin-dynamic-config', label: 'Dynamic Config' },
]

const SIZE_BADGE_MAP: Record<string, { label: string; className: string }> = {
  small: { label: 'SM', className: 'bg-blue-50 text-blue-700 border-0' },
  medium: { label: 'MD', className: 'bg-violet-50 text-violet-700 border-0' },
  large: { label: 'LG', className: 'bg-emerald-50 text-emerald-700 border-0' },
  full: { label: 'Full', className: 'bg-orange-50 text-orange-700 border-0' },
}

const TYPE_BADGE_MAP: Record<string, { label: string; className: string }> = {
  stat: { label: 'Stat', className: 'bg-amber-50 text-amber-700 border-0' },
  chart: { label: 'Chart', className: 'bg-emerald-50 text-emerald-700 border-0' },
  table: { label: 'Table', className: 'bg-sky-50 text-sky-700 border-0' },
  list: { label: 'List', className: 'bg-purple-50 text-purple-700 border-0' },
  custom: { label: 'Custom', className: 'bg-rose-50 text-rose-700 border-0' },
}

// ── Color Swatch Input ──────────────────────────────────────────────────────
function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="w-9 h-9 rounded-md border border-gray-200 cursor-pointer p-0.5 bg-white"
          />
        </div>
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="bg-gray-50/80 border-gray-200 font-mono text-sm flex-1"
        />
      </div>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function AdminDynamicConfigPage() {
  const [activeTab, setActiveTab] = useState('widgets')
  const [loading, setLoading] = useState(true)

  // Widget state
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [widgetDialogOpen, setWidgetDialogOpen] = useState(false)
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null)
  const [widgetSubmitting, setWidgetSubmitting] = useState(false)
  const [deletingWidgetId, setDeletingWidgetId] = useState<string | null>(null)

  // Widget form state
  const [wKey, setWKey] = useState('')
  const [wTitle, setWTitle] = useState('')
  const [wType, setWType] = useState('stat')
  const [wSize, setWSize] = useState('medium')
  const [wDataSource, setWDataSource] = useState('')
  const [wConfig, setWConfig] = useState('')
  const [wVisible, setWVisible] = useState(true)

  // Theme state
  const [themes, setThemes] = useState<PlatformTheme[]>([])
  const [themeDialogOpen, setThemeDialogOpen] = useState(false)
  const [editingTheme, setEditingTheme] = useState<PlatformTheme | null>(null)
  const [themeSubmitting, setThemeSubmitting] = useState(false)
  const [applyingThemeId, setApplyingThemeId] = useState<string | null>(null)

  // Theme form state
  const [tKey, setTKey] = useState('admin_theme')
  const [tName, setTName] = useState('')
  const [tPrimary, setTPrimary] = useState('#d97706')
  const [tSecondary, setTSecondary] = useState('')
  const [tAccent, setTAccent] = useState('#d97706')
  const [tBackground, setTBackground] = useState('#ffffff')
  const [tSidebarStyle, setTSidebarStyle] = useState('default')
  const [tSidebarColor, setTSidebarColor] = useState('#ffffff')
  const [tTopbarStyle, setTTopbarStyle] = useState('default')
  const [tBorderRadius, setTBorderRadius] = useState('0.75rem')
  const [tFontFamily, setTFontFamily] = useState('Inter')
  const [tLogo, setTLogo] = useState('')
  const [tFavicon, setTFavicon] = useState('')
  const [tLoginBg, setTLoginBg] = useState('')
  const [tCustomCSS, setTCustomCSS] = useState('')

  // Sidebar state
  const [sidebarItems, setSidebarItems] = useState<SidebarConfigItem[]>([])
  const [sidebarDialogOpen, setSidebarDialogOpen] = useState(false)
  const [editingSidebar, setEditingSidebar] = useState<SidebarConfigItem | null>(null)
  const [sidebarSubmitting, setSidebarSubmitting] = useState(false)
  const [deletingSidebarId, setDeletingSidebarId] = useState<string | null>(null)

  // Sidebar form state
  const [sKey, setSKey] = useState('')
  const [sLabel, setSLabel] = useState('')
  const [sIcon, setSIcon] = useState('LayoutDashboard')
  const [sTargetPage, setSTargetPage] = useState('admin-dashboard')
  const [sOrder, setSOrder] = useState(0)
  const [sParentId, setSParentId] = useState('')
  const [sBadge, setSBadge] = useState('')
  const [sVisible, setSVisible] = useState(true)

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchWidgets = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/dynamic-config?section=widgets')
      const json = await res.json()
      if (json.success) setWidgets(json.widgets)
    } catch {
      toast.error('Failed to load widgets')
    }
  }, [])

  const fetchThemes = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/dynamic-config?section=themes')
      const json = await res.json()
      if (json.success) setThemes(json.themes)
    } catch {
      toast.error('Failed to load themes')
    }
  }, [])

  const fetchSidebar = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/dynamic-config?section=sidebar')
      const json = await res.json()
      if (json.success) setSidebarItems(json.items)
    } catch {
      toast.error('Failed to load sidebar config')
    }
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchWidgets(), fetchThemes(), fetchSidebar()])
    setLoading(false)
  }, [fetchWidgets, fetchThemes, fetchSidebar])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // ── Widget handlers ───────────────────────────────────────────────────────
  const resetWidgetForm = () => {
    setWKey(''); setWTitle(''); setWType('stat'); setWSize('medium')
    setWDataSource(''); setWConfig(''); setWVisible(true)
    setEditingWidget(null)
  }

  const openWidgetDialog = (widget?: DashboardWidget) => {
    if (widget) {
      setEditingWidget(widget)
      setWKey(widget.widgetKey); setWTitle(widget.title); setWType(widget.type)
      setWSize(widget.size); setWDataSource(widget.dataSource || '')
      setWConfig(widget.config || ''); setWVisible(widget.isVisible)
    } else {
      resetWidgetForm()
    }
    setWidgetDialogOpen(true)
  }

  const handleSaveWidget = async () => {
    if (!wKey.trim() || !wTitle.trim()) {
      toast.error('Widget key and title are required.')
      return
    }
    setWidgetSubmitting(true)
    try {
      const res = await apiFetch('/api/admin/dynamic-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_widget',
          id: editingWidget?.id || undefined,
          widgetKey: wKey.trim(),
          title: wTitle.trim(),
          type: wType,
          size: wSize,
          dataSource: wDataSource.trim() || undefined,
          config: wConfig.trim() || undefined,
          order: editingWidget?.order ?? widgets.length,
          isVisible: wVisible,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(editingWidget ? 'Widget updated!' : 'Widget created!')
        setWidgetDialogOpen(false)
        resetWidgetForm()
        fetchWidgets()
      } else {
        toast.error(json.message || 'Failed to save widget')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setWidgetSubmitting(false)
    }
  }

  const handleDeleteWidget = async (id: string) => {
    try {
      const res = await apiFetch('/api/admin/dynamic-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_widget', id }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Widget deleted')
        setDeletingWidgetId(null)
        fetchWidgets()
      } else {
        toast.error(json.message || 'Failed to delete')
      }
    } catch {
      toast.error('Something went wrong.')
    }
  }

  const handleWidgetVisibility = async (widget: DashboardWidget) => {
    try {
      const res = await apiFetch('/api/admin/dynamic-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_widget',
          id: widget.id,
          widgetKey: widget.widgetKey,
          title: widget.title,
          type: widget.type,
          size: widget.size,
          dataSource: widget.dataSource || undefined,
          config: widget.config || undefined,
          order: widget.order,
          isVisible: !widget.isVisible,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(widget.isVisible ? 'Widget hidden' : 'Widget visible')
        fetchWidgets()
      }
    } catch {
      toast.error('Failed to toggle visibility')
    }
  }

  const handleWidgetMove = async (widget: DashboardWidget, direction: 'up' | 'down') => {
    const sorted = [...widgets].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((w) => w.id === widget.id)
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === sorted.length - 1)) return

    const newSorted = [...sorted]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    ;[newSorted[idx], newSorted[swapIdx]] = [newSorted[swapIdx], newSorted[idx]]

    const widgetIds = newSorted.map((w) => w.id)
    try {
      const res = await apiFetch('/api/admin/dynamic-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder_widgets', widgetIds }),
      })
      const json = await res.json()
      if (json.success) {
        fetchWidgets()
      }
    } catch {
      toast.error('Failed to reorder')
    }
  }

  const handleAddTemplate = async (template: typeof WIDGET_TEMPLATES[0]) => {
    try {
      const res = await apiFetch('/api/admin/dynamic-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_widget',
          widgetKey: template.widgetKey,
          title: template.title,
          type: template.type,
          size: template.size,
          dataSource: template.dataSource,
          config: template.config,
          order: widgets.length,
          isVisible: true,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`${template.title} added!`)
        fetchWidgets()
      } else {
        toast.error(json.message || 'Failed to add template')
      }
    } catch {
      toast.error('Something went wrong.')
    }
  }

  // ── Theme handlers ────────────────────────────────────────────────────────
  const resetThemeForm = () => {
    setTKey('admin_theme'); setTName(''); setTPrimary('#d97706')
    setTSecondary(''); setTAccent('#d97706'); setTBackground('#ffffff')
    setTSidebarStyle('default'); setTSidebarColor('#ffffff'); setTTopbarStyle('default')
    setTBorderRadius('0.75rem'); setTFontFamily('Inter')
    setTLogo(''); setTFavicon(''); setTLoginBg(''); setTCustomCSS('')
    setEditingTheme(null)
  }

  const openThemeDialog = (theme?: PlatformTheme) => {
    if (theme) {
      setEditingTheme(theme)
      setTKey(theme.key); setTName(theme.name); setTPrimary(theme.primaryColor)
      setTSecondary(theme.secondaryColor || ''); setTAccent(theme.accentColor)
      setTBackground(theme.backgroundColor); setTSidebarStyle(theme.sidebarStyle)
      setTSidebarColor(theme.sidebarColor); setTTopbarStyle(theme.topbarStyle)
      setTBorderRadius(theme.borderRadius); setTFontFamily(theme.fontFamily)
      setTLogo(theme.logo || ''); setTFavicon(theme.favicon || '')
      setTLoginBg(theme.loginBackground || ''); setTCustomCSS(theme.customCSS || '')
    } else {
      resetThemeForm()
    }
    setThemeDialogOpen(true)
  }

  const handleSaveTheme = async () => {
    if (!tKey || !tName.trim()) {
      toast.error('Theme key and name are required.')
      return
    }
    setThemeSubmitting(true)
    try {
      const res = await apiFetch('/api/admin/dynamic-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_theme',
          id: editingTheme?.id || undefined,
          key: tKey,
          name: tName.trim(),
          primaryColor: tPrimary,
          secondaryColor: tSecondary || null,
          accentColor: tAccent,
          backgroundColor: tBackground,
          sidebarStyle: tSidebarStyle,
          sidebarColor: tSidebarColor,
          topbarStyle: tTopbarStyle,
          borderRadius: tBorderRadius,
          fontFamily: tFontFamily,
          logo: tLogo || null,
          favicon: tFavicon || null,
          loginBackground: tLoginBg || null,
          customCSS: tCustomCSS || null,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(editingTheme ? 'Theme updated!' : 'Theme created!')
        setThemeDialogOpen(false)
        resetThemeForm()
        fetchThemes()
      } else {
        toast.error(json.message || 'Failed to save theme')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setThemeSubmitting(false)
    }
  }

  const handleApplyTheme = async (id: string) => {
    setApplyingThemeId(id)
    try {
      const res = await apiFetch('/api/admin/dynamic-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply_theme', id }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Theme applied!')
        fetchThemes()
      } else {
        toast.error(json.message || 'Failed to apply theme')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setApplyingThemeId(null)
    }
  }

  const handleResetTheme = async (key: string) => {
    try {
      const res = await apiFetch('/api/admin/dynamic-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_theme', key }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Theme reset to defaults!')
        fetchThemes()
      } else {
        toast.error(json.message || 'Failed to reset theme')
      }
    } catch {
      toast.error('Something went wrong.')
    }
  }

  // ── Sidebar handlers ──────────────────────────────────────────────────────
  const resetSidebarForm = () => {
    setSKey(''); setSLabel(''); setSIcon('LayoutDashboard')
    setSTargetPage('admin-dashboard'); setSOrder(0)
    setSParentId(''); setSBadge(''); setSVisible(true)
    setEditingSidebar(null)
  }

  const openSidebarDialog = (item?: SidebarConfigItem) => {
    if (item) {
      setEditingSidebar(item)
      setSKey(item.key); setSLabel(item.label); setSIcon(item.icon)
      setSTargetPage(item.targetPage); setSOrder(item.order)
      setSParentId(item.parentId || ''); setSBadge(item.badge || '')
      setSVisible(item.isVisible)
    } else {
      resetSidebarForm()
    }
    setSidebarDialogOpen(true)
  }

  const handleSaveSidebar = async () => {
    if (!sKey.trim() || !sLabel.trim() || !sIcon || !sTargetPage) {
      toast.error('Key, label, icon, and target page are required.')
      return
    }
    setSidebarSubmitting(true)
    try {
      const res = await apiFetch('/api/admin/dynamic-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_sidebar_item',
          id: editingSidebar?.id || undefined,
          key: sKey.trim(),
          label: sLabel.trim(),
          icon: sIcon,
          targetPage: sTargetPage,
          order: sOrder,
          isVisible: sVisible,
          parentId: sParentId || undefined,
          badge: sBadge.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(editingSidebar ? 'Sidebar item updated!' : 'Sidebar item created!')
        setSidebarDialogOpen(false)
        resetSidebarForm()
        fetchSidebar()
      } else {
        toast.error(json.message || 'Failed to save sidebar item')
      }
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setSidebarSubmitting(false)
    }
  }

  const handleDeleteSidebar = async (id: string) => {
    try {
      const res = await apiFetch('/api/admin/dynamic-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_sidebar_item', id }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Sidebar item deleted')
        setDeletingSidebarId(null)
        fetchSidebar()
      } else {
        toast.error(json.message || 'Failed to delete')
      }
    } catch {
      toast.error('Something went wrong.')
    }
  }

  const handleSidebarVisibility = async (item: SidebarConfigItem) => {
    try {
      const res = await apiFetch('/api/admin/dynamic-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_sidebar_item',
          id: item.id,
          key: item.key,
          label: item.label,
          icon: item.icon,
          targetPage: item.targetPage,
          order: item.order,
          isVisible: !item.isVisible,
          parentId: item.parentId || undefined,
          badge: item.badge || undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(item.isVisible ? 'Item hidden' : 'Item visible')
        fetchSidebar()
      }
    } catch {
      toast.error('Failed to toggle visibility')
    }
  }

  const handleSidebarMove = async (item: SidebarConfigItem, direction: 'up' | 'down') => {
    const sorted = [...sidebarItems].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex((s) => s.id === item.id)
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === sorted.length - 1)) return

    const newSorted = [...sorted]
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    ;[newSorted[idx], newSorted[swapIdx]] = [newSorted[swapIdx], newSorted[idx]]

    const itemIds = newSorted.map((s) => s.id)
    try {
      const res = await apiFetch('/api/admin/dynamic-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder_sidebar', itemIds }),
      })
      const json = await res.json()
      if (json.success) fetchSidebar()
    } catch {
      toast.error('Failed to reorder')
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SlidersHorizontal className="size-6 text-amber-600" />
            Dynamic Configuration
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize dashboard, themes &amp; sidebar
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAll}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="widgets" className="gap-1.5">
              <LayoutDashboard className="size-4" />
              Dashboard Widgets
            </TabsTrigger>
            <TabsTrigger value="themes" className="gap-1.5">
              <Palette className="size-4" />
              Platform Themes
            </TabsTrigger>
            <TabsTrigger value="sidebar" className="gap-1.5">
              <PanelLeft className="size-4" />
              Sidebar Config
            </TabsTrigger>
          </TabsList>

          {/* ── Widgets Tab ───────────────────────────────────────────────── */}
          <TabsContent value="widgets" className="mt-6">
            {/* Quick Add Templates */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Add Templates</h3>
              <div className="flex flex-wrap gap-2">
                {WIDGET_TEMPLATES.map((tpl) => {
                  const alreadyExists = widgets.some((w) => w.widgetKey === tpl.widgetKey)
                  return (
                    <Button
                      key={tpl.widgetKey}
                      variant="outline"
                      size="sm"
                      className="gap-2 text-xs"
                      onClick={() => handleAddTemplate(tpl)}
                      disabled={alreadyExists}
                    >
                      <Plus className="size-3" />
                      {tpl.title}
                      {alreadyExists && <span className="text-gray-400">(added)</span>}
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* Add Widget Button */}
            <div className="flex justify-end mb-4">
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                onClick={() => openWidgetDialog()}
              >
                <Plus className="size-4" />
                Add Widget
              </Button>
            </div>

            {/* Widget List */}
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="border-0 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-11 w-11 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : widgets.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center">
                  <LayoutDashboard className="size-12 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-base font-medium text-gray-900 mb-1">No widgets configured</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your first dashboard widget or use a template above.
                  </p>
                  <Button
                    className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                    onClick={() => openWidgetDialog()}
                  >
                    <Plus className="size-4" />
                    Add Widget
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {[...widgets]
                    .sort((a, b) => a.order - b.order)
                    .map((widget, idx) => {
                      const typeBadge = TYPE_BADGE_MAP[widget.type] || TYPE_BADGE_MAP.custom
                      const sizeBadge = SIZE_BADGE_MAP[widget.size] || SIZE_BADGE_MAP.medium
                      return (
                        <motion.div
                          key={widget.id}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit={{ opacity: 0, y: -10 }}
                          layout
                        >
                          <Card className={`border-0 shadow-sm transition-colors ${!widget.isVisible ? 'opacity-60' : ''}`}>
                            <CardContent className="p-4 sm:p-5">
                              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                {/* Order & Drag indicator */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <GripVertical className="size-4 text-gray-300" />
                                  <span className="flex items-center justify-center size-7 rounded-md bg-gray-100 text-xs font-bold text-gray-600">
                                    {idx + 1}
                                  </span>
                                  <div className="flex flex-col gap-0.5">
                                    <button
                                      onClick={() => handleWidgetMove(widget, 'up')}
                                      disabled={idx === 0}
                                      className="p-0.5 text-gray-400 hover:text-amber-600 disabled:opacity-30 cursor-pointer"
                                    >
                                      <ArrowUp className="size-3" />
                                    </button>
                                    <button
                                      onClick={() => handleWidgetMove(widget, 'down')}
                                      disabled={idx === widgets.length - 1}
                                      className="p-0.5 text-gray-400 hover:text-amber-600 disabled:opacity-30 cursor-pointer"
                                    >
                                      <ArrowDown className="size-3" />
                                    </button>
                                  </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h3 className="text-sm font-semibold text-gray-900">{widget.title}</h3>
                                    <code className="text-xs font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                      {widget.widgetKey}
                                    </code>
                                    <Badge className={typeBadge.className}>{typeBadge.label}</Badge>
                                    <Badge className={sizeBadge.className}>{sizeBadge.label}</Badge>
                                  </div>
                                  {widget.dataSource && (
                                    <p className="text-xs text-muted-foreground font-mono">{widget.dataSource}</p>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50">
                                    <Switch
                                      checked={widget.isVisible}
                                      onCheckedChange={() => handleWidgetVisibility(widget)}
                                    />
                                    {widget.isVisible ? (
                                      <Eye className="size-3.5 text-emerald-600" />
                                    ) : (
                                      <EyeOff className="size-3.5 text-gray-400" />
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openWidgetDialog(widget)}
                                    className="text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                                  >
                                    <Pencil className="size-4" />
                                  </Button>
                                  {deletingWidgetId === widget.id ? (
                                    <div className="flex items-center gap-1">
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        className="text-xs h-8"
                                        onClick={() => handleDeleteWidget(widget.id)}
                                      >
                                        Confirm
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-xs h-8"
                                        onClick={() => setDeletingWidgetId(null)}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDeletingWidgetId(widget.id)}
                                      className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 className="size-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      )
                    })}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* ── Themes Tab ─────────────────────────────────────────────────── */}
          <TabsContent value="themes" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                onClick={() => openThemeDialog()}
              >
                <Plus className="size-4" />
                Add Theme
              </Button>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i} className="border-0 shadow-sm">
                    <CardContent className="p-5">
                      <div className="space-y-3">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : themes.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center">
                  <Palette className="size-12 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-base font-medium text-gray-900 mb-1">No themes configured</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your first platform theme.
                  </p>
                  <Button
                    className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                    onClick={() => openThemeDialog()}
                  >
                    <Plus className="size-4" />
                    Add Theme
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <AnimatePresence>
                  {themes.map((theme) => (
                    <motion.div
                      key={theme.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, scale: 0.95 }}
                      layout
                    >
                      <Card className={`shadow-sm transition-colors ${theme.isActive ? 'border-2 border-amber-400 ring-1 ring-amber-200' : 'border-0'}`}>
                        <CardContent className="p-5">
                          {/* Theme header */}
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-gray-900">{theme.name}</h3>
                                {theme.isActive && (
                                  <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                                    <Check className="size-3 mr-0.5" /> Applied
                                  </Badge>
                                )}
                              </div>
                              <code className="text-xs font-mono text-gray-400">{theme.key}</code>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openThemeDialog(theme)}
                                className="text-gray-400 hover:text-amber-600 hover:bg-amber-50 h-8 w-8 p-0"
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResetTheme(theme.key)}
                                className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 h-8 w-8 p-0"
                                title="Reset to default"
                              >
                                <RotateCcw className="size-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Color swatches */}
                          <div className="flex items-center gap-2 mb-4">
                            <div className="flex items-center gap-1">
                              <div className="size-6 rounded-md border border-gray-200" style={{ backgroundColor: theme.primaryColor }} />
                              <span className="text-xs text-gray-400">Primary</span>
                            </div>
                            {theme.secondaryColor && (
                              <div className="flex items-center gap-1">
                                <div className="size-6 rounded-md border border-gray-200" style={{ backgroundColor: theme.secondaryColor }} />
                                <span className="text-xs text-gray-400">Secondary</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <div className="size-6 rounded-md border border-gray-200" style={{ backgroundColor: theme.accentColor }} />
                              <span className="text-xs text-gray-400">Accent</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="size-6 rounded-md border border-gray-200" style={{ backgroundColor: theme.backgroundColor }} />
                              <span className="text-xs text-gray-400">BG</span>
                            </div>
                          </div>

                          {/* Live Preview Mini-Panel */}
                          <div className="rounded-lg border border-gray-200 overflow-hidden mb-4" style={{ borderRadius: theme.borderRadius }}>
                            <div className="flex h-20">
                              {/* Sidebar preview */}
                              <div
                                className="w-8 shrink-0 flex flex-col gap-1 p-1"
                                style={{ backgroundColor: theme.sidebarColor }}
                              >
                                <div className="size-1.5 rounded-sm" style={{ backgroundColor: theme.primaryColor, opacity: 0.7 }} />
                                <div className="size-1.5 rounded-sm" style={{ backgroundColor: theme.primaryColor, opacity: 0.5 }} />
                                <div className="size-1.5 rounded-sm" style={{ backgroundColor: theme.primaryColor, opacity: 0.3 }} />
                              </div>
                              {/* Main area */}
                              <div className="flex-1 flex flex-col">
                                {/* Topbar preview */}
                                <div
                                  className="h-4 flex items-center px-1.5 gap-1"
                                  style={{ backgroundColor: theme.sidebarColor, borderBottom: '1px solid #e5e7eb' }}
                                >
                                  <div className="size-1.5 rounded-full" style={{ backgroundColor: theme.primaryColor }} />
                                  <div className="h-1 w-8 rounded" style={{ backgroundColor: '#e5e7eb' }} />
                                </div>
                                {/* Content area */}
                                <div className="flex-1 p-1.5 flex gap-1" style={{ backgroundColor: theme.backgroundColor }}>
                                  <div className="h-3 flex-1 rounded" style={{ backgroundColor: theme.primaryColor, opacity: 0.15 }} />
                                  <div className="h-3 w-4 rounded" style={{ backgroundColor: theme.accentColor, opacity: 0.2 }} />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Font preview & meta */}
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-muted-foreground" style={{ fontFamily: theme.fontFamily }}>
                              Font: {theme.fontFamily}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Radius: {theme.borderRadius}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {!theme.isActive && (
                              <Button
                                size="sm"
                                className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1"
                                onClick={() => handleApplyTheme(theme.id)}
                                disabled={applyingThemeId === theme.id}
                              >
                                {applyingThemeId === theme.id ? (
                                  <RefreshCw className="size-3 animate-spin" />
                                ) : (
                                  <Check className="size-3" />
                                )}
                                Apply
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1"
                              onClick={() => handleResetTheme(theme.key)}
                            >
                              <RotateCcw className="size-3" />
                              Reset to Default
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* ── Sidebar Tab ────────────────────────────────────────────────── */}
          <TabsContent value="sidebar" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                onClick={() => openSidebarDialog()}
              >
                <Plus className="size-4" />
                Add Item
              </Button>
            </div>

            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="border-0 shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-11 w-11 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-4 w-64" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sidebarItems.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-12 text-center">
                  <PanelLeft className="size-12 text-gray-200 mx-auto mb-4" />
                  <h3 className="text-base font-medium text-gray-900 mb-1">No sidebar items</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your first sidebar navigation item.
                  </p>
                  <Button
                    className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
                    onClick={() => openSidebarDialog()}
                  >
                    <Plus className="size-4" />
                    Add Item
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {[...sidebarItems]
                    .sort((a, b) => a.order - b.order)
                    .map((item, idx) => (
                      <motion.div
                        key={item.id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, y: -10 }}
                        layout
                      >
                        <Card className={`border-0 shadow-sm transition-colors ${!item.isVisible ? 'opacity-60' : ''} ${item.parentId ? 'ml-8 border-l-2 border-amber-200' : ''}`}>
                          <CardContent className="p-4 sm:p-5">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                              {/* Order & Move */}
                              <div className="flex items-center gap-2 shrink-0">
                                <GripVertical className="size-4 text-gray-300" />
                                <span className="flex items-center justify-center size-7 rounded-md bg-gray-100 text-xs font-bold text-gray-600">
                                  {idx + 1}
                                </span>
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    onClick={() => handleSidebarMove(item, 'up')}
                                    disabled={idx === 0}
                                    className="p-0.5 text-gray-400 hover:text-amber-600 disabled:opacity-30 cursor-pointer"
                                  >
                                    <ArrowUp className="size-3" />
                                  </button>
                                  <button
                                    onClick={() => handleSidebarMove(item, 'down')}
                                    disabled={idx === sidebarItems.length - 1}
                                    className="p-0.5 text-gray-400 hover:text-amber-600 disabled:opacity-30 cursor-pointer"
                                  >
                                    <ArrowDown className="size-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Icon */}
                              <div className="flex items-center justify-center size-9 rounded-lg bg-amber-50 shrink-0">
                                <span className="text-amber-600 text-sm">🎨</span>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <h3 className="text-sm font-semibold text-gray-900">{item.label}</h3>
                                  <code className="text-xs font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                                    {item.key}
                                  </code>
                                  {item.badge && (
                                    <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                                      {item.badge}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span>Icon: {item.icon}</span>
                                  <span>Page: {item.targetPage}</span>
                                  {item.parentId && <span>Parent: {item.parentId}</span>}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50">
                                  <Switch
                                    checked={item.isVisible}
                                    onCheckedChange={() => handleSidebarVisibility(item)}
                                  />
                                  {item.isVisible ? (
                                    <Eye className="size-3.5 text-emerald-600" />
                                  ) : (
                                    <EyeOff className="size-3.5 text-gray-400" />
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openSidebarDialog(item)}
                                  className="text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                                >
                                  <Pencil className="size-4" />
                                </Button>
                                {deletingSidebarId === item.id ? (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="text-xs h-8"
                                      onClick={() => handleDeleteSidebar(item.id)}
                                    >
                                      Confirm
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs h-8"
                                      onClick={() => setDeletingSidebarId(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeletingSidebarId(item.id)}
                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ── Widget Dialog ──────────────────────────────────────────────────── */}
      <Dialog open={widgetDialogOpen} onOpenChange={(open) => { setWidgetDialogOpen(open); if (!open) resetWidgetForm() }}>
        <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingWidget ? 'Edit Widget' : 'Add Widget'}</DialogTitle>
            <DialogDescription>
              {editingWidget ? 'Modify dashboard widget settings.' : 'Create a new dashboard widget.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Widget Key</Label>
                <Input
                  value={wKey}
                  onChange={(e) => setWKey(e.target.value.replace(/\s/g, '_').toLowerCase())}
                  placeholder="e.g. revenue_chart"
                  className="bg-gray-50/80 border-gray-200 font-mono text-sm"
                  disabled={!!editingWidget}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Title</Label>
                <Input
                  value={wTitle}
                  onChange={(e) => setWTitle(e.target.value)}
                  placeholder="e.g. Revenue Chart"
                  className="bg-gray-50/80 border-gray-200"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Type</Label>
                <Select value={wType} onValueChange={setWType}>
                  <SelectTrigger className="bg-gray-50/80 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WIDGET_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-2">
                          <opt.icon className="size-3.5" />
                          {opt.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Size</Label>
                <Select value={wSize} onValueChange={setWSize}>
                  <SelectTrigger className="bg-gray-50/80 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WIDGET_SIZE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Data Source</Label>
              <Input
                value={wDataSource}
                onChange={(e) => setWDataSource(e.target.value)}
                placeholder="API endpoint, e.g. /api/admin/analytics"
                className="bg-gray-50/80 border-gray-200 font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Config (JSON)</Label>
              <Textarea
                value={wConfig}
                onChange={(e) => setWConfig(e.target.value)}
                placeholder='{"chartType": "line", "period": "30d"}'
                className="bg-gray-50/80 border-gray-200 font-mono text-sm min-h-[80px]"
              />
            </div>
            <div className="flex items-center gap-3 px-3 py-3 rounded-md border border-gray-200 bg-gray-50/80">
              <Switch checked={wVisible} onCheckedChange={setWVisible} />
              <span className="text-sm text-gray-600">{wVisible ? 'Visible' : 'Hidden'}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setWidgetDialogOpen(false); resetWidgetForm() }}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleSaveWidget}
              disabled={widgetSubmitting}
            >
              {widgetSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                editingWidget ? 'Update' : 'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Theme Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={themeDialogOpen} onOpenChange={(open) => { setThemeDialogOpen(open); if (!open) resetThemeForm() }}>
        <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTheme ? 'Edit Theme' : 'Add Theme'}</DialogTitle>
            <DialogDescription>
              {editingTheme ? 'Modify platform theme settings.' : 'Create a new platform theme.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Theme Key</Label>
                <Select value={tKey} onValueChange={setTKey} disabled={!!editingTheme}>
                  <SelectTrigger className="bg-gray-50/80 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {THEME_KEY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Name</Label>
                <Input
                  value={tName}
                  onChange={(e) => setTName(e.target.value)}
                  placeholder="e.g. Dark Amber"
                  className="bg-gray-50/80 border-gray-200"
                />
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <ColorInput label="Primary Color" value={tPrimary} onChange={setTPrimary} />
              <ColorInput label="Secondary Color" value={tSecondary} onChange={setTSecondary} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ColorInput label="Accent Color" value={tAccent} onChange={setTAccent} />
              <ColorInput label="Background Color" value={tBackground} onChange={setTBackground} />
            </div>

            {/* Sidebar & Topbar */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Sidebar Style</Label>
                <Select value={tSidebarStyle} onValueChange={setTSidebarStyle}>
                  <SelectTrigger className="bg-gray-50/80 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIDEBAR_STYLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ColorInput label="Sidebar Color" value={tSidebarColor} onChange={setTSidebarColor} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Topbar Style</Label>
                <Select value={tTopbarStyle} onValueChange={setTTopbarStyle}>
                  <SelectTrigger className="bg-gray-50/80 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TOPBAR_STYLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Border Radius</Label>
                <Input
                  value={tBorderRadius}
                  onChange={(e) => setTBorderRadius(e.target.value)}
                  placeholder="0.75rem"
                  className="bg-gray-50/80 border-gray-200 font-mono text-sm"
                />
              </div>
            </div>

            {/* Font & URLs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Font Family</Label>
                <Select value={tFontFamily} onValueChange={setTFontFamily}>
                  <SelectTrigger className="bg-gray-50/80 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_OPTIONS.map((font) => (
                      <SelectItem key={font} value={font}>{font}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Logo URL</Label>
                <Input
                  value={tLogo}
                  onChange={(e) => setTLogo(e.target.value)}
                  placeholder="https://..."
                  className="bg-gray-50/80 border-gray-200 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Favicon URL</Label>
                <Input
                  value={tFavicon}
                  onChange={(e) => setTFavicon(e.target.value)}
                  placeholder="https://..."
                  className="bg-gray-50/80 border-gray-200 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Login Background URL</Label>
                <Input
                  value={tLoginBg}
                  onChange={(e) => setTLoginBg(e.target.value)}
                  placeholder="https://..."
                  className="bg-gray-50/80 border-gray-200 text-sm"
                />
              </div>
            </div>

            {/* Custom CSS */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Custom CSS</Label>
              <Textarea
                value={tCustomCSS}
                onChange={(e) => setTCustomCSS(e.target.value)}
                placeholder="/* Custom CSS overrides */"
                className="bg-gray-50/80 border-gray-200 font-mono text-sm min-h-[80px]"
              />
            </div>

            {/* Live Preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Monitor className="size-3.5" />
                Preview
              </Label>
              <div className="rounded-lg border border-gray-200 overflow-hidden" style={{ borderRadius: tBorderRadius }}>
                <div className="flex h-24">
                  <div
                    className="w-10 shrink-0 flex flex-col gap-1.5 p-1.5"
                    style={{ backgroundColor: tSidebarColor }}
                  >
                    <div className="size-2 rounded-sm" style={{ backgroundColor: tPrimary, opacity: 0.8 }} />
                    <div className="size-2 rounded-sm" style={{ backgroundColor: tPrimary, opacity: 0.5 }} />
                    <div className="size-2 rounded-sm" style={{ backgroundColor: tPrimary, opacity: 0.3 }} />
                    <div className="size-2 rounded-sm" style={{ backgroundColor: tPrimary, opacity: 0.2 }} />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div
                      className="h-6 flex items-center px-2 gap-2"
                      style={{ backgroundColor: tSidebarColor, borderBottom: '1px solid #e5e7eb' }}
                    >
                      <div className="size-2 rounded-full" style={{ backgroundColor: tPrimary }} />
                      <div className="h-1.5 w-12 rounded" style={{ backgroundColor: '#d1d5db' }} />
                      <div className="ml-auto h-1.5 w-6 rounded" style={{ backgroundColor: '#e5e7eb' }} />
                    </div>
                    <div className="flex-1 p-2 flex gap-2" style={{ backgroundColor: tBackground }}>
                      <div className="h-6 flex-1 rounded" style={{ backgroundColor: tPrimary, opacity: 0.12 }} />
                      <div className="flex flex-col gap-1.5 w-16">
                        <div className="h-3 rounded" style={{ backgroundColor: tAccent, opacity: 0.2 }} />
                        <div className="h-3 rounded" style={{ backgroundColor: tAccent, opacity: 0.15 }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground" style={{ fontFamily: tFontFamily }}>
                Font preview: {tFontFamily} — The quick brown fox jumps over the lazy dog
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setThemeDialogOpen(false); resetThemeForm() }}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleSaveTheme}
              disabled={themeSubmitting}
            >
              {themeSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                editingTheme ? 'Update' : 'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Sidebar Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={sidebarDialogOpen} onOpenChange={(open) => { setSidebarDialogOpen(open); if (!open) resetSidebarForm() }}>
        <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSidebar ? 'Edit Sidebar Item' : 'Add Sidebar Item'}</DialogTitle>
            <DialogDescription>
              {editingSidebar ? 'Modify sidebar navigation item.' : 'Create a new sidebar navigation item.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Key</Label>
                <Input
                  value={sKey}
                  onChange={(e) => setSKey(e.target.value.replace(/\s/g, '_').toLowerCase())}
                  placeholder="e.g. my_reports"
                  className="bg-gray-50/80 border-gray-200 font-mono text-sm"
                  disabled={!!editingSidebar}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Label</Label>
                <Input
                  value={sLabel}
                  onChange={(e) => setSLabel(e.target.value)}
                  placeholder="e.g. My Reports"
                  className="bg-gray-50/80 border-gray-200"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Icon</Label>
                <Select value={sIcon} onValueChange={setSIcon}>
                  <SelectTrigger className="bg-gray-50/80 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {LUCIDE_ICONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Target Page</Label>
                <Select value={sTargetPage} onValueChange={setSTargetPage}>
                  <SelectTrigger className="bg-gray-50/80 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {ADMIN_PAGE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Order</Label>
                <Input
                  type="number"
                  value={sOrder}
                  onChange={(e) => setSOrder(parseInt(e.target.value) || 0)}
                  min={0}
                  className="bg-gray-50/80 border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Parent ID</Label>
                <Select value={sParentId} onValueChange={setSParentId}>
                  <SelectTrigger className="bg-gray-50/80 border-gray-200">
                    <SelectValue placeholder="None (top-level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None (top-level)</SelectItem>
                    {sidebarItems
                      .filter((i) => !i.parentId)
                      .map((i) => (
                        <SelectItem key={i.id} value={i.id}>{i.label} ({i.key})</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Badge Text (optional)</Label>
              <Input
                value={sBadge}
                onChange={(e) => setSBadge(e.target.value)}
                placeholder="e.g. New, 3, Beta"
                className="bg-gray-50/80 border-gray-200"
              />
            </div>
            <div className="flex items-center gap-3 px-3 py-3 rounded-md border border-gray-200 bg-gray-50/80">
              <Switch checked={sVisible} onCheckedChange={setSVisible} />
              <span className="text-sm text-gray-600">{sVisible ? 'Visible' : 'Hidden'}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setSidebarDialogOpen(false); resetSidebarForm() }}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleSaveSidebar}
              disabled={sidebarSubmitting}
            >
              {sidebarSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                editingSidebar ? 'Update' : 'Create'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
