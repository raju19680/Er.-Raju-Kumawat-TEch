'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Plus,
  Pencil,
  BarChart3,
  Copy,
  Globe,
  CheckCircle,
  FileDown,
  RefreshCw,
  Trash2,
  GripVertical,
  FileText,
  HelpCircle,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { Test } from '@prisma/client'

interface TestItemCardProps {
  test: any
  index: number
  onSetActiveTestManager: (test: any) => void
  onOpenEditTest: (test: any) => void
  onAction: (action: string, test: any) => void
  onDuplicateTest: (test: any) => void
  onTogglePublish: (test: any) => void
  onDeleteTest: (id: string) => void
}

export function TestItemCard({
  test,
  index,
  onSetActiveTestManager,
  onOpenEditTest,
  onAction,
  onDuplicateTest,
  onTogglePublish,
  onDeleteTest
}: TestItemCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="hover:border-primary/50 transition-colors">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing">
            <GripVertical className="size-5" />
          </div>
          
          <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-blue-50 shrink-0">
            <FileText className="size-5 text-blue-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 
                className="font-semibold text-gray-900 truncate cursor-pointer hover:underline hover:text-blue-600 transition-colors"
                onClick={() => onSetActiveTestManager(test)}
              >
                {test.title}
              </h3>
              <Badge variant="outline" className="text-xs uppercase">
                {test.status}
              </Badge>
              {test.isLive && (
                <Badge className="bg-red-500 hover:bg-red-600 text-xs">LIVE</Badge>
              )}
              {test.testMode === 'OMR' ? (
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs hover:bg-amber-200">
                  OMR Test
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-blue-700 bg-blue-50/50">
                  CBT
                </Badge>
              )}
              {(test.allowPdfDownload || test.allowPdfExport) && (
                <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-xs hover:bg-purple-100">
                  {test.pdfPasswordProtected ? 'PDF (PIN Protected)' : 'PDF Downloadable'}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <HelpCircle className="size-3.5" />
                {test.numberOfQuestions} Qs
              </span>
              <span className="flex items-center gap-1">
                <AlertCircle className="size-3.5" />
                {test.totalMarks} Marks
              </span>
              {test.negativeMarks > 0 && (
                <span className="text-red-500 font-medium">
                  -{test.negativeMarks} Neg
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {test.totalDuration} mins
              </span>
              {test.isPdfTest && (
                <span className="flex items-center gap-1 text-purple-600">
                  PDF Based
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => onSetActiveTestManager(test)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Question
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onOpenEditTest(test)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction('view_result', test)}>
                  <BarChart3 className="mr-2 h-4 w-4" /> View Result
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicateTest(test)}>
                  <Copy className="mr-2 h-4 w-4" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTogglePublish(test)}>
                  <Globe className="mr-2 h-4 w-4" /> {test.isLive ? 'Unpublish Changes' : 'Publish Changes'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction('review_question', test)}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Review Question
                </DropdownMenuItem>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <FileDown className="mr-2 h-4 w-4" />
                    <span>Export PDF</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => onAction('export_pdf_with_sol', test)}>
                        With Solution
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAction('export_pdf_without_sol', test)}>
                        Without Solution
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    <span>Re-evaluate Attempts</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => onAction('reevaluate_marks', test)}>
                        Re-evaluate Marks Only
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                <DropdownMenuItem className="text-red-600" onClick={() => onDeleteTest(test.id)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
