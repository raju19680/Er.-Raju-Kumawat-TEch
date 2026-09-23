'use client'

import React, { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Clock, Video, FileText, File, Calendar, Monitor, Radio, Award, ClipboardList, FileEdit, FileCode, Music, Image as ImageIcon, Link2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const TYPE_CONFIG: Record<string, any> = {
  video: { label: 'Video', icon: Video, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' },
  pdf: { label: 'PDF', icon: File, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  text: { label: 'Article', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  link: { label: 'Link', icon: Link2, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950/30' },
  live: { label: 'Live', icon: Radio, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' },
  youtube: { label: 'YouTube', icon: Monitor, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
  webinar: { label: 'Webinar', icon: Radio, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/30' },
  image: { label: 'Image', icon: ImageIcon, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-950/30' },
  audio: { label: 'Audio', icon: Music, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
  quiz: { label: 'Quiz', icon: Award, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  test: { label: 'Test', icon: ClipboardList, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  subjective: { label: 'Subjective', icon: FileEdit, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
  omr: { label: 'OMR', icon: FileText, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/30' },
  code: { label: 'Code', icon: FileCode, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-950/30' },
  document: { label: 'Document', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
}

interface SortableLessonProps {
  lesson: any
  renderActions: (lesson: any) => React.ReactNode
}

function SortableLesson({ lesson, renderActions }: SortableLessonProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const tc = TYPE_CONFIG[lesson.type] || TYPE_CONFIG.text

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 hover:bg-muted/30 group bg-card">
      <div {...attributes} {...listeners} className="cursor-grab hover:text-emerald-600 text-muted-foreground p-1 shrink-0">
        <GripVertical className="w-4 h-4" />
      </div>
      
      <div className={`w-11 h-11 rounded-lg ${tc.bg} flex items-center justify-center shrink-0`}>
        {lesson.videoUrl ? (
          <img src={lesson.videoUrl} alt="" className="w-full h-full object-cover rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : null}
        <tc.icon className={`w-5 h-5 ${tc.color} ${lesson.videoUrl ? 'hidden' : ''}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{lesson.title}</p>
          {lesson.isFree && <Badge className="text-xs bg-cyan-100 text-cyan-700">Free</Badge>}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <Badge variant="outline" className="text-xs">{tc.label}</Badge>
          {lesson.videoDuration > 0 && (
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.floor(lesson.videoDuration / 60)}m {lesson.videoDuration % 60}s</span>
          )}
        </div>
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        {renderActions(lesson)}
      </div>
    </div>
  )
}

interface SortableModuleProps {
  module: any
  renderModuleHeader: (module: any, dragHandle: React.ReactNode) => React.ReactNode
  renderLessonActions: (lesson: any) => React.ReactNode
  onReorderLessons: (moduleId: string, lessons: any[]) => void
}

function SortableModule({ module, renderModuleHeader, renderLessonActions, onReorderLessons }: SortableModuleProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = module.lessons.findIndex((l: any) => l.id === active.id)
      const newIndex = module.lessons.findIndex((l: any) => l.id === over.id)
      const newLessons = arrayMove(module.lessons, oldIndex, newIndex)
      onReorderLessons(module.id, newLessons)
    }
  }

  const dragHandle = (
    <div {...attributes} {...listeners} className="cursor-grab hover:text-emerald-600 text-muted-foreground p-1 shrink-0">
      <GripVertical className="w-5 h-5" />
    </div>
  )

  return (
    <div ref={setNodeRef} style={style} className="overflow-hidden border rounded-lg bg-card shadow-sm mb-4">
      {renderModuleHeader(module, dragHandle)}

      <div className="divide-y border-t bg-background">
        {module.lessons.length === 0 ? (
           <div className="p-4 text-center text-sm text-muted-foreground">No lessons in this module.</div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={module.lessons.map((l: any) => l.id)} strategy={verticalListSortingStrategy}>
              {module.lessons.map((lesson: any) => (
                <SortableLesson key={lesson.id} lesson={lesson} renderActions={renderLessonActions} />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}

interface DraggableCourseBuilderProps {
  modules: any[]
  renderModuleHeader: (module: any, dragHandle: React.ReactNode) => React.ReactNode
  renderLessonActions: (lesson: any) => React.ReactNode
  onReorderModules: (modules: any[]) => void
  onReorderLessons: (moduleId: string, lessons: any[]) => void
}

export function DraggableCourseBuilder({ modules, renderModuleHeader, renderLessonActions, onReorderModules, onReorderLessons }: DraggableCourseBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = modules.findIndex((m: any) => m.id === active.id)
      const newIndex = modules.findIndex((m: any) => m.id === over.id)
      onReorderModules(arrayMove(modules, oldIndex, newIndex))
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-4">
          {modules.map(module => (
            <SortableModule
              key={module.id}
              module={module}
              renderModuleHeader={renderModuleHeader}
              renderLessonActions={renderLessonActions}
              onReorderLessons={onReorderLessons}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
