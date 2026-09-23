'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  HelpCircle,
  BookOpen,
  MessageSquare,
  Mail,
  Phone,
  Search,
  FileText,
  Video,
  ExternalLink,
  Send,
  Keyboard,
  Monitor,
  Headphones,
  Zap,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import { apiFetch } from '@/lib/api-client'

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqs: FAQItem[] = [
  {
    category: 'Getting Started',
    question: 'How do I create a test series?',
    answer: 'Navigate to the Test Portal section using the sidebar, then click the "Add Test Series" button. Fill in the basic details, advanced settings, and pricing & validity tabs to create your test series.',
  },
  {
    category: 'Getting Started',
    question: 'How do I add questions to a test?',
    answer: 'Go to Test Portal, click on a test series to open it, then click "Add" to create a new test. After creating the test, use the "Add Questions" action to open the question editor where you can add MCQ, Numerical, or Comprehension questions.',
  },
  {
    category: 'Getting Started',
    question: 'How do I set up my profile?',
    answer: 'Go to Settings from the sidebar, then update your profile information in the Profile tab. You can change your name, phone number, and avatar. Contact your admin to update your email address.',
  },
  {
    category: 'Test Management',
    question: 'Can I duplicate a test series?',
    answer: 'Yes! Click the three-dot menu next to any test series and select "Duplicate" to create a copy. This copies the test series settings — you\'ll need to add questions to the duplicated tests.',
  },
  {
    category: 'Test Management',
    question: 'How do I edit an existing test series?',
    answer: 'Click the three-dot menu next to the test series and select "Edit". This will open the edit modal where you can update the title, description, pricing, and other settings.',
  },
  {
    category: 'Test Management',
    question: 'How do I import questions in bulk?',
    answer: 'Go to the Test Portal, switch to the "Bulk Uploader" tab. Select the test series and test, download the format template, fill it with your questions, and upload the file.',
  },
  {
    category: 'Results & Reports',
    question: 'How do I view student results?',
    answer: 'Navigate to the Results tab in the Test Portal section. You can filter results by test series, subject, and type. Use the Export button to download results as a file.',
  },
  {
    category: 'Results & Reports',
    question: 'How do I re-evaluate a test attempt?',
    answer: 'Go to the test series content view, find the test, and select "Re-evaluate Attempts" from the actions dropdown. This will re-check all answers against the current answer key.',
  },
  {
    category: 'Results & Reports',
    question: 'Can I export analytics data?',
    answer: 'Yes! Go to the Reports page and use the Export button to download sales, orders, or student data as a JSON file. You can filter by date range before exporting.',
  },
  {
    category: 'Account & Settings',
    question: 'How do I change my password?',
    answer: 'Go to Settings → Security tab, then click "Change Password". Enter your current password and the new password to update it.',
  },
  {
    category: 'Account & Settings',
    question: 'How do I manage categories?',
    answer: 'Go to Settings → Categories tab. You can add, edit, and delete categories for organizing your test series.',
  },
  {
    category: 'Account & Settings',
    question: 'How do I enable two-factor authentication?',
    answer: 'Go to Settings → Security tab and toggle the Two-Factor Authentication switch. This adds an extra layer of security to your account.',
  },
]

const resources = [
  {
    title: 'Documentation',
    description: 'Comprehensive guides and tutorials for using TeachX CMS',
    icon: BookOpen,
    accentBg: 'bg-amber-50',
    accentIcon: 'text-amber-600',
    link: 'https://docs.teachx.in',
  },
  {
    title: 'Video Tutorials',
    description: 'Step-by-step video walkthroughs of key features',
    icon: Video,
    accentBg: 'bg-emerald-50',
    accentIcon: 'text-emerald-600',
    link: 'https://youtube.com/@teachx',
  },
  {
    title: 'API Reference',
    description: 'Technical documentation for API integration',
    icon: FileText,
    accentBg: 'bg-sky-50',
    accentIcon: 'text-sky-600',
    link: 'https://docs.teachx.in/api',
  },
  {
    title: 'Community Forum',
    description: 'Connect with other educators and share best practices',
    icon: MessageSquare,
    accentBg: 'bg-violet-50',
    accentIcon: 'text-violet-600',
    link: 'https://community.teachx.in',
  },
]

const keyboardShortcuts = [
  { keys: ['Ctrl', 'K'], description: 'Open global search' },
  { keys: ['Ctrl', 'N'], description: 'Create new test series' },
  { keys: ['Ctrl', 'E'], description: 'Export current report' },
  { keys: ['Ctrl', '/'], description: 'Show keyboard shortcuts' },
  { keys: ['Escape'], description: 'Close dialog/modal' },
  { keys: ['↑', '↓'], description: 'Navigate table rows' },
  { keys: ['Enter'], description: 'Select/confirm action' },
  { keys: ['Tab'], description: 'Move between form fields' },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [supportSubject, setSupportSubject] = useState('')
  const [supportMessage, setSupportMessage] = useState('')
  const [supportSending, setSupportSending] = useState(false)
  const { userName, userEmail, orgCode } = useAppStore()

  const categories = ['all', ...new Set(faqs.map(f => f.category))]

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = !searchQuery ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleSupportSubmit = async () => {
    if (!supportSubject.trim()) {
      toast.error('Please enter a subject')
      return
    }
    if (!supportMessage.trim()) {
      toast.error('Please enter a message')
      return
    }

    setSupportSending(true)
    try {
      const res = await apiFetch('/api/support-queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: supportSubject,
          message: supportMessage,
          studentName: userName || 'Teacher',
          studentEmail: userEmail || '',
          organizationId: orgCode,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('Support query submitted successfully! We\'ll get back to you soon.')
        setSupportSubject('')
        setSupportMessage('')
      } else {
        toast.error(data.error || 'Failed to submit support query')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSupportSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">Help Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">Find answers, access resources, and contact support</p>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for help..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-11"
        />
      </div>

      {/* Quick Resources */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {resources.map((resource) => {
          const Icon = resource.icon
          return (
            <Card
              key={resource.title}
              className="rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => {
                if (resource.link && resource.link !== '#') {
                  window.open(resource.link, '_blank')
                } else {
                  toast.info(`${resource.title} — Opening soon!`)
                }
              }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className={`flex size-11 shrink-0 items-center justify-center rounded-full ${resource.accentBg}`}>
                    <Icon className={`size-5 ${resource.accentIcon}`} />
                  </div>
                  <ExternalLink className="size-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mt-3 group-hover:text-amber-600 transition-colors">
                  {resource.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{resource.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* FAQ Section */}
      <Card className="rounded-xl bg-white shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <HelpCircle className="size-5 text-amber-500" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription className="mt-1">Find quick answers to common questions</CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  className={selectedCategory === cat
                    ? 'bg-amber-500 hover:bg-amber-600 text-white h-8'
                    : 'h-8'
                  }
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat === 'all' ? 'All' : cat}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFAQs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <HelpCircle className="mx-auto h-11 w-11 text-gray-300 mb-2" />
              <p className="text-sm">No matching questions found</p>
              <p className="text-xs mt-1">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {filteredFAQs.map((faq, idx) => (
                <AccordionItem key={idx} value={`faq-${idx}`} className="border-b last:border-b-0">
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <div className="flex items-center gap-3 text-left">
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 shrink-0 text-xs px-1.5">
                        {faq.category}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4 pl-2">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card className="rounded-xl bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Keyboard className="size-5 text-amber-500" />
            Keyboard Shortcuts
          </CardTitle>
          <CardDescription>Speed up your workflow with these shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {keyboardShortcuts.map((shortcut, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <span className="text-sm text-gray-700">{shortcut.description}</span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, ki) => (
                    <React.Fragment key={ki}>
                      {ki > 0 && <span className="text-xs text-gray-400">+</span>}
                      <kbd className="inline-flex h-7 items-center rounded border border-gray-300 bg-white px-2 text-xs font-medium text-gray-700 shadow-sm">
                        {key}
                      </kbd>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Contact Methods */}
        <Card className="rounded-xl bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Headphones className="size-5 text-amber-500" />
              Contact Support
            </CardTitle>
            <CardDescription>Reach out to our support team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
              <div className="flex size-10 items-center justify-center rounded-full bg-amber-50 shrink-0">
                <Mail className="size-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Email Support</p>
                <p className="text-xs text-muted-foreground">support@teachx.in</p>
              </div>
              <ChevronRight className="size-4 text-gray-400 group-hover:text-amber-500 transition-colors" />
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
              <div className="flex size-10 items-center justify-center rounded-full bg-emerald-50 shrink-0">
                <Phone className="size-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Phone Support</p>
                <p className="text-xs text-muted-foreground">+91 98765 43210</p>
              </div>
              <ChevronRight className="size-4 text-gray-400 group-hover:text-amber-500 transition-colors" />
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group">
              <div className="flex size-10 items-center justify-center rounded-full bg-sky-50 shrink-0">
                <MessageSquare className="size-5 text-sky-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">Live Chat</p>
                <p className="text-xs text-muted-foreground">Mon–Fri, 9am–6pm IST</p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Online</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Support Form */}
        <Card className="rounded-xl bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Zap className="size-5 text-amber-500" />
              Send a Message
            </CardTitle>
            <CardDescription>Submit a support query and we&apos;ll get back to you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="support-subject">Subject *</Label>
              <Input
                id="support-subject"
                value={supportSubject}
                onChange={(e) => setSupportSubject(e.target.value)}
                placeholder="Brief description of your issue"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-message">Message *</Label>
              <Textarea
                id="support-message"
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="Describe your issue or question in detail..."
                rows={5}
              />
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <Mail className="size-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700">
                Response will be sent to <strong>{userEmail || 'your email'}</strong>
              </p>
            </div>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white gap-2 w-full"
              onClick={handleSupportSubmit}
              disabled={supportSending || !supportSubject.trim() || !supportMessage.trim()}
            >
              {supportSending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Submit Query
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
