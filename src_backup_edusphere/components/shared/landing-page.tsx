'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useUIStore } from '@/lib/store'
import { AuthScreen } from '@/components/auth/auth-screen'
import { 
  GraduationCap, BookOpen, ClipboardList, FileText, Users, TrendingUp, 
  DollarSign, Globe, Shield, Zap, Star, CheckCircle2, ArrowRight, 
  Sparkles, BarChart3, Award, Bell, Menu, X, Moon, Sun
} from 'lucide-react'

export function LandingPage() {
  const setAuthMode = useUIStore((s) => s.setAuthMode)
  const authMode = useUIStore((s) => s.authMode)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (authMode === 'login' || authMode === 'register') {
    return <AuthScreen />
  }

  const features = [
    { icon: BookOpen, title: 'Course Builder', desc: 'Create structured courses with video lessons, content, and quizzes. Publish when ready.', color: 'from-emerald-500 to-teal-600' },
    { icon: ClipboardList, title: 'Test Series', desc: 'Build MCQ tests with auto-grading, timers, and detailed performance analytics.', color: 'from-amber-500 to-orange-600' },
    { icon: FileText, title: 'Digital Notes', desc: 'Sell premium study notes and materials. Students get instant access after purchase.', color: 'from-rose-500 to-pink-600' },
    { icon: Globe, title: 'Teacher Websites', desc: 'Every teacher gets a unique public website with their own URL and branding.', color: 'from-cyan-500 to-blue-600' },
    { icon: BarChart3, title: 'Analytics', desc: 'Track enrollments, revenue, student progress, and content performance in real-time.', color: 'from-purple-500 to-indigo-600' },
    { icon: Users, title: 'Student Management', desc: 'Manage your students, track their progress, and monitor their test performance.', color: 'from-green-500 to-emerald-600' },
  ]

  const stats = [
    { value: '10K+', label: 'Active Students' },
    { value: '500+', label: 'Expert Teachers' },
    { value: '5K+', label: 'Courses Published' },
    { value: '98%', label: 'Satisfaction Rate' },
  ]

  const pricingPlans = [
    {
      name: 'Starter',
      price: '₹0',
      period: 'Free Forever',
      desc: 'Perfect for getting started',
      features: ['Up to 3 courses', 'Up to 50 students', 'Basic analytics', 'Community support'],
      cta: 'Get Started',
      highlighted: false,
    },
    {
      name: 'Professional',
      price: '₹999',
      period: 'per month',
      desc: 'For growing educators',
      features: ['Unlimited courses', 'Unlimited students', 'Advanced analytics', 'Custom branding', 'Priority support', 'Test series & notes', 'Certificates'],
      cta: 'Start Free Trial',
      highlighted: true,
    },
    {
      name: 'Institution',
      price: '₹4,999',
      period: 'per month',
      desc: 'For coaching institutes',
      features: ['Everything in Pro', 'Multiple teacher accounts', 'White-label solution', 'API access', 'Dedicated manager', 'Custom integrations'],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ]

  const testimonials = [
    { name: 'Dr. Rajesh Kumar', role: 'Physics Teacher', content: 'EduSphere transformed my teaching business. I now reach 500+ students across India with my courses and test series.', avatar: 'RK', rating: 5 },
    { name: 'Priya Sharma', role: 'JEE Aspirant', content: 'The mock tests and study notes are exactly what I needed. The platform is so easy to use and the certificates are a great motivation!', avatar: 'PS', rating: 5 },
    { name: 'Arun Gupta', role: 'Coaching Institute Owner', content: 'Managing 15 teachers and 2000 students was chaos before. EduSphere centralized everything - from content to payments.', avatar: 'AG', rating: 5 },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">EduSphere</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
              <Button variant="ghost" size="sm" onClick={() => setAuthMode('login')}>Sign In</Button>
              <Button size="sm" onClick={() => setAuthMode('register')} className="bg-emerald-600 hover:bg-emerald-700">Get Started</Button>
            </div>
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t space-y-3">
              <a href="#features" className="block text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <a href="#pricing" className="block text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
              <a href="#testimonials" className="block text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setAuthMode('login'); setMobileMenuOpen(false) }}>Sign In</Button>
                <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => { setAuthMode('register'); setMobileMenuOpen(false) }}>Get Started</Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/20 dark:via-teal-950/20 dark:to-cyan-950/20" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-300/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-300/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900">
              <Sparkles className="w-3 h-3 mr-1" />
              India's #1 Education SaaS Platform
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Turn Your Knowledge Into a Thriving Education Business
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Create and sell courses, test series, and study notes. Every teacher gets their own CMS portal, 
              website, and student management system — all in one powerful platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => setAuthMode('register')} className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 h-14">
                Start Teaching Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => setAuthMode('login')} className="text-lg px-8 h-14">
                <GraduationCap className="w-5 h-5 mr-2" /> I'm a Student
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> No credit card required</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Setup in 2 minutes</div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Everything you need to <span className="text-emerald-600">teach online</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              From course creation to student management, revenue tracking to certificates — we've got you covered.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-emerald-200 dark:hover:border-emerald-900">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Get started in 3 simple steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Shield, title: 'Admin Onboards Teachers', desc: 'Platform admin adds teachers with unique organisation IDs and login credentials.' },
              { step: '02', icon: BookOpen, title: 'Teachers Create Content', desc: 'Teachers log into their CMS portal and build courses, tests, and notes.' },
              { step: '03', icon: Award, title: 'Students Learn & Achieve', desc: 'Students enroll, learn, take tests, earn certificates, and achieve their goals.' },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="text-6xl font-bold text-emerald-600/10 mb-4">{item.step}</div>
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-muted-foreground">Choose the plan that's right for you. No hidden fees.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <Card 
                key={plan.name} 
                className={`relative ${plan.highlighted ? 'border-emerald-600 border-2 shadow-xl scale-105' : ''}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-600">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground ml-2">{plan.period}</span>
                  </div>
                  <Button 
                    className={`w-full mb-6 ${plan.highlighted ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                    variant={plan.highlighted ? 'default' : 'outline'}
                    onClick={() => setAuthMode('register')}
                  >
                    {plan.cta}
                  </Button>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4">Testimonials</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Loved by educators and students</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <Card key={t.name}>
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">"{t.content}"</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-semibold">
                        {t.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-12 lg:p-16 text-center text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
            <div className="relative z-10">
              <Zap className="w-12 h-12 mx-auto mb-4" />
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">Ready to transform your teaching?</h2>
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of educators who are already growing their business with EduSphere.
              </p>
              <Button size="lg" variant="secondary" onClick={() => setAuthMode('register')} className="text-lg px-8 h-14 bg-white text-emerald-700 hover:bg-white/90">
                Get Started for Free <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg">EduSphere</span>
              </div>
              <p className="text-sm text-muted-foreground">The complete SaaS platform for educators to teach, sell, and grow.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground">Test Series</a></li>
                <li><a href="#" className="hover:text-foreground">Courses</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Careers</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground">Refund Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            © 2025 EduSphere. All rights reserved. Built with ❤️ for educators.
          </div>
        </div>
      </footer>
    </div>
  )
}
