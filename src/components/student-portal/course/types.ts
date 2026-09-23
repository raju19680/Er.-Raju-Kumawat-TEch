export interface Lesson {
  id: string
  title: string
  type: string
  content: string | null
  videoUrl: string | null
  videoDuration: number
  fileUrl: string | null
  notes: string | null
  isFree: boolean
  sortOrder: number
  translations?: {
    languageCode: string;
    languageName: string;
    subtitleVttUrl: string | null;
    audioTrackUrl: string | null;
  }[]
}

export interface Module {
  id: string
  title: string
  description: string | null
  sortOrder: number
  lessons: Lesson[]
}

export interface CourseData {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  demoVideo: string | null
  category: string | null
  content: string | null
  language: string
  level: string
  status: string
  price: number
  mrp: number
  featured: boolean
  validityType: string
  validityMonths: number | null
  validityEndDate: string | null
  modules: Module[]
}

export interface CourseStats {
  totalLessons: number
  completedLessons: number
  totalDuration: number
  progressPercent: number
}

export interface ProgressEntry {
  status: string
  completedAt: string | null
}
