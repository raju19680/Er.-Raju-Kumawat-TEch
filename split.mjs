import fs from 'fs';
import path from 'path';

const content = fs.readFileSync('src/components/student-portal/public-portal.tsx', 'utf8');

// The goal is to just replace the components we ALREADY extracted with imports,
// so `public-portal.tsx` becomes much smaller.

let newContent = content;

// 1. Remove PublicNavbar
newContent = newContent.replace(/function PublicNavbar\(\{[\s\S]*?\n\}\n/m, '');

// 2. Remove HeroBanner
newContent = newContent.replace(/\/\/ ─── Hero Banner Carousel ───[\s\S]*?function HeroBanner[\s\S]*?\n\}\n/m, '');

// 3. Remove Footer
newContent = newContent.replace(/\/\/ ─── Footer ───[\s\S]*?function Footer[\s\S]*?\n\}\n/m, '');

// Insert imports at the top
const imports = `
import { PublicNavbar } from './public/PublicNavbar'
import { HeroBanner } from './public/HeroBanner'
import { Footer } from './public/Footer'
import { PortalData, PortalPage, AuthView, OrgData, CourseData, TestSeriesData, QuickLinkData, BannerData, CategoryData } from './public/types'
`;

newContent = newContent.replace(/import \{[\s\S]*?\} from 'lucide-react'/, (match) => match + '\n' + imports);

// Remove the inline types from public-portal.tsx
newContent = newContent.replace(/\/\/ ─── Types ───[\s\S]*?type AuthView = 'login' \| 'forgot-password' \| 'reset-password' \| 'reset-success'/m, '');

fs.writeFileSync('src/components/student-portal/public-portal.tsx', newContent);
console.log('Successfully refactored public-portal.tsx');
