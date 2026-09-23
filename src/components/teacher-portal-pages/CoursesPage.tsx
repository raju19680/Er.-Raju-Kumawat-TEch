'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStudentStore } from '@/lib/student-store'
import {
  Star,
  Users,
  Clock,
  BookOpen,
  Monitor,
  ClipboardList,
} from 'lucide-react'

const courses = [
  {
    id: '1',
    title: 'Computer Fundamentals (कम्प्यूटर मूल बातें)',
    description:
      'Complete course on Computer Fundamentals covering Input/Output devices, Memory, Hardware & Software concepts as per Computer Anudeshak syllabus.',
    category: 'Basics',
    price: 499,
    mrp: 999,
    rating: 4.8,
    students: 2400,
    duration: '40+ Hours',
    lessons: 65,
    thumbnail: 'from-blue-500 to-cyan-600',
  },
  {
    id: '2',
    title: 'Operating Systems (ऑपरेटिंग सिस्टम)',
    description:
      'In-depth course on Windows, Linux & OS concepts including process management, memory management, and file systems for exam preparation.',
    category: 'Advanced',
    price: 599,
    mrp: 1299,
    rating: 4.7,
    students: 1800,
    duration: '35+ Hours',
    lessons: 52,
    thumbnail: 'from-indigo-500 to-purple-600',
  },
  {
    id: '3',
    title: 'Computer Networks (कम्प्यूटर नेटवर्क)',
    description:
      'Learn networking fundamentals — OSI Model, TCP/IP, LAN/WAN, Network Protocols & Security for Computer Anudeshak exam.',
    category: 'Advanced',
    price: 499,
    mrp: 999,
    rating: 4.6,
    students: 1500,
    duration: '30+ Hours',
    lessons: 48,
    thumbnail: 'from-emerald-500 to-teal-600',
  },
  {
    id: '4',
    title: 'Database Management (डेटाबेस प्रबंधन)',
    description:
      'Master DBMS concepts including SQL, Normalization, ER Diagrams, and Relational Model with practical examples.',
    category: 'Core',
    price: 399,
    mrp: 799,
    rating: 4.9,
    students: 2100,
    duration: '25+ Hours',
    lessons: 40,
    thumbnail: 'from-orange-500 to-red-600',
  },
  {
    id: '5',
    title: 'Programming in C (C प्रोग्रामिंग)',
    description:
      'Complete C Programming course with loops, arrays, pointers, structures, and file handling — specially designed for Anudeshak exam.',
    category: 'Core',
    price: 349,
    mrp: 699,
    rating: 4.5,
    students: 2800,
    duration: '45+ Hours',
    lessons: 70,
    thumbnail: 'from-violet-500 to-purple-700',
  },
  {
    id: '6',
    title: 'MS Office Complete (MS ऑफिस सम्पूर्ण)',
    description:
      'Learn Word, Excel, PowerPoint, and Access with hands-on practical examples. Essential for Computer Anudeshak practical exam.',
    category: 'Practical',
    price: 299,
    mrp: 599,
    rating: 4.8,
    students: 3200,
    duration: '20+ Hours',
    lessons: 35,
    thumbnail: 'from-rose-500 to-pink-600',
  },
]

const filters = ['All', 'Basics', 'Core', 'Advanced', 'Practical']

export default function CoursesPage() {
  const { setActivePage } = useStudentStore()
  const [activeFilter, setActiveFilter] = React.useState('All')

  const filtered =
    activeFilter === 'All'
      ? courses
      : courses.filter((c) => c.category === activeFilter)

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
            COURSES
          </h1>
          <p className="mt-3 text-base text-blue-100 sm:text-lg">
            Comprehensive video courses for Computer Anudeshak exam preparation
          </p>
        </div>
      </section>

      {/* ========== FILTERS ========== */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                  activeFilter === filter
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ========== COURSE GRID ========== */}
      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => (
              <Card
                key={course.id}
                className="group overflow-hidden border-0 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Video Thumbnail */}
                <div
                  className={cn(
                    'relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br',
                    course.thumbnail
                  )}
                >
                  {/* YouTube-style play button */}
                  <div className="flex size-14 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-transform group-hover:scale-110">
                    <div className="ml-1 flex size-0 items-center border-y-[10px] border-l-[16px] border-y-transparent border-l-white" />
                  </div>

                  {/* Category badge */}
                  <Badge className="absolute left-3 top-3 border-0 bg-white/90 text-xs font-bold text-gray-700">
                    {course.category}
                  </Badge>

                  {/* Lesson count */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    <Monitor className="size-3" />
                    {course.lessons} Lessons
                  </div>

                  {/* Duration */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    <Clock className="size-3" />
                    {course.duration}
                  </div>
                </div>

                <CardContent className="p-4 sm:p-5">
                  <h3 className="text-base font-bold leading-snug text-gray-900 group-hover:text-blue-600">
                    {course.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Rating & Students */}
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Star className="size-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold text-gray-700">{course.rating}</span>
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <Users className="size-3.5" />
                      {course.students.toLocaleString()}
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-xl font-bold text-gray-900">
                      ₹{course.price}
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      ₹{course.mrp}
                    </span>
                    <Badge className="border-0 bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                      {discount(course.price, course.mrp)}% OFF
                    </Badge>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-blue-600 font-semibold hover:bg-blue-700"
                      onClick={() => setActivePage('courses')}
                    >
                      View Content
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-blue-200 font-semibold text-blue-600 hover:bg-blue-50"
                      onClick={() => setActivePage('test-series')}
                    >
                      <ClipboardList className="mr-1 size-3.5" />
                      Try Free Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <BookOpen className="mx-auto size-12 text-gray-300" />
              <p className="mt-4 text-lg font-medium text-gray-500">
                No courses found in this category
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
