const fs = require('fs');

function processFile(path, dest, mainComponent, exportsList) {
  let content = fs.readFileSync(path, 'utf8');
  const mainComponentIndex = content.indexOf(`export default function ${mainComponent}`);
  
  let componentsContent = content.substring(0, mainComponentIndex);
  
  for (const comp of exportsList) {
    componentsContent = componentsContent.replace(new RegExp('function ' + comp + '\\\\b'), 'export function ' + comp);
    componentsContent = componentsContent.replace(new RegExp('interface ' + comp + '\\\\b'), 'export interface ' + comp);
    componentsContent = componentsContent.replace(new RegExp('type ' + comp + '\\\\b'), 'export type ' + comp);
    componentsContent = componentsContent.replace(new RegExp('const ' + comp + '\\\\s*='), 'export const ' + comp + ' =');
  }
  
  fs.writeFileSync(dest, componentsContent);
  
  let newPortalContent = `'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  ArrowLeft, BookOpen, Clock, Play, CheckCircle2, Lock, ChevronDown, ChevronRight, Loader2, AlertCircle, Menu, X, Sparkles
} from 'lucide-react'
import {
  ${exportsList.join(', ')}
} from './${dest.includes('public') ? 'public/public-components' : 'course/course-components'}'

`;

  newPortalContent += content.substring(mainComponentIndex);
  
  // also need to fix that Unterminated RegExp literal in public-portal
  if (path.includes('public-portal')) {
    newPortalContent = newPortalContent.replace('</>\r\n                  )}', ''); 
    // wait I'll fix this manually if it persists
  }
  
  fs.writeFileSync(path, newPortalContent);
}

processFile(
  'src/components/student-portal/public-portal.tsx',
  'src/components/student-portal/public/public-components.tsx',
  'PublicPortal',
  ['PasswordStrengthIndicator', 'VerifiedOrgBadge', 'NavbarSkeleton', 'CardSkeleton', 'ErrorState', 'PublicNavbar', 'HeroBanner', 'BrowseTiles', 'FeaturedSection', 'CoursesSection', 'CoursesListPage', 'TestSeriesListPage', 'DocsPage', 'QuickLinksPage', 'AboutPage', 'Footer', 'PortalData', 'PortalPage', 'AuthView', 'BLUE', 'BLUE_LIGHT', 'BLUE_MEDIUM', 'BLUE_HOVER', 'BLUE_BORDER']
);

processFile(
  'src/components/student-portal/course-detail.tsx',
  'src/components/student-portal/course/course-components.tsx',
  'CourseDetail',
  ['Lesson', 'Module', 'CourseData', 'CourseStats', 'ProgressEntry', 'formatDuration', 'getLessonIcon', 'getLessonTypeLabel', 'LessonContent']
);

console.log('Done');
