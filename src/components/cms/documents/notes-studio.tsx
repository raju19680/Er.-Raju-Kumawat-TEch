'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Sigma,
  Table as TableIcon,
  Sparkles,
  Download,
  Printer,
  Eye,
  FileText,
  Save,
  Lock,
  Unlock,
  Shield,
  Search,
  BookOpen,
  Maximize2,
  Minimize2,
  Check,
  HelpCircle,
  Lightbulb,
  AlertTriangle,
  Info,
  Clock,
  Layers,
  Share2,
  Trash2,
  Plus,
  ArrowLeft,
  Calendar,
  Tag,
  Bookmark,
} from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'

interface NotesStudioProps {
  initialDocument?: any
  onBack: () => void
  onSaved: () => void
}

const MATH_PRESETS = [
  { label: 'Quadratic Formula', formula: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
  { label: 'Definite Integral', formula: '\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)' },
  { label: 'Limit Identity', formula: '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1' },
  { label: 'Einstein Energy', formula: 'E = mc^2' },
  { label: 'Pythagorean Theorem', formula: 'a^2 + b^2 = c^2' },
  { label: 'Matrix 2x2', formula: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
]

export function NotesStudio({ initialDocument, onBack, onSaved }: NotesStudioProps) {
  const [title, setTitle] = useState(initialDocument?.title || '')
  const [description, setDescription] = useState(initialDocument?.description || '')
  const [category, setCategory] = useState(initialDocument?.category || 'Notes')
  const [content, setContent] = useState(initialDocument?.content || '')
  const [isPublic, setIsPublic] = useState(initialDocument?.isPublic ?? true)
  const [allowDownload, setAllowDownload] = useState(initialDocument?.allowDownload ?? false)
  const [passwordProtected, setPasswordProtected] = useState(initialDocument?.passwordProtected ?? false)
  const [tags, setTags] = useState<string>(
    Array.isArray(initialDocument?.tags)
      ? initialDocument.tags.join(', ')
      : initialDocument?.tags || ''
  )
  
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')
  const [searchQuery, setSearchQuery] = useState('')
  const [showMathDialog, setShowMathDialog] = useState(false)
  const [customMath, setCustomMath] = useState('')

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Document Stats Calculation
  const stats = useMemo(() => {
    const text = content.trim()
    const words = text ? text.split(/\s+/).length : 0
    const characters = text.length
    const readingTime = Math.ceil(words / 200) || 1
    const headingMatches = text.match(/^#{1,3}\s+(.+)$/gm) || []
    const headings = headingMatches.map(h => {
      const level = h.match(/^#+/)?.[0].length || 1
      const label = h.replace(/^#+\s+/, '')
      return { level, label }
    })
    return { words, characters, readingTime, headings }
  }, [content])

  // Insert helper to add markdown syntax at cursor position
  const insertText = (before: string, after: string = '', defaultPlaceholder: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.substring(start, end) || defaultPlaceholder
    const replacement = `${before}${selected}${after}`

    const newContent = content.substring(0, start) + replacement + content.substring(end)
    setContent(newContent)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selected.length
      )
    }, 0)
  }

  // Insert Preformatted Callout Block
  const insertCallout = (type: 'tip' | 'warning' | 'info' | 'formula') => {
    let calloutText = ''
    switch (type) {
      case 'tip':
        calloutText = '\n> 💡 **PRO TIP:** Remember that friction always opposes relative motion between surfaces.\n'
        break
      case 'warning':
        calloutText = '\n> ⚠️ **EXAM WARNING:** Do not forget to convert units to SI (e.g. cm to meters) before applying formula!\n'
        break
      case 'info':
        calloutText = '\n> ℹ️ **KEY CONCEPT:** Standard Temperature and Pressure (STP) is defined as 273.15 K and 1 bar.\n'
        break
      case 'formula':
        calloutText = '\n> 📌 **CRITICAL FORMULA:**\n> $$v = u + at$$\n> $$s = ut + \\frac{1}{2}at^2$$\n> $$v^2 = u^2 + 2as$$\n'
        break
    }
    insertText(calloutText)
  }

  // Insert Code Block
  const insertCodeBlock = (lang: string = 'python') => {
    const code = `\n\`\`\`${lang}\n# Interactive Python Demonstration\ndef calculate_energy(mass_kg):\n    c = 3e8  # speed of light in m/s\n    return mass_kg * (c ** 2)\n\nprint("Energy:", calculate_energy(1.0))\n\`\`\`\n`
    insertText(code)
  }

  // Insert Checklist Item
  const insertChecklist = () => {
    const checklist = '\n- [ ] Step 1: Review chapter theory and definitions\n- [ ] Step 2: Memorize key formulas\n- [ ] Step 3: Solve 10 standard numerical questions\n- [ ] Step 4: Attempt mock test series\n'
    insertText(checklist)
  }

  // Handle LaTeX Math Preset Selection
  const handleInsertMath = (formula: string) => {
    insertText(`\n$$\n${formula}\n$$\n`)
    setShowMathDialog(false)
  }

  // Save Document to Backend
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Document title is required')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        content,
        fileType: 'doc',
        isPublic,
        allowDownload,
        passwordProtected,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      }

      let res
      if (initialDocument?.id) {
        res = await apiFetch(`/api/teacher/documents/${initialDocument.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      } else {
        res = await apiFetch('/api/teacher/documents', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      if (res.ok || res.status < 400) {
        toast.success(initialDocument?.id ? 'Document updated successfully' : 'Document published successfully!')
        setLastSaved(new Date())
        onSaved()
      } else {
        toast.error('Failed to save document. Please try again.')
      }
    } catch (err) {
      console.error('Save error:', err)
      toast.error('Error saving document.')
    } finally {
      setIsSaving(false)
    }
  }

  // Print / PDF Export
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className={`flex flex-col bg-white ${isFullscreen ? 'fixed inset-0 z-50 p-6' : 'min-h-[750px] rounded-xl border'}`}>
      {/* ── Studio Header Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b bg-gray-50/50">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-base">Interactive Notes & Docs Studio</span>
              <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 text-xs">
                PRO EDITOR
              </Badge>
            </div>
            <p className="text-xs text-gray-500">
              {lastSaved ? `Last saved at ${lastSaved.toLocaleTimeString()}` : 'Unsaved changes'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg">
            <Button
              variant={activeTab === 'editor' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={() => setActiveTab('editor')}
            >
              <FileText className="h-3.5 w-3.5 mr-1" />
              Editor
            </Button>
            <Button
              variant={activeTab === 'preview' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={() => setActiveTab('preview')}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Preview Mode
            </Button>
          </div>

          <Button variant="outline" size="sm" className="h-9 gap-1" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" />
            Print / PDF
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          <Button
            size="sm"
            className="h-8 bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-3.5 w-3.5" />
            {isSaving ? 'Saving...' : 'Save & Publish'}
          </Button>
        </div>
      </div>

      {/* ── Metadata Strip ── */}
      <div className="p-4 bg-white border-b grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 space-y-1">
          <Label className="text-xs font-medium text-gray-600">Document Title *</Label>
          <Input
            placeholder="e.g. Chapter 4: Laws of Motion & Momentum Master Notes"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-medium text-sm"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-medium text-gray-600">Category / Subject</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Notes">Comprehensive Notes</SelectItem>
              <SelectItem value="Study Material">Study Material</SelectItem>
              <SelectItem value="Formula Sheet">Formula Sheet</SelectItem>
              <SelectItem value="Question Paper">Question Bank & Solutions</SelectItem>
              <SelectItem value="Syllabus">Syllabus & Roadmap</SelectItem>
              <SelectItem value="Other">Reference Guide</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-medium text-gray-600">Tags (comma separated)</Label>
          <Input
            placeholder="Physics, Mechanics, JEE 2025"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="text-sm"
          />
        </div>
      </div>

      {/* ── Security & Distribution Bar ── */}
      <div className="px-4 py-2 bg-amber-50/40 border-b flex flex-wrap items-center justify-between text-xs gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch checked={isPublic} onCheckedChange={setIsPublic} id="public-switch" />
            <Label htmlFor="public-switch" className="cursor-pointer font-medium text-gray-700">
              {isPublic ? 'Publicly Visible to Students' : 'Private (Teacher Only)'}
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={allowDownload} onCheckedChange={setAllowDownload} id="download-switch" />
            <Label htmlFor="download-switch" className="cursor-pointer font-medium text-gray-700">
              Allow Student PDF Download
            </Label>
          </div>

          {allowDownload && (
            <div className="flex items-center gap-2 text-amber-800">
              <Switch checked={passwordProtected} onCheckedChange={setPasswordProtected} id="pwd-switch" />
              <Label htmlFor="pwd-switch" className="cursor-pointer font-medium">
                PIN-Protect Download (Mobile No.)
              </Label>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-gray-500 font-mono text-xs">
          <span>{stats.words} words</span>
          <span>{stats.characters} chars</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {stats.readingTime} min read
          </span>
        </div>
      </div>

      {/* ── Rich Formatting Toolbar ── */}
      {activeTab === 'editor' && (
        <div className="p-2 border-b bg-gray-50 flex flex-wrap items-center gap-1.5 overflow-x-auto select-none">
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => insertText('# ', '', 'Heading 1')} title="Heading 1">
            <Heading1 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => insertText('## ', '', 'Heading 2')} title="Heading 2">
            <Heading2 className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => insertText('### ', '', 'Heading 3')} title="Heading 3">
            <Heading3 className="h-3.5 w-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => insertText('**', '**', 'Bold text')} title="Bold">
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => insertText('*', '*', 'Italic text')} title="Italic">
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => insertText('<u>', '</u>', 'Underlined text')} title="Underline">
            <Underline className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => insertText('~~', '~~', 'Strikethrough')} title="Strikethrough">
            <Strikethrough className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1 text-amber-700 bg-amber-50 hover:bg-amber-100" onClick={() => insertText('==', '==', 'Highlight key point')} title="Highlight">
            <Sparkles className="h-3 w-3" />
            Highlight
          </Button>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => insertText('- ', '', 'List item')} title="Bullet List">
            <List className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => insertText('1. ', '', 'Numbered item')} title="Numbered List">
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1" onClick={insertChecklist} title="Insert To-Do Checklist">
            <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
            Checklist
          </Button>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1 text-purple-700 bg-purple-50 hover:bg-purple-100" onClick={() => setShowMathDialog(true)}>
            <Sigma className="h-3.5 w-3.5" />
            LaTeX Math Formula
          </Button>

          <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => insertCodeBlock('python')}>
            <Code className="h-3.5 w-3.5 text-blue-600" />
            Code Block
          </Button>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100" onClick={() => insertCallout('tip')}>
            <Lightbulb className="h-3.5 w-3.5" />
            Pro Tip
          </Button>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1 text-amber-700 bg-amber-50 hover:bg-amber-100" onClick={() => insertCallout('warning')}>
            <AlertTriangle className="h-3.5 w-3.5" />
            Exam Warning
          </Button>
          <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1 text-blue-700 bg-blue-50 hover:bg-blue-100" onClick={() => insertCallout('formula')}>
            <Bookmark className="h-3.5 w-3.5" />
            Formula Box
          </Button>
        </div>
      )}

      {/* ── Main Workspace Body ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Table of Contents & Headings Outline (Left Sidebar) */}
        <div className="hidden lg:block lg:col-span-3 border-r bg-gray-50/50 p-4 overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-4 w-4 text-gray-500" />
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Document Outline</h4>
          </div>

          {stats.headings.length === 0 ? (
            <div className="text-xs text-gray-400 p-4 border border-dashed rounded-lg text-center">
              Add headings with H1 (#), H2 (##) or H3 (###) to generate an instant Table of Contents.
            </div>
          ) : (
            <div className="space-y-1.5">
              {stats.headings.map((h, idx) => (
                <div
                  key={idx}
                  className={`text-xs text-gray-700 hover:text-amber-600 cursor-pointer truncate transition-colors py-1 ${
                    h.level === 1 ? 'font-semibold pl-1 border-l-2 border-amber-500' :
                    h.level === 2 ? 'pl-3 text-gray-600' : 'pl-5 text-gray-500 italic'
                  }`}
                  onClick={() => {
                    // search or jump
                    const textarea = textareaRef.current
                    if (textarea) {
                      const pos = content.indexOf(h.label)
                      if (pos !== -1) {
                        textarea.focus()
                        textarea.setSelectionRange(pos, pos + h.label.length)
                      }
                    }
                  }}
                >
                  {h.label}
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-1.5 text-blue-800 font-semibold text-xs mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              Pro Tips
            </div>
            <p className="text-xs text-blue-700 leading-relaxed">
              Use LaTeX syntax for formulas (e.g. <code className="bg-blue-100 px-1 rounded">$$E=mc^2$$</code>). Notes will render with sharp math typography on students' devices.
            </p>
          </div>
        </div>

        {/* Center Content Editor / Live Preview */}
        <div className="lg:col-span-9 flex flex-col h-full overflow-hidden bg-white">
          {activeTab === 'editor' ? (
            <div className="flex-1 p-6 overflow-y-auto">
              <Textarea
                ref={textareaRef}
                placeholder="Start writing comprehensive study notes, formulas, step-by-step concepts, and numerical solutions..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full min-h-[550px] border-0 focus-visible:ring-0 resize-none font-mono text-sm leading-relaxed text-gray-800 p-0"
              />
            </div>
          ) : (
            /* ── Interactive Live Preview Mode ── */
            <div className="flex-1 p-8 overflow-y-auto max-w-4xl mx-auto w-full prose prose-amber">
              <div className="border-b pb-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300">
                    {category}
                  </Badge>
                  <span className="text-xs text-gray-400">• {stats.readingTime} min read</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{title || 'Untitled Document'}</h1>
                {description && <p className="text-sm text-gray-600 italic">{description}</p>}
              </div>

              <div className="space-y-4 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {content ? (
                  content.split('\n\n').map((block, idx) => {
                    // Heading 1
                    if (block.startsWith('# ')) {
                      return <h2 key={idx} className="text-xl font-bold text-gray-900 pt-4 border-b pb-2">{block.replace('# ', '')}</h2>
                    }
                    // Heading 2
                    if (block.startsWith('## ')) {
                      return <h3 key={idx} className="text-lg font-semibold text-gray-800 pt-3">{block.replace('## ', '')}</h3>
                    }
                    // Heading 3
                    if (block.startsWith('### ')) {
                      return <h4 key={idx} className="text-base font-semibold text-gray-800 pt-2">{block.replace('### ', '')}</h4>
                    }
                    // Callouts
                    if (block.startsWith('> ')) {
                      return (
                        <div key={idx} className="p-3 bg-amber-50/70 border-l-4 border-amber-500 rounded-r-lg text-amber-950 font-medium my-2">
                          {block.replace(/^>\s*/gm, '')}
                        </div>
                      )
                    }
                    // Code block
                    if (block.startsWith('```')) {
                      const cleanCode = block.replace(/```[a-z]*\n?/gi, '')
                      return (
                        <pre key={idx} className="p-4 bg-gray-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto shadow-inner">
                          <code>{cleanCode}</code>
                        </pre>
                      )
                    }
                    // Math formula block
                    if (block.startsWith('$$') && block.endsWith('$$')) {
                      const mathContent = block.replace(/\$\$/g, '').trim()
                      return (
                        <div key={idx} className="my-4 p-4 bg-purple-50/60 border border-purple-200 rounded-xl text-center font-mono text-purple-900 text-base shadow-sm">
                          {mathContent}
                        </div>
                      )
                    }
                    // Checklists
                    if (block.includes('- [ ]') || block.includes('- [x]')) {
                      const items = block.split('\n')
                      return (
                        <div key={idx} className="space-y-1.5 my-2">
                          {items.map((it, i) => {
                            const checked = it.includes('- [x]')
                            const text = it.replace(/- \[[ x]\]\s*/, '')
                            return (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <span className={`w-4 h-4 rounded flex items-center justify-center border ${checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300'}`}>
                                  {checked && <Check className="h-3 w-3" />}
                                </span>
                                <span className={checked ? 'line-through text-gray-400' : 'text-gray-800'}>{text}</span>
                              </div>
                            )
                          })}
                        </div>
                      )
                    }
                    return <p key={idx} className="my-2">{block}</p>
                  })
                ) : (
                  <p className="text-gray-400 italic">No content written yet. Switch to the Editor tab to start typing.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── LaTeX Math Preset Modal ── */}
      <Dialog open={showMathDialog} onOpenChange={setShowMathDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sigma className="h-5 w-5 text-purple-600" />
              Insert LaTeX Math Formula
            </DialogTitle>
            <DialogDescription>
              Select a standard formula preset or enter your custom LaTeX equation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700">Quick Presets</Label>
              <div className="grid grid-cols-1 gap-2">
                {MATH_PRESETS.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleInsertMath(p.formula)}
                    className="p-3 rounded-lg border hover:border-purple-400 hover:bg-purple-50/50 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div>
                      <span className="font-medium text-xs text-gray-900 block">{p.label}</span>
                      <code className="text-xs text-purple-700 font-mono">{p.formula}</code>
                    </div>
                    <Plus className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <Label className="text-xs font-semibold text-gray-700">Custom LaTeX Expression</Label>
              <Textarea
                placeholder="e.g. \sum_{i=1}^{n} i = \frac{n(n+1)}{2}"
                value={customMath}
                onChange={(e) => setCustomMath(e.target.value)}
                className="font-mono text-xs"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowMathDialog(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => {
                if (customMath.trim()) handleInsertMath(customMath.trim())
              }}
              disabled={!customMath.trim()}
            >
              Insert Formula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
