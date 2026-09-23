'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Filter,
  RefreshCw,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import AddTestDrawer from './add-test-drawer'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export default function TestsManager() {
  const { orgCode } = useAppStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [testTypeFilter, setTestTypeFilter] = useState('all')
  const [currentPageNum, setCurrentPageNum] = useState(1)
  
  const [tests, setTests] = useState<any[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingData, setEditingData] = useState<Record<string, unknown> | undefined>()
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [testToDelete, setTestToDelete] = useState<any | null>(null)

  const limit = 20

  const fetchTests = useCallback(async () => {
    if (!orgCode) return
    setLoading(true)
    try {
      const typeParam = testTypeFilter !== 'all' ? `&testType=${testTypeFilter}` : ''
      const res = await apiFetchJSON<{ items: any[]; total: number }>(
        `/api/teacher/tests?organizationId=${orgCode}&page=${currentPageNum}&limit=${limit}&search=${searchQuery}${typeParam}`
      )
      setTests(res.items || [])
      setTotalItems(res.total || 0)
    } catch (err) {
      toast.error('Failed to load tests')
    } finally {
      setLoading(false)
    }
  }, [orgCode, currentPageNum, limit, searchQuery, testTypeFilter])

  useEffect(() => {
    fetchTests()
  }, [fetchTests])

  const handleDelete = async () => {
    if (!testToDelete) return
    try {
      const res = await apiFetchJSON(`/api/teacher/tests/${testToDelete.id}`, { method: 'DELETE' })
      if (res.success) {
        toast.success('Test deleted successfully')
        setDeleteDialogOpen(false)
        fetchTests()
      } else {
        toast.error(res.error || 'Failed to delete test')
      }
    } catch (err) {
      toast.error('An error occurred')
    }
  }

  const totalPages = Math.ceil(totalItems / limit) || 1

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">All Tests</h2>
          <p className="text-sm text-gray-500 mt-1">Manage all your standalone and series tests</p>
        </div>
        <Button onClick={() => { setEditingData(undefined); setDrawerOpen(true); }} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          Add New Test
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center shrink-0">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 w-full bg-white"
            onKeyDown={(e) => e.key === 'Enter' && fetchTests()}
          />
        </div>
        
        <Select value={testTypeFilter} onValueChange={setTestTypeFilter}>
          <SelectTrigger className="w-[160px] h-10 bg-white">
            <Filter className="w-4 h-4 mr-2 text-gray-500" />
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="objective">Objective (CBT)</SelectItem>
            <SelectItem value="pdf">PDF Test</SelectItem>
            <SelectItem value="subjective">Subjective</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" size="icon" onClick={fetchTests} title="Refresh" className="shrink-0 h-11 w-11 bg-white">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </Button>
      </div>

      <div className="flex-1 min-h-0 relative">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-[88px] w-full rounded-xl" />
            ))}
          </div>
        ) : tests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white border border-dashed rounded-xl">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4">
              <FileText className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No Tests Found</h3>
            <p className="text-gray-500 max-w-sm mb-6">
              You haven't created any tests matching your criteria yet.
            </p>
            <Button onClick={() => { setEditingData(undefined); setDrawerOpen(true); }}>
              Create Your First Test
            </Button>
          </div>
        ) : (
          <div className="space-y-3 pb-2">
            {tests.map(test => (
              <Card key={test.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                <CardContent className="p-0">
                  <div className="flex items-center p-4 sm:p-5 gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-indigo-50 shrink-0">
                      <FileText className="w-6 h-6 text-indigo-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mb-1">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {test.title}
                        </h3>
                        <div className="flex gap-2">
                          <Badge variant={test.status === 'free' ? 'secondary' : 'default'} className="text-xs h-5">
                            {test.status?.toUpperCase() || 'FREE'}
                          </Badge>
                          {test.isPdfTest && (
                            <Badge variant="outline" className="text-xs h-5 border-rose-200 text-rose-700 bg-rose-50">
                              PDF
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                        {test.testSeries?.title ? (
                          <span className="truncate max-w-[200px]">Series: {test.testSeries.title}</span>
                        ) : (
                          <span>Standalone Test</span>
                        )}
                        <span>•</span>
                        <span>{test._count?.questions || 0} Qs</span>
                        <span>•</span>
                        <span>{test.totalMarks || 0} Marks</span>
                        <span>•</span>
                        <span>{test.totalDuration || 0} Mins</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => { setEditingData(test); setDrawerOpen(true); }}
                      >
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                        onClick={() => { setTestToDelete(test); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center shrink-0 pt-4 border-t">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPageNum(Math.max(1, currentPageNum - 1))}
                  className={currentPageNum === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    isActive={currentPageNum === i + 1}
                    onClick={() => setCurrentPageNum(i + 1)}
                    className="cursor-pointer"
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPageNum(Math.min(totalPages, currentPageNum + 1))}
                  className={currentPageNum === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      
      {drawerOpen && (
        <AddTestDrawer 
          open={drawerOpen} 
          onOpenChange={setDrawerOpen} 
          editData={editingData} 
          onSave={() => {
            setDrawerOpen(false);
            fetchTests();
          }} 
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Test</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{testToDelete?.title}</strong>? This action cannot be undone and will delete all associated questions and attempts.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
