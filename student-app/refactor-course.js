const fs = require('fs');
const path = 'src/components/student-portal/course-detail.tsx';
let content = fs.readFileSync(path, 'utf8');

const mainComponentIndex = content.indexOf('export default function CourseDetail');

let componentsContent = content.substring(0, mainComponentIndex);
const componentsToExport = [
  'Lesson', 'Module', 'CourseData', 'CourseStats', 'ProgressEntry',
  'formatDuration', 'getLessonIcon', 'getLessonTypeLabel', 'LessonContent'
];

for (const comp of componentsToExport) {
  componentsContent = componentsContent.replace(new RegExp('function ' + comp + '\\\\b'), 'export function ' + comp);
  componentsContent = componentsContent.replace(new RegExp('interface ' + comp + '\\\\b'), 'export interface ' + comp);
  componentsContent = componentsContent.replace(new RegExp('type ' + comp + '\\\\b'), 'export type ' + comp);
  componentsContent = componentsContent.replace(new RegExp('const ' + comp + '\\\\s*='), 'export const ' + comp + ' =');
}

fs.writeFileSync('src/components/student-portal/course/course-components.tsx', componentsContent);

let newPortalContent = `'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Play,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronRight,
  Loader2,
  AlertCircle,
  Menu,
  X,
  Sparkles
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { apiFetchJSON, apiFetch } from '@/lib/api-client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Lesson, Module, CourseData, CourseStats, ProgressEntry,
  formatDuration, getLessonIcon, getLessonTypeLabel, LessonContent
} from './course/course-components'

`;

newPortalContent += content.substring(mainComponentIndex);
fs.writeFileSync(path, newPortalContent);
console.log('Done!');
