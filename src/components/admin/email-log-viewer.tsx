'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Mail,
  Search,
  RefreshCw,
  Send,
  Loader2,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'

// ─── Types ──────────────────────────────────────────────────────────────────
interface EmailLogEntry {
  id: string
  to: string
  subject: string
  type: string
  status: string
  createdAt: string
  sentAt: string | null
  organizationId: string | null
}

interface EmailLogData {
  success: boolean
  emails: EmailLogEntry[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ─── Type Labels ────────────────────────────────────────────────────────────
const TYPE_LABELS: Record<string, string> = {
  notification: 'Notification',
  access_change: 'Access Change',
  test_published: 'Test Published',
  welcome: 'Welcome',
  payment_receipt: 'Payment Receipt',
}

const TYPE_COLORS: Record<string, string> = {
  notification: 'bg-gray-100 text-gray-700',
  access_change: 'bg-amber-100 text-amber-700',
  test_published: 'bg-emerald-100 text-emerald-700',
  welcome: 'bg-purple-100 text-purple-700',
  payment_receipt: 'bg-blue-100 text-blue-700',
}

const STATUS_COLORS: Record<string, string> = {
  sent: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  failed: 'bg-red-100 text-red-700',
}

// ─── Component ──────────────────────────────────────────────────────────────
export default function EmailLogViewer() {
  const [emails, setEmails] = useState<EmailLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [resending, setResending] = useState<string | null>(null)

  // Fetch email logs
  const fetchEmails = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '15')
      if (search) params.set('search', search)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      if (statusFilter !== 'all') params.set('status', statusFilter)

      const res = await apiFetch(`/api/admin/emails?${params.toString()}`)
      const data: EmailLogData = await res.json()

      if (data.success) {
        setEmails(data.emails)
        setTotalPages(data.pagination.totalPages)
        setTotal(data.pagination.total)
      }
    } catch (error) {
      console.error('[EmailLog] Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }, [page, search, typeFilter, statusFilter])

  useEffect(() => {
    fetchEmails()
  }, [fetchEmails])

  // Resend a failed email
  const handleResend = async (emailId: string) => {
    setResending(emailId)
    try {
      await apiFetch('/api/admin/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId }),
      })
      // Refresh the list
      await fetchEmails()
    } catch (error) {
      console.error('[EmailLog] Resend error:', error)
    } finally {
      setResending(null)
    }
  }

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center size-9 rounded-lg bg-amber-50">
            <Mail className="size-4 text-amber-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base font-semibold">Email Log</CardTitle>
            <CardDescription className="text-xs">
              View and manage email notifications ({total} total)
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEmails}
            disabled={loading}
            className="cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by email or subject..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-44 h-9 text-sm">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="notification">Notification</SelectItem>
              <SelectItem value="access_change">Access Change</SelectItem>
              <SelectItem value="test_published">Test Published</SelectItem>
              <SelectItem value="welcome">Welcome</SelectItem>
              <SelectItem value="payment_receipt">Payment Receipt</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-36 h-9 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <TableHead className="text-xs font-medium">To</TableHead>
                <TableHead className="text-xs font-medium">Subject</TableHead>
                <TableHead className="text-xs font-medium hidden sm:table-cell">Type</TableHead>
                <TableHead className="text-xs font-medium hidden md:table-cell">Status</TableHead>
                <TableHead className="text-xs font-medium hidden lg:table-cell">Date</TableHead>
                <TableHead className="text-xs font-medium w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                    <p className="text-xs text-gray-400 mt-2">Loading emails...</p>
                  </TableCell>
                </TableRow>
              ) : emails.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Mail className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No emails found</p>
                    <p className="text-xs text-gray-400">Emails will appear here when notifications are sent</p>
                  </TableCell>
                </TableRow>
              ) : (
                emails.map((email) => (
                  <TableRow key={email.id} className="hover:bg-gray-50/50">
                    <TableCell className="text-xs text-gray-700 max-w-[160px] truncate">
                      {email.to}
                    </TableCell>
                    <TableCell className="text-xs text-gray-900 max-w-[200px] truncate font-medium">
                      {email.subject}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge className={`${TYPE_COLORS[email.type] || 'bg-gray-100 text-gray-700'} border-0 text-xs px-1.5 py-0`}>
                        {TYPE_LABELS[email.type] || email.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge className={`${STATUS_COLORS[email.status] || 'bg-gray-100 text-gray-700'} border-0 text-xs px-1.5 py-0`}>
                        {email.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 hidden lg:table-cell">
                      {formatDate(email.createdAt)}
                    </TableCell>
                    <TableCell>
                      {email.status === 'failed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResend(email.id)}
                          disabled={resending === email.id}
                          className="h-7 w-7 p-0 cursor-pointer"
                          title="Resend email"
                        >
                          {resending === email.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5 text-amber-600" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages} ({total} emails)
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1 || loading}
                className="h-8 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages || loading}
                className="h-8 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
