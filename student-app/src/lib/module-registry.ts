/**
 * Module Registry — Single source of truth for all CMS module definitions,
 * sub-features, dependency rules, display names, and icon mappings.
 *
 * Used by:
 * - Admin Module Access Control UI
 * - CMS Sidebar filtering
 * - CMS Layout page access checks
 * - ModuleDisabled component
 * - API route enforcement
 * - Zustand store
 */

import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  PenTool,
  Link,
  FileText,
  ClipboardList,
  BarChart3,
  Library,
  Upload,
  TrendingUp,
  Megaphone,
  Bell,
  Tag,
  LifeBuoy,
  Settings,
  MessagesSquare,
  Video,
  Youtube,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Send,
  Image,
  UserPlus,
  CreditCard,
  Smartphone,
  HelpCircle,
  MessageSquare,
  User,
  Lock,
  Ban,
  Folder,
  File,
  FilePlus,
  Download,
  Flag,
  BarChart2,
  DollarSign,
  ShoppingCart,
  Users,
  Zap,
  Unlock,
  BookOpen,
  Target,
  Globe,
  Home,
  Trophy,
  LogIn,
  UserPlus as UserRegister,
  KeyRound,
  Receipt,
  Mail,
  Search,
  Map,
  Fingerprint,
  Play,
  WifiOff,
  Bookmark,
  BellRing,
  Inbox,
  Edit,
  MonitorSmartphone,
  Wallet,
  Star,
  Clock,
  type LucideIcon,
} from 'lucide-react'

// ─── Sub-Feature Definition ──────────────────────────────────────────────────
export interface SubFeature {
  key: string           // e.g., 'tests.create'
  label: string         // e.g., 'Create Test'
  description: string   // e.g., 'Create new tests'
  icon: LucideIcon
  /** If this sub-feature depends on another sub-feature being enabled */
  dependsOn?: string    // e.g., 'tests.view' — you can't create without viewing
}

// ─── Module Definition ───────────────────────────────────────────────────────
export interface ModuleDef {
  key: string           // e.g., 'tests'
  label: string         // e.g., 'Tests'
  description: string   // e.g., 'Create, edit and manage tests'
  icon: LucideIcon
  category: string      // e.g., 'Test Portal'
  /** Whether disabling the parent module auto-disables all sub-features */
  cascadingDisable?: boolean
  /** Sub-features within this module */
  subFeatures: SubFeature[]
}

// ─── Category ────────────────────────────────────────────────────────────────
export interface CategoryDef {
  name: string
  label: string
  icon: LucideIcon
  color: string  // Tailwind color name for badges
}

// ─── Preset Definition ───────────────────────────────────────────────────────
export interface ModulePreset {
  id: string
  name: string
  description: string
  icon: LucideIcon
  /** Module keys + optionally sub-feature keys to enable */
  features: string[]
  color: string
}

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════
export const CATEGORIES: CategoryDef[] = [
  { name: 'core',            label: 'Core',              icon: LayoutDashboard, color: 'slate'   },
  { name: 'content',         label: 'Content',           icon: Package,         color: 'violet'  },
  { name: 'test-portal',     label: 'Test Portal',       icon: ClipboardList,   color: 'sky'     },
  { name: 'business',        label: 'Business',          icon: TrendingUp,      color: 'emerald' },
  { name: 'support',         label: 'Support & Settings', icon: LifeBuoy,       color: 'amber'   },
  { name: 'custom',          label: 'Custom',            icon: MessagesSquare,  color: 'rose'    },
  { name: 'student-website', label: 'Student Website',   icon: Globe,           color: 'cyan'    },
  { name: 'mobile-app',      label: 'Mobile App',        icon: Smartphone,      color: 'pink'    },
]

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE DEFINITIONS WITH SUB-FEATURES
// ═══════════════════════════════════════════════════════════════════════════════
export const MODULES: ModuleDef[] = [
  // ── Core ──
  {
    key: 'dashboard',
    label: 'Dashboard',
    description: 'Overview of CMS analytics and quick actions',
    icon: LayoutDashboard,
    category: 'core',
    cascadingDisable: true,
    subFeatures: [
      { key: 'dashboard.view',        label: 'View Dashboard',      description: 'Access the main dashboard',       icon: Eye },
      { key: 'dashboard.analytics',   label: 'Analytics',           description: 'View revenue & enrollment charts', icon: BarChart2 },
      { key: 'dashboard.quick-actions',label: 'Quick Actions',      description: 'Use quick action buttons',        icon: Zap },
    ],
  },

  // ── Content ──
  {
    key: 'courses',
    label: 'Digital Products',
    description: 'Create, edit and manage digital products/courses',
    icon: Package,
    category: 'content',
    cascadingDisable: true,
    subFeatures: [
      { key: 'courses.view',    label: 'View Courses',       description: 'Browse and view course list',    icon: Eye },
      { key: 'courses.create',  label: 'Create Course',      description: 'Add new courses',                icon: Plus,        dependsOn: 'courses.view' },
      { key: 'courses.edit',    label: 'Edit Course',        description: 'Modify existing courses',        icon: Pencil,      dependsOn: 'courses.view' },
      { key: 'courses.delete',  label: 'Delete Course',      description: 'Remove courses',                 icon: Trash2,      dependsOn: 'courses.view' },
      { key: 'courses.publish', label: 'Publish/Unpublish',  description: 'Change course status',           icon: Send,        dependsOn: 'courses.view' },
    ],
  },
  {
    key: 'store',
    label: 'Store',
    description: 'Manage store settings and digital product listings',
    icon: ShoppingBag,
    category: 'content',
    cascadingDisable: true,
    subFeatures: [
      { key: 'store.view',   label: 'View Store',    description: 'Browse store listings',      icon: Eye },
      { key: 'store.manage', label: 'Manage Store',  description: 'Edit store settings',        icon: Pencil, dependsOn: 'store.view' },
    ],
  },
  {
    key: 'blogs',
    label: 'Blogs',
    description: 'Create, edit and publish blog posts',
    icon: PenTool,
    category: 'content',
    cascadingDisable: true,
    subFeatures: [
      { key: 'blogs.view',    label: 'View Blogs',      description: 'Browse blog posts',           icon: Eye },
      { key: 'blogs.create',  label: 'Create Blog',     description: 'Write new blog posts',        icon: Plus,      dependsOn: 'blogs.view' },
      { key: 'blogs.edit',    label: 'Edit Blog',       description: 'Modify existing posts',       icon: Pencil,    dependsOn: 'blogs.view' },
      { key: 'blogs.delete',  label: 'Delete Blog',     description: 'Remove blog posts',           icon: Trash2,    dependsOn: 'blogs.view' },
      { key: 'blogs.publish', label: 'Publish Blog',    description: 'Publish or unpublish posts',  icon: Send,      dependsOn: 'blogs.view' },
    ],
  },
  {
    key: 'quick-links',
    label: 'Quick Links',
    description: 'Manage external quick links for student portal',
    icon: Link,
    category: 'content',
    cascadingDisable: true,
    subFeatures: [
      { key: 'quick-links.view',   label: 'View Links',     description: 'Browse quick links',        icon: Eye },
      { key: 'quick-links.create', label: 'Create Link',    description: 'Add new quick links',       icon: Plus,   dependsOn: 'quick-links.view' },
      { key: 'quick-links.edit',   label: 'Edit Links',     description: 'Modify existing links',     icon: Pencil, dependsOn: 'quick-links.view' },
      { key: 'quick-links.delete', label: 'Delete Links',   description: 'Remove quick links',        icon: Trash2, dependsOn: 'quick-links.view' },
    ],
  },

  // ── Test Portal ──
  {
    key: 'tests',
    label: 'Tests',
    description: 'Create, edit and manage individual tests',
    icon: FileText,
    category: 'test-portal',
    cascadingDisable: true,
    subFeatures: [
      { key: 'tests.view',    label: 'View Tests',      description: 'Browse test list',              icon: Eye },
      { key: 'tests.create',  label: 'Create Test',     description: 'Add new tests',                 icon: Plus,      dependsOn: 'tests.view' },
      { key: 'tests.edit',    label: 'Edit Test',       description: 'Modify existing tests',         icon: Pencil,    dependsOn: 'tests.view' },
      { key: 'tests.delete',  label: 'Delete Test',     description: 'Remove tests',                  icon: Trash2,    dependsOn: 'tests.view' },
      { key: 'tests.publish', label: 'Publish/Go Live', description: 'Change test live status',       icon: Send,      dependsOn: 'tests.view' },
      { key: 'tests.duplicate',label: 'Duplicate Test', description: 'Clone existing tests',          icon: FilePlus,  dependsOn: 'tests.view' },
    ],
  },
  {
    key: 'test-series',
    label: 'Test Series',
    description: 'Manage test series packages and groupings',
    icon: ClipboardList,
    category: 'test-portal',
    cascadingDisable: true,
    subFeatures: [
      { key: 'test-series.view',   label: 'View Series',     description: 'Browse test series',           icon: Eye },
      { key: 'test-series.create', label: 'Create Series',   description: 'Add new test series',          icon: Plus,   dependsOn: 'test-series.view' },
      { key: 'test-series.edit',   label: 'Edit Series',     description: 'Modify existing series',       icon: Pencil, dependsOn: 'test-series.view' },
      { key: 'test-series.delete', label: 'Delete Series',   description: 'Remove test series',           icon: Trash2, dependsOn: 'test-series.view' },
    ],
  },
  {
    key: 'results',
    label: 'Results',
    description: 'View and analyze test results and performance',
    icon: BarChart3,
    category: 'test-portal',
    cascadingDisable: true,
    subFeatures: [
      { key: 'results.view',   label: 'View Results',    description: 'Browse test results',           icon: Eye },
      { key: 'results.export', label: 'Export Results',  description: 'Download results as PDF/Excel',  icon: Download, dependsOn: 'results.view' },
      { key: 'results.analyze',label: 'Analytics',       description: 'View detailed performance analytics', icon: BarChart2, dependsOn: 'results.view' },
    ],
  },
  {
    key: 'question-library',
    label: 'Question Library',
    description: 'Browse and manage reusable question bank',
    icon: Library,
    category: 'test-portal',
    cascadingDisable: true,
    subFeatures: [
      { key: 'question-library.view',   label: 'View Library',      description: 'Browse question bank',          icon: Eye },
      { key: 'question-library.create', label: 'Add Questions',     description: 'Add questions to library',      icon: Plus,   dependsOn: 'question-library.view' },
      { key: 'question-library.edit',   label: 'Edit Questions',    description: 'Modify existing questions',     icon: Pencil, dependsOn: 'question-library.view' },
      { key: 'question-library.delete', label: 'Delete Questions',  description: 'Remove questions from library', icon: Trash2, dependsOn: 'question-library.view' },
    ],
  },
  {
    key: 'bulk-uploader',
    label: 'Bulk Uploader',
    description: 'Upload questions and data in bulk via Excel/CSV',
    icon: Upload,
    category: 'test-portal',
    cascadingDisable: true,
    subFeatures: [
      { key: 'bulk-uploader.view',   label: 'View Uploader',     description: 'Access bulk upload page',       icon: Eye },
      { key: 'bulk-uploader.upload', label: 'Upload Files',      description: 'Upload Excel/CSV files',        icon: Upload, dependsOn: 'bulk-uploader.view' },
      { key: 'bulk-uploader.template',label: 'Download Template', description: 'Download upload templates',    icon: Download, dependsOn: 'bulk-uploader.view' },
    ],
  },

  // ── Business ──
  {
    key: 'reports',
    label: 'Reports',
    description: 'View sales, orders, and user reports',
    icon: TrendingUp,
    category: 'business',
    cascadingDisable: true,
    subFeatures: [
      { key: 'reports.view',         label: 'View Reports',      description: 'Access reports section',         icon: Eye },
      { key: 'reports.sales',        label: 'Sales Reports',     description: 'View revenue and sales data',    icon: DollarSign,    dependsOn: 'reports.view' },
      { key: 'reports.orders',       label: 'Order Reports',     description: 'View order details',             icon: ShoppingCart,  dependsOn: 'reports.view' },
      { key: 'reports.users',        label: 'User Reports',      description: 'View user statistics',           icon: Users,         dependsOn: 'reports.view' },
      { key: 'reports.export',       label: 'Export Data',       description: 'Download reports as files',      icon: Download,      dependsOn: 'reports.view' },
    ],
  },
  {
    key: 'marketing',
    label: 'Marketing',
    description: 'Manage marketing campaigns, graphics and leads',
    icon: Megaphone,
    category: 'business',
    cascadingDisable: true,
    subFeatures: [
      { key: 'marketing.view',       label: 'View Marketing',     description: 'Access marketing section',        icon: Eye },
      { key: 'marketing.graphics',   label: 'Graphics',           description: 'Create and manage graphics',      icon: Image,       dependsOn: 'marketing.view' },
      { key: 'marketing.leads',      label: 'Leads',              description: 'View and manage leads',           icon: UserPlus,    dependsOn: 'marketing.view' },
      { key: 'marketing.payment-pages',label: 'Payment Pages',    description: 'Create payment pages',            icon: CreditCard,  dependsOn: 'marketing.view' },
      { key: 'marketing.whatsapp',   label: 'WhatsApp Campaigns', description: 'Manage WhatsApp campaigns',       icon: Smartphone,  dependsOn: 'marketing.view' },
    ],
  },
  {
    key: 'notifications',
    label: 'Notifications',
    description: 'Send and manage push notifications',
    icon: Bell,
    category: 'business',
    cascadingDisable: true,
    subFeatures: [
      { key: 'notifications.view',   label: 'View Notifications', description: 'Browse notifications',          icon: Eye },
      { key: 'notifications.create', label: 'Send Notification',  description: 'Create and send notifications',  icon: Send,   dependsOn: 'notifications.view' },
      { key: 'notifications.delete', label: 'Delete Notifications',description: 'Remove notifications',          icon: Trash2, dependsOn: 'notifications.view' },
    ],
  },
  {
    key: 'coupons',
    label: 'Coupons',
    description: 'Create and manage discount coupons',
    icon: Tag,
    category: 'business',
    cascadingDisable: true,
    subFeatures: [
      { key: 'coupons.view',   label: 'View Coupons',     description: 'Browse coupons',                icon: Eye },
      { key: 'coupons.create', label: 'Create Coupon',    description: 'Add new discount coupons',      icon: Plus,   dependsOn: 'coupons.view' },
      { key: 'coupons.edit',   label: 'Edit Coupon',      description: 'Modify existing coupons',       icon: Pencil, dependsOn: 'coupons.view' },
      { key: 'coupons.delete', label: 'Delete Coupon',    description: 'Remove coupons',                icon: Trash2, dependsOn: 'coupons.view' },
    ],
  },

  // ── Support & Settings ──
  {
    key: 'support',
    label: 'Support',
    description: 'Handle student support queries and chat',
    icon: LifeBuoy,
    category: 'support',
    cascadingDisable: true,
    subFeatures: [
      { key: 'support.view',    label: 'View Support',      description: 'Access support section',         icon: Eye },
      { key: 'support.queries', label: 'Handle Queries',    description: 'Respond to support queries',     icon: HelpCircle,   dependsOn: 'support.view' },
      { key: 'support.chat',    label: 'Live Chat',         description: 'Access live chat feature',       icon: MessageSquare,dependsOn: 'support.view' },
      { key: 'support.resolve', label: 'Resolve Tickets',   description: 'Close/resolve support tickets',  icon: Flag,         dependsOn: 'support.view' },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    description: 'Manage profile, security, categories and blocked users',
    icon: Settings,
    category: 'support',
    cascadingDisable: true,
    subFeatures: [
      { key: 'settings.view',       label: 'View Settings',     description: 'Access settings section',       icon: Eye },
      { key: 'settings.profile',    label: 'Edit Profile',      description: 'Modify profile information',    icon: User,    dependsOn: 'settings.view' },
      { key: 'settings.security',   label: 'Security',          description: 'Change password and security',  icon: Lock,    dependsOn: 'settings.view' },
      { key: 'settings.categories', label: 'Manage Categories', description: 'Create/edit categories',        icon: Folder,  dependsOn: 'settings.view' },
      { key: 'settings.blocked',    label: 'Blocked Users',     description: 'Manage blocked users list',     icon: Ban,     dependsOn: 'settings.view' },
    ],
  },

  // ── Custom ──
  {
    key: 'chat-manager',
    label: 'Chat Manager',
    description: 'Manage chat widgets and conversations',
    icon: MessagesSquare,
    category: 'custom',
    cascadingDisable: true,
    subFeatures: [
      { key: 'chat-manager.view',   label: 'View Chat Manager', description: 'Access chat manager',          icon: Eye },
      { key: 'chat-manager.config', label: 'Configure Chat',    description: 'Set up chat widgets',          icon: Settings, dependsOn: 'chat-manager.view' },
      { key: 'chat-manager.respond',label: 'Respond to Chats',  description: 'Reply to chat messages',       icon: Send,     dependsOn: 'chat-manager.view' },
    ],
  },

  // ── Student Website ──
  {
    key: 'sw-home',
    label: 'Home Page',
    description: 'Control what appears on student website home',
    icon: Home,
    category: 'student-website',
    cascadingDisable: true,
    subFeatures: [
      { key: 'sw-home.hero',         label: 'Hero Banner',       description: 'Hero section with banner',       icon: Image },
      { key: 'sw-home.features',     label: 'Feature Highlights', description: 'Feature highlights section',     icon: Star },
      { key: 'sw-home.testimonials', label: 'Testimonials',       description: 'Student testimonials section',   icon: MessageSquare },
      { key: 'sw-home.stats',        label: 'Stats Counter',      description: 'Statistics counter section',      icon: BarChart2 },
    ],
  },
  {
    key: 'sw-courses',
    label: 'Course Listing',
    description: 'Control course display on website',
    icon: BookOpen,
    category: 'student-website',
    cascadingDisable: true,
    subFeatures: [
      { key: 'sw-courses.list',     label: 'Course List View',   description: 'Course listing page',            icon: Eye },
      { key: 'sw-courses.detail',   label: 'Course Detail Page', description: 'Individual course detail page',   icon: File },
      { key: 'sw-courses.purchase', label: 'Purchase/Enroll',    description: 'Course purchase and enrollment', icon: ShoppingCart },
      { key: 'sw-courses.preview',  label: 'Free Preview Lessons',description: 'Free lesson previews',         icon: Play },
    ],
  },
  {
    key: 'sw-tests',
    label: 'Test Series',
    description: 'Control test series on website',
    icon: ClipboardList,
    category: 'student-website',
    cascadingDisable: true,
    subFeatures: [
      { key: 'sw-tests.list',        label: 'Test Series Listing', description: 'Test series listing page',     icon: Eye },
      { key: 'sw-tests.detail',      label: 'Series Detail Page',  description: 'Test series detail page',      icon: File },
      { key: 'sw-tests.attempt',     label: 'Take Test',           description: 'Attempt a test',               icon: Pencil },
      { key: 'sw-tests.results',     label: 'View Results',        description: 'View test results',            icon: BarChart2 },
      { key: 'sw-tests.leaderboard', label: 'Leaderboard',         description: 'Test leaderboard rankings',    icon: Trophy },
    ],
  },
  {
    key: 'sw-blog',
    label: 'Blog',
    description: 'Blog on student website',
    icon: PenTool,
    category: 'student-website',
    cascadingDisable: true,
    subFeatures: [
      { key: 'sw-blog.list',   label: 'Blog Listing',    description: 'Blog listing page',       icon: Eye },
      { key: 'sw-blog.detail', label: 'Blog Detail Page', description: 'Individual blog page',     icon: File },
    ],
  },
  {
    key: 'sw-auth',
    label: 'Student Auth',
    description: 'Student login/registration',
    icon: LogIn,
    category: 'student-website',
    cascadingDisable: true,
    subFeatures: [
      { key: 'sw-auth.login',           label: 'Student Login',       description: 'Student login page',           icon: LogIn },
      { key: 'sw-auth.register',        label: 'Student Registration', description: 'Student registration page',    icon: UserRegister },
      { key: 'sw-auth.social',          label: 'Social Login - Google/Apple', description: 'Social login options', icon: Smartphone },
      { key: 'sw-auth.forgot-password', label: 'Forgot Password',      description: 'Password reset flow',          icon: KeyRound },
    ],
  },
  {
    key: 'sw-payment',
    label: 'Payment',
    description: 'Payment on website',
    icon: CreditCard,
    category: 'student-website',
    cascadingDisable: true,
    subFeatures: [
      { key: 'sw-payment.razorpay', label: 'Razorpay Integration', description: 'Razorpay payment gateway', icon: CreditCard },
      { key: 'sw-payment.upi',      label: 'UPI Payment',         description: 'UPI payment option',       icon: Wallet },
      { key: 'sw-payment.coupon',   label: 'Coupon Code',         description: 'Coupon code support',      icon: Tag },
      { key: 'sw-payment.receipt',  label: 'Payment Receipt',     description: 'Payment receipt generation', icon: Receipt },
    ],
  },
  {
    key: 'sw-about',
    label: 'About Page',
    description: 'Institute about page',
    icon: Globe,
    category: 'student-website',
    cascadingDisable: true,
    subFeatures: [
      { key: 'sw-about.page',   label: 'About Page',   description: 'About page content',      icon: Eye },
      { key: 'sw-about.team',   label: 'Team Section',  description: 'Team members section',    icon: Users },
      { key: 'sw-about.contact',label: 'Contact Form',  description: 'Contact form section',    icon: Mail },
    ],
  },
  {
    key: 'sw-seo',
    label: 'SEO & Meta',
    description: 'SEO controls',
    icon: Search,
    category: 'student-website',
    cascadingDisable: true,
    subFeatures: [
      { key: 'sw-seo.meta',    label: 'Custom Meta Tags',  description: 'Custom meta tag management',   icon: Settings },
      { key: 'sw-seo.og',      label: 'Open Graph Tags',   description: 'Open Graph tag management',    icon: Globe },
      { key: 'sw-seo.sitemap', label: 'Sitemap Generation', description: 'Auto sitemap generation',      icon: Map },
    ],
  },

  // ── Mobile App ──
  {
    key: 'app-auth',
    label: 'App Auth',
    description: 'Mobile app authentication',
    icon: Smartphone,
    category: 'mobile-app',
    cascadingDisable: true,
    subFeatures: [
      { key: 'app-auth.login',     label: 'App Login',        description: 'Mobile app login',           icon: LogIn },
      { key: 'app-auth.biometric', label: 'Biometric/Face ID', description: 'Biometric authentication',   icon: Fingerprint },
      { key: 'app-auth.otp',       label: 'OTP Login',        description: 'OTP-based login',            icon: KeyRound },
    ],
  },
  {
    key: 'app-courses',
    label: 'App Courses',
    description: 'Course viewing in app',
    icon: BookOpen,
    category: 'mobile-app',
    cascadingDisable: true,
    subFeatures: [
      { key: 'app-courses.browse',   label: 'Browse Courses',    description: 'Browse course catalog',      icon: Eye },
      { key: 'app-courses.player',   label: 'Video/Content Player', description: 'Video player',            icon: Play },
      { key: 'app-courses.download', label: 'Offline Download',   description: 'Download for offline',       icon: Download },
      { key: 'app-courses.bookmark', label: 'Bookmark Lessons',   description: 'Bookmark favorite lessons',  icon: Bookmark },
    ],
  },
  {
    key: 'app-tests',
    label: 'App Tests',
    description: 'Test taking in app',
    icon: FileText,
    category: 'mobile-app',
    cascadingDisable: true,
    subFeatures: [
      { key: 'app-tests.browse',  label: 'Browse Tests',   description: 'Browse available tests',    icon: Eye },
      { key: 'app-tests.take',    label: 'Take Test',      description: 'Take a test',              icon: Pencil },
      { key: 'app-tests.offline', label: 'Offline Test',    description: 'Take tests offline',       icon: WifiOff },
      { key: 'app-tests.results', label: 'Results',         description: 'View test results',        icon: BarChart2 },
      { key: 'app-tests.history', label: 'Test History',    description: 'Past test attempts',       icon: Clock },
    ],
  },
  {
    key: 'app-notifications',
    label: 'App Notifications',
    description: 'Push notifications',
    icon: Bell,
    category: 'mobile-app',
    cascadingDisable: true,
    subFeatures: [
      { key: 'app-notifications.push',   label: 'Push Notifications', description: 'Push notification management',  icon: BellRing },
      { key: 'app-notifications.in-app', label: 'In-App Messages',     description: 'In-app message system',         icon: Inbox },
      { key: 'app-notifications.email',  label: 'Email Notifications', description: 'Email notification settings',   icon: Mail },
    ],
  },
  {
    key: 'app-profile',
    label: 'App Profile',
    description: 'Student profile in app',
    icon: User,
    category: 'mobile-app',
    cascadingDisable: true,
    subFeatures: [
      { key: 'app-profile.view',   label: 'View Profile',    description: 'View student profile',    icon: Eye },
      { key: 'app-profile.edit',   label: 'Edit Profile',    description: 'Edit profile details',     icon: Edit },
      { key: 'app-profile.devices',label: 'Device Management', description: 'Manage logged-in devices', icon: MonitorSmartphone },
    ],
  },
  {
    key: 'app-payment',
    label: 'App Payment',
    description: 'In-app payments',
    icon: CreditCard,
    category: 'mobile-app',
    cascadingDisable: true,
    subFeatures: [
      { key: 'app-payment.razorpay', label: 'Razorpay SDK',    description: 'Razorpay in-app SDK',      icon: CreditCard },
      { key: 'app-payment.upi',      label: 'UPI Integration', description: 'UPI payment in app',        icon: Wallet },
      { key: 'app-payment.history',  label: 'Payment History', description: 'View payment history',      icon: Receipt },
    ],
  },
  {
    key: 'meetings',
    label: 'Meetings',
    description: 'Schedule and manage online meetings',
    icon: Video,
    category: 'custom',
    cascadingDisable: true,
    subFeatures: [
      { key: 'meetings.view',   label: 'View Meetings',   description: 'Browse scheduled meetings',     icon: Eye },
      { key: 'meetings.create', label: 'Schedule Meeting',description: 'Create new meetings',           icon: Plus,   dependsOn: 'meetings.view' },
      { key: 'meetings.manage', label: 'Manage Meetings', description: 'Edit/cancel meetings',          icon: Pencil, dependsOn: 'meetings.view' },
    ],
  },
  {
    key: 'youtube-courses',
    label: 'YouTube Courses',
    description: 'Manage YouTube-integrated course content',
    icon: Youtube,
    category: 'custom',
    cascadingDisable: true,
    subFeatures: [
      { key: 'youtube-courses.view',   label: 'View YT Courses',  description: 'Browse YouTube courses',        icon: Eye },
      { key: 'youtube-courses.create', label: 'Add YT Course',    description: 'Link new YouTube courses',      icon: Plus,   dependsOn: 'youtube-courses.view' },
      { key: 'youtube-courses.edit',   label: 'Edit YT Course',   description: 'Modify YouTube course links',   icon: Pencil, dependsOn: 'youtube-courses.view' },
    ],
  },
]

// ═══════════════════════════════════════════════════════════════════════════════
// DERIVED DATA
// ═══════════════════════════════════════════════════════════════════════════════

/** All top-level module keys */
export const ALL_MODULE_KEYS = MODULES.map(m => m.key)

/** All sub-feature keys (e.g., 'tests.create', 'courses.view') */
export const ALL_SUB_FEATURE_KEYS = MODULES.flatMap(m => m.subFeatures.map(sf => sf.key))

/** All keys (module + sub-feature) — the full access map */
export const ALL_ACCESS_KEYS = [...ALL_MODULE_KEYS, ...ALL_SUB_FEATURE_KEYS]

/** Get a module definition by key */
export function getModuleDef(key: string): ModuleDef | undefined {
  return MODULES.find(m => m.key === key)
}

/** Get a sub-feature definition by its full key */
export function getSubFeatureDef(fullKey: string): { module: ModuleDef; subFeature: SubFeature } | undefined {
  const [moduleKey] = fullKey.split('.')
  const mod = MODULES.find(m => m.key === moduleKey)
  if (!mod) return undefined
  const sf = mod.subFeatures.find(s => s.key === fullKey)
  if (!sf) return undefined
  return { module: mod, subFeature: sf }
}

/** Friendly display name for any access key (module or sub-feature) */
export function getAccessKeyLabel(key: string): string {
  const mod = getModuleDef(key)
  if (mod) return mod.label
  const sf = getSubFeatureDef(key)
  if (sf) return sf.subFeature.label
  return key
}

/** Get all sub-features for a module key */
export function getModuleSubFeatures(moduleKey: string): SubFeature[] {
  return getModuleDef(moduleKey)?.subFeatures || []
}

/** Modules grouped by category */
export const MODULES_BY_CATEGORY = CATEGORIES.map(cat => ({
  ...cat,
  modules: MODULES.filter(m => m.category === cat.name),
}))

/** Build a full access map with all keys set to a given value */
export function buildFullAccessMap(enabled: boolean): Record<string, boolean> {
  const result: Record<string, boolean> = {}
  for (const key of ALL_ACCESS_KEYS) {
    result[key] = enabled
  }
  return result
}

/** Build an access map where only top-level module keys are set */
export function buildModuleOnlyMap(enabled: boolean): Record<string, boolean> {
  const result: Record<string, boolean> = {}
  for (const key of ALL_MODULE_KEYS) {
    result[key] = enabled
  }
  return result
}

/** Count enabled sub-features for a given module */
export function countEnabledSubFeatures(
  moduleKey: string,
  accessMap: Record<string, boolean>
): { enabled: number; total: number } {
  const mod = getModuleDef(moduleKey)
  if (!mod) return { enabled: 0, total: 0 }
  const total = mod.subFeatures.length
  const enabled = mod.subFeatures.filter(sf => accessMap[sf.key] !== false).length
  return { enabled, total }
}

/** Resolve dependency — when enabling a sub-feature, auto-enable its dependency */
export function resolveDependencies(
  key: string,
  enabled: boolean,
  currentMap: Record<string, boolean>
): Record<string, boolean> {
  const updated = { ...currentMap }
  updated[key] = enabled

  if (enabled) {
    // Auto-enable dependencies
    const sf = getSubFeatureDef(key)
    if (sf?.subFeature.dependsOn) {
      const depKey = sf.subFeature.dependsOn
      if (updated[depKey] === false) {
        updated[depKey] = true
        // Recursively resolve
        return resolveDependencies(depKey, true, updated)
      }
    }
  } else {
    // Auto-disable dependents
    const [moduleKey] = key.split('.')
    const mod = getModuleDef(moduleKey)
    if (mod) {
      for (const sf of mod.subFeatures) {
        if (sf.dependsOn === key && updated[sf.key] !== false) {
          updated[sf.key] = false
          // Recursively resolve
          const deeper = resolveDependencies(sf.key, false, updated)
          Object.assign(updated, deeper)
        }
      }
    }
  }

  return updated
}

/** When a parent module is toggled, cascade enable/disable all sub-features */
export function cascadeModuleToggle(
  moduleKey: string,
  enabled: boolean,
  currentMap: Record<string, boolean>
): Record<string, boolean> {
  const updated = { ...currentMap }
  updated[moduleKey] = enabled

  const mod = getModuleDef(moduleKey)
  if (mod && mod.cascadingDisable) {
    for (const sf of mod.subFeatures) {
      updated[sf.key] = enabled
    }
  }

  return updated
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRESETS (updated with sub-feature granularity)
// ═══════════════════════════════════════════════════════════════════════════════
export const PRESETS: ModulePreset[] = [
  {
    id: 'full-access',
    name: 'Full Access',
    description: 'Enable everything — all modules and all sub-features',
    icon: Unlock,
    features: ALL_ACCESS_KEYS,
    color: 'emerald',
  },
  {
    id: 'no-access',
    name: 'No Access',
    description: 'Disable all modules and features',
    icon: Lock,
    features: [],
    color: 'red',
  },
  {
    id: 'essential',
    name: 'Essential Only',
    description: 'Dashboard, basic Courses & Tests view, Support, Settings',
    icon: Zap,
    features: [
      'dashboard', 'dashboard.view', 'dashboard.analytics', 'dashboard.quick-actions',
      'courses', 'courses.view',
      'tests', 'tests.view',
      'support', 'support.view', 'support.queries',
      'settings', 'settings.view', 'settings.profile', 'settings.security',
    ],
    color: 'amber',
  },
  {
    id: 'content-creator',
    name: 'Content Creator',
    description: 'Full content management — courses, blogs, quick links',
    icon: BookOpen,
    features: [
      'dashboard', 'dashboard.view', 'dashboard.analytics', 'dashboard.quick-actions',
      'courses', 'courses.view', 'courses.create', 'courses.edit', 'courses.publish',
      'store', 'store.view', 'store.manage',
      'blogs', 'blogs.view', 'blogs.create', 'blogs.edit', 'blogs.publish',
      'quick-links', 'quick-links.view', 'quick-links.create', 'quick-links.edit',
      'settings', 'settings.view', 'settings.profile',
    ],
    color: 'violet',
  },
  {
    id: 'test-focused',
    name: 'Test Focused',
    description: 'Complete test management — create, edit, results, bulk upload',
    icon: Target,
    features: [
      'dashboard', 'dashboard.view', 'dashboard.analytics',
      'tests', 'tests.view', 'tests.create', 'tests.edit', 'tests.publish', 'tests.duplicate',
      'test-series', 'test-series.view', 'test-series.create', 'test-series.edit',
      'results', 'results.view', 'results.export', 'results.analyze',
      'question-library', 'question-library.view', 'question-library.create', 'question-library.edit',
      'bulk-uploader', 'bulk-uploader.view', 'bulk-uploader.upload', 'bulk-uploader.template',
      'settings', 'settings.view', 'settings.profile', 'settings.security',
    ],
    color: 'sky',
  },
  {
    id: 'marketing-pro',
    name: 'Marketing Pro',
    description: 'Marketing, notifications, coupons, and leads management',
    icon: Megaphone,
    features: [
      'dashboard', 'dashboard.view', 'dashboard.analytics', 'dashboard.quick-actions',
      'courses', 'courses.view', 'courses.publish',
      'marketing', 'marketing.view', 'marketing.graphics', 'marketing.leads', 'marketing.payment-pages', 'marketing.whatsapp',
      'notifications', 'notifications.view', 'notifications.create',
      'coupons', 'coupons.view', 'coupons.create', 'coupons.edit',
      'support', 'support.view',
      'settings', 'settings.view', 'settings.profile',
    ],
    color: 'rose',
  },
  {
    id: 'read-only',
    name: 'Read Only',
    description: 'Can only view data — no create, edit, or delete',
    icon: Eye,
    features: [
      'dashboard', 'dashboard.view', 'dashboard.analytics',
      'courses', 'courses.view',
      'tests', 'tests.view',
      'test-series', 'test-series.view',
      'results', 'results.view',
      'question-library', 'question-library.view',
      'reports', 'reports.view', 'reports.sales', 'reports.orders', 'reports.users',
      'blogs', 'blogs.view',
      'support', 'support.view',
      'settings', 'settings.view', 'settings.profile',
    ],
    color: 'slate',
  },
  {
    id: 'support-agent',
    name: 'Support Agent',
    description: 'Only support and basic dashboard access',
    icon: LifeBuoy,
    features: [
      'dashboard', 'dashboard.view',
      'support', 'support.view', 'support.queries', 'support.chat', 'support.resolve',
      'settings', 'settings.view', 'settings.profile', 'settings.security',
    ],
    color: 'teal',
  },
  {
    id: 'website-basic',
    name: 'Website Basic',
    description: 'Basic student website — Home, Courses view, Auth, Payment',
    icon: Globe,
    features: [
      'sw-home', 'sw-home.hero', 'sw-home.features', 'sw-home.testimonials', 'sw-home.stats',
      'sw-courses', 'sw-courses.list', 'sw-courses.detail', 'sw-courses.purchase',
      'sw-auth', 'sw-auth.login', 'sw-auth.register',
      'sw-payment', 'sw-payment.razorpay',
      'sw-about', 'sw-about.page',
      'sw-seo', 'sw-seo.meta',
    ],
    color: 'cyan',
  },
  {
    id: 'website-full',
    name: 'Website Full',
    description: 'Complete student website with all features',
    icon: Globe,
    features: [
      'sw-home', 'sw-home.hero', 'sw-home.features', 'sw-home.testimonials', 'sw-home.stats',
      'sw-courses', 'sw-courses.list', 'sw-courses.detail', 'sw-courses.purchase', 'sw-courses.preview',
      'sw-tests', 'sw-tests.list', 'sw-tests.detail', 'sw-tests.attempt', 'sw-tests.results', 'sw-tests.leaderboard',
      'sw-blog', 'sw-blog.list', 'sw-blog.detail',
      'sw-auth', 'sw-auth.login', 'sw-auth.register', 'sw-auth.social', 'sw-auth.forgot-password',
      'sw-payment', 'sw-payment.razorpay', 'sw-payment.upi', 'sw-payment.coupon', 'sw-payment.receipt',
      'sw-about', 'sw-about.page', 'sw-about.team', 'sw-about.contact',
      'sw-seo', 'sw-seo.meta', 'sw-seo.og', 'sw-seo.sitemap',
    ],
    color: 'cyan',
  },
  {
    id: 'app-basic',
    name: 'App Basic',
    description: 'Basic mobile app — Login, Browse, Take Test',
    icon: Smartphone,
    features: [
      'app-auth', 'app-auth.login', 'app-auth.otp',
      'app-courses', 'app-courses.browse',
      'app-tests', 'app-tests.browse', 'app-tests.take', 'app-tests.results',
      'app-profile', 'app-profile.view',
    ],
    color: 'pink',
  },
  {
    id: 'app-full',
    name: 'App Full',
    description: 'Full-featured mobile app with offline & push',
    icon: Smartphone,
    features: [
      'app-auth', 'app-auth.login', 'app-auth.biometric', 'app-auth.otp',
      'app-courses', 'app-courses.browse', 'app-courses.player', 'app-courses.download', 'app-courses.bookmark',
      'app-tests', 'app-tests.browse', 'app-tests.take', 'app-tests.offline', 'app-tests.results', 'app-tests.history',
      'app-notifications', 'app-notifications.push', 'app-notifications.in-app', 'app-notifications.email',
      'app-profile', 'app-profile.view', 'app-profile.edit', 'app-profile.devices',
      'app-payment', 'app-payment.razorpay', 'app-payment.upi', 'app-payment.history',
    ],
    color: 'pink',
  },
  {
    id: 'digital-complete',
    name: 'Digital Complete',
    description: 'Everything — CMS + Website + App — all features',
    icon: Zap,
    features: ALL_ACCESS_KEYS,
    color: 'emerald',
  },
]

// ─── CMS Page → Module Key mapping ───────────────────────────────────────────
export const CMS_PAGE_TO_MODULE: Record<string, string> = {
  'dashboard': '__always__',
  'courses': 'courses',
  'test-series': 'test-series',
  'tests': 'tests',
  'students': 'students',
  'digital-products': 'courses',
  'store': 'store',
  'blogs': 'blogs',
  'quick-links': 'quick-links',
  'results': 'results',
  'bulk-uploader': 'bulk-uploader',
  'reported-questions': 'tests',
  'question-library': 'question-library',
  'reports-sales': 'reports',
  'reports-orders': 'reports',
  'reports-users': 'reports',
  'graphics': 'marketing',
  'notifications': 'notifications',
  'leads': 'marketing',
  'coupons': 'coupons',
  'payment-pages': 'marketing',
  'whatsapp-sales': 'marketing',
  'whatsapp-campaigns': 'marketing',
  'support-queries': 'support',
  'support-chat': 'support',
  'settings-profile': '__always__',
  'settings-security': '__always__',
  'settings-blocked': '__always__',
  'settings-categories': '__always__',
  'chat-manager': 'chat-manager',
  'meetings': 'meetings',
  'youtube-courses': 'youtube-courses',
  'documents': 'courses',
}

// ─── CMS Page → Sub-feature key mapping (for granular checks) ────────────────
export const CMS_PAGE_TO_SUB_FEATURE: Record<string, string> = {
  'digital-products': 'courses.view',
  'store': 'store.view',
  'blogs': 'blogs.view',
  'quick-links': 'quick-links.view',
  'tests': 'tests.view',
  'results': 'results.view',
  'bulk-uploader': 'bulk-uploader.view',
  'reported-questions': 'tests.view',
  'question-library': 'question-library.view',
  'reports-sales': 'reports.sales',
  'reports-orders': 'reports.orders',
  'reports-users': 'reports.users',
  'graphics': 'marketing.graphics',
  'notifications': 'notifications.view',
  'leads': 'marketing.leads',
  'coupons': 'coupons.view',
  'payment-pages': 'marketing.payment-pages',
  'whatsapp-sales': 'marketing.whatsapp',
  'whatsapp-campaigns': 'marketing.whatsapp',
  'support-queries': 'support.queries',
  'support-chat': 'support.chat',
  'settings-profile': 'settings.profile',
  'settings-security': 'settings.security',
  'settings-blocked': 'settings.blocked',
  'settings-categories': 'settings.categories',
  'chat-manager': 'chat-manager.view',
  'meetings': 'meetings.view',
  'youtube-courses': 'youtube-courses.view',
  'documents': 'courses.view',
  // Student Website sub-features
  'sw-home': 'sw-home.hero',
  'sw-courses': 'sw-courses.list',
  'sw-tests': 'sw-tests.list',
  'sw-blog': 'sw-blog.list',
  'sw-auth': 'sw-auth.login',
  'sw-payment': 'sw-payment.razorpay',
  'sw-about': 'sw-about.page',
  'sw-seo': 'sw-seo.meta',
  // Mobile App sub-features
  'app-auth': 'app-auth.login',
  'app-courses': 'app-courses.browse',
  'app-tests': 'app-tests.browse',
  'app-notifications': 'app-notifications.push',
  'app-profile': 'app-profile.view',
  'app-payment': 'app-payment.razorpay',
}

// ─── Preset color helper ─────────────────────────────────────────────────────
export function getPresetColorClasses(color: string) {
  switch (color) {
    case 'emerald': return { bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' }
    case 'red':     return { bg: 'bg-red-50 hover:bg-red-100 border-red-200',             icon: 'text-red-600',     badge: 'bg-red-100 text-red-700' }
    case 'amber':   return { bg: 'bg-amber-50 hover:bg-amber-100 border-amber-200',       icon: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700' }
    case 'violet':  return { bg: 'bg-violet-50 hover:bg-violet-100 border-violet-200',    icon: 'text-violet-600',  badge: 'bg-violet-100 text-violet-700' }
    case 'sky':     return { bg: 'bg-sky-50 hover:bg-sky-100 border-sky-200',             icon: 'text-sky-600',     badge: 'bg-sky-100 text-sky-700' }
    case 'rose':    return { bg: 'bg-rose-50 hover:bg-rose-100 border-rose-200',           icon: 'text-rose-600',    badge: 'bg-rose-100 text-rose-700' }
    case 'slate':   return { bg: 'bg-slate-50 hover:bg-slate-100 border-slate-200',       icon: 'text-slate-600',   badge: 'bg-slate-100 text-slate-700' }
    case 'teal':    return { bg: 'bg-teal-50 hover:bg-teal-100 border-teal-200',          icon: 'text-teal-600',    badge: 'bg-teal-100 text-teal-700' }
    case 'cyan':    return { bg: 'bg-cyan-50 hover:bg-cyan-100 border-cyan-200',          icon: 'text-cyan-600',    badge: 'bg-cyan-100 text-cyan-700' }
    case 'pink':    return { bg: 'bg-pink-50 hover:bg-pink-100 border-pink-200',          icon: 'text-pink-600',    badge: 'bg-pink-100 text-pink-700' }
    default:        return { bg: 'bg-gray-50 hover:bg-gray-100 border-gray-200',          icon: 'text-gray-600',    badge: 'bg-gray-100 text-gray-700' }
  }
}

// Category color helper
export function getCategoryColor(name: string): { bg: string; text: string; badge: string } {
  switch (name) {
    case 'core':        return { bg: 'bg-slate-100', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700' }
    case 'content':     return { bg: 'bg-violet-100', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' }
    case 'test-portal': return { bg: 'bg-sky-100', text: 'text-sky-700', badge: 'bg-sky-100 text-sky-700' }
    case 'business':    return { bg: 'bg-emerald-100', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' }
    case 'support':     return { bg: 'bg-amber-100', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' }
    case 'custom':          return { bg: 'bg-rose-100', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' }
    case 'student-website': return { bg: 'bg-cyan-100', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-700' }
    case 'mobile-app':      return { bg: 'bg-pink-100', text: 'text-pink-700', badge: 'bg-pink-100 text-pink-700' }
    default:                return { bg: 'bg-gray-100', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-700' }
  }
}
