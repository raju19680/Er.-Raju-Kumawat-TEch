'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TEACHER_CONFIG } from '@/lib/tp-config'
import { useStudentStore } from '@/lib/student-store'
import {
  GraduationCap,
  Users,
  Award,
  BookOpen,
  Mail,
  Phone,
  Target,
  Eye,
  Heart,
  ArrowRight,
  CheckCircle,
  Globe,
  ClipboardList,
  Star,
} from 'lucide-react'

export default function AboutPage() {
  const { setActivePage } = useStudentStore()

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
            ABOUT US
          </h1>
          <p className="mt-3 text-base text-blue-100 sm:text-lg">
            Know more about our institution and mission
          </p>
        </div>
      </section>

      {/* ========== ABOUT CONTENT ========== */}
      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Main About Card */}
          <Card className="overflow-hidden border-0 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-5">
              {/* Left: Image / Avatar area */}
              <div className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 p-8 lg:col-span-2">
                <div className="mb-4 flex size-28 items-center justify-center rounded-full border-4 border-white/30 bg-white/20 shadow-2xl">
                  <GraduationCap className="size-14 text-white" />
                </div>
                <h2 className="text-2xl font-extrabold text-white">
                  {TEACHER_CONFIG.name}
                </h2>
                <p className="mt-1 text-sm font-medium text-blue-200">
                  {TEACHER_CONFIG.institution}
                </p>
                <Badge className="mt-3 border-0 bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                  <Star className="mr-1 size-3" />
                  Trusted by 10,000+ Students
                </Badge>
              </div>

              {/* Right: Description */}
              <CardContent className="p-6 sm:p-8 lg:col-span-3">
                <h3 className="text-xl font-bold text-gray-900">
                  Welcome to Our Platform
                </h3>
                <Separator className="my-4" />
                <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
                  <span className="font-semibold text-gray-800">{TEACHER_CONFIG.name}</span> is a leading
                  education platform dedicated to providing top-quality preparation resources for the{' '}
                  <span className="font-semibold text-blue-600">Computer Anudeshak</span> exam in Rajasthan.
                  Our mission is to empower every aspirant with the knowledge, skills, and confidence
                  needed to succeed in this competitive examination.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
                  We offer a comprehensive suite of learning tools including video courses, full-length
                  test series, chapter-wise practice tests, study materials, previous year papers, and
                  detailed performance analytics. Our content is meticulously crafted by experienced
                  educators who deeply understand the exam pattern and syllabus.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
                  Whether you are a beginner starting your preparation or an advanced learner looking for
                  revision and practice, our platform has everything you need. Join thousands of
                  successful candidates who have trusted us for their exam preparation journey.
                </p>

                {/* Key highlights */}
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    'Expert faculty with years of experience',
                    'Bilingual content (Hindi & English)',
                    'Latest exam pattern based content',
                    'Detailed performance analytics',
                    'Affordable pricing for all students',
                    '24/7 access on mobile & desktop',
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-500" />
                      {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </div>
          </Card>

          {/* ========== MISSION / VISION / VALUES ========== */}
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                icon: <Target className="size-6" />,
                title: 'Our Mission',
                color: 'bg-blue-50 text-blue-600',
                description:
                  'To make quality education accessible and affordable for every Computer Anudeshak aspirant, regardless of their background or location.',
              },
              {
                icon: <Eye className="size-6" />,
                title: 'Our Vision',
                color: 'bg-emerald-50 text-emerald-600',
                description:
                  'To become the most trusted and comprehensive exam preparation platform, helping thousands of students achieve their career goals.',
              },
              {
                icon: <Heart className="size-6" />,
                title: 'Our Values',
                color: 'bg-rose-50 text-rose-600',
                description:
                  'Quality content, student-first approach, continuous improvement, and transparent communication form the foundation of everything we do.',
              },
            ].map((item) => (
              <Card
                key={item.title}
                className="border-0 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div
                    className={cn(
                      'mb-4 flex size-12 items-center justify-center rounded-xl',
                      item.color
                    )}
                  >
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ========== STATS ========== */}
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
            {[
              { icon: <Users className="size-5" />, value: '10,000+', label: 'Students Enrolled', bg: 'bg-blue-50', text: 'text-blue-600' },
              { icon: <BookOpen className="size-5" />, value: '50+', label: 'Video Courses', bg: 'bg-emerald-50', text: 'text-emerald-600' },
              { icon: <ClipboardList className="size-5" />, value: '100+', label: 'Test Series', bg: 'bg-orange-50', text: 'text-orange-600' },
              { icon: <Award className="size-5" />, value: '95%', label: 'Success Rate', bg: 'bg-purple-50', text: 'text-purple-600' },
            ].map((stat) => (
              <Card key={stat.label} className="border-0 shadow-sm">
                <CardContent className="flex flex-col items-center p-5 text-center">
                  <div className={cn('mb-2 flex size-10 items-center justify-center rounded-lg', stat.bg, stat.text)}>
                    {stat.icon}
                  </div>
                  <p className="text-xl font-extrabold text-gray-900 sm:text-2xl">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ========== CONTACT ========== */}
          <Card className="mt-10 overflow-hidden border-0 shadow-sm">
            <CardContent className="p-6 sm:p-8">
              <h3 className="text-lg font-bold text-gray-900">Contact Us</h3>
              <p className="mt-1 text-sm text-gray-500">
                Have questions? We&apos;re here to help.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-blue-100">
                    <Mail className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-700">{TEACHER_CONFIG.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-green-100">
                    <Phone className="size-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-700">+91 {TEACHER_CONFIG.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-purple-100">
                    <Globe className="size-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Website</p>
                    <p className="text-sm font-medium text-gray-700">{TEACHER_CONFIG.website}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ========== CTA ========== */}
          <div className="mt-10 text-center">
            <Button
              size="lg"
              className="bg-blue-600 font-semibold hover:bg-blue-700"
              onClick={() => setActivePage('home')}
            >
              <GraduationCap className="mr-2 size-5" />
              Start Learning Now
              <ArrowRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
