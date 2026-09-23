'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { MediaImage } from '@/components/ui/media-image'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Pencil, Copy, Calculator, Trash2 } from 'lucide-react'

// Same types from parent
export interface TestSeriesItem {
  id: string
  title: string
  thumbnail: string | null
  isCombo: boolean
  price: number
  mrp: number
  sortOrder: number
  status: 'published' | 'draft'
  category: string
  testCount: number
  parentId: string | null
  [key: string]: unknown
}

const categoryColors: Record<string, string> = {
  JEE: 'bg-rose-500',
  NEET: 'bg-emerald-500',
  CUET: 'bg-purple-500',
  GATE: 'bg-orange-500',
  UPSC: 'bg-rose-500',
  CAT: 'bg-amber-500',
  Other: 'bg-slate-500',
}

interface TestSeriesCardProps {
  item: TestSeriesItem
  viewMode: 'list' | 'grid'
  isSelected: boolean
  onSelect: (id: string, checked: boolean) => void
  onNavigateToFolder: (item: { id: string, title: string }) => void
  onToggleStatus: (item: TestSeriesItem, enable: boolean) => void
  onEdit: (item: TestSeriesItem) => void
  onDuplicate: (item: TestSeriesItem) => void
  onRecalculate: (id: string) => void
  onDelete: (item: TestSeriesItem) => void
}

export function TestSeriesCard({
  item,
  viewMode,
  isSelected,
  onSelect,
  onNavigateToFolder,
  onToggleStatus,
  onEdit,
  onDuplicate,
  onRecalculate,
  onDelete,
}: TestSeriesCardProps) {
  const discount = (price: number, mrp: number) =>
    mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0

  if (viewMode === 'list') {
    return (
      <Card className="overflow-hidden rounded-xl">
        <CardContent className="p-0">
          <div className="flex flex-row items-start gap-3 sm:gap-4 p-4">
            <div className="pt-4 pr-1">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(item.id, checked === true)}
              />
            </div>

            <div
              className={`relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg overflow-hidden text-white ${
                categoryColors[item.category] || 'bg-slate-500'
              }`}
            >
              {item.thumbnail ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <MediaImage src={item.thumbnail} alt={item.title} className="object-cover w-full h-full" />
              ) : (
                <span className="text-lg font-bold">{(item.category || '?').charAt(0)}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 
                  className="truncate text-sm font-semibold cursor-pointer hover:underline hover:text-blue-600 transition-colors"
                  onClick={() => onNavigateToFolder({ id: item.id, title: item.title })}
                >
                  {item.title}
                </h3>
                {item.isCombo && (
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 text-xs px-1.5 py-0 flex-shrink-0">
                    COMBO
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground flex-wrap">
                <span>{item.category}</span>
                <span>&#8226;</span>
                <span>{item.testCount} tests</span>
                <span className="hidden sm:inline">&#8226;</span>
                <span className="hidden sm:inline">Sort #{item.sortOrder}</span>
              </div>
              {/* Mobile: Price & Status row */}
              <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:hidden flex-wrap">
                <div className="text-sm font-bold">
                  ₹{item.price.toLocaleString()}
                </div>
                {item.mrp > item.price && (
                  <div className="text-xs text-muted-foreground line-through">
                    ₹{item.mrp.toLocaleString()}
                  </div>
                )}
                {item.mrp > item.price && (
                  <span className="text-xs font-medium text-emerald-600">
                    {discount(item.price, item.mrp)}% off
                  </span>
                )}
                <Badge
                  className={
                    item.status === 'published'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }
                >
                  {item.status === 'published' ? 'Published' : 'Draft'}
                </Badge>
              </div>
            </div>

            {/* Desktop: Price */}
            <div className="hidden sm:block flex-shrink-0 text-right">
              <div className="text-sm font-bold">
                ₹{item.price.toLocaleString()}
              </div>
              {item.mrp > item.price && (
                <div className="text-xs text-muted-foreground line-through">
                  ₹{item.mrp.toLocaleString()}
                </div>
              )}
              {item.mrp > item.price && (
                <span className="text-xs font-medium text-emerald-600">
                  {discount(item.price, item.mrp)}% off
                </span>
              )}
            </div>

            {/* Desktop: Status */}
            <div className="hidden sm:block flex-shrink-0">
              <Badge
                className={
                  item.status === 'published'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }
              >
                {item.status === 'published' ? 'Published' : 'Draft'}
              </Badge>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 self-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => onNavigateToFolder({ id: item.id, title: item.title })}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Folder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => { e.preventDefault(); onToggleStatus(item, item.status !== 'published') }}>
                    <div className="flex w-full items-center justify-between">
                      <span className="flex items-center"><Switch checked={item.status === 'published'} className="mr-2 scale-75" /> Enable</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(item)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Series
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRecalculate(item.id)}>
                    <Calculator className="mr-2 h-4 w-4" />
                    Recalculate Test Count
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete(item)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Series
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Grid View
  return (
    <Card className="overflow-hidden rounded-xl">
      <div
        className={`relative flex h-32 w-full items-center justify-center overflow-hidden ${
          categoryColors[item.category] || 'bg-slate-500'
        }`}
      >
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            className="bg-white/80 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-white/40 shadow-sm backdrop-blur-sm"
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(item.id, checked === true)}
          />
        </div>
        {item.thumbnail ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <MediaImage src={item.thumbnail} alt={item.title} className="object-cover w-full h-full" />
        ) : (
          <span className="text-4xl font-bold text-white">{(item.category || '?').charAt(0)}</span>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 
                className="truncate text-sm font-semibold cursor-pointer hover:underline hover:text-blue-600 transition-colors"
                onClick={() => onNavigateToFolder({ id: item.id, title: item.title })}
              >
                {item.title}
              </h3>
              {item.isCombo && (
                <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 text-xs px-1.5 py-0 flex-shrink-0">
                  COMBO
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.category} &bull; {item.testCount} tests &bull; Sort #{item.sortOrder}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div>
            <span className="text-sm font-bold">₹{item.price.toLocaleString()}</span>
            {item.mrp > item.price && (
              <span className="ml-1.5 text-xs text-muted-foreground line-through">
                ₹{item.mrp.toLocaleString()}
              </span>
            )}
            {item.mrp > item.price && (
              <span className="ml-1.5 text-xs font-medium text-emerald-600">
                {discount(item.price, item.mrp)}% off
              </span>
            )}
          </div>
          <Badge
            className={
              item.status === 'published'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }
          >
            {item.status === 'published' ? 'Published' : 'Draft'}
          </Badge>
        </div>

        <div className="mt-3 flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 flex-1 text-xs"
            onClick={() => onEdit(item)}
          >
            <Pencil className="mr-1 h-3 w-3" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 flex-1 text-xs"
            onClick={() => onNavigateToFolder({ id: item.id, title: item.title })}
          >
            <Eye className="mr-1 h-3 w-3" />
            Open
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => onNavigateToFolder({ id: item.id, title: item.title })}>
                <Eye className="mr-2 h-4 w-4" />
                Open Folder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.preventDefault(); onToggleStatus(item, item.status !== 'published') }}>
                <div className="flex w-full items-center justify-between">
                  <span className="flex items-center"><Switch checked={item.status === 'published'} className="mr-2 scale-75" /> Enable</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(item)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Series
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRecalculate(item.id)}>
                <Calculator className="mr-2 h-4 w-4" />
                Recalculate Test Count
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(item)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Series
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
