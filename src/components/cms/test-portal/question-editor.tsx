'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MediaImage } from '@/components/ui/media-image'
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { ImageIcon, X, Loader2, Video } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { toast } from 'sonner';

export interface QuestionData {
  id?: string;
  type?: string;
  title?: string;
  image1?: string;
  image2?: string;
  image3?: string;
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
  option5?: string;
  option1Image?: string;
  option2Image?: string;
  option3Image?: string;
  option4Image?: string;
  option5Image?: string;
  correctOption?: string;
  solutionHeading?: string;
  solutionVideo?: string;
  solutionText?: string;
  positiveMarks?: number;
  negativeMarks?: number;
  testId?: string;
}

interface QuestionEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editData?: QuestionData | null;
  onSave?: () => void;
  testId?: string;
}

function ImageUploadBox({
  label,
  image,
  onUpload,
  onRemove,
  icon: Icon = ImageIcon,
  className = ""
}: {
  label: string;
  image?: string | null;
  onUpload: () => void;
  onRemove: () => void;
  icon?: any;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      <div 
        onClick={onUpload}
        className="relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
      >
        {image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <MediaImage src={image} alt="Upload preview" className="w-full h-full object-contain p-1" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow hover:bg-red-50 text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400">
            <Icon className="w-8 h-8 mb-3" />
            <p className="text-sm font-medium">Upload Image</p>
            <p className="text-xs mt-1 text-center text-gray-500">Click or Drag & Drop your file.<br/>Recommended size: 960px x 540px</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function QuestionEditor({
  open,
  onOpenChange,
  editData,
  onSave,
  testId,
}: QuestionEditorProps) {
  const isEditing = !!editData?.id;

  const [questionTitle, setQuestionTitle] = useState(editData?.title ?? '');
  const [questionType, setQuestionType] = useState(editData?.type ?? 'mcq');
  
  const [image1, setImage1] = useState(editData?.image1 ?? '');
  const [image2, setImage2] = useState(editData?.image2 ?? '');
  const [image3, setImage3] = useState(editData?.image3 ?? '');
  
  const [option1, setOption1] = useState(editData?.option1 ?? '');
  const [option2, setOption2] = useState(editData?.option2 ?? '');
  const [option3, setOption3] = useState(editData?.option3 ?? '');
  const [option4, setOption4] = useState(editData?.option4 ?? '');
  const [option5, setOption5] = useState(editData?.option5 ?? '');
  
  const [option1Image, setOption1Image] = useState(editData?.option1Image ?? '');
  const [option2Image, setOption2Image] = useState(editData?.option2Image ?? '');
  const [option3Image, setOption3Image] = useState(editData?.option3Image ?? '');
  const [option4Image, setOption4Image] = useState(editData?.option4Image ?? '');
  const [option5Image, setOption5Image] = useState(editData?.option5Image ?? '');
  
  const [solutionVideo, setSolutionVideo] = useState(editData?.solutionVideo ?? '');
  const [solutionHeading, setSolutionHeading] = useState(editData?.solutionHeading ?? 'Full Solution');
  const [solutionText, setSolutionText] = useState(editData?.solutionText ?? '');
  
  const [positiveMarks, setPositiveMarks] = useState(editData?.positiveMarks ?? 1);
  const [negativeMarks, setNegativeMarks] = useState(editData?.negativeMarks ?? 0);
  
  const [correctOption, setCorrectOption] = useState<string[]>(
    editData?.correctOption ? editData.correctOption.split(',') : []
  );

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setQuestionTitle(editData?.title ?? '');
      setQuestionType(editData?.type ?? 'mcq');
      setImage1(editData?.image1 ?? '');
      setImage2(editData?.image2 ?? '');
      setImage3(editData?.image3 ?? '');
      setOption1(editData?.option1 ?? '');
      setOption2(editData?.option2 ?? '');
      setOption3(editData?.option3 ?? '');
      setOption4(editData?.option4 ?? '');
      setOption5(editData?.option5 ?? '');
      setOption1Image(editData?.option1Image ?? '');
      setOption2Image(editData?.option2Image ?? '');
      setOption3Image(editData?.option3Image ?? '');
      setOption4Image(editData?.option4Image ?? '');
      setOption5Image(editData?.option5Image ?? '');
      setCorrectOption(editData?.correctOption ? editData.correctOption.split(',') : []);
      setSolutionText(editData?.solutionText ?? '');
      setSolutionVideo(editData?.solutionVideo ?? '');
      setPositiveMarks(editData?.positiveMarks ?? 1);
      setNegativeMarks(editData?.negativeMarks ?? 0);
    }
  }, [open, editData]);

  const isMultiSelect = questionType === 'multiple_correct';

  const handleCorrectOptionChange = (optId: string, checked: boolean) => {
    if (isMultiSelect) {
      setCorrectOption(prev => 
        checked ? [...prev, optId] : prev.filter(v => v !== optId)
      );
    } else {
      setCorrectOption([optId]);
    }
  };

  const handleSimulateUpload = async (setter: (val: string) => void) => {
    setter('https://placehold.co/600x400/png');
  };

  const buildBody = () => ({
    type: questionType,
    title: questionTitle,
    image1, image2, image3,
    option1, option2, option3, option4, option5,
    option1Image, option2Image, option3Image, option4Image, option5Image,
    correctOption: correctOption.join(','),
    solutionHeading, solutionVideo, solutionText,
    positiveMarks, negativeMarks,
    testId,
  });

  const doSave = async () => {
    if (!questionTitle) {
      toast.error('Question title is required');
      return false;
    }
    setSaving(true);
    try {
      const body = buildBody();
      const url = isEditing && editData?.id ? `/api/questions/${editData.id}` : '/api/questions';
      const method = isEditing && editData?.id ? 'PUT' : 'POST';
      
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error ?? `Request failed with status ${res.status}`);
      }

      toast.success(isEditing ? 'Question updated' : 'Question created');
      onSave?.();
      return true;
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save question');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndClose = async () => {
    if (await doSave()) onOpenChange(false);
  };

  const handleSaveAndAdd = async () => {
    if (await doSave()) {
      setQuestionTitle('');
      setImage1(''); setImage2(''); setImage3('');
      setOption1(''); setOption2(''); setOption3(''); setOption4(''); setOption5('');
      setOption1Image(''); setOption2Image(''); setOption3Image(''); setOption4Image(''); setOption5Image('');
      setCorrectOption([]);
      setSolutionVideo(''); setSolutionText('');
      document.querySelector('#q-scroll-area')?.scrollTo(0, 0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[1200px] h-[95vh] flex flex-col p-0 gap-0 overflow-hidden bg-white"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0 bg-white z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onOpenChange(false)}
              className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-800">
                {isEditing ? 'Edit Question' : 'Add New Question'}
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">TEST GK MCQ Based On PYQ</p>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div id="q-scroll-area" className="flex-1 overflow-y-auto bg-gray-50 p-6 sm:p-10 space-y-8">
          
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border space-y-6">
             <Label className="text-base font-semibold text-gray-800">Question Title*</Label>
             <Textarea 
               placeholder="Enter the question text here..."
               value={questionTitle}
               onChange={e => setQuestionTitle(e.target.value)}
               className="min-h-[120px] text-base p-4 bg-gray-50/50"
             />
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
                <ImageUploadBox label="Question Image 1" image={image1} onUpload={() => handleSimulateUpload(setImage1)} onRemove={() => setImage1('')} />
                <ImageUploadBox label="Question Image 2" image={image2} onUpload={() => handleSimulateUpload(setImage2)} onRemove={() => setImage2('')} />
                <ImageUploadBox label="Question Image 3" image={image3} onUpload={() => handleSimulateUpload(setImage3)} onRemove={() => setImage3('')} />
              </div>
              
              <div>
                <ImageUploadBox label="Solution Video" image={solutionVideo} icon={Video} onUpload={() => handleSimulateUpload(setSolutionVideo)} onRemove={() => setSolutionVideo('')} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border space-y-6">
            <h3 className="text-lg font-bold text-gray-800">Marking Scheme</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-2xl">
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">Positive Marks*</Label>
                <Input type="number" value={positiveMarks} onChange={e => setPositiveMarks(parseFloat(e.target.value) || 0)} className="h-11" />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-gray-700">Negative Marks*</Label>
                <Input type="number" value={negativeMarks} onChange={e => setNegativeMarks(parseFloat(e.target.value) || 0)} className="h-11" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg font-bold text-gray-800">Options</h3>
              <Select value={questionType} onValueChange={setQuestionType}>
                <SelectTrigger className="w-[200px] h-11 bg-white">
                  <SelectValue placeholder="Option Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">Single Correct</SelectItem>
                  <SelectItem value="multiple_correct">Multiple Correct</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[
                { id: '1', val: option1, set: setOption1, img: option1Image, setImg: setOption1Image },
                { id: '2', val: option2, set: setOption2, img: option2Image, setImg: setOption2Image },
                { id: '3', val: option3, set: setOption3, img: option3Image, setImg: setOption3Image },
                { id: '4', val: option4, set: setOption4, img: option4Image, setImg: setOption4Image },
                { id: '5', val: option5, set: setOption5, img: option5Image, setImg: setOption5Image },
              ].map((opt) => (
                <div key={opt.id} className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    {isMultiSelect ? (
                      <Checkbox checked={correctOption.includes(opt.id)} onCheckedChange={(c) => handleCorrectOptionChange(opt.id, !!c)} className="w-5 h-5 rounded-full data-[state=checked]:bg-blue-600 border-gray-300" />
                    ) : (
                      <RadioGroup value={correctOption[0]} onValueChange={(val) => handleCorrectOptionChange(val, true)}>
                        <RadioGroupItem value={opt.id} id={`opt-${opt.id}`} className="w-5 h-5 border-gray-300 text-blue-600" />
                      </RadioGroup>
                    )}
                    <Label htmlFor={`opt-${opt.id}`} className="font-semibold text-gray-700 cursor-pointer text-base">
                      Option {opt.id}{opt.id === '1' || opt.id === '2' ? '*' : ''}
                    </Label>
                  </div>
                  
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all focus-within:ring-2 ring-blue-100 ring-offset-0">
                    <Textarea placeholder="" value={opt.val} onChange={e => opt.set(e.target.value)} className="min-h-[140px] border-0 rounded-none focus-visible:ring-0 resize-none p-4 text-base bg-transparent" />
                    <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                      <ImageUploadBox label="" image={opt.img} onUpload={() => handleSimulateUpload(opt.setImg)} onRemove={() => opt.setImg('')} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border space-y-6">
            <h3 className="text-lg font-bold text-gray-800">Solution</h3>
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">Solution Heading*</Label>
              <Input value={solutionHeading} onChange={e => setSolutionHeading(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">Solution Text</Label>
              <Textarea className="min-h-[200px] p-4 text-base bg-gray-50/50" value={solutionText} onChange={e => setSolutionText(e.target.value)} />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex bg-white shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 h-[72px]">
          <Button variant="secondary" className="flex-1 rounded-none h-full bg-zinc-900 text-white hover:bg-zinc-800 text-base font-semibold" onClick={handleSaveAndClose} disabled={saving}>
            {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            Save changes
          </Button>
          <Button variant="default" className="flex-1 rounded-none h-full bg-white text-gray-900 hover:bg-gray-50 border-l border-t-0 border-b-0 border-r-0 border-zinc-200 text-base font-semibold" onClick={handleSaveAndAdd} disabled={saving}>
            {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2 text-gray-500" /> : null}
            Save and Go To Next
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
