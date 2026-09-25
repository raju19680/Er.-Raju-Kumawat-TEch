import React from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { SecurePdfViewer } from '@/components/shared/secure-pdf-viewer'

export function TakeTestOMRView({
  test,
  questions,
  answers,
  selectAnswer,
  toggleMultipleAnswer,
  handleSubmit,
  submitting,
}: {
  test: any
  questions: any[]
  answers: Record<string, string>
  selectAnswer: (qId: string, val: string) => void
  toggleMultipleAnswer: (qId: string, val: string) => void
  handleSubmit: (force: boolean) => void
  submitting: boolean
}) {
  return (
    <div className="flex flex-1 overflow-hidden min-h-0">
      {/* Left Pane - Document Viewer */}
      <div className="flex-1 bg-gray-500 flex flex-col relative overflow-hidden">
        {test.pdfUrl ? (
          <div className="flex-1 overflow-auto bg-gray-200 p-2 sm:p-4"><SecurePdfViewer url={test.pdfUrl} title={test.title} allowDownload={test.allowPdfDownload || test.allowPdfExport || false} testId={test.id} isPasswordProtected={test.pdfPasswordProtected || false} /></div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-200 select-none" onContextMenu={e => e.preventDefault()}>
            <div className="max-w-4xl mx-auto bg-white p-6 sm:p-12 shadow-lg min-h-full print-document">
              <h2 className="text-2xl font-bold mb-8 text-center uppercase border-b-2 border-gray-900 pb-4">{test.title}</h2>
              <div className="space-y-12">
                {questions.map((q, i) => (
                  <div key={q.id} className="text-gray-900">
                    <div className="flex gap-4 mb-4">
                      <span className="font-bold text-lg">{i + 1}.</span>
                      <div className="flex-1">
                        {q.title && <div dangerouslySetInnerHTML={{ __html: q.title.replace(/\n/g, '<br/>') }} className="text-base prose prose-sm max-w-none mb-3" />}
                        {q.image1 && <img src={q.image1} alt="Q" className="max-w-full rounded mb-3" />}
                        
                        {/* Options A,B,C,D */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                          {['1','2','3','4','5'].map(optIdx => {
                            const optText = q[`option` + optIdx]
                            const optImg = q[`option` + optIdx + 'Image']
                            if (!optText && !optImg) return null
                            const label = String.fromCharCode(64 + parseInt(optIdx)) // A, B, C, D, E
                            return (
                              <div key={optIdx} className="flex gap-3 items-start">
                                <span className="font-bold text-gray-700">({label})</span>
                                <div>
                                  {optText && <div dangerouslySetInnerHTML={{ __html: optText.replace(/\n/g, '<br/>') }} />}
                                  {optImg && <img src={optImg} alt={label} className="mt-1 max-w-[200px] h-auto border" />}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Pane - Digital OMR Sheet */}
      <div className="w-80 md:w-96 bg-white border-l flex flex-col overflow-hidden shrink-0 shadow-lg z-10">
        <div className="p-4 bg-indigo-50 border-b flex items-center justify-between">
          <h3 className="font-bold text-indigo-900">OMR Answer Sheet</h3>
          <span className="text-xs font-semibold bg-indigo-200 text-indigo-800 px-2 py-1 rounded">
            {Object.keys(answers).length} / {questions.length}
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          <div className="space-y-6 max-w-[280px] mx-auto">
            {questions.map((q, i) => {
              const qNum = String(i + 1).padStart(2, '0')
              
              const optCount = ['1','2','3','4','5'].filter(num => q['option'+num] || q['option'+num+'Image'] || (test.isPdfTest && num !== '5')).length || 4
              const availableOpts = Array.from({length: optCount}).map((_, idx) => String(idx + 1))
              
              if (q.type === 'numerical') {
                return (
                  <div key={q.id} className="flex items-center gap-4 py-2 border-b border-gray-200 border-dashed">
                    <span className="w-8 text-right font-bold text-gray-500">{qNum}.</span>
                    <input 
                      type="number"
                      placeholder="Numerical"
                      value={answers[q.id] || ''}
                      onChange={(e) => selectAnswer(q.id, e.target.value)}
                      className="border rounded px-2 py-1 w-24 text-center font-mono text-sm"
                    />
                  </div>
                )
              }
              
              if (q.type === 'multiple_correct') {
                return (
                  <div key={q.id} className="flex items-center gap-4 py-1.5 border-b border-gray-200 border-dashed hover:bg-slate-100 p-1 rounded transition-colors">
                    <span className="w-8 text-right font-bold text-gray-500">{qNum}.</span>
                    <div className="flex gap-2 flex-1 justify-between">
                      {availableOpts.map(num => {
                        const selected = (answers[q.id] || '').split(',').includes(num)
                        const label = String.fromCharCode(64 + parseInt(num)) // A, B, C, D
                        return (
                          <button
                            key={num}
                            onClick={() => toggleMultipleAnswer(q.id, num)}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all shadow-sm ${selected ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-white border-gray-300 text-gray-400 hover:border-indigo-400 hover:text-indigo-500'}`}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              }
              
              // Standard MCQ
              return (
                <div key={q.id} className="flex items-center gap-4 py-1.5 border-b border-gray-200 border-dashed hover:bg-slate-100 p-1 rounded transition-colors">
                  <span className="w-8 text-right font-bold text-gray-500">{qNum}.</span>
                  <div className="flex gap-2 flex-1 justify-between">
                    {availableOpts.map(num => {
                      const selected = answers[q.id] === num
                      const label = String.fromCharCode(64 + parseInt(num))
                      return (
                        <button
                          key={num}
                          onClick={() => selectAnswer(q.id, num)}
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all shadow-sm ${selected ? 'bg-indigo-600 border-indigo-700 text-white' : 'bg-white border-gray-300 text-gray-400 hover:border-indigo-400 hover:text-indigo-500'}`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        <div className="p-4 bg-white border-t shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
          <Button
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 text-base shadow-md hover:shadow-lg transition-all"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
          >
            {submitting ? <Loader2 className="size-5 animate-spin mr-2" /> : null}
            Submit Test
          </Button>
        </div>
      </div>
    </div>
  )
}



