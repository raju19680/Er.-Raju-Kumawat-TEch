import {
  Video,
  Monitor,
  Radio,
  FileText,
  Music,
  Image as ImageIcon,
  Link2,
  FileCode,
  Award,
  ClipboardList,
  FileEdit,
  BookOpen,
  Play
} from 'lucide-react'

export function getLessonIcon(type: string) {
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

export function getLessonTypeLabel(type: string) {
  switch (type) {
    case 'video': return 'Video'
    case 'youtube': return 'YouTube'
    case 'webinar': return 'Webinar'
    case 'live': return 'Live'
    case 'text': return 'Article'
    case 'pdf': return 'PDF'
    case 'audio': return 'Audio'
    case 'image': return 'Image'
    case 'link': return 'Link'
    case 'document': return 'Document'
    case 'code': return 'Code'
    case 'quiz': return 'Quiz'
    case 'test': return 'Test'
    case 'subjective': return 'Subjective'
    case 'omr': return 'OMR Test'
    case 'folder': return 'Folder'
    default: return 'Lesson'
  }
}

export function formatCourseDuration(seconds: number): string {
  if (!seconds) return '0m'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
