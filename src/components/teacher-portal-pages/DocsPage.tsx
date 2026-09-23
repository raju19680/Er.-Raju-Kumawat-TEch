'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  BookOpen,
  Download,
  FileText,
  Sheet,
  BookMarked,
  StickyNote,
  Globe,
  ExternalLink,
} from 'lucide-react'

interface DocItem {
  id: string
  title: string
  titleHi: string
  classLabel?: string
  type: string
  size: string
  color: string
}

const bookDocs: DocItem[] = [
  {
    id: 'b1',
    title: 'Computer Fundamentals Complete Book',
    titleHi: 'कम्प्यूटर मूल बातें सम्पूर्ण पुस्तक',
    classLabel: 'ALL',
    type: 'PDF',
    size: '28 MB',
    color: 'from-red-500 to-rose-600',
  },
  {
    id: 'b2',
    title: 'Operating Systems Reference Book',
    titleHi: 'ऑपरेटिंग सिस्टम संदर्भ पुस्तक',
    classLabel: 'PAPER-2',
    type: 'PDF',
    size: '22 MB',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'b3',
    title: 'Computer Networks Study Guide',
    titleHi: 'कम्प्यूटर नेटवर्क अध्ययन गाइड',
    classLabel: 'PAPER-2',
    type: 'PDF',
    size: '18 MB',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'b4',
    title: 'DBMS & SQL Complete Notes',
    titleHi: 'DBMS एवं SQL सम्पूर्ण नोट्स',
    classLabel: 'PAPER-2',
    type: 'PDF',
    size: '15 MB',
    color: 'from-purple-500 to-violet-600',
  },
  {
    id: 'b5',
    title: 'C Programming Reference Material',
    titleHi: 'C प्रोग्रामिंग संदर्भ सामग्री',
    classLabel: 'PAPER-1',
    type: 'PDF',
    size: '20 MB',
    color: 'from-orange-500 to-amber-600',
  },
  {
    id: 'b6',
    title: 'MS Office Practical Guide',
    titleHi: 'MS ऑफिस प्रायोगिक गाइड',
    classLabel: 'PRACTICAL',
    type: 'PDF',
    size: '12 MB',
    color: 'from-cyan-500 to-blue-600',
  },
]

const omrDocs: DocItem[] = [
  {
    id: 'o1',
    title: 'OMR Practice Sheet - Paper 1 (Set A)',
    titleHi: 'OMR अभ्यास पत्र - पेपर 1 (सेट A)',
    classLabel: 'PAPER-1',
    type: 'PDF',
    size: '2 MB',
    color: 'from-gray-500 to-slate-600',
  },
  {
    id: 'o2',
    title: 'OMR Practice Sheet - Paper 1 (Set B)',
    titleHi: 'OMR अभ्यास पत्र - पेपर 1 (सेट B)',
    classLabel: 'PAPER-1',
    type: 'PDF',
    size: '2 MB',
    color: 'from-gray-500 to-slate-600',
  },
  {
    id: 'o3',
    title: 'OMR Practice Sheet - Paper 2 (Set A)',
    titleHi: 'OMR अभ्यास पत्र - पेपर 2 (सेट A)',
    classLabel: 'PAPER-2',
    type: 'PDF',
    size: '2 MB',
    color: 'from-gray-500 to-slate-600',
  },
]

const syllabusDocs: DocItem[] = [
  {
    id: 's1',
    title: 'Computer Anudeshak Complete Syllabus 2024',
    titleHi: 'कम्प्यूटर अनुदेशक सम्पूर्ण पाठ्यक्रम 2024',
    classLabel: 'LATEST',
    type: 'PDF',
    size: '5 MB',
    color: 'from-green-500 to-emerald-600',
  },
  {
    id: 's2',
    title: 'Paper-1 Detailed Syllabus Breakdown',
    titleHi: 'पेपर-1 विस्तृत पाठ्यक्रम विवरण',
    classLabel: 'PAPER-1',
    type: 'PDF',
    size: '3 MB',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    id: 's3',
    title: 'Paper-2 Detailed Syllabus Breakdown',
    titleHi: 'पेपर-2 विस्तृत पाठ्यक्रम विवरण',
    classLabel: 'PAPER-2',
    type: 'PDF',
    size: '4 MB',
    color: 'from-indigo-500 to-violet-600',
  },
]

const notesDocs: DocItem[] = [
  {
    id: 'n1',
    title: 'Computer Fundamentals Short Notes',
    titleHi: 'कम्प्यूटर मूल बातें संक्षिप्त नोट्स',
    classLabel: 'NOTES',
    type: 'PDF',
    size: '8 MB',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'n2',
    title: 'OS Quick Revision Notes',
    titleHi: 'OS त्वरित संशोधन नोट्स',
    classLabel: 'NOTES',
    type: 'PDF',
    size: '6 MB',
    color: 'from-pink-500 to-rose-600',
  },
  {
    id: 'n3',
    title: 'Networking Formula & Concepts Sheet',
    titleHi: 'नेटवर्किंग सूत्र एवं अवधारणा पत्र',
    classLabel: 'NOTES',
    type: 'PDF',
    size: '4 MB',
    color: 'from-teal-500 to-cyan-600',
  },
  {
    id: 'n4',
    title: 'DBMS Key Points & Terminology',
    titleHi: 'DBMS मुख्य बिंदु एवं शब्दावली',
    classLabel: 'NOTES',
    type: 'PDF',
    size: '5 MB',
    color: 'from-amber-500 to-yellow-600',
  },
]

const gkDocs: DocItem[] = [
  {
    id: 'g1',
    title: 'Rajasthan GK Infographics Notes',
    titleHi: 'राजस्थान सामान्य ज्ञान इन्फोग्राफिक्स नोट्स',
    classLabel: 'GK',
    type: 'PDF',
    size: '15 MB',
    color: 'from-rose-500 to-red-600',
  },
  {
    id: 'g2',
    title: 'Indian Constitution & Polity Infographics',
    titleHi: 'भारतीय संविधान एवं राजव्यवस्था इन्फोग्राफिक्स',
    classLabel: 'GK',
    type: 'PDF',
    size: '12 MB',
    color: 'from-sky-500 to-blue-600',
  },
  {
    id: 'g3',
    title: 'History & Culture Infographics Notes',
    titleHi: 'इतिहास एवं संस्कृति इन्फोग्राफिक्स नोट्स',
    classLabel: 'GK',
    type: 'PDF',
    size: '10 MB',
    color: 'from-fuchsia-500 to-purple-600',
  },
]

function DocCard({ doc }: { doc: DocItem }) {
  return (
    <Card className="group overflow-hidden border-0 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      {/* Textbook Cover Placeholder */}
      <div
        className={cn(
          'relative flex h-40 items-center justify-center bg-gradient-to-br sm:h-48',
          doc.color
        )}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <BookOpen className="size-7 text-white" />
          </div>
          <span className="rounded-full bg-black/30 px-3 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {doc.type}
          </span>
        </div>

        {/* Class Badge */}
        {doc.classLabel && (
          <Badge className="absolute left-3 top-3 border-0 bg-white/90 text-xs font-bold text-gray-700 shadow-sm">
            {doc.classLabel}
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="text-sm font-bold leading-snug text-gray-900 group-hover:text-blue-600">
          {doc.title}
        </h3>
        <p className="mt-0.5 text-xs font-medium text-blue-600">{doc.titleHi}</p>
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <FileText className="size-3" />
          {doc.type} • {doc.size}
        </div>
        <Button
          size="sm"
          variant="outline"
          className="mt-3 w-full border-blue-200 font-semibold text-blue-600 hover:bg-blue-50"
        >
          <Download className="mr-1 size-3.5" />
          Download
        </Button>
      </CardContent>
    </Card>
  )
}

function DocList({ docs }: { docs: DocItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {docs.map((doc) => (
        <DocCard key={doc.id} doc={doc} />
      ))}
    </div>
  )
}

const tabItems = [
  { value: 'book', label: 'BOOK', icon: <BookMarked className="size-4" />, docs: bookDocs },
  { value: 'omr', label: 'OMR SHEET', icon: <Sheet className="size-4" />, docs: omrDocs },
  { value: 'syllabus', label: 'SYLLABUS', icon: <FileText className="size-4" />, docs: syllabusDocs },
  { value: 'notes', label: 'NOTES', icon: <StickyNote className="size-4" />, docs: notesDocs },
  { value: 'gk', label: 'GK', icon: <Globe className="size-4" />, docs: gkDocs },
]

export default function DocsPage() {
  return (
    <div>
      {/* ========== BLUE HEADER BANNER ========== */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 py-12 sm:py-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/20" />
          <div className="absolute -bottom-8 left-1/3 size-48 rounded-full bg-white/15" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-3xl font-extrabold tracking-wide text-white sm:text-4xl lg:text-5xl">
            STUDY MATERIAL
          </h1>
          <p className="mt-3 text-base text-blue-100 sm:text-lg">
            Download books, notes, syllabus, and other study resources
          </p>
        </div>
      </section>

      {/* ========== CATEGORY TABS + CONTENT ========== */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="book" className="w-full">
            <div className="mb-6 overflow-x-auto">
              <TabsList className="inline-flex h-auto w-auto flex-nowrap gap-1 bg-gray-100 p-1.5">
                {tabItems.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-xs font-bold tracking-wide sm:text-sm"
                  >
                    {tab.icon}
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {tabItems.map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                <DocList docs={tab.docs} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* ========== BOTTOM CTA ========== */}
      <section className="bg-gray-50 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <ExternalLink className="mx-auto size-10 text-blue-300" />
          <h2 className="mt-4 text-xl font-bold text-gray-900 sm:text-2xl">
            Need More Study Material?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-gray-600">
            Join our courses to get access to exclusive study notes, video lectures, and comprehensive preparation material.
          </p>
          <Button
            size="lg"
            className="mt-6 bg-blue-600 font-semibold hover:bg-blue-700"
          >
            Browse Courses
          </Button>
        </div>
      </section>
    </div>
  )
}
