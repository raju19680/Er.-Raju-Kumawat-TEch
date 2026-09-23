import fs from 'fs';
import path from 'path';

const content = fs.readFileSync('src/components/student-portal/public-portal.tsx', 'utf8');
const typesImport = "import { PortalData, PortalPage, AuthView, OrgData, CourseData, TestSeriesData, QuickLinkData, BannerData, CategoryData } from './types'";

// 1. Extract BrowseTiles
const browseTilesMatch = content.match(/\/\/ ─── Browse Tiles ───[\s\S]*?function BrowseTiles[\s\S]*?\n\}\n/m);
if (browseTilesMatch) {
  const browseTilesContent = `'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Sparkles, BookOpen, Clock, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
${typesImport}

${browseTilesMatch[0]}
export { BrowseTiles }
`;
  fs.writeFileSync('src/components/student-portal/public/BrowseTiles.tsx', browseTilesContent);
}

// 2. Extract FeaturedSection
const featuredSectionMatch = content.match(/\/\/ ─── Featured Categories & Tiles ───[\s\S]*?function FeaturedSection[\s\S]*?\n\}\n/m);
if (featuredSectionMatch) {
  const featuredSectionContent = `'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
${typesImport}

${featuredSectionMatch[0]}
export { FeaturedSection }
`;
  fs.writeFileSync('src/components/student-portal/public/FeaturedSection.tsx', featuredSectionContent);
}

// 3. Extract CoursesSection
const coursesSectionMatch = content.match(/\/\/ ─── Recommended Courses ───[\s\S]*?function CoursesSection[\s\S]*?\n\}\n/m);
if (coursesSectionMatch) {
  const coursesSectionContent = `'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Sparkles, Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
${typesImport}

${coursesSectionMatch[0]}
export { CoursesSection }
`;
  fs.writeFileSync('src/components/student-portal/public/CoursesSection.tsx', coursesSectionContent);
}

// Remove from public-portal.tsx and insert imports
let newContent = content;

if (browseTilesMatch) newContent = newContent.replace(browseTilesMatch[0], '');
if (featuredSectionMatch) newContent = newContent.replace(featuredSectionMatch[0], '');
if (coursesSectionMatch) newContent = newContent.replace(coursesSectionMatch[0], '');

const imports = `
import { BrowseTiles } from './public/BrowseTiles'
import { FeaturedSection } from './public/FeaturedSection'
import { CoursesSection } from './public/CoursesSection'
`;

newContent = newContent.replace(/import \{ Footer \} from '\.\/public\/Footer'/, (match) => match + '\n' + imports);

fs.writeFileSync('src/components/student-portal/public-portal.tsx', newContent);
console.log('Extraction complete');
