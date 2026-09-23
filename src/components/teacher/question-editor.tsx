'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useTeacherStore } from '@/lib/teacher-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Upload, ImagePlus, X, Save, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api-client'

type QuestionType = 'mcq' | 'numerical' | 'comprehension'

interface OptionData {
  text: string
  image: string | null // base64 data URL or null
}

interface QuestionForm {
  type: QuestionType
  section: string
  heading: string
  question: string
  // MCQ / Comprehension options
  options: OptionData[]
  mcqMode: 'single' | 'multi'
  correctOptions: string[] // array of option indices like ['0','1']
  // Numerical
  numericalAnswer: string
  numericalRange: boolean
  rangeMin: string
  rangeMax: string
  // Comprehension
  passage: string
  // Images
  questionImage1: string | null
  questionImage2: string | null
  questionImage3: string | null
  // Solution
  solutionHeading: string
  solutionText: string
  solutionImage1: string | null
  solutionImage2: string | null
  solutionVideo: string
  // Marking
  positiveMarks: string
  negativeMarks: string
}

const defaultOptions: OptionData[] = [
  { text: '', image: null },
  { text: '', image: null },
  { text: '', image: null },
  { text: '', image: null },
  { text: '', image: null },
]

const defaultForm: QuestionForm = {
  type: 'mcq',
  section: '',
  heading: '',
  question: '',
  options: defaultOptions.map(o => ({ ...o })),
  mcqMode: 'single',
  correctOptions: [],
  numericalAnswer: '',
  numericalRange: false,
  rangeMin: '',
  rangeMax: '',
  passage: '',
  questionImage1: null,
  questionImage2: null,
  questionImage3: null,
  solutionHeading: '',
  solutionText: '',
  solutionImage1: null,
  solutionImage2: null,
  solutionVideo: '',
  positiveMarks: '1',
  negativeMarks: '0',
}

// Section items fetched from API
interface SectionItem {
  id: string
  name: string
}

// Helper to read a file as base64 data URL
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function QuestionEditor() {
  const { questionEditorOpen, closeQuestionEditor, editingTestId, editingQuestionId } = useTeacherStore()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<QuestionForm>({ ...defaultForm, options: defaultOptions.map(o => ({ ...o })) })
  const [sections, setSections] = useState<SectionItem[]>([])

  // Refs for hidden file inputs
  const optionFileRefs = useRef<(HTMLInputElement | null)[]>([])
  const questionImageRefs = useRef<(HTMLInputElement | null)[]>([])
  const solutionImageRefs = useRef<(HTMLInputElement | null)[]>([])

  // Fetch sections for dropdown
  const fetchSections = useCallback(async () => {
    try {
      const res = await apiFetch('/api/teacher/sections')
      if (res.ok) {
        const data = await res.json()
        setSections(data.items || [])
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => { fetchSections() }, [fetchSections])

  const updateField = <K extends keyof QuestionForm>(key: K, value: QuestionForm[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const updateOption = (index: number, field: 'text' | 'image', value: string | null) => {
    setFormData((prev) => {
      const newOptions = [...prev.options]
      newOptions[index] = { ...newOptions[index], [field]: value }
      return { ...prev, options: newOptions }
    })
  }

  const toggleCorrectOption = (index: string) => {
    setFormData((prev) => {
      if (prev.mcqMode === 'single') {
        return { ...prev, correctOptions: [index] }
      }
      // Multi correct
      const current = prev.correctOptions
      if (current.includes(index)) {
        return { ...prev, correctOptions: current.filter(i => i !== index) }
      }
      return { ...prev, correctOptions: [...current, index] }
    })
  }

  // Handle image file upload for an option
  const handleOptionImageUpload = async (index: number, file: File) => {
    try {
      const dataUrl = await readFileAsDataURL(file)
      updateOption(index, 'image', dataUrl)
    } catch {
      toast.error('Failed to upload image')
    }
  }

  // Handle image file upload for question/solution images
  const handleImageUpload = async (field: keyof QuestionForm, file: File) => {
    try {
      const dataUrl = await readFileAsDataURL(file)
      updateField(field, dataUrl as string & null)
    } catch {
      toast.error('Failed to upload image')
    }
  }

  // Load existing question if editing
  useEffect(() => {
    if (editingQuestionId && questionEditorOpen) {
      apiFetch(`/api/teacher/questions/${editingQuestionId}`)
        .then(res => res.json())
        .then(data => {
          const loaded: QuestionForm = {
            ...defaultForm,
            type: data.type || 'mcq',
            section: data.section || '',
            heading: data.heading || '',
            question: data.title || '',
            options: [
              { text: data.option1 || '', image: null },
              { text: data.option2 || '', image: null },
              { text: data.option3 || '', image: null },
              { text: data.option4 || '', image: null },
              { text: data.option5 || '', image: null },
            ],
            mcqMode: (data.type === 'mcq' && data.correctOption && data.correctOption.includes(',')) ? 'multi' : 'single',
            correctOptions: data.correctOption ? String(data.correctOption).split(',').map((s: string) => {
              // Map 1-based to 0-based index
              const num = parseInt(s.trim())
              return isNaN(num) ? s.trim() : String(num - 1)
            }) : [],
            numericalAnswer: data.type === 'numerical' ? (data.correctOption || '') : '',
            numericalRange: false,
            rangeMin: '',
            rangeMax: '',
            passage: data.passage || '',
            solutionHeading: data.solutionHeading || '',
            solutionText: data.solutionText || '',
            solutionVideo: data.solutionVideo || '',
            positiveMarks: data.positiveMarks?.toString() || '1',
            negativeMarks: data.negativeMarks?.toString() || '0',
          }
          setFormData(loaded)
        })
        .catch(() => {})
    } else if (!questionEditorOpen) {
      setFormData({ ...defaultForm, options: defaultOptions.map(o => ({ ...o })) })
    }
  }, [editingQuestionId, questionEditorOpen])

  const resetForm = () => {
    setFormData({
      ...defaultForm,
      type: formData.type,
      section: formData.section,
      options: defaultOptions.map(o => ({ ...o })),
    })
  }

  const handleSave = async (goNext: boolean = false) => {
    if (!formData.question.trim()) {
      toast.error('Question text is required')
      return
    }

    // MCQ / Comprehension validation: at least option 1 and 2 required
    if ((formData.type === 'mcq' || formData.type === 'comprehension') && formData.mcqMode === 'single') {
      if (formData.correctOptions.length === 0) {
        toast.error('Please select a correct answer')
        return
      }
    }

    setSaving(true)
    try {
      const isMcqType = formData.type === 'mcq' || formData.type === 'comprehension'

      // Convert 0-based indices back to 1-based for storage
      const correctOptionStr = isMcqType
        ? formData.correctOptions.map(i => String(parseInt(i) + 1)).join(',')
        : formData.type === 'numerical'
          ? formData.numericalAnswer
          : null

      const body: Record<string, unknown> = {
        type: formData.type,
        section: formData.section || null,
        heading: formData.heading || null,
        title: formData.question,
        passage: formData.type === 'comprehension' ? formData.passage : null,
        option1: isMcqType ? formData.options[0].text : null,
        option2: isMcqType ? formData.options[1].text : null,
        option3: isMcqType ? formData.options[2].text : null,
        option4: isMcqType ? formData.options[3].text : null,
        option5: isMcqType ? formData.options[4].text : null,
        correctOption: correctOptionStr,
        solutionHeading: formData.solutionHeading || null,
        solutionText: formData.solutionText || null,
        solutionVideo: formData.solutionVideo || null,
        positiveMarks: Number(formData.positiveMarks) || 1,
        negativeMarks: Number(formData.negativeMarks) || 0,
        testId: editingTestId,
      }

      if (editingQuestionId) {
        const res = await apiFetch(`/api/teacher/questions/${editingQuestionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to update question')
        }
        toast.success('Question updated')
      } else {
        const res = await apiFetch('/api/teacher/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to create question')
        }
        toast.success('Question created')
      }

      if (goNext) {
        resetForm()
      } else {
        closeQuestionEditor()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save question')
    } finally {
      setSaving(false)
    }
  }

  const showMcqOptions = formData.type === 'mcq' || formData.type === 'comprehension'

  // Reusable image upload component with preview and remove
  const ImageUploadArea = ({ 
    label, 
    value, 
    onUpload, 
    onRemove,
    inputRefSetter,
  }: { 
    label: string
    value: string | null
    onUpload: (file: File) => void
    onRemove: () => void
    inputRefSetter: (el: HTMLInputElement | null) => void
  }) => (
    <div
      className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-3 cursor-pointer hover:border-amber-400 transition-colors overflow-hidden"
      onClick={() => {
        // Trigger the hidden file input
        const input = label.includes('Option')
          ? optionFileRefs.current[0]
          : label.includes('Solution')
            ? solutionImageRefs.current[0]
            : questionImageRefs.current[0]
        input?.click()
      }}
    >
      <input
        ref={inputRefSetter}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            onUpload(e.target.files[0])
            e.target.value = '' // reset so same file can be re-selected
          }
        }}
      />
      {value ? (
        <div className="w-full">
          <div className="relative w-full h-20 rounded-md overflow-hidden bg-gray-100">
            <img src={value} alt={label} className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <ImagePlus className="h-3 w-3 text-emerald-600" />
            <span className="text-xs text-emerald-600">Uploaded</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 ml-1"
              onClick={(e) => { e.stopPropagation(); onRemove() }}
            >
              <X className="h-3 w-3 text-gray-500 hover:text-red-500" />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Upload className="h-5 w-5 text-gray-400" />
          <span className="text-xs text-gray-400 mt-1">{label}</span>
        </>
      )}
    </div>
  )

  return (
    <Sheet open={questionEditorOpen} onOpenChange={(open) => { if (!open) closeQuestionEditor() }}>
      <SheetContent side="right" className="sm:max-w-2xl w-full overflow-y-auto p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="text-lg">
            {editingQuestionId ? 'Edit Question' : 'Add Question'}
          </SheetTitle>
          <SheetDescription>
            {editingQuestionId ? 'Update the question details.' : 'Create a new question for this test.'}
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 py-5 space-y-6">
          {/* Question Type */}
          <div className="space-y-2">
            <Label>Question Type <span className="text-destructive">*</span></Label>
            <Select value={formData.type} onValueChange={(v: QuestionType) => {
              updateField('type', v)
              // Reset type-specific fields
              if (v === 'numerical') {
                updateField('correctOptions', [])
              } else {
                updateField('numericalAnswer', '')
                updateField('numericalRange', false)
              }
              if (v !== 'comprehension') {
                updateField('passage', '')
              }
            }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mcq">Multiple Choice Question (MCQ)</SelectItem>
                <SelectItem value="numerical">Numerical Answer Type</SelectItem>
                <SelectItem value="comprehension">Comprehension Type</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Section */}
          <div className="space-y-2">
            <Label>Section <span className="text-destructive">*</span></Label>
            <Select value={formData.section} onValueChange={(v) => updateField('section', v)}>
              <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
              <SelectContent>
                {sections.length > 0 ? (
                  sections.map((s) => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))
                ) : (
                  ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Reasoning', 'General Knowledge'].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Question Heading */}
          <div className="space-y-2">
            <Label htmlFor="q-heading">Question Heading</Label>
            <Input
              id="q-heading"
              placeholder="Optional heading for the question"
              value={formData.heading}
              onChange={(e) => updateField('heading', e.target.value)}
            />
          </div>

          {/* Comprehension Passage */}
          {formData.type === 'comprehension' && (
            <div className="space-y-2">
              <Label htmlFor="q-passage">Passage <span className="text-destructive">*</span></Label>
              <Textarea
                id="q-passage"
                placeholder="Enter the comprehension passage..."
                rows={6}
                value={formData.passage}
                onChange={(e) => updateField('passage', e.target.value)}
              />
            </div>
          )}

          {/* Question Text */}
          <div className="space-y-2">
            <Label htmlFor="q-text">Question <span className="text-destructive">*</span></Label>
            <Textarea
              id="q-text"
              placeholder={formData.type === 'comprehension' ? 'Enter the question based on the passage...' : 'Enter your question...'}
              rows={4}
              value={formData.question}
              onChange={(e) => updateField('question', e.target.value)}
            />
          </div>

          {/* ═══ MCQ / Comprehension Options ═══ */}
          {showMcqOptions && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Options</Label>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select value={formData.mcqMode} onValueChange={(v: 'single' | 'multi') => {
                    updateField('mcqMode', v)
                    if (v === 'single' && formData.correctOptions.length > 1) {
                      // Keep only the first selected
                      updateField('correctOptions', formData.correctOptions.slice(0, 1))
                    }
                  }}>
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Correct</SelectItem>
                      <SelectItem value="multi">Multiple Correct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                {formData.options.map((opt, index) => (
                  <div key={index} className="flex items-start gap-3">
                    {/* Correct answer selector */}
                    <div className="pt-2.5">
                      {formData.mcqMode === 'single' ? (
                        <RadioGroup
                          value={formData.correctOptions[0] || ''}
                          onValueChange={(v) => updateField('correctOptions', [v])}
                        >
                          <RadioGroupItem value={String(index)} id={`opt-${index}`} />
                        </RadioGroup>
                      ) : (
                        <Checkbox
                          checked={formData.correctOptions.includes(String(index))}
                          onCheckedChange={() => toggleCorrectOption(String(index))}
                        />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground shrink-0 w-14">Option {index + 1}{index < 2 ? ' *' : ''}</Label>
                        <Input
                          placeholder={`Enter option ${index + 1}${index < 2 ? ' (required)' : ''}`}
                          value={opt.text}
                          onChange={(e) => updateOption(index, 'text', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                      {/* Option image upload */}
                      <div
                        className="flex items-center justify-center gap-2 rounded-md border-2 border-dashed border-gray-200 px-3 py-2 cursor-pointer hover:border-amber-400 transition-colors"
                        onClick={() => optionFileRefs.current[index]?.click()}
                      >
                        {opt.image ? (
                          <div className="flex items-center gap-2 w-full">
                            <div className="w-16 h-10 rounded overflow-hidden bg-gray-100 shrink-0">
                              <img src={opt.image} alt={`Option ${index + 1}`} className="w-full h-full object-contain" />
                            </div>
                            <span className="text-xs text-emerald-600">Image uploaded</span>
                            <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto" onClick={(e) => { e.stopPropagation(); updateOption(index, 'image', null) }}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-400">Upload image</span>
                          </>
                        )}
                        <input
                          ref={(el) => { optionFileRefs.current[index] = el }}
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleOptionImageUpload(index, e.target.files[0])
                              e.target.value = ''
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {formData.correctOptions.length === 0 && (
                <p className="text-xs text-amber-600">Select at least one correct answer</p>
              )}
            </div>
          )}

          {/* ═══ Numerical Answer Type ═══ */}
          {formData.type === 'numerical' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="num-answer">Answer <span className="text-destructive">*</span></Label>
                <Input
                  id="num-answer"
                  placeholder="Enter answer (comma-separated for multiple, e.g. 4 or 2,4,6)"
                  value={formData.numericalAnswer}
                  onChange={(e) => updateField('numericalAnswer', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Separate multiple accepted answers with commas</p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.numericalRange}
                  onCheckedChange={(v) => updateField('numericalRange', v)}
                />
                <Label className="text-sm">Range (accept answers within a range)</Label>
              </div>
              {formData.numericalRange && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="range-min">Min Value</Label>
                    <Input
                      id="range-min"
                      type="number"
                      placeholder="e.g. 0"
                      value={formData.rangeMin}
                      onChange={(e) => updateField('rangeMin', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="range-max">Max Value</Label>
                    <Input
                      id="range-max"
                      type="number"
                      placeholder="e.g. 100"
                      value={formData.rangeMax}
                      onChange={(e) => updateField('rangeMax', e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Question Images */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Question Images</Label>
            <div className="grid grid-cols-3 gap-3">
              {(['questionImage1', 'questionImage2', 'questionImage3'] as const).map((field, i) => (
                <ImageUploadArea
                  key={field}
                  label={`Image ${i + 1}`}
                  value={formData[field]}
                  onUpload={(file) => handleImageUpload(field, file)}
                  onRemove={() => updateField(field, null)}
                  inputRefSetter={(el) => { questionImageRefs.current[i] = el }}
                />
              ))}
            </div>
          </div>

          {/* ═══ Solution Section ═══ */}
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-sm font-semibold">Solution</Label>
            <div className="space-y-2">
              <Label htmlFor="sol-heading">Solution Heading <span className="text-destructive">*</span></Label>
              <Input
                id="sol-heading"
                placeholder="Solution heading"
                value={formData.solutionHeading}
                onChange={(e) => updateField('solutionHeading', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sol-text">Solution Text</Label>
              <Textarea
                id="sol-text"
                placeholder="Detailed solution explanation..."
                rows={4}
                value={formData.solutionText}
                onChange={(e) => updateField('solutionText', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(['solutionImage1', 'solutionImage2'] as const).map((field, i) => (
                <ImageUploadArea
                  key={field}
                  label={`Solution Image ${i + 1}`}
                  value={formData[field]}
                  onUpload={(file) => handleImageUpload(field, file)}
                  onRemove={() => updateField(field, null)}
                  inputRefSetter={(el) => { solutionImageRefs.current[i] = el }}
                />
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sol-video">Solution Video URL</Label>
              <Input
                id="sol-video"
                placeholder="https://youtube.com/..."
                value={formData.solutionVideo}
                onChange={(e) => updateField('solutionVideo', e.target.value)}
              />
            </div>
          </div>

          {/* ═══ Marking Scheme ═══ */}
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-sm font-semibold">Marking Scheme</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pos-marks">Positive Marks <span className="text-destructive">*</span></Label>
                <Input
                  id="pos-marks"
                  type="number"
                  step="0.5"
                  value={formData.positiveMarks}
                  onChange={(e) => updateField('positiveMarks', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="neg-marks">Negative Marks <span className="text-destructive">*</span></Label>
                <Input
                  id="neg-marks"
                  type="number"
                  step="0.25"
                  value={formData.negativeMarks}
                  onChange={(e) => updateField('negativeMarks', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t bg-white px-6 py-4 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white"
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save & Go To Next'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
