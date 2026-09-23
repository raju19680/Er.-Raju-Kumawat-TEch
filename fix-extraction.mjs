import fs from 'fs';
import path from 'path';

// 1. Move cardGradients, tags, and colors to types.ts
let typesContent = fs.readFileSync('src/components/student-portal/public/types.ts', 'utf8');
typesContent += `
export const BLUE = '#2563EB'
export const BLUE_LIGHT = '#2563EB15'
export const BLUE_MEDIUM = '#2563EB30'
export const BLUE_HOVER = '#2563EB20'
export const BLUE_BORDER = '#2563EB40'

export const cardGradients = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-purple-500 to-pink-600',
]
export const tags = ['Bestseller', 'Popular', 'New', 'Trending']
`;
fs.writeFileSync('src/components/student-portal/public/types.ts', typesContent);

// 2. Add imports to BrowseTiles
let browseContent = fs.readFileSync('src/components/student-portal/public/BrowseTiles.tsx', 'utf8');
browseContent = browseContent.replace(
  "import { ChevronRight, Sparkles, BookOpen, Clock, FileText } from 'lucide-react'",
  "import { ChevronRight, Sparkles, BookOpen, Clock, FileText, ClipboardList, Link2 } from 'lucide-react'"
);
fs.writeFileSync('src/components/student-portal/public/BrowseTiles.tsx', browseContent);

// 3. Add imports to FeaturedSection
let featuredContent = fs.readFileSync('src/components/student-portal/public/FeaturedSection.tsx', 'utf8');
featuredContent = featuredContent.replace(
  "import { PortalData, PortalPage, AuthView, OrgData, CourseData, TestSeriesData, QuickLinkData, BannerData, CategoryData } from './types'",
  "import { PortalData, PortalPage, AuthView, OrgData, CourseData, TestSeriesData, QuickLinkData, BannerData, CategoryData, BLUE, BLUE_BORDER, BLUE_LIGHT, cardGradients, tags } from './types'"
);
featuredContent = featuredContent.replace(
  "import { Sparkles, ArrowRight, User } from 'lucide-react'",
  "import { Sparkles, ArrowRight, User, ClipboardList } from 'lucide-react'"
);
fs.writeFileSync('src/components/student-portal/public/FeaturedSection.tsx', featuredContent);

// 4. Add imports to CoursesSection
let coursesContent = fs.readFileSync('src/components/student-portal/public/CoursesSection.tsx', 'utf8');
coursesContent = coursesContent.replace(
  "import { PortalData, PortalPage, AuthView, OrgData, CourseData, TestSeriesData, QuickLinkData, BannerData, CategoryData } from './types'",
  "import { PortalData, PortalPage, AuthView, OrgData, CourseData, TestSeriesData, QuickLinkData, BannerData, CategoryData, BLUE, BLUE_BORDER, BLUE_LIGHT, cardGradients, tags } from './types'"
);
fs.writeFileSync('src/components/student-portal/public/CoursesSection.tsx', coursesContent);

// 5. Remove duplicate imports and the constants from public-portal.tsx
let portalContent = fs.readFileSync('src/components/student-portal/public-portal.tsx', 'utf8');
portalContent = portalContent.replace(/import \{ FeaturedSection \} from '\.\/public\/FeaturedSection'\nimport \{ CoursesSection \} from '\.\/public\/CoursesSection'\n/, '');
portalContent = portalContent.replace(/const BLUE = '#2563EB'[\s\S]*?const tags = \['Bestseller', 'Popular', 'New', 'Trending'\]\n/m, '');
fs.writeFileSync('src/components/student-portal/public-portal.tsx', portalContent);

console.log('Fixes applied successfully');
