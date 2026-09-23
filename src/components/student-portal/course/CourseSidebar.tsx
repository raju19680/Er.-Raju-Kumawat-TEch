import React from 'react'
import {
  Video,
  Monitor,
  Radio,
  FileText,
  Music,
  ImageIcon,
  Link2,
  FileCode,
  Award,
  ClipboardList,
  FileEdit,
  BookOpen,
  Play,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { CourseData, CourseStats, ProgressEntry, Module, Lesson } from './types'

function getLessonIcon(type: string) {
  switch (type) {
    case 'video': return Video
    case 'youtube': return Monitor
    case 'webinar': return Radio
    case 'live': return Radio
    case 'text': return FileText
    case 'pdf': return FileText
    case 'audio': return Music
    case 'image': return ImageIcon
    case 'link': return Link2
    case 'document': return FileText
    case 'code': return FileCode
    case 'quiz': return Award
    case 'test': return ClipboardList
    case 'subjective': return FileEdit
    case 'omr': return FileText
    case 'folder': return BookOpen
    default: return Play
  }
}

function formatCourseDuration(seconds: number): string {
  if (!seconds) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function CourseSidebar({ 
  course, 
  stats, 
  progress, 
  expandedModules, 
  toggleModule, 
  activeLessonId, 
  setActiveLessonId,
  setActiveModuleId,
  isPurchased
}: {
  course: CourseData
  stats: CourseStats
  progress: Record<string, ProgressEntry>
  expandedModules: Record<string, boolean>
  toggleModule: (moduleId: string) => void
  activeLessonId: string | null
  setActiveLessonId: (id: string) => void
  setActiveModuleId: (id: string) => void
  isPurchased: boolean
}) {
  return (
    <div className="space-y-1">
      {/* Course Progress */}
      <div className="p-4 border-b bg-gradient-to-r from-amber-50 to-white">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Progress</span>
          <span className="text-sm font-bold text-amber-700">{stats.progressPercent}%</span>
        </div>
        <Progress value={stats.progressPercent} className="h-2" />
        <p className="text-xs text-gray-500 mt-1.5">
          {stats.completedLessons} of {stats.totalLessons} lessons completed
        </p>
      </div>

      {/* Modules */}
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="p-2">
          {course.modules.map((mod) => {
            const isExpanded = expandedModules[mod.id]
            const moduleDuration = mod.lessons.reduce((acc, l) => acc + (l.videoDuration || 0), 0)
            const completedInModule = mod.lessons.filter(l => progress[l.id]?.status === 'completed').length

            return (
              <div key={mod.id} className="mb-2 border rounded-lg overflow-hidden bg-white">
                <button
                  className="w-full flex items-center justify-between p-3 bg-gray-50/80 hover:bg-gray-100 transition-colors text-left"
                  onClick={() => toggleModule(mod.id)}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-semibold text-gray-900 text-sm truncate">{mod.title}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span>{completedInModule}/{mod.lessons.length}</span>
                      {moduleDuration > 0 && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span>{formatCourseDuration(moduleDuration)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown className="size-4 text-gray-400 shrink-0" /> : <ChevronRight className="size-4 text-gray-400 shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="bg-white border-t">
                    {mod.lessons.length === 0 ? (
                      <p className="text-xs text-gray-400 p-4 text-center">No lessons in this module</p>
                    ) : (
                      mod.lessons.map((lesson) => {
                        const Icon = getLessonIcon(lesson.type)
                        const isActive = activeLessonId === lesson.id
                        const isCompleted = progress[lesson.id]?.status === 'completed'
                        const isLocked = !isPurchased && !lesson.isFree

                        return (
                          <button
                            key={lesson.id}
                            className={cn(
                              "w-full flex items-start gap-3 p-3 text-left transition-colors border-l-2",
                              isActive ? "bg-amber-50 border-amber-500" : "border-transparent hover:bg-gray-50",
                              isLocked && "opacity-60 cursor-not-allowed"
                            )}
                            onClick={() => {
                              if (isLocked && !isActive) {
                                // Still allow clicking to see the 'Purchase required' screen
                              }
                              setActiveLessonId(lesson.id)
                              setActiveModuleId(mod.id)
                            }}
                          >
                            <div className="mt-0.5 relative shrink-0">
                              {isCompleted ? (
                                <CheckCircle2 className="size-4 text-emerald-500" />
                              ) : isLocked ? (
                                <Lock className="size-4 text-gray-400" />
                              ) : (
                                <Icon className={cn("size-4", isActive ? "text-amber-600" : "text-gray-400")} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-sm font-medium line-clamp-2",
                                isActive ? "text-amber-900" : "text-gray-700"
                              )}>
                                {lesson.title}
                              </p>
                              {lesson.videoDuration > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatCourseDuration(lesson.videoDuration)}
                                </p>
                              )}
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
