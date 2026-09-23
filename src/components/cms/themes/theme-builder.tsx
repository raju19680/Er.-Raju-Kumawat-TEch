'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Save,
  Send,
  Palette,
  Type,
  Paintbrush,
  LayoutGrid,
  FileText,
  BarChart3,
  Image,
  Accessibility,
  Eye,
  Monitor,
  Tablet,
  Smartphone,
  Loader2,
  ListChecks,
  Settings2,
} from 'lucide-react'
import { apiFetch } from '@/lib/api-client'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

// ─── Default Theme Config ─────────────────────────────────────────────
const DEFAULT_TYPOGRAPHY = {
  englishFont: 'Inter',
  hindiFont: 'Noto Sans Devanagari',
  fallbackFont: 'Arial, sans-serif',
  questionFontSize: 16,
  hindiFontSize: 17,
  optionFontSize: 15,
  solutionFontSize: 14,
  headingFontSize: 18,
  fontWeight: '400',
  lineHeight: 1.6,
  letterSpacing: 0,
  paragraphSpacing: 12,
  textAlignment: 'left',
}

const DEFAULT_COLOR_TOKENS = {
  primary: '#3b82f6',
  secondary: '#6b7280',
  background: '#f9fafb',
  surface: '#ffffff',
  border: '#e5e7eb',
  text: '#111827',
  mutedText: '#6b7280',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  review: '#f97316',
  disabled: '#d1d5db',
}

const DEFAULT_QUESTION_STYLE = {
  numberPosition: 'left',
  textAlignment: 'left',
  bilingualLayout: 'stacked',
  cardBorder: true,
  cardShadow: false,
  cardPadding: 16,
  numberStyle: 'circle',
  imageWidth: 'auto',
  imageAlignment: 'center',
}

const DEFAULT_OPTION_STYLE = {
  optionCount: 4,
  labelStyle: 'circle',
  optionPadding: 12,
  optionSpacing: 8,
  showNotAttempt: false,
  notAttemptLabel: 'Not Attempt',
  longOptionWrap: true,
  enableEliminator: false,
}

const DEFAULT_CBT_SETTINGS = {
  layout: 'classic',
  headerHeight: 64,
  stickyHeader: true,
  showLogo: true,
  showStudentName: true,
  showTimer: true,
  showProgress: true,
  showPalette: true,
  palettePosition: 'right',
  paletteColumns: 5,
  paletteCollapsible: true,
  mobileDrawer: true,
  scrollBehavior: 'smooth',
  timerPosition: 'header',
  timerFontSize: 20,
  timerWarningColor: '#f59e0b',
  timerCriticalColor: '#ef4444',
  timerProgressBar: true,
  paletteStates: {
    notVisited: '#e5e7eb',
    current: '#3b82f6',
    answered: '#22c55e',
    blank: '#ef4444',
    notAttempt: '#6b7280',
    review: '#f97316',
  },
  navButtons: {
    previous: { label: 'Previous', visible: true },
    next: { label: 'Next', visible: true },
    saveNext: { label: 'Save & Next', visible: true },
    clearResponse: { label: 'Clear Response', visible: true },
    markForReview: { label: 'Mark for Review', visible: true },
    submit: { label: 'Submit Test', visible: true },
  },
}

const DEFAULT_PDF_SETTINGS = {
  pageSize: 'A4',
  marginTop: 20,
  marginBottom: 20,
  marginLeft: 15,
  marginRight: 15,
  fontSize: 12,
  hindiFontSize: 13,
  headerEnabled: true,
  footerEnabled: true,
  pageNumbers: true,
  watermarkEnabled: false,
  watermarkText: '',
  watermarkOpacity: 0.1,
  solutionLayout: 'after_all',
  passwordMode: 'disabled',
  customPassword: '',
}

const DEFAULT_RESULT_SETTINGS = {
  showScoreCard: true,
  showPercentageCard: true,
  showCorrectWrongCards: true,
  showSectionAnalysis: true,
  showQuestionReview: true,
  showSolutionView: true,
  showCharts: true,
  chartStyle: 'bar',
  mobileLayout: 'stacked',
}

const DEFAULT_BRANDING = {
  instituteName: '',
  brandName: '',
  website: '',
  appName: '',
  copyright: '',
  instructions: '',
  practiceLabel: 'Practice Test',
}

const DEFAULT_ACCESSIBILITY = {
  highContrast: false,
  keyboardNav: true,
  visibleFocus: true,
  minTouchTarget: 44,
  reducedMotion: false,
  screenReaderLabels: true,
  responsiveLayout: true,
}

const FONT_OPTIONS = [
  { label: 'Inter', value: 'Inter' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Noto Sans', value: 'Noto Sans' },
  { label: 'Arial', value: 'Arial' },
  { label: 'Open Sans', value: 'Open Sans' },
]

const HINDI_FONT_OPTIONS = [
  { label: 'Noto Sans Devanagari', value: 'Noto Sans Devanagari' },
  { label: 'Mukta', value: 'Mukta' },
  { label: 'Hind', value: 'Hind' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Nirmala UI', value: 'Nirmala UI' },
]

// ─── Component ────────────────────────────────────────────────────────

export default function ThemeBuilder() {
  const { currentPage, setCurrentPage } = useAppStore()

  // Get themeId from URL search params or local storage
  const [themeId, setThemeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const isEdit = !!themeId

  // Basic Info
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [themeType, setThemeType] = useState('exam')
  const [language, setLanguage] = useState('english')
  const [supportedModes, setSupportedModes] = useState<string[]>(['cbt'])
  const [status, setStatus] = useState('draft')

  // Legacy colors
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')
  const [secondaryColor, setSecondaryColor] = useState('#1f2937')
  const [backgroundColor, setBackgroundColor] = useState('#f9fafb')
  const [headerColor, setHeaderColor] = useState('#ffffff')
  const [footerColor, setFooterColor] = useState('#ffffff')
  const [fontFamily, setFontFamily] = useState('Inter')
  const [logo, setLogo] = useState('')
  const [watermark, setWatermark] = useState('')

  // JSON configs
  const [typography, setTypography] = useState(DEFAULT_TYPOGRAPHY)
  const [colorTokens, setColorTokens] = useState(DEFAULT_COLOR_TOKENS)
  const [questionStyle, setQuestionStyle] = useState(DEFAULT_QUESTION_STYLE)
  const [optionStyle, setOptionStyle] = useState(DEFAULT_OPTION_STYLE)
  const [cbtSettings, setCbtSettings] = useState(DEFAULT_CBT_SETTINGS)
  const [pdfSettings, setPdfSettings] = useState(DEFAULT_PDF_SETTINGS)
  const [resultSettings, setResultSettings] = useState(DEFAULT_RESULT_SETTINGS)
  const [brandingConfig, setBrandingConfig] = useState(DEFAULT_BRANDING)
  const [accessibility, setAccessibility] = useState(DEFAULT_ACCESSIBILITY)

  // Preview
  const [previewTab, setPreviewTab] = useState('cbt')
  const [previewDevice, setPreviewDevice] = useState('desktop')

  // Load theme for editing
  useEffect(() => {
    const savedId = typeof window !== 'undefined' ? localStorage.getItem('editThemeId') : null
    if (savedId) {
      setThemeId(savedId)
      loadTheme(savedId)
    }
  }, [])

  const loadTheme = async (id: string) => {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/teacher/themes/${id}`)
      if (!res.ok) throw new Error('Failed to load theme')
      const data = await res.json()
      const t = data.theme || data

      setName(t.name || '')
      setCode(t.code || '')
      setDescription(t.description || '')
      setThemeType(t.themeType || 'exam')
      setLanguage(t.language || 'english')
      setSupportedModes(safeJsonParse(t.supportedModes, ['cbt']))
      setStatus(t.status || 'draft')
      setPrimaryColor(t.primaryColor || '#3b82f6')
      setSecondaryColor(t.secondaryColor || '#1f2937')
      setBackgroundColor(t.backgroundColor || '#f9fafb')
      setHeaderColor(t.headerColor || '#ffffff')
      setFooterColor(t.footerColor || '#ffffff')
      setFontFamily(t.fontFamily || 'Inter')
      setLogo(t.logo || '')
      setWatermark(t.watermark || '')
      setTypography({ ...DEFAULT_TYPOGRAPHY, ...safeJsonParse(t.typography, {}) })
      setColorTokens({ ...DEFAULT_COLOR_TOKENS, ...safeJsonParse(t.colorTokens, {}) })
      setQuestionStyle({ ...DEFAULT_QUESTION_STYLE, ...safeJsonParse(t.questionStyle, {}) })
      setOptionStyle({ ...DEFAULT_OPTION_STYLE, ...safeJsonParse(t.optionStyle, {}) })
      setCbtSettings({ ...DEFAULT_CBT_SETTINGS, ...safeJsonParse(t.cbtSettings, {}) })
      setPdfSettings({ ...DEFAULT_PDF_SETTINGS, ...safeJsonParse(t.pdfSettings, {}) })
      setResultSettings({ ...DEFAULT_RESULT_SETTINGS, ...safeJsonParse(t.resultSettings, {}) })
      setBrandingConfig({ ...DEFAULT_BRANDING, ...safeJsonParse(t.brandingConfig, {}) })
      setAccessibility({ ...DEFAULT_ACCESSIBILITY, ...safeJsonParse(t.accessibility, {}) })
    } catch (err) {
      console.error('Load theme error:', err)
      toast.error('Failed to load theme')
    } finally {
      setLoading(false)
    }
  }

  function safeJsonParse(val: any, fallback: any) {
    if (!val) return fallback
    if (typeof val === 'object') return val
    try { return JSON.parse(val) } catch { return fallback }
  }

  const buildPayload = () => ({
    name,
    code: code || undefined,
    description,
    themeType,
    language,
    supportedModes: JSON.stringify(supportedModes),
    primaryColor,
    secondaryColor,
    backgroundColor,
    headerColor,
    footerColor,
    fontFamily,
    logo: logo || undefined,
    watermark: watermark || undefined,
    typography: JSON.stringify(typography),
    colorTokens: JSON.stringify(colorTokens),
    questionStyle: JSON.stringify(questionStyle),
    optionStyle: JSON.stringify(optionStyle),
    cbtSettings: JSON.stringify(cbtSettings),
    pdfSettings: JSON.stringify(pdfSettings),
    resultSettings: JSON.stringify(resultSettings),
    brandingConfig: JSON.stringify(brandingConfig),
    accessibility: JSON.stringify(accessibility),
  })

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Theme name is required'); return }
    setSaving(true)
    try {
      const payload = buildPayload()
      const url = isEdit ? `/api/teacher/themes/${themeId}` : '/api/teacher/themes'
      const method = isEdit ? 'PUT' : 'POST'
      const res = await apiFetch(url, { method, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      toast.success(isEdit ? 'Theme updated!' : 'Theme created!')
      if (!isEdit && data.theme?.id) {
        setThemeId(data.theme.id)
        localStorage.setItem('editThemeId', data.theme.id)
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save theme')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!themeId) { toast.error('Save the theme first'); return }
    setPublishing(true)
    try {
      const res = await apiFetch(`/api/teacher/themes/${themeId}/publish`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Publish failed')
      setStatus('active')
      toast.success('Theme published successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish')
    } finally {
      setPublishing(false)
    }
  }

  const goBack = () => {
    localStorage.removeItem('editThemeId')
    setCurrentPage('themes')
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[600px]" />
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    )
  }

  // ─── Color Picker Helper ────────────────────────────────────────────
  const ColorField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div className="flex items-center gap-3">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded border cursor-pointer" />
      <div className="flex-1">
        <Label className="text-xs text-gray-500">{label}</Label>
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-8 text-xs font-mono" />
      </div>
    </div>
  )

  const NumberField = ({ label, value, onChange, min, max, step }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number }) => (
    <div>
      <Label className="text-xs text-gray-500">{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} min={min} max={max} step={step || 1} className="h-8 text-sm" />
    </div>
  )

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}><ArrowLeft className="size-5" /></Button>
          <div>
            <h1 className="text-lg font-bold">{isEdit ? 'Edit Theme' : 'Create Theme'}</h1>
            <p className="text-xs text-gray-500">{name || 'Untitled Theme'} {status !== 'draft' && <Badge variant="outline" className="ml-2 text-xs">{status}</Badge>}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
            Save Draft
          </Button>
          {themeId && (
            <Button onClick={handlePublish} disabled={publishing} className="bg-green-600 hover:bg-green-700">
              {publishing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Send className="size-4 mr-2" />}
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">
          {/* Left: Settings */}
          <div className="border-r overflow-auto p-4 space-y-1 max-h-[calc(100vh-120px)]">
            <Accordion type="multiple" defaultValue={['basic']} className="space-y-1">

              {/* 1. Basic Information */}
              <AccordionItem value="basic" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2"><Settings2 className="size-4 text-blue-600" /> Basic Information</div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div>
                    <Label>Theme Name *</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. RSMSSB Theme" />
                  </div>
                  <div>
                    <Label>Theme Code</Label>
                    <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, '_'))} placeholder="e.g. RSSB_THEME_01" />
                    <p className="text-xs text-gray-400 mt-1">Unique identifier. Auto-formatted to uppercase.</p>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Theme purpose..." rows={2} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Type</Label>
                      <Select value={themeType} onValueChange={setThemeType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="exam">Exam</SelectItem>
                          <SelectItem value="practice">Practice</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Language</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="hindi">Hindi</SelectItem>
                          <SelectItem value="bilingual">Bilingual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Supported Modes</Label>
                    <div className="flex gap-3 mt-1">
                      {['cbt', 'pdf'].map((m) => (
                        <label key={m} className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={supportedModes.includes(m)} onChange={(e) => {
                            if (e.target.checked) setSupportedModes([...supportedModes, m])
                            else setSupportedModes(supportedModes.filter((x) => x !== m))
                          }} className="rounded" />
                          <span className="text-sm capitalize">{m}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 2. Typography */}
              <AccordionItem value="typography" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2"><Type className="size-4 text-purple-600" /> Font & Typography</div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>English Font</Label>
                      <Select value={typography.englishFont} onValueChange={(v) => { setTypography({ ...typography, englishFont: v }); setFontFamily(v) }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Hindi Font</Label>
                      <Select value={typography.hindiFont} onValueChange={(v) => setTypography({ ...typography, hindiFont: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {HINDI_FONT_OPTIONS.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <NumberField label="Question Size" value={typography.questionFontSize} onChange={(v) => setTypography({ ...typography, questionFontSize: v })} min={12} max={32} />
                    <NumberField label="Hindi Size" value={typography.hindiFontSize} onChange={(v) => setTypography({ ...typography, hindiFontSize: v })} min={12} max={32} />
                    <NumberField label="Option Size" value={typography.optionFontSize} onChange={(v) => setTypography({ ...typography, optionFontSize: v })} min={12} max={28} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <NumberField label="Solution Size" value={typography.solutionFontSize} onChange={(v) => setTypography({ ...typography, solutionFontSize: v })} min={10} max={24} />
                    <NumberField label="Heading Size" value={typography.headingFontSize} onChange={(v) => setTypography({ ...typography, headingFontSize: v })} min={14} max={36} />
                    <NumberField label="Line Height" value={typography.lineHeight} onChange={(v) => setTypography({ ...typography, lineHeight: v })} min={1} max={3} step={0.1} />
                  </div>
                  <div>
                    <Label>Text Alignment</Label>
                    <Select value={typography.textAlignment} onValueChange={(v) => setTypography({ ...typography, textAlignment: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="justify">Justify</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 3. Colors */}
              <AccordionItem value="colors" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2"><Palette className="size-4 text-pink-600" /> Colors</div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <ColorField label="Primary" value={colorTokens.primary} onChange={(v) => { setColorTokens({ ...colorTokens, primary: v }); setPrimaryColor(v) }} />
                    <ColorField label="Secondary" value={colorTokens.secondary} onChange={(v) => { setColorTokens({ ...colorTokens, secondary: v }); setSecondaryColor(v) }} />
                    <ColorField label="Background" value={colorTokens.background} onChange={(v) => { setColorTokens({ ...colorTokens, background: v }); setBackgroundColor(v) }} />
                    <ColorField label="Surface" value={colorTokens.surface} onChange={(v) => setColorTokens({ ...colorTokens, surface: v })} />
                    <ColorField label="Border" value={colorTokens.border} onChange={(v) => setColorTokens({ ...colorTokens, border: v })} />
                    <ColorField label="Text" value={colorTokens.text} onChange={(v) => setColorTokens({ ...colorTokens, text: v })} />
                    <ColorField label="Success" value={colorTokens.success} onChange={(v) => setColorTokens({ ...colorTokens, success: v })} />
                    <ColorField label="Danger" value={colorTokens.danger} onChange={(v) => setColorTokens({ ...colorTokens, danger: v })} />
                    <ColorField label="Warning" value={colorTokens.warning} onChange={(v) => setColorTokens({ ...colorTokens, warning: v })} />
                    <ColorField label="Review" value={colorTokens.review} onChange={(v) => setColorTokens({ ...colorTokens, review: v })} />
                    <ColorField label="Disabled" value={colorTokens.disabled} onChange={(v) => setColorTokens({ ...colorTokens, disabled: v })} />
                    <ColorField label="Muted Text" value={colorTokens.mutedText} onChange={(v) => setColorTokens({ ...colorTokens, mutedText: v })} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 4. Question Style */}
              <AccordionItem value="question" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2"><FileText className="size-4 text-green-600" /> Question Design</div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Number Position</Label>
                      <Select value={questionStyle.numberPosition} onValueChange={(v) => setQuestionStyle({ ...questionStyle, numberPosition: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="top">Top</SelectItem>
                          <SelectItem value="inline">Inline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Number Style</Label>
                      <Select value={questionStyle.numberStyle} onValueChange={(v) => setQuestionStyle({ ...questionStyle, numberStyle: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="circle">Circle</SelectItem>
                          <SelectItem value="square">Square</SelectItem>
                          <SelectItem value="plain">Plain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Bilingual Layout</Label>
                    <Select value={questionStyle.bilingualLayout} onValueChange={(v) => setQuestionStyle({ ...questionStyle, bilingualLayout: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stacked">Stacked (Hindi below English)</SelectItem>
                        <SelectItem value="side-by-side">Side by Side</SelectItem>
                        <SelectItem value="tabbed">Tabbed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={questionStyle.cardBorder} onChange={(e) => setQuestionStyle({ ...questionStyle, cardBorder: e.target.checked })} className="rounded" /> Card Border</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={questionStyle.cardShadow} onChange={(e) => setQuestionStyle({ ...questionStyle, cardShadow: e.target.checked })} className="rounded" /> Card Shadow</label>
                  </div>
                  <NumberField label="Card Padding (px)" value={questionStyle.cardPadding} onChange={(v) => setQuestionStyle({ ...questionStyle, cardPadding: v })} min={8} max={32} />
                </AccordionContent>
              </AccordionItem>

              {/* 5. Option Style */}
              <AccordionItem value="options" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2"><ListChecks className="size-4 text-orange-600" /> Option Design</div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Option Count</Label>
                      <Select value={String(optionStyle.optionCount)} onValueChange={(v) => setOptionStyle({ ...optionStyle, optionCount: Number(v) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4">4 Options</SelectItem>
                          <SelectItem value="5">5 Options</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Label Style</Label>
                      <Select value={optionStyle.labelStyle} onValueChange={(v) => setOptionStyle({ ...optionStyle, labelStyle: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="circle">Circle (A, B, C)</SelectItem>
                          <SelectItem value="square">Square</SelectItem>
                          <SelectItem value="card">Full Card</SelectItem>
                          <SelectItem value="plain">Plain Text</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <NumberField label="Option Padding" value={optionStyle.optionPadding} onChange={(v) => setOptionStyle({ ...optionStyle, optionPadding: v })} min={4} max={24} />
                    <NumberField label="Option Spacing" value={optionStyle.optionSpacing} onChange={(v) => setOptionStyle({ ...optionStyle, optionSpacing: v })} min={2} max={16} />
                  </div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={optionStyle.showNotAttempt} onChange={(e) => setOptionStyle({ ...optionStyle, showNotAttempt: e.target.checked })} className="rounded" />
                    Show "Not Attempt" (E) Option
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={optionStyle.enableEliminator} onChange={(e) => setOptionStyle({ ...optionStyle, enableEliminator: e.target.checked })} className="rounded" />
                    Enable Option Eliminator (Strikethrough)
                  </label>
                </AccordionContent>
              </AccordionItem>

              {/* 6. CBT Settings */}
              <AccordionItem value="cbt" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2"><Monitor className="size-4 text-cyan-600" /> CBT Layout</div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div>
                    <Label>Layout</Label>
                    <Select value={cbtSettings.layout} onValueChange={(v) => setCbtSettings({ ...cbtSettings, layout: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="classic">Classic (Sidebar Right)</SelectItem>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="fullwidth">Full Width</SelectItem>
                        <SelectItem value="twocolumn">Two Column</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={cbtSettings.stickyHeader} onChange={(e) => setCbtSettings({ ...cbtSettings, stickyHeader: e.target.checked })} className="rounded" /> Sticky Header</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={cbtSettings.showPalette} onChange={(e) => setCbtSettings({ ...cbtSettings, showPalette: e.target.checked })} className="rounded" /> Show Palette</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={cbtSettings.showTimer} onChange={(e) => setCbtSettings({ ...cbtSettings, showTimer: e.target.checked })} className="rounded" /> Show Timer</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={cbtSettings.showStudentName} onChange={(e) => setCbtSettings({ ...cbtSettings, showStudentName: e.target.checked })} className="rounded" /> Show Student Name</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={cbtSettings.timerProgressBar} onChange={(e) => setCbtSettings({ ...cbtSettings, timerProgressBar: e.target.checked })} className="rounded" /> Timer Progress Bar</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={cbtSettings.showProgress} onChange={(e) => setCbtSettings({ ...cbtSettings, showProgress: e.target.checked })} className="rounded" /> Show Progress</label>
                  </div>
                  <NumberField label="Palette Columns" value={cbtSettings.paletteColumns} onChange={(v) => setCbtSettings({ ...cbtSettings, paletteColumns: v })} min={3} max={10} />
                  <Separator />
                  <p className="text-xs font-medium text-gray-500">Palette State Colors</p>
                  <div className="grid grid-cols-2 gap-3">
                    <ColorField label="Not Visited" value={cbtSettings.paletteStates.notVisited} onChange={(v) => setCbtSettings({ ...cbtSettings, paletteStates: { ...cbtSettings.paletteStates, notVisited: v } })} />
                    <ColorField label="Current" value={cbtSettings.paletteStates.current} onChange={(v) => setCbtSettings({ ...cbtSettings, paletteStates: { ...cbtSettings.paletteStates, current: v } })} />
                    <ColorField label="Answered" value={cbtSettings.paletteStates.answered} onChange={(v) => setCbtSettings({ ...cbtSettings, paletteStates: { ...cbtSettings.paletteStates, answered: v } })} />
                    <ColorField label="Blank" value={cbtSettings.paletteStates.blank} onChange={(v) => setCbtSettings({ ...cbtSettings, paletteStates: { ...cbtSettings.paletteStates, blank: v } })} />
                    <ColorField label="Not Attempt" value={cbtSettings.paletteStates.notAttempt} onChange={(v) => setCbtSettings({ ...cbtSettings, paletteStates: { ...cbtSettings.paletteStates, notAttempt: v } })} />
                    <ColorField label="Review" value={cbtSettings.paletteStates.review} onChange={(v) => setCbtSettings({ ...cbtSettings, paletteStates: { ...cbtSettings.paletteStates, review: v } })} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 7. PDF Settings */}
              <AccordionItem value="pdf" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2"><FileText className="size-4 text-red-600" /> PDF Settings</div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Page Size</Label>
                      <Select value={pdfSettings.pageSize} onValueChange={(v) => setPdfSettings({ ...pdfSettings, pageSize: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A4">A4</SelectItem>
                          <SelectItem value="Letter">Letter</SelectItem>
                          <SelectItem value="Legal">Legal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Solution Layout</Label>
                      <Select value={pdfSettings.solutionLayout} onValueChange={(v) => setPdfSettings({ ...pdfSettings, solutionLayout: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inline">After each question</SelectItem>
                          <SelectItem value="after_all">After all questions</SelectItem>
                          <SelectItem value="separate">No solutions</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={pdfSettings.headerEnabled} onChange={(e) => setPdfSettings({ ...pdfSettings, headerEnabled: e.target.checked })} className="rounded" /> Header</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={pdfSettings.footerEnabled} onChange={(e) => setPdfSettings({ ...pdfSettings, footerEnabled: e.target.checked })} className="rounded" /> Footer</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={pdfSettings.pageNumbers} onChange={(e) => setPdfSettings({ ...pdfSettings, pageNumbers: e.target.checked })} className="rounded" /> Page Numbers</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={pdfSettings.watermarkEnabled} onChange={(e) => setPdfSettings({ ...pdfSettings, watermarkEnabled: e.target.checked })} className="rounded" /> Watermark</label>
                  </div>
                  {pdfSettings.watermarkEnabled && (
                    <Input value={pdfSettings.watermarkText} onChange={(e) => setPdfSettings({ ...pdfSettings, watermarkText: e.target.value })} placeholder="Watermark text..." />
                  )}
                  <div>
                    <Label>Password Protection</Label>
                    <Select value={pdfSettings.passwordMode} onValueChange={(v) => setPdfSettings({ ...pdfSettings, passwordMode: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disabled">Disabled</SelectItem>
                        <SelectItem value="student_mobile">Student Mobile Number</SelectItem>
                        <SelectItem value="custom">Custom Password</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {pdfSettings.passwordMode === 'custom' && (
                    <Input type="password" value={pdfSettings.customPassword} onChange={(e) => setPdfSettings({ ...pdfSettings, customPassword: e.target.value })} placeholder="Custom password..." />
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* 8. Branding */}
              <AccordionItem value="branding" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2"><Image className="size-4 text-indigo-600" /> Branding & Footer</div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div>
                    <Label>Logo URL</Label>
                    <Input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Institute Name</Label>
                      <Input value={brandingConfig.instituteName} onChange={(e) => setBrandingConfig({ ...brandingConfig, instituteName: e.target.value })} />
                    </div>
                    <div>
                      <Label>Brand Name</Label>
                      <Input value={brandingConfig.brandName} onChange={(e) => setBrandingConfig({ ...brandingConfig, brandName: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Website</Label>
                      <Input value={brandingConfig.website} onChange={(e) => setBrandingConfig({ ...brandingConfig, website: e.target.value })} />
                    </div>
                    <div>
                      <Label>Copyright</Label>
                      <Input value={brandingConfig.copyright} onChange={(e) => setBrandingConfig({ ...brandingConfig, copyright: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Watermark Text</Label>
                    <Input value={watermark} onChange={(e) => setWatermark(e.target.value)} placeholder="Watermark text for PDF/CBT..." />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 9. Accessibility */}
              <AccordionItem value="accessibility" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2"><Accessibility className="size-4 text-teal-600" /> Accessibility</div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={accessibility.highContrast} onChange={(e) => setAccessibility({ ...accessibility, highContrast: e.target.checked })} className="rounded" /> High Contrast</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={accessibility.keyboardNav} onChange={(e) => setAccessibility({ ...accessibility, keyboardNav: e.target.checked })} className="rounded" /> Keyboard Navigation</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={accessibility.visibleFocus} onChange={(e) => setAccessibility({ ...accessibility, visibleFocus: e.target.checked })} className="rounded" /> Visible Focus</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={accessibility.reducedMotion} onChange={(e) => setAccessibility({ ...accessibility, reducedMotion: e.target.checked })} className="rounded" /> Reduced Motion</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={accessibility.screenReaderLabels} onChange={(e) => setAccessibility({ ...accessibility, screenReaderLabels: e.target.checked })} className="rounded" /> Screen Reader Labels</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={accessibility.responsiveLayout} onChange={(e) => setAccessibility({ ...accessibility, responsiveLayout: e.target.checked })} className="rounded" /> Responsive Layout</label>
                  </div>
                  <NumberField label="Min Touch Target (px)" value={accessibility.minTouchTarget} onChange={(v) => setAccessibility({ ...accessibility, minTouchTarget: v })} min={36} max={64} />
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </div>

          {/* Right: Live Preview */}
          <div className="bg-gray-50 overflow-auto max-h-[calc(100vh-120px)]">
            <div className="sticky top-0 bg-white border-b p-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Eye className="size-4 text-gray-500" />
                <span className="text-sm font-medium">Live Preview</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant={previewDevice === 'desktop' ? 'secondary' : 'ghost'} size="icon" className="size-7" onClick={() => setPreviewDevice('desktop')}><Monitor className="size-3.5" /></Button>
                <Button variant={previewDevice === 'tablet' ? 'secondary' : 'ghost'} size="icon" className="size-7" onClick={() => setPreviewDevice('tablet')}><Tablet className="size-3.5" /></Button>
                <Button variant={previewDevice === 'mobile' ? 'secondary' : 'ghost'} size="icon" className="size-7" onClick={() => setPreviewDevice('mobile')}><Smartphone className="size-3.5" /></Button>
              </div>
            </div>

            <div className="p-4">
              <Tabs value={previewTab} onValueChange={setPreviewTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="cbt">CBT Preview</TabsTrigger>
                  <TabsTrigger value="pdf">PDF Preview</TabsTrigger>
                  <TabsTrigger value="result">Result Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="cbt">
                  <div className={`mx-auto transition-all ${previewDevice === 'mobile' ? 'max-w-[375px]' : previewDevice === 'tablet' ? 'max-w-[768px]' : 'max-w-full'}`}>
                    {/* CBT Preview */}
                    <div className="rounded-xl overflow-hidden shadow-lg border" style={{ background: colorTokens.background, fontFamily: typography.englishFont }}>
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3" style={{ background: colorTokens.primary, color: '#fff' }}>
                        <div className="flex items-center gap-2">
                          {logo && <img src={logo} className="h-6 rounded" alt="logo" />}
                          <span className="text-sm font-bold">{brandingConfig.instituteName || name || 'Test Name'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          {cbtSettings.showStudentName && <span>Student Name</span>}
                          {cbtSettings.showTimer && <span className="bg-white/20 px-2 py-1 rounded font-mono">02:30:00</span>}
                        </div>
                      </div>

                      <div className="flex">
                        {/* Question Area */}
                        <div className="flex-1 p-4">
                          <div className="rounded-lg p-4" style={{ background: colorTokens.surface, border: questionStyle.cardBorder ? `1px solid ${colorTokens.border}` : 'none', boxShadow: questionStyle.cardShadow ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', padding: `${questionStyle.cardPadding}px` }}>
                            <div className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: colorTokens.primary, color: '#fff' }}>1</span>
                              <div className="flex-1">
                                <p style={{ fontSize: `${typography.questionFontSize}px`, lineHeight: typography.lineHeight, color: colorTokens.text }}>Which protocol is used to transfer web pages?</p>
                                {language !== 'english' && (
                                  <p className="mt-2" style={{ fontSize: `${typography.hindiFontSize}px`, lineHeight: typography.lineHeight, color: colorTokens.mutedText, fontFamily: typography.hindiFont }}>वेब पृष्ठों को स्थानांतरित करने के लिए किस प्रोटोकॉल का उपयोग किया जाता है?</p>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 space-y-2" style={{ gap: `${optionStyle.optionSpacing}px` }}>
                              {['HTTP', 'FTP', 'SMTP', 'DNS', ...(optionStyle.showNotAttempt ? ['Not Attempt'] : [])].slice(0, optionStyle.optionCount + (optionStyle.showNotAttempt ? 1 : 0)).map((opt, i) => (
                                <div key={i} className={`flex items-center gap-3 rounded-lg cursor-pointer transition-all ${i === 0 ? 'ring-2' : ''}`} style={{ padding: `${optionStyle.optionPadding}px`, border: `1px solid ${colorTokens.border}`, background: i === 0 ? `${colorTokens.primary}10` : colorTokens.surface, /* @ts-ignore */
ringColor: i === 0 ? colorTokens.primary : 'transparent' }}>
                                  <span className={`flex-shrink-0 w-6 h-6 ${optionStyle.labelStyle === 'circle' ? 'rounded-full' : 'rounded'} flex items-center justify-center text-xs font-bold`} style={{ background: i === 0 ? colorTokens.primary : colorTokens.border, color: i === 0 ? '#fff' : colorTokens.text }}>
                                    {String.fromCharCode(65 + i)}
                                  </span>
                                  <span style={{ fontSize: `${typography.optionFontSize}px`, color: colorTokens.text }}>{opt}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Navigation Buttons */}
                          <div className="flex items-center justify-between mt-4 gap-2 flex-wrap">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" style={{ borderColor: colorTokens.border }}>Previous</Button>
                              <Button size="sm" style={{ background: colorTokens.primary }}>Save & Next</Button>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" style={{ borderColor: colorTokens.warning, color: colorTokens.warning }}>Review</Button>
                              <Button size="sm" variant="outline" style={{ borderColor: colorTokens.danger, color: colorTokens.danger }}>Clear</Button>
                            </div>
                          </div>
                        </div>

                        {/* Palette Sidebar */}
                        {cbtSettings.showPalette && previewDevice === 'desktop' && (
                          <div className="w-48 border-l p-3" style={{ background: colorTokens.surface }}>
                            <p className="text-xs font-bold mb-2" style={{ color: colorTokens.text }}>Question Palette</p>
                            <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${cbtSettings.paletteColumns}, 1fr)` }}>
                              {Array.from({ length: 20 }).map((_, i) => {
                                const state = i === 0 ? 'current' : i < 5 ? 'answered' : i < 8 ? 'blank' : i === 10 ? 'review' : 'notVisited'
                                return (
                                  <div key={i} className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold cursor-pointer" style={{ background: cbtSettings.paletteStates[state], color: state === 'notVisited' ? colorTokens.text : '#fff' }}>
                                    {i + 1}
                                  </div>
                                )
                              })}
                            </div>
                            <div className="mt-3 space-y-1.5 text-xs">
                              {Object.entries({ 'Not Visited': 'notVisited', 'Current': 'current', 'Answered': 'answered', 'Blank': 'blank', 'Review': 'review' }).map(([label, key]) => (
                                <div key={key} className="flex items-center gap-1.5">
                                  <div className="w-3 h-3 rounded" style={{ background: cbtSettings.paletteStates[key as keyof typeof cbtSettings.paletteStates] }} />
                                  <span>{label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pdf">
                  <div className="max-w-[600px] mx-auto bg-white shadow-lg rounded-lg p-8 border" style={{ fontFamily: typography.englishFont }}>
                    {pdfSettings.headerEnabled && (
                      <div className="text-center border-b pb-3 mb-4">
                        <h2 className="font-bold" style={{ fontSize: `${typography.headingFontSize}px`, color: colorTokens.text }}>{brandingConfig.instituteName || 'Institute Name'}</h2>
                        <p className="text-sm" style={{ color: colorTokens.mutedText }}>Sample Test Paper — 2024</p>
                      </div>
                    )}
                    {[1, 2, 3].map((q) => (
                      <div key={q} className="mb-4">
                        <p className="font-medium" style={{ fontSize: `${pdfSettings.fontSize}px` }}><strong>Q.{q}</strong> Sample question text for PDF preview</p>
                        {language !== 'english' && <p className="mt-1" style={{ fontSize: `${pdfSettings.hindiFontSize}px`, fontFamily: typography.hindiFont, color: colorTokens.mutedText }}>हिंदी में प्रश्न का उदाहरण</p>}
                        <div className="mt-2 grid grid-cols-2 gap-1 text-sm pl-4">
                          {['A. Option 1', 'B. Option 2', 'C. Option 3', 'D. Option 4'].map((o) => <span key={o}>{o}</span>)}
                        </div>
                      </div>
                    ))}
                    {pdfSettings.footerEnabled && (
                      <div className="border-t pt-2 mt-4 flex justify-between text-xs" style={{ color: colorTokens.mutedText }}>
                        <span>{brandingConfig.website || 'www.example.com'}</span>
                        <span>Page 1</span>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="result">
                  <div className="max-w-[500px] mx-auto space-y-3" style={{ fontFamily: typography.englishFont }}>
                    <Card style={{ borderColor: colorTokens.border }}>
                      <CardContent className="p-4 text-center">
                        <h3 className="text-2xl font-bold" style={{ color: colorTokens.primary }}>85 / 100</h3>
                        <p className="text-sm" style={{ color: colorTokens.mutedText }}>Total Score</p>
                      </CardContent>
                    </Card>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Correct', value: 17, color: colorTokens.success },
                        { label: 'Wrong', value: 2, color: colorTokens.danger },
                        { label: 'Blank', value: 1, color: colorTokens.warning },
                        { label: 'Not Attempt', value: 0, color: colorTokens.disabled },
                      ].map((c) => (
                        <Card key={c.label} style={{ borderColor: c.color }}>
                          <CardContent className="p-3 text-center">
                            <p className="text-lg font-bold" style={{ color: c.color }}>{c.value}</p>
                            <p className="text-xs" style={{ color: colorTokens.mutedText }}>{c.label}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
