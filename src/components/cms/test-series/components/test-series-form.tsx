'use client'

import React from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { MediaImage } from '@/components/ui/media-image'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/api-client'
import { Separator } from '@/components/ui/separator'
import { Upload, ImagePlus } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function TestSeriesForm({ 
  drawerOpen, 
  setDrawerOpen, 
  editingId, 
  resetForm, 
  activeTab, 
  setActiveTab, 
  formData, 
  updateField, 
  uploading, 
  setUploading, 
  orgCode, 
  categories, 
  examProfiles = [],
  loadingTests, 
  testOptions, 
  saving, 
  handleSubmit 
}: any) {
  return (
    <Sheet open={drawerOpen} onOpenChange={(open) => {
      if (!open) resetForm()
      setDrawerOpen(open)
    }}>
      <SheetContent
        side="right"
        className="sm:max-w-lg md:max-w-xl lg:max-w-2xl w-full overflow-y-auto p-0"
      >
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="text-lg">
            {editingId ? 'Edit Test Series' : 'Add Test Series'}
          </SheetTitle>
          <SheetDescription>
            {editingId
              ? 'Update the test series details below.'
              : 'Create a new test series for your students.'}
          </SheetDescription>
        </SheetHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-1 flex-col"
        >
          <div className="border-b px-6">
            <TabsList className="h-10 w-full justify-start rounded-none border-0 bg-transparent p-0">
              <TabsTrigger
                value="basic"
                className="relative rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Basic
              </TabsTrigger>
              <TabsTrigger
                value="advanced"
                className="relative rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Advanced
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ── Basic Tab ──────────────────────────────────────────────── */}
          <TabsContent value="basic" className="flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-5">
              {/* Upload Image */}
              <div className="space-y-2">
                <Label>Thumbnail</Label>
                <div
                  className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} border-muted-foreground/25 bg-muted/30 px-4 py-8 transition-colors hover:border-muted-foreground/40 hover:bg-muted/50`}
                  onClick={() => {
                    if (!uploading) {
                      document.getElementById('thumbnail-upload')?.click()
                    }
                  }}
                >
                  <input
                    id="thumbnail-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      const form = new FormData()
                      form.append('file', file)
                      setUploading(true)
                      try {
                        const res = await apiFetch('/api/teacher/upload-image?type=image', { 
                          method: 'POST', 
                          body: form,
                          headers: {
                            'x-organization-id': orgCode || ''
                          }
                        })
                        if (res.ok) {
                          const data = await res.json()
                          updateField('imagePreview', data.url)
                          toast.success('Image uploaded successfully')
                        } else {
                          toast.error('Upload failed')
                        }
                      } catch (err) {
                        toast.error('Failed to upload image')
                      } finally {
                        setUploading(false)
                      }
                    }}
                  />
                  {formData.imagePreview ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative flex h-32 w-48 items-center justify-center rounded-lg overflow-hidden border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <MediaImage src={formData.imagePreview} alt="Thumbnail preview" className="object-cover w-full h-full" />
                      </div>
                      <span className="text-xs text-emerald-600 font-medium">Image uploaded</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive"
                        disabled={uploading}
                        onClick={(e) => {
                          e.stopPropagation()
                          updateField('imagePreview', null)
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className={`h-8 w-8 ${uploading ? 'animate-bounce text-primary' : 'text-muted-foreground/40'}`} />
                      <p className="mt-2 text-sm text-muted-foreground">
                        {uploading ? 'Uploading...' : 'Click to upload image'}
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        Recommended: 800&times;600px
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="ts-title">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ts-title"
                  placeholder="Enter test series title"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="ts-description">Description</Label>
                <Textarea
                  id="ts-description"
                  placeholder="Describe this test series..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                />
              </div>

              {/* Category/Exam */}
              <div className="space-y-2">
                <Label>Category / Exam</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => updateField('category', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.length > 0
                      ? categories.map((c: any) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))
                      : ['JEE', 'NEET', 'CUET', 'GATE', 'UPSC', 'CAT', 'Other'].map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              </div>

              {/* Exam Profile Selection */}
              <div className="space-y-2">
                <Label>Exam Profile (Rules & Themes)</Label>
                <Select
                  value={formData.examProfileId}
                  onValueChange={(v) => updateField('examProfileId', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Exam Profile" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Exam Profile</SelectItem>
                    {examProfiles.map((p: { id: string, name: string }) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Assigning an Exam Profile automatically applies standard exam rules and UI themes to all tests in this series.
                </p>
              </div>

              {/* Price row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ts-price">Selling Price (₹)</Label>
                  <Input
                    id="ts-price"
                    type="number"
                    placeholder="0"
                    value={formData.price}
                    onChange={(e) => updateField('price', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ts-mrp">MRP (₹)</Label>
                  <Input
                    id="ts-mrp"
                    type="number"
                    placeholder="0"
                    value={formData.mrp}
                    onChange={(e) => updateField('mrp', e.target.value)}
                  />
                </div>
              </div>

              {/* Sort Order + Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ts-sort-order">Sort Order</Label>
                  <Input
                    id="ts-sort-order"
                    type="number"
                    placeholder="0"
                    value={formData.sortOrder}
                    onChange={(e) => updateField('sortOrder', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => updateField('status', v as 'published' | 'draft')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Validity Mode */}
              <div className="space-y-3">
                <Label>Validity Mode</Label>
                <RadioGroup
                  value={formData.validityMode}
                  onValueChange={(v) =>
                    updateField('validityMode', v)
                  }
                  className="flex flex-col gap-2 sm:flex-row sm:gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="days" id="validity-days" />
                    <Label htmlFor="validity-days" className="text-sm font-normal">
                      Validity Days
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="date" id="validity-date" />
                    <Label htmlFor="validity-date" className="text-sm font-normal">
                      End Date
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lifetime" id="validity-lifetime" />
                    <Label htmlFor="validity-lifetime" className="text-sm font-normal">
                      Lifetime Access
                    </Label>
                  </div>
                </RadioGroup>

                {formData.validityMode === 'days' && (
                  <div className="space-y-2">
                    <Label htmlFor="ts-validity-days">Validity (Days)</Label>
                    <Input
                      id="ts-validity-days"
                      type="number"
                      placeholder="e.g. 365"
                      value={formData.validityDays}
                      onChange={(e) => updateField('validityDays', e.target.value)}
                    />
                  </div>
                )}

                {formData.validityMode === 'date' && (
                  <div className="space-y-2">
                    <Label htmlFor="ts-validity-date">End Date</Label>
                    <Input
                      id="ts-validity-date"
                      type="date"
                      value={formData.validityDate}
                      onChange={(e) => updateField('validityDate', e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ── Advanced Tab ───────────────────────────────────────────── */}
          <TabsContent value="advanced" className="flex-1 overflow-y-auto px-6 py-5">
            <div className="space-y-5">
              {/* Enable Combo */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-sm">Enable Combo</Label>
                  <p className="text-xs text-muted-foreground">
                    Bundle multiple tests into this series
                  </p>
                </div>
                <Switch
                  checked={formData.isCombo}
                  onCheckedChange={(v) => updateField('isCombo', v)}
                />
              </div>

              {formData.isCombo && (
                <div className="space-y-2">
                  <Label>Select Tests to Include</Label>
                  <div className="max-h-48 overflow-y-auto rounded-lg border p-2 space-y-1">
                    {loadingTests ? (
                      <div className="p-2 space-y-2">
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-5 w-1/2" />
                      </div>
                    ) : testOptions.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No tests available</div>
                    ) : (
                      testOptions.map((test: any) => (
                        <label
                          key={test.id}
                          className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-muted-foreground/30"
                            checked={formData.selectedTests.includes(test.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                updateField('selectedTests', [
                                  ...formData.selectedTests,
                                  test.id,
                                ])
                              } else {
                                updateField(
                                  'selectedTests',
                                  formData.selectedTests.filter((t: string) => t !== test.id)
                                )
                              }
                            }}
                          />
                          <span className="text-sm">{test.title}</span>
                        </label>
                      ))
                    )}
                  </div>
                  {formData.selectedTests.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {formData.selectedTests.length} test(s) selected
                    </p>
                  )}
                </div>
              )}

              {/* Include in Test Maker */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-sm">Include in Test Maker</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow students to create custom tests from this series
                  </p>
                </div>
                <Switch
                  checked={formData.includeTestMaker}
                  onCheckedChange={(v) => updateField('includeTestMaker', v)}
                />
              </div>

              {/* Allow Payment */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-sm">Allow Payment</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable paid access for this test series
                  </p>
                </div>
                <Switch
                  checked={formData.allowPayment}
                  onCheckedChange={(v) => updateField('allowPayment', v)}
                />
              </div>

              <Separator />

              {/* SEO Section */}
              <div className="space-y-1">
                <h3 className="text-sm font-semibold">SEO Settings</h3>
                <p className="text-xs text-muted-foreground">
                  Optimize how this series appears in search engines
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ts-seo-title">SEO Meta Title</Label>
                <Input
                  id="ts-seo-title"
                  placeholder="Enter meta title for SEO"
                  value={formData.seoTitle}
                  onChange={(e) => updateField('seoTitle', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ts-seo-desc">SEO Meta Description</Label>
                <Textarea
                  id="ts-seo-desc"
                  placeholder="Enter meta description for SEO"
                  rows={3}
                  value={formData.seoDescription}
                  onChange={(e) => updateField('seoDescription', e.target.value)}
                />
              </div>

              {/* Enable Rich Snippets */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-sm">Enable Rich Snippets</Label>
                  <p className="text-xs text-muted-foreground">
                    Add structured data for better search appearance
                  </p>
                </div>
                <Switch
                  checked={formData.richSnippets}
                  onCheckedChange={(v) => updateField('richSnippets', v)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Sticky bottom bar */}
        <div className="border-t bg-white px-6 py-4 flex items-center justify-end gap-3 mt-auto">
          <Button
            variant="outline"
            onClick={() => {
              setDrawerOpen(false)
              resetForm()
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update Test Series' : 'Save Test Series'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
