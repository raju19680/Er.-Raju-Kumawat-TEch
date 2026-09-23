'use client'

import React, { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStudentStore } from '@/lib/student-store'
import { TEACHER_CONFIG } from '@/lib/tp-config'
import {
  BookOpen,
  FileText,
  ClipboardList,
  Link2,
  ChevronLeft,
  ChevronRight,
  Play,
  Star,
  Users,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Monitor,
  Zap,
  Award,
} from 'lucide-react'

const bannerSlides = [
  {
    id: 1,
    bgGradient: 'from-blue-700 via-blue-600 to-indigo-800',
    badge: 'NEW LAUNCH',
    title: 'Computer Anudeshak',
    subtitle: 'Full Length Test Series',
    description: 'कम्प्यूटर अनुदेशक पूर्ण लंबाई टेस्ट सीरीज़ — Practice with real exam pattern',
    cta: 'Start Now',
    icon: <ClipboardList className="size-16 text-white/30" />,
  },
  {
    id: 2,
    bgGradient: 'from-emerald-700 via-teal-600 to-cyan-800',
    badge: 'TEST SHEET',
    title: 'Practice Test Sheets',
    subtitle: 'Chapter-wise & Topic-wise',
    description: 'अध्यायवार और विषयवार अभ्यास पत्र — Build strong fundamentals',
    cta: 'Try Free',
    icon: <FileText className="size-16 text-white/30" />,
  },
  {
    id: 3,
    bgGradient: 'from-purple-700 via-violet-600 to-fuchsia-800',
    badge: 'TOP RATED',
    title: 'Video Courses',
    subtitle: 'Complete Exam Preparation',
    description: 'कम्प्यूटर अनुदेशक परीक्षा की पूर्ण तैयारी — Learn from expert faculty',
    cta: 'Explore',
    icon: <GraduationCap className="size-16 text-white/30" />,
  },
]

const browseCategories = [
  {
    id: 'courses',
    title: 'Courses',
    titleHi: 'कोर्सेज',
    icon: <BookOpen className="size-7" />,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    id: 'test-series',
    title: 'Test Series',
    titleHi: 'टेस्ट सीरीज',
    icon: <ClipboardList className="size-7" />,
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  {
    id: 'docs',
    title: 'Docs',
    titleHi: 'स्टडी मटेरियल',
    icon: <FileText className="size-7" />,
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50',
    textColor: 'text-orange-600',
  },
  {
    id: 'quick-links',
    title: 'Quick Links',
    titleHi: 'क्विक लिंक्स',
    icon: <Link2 className="size-7" />,
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
]

const featuredCourses = [
  {
    id: '1',
    title: 'Computer Anudeshak Complete Course',
    titleHi: 'कम्प्यूटर अनुदेशक सम्पूर्ण कोर्स',
    description: 'Cover all topics for Computer Anudeshak exam including Computer Fundamentals, OS, Networking, DBMS, and more with video lectures and notes.',
    price: 999,
    mrp: 2999,
    rating: 4.8,
    students: 5200,
    lessons: 120,
    tag: 'BESTSELLER',
  },
  {
    id: '2',
    title: 'Rajasthan Computer Anudeshak Paper-1',
    titleHi: 'राजस्थान कम्प्यूटर अनुदेशक पेपर-1',
    description: 'Detailed preparation for Paper-1 with topic-wise video lectures, practice questions, and previous year paper analysis.',
    price: 699,
    mrp: 1999,
    rating: 4.7,
    students: 3800,
    lessons: 85,
    tag: 'POPULAR',
  },
]

export default function HomePage() {
  const { setActivePage } = useStudentStore()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 4000, stopOnInteraction: false }),
  ])

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  const discount = (price: number, mrp: number) =>
    Math.round(((mrp - price) / mrp) * 100)

  return (
    <div>
      {/* ========== CAROUSEL BANNER ========== */}
      <section className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {bannerSlides.map((slide) => (
              <div key={slide.id} className="min-w-0 flex-[0_0_100%]">
                <div
                  className={cn(
                    'relative flex min-h-[260px] items-center overflow-hidden bg-gradient-to-br px-6 py-10 sm:min-h-[320px] sm:px-12 lg:min-h-[380px] lg:px-20',
                    slide.bgGradient
                  )}
                >
                  {/* Decorative pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute -right-20 -top-20 size-80 rounded-full bg-white/20" />
                    <div className="absolute -bottom-10 left-1/4 size-60 rounded-full bg-white/10" />
                    <div className="absolute right-1/4 top-1/4 size-40 rounded-full bg-white/15" />
                  </div>

                  {/* Floating icon */}
                  <div className="absolute bottom-4 right-4 opacity-20 sm:bottom-8 sm:right-8 lg:bottom-12 lg:right-16">
                    {slide.icon}
                  </div>

                  <div className="relative z-10 max-w-2xl">
                    <Badge className="mb-3 border-0 bg-yellow-400 px-3 py-1 text-xs font-bold text-yellow-900 shadow-lg">
                      <Sparkles className="mr-1 size-3" />
                      {slide.badge}
                    </Badge>
                    <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                      {slide.title}
                    </h2>
                    <p className="mt-1 text-xl font-semibold text-white/90 sm:text-2xl">
                      {slide.subtitle}
                    </p>
                    <p className="mt-3 max-w-lg text-sm leading-relaxed text-white/75 sm:text-base">
                      {slide.description}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button
                        size="lg"
                        className="bg-white font-semibold text-blue-700 shadow-lg hover:bg-blue-50"
                        onClick={() => setActivePage('test-series')}
                      >
                        {slide.cta}
                        <ArrowRight className="ml-1 size-4" />
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-white/40 bg-white/10 font-semibold text-white backdrop-blur-sm hover:bg-white/20"
                        onClick={() => setActivePage('courses')}
                      >
                        <Play className="mr-1 size-4" />
                        Watch Demo
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Carousel Controls */}
        <button
          onClick={scrollPrev}
          className="absolute left-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition hover:bg-black/40 sm:left-4"
          aria-label="Previous slide"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          onClick={scrollNext}
          className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition hover:bg-black/40 sm:right-4"
          aria-label="Next slide"
        >
          <ChevronRight className="size-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {bannerSlides.map((_, idx) => (
            <button
              key={idx}
              className={cn(
                'h-2 rounded-full transition-all',
                idx === selectedIndex
                  ? 'w-6 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/70'
              )}
              onClick={() => emblaApi?.scrollTo(idx)}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ========== BROWSE SECTION ========== */}
      <section className="bg-sky-50 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Browse
            </h2>
            <p className="mt-1 text-gray-600">
              Explore our learning resources
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {browseCategories.map((cat) => (
              <Card
                key={cat.id}
                className="group cursor-pointer border-0 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                onClick={() => setActivePage(cat.id)}
              >
                <CardContent className="flex flex-col items-center gap-3 p-5 text-center sm:p-6">
                  <div
                    className={cn(
                      'flex size-14 items-center justify-center rounded-xl text-white shadow-md transition-transform group-hover:scale-110 sm:size-16',
                      cat.color
                    )}
                  >
                    {cat.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 sm:text-base">
                      {cat.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">{cat.titleHi}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURED SECTION ========== */}
      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Featured
              </h2>
              <p className="mt-1 text-gray-600">
                Top picks for your preparation
              </p>
            </div>
            <Button
              variant="outline"
              className="hidden sm:inline-flex"
              onClick={() => setActivePage('courses')}
            >
              View All
              <ArrowRight className="ml-1 size-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {featuredCourses.map((course) => (
              <Card
                key={course.id}
                className="group overflow-hidden border-0 shadow-sm transition-all hover:shadow-lg"
              >
                {/* Video Thumbnail Placeholder */}
                <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 sm:h-56">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-transform group-hover:scale-110">
                      <Play className="size-8 fill-white text-white" />
                    </div>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute left-4 top-4 flex items-center gap-2">
                    <Badge className="border-0 bg-yellow-400 px-3 py-0.5 text-xs font-bold text-yellow-900">
                      <Zap className="mr-1 size-3" />
                      {course.tag}
                    </Badge>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/90">
                      <Monitor className="size-4" />
                      <span className="text-xs font-medium">{course.lessons} Lessons</span>
                    </div>
                    <Badge className="border-0 bg-green-500 px-2 py-0.5 text-xs font-bold text-white">
                      {discount(course.price, course.mrp)}% OFF
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4 sm:p-5">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600">
                    {course.title}
                  </h3>
                  <p className="mt-0.5 text-sm font-medium text-blue-600">
                    {course.titleHi}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Star className="size-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-gray-700">{course.rating}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="size-4" />
                      {course.students.toLocaleString()} students
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-gray-900">
                        ₹{course.price}
                      </span>
                      <span className="text-sm text-gray-400 line-through">
                        ₹{course.mrp}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="bg-blue-600 font-semibold hover:bg-blue-700"
                      onClick={() => setActivePage('courses')}
                    >
                      View Content
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Button
              variant="outline"
              onClick={() => setActivePage('courses')}
            >
              View All Courses
              <ArrowRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ========== WHY CHOOSE US ========== */}
      <section className="bg-gray-50 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Why Choose {TEACHER_CONFIG.name}?
            </h2>
            <p className="mt-2 text-gray-600">
              Trusted by thousands of Computer Anudeshak aspirants
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <Award className="size-6" />,
                title: 'Expert Faculty',
                desc: 'Learn from experienced educators who understand the exam pattern deeply',
              },
              {
                icon: <ClipboardList className="size-6" />,
                title: 'Mock Tests',
                desc: 'Practice with full-length mock tests designed as per latest syllabus',
              },
              {
                icon: <Zap className="size-6" />,
                title: 'Quick Revision',
                desc: 'Concise notes and quick revision material for last-minute preparation',
              },
              {
                icon: <Users className="size-6" />,
                title: '10K+ Students',
                desc: 'Join the community of successful candidates who trusted our platform',
              },
            ].map((item, idx) => (
              <Card
                key={idx}
                className="border-0 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    {item.icon}
                  </div>
                  <h3 className="text-base font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ========== STATS SECTION ========== */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
            {[
              { value: '10,000+', label: 'Students Enrolled', icon: <Users className="size-5" /> },
              { value: '50+', label: 'Video Courses', icon: <BookOpen className="size-5" /> },
              { value: '100+', label: 'Test Series', icon: <ClipboardList className="size-5" /> },
              { value: '95%', label: 'Success Rate', icon: <Award className="size-5" /> },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-white/10 text-white">
                  {stat.icon}
                </div>
                <p className="text-2xl font-extrabold text-white sm:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-blue-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
