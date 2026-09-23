'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { apiFetch } from '@/lib/api-client'
import { toast } from 'sonner'
import {
  BookOpen,
  Search,
  RefreshCw,
  AlertCircle,
  Package,
  FileText,
  Image as ImageIcon,
  ClipboardList,
  GraduationCap,
  X,
  Building2,
  IndianRupee,
  Calendar,
  Eye,
  Link as LinkIcon,
  Tag,
  Clock,
  CheckCircle,
  CircleDot,
  Hash,
  UserPlus,
  MessageSquare,
  FolderTree,
  Phone,
  Mail,
  Percent,
  Flame,
  AlertTriangle,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────
interface ContentOrg {
  id: string
  name: string
  code: string
}

interface CourseItem {
  id: string
  title: string
  category: string | null
  price: number
  mrp: number
  status: string
  thumbnail: string | null
  createdAt: string
  organizationId: string
  organization: ContentOrg
}

interface TestSeriesItem {
  id: string
  title: string
  category: string | null
  price: number
  mrp: number
  status: string
  thumbnail: string | null
  createdAt: string
  organizationId: string
  organization: ContentOrg
  _count: { tests: number }
}

interface TestItem {
  id: string
  title: string
  status: string
  numberOfQuestions: number
  totalMarks: number
  totalDuration: number
  createdAt: string
  organizationId: string
  testSeriesId: string
  organization: ContentOrg
  testSeries: { id: string; title: string }
}

interface BannerItem {
  id: string
  title: string
  image: string
  link: string | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  organizationId: string
  organization: ContentOrg
}

interface BlogItem {
  id: string
  title: string
  excerpt: string | null
  thumbnail: string | null
  tags: string | null
  status: string
  createdAt: string
  organizationId: string
  organization: ContentOrg
}

interface ContentStats {
  totalCourses: number
  totalTestSeries: number
  totalTests: number
  totalBanners: number
  totalBlogs: number
  publishedCourses: number
  publishedTests: number
}

interface CouponItem {
  id: string
  code: string
  discount: number
  discountType: string
  maxUses: number | null
  usedCount: number
  validFrom: string | null
  validTo: string | null
  isActive: boolean
  organizationId: string
  createdAt: string
  organization: ContentOrg
}

interface LeadItem {
  id: string
  name: string
  email: string | null
  phone: string | null
  source: string | null
  status: string
  organizationId: string
  createdAt: string
  organization: ContentOrg
}

interface SupportQueryItem {
  id: string
  subject: string
  message: string
  status: string
  studentName: string | null
  studentEmail: string | null
  organizationId: string
  createdAt: string
  organization: ContentOrg
}

interface QuickLinkItem {
  id: string
  title: string
  url: string
  icon: string | null
  sortOrder: number
  organizationId: string
  createdAt: string
  organization: ContentOrg
}

interface CategoryItem {
  id: string
  name: string
  slug: string
  icon: string | null
  organizationId: string
  createdAt: string
  organization: ContentOrg
}

interface OversightStats {
  totalCoupons: number
  activeCoupons: number
  totalLeads: number
  newLeads: number
  totalSupport: number
  openSupport: number
  totalQuickLinks: number
  totalCategories: number
}

interface ApiResponse {
  success: boolean
  courses: CourseItem[]
  testSeries: TestSeriesItem[]
  tests: TestItem[]
  banners: BannerItem[]
  blogs: BlogItem[]
  organizations: ContentOrg[]
  stats: ContentStats
  message?: string
}

interface OversightApiResponse {
  success: boolean
  coupons: CouponItem[]
  leads: LeadItem[]
  supportQueries: SupportQueryItem[]
  quickLinks: QuickLinkItem[]
  categories: CategoryItem[]
  organizations: ContentOrg[]
  stats: OversightStats
  message?: string
}

// ── Constants ────────────────────────────────────────────────────────────────
const DEBOUNCE_MS = 400

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function getStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'published':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-xs">
          <CheckCircle className="size-3 mr-1" />
          Published
        </Badge>
      )
    case 'draft':
      return (
        <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-0 text-xs">
          <CircleDot className="size-3 mr-1" />
          Draft
        </Badge>
      )
    case 'archived':
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 text-xs">
          <Clock className="size-3 mr-1" />
          Archived
        </Badge>
      )
    case 'paid':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-xs">
          <CheckCircle className="size-3 mr-1" />
          Paid
        </Badge>
      )
    case 'free':
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 text-xs">
          Free
        </Badge>
      )
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>
  }
}

function getActiveBadge(isActive: boolean) {
  return isActive ? (
    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-xs">
      Active
    </Badge>
  ) : (
    <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 border-0 text-xs">
      Inactive
    </Badge>
  )
}

function getCouponStatusBadge(coupon: CouponItem) {
  const now = new Date()
  if (!coupon.isActive) {
    return (
      <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-100 border-0 text-xs">
        Inactive
      </Badge>
    )
  }
  if (coupon.validTo && new Date(coupon.validTo) < now) {
    return (
      <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 border-0 text-xs">
        <Clock className="size-3 mr-1" />
        Expired
      </Badge>
    )
  }
  if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
    return (
      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 text-xs">
        <Hash className="size-3 mr-1" />
        Used Up
      </Badge>
    )
  }
  return (
    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-xs">
      <CheckCircle className="size-3 mr-1" />
      Active
    </Badge>
  )
}

function getLeadStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'new':
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 text-xs">
          New
        </Badge>
      )
    case 'contacted':
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 text-xs">
          Contacted
        </Badge>
      )
    case 'qualified':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-xs">
          Qualified
        </Badge>
      )
    case 'lost':
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0 text-xs">
          Lost
        </Badge>
      )
    case 'converted':
      return (
        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-0 text-xs">
          Converted
        </Badge>
      )
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>
  }
}

function getSupportStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'open':
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 text-xs">
          Open
        </Badge>
      )
    case 'in_progress':
      return (
        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 text-xs">
          In Progress
        </Badge>
      )
    case 'resolved':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-xs">
          Resolved
        </Badge>
      )
    case 'closed':
      return (
        <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 border-0 text-xs">
          Closed
        </Badge>
      )
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>
  }
}

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminContentPage() {
  // Data state — content
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [testSeriesList, setTestSeriesList] = useState<TestSeriesItem[]>([])
  const [tests, setTests] = useState<TestItem[]>([])
  const [banners, setBanners] = useState<BannerItem[]>([])
  const [blogs, setBlogs] = useState<BlogItem[]>([])
  const [organizations, setOrganizations] = useState<ContentOrg[]>([])
  const [stats, setStats] = useState<ContentStats>({
    totalCourses: 0,
    totalTestSeries: 0,
    totalTests: 0,
    totalBanners: 0,
    totalBlogs: 0,
    publishedCourses: 0,
    publishedTests: 0,
  })

  // Data state — oversight
  const [coupons, setCoupons] = useState<CouponItem[]>([])
  const [leads, setLeads] = useState<LeadItem[]>([])
  const [supportQueries, setSupportQueries] = useState<SupportQueryItem[]>([])
  const [quickLinks, setQuickLinks] = useState<QuickLinkItem[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [oversightStats, setOversightStats] = useState<OversightStats>({
    totalCoupons: 0,
    activeCoupons: 0,
    totalLeads: 0,
    newLeads: 0,
    totalSupport: 0,
    openSupport: 0,
    totalQuickLinks: 0,
    totalCategories: 0,
  })

  // UI state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [activeTab, setActiveTab] = useState('courses')

  // ── Debounce search ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (selectedOrgId) params.set('organizationId', selectedOrgId)

      const [contentRes, oversightRes] = await Promise.all([
        apiFetch(`/api/admin/content?${params.toString()}`),
        apiFetch(`/api/admin/oversight?${params.toString()}`),
      ])

      if (!contentRes.ok || !oversightRes.ok) {
        throw new Error('Request failed')
      }

      const contentData: ApiResponse = await contentRes.json()
      const oversightData: OversightApiResponse = await oversightRes.json()

      if (!contentData.success || !oversightData.success) {
        throw new Error(contentData.message || oversightData.message || 'Failed to fetch data')
      }

      setCourses(contentData.courses)
      setTestSeriesList(contentData.testSeries)
      setTests(contentData.tests)
      setBanners(contentData.banners)
      setBlogs(contentData.blogs)
      setOrganizations(contentData.organizations)
      setStats(contentData.stats)

      setCoupons(oversightData.coupons)
      setLeads(oversightData.leads)
      setSupportQueries(oversightData.supportQueries)
      setQuickLinks(oversightData.quickLinks)
      setCategories(oversightData.categories)
      setOversightStats(oversightData.stats)
      // Merge organizations from oversight if more exist
      if (oversightData.organizations.length > contentData.organizations.length) {
        setOrganizations(oversightData.organizations)
      }
    } catch (err) {
      console.error('Fetch content error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, selectedOrgId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Stats cards config ──
  const statsCards = [
    {
      label: 'Total Courses',
      value: stats.totalCourses,
      sub: `${stats.publishedCourses} published`,
      icon: BookOpen,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
    {
      label: 'Test Series',
      value: stats.totalTestSeries,
      sub: undefined,
      icon: ClipboardList,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      label: 'Total Tests',
      value: stats.totalTests,
      sub: `${stats.publishedTests} paid`,
      icon: GraduationCap,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Banners',
      value: stats.totalBanners,
      sub: undefined,
      icon: ImageIcon,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      label: 'Blogs',
      value: stats.totalBlogs,
      sub: undefined,
      icon: FileText,
      bgColor: 'bg-rose-50',
      textColor: 'text-rose-600',
    },
    {
      label: 'Coupons',
      value: oversightStats.totalCoupons,
      sub: `${oversightStats.activeCoupons} active`,
      icon: Tag,
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-600',
    },
    {
      label: 'Leads',
      value: oversightStats.totalLeads,
      sub: `${oversightStats.newLeads} new`,
      icon: UserPlus,
      bgColor: 'bg-sky-50',
      textColor: 'text-sky-600',
    },
    {
      label: 'Support',
      value: oversightStats.totalSupport,
      sub: `${oversightStats.openSupport} open`,
      icon: MessageSquare,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      label: 'Quick Links',
      value: oversightStats.totalQuickLinks,
      sub: undefined,
      icon: LinkIcon,
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-600',
    },
    {
      label: 'Categories',
      value: oversightStats.totalCategories,
      sub: undefined,
      icon: FolderTree,
      bgColor: 'bg-violet-50',
      textColor: 'text-violet-600',
    },
  ]

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Oversight</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View all content across all teacher organizations in one place.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {loading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-10" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          statsCards.map((card) => (
            <Card key={card.label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`flex items-center justify-center size-10 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`size-5 ${card.textColor}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="text-xl font-bold text-gray-900">{card.value.toLocaleString('en-IN')}</p>
                  {card.sub && (
                    <p className="text-xs text-muted-foreground">{card.sub}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Organization Filter Bar */}
      {organizations.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="size-4 text-amber-600" />
              <span className="text-sm font-medium text-gray-700">Filter by Organization</span>
            </div>
            <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto">
              <Button
                variant={selectedOrgId === '' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedOrgId('')}
                className={
                  selectedOrgId === ''
                    ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                    : 'border-gray-200 text-gray-600 hover:text-gray-900'
                }
              >
                All Organizations
              </Button>
              {organizations.map((org) => (
                <Button
                  key={org.id}
                  variant={selectedOrgId === org.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedOrgId(org.id)}
                  className={
                    selectedOrgId === org.id
                      ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                      : 'border-gray-200 text-gray-600 hover:text-gray-900'
                  }
                >
                  <span>{org.name}</span>
                  <span className="text-xs opacity-70 ml-1.5">({org.code})</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search across all content by title, category, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 bg-gray-50/80 border-gray-200"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setDebouncedSearch('') }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} className="shrink-0 text-muted-foreground self-start sm:self-auto">
              <RefreshCw className={`size-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-0 shadow-sm border-l-4 border-l-red-400">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="size-5 text-red-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800">Failed to load content</p>
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} className="shrink-0">
              <RefreshCw className="size-3.5 mr-1.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tab-based Content View */}
      {!error && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b border-gray-100 px-4 pt-4">
                <TabsList className="bg-gray-100/60 h-9 p-0.5 overflow-x-auto w-full sm:w-auto inline-flex sm:inline-flex flex-nowrap">
                  <TabsTrigger value="courses" className="text-xs px-3 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm shrink-0">
                    <BookOpen className="size-3.5 mr-1.5" />
                    Courses
                    <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0 h-4 min-w-[20px] justify-center">
                      {stats.totalCourses}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="test-series" className="text-xs px-3 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm shrink-0">
                    <ClipboardList className="size-3.5 mr-1.5" />
                    Test Series
                    <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0 h-4 min-w-[20px] justify-center">
                      {stats.totalTestSeries}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="tests" className="text-xs px-3 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm shrink-0">
                    <GraduationCap className="size-3.5 mr-1.5" />
                    Tests
                    <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0 h-4 min-w-[20px] justify-center">
                      {stats.totalTests}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="banners" className="text-xs px-3 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm shrink-0">
                    <ImageIcon className="size-3.5 mr-1.5" />
                    Banners
                    <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0 h-4 min-w-[20px] justify-center">
                      {stats.totalBanners}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="blogs" className="text-xs px-3 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm shrink-0">
                    <FileText className="size-3.5 mr-1.5" />
                    Blogs
                    <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0 h-4 min-w-[20px] justify-center">
                      {stats.totalBlogs}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="coupons" className="text-xs px-3 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm shrink-0">
                    <Tag className="size-3.5 mr-1.5" />
                    Coupons
                    <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0 h-4 min-w-[20px] justify-center">
                      {oversightStats.totalCoupons}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="leads" className="text-xs px-3 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm shrink-0">
                    <UserPlus className="size-3.5 mr-1.5" />
                    Leads
                    <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0 h-4 min-w-[20px] justify-center">
                      {oversightStats.totalLeads}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="support" className="text-xs px-3 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm shrink-0">
                    <MessageSquare className="size-3.5 mr-1.5" />
                    Support
                    <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0 h-4 min-w-[20px] justify-center">
                      {oversightStats.totalSupport}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="quick-links" className="text-xs px-3 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm shrink-0">
                    <LinkIcon className="size-3.5 mr-1.5" />
                    Quick Links
                    <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0 h-4 min-w-[20px] justify-center">
                      {oversightStats.totalQuickLinks}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="categories" className="text-xs px-3 h-8 data-[state=active]:bg-white data-[state=active]:shadow-sm shrink-0">
                    <FolderTree className="size-3.5 mr-1.5" />
                    Categories
                    <Badge variant="secondary" className="ml-1.5 text-xs px-1.5 py-0 h-4 min-w-[20px] justify-center">
                      {oversightStats.totalCategories}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Courses Tab */}
              <TabsContent value="courses" className="mt-0">
                <ContentTableSection
                  loading={loading}
                  items={courses}
                  emptyIcon={BookOpen}
                  emptyTitle="No courses found"
                  emptyDesc={searchQuery || selectedOrgId ? 'Try adjusting your search or filters' : 'Courses will appear here once teachers create them'}
                  columns={['Title', 'Organization', 'Category', 'Price', 'Status', 'Created']}
                  renderRow={(course) => (
                    <TableRow key={course.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3 max-w-[240px]">
                          {course.thumbnail ? (
                            <img
                              src={course.thumbnail}
                              alt=""
                              className="size-9 rounded-md object-cover shrink-0"
                            />
                          ) : (
                            <div className="flex items-center justify-center size-9 rounded-md bg-amber-50 shrink-0">
                              <BookOpen className="size-4 text-amber-500" />
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900 truncate" title={course.title}>
                            {course.title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="size-3 text-muted-foreground" />
                          <span className="text-sm text-gray-700 truncate max-w-[140px]" title={course.organization.name}>
                            {course.organization.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {course.category ? (
                          <Badge variant="outline" className="text-xs border-gray-200">{course.category}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="text-sm font-semibold text-gray-900">
                            {course.price > 0 ? formatCurrency(course.price) : 'Free'}
                          </span>
                          {course.mrp > course.price && course.price > 0 && (
                            <span className="text-xs text-muted-foreground line-through ml-1">
                              {formatCurrency(course.mrp)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(course.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(course.createdAt)}
                      </TableCell>
                    </TableRow>
                  )}
                  renderMobileCard={(course) => (
                    <div key={course.id} className="border border-gray-100 rounded-lg p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          {course.thumbnail ? (
                            <img src={course.thumbnail} alt="" className="size-9 rounded-md object-cover shrink-0" />
                          ) : (
                            <div className="flex items-center justify-center size-9 rounded-md bg-amber-50 shrink-0">
                              <BookOpen className="size-4 text-amber-500" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate" title={course.title}>{course.title}</p>
                            <p className="text-xs text-muted-foreground">{course.organization.name}</p>
                          </div>
                        </div>
                        {getStatusBadge(course.status)}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          {course.category && <Badge variant="outline" className="text-xs border-gray-200">{course.category}</Badge>}
                          <span>{course.price > 0 ? formatCurrency(course.price) : 'Free'}</span>
                        </div>
                        <span>{formatDate(course.createdAt)}</span>
                      </div>
                    </div>
                  )}
                />
              </TabsContent>

              {/* Test Series Tab */}
              <TabsContent value="test-series" className="mt-0">
                <ContentTableSection
                  loading={loading}
                  items={testSeriesList}
                  emptyIcon={ClipboardList}
                  emptyTitle="No test series found"
                  emptyDesc={searchQuery || selectedOrgId ? 'Try adjusting your search or filters' : 'Test series will appear here once teachers create them'}
                  columns={['Title', 'Organization', 'Category', 'Price', 'Tests', 'Status', 'Created']}
                  renderRow={(ts) => (
                    <TableRow key={ts.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3 max-w-[220px]">
                          {ts.thumbnail ? (
                            <img src={ts.thumbnail} alt="" className="size-9 rounded-md object-cover shrink-0" />
                          ) : (
                            <div className="flex items-center justify-center size-9 rounded-md bg-emerald-50 shrink-0">
                              <ClipboardList className="size-4 text-emerald-500" />
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900 truncate" title={ts.title}>
                            {ts.title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="size-3 text-muted-foreground" />
                          <span className="text-sm text-gray-700 truncate max-w-[140px]" title={ts.organization.name}>
                            {ts.organization.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {ts.category ? (
                          <Badge variant="outline" className="text-xs border-gray-200">{ts.category}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-gray-900">
                          {ts.price > 0 ? formatCurrency(ts.price) : 'Free'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs border-gray-200 gap-1">
                          <Hash className="size-3" />
                          {ts._count.tests}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(ts.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(ts.createdAt)}
                      </TableCell>
                    </TableRow>
                  )}
                  renderMobileCard={(ts) => (
                    <div key={ts.id} className="border border-gray-100 rounded-lg p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate" title={ts.title}>{ts.title}</p>
                          <p className="text-xs text-muted-foreground">{ts.organization.name}</p>
                        </div>
                        {getStatusBadge(ts.status)}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          {ts.category && <Badge variant="outline" className="text-xs border-gray-200">{ts.category}</Badge>}
                          <span>{ts.price > 0 ? formatCurrency(ts.price) : 'Free'}</span>
                          <Badge variant="outline" className="text-xs border-gray-200 gap-0.5">
                            <Hash className="size-2.5" />
                            {ts._count.tests} tests
                          </Badge>
                        </div>
                        <span>{formatDate(ts.createdAt)}</span>
                      </div>
                    </div>
                  )}
                />
              </TabsContent>

              {/* Tests Tab */}
              <TabsContent value="tests" className="mt-0">
                <ContentTableSection
                  loading={loading}
                  items={tests}
                  emptyIcon={GraduationCap}
                  emptyTitle="No tests found"
                  emptyDesc={searchQuery || selectedOrgId ? 'Try adjusting your search or filters' : 'Tests will appear here once teachers create them'}
                  columns={['Title', 'Organization', 'Test Series', 'Questions', 'Duration', 'Status', 'Created']}
                  renderRow={(test) => (
                    <TableRow key={test.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <TableCell>
                        <span className="text-sm font-medium text-gray-900 max-w-[200px] truncate block" title={test.title}>
                          {test.title}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="size-3 text-muted-foreground" />
                          <span className="text-sm text-gray-700 truncate max-w-[120px]" title={test.organization.name}>
                            {test.organization.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground truncate block max-w-[160px]" title={test.testSeries.title}>
                          {test.testSeries.title}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs border-gray-200 gap-0.5">
                          {test.numberOfQuestions}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {test.totalDuration > 0 ? `${test.totalDuration}m` : '—'}
                      </TableCell>
                      <TableCell>{getStatusBadge(test.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(test.createdAt)}
                      </TableCell>
                    </TableRow>
                  )}
                  renderMobileCard={(test) => (
                    <div key={test.id} className="border border-gray-100 rounded-lg p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate" title={test.title}>{test.title}</p>
                          <p className="text-xs text-muted-foreground">{test.organization.name}</p>
                        </div>
                        {getStatusBadge(test.status)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Series: <span className="text-gray-700">{test.testSeries.title}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span>{test.numberOfQuestions} Qs</span>
                          <span>{test.totalDuration > 0 ? `${test.totalDuration}m` : 'No duration'}</span>
                          <span>{test.totalMarks} marks</span>
                        </div>
                        <span>{formatDate(test.createdAt)}</span>
                      </div>
                    </div>
                  )}
                />
              </TabsContent>

              {/* Banners Tab */}
              <TabsContent value="banners" className="mt-0">
                <ContentTableSection
                  loading={loading}
                  items={banners}
                  emptyIcon={ImageIcon}
                  emptyTitle="No banners found"
                  emptyDesc={searchQuery || selectedOrgId ? 'Try adjusting your search or filters' : 'Banners will appear here once teachers create them'}
                  columns={['Preview', 'Title', 'Organization', 'Link', 'Status', 'Order', 'Created']}
                  renderRow={(banner) => (
                    <TableRow key={banner.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <TableCell>
                        <img
                          src={banner.image}
                          alt={banner.title}
                          className="size-12 rounded-md object-cover"
                        />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-gray-900 max-w-[180px] truncate block" title={banner.title}>
                          {banner.title}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="size-3 text-muted-foreground" />
                          <span className="text-sm text-gray-700 truncate max-w-[120px]" title={banner.organization.name}>
                            {banner.organization.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {banner.link ? (
                          <div className="flex items-center gap-1 max-w-[140px]">
                            <LinkIcon className="size-3 text-muted-foreground shrink-0" />
                            <span className="text-xs text-blue-600 truncate" title={banner.link}>
                              {banner.link.replace(/^https?:\/\//, '')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{getActiveBadge(banner.isActive)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground text-center">
                        {banner.sortOrder}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(banner.createdAt)}
                      </TableCell>
                    </TableRow>
                  )}
                  renderMobileCard={(banner) => (
                    <div key={banner.id} className="border border-gray-100 rounded-lg p-4 space-y-2.5">
                      <div className="flex items-start gap-3">
                        <img src={banner.image} alt={banner.title} className="size-14 rounded-md object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate" title={banner.title}>{banner.title}</p>
                            {getActiveBadge(banner.isActive)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{banner.organization.name}</p>
                        </div>
                      </div>
                      {banner.link && (
                        <div className="flex items-center gap-1 text-xs">
                          <LinkIcon className="size-3 text-muted-foreground" />
                          <span className="text-blue-600 truncate">{banner.link.replace(/^https?:\/\//, '')}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Order: {banner.sortOrder}</span>
                        <span>{formatDate(banner.createdAt)}</span>
                      </div>
                    </div>
                  )}
                />
              </TabsContent>

              {/* Blogs Tab */}
              <TabsContent value="blogs" className="mt-0">
                <ContentTableSection
                  loading={loading}
                  items={blogs}
                  emptyIcon={FileText}
                  emptyTitle="No blogs found"
                  emptyDesc={searchQuery || selectedOrgId ? 'Try adjusting your search or filters' : 'Blogs will appear here once teachers create them'}
                  columns={['Title', 'Organization', 'Tags', 'Status', 'Created']}
                  renderRow={(blog) => (
                    <TableRow key={blog.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3 max-w-[280px]">
                          {blog.thumbnail ? (
                            <img src={blog.thumbnail} alt="" className="size-9 rounded-md object-cover shrink-0" />
                          ) : (
                            <div className="flex items-center justify-center size-9 rounded-md bg-rose-50 shrink-0">
                              <FileText className="size-4 text-rose-500" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-gray-900 truncate block" title={blog.title}>
                              {blog.title}
                            </span>
                            {blog.excerpt && (
                              <p className="text-xs text-muted-foreground truncate max-w-[220px]" title={blog.excerpt}>
                                {blog.excerpt}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="size-3 text-muted-foreground" />
                          <span className="text-sm text-gray-700 truncate max-w-[140px]" title={blog.organization.name}>
                            {blog.organization.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {blog.tags ? (
                          <div className="flex gap-1 flex-wrap max-w-[200px]">
                            {blog.tags.split(',').slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs border-gray-200 py-0">
                                <Tag className="size-2.5 mr-0.5" />
                                {tag.trim()}
                              </Badge>
                            ))}
                            {blog.tags.split(',').length > 3 && (
                              <span className="text-xs text-muted-foreground">+{blog.tags.split(',').length - 3}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(blog.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(blog.createdAt)}
                      </TableCell>
                    </TableRow>
                  )}
                  renderMobileCard={(blog) => (
                    <div key={blog.id} className="border border-gray-100 rounded-lg p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          {blog.thumbnail ? (
                            <img src={blog.thumbnail} alt="" className="size-9 rounded-md object-cover shrink-0" />
                          ) : (
                            <div className="flex items-center justify-center size-9 rounded-md bg-rose-50 shrink-0">
                              <FileText className="size-4 text-rose-500" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate" title={blog.title}>{blog.title}</p>
                            <p className="text-xs text-muted-foreground">{blog.organization.name}</p>
                          </div>
                        </div>
                        {getStatusBadge(blog.status)}
                      </div>
                      {blog.tags && (
                        <div className="flex gap-1 flex-wrap">
                          {blog.tags.split(',').slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs border-gray-200 py-0">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span></span>
                        <span>{formatDate(blog.createdAt)}</span>
                      </div>
                    </div>
                  )}
                />
              </TabsContent>

              {/* Coupons Tab */}
              <TabsContent value="coupons" className="mt-0">
                <ContentTableSection
                  loading={loading}
                  items={coupons}
                  emptyIcon={Tag}
                  emptyTitle="No coupons found"
                  emptyDesc={searchQuery || selectedOrgId ? 'Try adjusting your search or filters' : 'Coupons will appear here once teachers create them'}
                  columns={['Code', 'Organization', 'Discount', 'Usage', 'Valid Until', 'Status']}
                  renderRow={(coupon) => (
                    <TableRow key={coupon.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center justify-center size-8 rounded-md bg-teal-50 shrink-0">
                            <Tag className="size-3.5 text-teal-500" />
                          </div>
                          <span className="text-sm font-mono font-semibold text-gray-900">{coupon.code}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="size-3 text-muted-foreground" />
                          <span className="text-sm text-gray-700 truncate max-w-[140px]" title={coupon.organization.name}>
                            {coupon.organization.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-gray-900">
                          {coupon.discountType === 'percentage' ? `${coupon.discount}%` : formatCurrency(coupon.discount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {coupon.usedCount}{coupon.maxUses !== null ? `/${coupon.maxUses}` : ''}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {coupon.validTo ? formatDate(coupon.validTo) : '—'}
                      </TableCell>
                      <TableCell>{getCouponStatusBadge(coupon)}</TableCell>
                    </TableRow>
                  )}
                  renderMobileCard={(coupon) => (
                    <div key={coupon.id} className="border border-gray-100 rounded-lg p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center justify-center size-8 rounded-md bg-teal-50 shrink-0">
                            <Tag className="size-3.5 text-teal-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-mono font-semibold text-gray-900 truncate" title={coupon.code}>{coupon.code}</p>
                            <p className="text-xs text-muted-foreground">{coupon.organization.name}</p>
                          </div>
                        </div>
                        {getCouponStatusBadge(coupon)}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-gray-700">
                            {coupon.discountType === 'percentage' ? `${coupon.discount}% off` : `${formatCurrency(coupon.discount)} off`}
                          </span>
                          <span>Used: {coupon.usedCount}{coupon.maxUses !== null ? `/${coupon.maxUses}` : ''}</span>
                        </div>
                        <span>{coupon.validTo ? formatDate(coupon.validTo) : 'No expiry'}</span>
                      </div>
                    </div>
                  )}
                />
              </TabsContent>

              {/* Leads Tab */}
              <TabsContent value="leads" className="mt-0">
                <ContentTableSection
                  loading={loading}
                  items={leads}
                  emptyIcon={UserPlus}
                  emptyTitle="No leads found"
                  emptyDesc={searchQuery || selectedOrgId ? 'Try adjusting your search or filters' : 'Leads will appear here once submitted'}
                  columns={['Name', 'Email', 'Phone', 'Organization', 'Source', 'Status', 'Date']}
                  renderRow={(lead) => (
                    <TableRow key={lead.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center size-8 rounded-full bg-sky-50 shrink-0">
                            <span className="text-xs font-semibold text-sky-600">
                              {lead.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 max-w-[160px] truncate block" title={lead.name}>
                            {lead.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.email ? (
                          <div className="flex items-center gap-1.5">
                            <Mail className="size-3 text-muted-foreground" />
                            <span className="text-sm text-gray-700 truncate max-w-[160px]" title={lead.email}>{lead.email}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="size-3 text-muted-foreground" />
                            <span className="text-sm text-gray-700">{lead.phone}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="size-3 text-muted-foreground" />
                          <span className="text-sm text-gray-700 truncate max-w-[120px]" title={lead.organization.name}>
                            {lead.organization.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.source ? (
                          <Badge variant="outline" className="text-xs border-gray-200">{lead.source}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{getLeadStatusBadge(lead.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                    </TableRow>
                  )}
                  renderMobileCard={(lead) => (
                    <div key={lead.id} className="border border-gray-100 rounded-lg p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center justify-center size-8 rounded-full bg-sky-50 shrink-0">
                            <span className="text-xs font-semibold text-sky-600">
                              {lead.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate" title={lead.name}>{lead.name}</p>
                            <p className="text-xs text-muted-foreground">{lead.organization.name}</p>
                          </div>
                        </div>
                        {getLeadStatusBadge(lead.status)}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {lead.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="size-3" />
                            <span className="truncate max-w-[140px]">{lead.email}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="size-3" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          {lead.source && <Badge variant="outline" className="text-xs border-gray-200">{lead.source}</Badge>}
                        </div>
                        <span>{formatDate(lead.createdAt)}</span>
                      </div>
                    </div>
                  )}
                />
              </TabsContent>

              {/* Support Tab */}
              <TabsContent value="support" className="mt-0">
                <ContentTableSection
                  loading={loading}
                  items={supportQueries}
                  emptyIcon={MessageSquare}
                  emptyTitle="No support queries found"
                  emptyDesc={searchQuery || selectedOrgId ? 'Try adjusting your search or filters' : 'Support queries will appear here once submitted'}
                  columns={['Name', 'Subject', 'Organization', 'Status', 'Date']}
                  renderRow={(sq) => (
                    <TableRow key={sq.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center size-8 rounded-full bg-orange-50 shrink-0">
                            <span className="text-xs font-semibold text-orange-600">
                              {(sq.studentName || '?').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-gray-900 truncate block max-w-[140px]" title={sq.studentName || ''}>
                              {sq.studentName || 'Unknown'}
                            </span>
                            {sq.studentEmail && (
                              <p className="text-xs text-muted-foreground truncate max-w-[140px]" title={sq.studentEmail}>
                                {sq.studentEmail}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-700 max-w-[200px] truncate block" title={sq.subject}>
                          {sq.subject}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="size-3 text-muted-foreground" />
                          <span className="text-sm text-gray-700 truncate max-w-[120px]" title={sq.organization.name}>
                            {sq.organization.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getSupportStatusBadge(sq.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(sq.createdAt)}
                      </TableCell>
                    </TableRow>
                  )}
                  renderMobileCard={(sq) => (
                    <div key={sq.id} className="border border-gray-100 rounded-lg p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center justify-center size-8 rounded-full bg-orange-50 shrink-0">
                            <span className="text-xs font-semibold text-orange-600">
                              {(sq.studentName || '?').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate" title={sq.studentName || ''}>{sq.studentName || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{sq.organization.name}</p>
                          </div>
                        </div>
                        {getSupportStatusBadge(sq.status)}
                      </div>
                      <div>
                        <p className="text-sm text-gray-700 font-medium">{sq.subject}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{sq.message}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {sq.studentEmail && <span>{sq.studentEmail}</span>}
                        <span>{formatDate(sq.createdAt)}</span>
                      </div>
                    </div>
                  )}
                />
              </TabsContent>

              {/* Quick Links Tab */}
              <TabsContent value="quick-links" className="mt-0">
                <ContentTableSection
                  loading={loading}
                  items={quickLinks}
                  emptyIcon={LinkIcon}
                  emptyTitle="No quick links found"
                  emptyDesc={searchQuery || selectedOrgId ? 'Try adjusting your search or filters' : 'Quick links will appear here once teachers create them'}
                  columns={['Title', 'URL', 'Organization', 'Sort Order', 'Created']}
                  renderRow={(ql) => (
                    <TableRow key={ql.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center size-8 rounded-md bg-cyan-50 shrink-0">
                            <LinkIcon className="size-3.5 text-cyan-500" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 max-w-[180px] truncate block" title={ql.title}>
                            {ql.title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 max-w-[180px]">
                          <ExternalLink className="size-3 text-muted-foreground shrink-0" />
                          <span className="text-xs text-blue-600 truncate" title={ql.url}>
                            {ql.url.replace(/^https?:\/\//, '')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="size-3 text-muted-foreground" />
                          <span className="text-sm text-gray-700 truncate max-w-[120px]" title={ql.organization.name}>
                            {ql.organization.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground text-center">
                        {ql.sortOrder}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(ql.createdAt)}
                      </TableCell>
                    </TableRow>
                  )}
                  renderMobileCard={(ql) => (
                    <div key={ql.id} className="border border-gray-100 rounded-lg p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center justify-center size-8 rounded-md bg-cyan-50 shrink-0">
                            <LinkIcon className="size-3.5 text-cyan-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate" title={ql.title}>{ql.title}</p>
                            <p className="text-xs text-muted-foreground">{ql.organization.name}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs border-gray-200 shrink-0">
                          #{ql.sortOrder}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <ExternalLink className="size-3 text-muted-foreground" />
                        <span className="text-blue-600 truncate">{ql.url.replace(/^https?:\/\//, '')}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span></span>
                        <span>{formatDate(ql.createdAt)}</span>
                      </div>
                    </div>
                  )}
                />
              </TabsContent>

              {/* Categories Tab */}
              <TabsContent value="categories" className="mt-0">
                <ContentTableSection
                  loading={loading}
                  items={categories}
                  emptyIcon={FolderTree}
                  emptyTitle="No categories found"
                  emptyDesc={searchQuery || selectedOrgId ? 'Try adjusting your search or filters' : 'Categories will appear here once teachers create them'}
                  columns={['Name', 'Slug', 'Organization', 'Icon', 'Created']}
                  renderRow={(cat) => (
                    <TableRow key={cat.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center size-8 rounded-md bg-violet-50 shrink-0">
                            <FolderTree className="size-3.5 text-violet-500" />
                          </div>
                          <span className="text-sm font-medium text-gray-900 max-w-[180px] truncate block" title={cat.name}>
                            {cat.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs border-gray-200 font-mono">
                          {cat.slug}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Building2 className="size-3 text-muted-foreground" />
                          <span className="text-sm text-gray-700 truncate max-w-[140px]" title={cat.organization.name}>
                            {cat.organization.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {cat.icon ? (
                          <span className="text-sm text-muted-foreground">{cat.icon}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(cat.createdAt)}
                      </TableCell>
                    </TableRow>
                  )}
                  renderMobileCard={(cat) => (
                    <div key={cat.id} className="border border-gray-100 rounded-lg p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex items-center justify-center size-8 rounded-md bg-violet-50 shrink-0">
                            <FolderTree className="size-3.5 text-violet-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate" title={cat.name}>{cat.name}</p>
                            <p className="text-xs text-muted-foreground">{cat.organization.name}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs border-gray-200 font-mono shrink-0">
                          {cat.slug}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        {cat.icon && <span>Icon: {cat.icon}</span>}
                        <span>{formatDate(cat.createdAt)}</span>
                      </div>
                    </div>
                  )}
                />
              </TabsContent>

            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Reusable Content Table Section ──────────────────────────────────────────
function ContentTableSection<T extends { id: string }>({
  loading,
  items,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyDesc,
  columns,
  renderRow,
  renderMobileCard,
}: {
  loading: boolean
  items: T[]
  emptyIcon: React.ComponentType<{ className?: string }>
  emptyTitle: string
  emptyDesc: string
  columns: string[]
  renderRow: (item: T) => React.ReactNode
  renderMobileCard: (item: T) => React.ReactNode
}) {
  if (loading) {
    return (
      <div className="space-y-0">
        {/* Desktop skeleton */}
        <div className="hidden md:block">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-3 border-b border-gray-50">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
        {/* Mobile skeleton */}
        <div className="md:hidden space-y-3 px-4 pb-4 pt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-gray-100 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-48" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <EmptyIcon className="size-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-600">{emptyTitle}</p>
        <p className="text-xs text-muted-foreground mt-1">{emptyDesc}</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-100 hover:bg-transparent">
              {columns.map((col) => (
                <TableHead key={col} className="text-xs font-medium text-muted-foreground">
                  {col}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(renderRow)}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3 px-4 py-3">
        {items.map(renderMobileCard)}
      </div>
    </>
  )
}
