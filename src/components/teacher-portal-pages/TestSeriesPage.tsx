'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStudentStore } from '@/lib/student-store'
import {
  CheckCircle,
  Clock,
  Users,
  FileText,
  Zap,
  Award,
  ArrowRight,
  BookOpen,
  BarChart3,
} from 'lucide-react'

const testSeries = [
  {
    id: '1',
    title: 'Rajasthan Computer Anudeshak PAPER-1 Full Length Test Series',
    titleHi: 'राजस्थान कम्प्यूटर अनुदेशक पेपर-1 फुल लेंथ टेस्ट सीरीज',
    tests: 10,
    questions: 1000,
    duration: '90 min each',
    price: 199,
    mrp: 399,
    students: 5200,
    tag: 'BESTSELLER',
    color: 'from-blue-500 to-indigo-600',
    features: [
      'Full-length mock tests as per latest pattern',
      'Detailed solutions & explanations',
      'Performance analytics & ranking',
      'Bilingual questions (Hindi & English)',
    ],
  },
  {
    id: '2',
    title: 'Computer Anudeshak PAPER-2 Subject-wise Test Series',
    titleHi: 'कम्प्यूटर अनुदेशक पेपर-2 विषयवार टेस्ट सीरीज',
    tests: 15,
    questions: 1500,
    duration: '60 min each',
    price: 249,
    mrp: 499,
    students: 3800,
    tag: 'POPULAR',
    color: 'from-emerald-500 to-teal-600',
    features: [
      'Subject-wise practice tests',
      'Topic-wise question distribution',
      'Previous year pattern based',
      'Instant result & analysis',
    ],
  },
  {
    id: '3',
    title: 'Computer Fundamentals Chapter-wise Test Series',
    titleHi: 'कम्प्यूटर मूल बातें अध्यायवार टेस्ट सीरीज',
    tests: 12,
    questions: 600,
    duration: '30 min each',
    price: 99,
    mrp: 199,
    students: 6500,
    tag: 'NEW',
    color: 'from-orange-500 to-red-500',
    features: [
      'Chapter-wise coverage',
      'Quick revision tests',
      'Easy to moderate difficulty',
      'Detailed explanations',
    ],
  },
  {
    id: '4',
    title: 'Computer Anudeshak Complete Combo Test Series',
    titleHi: 'कम्प्यूटर अनुदेशक सम्पूर्ण कम्बो टेस्ट सीरीज',
    tests: 30,
    questions: 3000,
    duration: 'Varies',
    price: 399,
    mrp: 799,
    students: 8200,
    tag: 'COMBO',
    color: 'from-purple-500 to-violet-600',
    features: [
      'Paper-1 + Paper-2 combined',
      'Full length + Chapter-wise',
      'Previous year papers included',
      'Complete exam preparation',
    ],
  },
  {
    id: '5',
    title: 'Previous Year Paper Test Series (2018-2024)',
    titleHi: 'पिछले वर्ष के प्रश्न पत्र टेस्ट सीरीज (2018-2024)',
    tests: 14,
    questions: 1400,
    duration: '90 min each',
    price: 149,
    mrp: 299,
    students: 4500,
    tag: 'TOP RATED',
    color: 'from-cyan-500 to-blue-600',
    features: [
      'All previous year papers',
      'Year-wise organized tests',
      'Real exam experience',
      'Answer key with explanations',
    ],
  },
  {
    id: '6',
    title: 'Computer Networking & DBMS Practice Test Series',
    titleHi: 'कम्प्यूटर नेटवर्किंग एवं DBMS अभ्यास टेस्ट सीरीज',
    tests: 8,
    questions: 400,
    duration: '30 min each',
    price: 129,
    mrp: 249,
    students: 2900,
    tag: 'PRACTICE',
    color: 'from-rose-500 to-pink-600',
    features: [
      'Focused on Networking & DBMS',
      'Conceptual + Numerical questions',
      'Difficulty levels varied',
      'Quick practice format',
    ],
  },
]

export default function TestSeriesPage() {
  const { setActivePage } = useStudentStore()

  const discount = (price: number, mrp: number) =>
    Math.round(((mrp - price) / mrp) * 100)

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
            TEST SERIES
          </h1>
          <p className="mt-3 text-base text-blue-100 sm:text-lg">
            Practice with our carefully curated test series and boost your preparation
          </p>
        </div>
      </section>

      {/* ========== TEST SERIES GRID ========== */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testSeries.map((series) => (
              <Card
                key={series.id}
                className="group overflow-hidden border-0 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Product Image Placeholder */}
                <div
                  className={cn(
                    'relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br',
                    series.color
                  )}
                >
                  {/* Decorative circles */}
                  <div className="absolute -right-6 -top-6 size-24 rounded-full bg-white/10" />
                  <div className="absolute -bottom-4 -left-4 size-20 rounded-full bg-white/10" />

                  {/* Icon */}
                  <div className="relative flex flex-col items-center gap-2">
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                      <FileText className="size-8 text-white" />
                    </div>
                    <span className="rounded-full bg-black/30 px-3 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
                      {series.tests} Tests
                    </span>
                  </div>

                  {/* Tag Badge */}
                  <Badge
                    className={cn(
                      'absolute left-3 top-3 border-0 px-3 py-0.5 text-xs font-bold',
                      series.tag === 'COMBO'
                        ? 'bg-yellow-400 text-yellow-900'
                        : 'bg-white/90 text-gray-700'
                    )}
                  >
                    {series.tag === 'BESTSELLER' && <Zap className="mr-1 size-3" />}
                    {series.tag === 'TOP RATED' && <Award className="mr-1 size-3" />}
                    {series.tag}
                  </Badge>

                  {/* Discount Badge */}
                  <Badge className="absolute right-3 top-3 border-0 bg-green-500 px-3 py-0.5 text-xs font-bold text-white shadow-md">
                    {discount(series.price, series.mrp)}% OFF
                  </Badge>
                </div>

                <CardContent className="p-4 sm:p-5">
                  <h3 className="text-base font-bold leading-snug text-gray-900 group-hover:text-blue-600">
                    {series.title}
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-blue-600">
                    {series.titleHi}
                  </p>

                  {/* Test Info */}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                      <BookOpen className="size-3" />
                      {series.questions} Questions
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                      <Clock className="size-3" />
                      {series.duration}
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5">
                      <Users className="size-3" />
                      {series.students.toLocaleString()}
                    </span>
                  </div>

                  {/* Features */}
                  <ul className="mt-3 space-y-1.5">
                    {series.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-gray-600"
                      >
                        <CheckCircle className="mt-0.5 size-3.5 shrink-0 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Price */}
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-gray-900">
                      ₹{series.price}
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      ₹{series.mrp}
                    </span>
                  </div>

                  {/* CTA */}
                  <Button
                    size="sm"
                    className="mt-3 w-full bg-blue-600 font-semibold hover:bg-blue-700"
                    onClick={() => setActivePage('test-series')}
                  >
                    View Details
                    <ArrowRight className="ml-1 size-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ========== BOTTOM CTA ========== */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <BarChart3 className="mx-auto size-10 text-white/60" />
          <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
            Track Your Performance
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-blue-100">
            Get detailed analytics, performance reports, and All India Ranking after every test attempt
          </p>
          <Button
            size="lg"
            className="mt-6 bg-white font-semibold text-blue-700 shadow-lg hover:bg-blue-50"
            onClick={() => setActivePage('login')}
          >
            Start Your First Test
            <ArrowRight className="ml-1 size-4" />
          </Button>
        </div>
      </section>
    </div>
  )
}
