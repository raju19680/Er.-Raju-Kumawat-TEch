import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Carousel, CarouselContent, CarouselItem, type CarouselApi,
} from '@/components/ui/carousel'
import { PortalData } from './types'

const BLUE = '#2563EB'
const heroGradients = [
  'from-blue-700 via-blue-600 to-indigo-500',
  'from-indigo-700 via-blue-600 to-sky-500',
  'from-blue-800 via-blue-500 to-cyan-400',
]

export function HeroBanner({ data }: { data: PortalData }) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const bannerSlides = data.banners.length > 0
    ? data.banners.map((b, i) => ({
        id: b.id, title: b.title, subtitle: `Welcome to ${data.organization.name}`,
        cta: 'Explore Now', gradient: heroGradients[i % heroGradients.length], image: b.image, link: b.link,
      }))
    : [
        { id: 'd1', title: `Welcome to ${data.organization.name}`, subtitle: 'Discover courses crafted by expert educators', cta: 'Explore Courses', gradient: heroGradients[0], image: null, link: null },
        { id: 'd2', title: 'Ace Your Exams with Test Series', subtitle: 'Practice with comprehensive mock tests', cta: 'Start Testing', gradient: heroGradients[1], image: null, link: null },
        { id: 'd3', title: 'Learn Anytime, Anywhere', subtitle: 'Access study material on the go', cta: 'Get Started', gradient: heroGradients[2], image: null, link: null },
      ]

  useEffect(() => {
    if (!api) return
    const h = () => setCurrent(api.selectedScrollSnap())
    api.on('select', h)
    return () => { api.off('select', h) }
  }, [api])

  useEffect(() => {
    if (!api) return
    const i = setInterval(() => api.scrollNext(), 5000)
    return () => clearInterval(i)
  }, [api])

  return (
    <section className="w-full">
      <Carousel setApi={setApi} opts={{ loop: true, align: 'start' }} className="w-full">
        <CarouselContent>
          {bannerSlides.map(banner => (
            <CarouselItem key={banner.id}>
              <div className={`relative overflow-hidden bg-gradient-to-r ${banner.gradient} rounded-xl sm:rounded-2xl mx-4 sm:mx-6 lg:mx-8 my-4 sm:my-6`}>
                <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10" />
                <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/10" />
                {banner.image && (
                  <img src={banner.image} alt={banner.title} className="absolute inset-0 w-full h-full object-cover opacity-20" />
                )}
                <div className="relative z-10 px-6 py-12 sm:px-12 sm:py-16 lg:px-20 lg:py-20 flex flex-col items-start gap-4 sm:gap-6">
                  <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight max-w-xl">{banner.title}</motion.h1>
                  <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="text-white/90 text-sm sm:text-base max-w-lg">{banner.subtitle}</motion.p>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Button size="lg" className="bg-white text-blue-700 hover:bg-white/90 font-semibold rounded-lg shadow-lg mt-2">
                      {banner.cta} <ArrowRight className="size-4 ml-1" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      <div className="flex items-center justify-center gap-2 mt-2 mb-4">
        {bannerSlides.map((_, idx) => (
          <button key={idx} className={`h-2 rounded-full transition-all duration-300 ${idx === current ? 'w-8' : 'w-2 bg-gray-300'}`}
            style={idx === current ? { backgroundColor: BLUE } : undefined} aria-label={`Slide ${idx + 1}`} />
        ))}
      </div>
    </section>
  )
}
