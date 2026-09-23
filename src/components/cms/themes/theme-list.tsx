'use client'
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Pencil, Copy, Trash2, Palette, Eye, MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

export default function ThemeList() {
  const { setCurrentPage } = useAppStore()
  
  const [themes, setThemes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [themeToDelete, setThemeToDelete] = useState<any>(null)

  const fetchThemes = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await apiFetch('/api/teacher/themes')
      if (response.ok) {
        const data = await response.json()
        setThemes(data || [])
      } else {
        toast.error('Failed to fetch themes')
      }
    } catch (error) {
      console.error('Error fetching themes:', error)
      toast.error('Error connecting to server')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchThemes()
  }, [fetchThemes])

  const handleEdit = (themeId: string) => {
    localStorage.setItem('editThemeId', themeId)
    setCurrentPage('theme-builder')
  }

  const handleCreate = () => {
    localStorage.removeItem('editThemeId')
    setCurrentPage('theme-builder')
  }

  const handleDuplicate = async (themeId: string) => {
    try {
      const response = await apiFetch(`/api/teacher/themes/${themeId}/duplicate`, {
        method: 'POST',
      })
      
      if (response.ok) {
        toast.success('Theme duplicated successfully')
        fetchThemes()
      } else {
        toast.error('Failed to duplicate theme')
      }
    } catch (error) {
      console.error('Error duplicating theme:', error)
      toast.error('An error occurred')
    }
  }

  const confirmDelete = (theme: any) => {
    setThemeToDelete(theme)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!themeToDelete) return
    
    try {
      const response = await apiFetch(`/api/teacher/themes/${themeToDelete.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        toast.success('Theme deleted successfully')
        setThemes(themes.filter(t => t.id !== themeToDelete.id))
      } else {
        toast.error('Failed to delete theme')
      }
    } catch (error) {
      console.error('Error deleting theme:', error)
      toast.error('An error occurred')
    } finally {
      setIsDeleteDialogOpen(false)
      setThemeToDelete(null)
    }
  }

  const filteredThemes = themes.filter((theme) => {
    const matchesSearch = theme.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          theme.code?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || theme.status === statusFilter
    const matchesType = typeFilter === 'all' || theme.themeType === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">Active</Badge>
      case 'draft':
        return <Badge variant="outline" className="text-gray-600">Draft</Badge>
      case 'archived':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'exam':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Exam</Badge>
      case 'practice':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200">Practice</Badge>
      case 'custom':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200">Custom</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const renderColorCircle = (color: string) => {
    if (!color) return null
    return (
      <div 
        className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" 
        style={{ backgroundColor: color }}
        title={color}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Themes</h1>
          <p className="text-muted-foreground">Manage appearance themes for exams and practice sessions.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Theme
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search themes..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Theme Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="exam">Exam</SelectItem>
            <SelectItem value="practice">Practice</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                  </div>
                </div>
                <div className="bg-muted/50 p-4 flex justify-between">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredThemes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredThemes.map((theme) => (
            <Card key={theme.id} className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <CardContent className="p-0 flex-1 flex flex-col">
                <div className="p-6 flex-1 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1" title={theme.name}>{theme.name}</h3>
                      <p className="text-sm text-muted-foreground font-mono mt-1">{theme.code}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {getStatusBadge(theme.status)}
                      {getTypeBadge(theme.themeType)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Primary Colors</p>
                    <div className="flex gap-2 p-2 bg-gray-50 rounded-md border">
                      {renderColorCircle(theme.colors?.primary || '#000000')}
                      {renderColorCircle(theme.colors?.secondary || '#ffffff')}
                      {renderColorCircle(theme.colors?.accent || '#cccccc')}
                      {renderColorCircle(theme.colors?.background || '#f9f9f9')}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(theme.createdAt || Date.now()).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="bg-muted/30 p-4 border-t flex justify-between items-center">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(theme.id)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(theme.id)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(theme.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => confirmDelete(theme)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 border rounded-lg bg-gray-50/50">
          <Palette className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No themes found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your search or filters to find what you are looking for.'
              : 'Get started by creating your first appearance theme.'}
          </p>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Theme
          </Button>
        </div>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Theme</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the theme "{themeToDelete?.name}"? This action cannot be undone.
              Exams currently using this theme might fall back to the default appearance.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
