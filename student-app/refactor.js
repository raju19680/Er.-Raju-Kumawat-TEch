const fs = require('fs');
const path = 'src/components/student-portal/public-portal.tsx';
let content = fs.readFileSync(path, 'utf8');

const mainComponentIndex = content.indexOf('export default function PublicPortal');

let componentsContent = content.substring(0, mainComponentIndex);
const componentsToExport = ['PasswordStrengthIndicator', 'VerifiedOrgBadge', 'NavbarSkeleton', 'CardSkeleton', 'ErrorState', 'PublicNavbar', 'HeroBanner', 'BrowseTiles', 'FeaturedSection', 'CoursesSection', 'CoursesListPage', 'TestSeriesListPage', 'DocsPage', 'QuickLinksPage', 'AboutPage', 'Footer', 'PortalData', 'PortalPage', 'AuthView', 'BLUE', 'BLUE_LIGHT', 'BLUE_MEDIUM', 'BLUE_HOVER', 'BLUE_BORDER'];

for (const comp of componentsToExport) {
  componentsContent = componentsContent.replace(new RegExp('function ' + comp + '\\\\b'), 'export function ' + comp);
  componentsContent = componentsContent.replace(new RegExp('interface ' + comp + '\\\\b'), 'export interface ' + comp);
  componentsContent = componentsContent.replace(new RegExp('type ' + comp + '\\\\b'), 'export type ' + comp);
  componentsContent = componentsContent.replace(new RegExp('const ' + comp + '\\\\s*='), 'export const ' + comp + ' =');
}

fs.writeFileSync('src/components/student-portal/public/public-components.tsx', componentsContent);

let newPortalContent = `'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '@/lib/store'
import { Skeleton } from '@/components/ui/skeleton'
import {
  NavbarSkeleton, CardSkeleton, ErrorState, PublicNavbar, HeroBanner,
  BrowseTiles, FeaturedSection, CoursesSection, CoursesListPage,
  TestSeriesListPage, DocsPage, QuickLinksPage, AboutPage, Footer,
  PortalData, PortalPage, AuthView
} from './public/public-components'

`;

newPortalContent += content.substring(mainComponentIndex);
fs.writeFileSync(path, newPortalContent);
console.log('Done!');
