export interface OrgData {
  id: string
  name: string
  code: string
  logo: string | null
  accentColor: string
}
export interface CourseData {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  price: number
  mrp: number
  category: string | null
  status: string
}
export interface TestSeriesData {
  id: string
  title: string
  description: string | null
  thumbnail: string | null
  price: number
  mrp: number
  category: string | null
  isCombo: boolean
  status: string
  testCount: number
}
export interface QuickLinkData {
  id: string
  title: string
  url: string
  icon: string | null
  sortOrder: number
}
export interface BannerData {
  id: string
  title: string
  image: string
  link: string | null
  sortOrder: number
}
export interface CategoryData {
  id: string
  name: string
  slug: string
  icon: string | null
}
export interface PortalData {
  organization: OrgData
  courses: CourseData[]
  testSeries: TestSeriesData[]
  quickLinks: QuickLinkData[]
  banners: BannerData[]
  categories: CategoryData[]
}

export type PortalPage = 'home' | 'courses' | 'test-series' | 'docs' | 'quick-links' | 'about'
export type AuthView = 'login' | 'forgot-password' | 'reset-password' | 'reset-success'

export const BLUE = '#2563EB'
export const BLUE_LIGHT = '#2563EB15'
export const BLUE_MEDIUM = '#2563EB30'
export const BLUE_HOVER = '#2563EB20'
export const BLUE_BORDER = '#2563EB40'
