"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { apiFetch } from "@/lib/api-client"

const formSchema = z.object({
  title: z.string().min(1, "Question title is required"),
  option1: z.string().min(1, "Option 1 is required"),
  option2: z.string().min(1, "Option 2 is required"),
  option3: z.string().min(1, "Option 3 is required"),
  option4: z.string().min(1, "Option 4 is required"),
  correctOption: z.string().min(1, "Correct option is required"),
  positiveMarks: z.coerce.number().min(0, "Positive marks must be >= 0"),
  negativeMarks: z.coerce.number().min(0, "Negative marks must be >= 0"),
  solutionText: z.string().optional(),
  image1: z.string().optional(),
  option1Image: z.string().optional(),
  option2Image: z.string().optional(),
  option3Image: z.string().optional(),
  option4Image: z.string().optional(),
  solutionImage1: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface QuestionFormProps {
  testId: string
  initialData?: any
  onSuccess: () => void
  onCancel: () => void
}

export function QuestionForm({ testId, initialData, onSuccess, onCancel }: QuestionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      title: initialData?.title || "",
      option1: initialData?.option1 || "",
      option2: initialData?.option2 || "",
      option3: initialData?.option3 || "",
      option4: initialData?.option4 || "",
      correctOption: initialData?.correctOption?.toString() || "1",
      positiveMarks: initialData?.positiveMarks || 1,
      negativeMarks: initialData?.negativeMarks || 0,
      solutionText: initialData?.solutionText || "",
      image1: initialData?.image1 || "",
      option1Image: initialData?.option1Image || "",
      option2Image: initialData?.option2Image || "",
      option3Image: initialData?.option3Image || "",
      option4Image: initialData?.option4Image || "",
      solutionImage1: initialData?.solutionImage1 || "",
    },
  })

  const [uploadingImageFor, setUploadingImageFor] = useState<string | null>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof FormValues) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImageFor(fieldName)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'x-auth-token': localStorage.getItem('apiToken') || '' },
        body: formData
      })
      const data = await res.json()
      
      if (res.ok && data.url) {
        form.setValue(fieldName, data.url)
        toast.success('Image uploaded!')
      } else {
        throw new Error(data.error || 'Failed to upload image')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error uploading image')
    } finally {
      setUploadingImageFor(null)
      if (e.target) e.target.value = ''
    }
  }

  const renderImageUpload = (fieldName: keyof FormValues, label: string) => {
    const currentValue = form.watch(fieldName) as string
    return (
      <div className="mt-2 space-y-2">
        <FormLabel className="text-xs text-muted-foreground">{label} (Optional Image)</FormLabel>
        {currentValue ? (
          <div className="relative w-32 h-32 rounded border overflow-hidden">
            <img src={currentValue} alt={label} className="w-full h-full object-cover" />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-1 right-1 h-6 w-6 p-0"
              onClick={() => form.setValue(fieldName, '')}
            >
              ×
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              className="max-w-[250px] text-xs"
              disabled={uploadingImageFor === fieldName}
              onChange={(e) => handleImageUpload(e, fieldName)}
            />
            {uploadingImageFor === fieldName && <Loader2 className="size-4 animate-spin" />}
          </div>
        )}
      </div>
    )
  }

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      const url = initialData
        ? `/api/teacher/tests/${testId}/questions/${initialData.id}`
        : `/api/teacher/tests/${testId}/questions`
      
      const method = initialData ? "PUT" : "POST"

      const response = await apiFetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          correctOption: parseInt(values.correctOption),
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to save question")
      }

      toast.success(initialData ? "Question updated successfully" : "Question added successfully")
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
        <FormField
          control={form.control as any}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Title</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter the question text" {...field} />
              </FormControl>
              {renderImageUpload("image1", "Question Image")}
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control as any}
            name="option1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Option 1</FormLabel>
                <FormControl>
                  <Input placeholder="Option 1" {...field} />
                </FormControl>
                {renderImageUpload("option1Image", "Option 1 Image")}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control as any}
            name="option2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Option 2</FormLabel>
                <FormControl>
                  <Input placeholder="Option 2" {...field} />
                </FormControl>
                {renderImageUpload("option2Image", "Option 2 Image")}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control as any}
            name="option3"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Option 3</FormLabel>
                <FormControl>
                  <Input placeholder="Option 3" {...field} />
                </FormControl>
                {renderImageUpload("option3Image", "Option 3 Image")}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control as any}
            name="option4"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Option 4</FormLabel>
                <FormControl>
                  <Input placeholder="Option 4" {...field} />
                </FormControl>
                {renderImageUpload("option4Image", "Option 4 Image")}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control as any}
            name="correctOption"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correct Option</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct option" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Option 1</SelectItem>
                    <SelectItem value="2">Option 2</SelectItem>
                    <SelectItem value="3">Option 3</SelectItem>
                    <SelectItem value="4">Option 4</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control as any}
            name="positiveMarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Positive Marks</FormLabel>
                <FormControl>
                  <Input type="number" step="0.5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control as any}
            name="negativeMarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Negative Marks</FormLabel>
                <FormControl>
                  <Input type="number" step="0.5" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control as any}
          name="solutionText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Solution / Explanation (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter solution explanation" {...field} />
              </FormControl>
              {renderImageUpload("solutionImage1", "Solution Image")}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Question" : "Add Question"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
