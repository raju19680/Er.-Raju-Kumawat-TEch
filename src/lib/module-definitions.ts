// ── Shared Module & Feature Definitions ─────────────────────────────────────
// Used by both the admin module-access API and the teacher module-access API.
// Do NOT duplicate this in route files — always import from here.

export const MODULES = [
  {
    key: 'courses',
    label: 'Courses',
    icon: 'BookOpen',
    description: 'Create and manage online courses with video content',
    color: 'amber',
    features: [
      { key: 'create', label: 'Create Course' },
      { key: 'edit', label: 'Edit Course' },
      { key: 'delete', label: 'Delete Course' },
      { key: 'publish', label: 'Publish/Unpublish' },
      { key: 'pricing', label: 'Set Pricing' },
    ],
  },
  {
    key: 'test-series',
    label: 'Test Series',
    icon: 'FileCheck',
    description: 'Create test series, mock tests, and quizzes',
    color: 'emerald',
    features: [
      { key: 'create', label: 'Create Test Series' },
      { key: 'edit', label: 'Edit Test Series' },
      { key: 'delete', label: 'Delete Test Series' },
      { key: 'publish', label: 'Publish/Unpublish' },
      { key: 'pricing', label: 'Set Pricing' },
      { key: 'test-maker', label: 'Test Maker' },
    ],
  },
  {
    key: 'question-library',
    label: 'Question Library',
    icon: 'LibraryBig',
    description: 'Manage a reusable question bank',
    color: 'violet',
    features: [
      { key: 'add', label: 'Add Questions' },
      { key: 'edit', label: 'Edit Questions' },
      { key: 'delete', label: 'Delete Questions' },
      { key: 'import', label: 'Bulk Import' },
    ],
  },
  {
    key: 'blogs',
    label: 'Blogs',
    icon: 'PenLine',
    description: 'Write and publish blog posts for SEO and engagement',
    color: 'sky',
    features: [
      { key: 'create', label: 'Create Blog' },
      { key: 'edit', label: 'Edit Blog' },
      { key: 'delete', label: 'Delete Blog' },
      { key: 'publish', label: 'Publish/Unpublish' },
    ],
  },
  {
    key: 'digital-products',
    label: 'Digital Products',
    icon: 'Package',
    description: 'Sell digital downloads like PDFs, notes, and files',
    color: 'rose',
    features: [
      { key: 'create', label: 'Create Product' },
      { key: 'edit', label: 'Edit Product' },
      { key: 'delete', label: 'Delete Product' },
      { key: 'pricing', label: 'Set Pricing' },
    ],
  },
  {
    key: 'store',
    label: 'Store',
    icon: 'Store',
    description: 'Manage storefront and product listings',
    color: 'orange',
    features: [
      { key: 'manage', label: 'Manage Store' },
      { key: 'customize', label: 'Customize Store' },
    ],
  },
  {
    key: 'coupons',
    label: 'Coupons',
    icon: 'Ticket',
    description: 'Create and manage discount coupons',
    color: 'pink',
    features: [
      { key: 'create', label: 'Create Coupon' },
      { key: 'edit', label: 'Edit Coupon' },
      { key: 'delete', label: 'Delete Coupon' },
    ],
  },
  {
    key: 'notifications',
    label: 'Notifications',
    icon: 'Bell',
    description: 'Send push notifications to students',
    color: 'teal',
    features: [
      { key: 'send', label: 'Send Notifications' },
      { key: 'schedule', label: 'Schedule Notifications' },
    ],
  },
  {
    key: 'leads',
    label: 'Leads',
    icon: 'Target',
    description: 'Capture and manage student leads',
    color: 'indigo',
    features: [
      { key: 'view', label: 'View Leads' },
      { key: 'export', label: 'Export Leads' },
    ],
  },
  {
    key: 'reports',
    label: 'Reports & Analytics',
    icon: 'BarChart3',
    description: 'View sales, orders, and user analytics',
    color: 'cyan',
    features: [
      { key: 'sales', label: 'Sales Reports' },
      { key: 'orders', label: 'Order Reports' },
      { key: 'users', label: 'User Reports' },
      { key: 'export', label: 'Export Data' },
    ],
  },
  {
    key: 'graphics',
    label: 'Graphics',
    icon: 'Palette',
    description: 'Design graphics and promotional banners',
    color: 'fuchsia',
    features: [
      { key: 'create', label: 'Create Graphics' },
      { key: 'templates', label: 'Use Templates' },
    ],
  },
  {
    key: 'quick-links',
    label: 'Quick Links',
    icon: 'Link',
    description: 'Manage quick navigation links for students',
    color: 'lime',
    features: [
      { key: 'create', label: 'Create Links' },
      { key: 'edit', label: 'Edit Links' },
      { key: 'delete', label: 'Delete Links' },
    ],
  },
  {
    key: 'support',
    label: 'Support',
    icon: 'Headphones',
    description: 'Manage student support queries and chat',
    color: 'yellow',
    features: [
      { key: 'view', label: 'View Queries' },
      { key: 'respond', label: 'Respond to Queries' },
      { key: 'chat', label: 'Live Chat' },
    ],
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp Marketing',
    icon: 'MessageCircle',
    description: 'WhatsApp sales and campaign management',
    color: 'green',
    features: [
      { key: 'sales', label: 'WhatsApp Sales' },
      { key: 'campaigns', label: 'Campaigns' },
    ],
  },
  {
    key: 'youtube-courses',
    label: 'YouTube Courses',
    icon: 'Youtube',
    description: 'Import and manage YouTube-based courses',
    color: 'red',
    features: [
      { key: 'import', label: 'Import Videos' },
      { key: 'manage', label: 'Manage Courses' },
    ],
  },
  {
    key: 'documents',
    label: 'Documents',
    icon: 'FileText',
    description: 'Upload and share documents with students',
    color: 'slate',
    features: [
      { key: 'upload', label: 'Upload Documents' },
      { key: 'manage', label: 'Manage Documents' },
    ],
  },
  {
    key: 'bulk-uploader',
    label: 'Bulk Uploader',
    icon: 'Upload',
    description: 'Bulk upload questions and content via Excel/CSV',
    color: 'purple',
    features: [
      { key: 'upload', label: 'Upload Files' },
      { key: 'validate', label: 'Validate Data' },
    ],
  },
  {
    key: 'chat-manager',
    label: 'Chat Manager',
    icon: 'MessagesSquare',
    description: 'Manage chat rooms and student interactions',
    color: 'blue',
    features: [
      { key: 'create', label: 'Create Chat Rooms' },
      { key: 'moderate', label: 'Moderate Chats' },
    ],
  },
  {
    key: 'meetings',
    label: 'Meetings',
    icon: 'Video',
    description: 'Schedule and manage live meetings/classes',
    color: 'emerald',
    features: [
      { key: 'schedule', label: 'Schedule Meetings' },
      { key: 'manage', label: 'Manage Meetings' },
    ],
  },
] as const

export type ModuleDefinition = (typeof MODULES)[number]

// ── CMS Sidebar Page → Module Key Mapping ───────────────────────────────────
// Used by the teacher CMS sidebar to determine which pages are visible
// based on the teacher's module access configuration.
// Pages mapped to '__always__' are always visible regardless of module access.

export const CMS_PAGE_TO_MODULE: Record<string, string> = {
  'dashboard': '__always__',           // Always visible
  'digital-products': 'digital-products',
  'store': 'store',
  'blogs': 'blogs',
  'quick-links': 'quick-links',
  'tests': 'test-series',
  'results': 'test-series',
  'bulk-uploader': 'bulk-uploader',
  'reported-questions': 'test-series',
  'question-library': 'question-library',
  'reports-sales': 'reports',
  'reports-orders': 'reports',
  'reports-users': 'reports',
  'graphics': 'graphics',
  'notifications': 'notifications',
  'leads': 'leads',
  'coupons': 'coupons',
  'payment-pages': 'store',
  'whatsapp-sales': 'whatsapp',
  'whatsapp-campaigns': 'whatsapp',
  'support-queries': 'support',
  'support-chat': 'support',
  'settings-profile': '__always__',    // Always visible
  'settings-security': '__always__',   // Always visible
  'settings-blocked': '__always__',    // Always visible
  'settings-categories': '__always__', // Always visible
  'chat-manager': 'chat-manager',
  'meetings': 'meetings',
  'youtube-courses': 'youtube-courses',
  'documents': 'documents',
}
