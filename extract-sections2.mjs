import fs from 'fs';
import path from 'path';

const content = fs.readFileSync('src/components/student-portal/public-portal.tsx', 'utf8');
const typesImport = "import { PortalData, PortalPage, AuthView, OrgData, CourseData, TestSeriesData, QuickLinkData, BannerData, CategoryData } from './types'";

// 2. Extract FeaturedSection
const featuredSectionMatch = content.match(/\/\/ ─── Featured Test Series ───[\s\S]*?function FeaturedSection[\s\S]*?\n\}\n/m);
if (featuredSectionMatch) {
  const featuredSectionContent = `'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAppStore } from '@/lib/store'
${typesImport}

${featuredSectionMatch[0]}
export { FeaturedSection }
`;
  fs.writeFileSync('src/components/student-portal/public/FeaturedSection.tsx', featuredSectionContent);
}

// 3. Extract CoursesSection
const coursesSectionMatch = content.match(/\/\/ ─── Courses Section ───[\s\S]*?function CoursesSection[\s\S]*?\n\}\n/m);
if (coursesSectionMatch) {
  const coursesSectionContent = `'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Sparkles, Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAppStore } from '@/lib/store'
${typesImport}

${coursesSectionMatch[0]}
export { CoursesSection }
`;
  fs.writeFileSync('src/components/student-portal/public/CoursesSection.tsx', coursesSectionContent);
}

// Remove from public-portal.tsx and insert imports
let newContent = content;

if (featuredSectionMatch) newContent = newContent.replace(featuredSectionMatch[0], '');
if (coursesSectionMatch) newContent = newContent.replace(coursesSectionMatch[0], '');

const imports = `
import { FeaturedSection } from './public/FeaturedSection'
import { CoursesSection } from './public/CoursesSection'
`;

newContent = newContent.replace(/import \{ BrowseTiles \} from '\.\/public\/BrowseTiles'/, (match) => match + '\n' + imports);

fs.writeFileSync('src/components/student-portal/public-portal.tsx', newContent);
console.log('Extraction complete 2');
