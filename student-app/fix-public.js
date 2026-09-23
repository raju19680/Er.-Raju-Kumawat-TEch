const fs = require('fs');

let content = fs.readFileSync('src/components/student-portal/public/public-components.tsx', 'utf8');

// Types
content = content.replace("export type  = 'home' | 'courses' | 'test-series'", "export type PortalPage = 'home' | 'courses' | 'test-series'");
content = content.replace("export type  = 'login' | 'forgot-password' | 'reset-password' | 'reset-success'", "export type AuthView = 'login' | 'forgot-password' | 'reset-password' | 'reset-success'");

// Interface (PortalData) - line 42 has `export interface  {`
content = content.replace('export interface  {\r\n  id: string\r\n  name: string', 'export interface PortalData {\r\n  id: string\r\n  name: string');
content = content.replace('export interface  {\n  id: string\n  name: string', 'export interface PortalData {\n  id: string\n  name: string');

// Functions mapped by their exact line contents
const functionFixes = [
  { search: "export function ({ password }: { password: string }) {", replace: "export function PasswordStrengthIndicator({ password }: { password: string }) {" },
  { search: "export function ({ org }: { org: OrgData }) {", replace: "export function VerifiedOrgBadge({ org }: { org: OrgData }) {" },
  { search: "export function () {\r\n  return (\r\n    <nav", replace: "export function NavbarSkeleton() {\r\n  return (\r\n    <nav" },
  { search: "export function () {\n  return (\n    <nav", replace: "export function NavbarSkeleton() {\n  return (\n    <nav" },
  { search: "export function () {\r\n  return (\r\n    <Card", replace: "export function CardSkeleton() {\r\n  return (\r\n    <Card" },
  { search: "export function () {\n  return (\n    <Card", replace: "export function CardSkeleton() {\n  return (\n    <Card" },
  { search: "export function ({ onRetry }: { onRetry: () => void }) {", replace: "export function ErrorState({ onRetry }: { onRetry: () => void }) {" },
  { search: "export function ({ data, activePage, onNavigate, onLoginClick }: {", replace: "export function PublicNavbar({ data, activePage, onNavigate, onLoginClick }: {" },
  { search: "export function ({ data }: { data: PortalData }) {\r\n  if (!data) return null", replace: "export function HeroBanner({ data }: { data: PortalData }) {\r\n  if (!data) return null" },
  { search: "export function ({ data }: { data: PortalData }) {\n  if (!data) return null", replace: "export function HeroBanner({ data }: { data: PortalData }) {\n  if (!data) return null" },
  { search: "export function ({ data, onNavigate }: { data: PortalData; onNavigate: (p: PortalPage) => void }) {", replace: "export function BrowseTiles({ data, onNavigate }: { data: PortalData; onNavigate: (p: PortalPage) => void }) {" },
  { search: "export function ({ data, onNavigate, onLoginClick }: { data: PortalData; onNavigate: (p: PortalPage) => void; onLoginClick: () => void }) {\r\n  if", replace: "export function FeaturedSection({ data, onNavigate, onLoginClick }: { data: PortalData; onNavigate: (p: PortalPage) => void; onLoginClick: () => void }) {\r\n  if" },
  { search: "export function ({ data, onNavigate, onLoginClick }: { data: PortalData; onNavigate: (p: PortalPage) => void; onLoginClick: () => void }) {\n  if", replace: "export function FeaturedSection({ data, onNavigate, onLoginClick }: { data: PortalData; onNavigate: (p: PortalPage) => void; onLoginClick: () => void }) {\n  if" },
  { search: "export function ({ data, onNavigate, onLoginClick }: { data: PortalData; onNavigate: (p: PortalPage) => void; onLoginClick: () => void }) {\r\n  const", replace: "export function CoursesSection({ data, onNavigate, onLoginClick }: { data: PortalData; onNavigate: (p: PortalPage) => void; onLoginClick: () => void }) {\r\n  const" },
  { search: "export function ({ data, onNavigate, onLoginClick }: { data: PortalData; onNavigate: (p: PortalPage) => void; onLoginClick: () => void }) {\n  const", replace: "export function CoursesSection({ data, onNavigate, onLoginClick }: { data: PortalData; onNavigate: (p: PortalPage) => void; onLoginClick: () => void }) {\n  const" },
  { search: "export function ({ data, onLoginClick }: { data: PortalData; onLoginClick: () => void }) {\r\n  const [searchQuery, setSearchQuery]", replace: "export function CoursesListPage({ data, onLoginClick }: { data: PortalData; onLoginClick: () => void }) {\r\n  const [searchQuery, setSearchQuery]" },
  { search: "export function ({ data, onLoginClick }: { data: PortalData; onLoginClick: () => void }) {\n  const [searchQuery, setSearchQuery]", replace: "export function CoursesListPage({ data, onLoginClick }: { data: PortalData; onLoginClick: () => void }) {\n  const [searchQuery, setSearchQuery]" },
  { search: "export function ({ data, onLoginClick }: { data: PortalData; onLoginClick: () => void }) {\r\n  const [searchQuery, setSearchQuery] = useState('')\r\n\r\n  // Filter test series", replace: "export function TestSeriesListPage({ data, onLoginClick }: { data: PortalData; onLoginClick: () => void }) {\r\n  const [searchQuery, setSearchQuery] = useState('')\r\n\r\n  // Filter test series" },
  { search: "export function ({ data, onLoginClick }: { data: PortalData; onLoginClick: () => void }) {\n  const [searchQuery, setSearchQuery] = useState('')\n\n  // Filter test series", replace: "export function TestSeriesListPage({ data, onLoginClick }: { data: PortalData; onLoginClick: () => void }) {\n  const [searchQuery, setSearchQuery] = useState('')\n\n  // Filter test series" },
  { search: "export function ({ data }: { data: PortalData }) {\r\n  return (\r\n    <div className=\"min-h-screen", replace: "export function DocsPage({ data }: { data: PortalData }) {\r\n  return (\r\n    <div className=\"min-h-screen" },
  { search: "export function ({ data }: { data: PortalData }) {\n  return (\n    <div className=\"min-h-screen", replace: "export function DocsPage({ data }: { data: PortalData }) {\n  return (\n    <div className=\"min-h-screen" },
  { search: "export function ({ data }: { data: PortalData }) {\r\n  const links", replace: "export function QuickLinksPage({ data }: { data: PortalData }) {\r\n  const links" },
  { search: "export function ({ data }: { data: PortalData }) {\n  const links", replace: "export function QuickLinksPage({ data }: { data: PortalData }) {\n  const links" },
  { search: "export function ({ data, onLoginClick }: { data: PortalData; onLoginClick: () => void }) {\r\n  return (\r\n    <div className=\"min-h-screen py-12\">\r\n      <div className=\"max-w-7xl mx-auto px-4\">\r\n        <div className=\"bg-white rounded-2xl shadow-sm border p-8 md:p-12\">\r\n          <div className=\"max-w-3xl mx-auto text-center space-y-8\">\r\n            {data?.logo_url && (\r\n              <img", replace: "export function AboutPage({ data, onLoginClick }: { data: PortalData; onLoginClick: () => void }) {\r\n  return (\r\n    <div className=\"min-h-screen py-12\">\r\n      <div className=\"max-w-7xl mx-auto px-4\">\r\n        <div className=\"bg-white rounded-2xl shadow-sm border p-8 md:p-12\">\r\n          <div className=\"max-w-3xl mx-auto text-center space-y-8\">\r\n            {data?.logo_url && (\r\n              <img" },
  { search: "export function ({ data, onLoginClick }: { data: PortalData; onLoginClick: () => void }) {\n  return (\n    <div className=\"min-h-screen py-12\">\n      <div className=\"max-w-7xl mx-auto px-4\">\n        <div className=\"bg-white rounded-2xl shadow-sm border p-8 md:p-12\">\n          <div className=\"max-w-3xl mx-auto text-center space-y-8\">\n            {data?.logo_url && (\n              <img", replace: "export function AboutPage({ data, onLoginClick }: { data: PortalData; onLoginClick: () => void }) {\n  return (\n    <div className=\"min-h-screen py-12\">\n      <div className=\"max-w-7xl mx-auto px-4\">\n        <div className=\"bg-white rounded-2xl shadow-sm border p-8 md:p-12\">\n          <div className=\"max-w-3xl mx-auto text-center space-y-8\">\n            {data?.logo_url && (\n              <img" },
  { search: "export function ({ data }: { data: PortalData }) {\r\n  if (!data) return null\r\n\r\n  return (\r\n    <footer", replace: "export function Footer({ data }: { data: PortalData }) {\r\n  if (!data) return null\r\n\r\n  return (\r\n    <footer" },
  { search: "export function ({ data }: { data: PortalData }) {\n  if (!data) return null\n\n  return (\n    <footer", replace: "export function Footer({ data }: { data: PortalData }) {\n  if (!data) return null\n\n  return (\n    <footer" }
];

for (const fix of functionFixes) {
  content = content.replace(fix.search, fix.replace);
}

fs.writeFileSync('src/components/student-portal/public/public-components.tsx', content);
console.log('Fixed public-components');
