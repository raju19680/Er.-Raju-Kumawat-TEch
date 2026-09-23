'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  SlidersHorizontal,
  MoreVertical,
  FolderPlus,
  Link2,
  Video,
  FileText,
  ClipboardCheck,
  HelpCircle,
  Image,
  Music,
  Radio,
  MonitorPlay,
  Eye,
  Edit3,
  Copy,
  RefreshCw,
  Share2,
  Trash2,
  BookOpen,
  LayoutGrid,
  ChevronDown,
} from 'lucide-react'

// ─── Sample product data ───────────────────────────────────────────────────────
interface Product {
  id: number
  name: string
  category: string
  price: string
  status: 'active' | 'draft' | 'archived'
  students: number
  type: 'Course' | 'Test Series' | 'Digital'
}

const products: Product[] = [
  { id: 1, name: '\u0935\u093F\u091C\u094D\u091E\u093E\u0928 \u0935\u093F\u0937\u092F\u0915\u094B\u0902 \u0915\u0940 \u092A\u094D\u0930\u0936\u094D\u0928 \u092A\u0924\u094D\u0930 | Exam Guide', category: 'Course', price: '\u20B92,999', status: 'active', students: 847, type: 'Course' },
  { id: 2, name: 'Physics Complete Course', category: 'Course', price: '\u20B92,499', status: 'active', students: 1234, type: 'Course' },
  { id: 3, name: 'NEET Mock Test Series 2026', category: 'Test Series', price: '\u20B9499', status: 'active', students: 2156, type: 'Test Series' },
  { id: 4, name: 'Chemistry Masterclass', category: 'Course', price: '\u20B91,999', status: 'active', students: 623, type: 'Course' },
  { id: 5, name: 'JEE Mathematics Practice Set', category: 'Test Series', price: '\u20B9399', status: 'active', students: 934, type: 'Test Series' },
  { id: 6, name: 'Biology Notes PDF', category: 'Digital', price: '\u20B9199', status: 'active', students: 2100, type: 'Digital' },
  { id: 7, name: 'Mathematics Formula Book', category: 'Digital', price: '\u20B9149', status: 'draft', students: 0, type: 'Digital' },
  { id: 8, name: 'Hindi Sahitya | Complete Guide', category: 'Course', price: '\u20B91,299', status: 'active', students: 445, type: 'Course' },
]

// ─── Bulk actions ───────────────────────────────────────────────────────────────
const bulkActions = [
  { label: 'Add Folder', icon: FolderPlus },
  { label: 'Add Link', icon: Link2 },
  { label: 'Add Video', icon: Video },
  { label: 'Add PDF', icon: FileText },
  { label: 'Add Test', icon: ClipboardCheck },
  { label: 'Add Quiz', icon: HelpCircle },
  { label: 'Add Image', icon: Image },
  { label: 'Add Audio', icon: Music },
  { label: 'Add Live Stream', icon: Radio },
  { label: 'Add YouTube/Zoom Video', icon: MonitorPlay },
]

// ─── Product actions ────────────────────────────────────────────────────────────
const productActions = [
  { label: 'Course Overview', icon: Eye },
  { label: 'Add/View Content', icon: LayoutGrid },
  { label: 'Edit', icon: Edit3 },
  { label: 'Duplicate', icon: Copy },
  { label: 'Refresh', icon: RefreshCw },
  { label: 'Share', icon: Share2 },
  { label: 'Delete', icon: Trash2, destructive: true },
]

// ─── Category badge colors ──────────────────────────────────────────────────────
function getCategoryBadge(category: string) {
  switch (category) {
    case 'Course':
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-0 text-xs">{category}</Badge>
    case 'Test Series':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 text-xs">{category}</Badge>
    case 'Digital':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 text-xs">{category}</Badge>
    default:
      return <Badge variant="secondary" className="text-xs">{category}</Badge>
  }
}

// ─── Products Page ──────────────────────────────────────────────────────────────
export function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProducts = products.filter(
    (p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           p.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your courses, test series, and digital products</p>
        </div>
        <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
          <Plus className="size-4" />
          Add Product
        </Button>
      </div>

      {/* Tab Navigation */}
      <Tabs defaultValue="products" className="w-full">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="live-upcoming">Live &amp; Upcoming</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-4 space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Filters */}
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="size-4" />
                Filters
              </Button>

              {/* Bulk Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    Bulk Actions
                    <ChevronDown className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Add Content</DropdownMenuLabel>
                  {bulkActions.map((action, i) => (
                    <DropdownMenuItem key={i} className="gap-2 cursor-pointer">
                      <action.icon className="size-4 text-muted-foreground" />
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Add Button */}
              <Button size="icon" variant="outline" className="size-9">
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          {/* Products Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-12 text-center font-semibold">S.NO</TableHead>
                    <TableHead className="font-semibold">PRODUCT NAME</TableHead>
                    <TableHead className="font-semibold hidden sm:table-cell">CATEGORY</TableHead>
                    <TableHead className="font-semibold">PRICE</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">SORT BY</TableHead>
                    <TableHead className="text-right font-semibold">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product, index) => (
                    <TableRow key={product.id} className="group">
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                            {product.type === 'Course' ? (
                              <BookOpen className="size-4 text-purple-600" />
                            ) : product.type === 'Test Series' ? (
                              <ClipboardCheck className="size-4 text-amber-600" />
                            ) : (
                              <FileText className="size-4 text-emerald-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate max-w-[200px] lg:max-w-none">
                              {product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.students > 0 ? `${product.students} students` : 'No students yet'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {getCategoryBadge(product.category)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold text-foreground">{product.price}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          variant={product.status === 'active' ? 'default' : 'secondary'}
                          className={`text-xs ${
                            product.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0'
                              : product.status === 'draft'
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-0'
                              : 'bg-muted text-muted-foreground border-0'
                          }`}
                        >
                          {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8 opacity-60 hover:opacity-100">
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {productActions.map((action, i) => (
                              <React.Fragment key={i}>
                                {action.label === 'Delete' && <DropdownMenuSeparator />}
                                <DropdownMenuItem
                                  className={`gap-2 cursor-pointer ${
                                    'destructive' in action && action.destructive
                                      ? 'text-red-600 focus:text-red-600 focus:bg-red-50'
                                      : ''
                                  }`}
                                >
                                  <action.icon className="size-4" />
                                  {action.label}
                                </DropdownMenuItem>
                              </React.Fragment>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        No products found matching &quot;{searchQuery}&quot;
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Table Footer Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {filteredProducts.length} of {products.length} products</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled className="h-7 text-xs">Previous</Button>
              <Button variant="outline" size="sm" className="h-7 text-xs">Next</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="live-upcoming" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Live &amp; Upcoming Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'NEET Physics Live Session', date: 'Jun 8, 2026', time: '10:00 AM', status: 'live', enrolled: 156 },
                  { name: 'JEE Maths Doubt Clearing', date: 'Jun 9, 2026', time: '2:00 PM', status: 'upcoming', enrolled: 89 },
                  { name: 'Chemistry Lab Practical', date: 'Jun 11, 2026', time: '11:00 AM', status: 'upcoming', enrolled: 234 },
                  { name: 'Biology Grand Test Review', date: 'Jun 12, 2026', time: '5:00 PM', status: 'upcoming', enrolled: 312 },
                ].map((session, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Radio className="size-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{session.name}</p>
                        <p className="text-xs text-muted-foreground">{session.enrolled} students enrolled</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {session.status === 'live' && (
                        <Badge className="bg-red-500 text-white text-xs px-2 animate-pulse">LIVE</Badge>
                      )}
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">{session.date}</p>
                        <p className="text-xs text-muted-foreground">{session.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="mt-4">
          <Card>
            <CardContent className="p-8">
              <div className="text-center space-y-3">
                <LayoutGrid className="size-12 text-muted-foreground mx-auto" />
                <h3 className="text-lg font-semibold text-foreground">Content Management</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Add videos, PDFs, quizzes, and more to your courses. Select a product first to manage its content.
                </p>
                <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
                  <Plus className="size-4" />
                  Add Content
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ProductsPage
