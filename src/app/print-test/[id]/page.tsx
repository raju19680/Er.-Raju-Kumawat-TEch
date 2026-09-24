'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function PrintTestPage({ params }: { params: { id: string } }) {
  const [test, setTest] = useState<any>(null)
  const searchParams = useSearchParams()
  const withSolutions = searchParams.get('solutions') === 'true'
  const brandName = "Er. Raju Kumawat"

  useEffect(() => {
    fetch('/api/teacher/tests/' + params.id)
      .then(res => res.json())
      .then(data => {
         if (data.success && data.data) {
           setTest(data.data)
         }
      })
  }, [params.id])

  useEffect(() => {
    if (test) {
      setTimeout(() => {
        const element = document.getElementById('print-area')
        const safeName = (test.title || 'Test').replace(/[^a-zA-Z0-9_ -]/g, '_').substring(0, 50)
        const filename = `${safeName}${withSolutions ? '_With_Solutions' : '_Questions_Only'}.pdf`
        
        import('html2pdf.js').then((html2pdfModule) => {
          const html2pdf = html2pdfModule.default
          const opt = {
            margin:       10,
            filename:     filename,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
          
          html2pdf().set(opt).from(element).save().then(() => {
             window.close()
          })
        })
      }, 1000) // Wait a second for images/fonts to render
    }
  }, [test, withSolutions])

  if (!test) return <div className="p-10 text-center text-xl">Loading and Generating PDF... Please wait.</div>

  return (
    <div className="bg-white min-h-screen">
      <div id="print-area" className="bg-white text-black p-8 relative" style={{ fontFamily: 'sans-serif' }}>
        {/* Watermark */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10 overflow-hidden" style={{ zIndex: 0 }}>
          <h1 style={{ fontSize: '150px', transform: 'rotate(-45deg)', whiteSpace: 'nowrap', position: 'fixed', top: '50%', left: '50%', marginTop: '-100px', marginLeft: '-300px' }}>
            {brandName}
          </h1>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="text-center border-b-2 border-black pb-4 mb-6">
             <h1 className="text-3xl font-bold mb-2">{brandName}</h1>
             <h2 className="text-xl font-semibold">{test.title}</h2>
             <p className="text-gray-600">
               {test.subject} &bull; Total Marks: {test.totalMarks} &bull; Duration: {test.totalDuration} mins
               <br/>
               {withSolutions ? '(With Solutions)' : '(Questions Only)'}
             </p>
          </div>

          <div className="space-y-8">
            {(test.questions || []).map((q: any, i: number) => {
              const opts = [q.option1, q.option2, q.option3, q.option4, q.option5].filter(Boolean)
              return (
                <div key={q.id} className="break-inside-avoid">
                   <div className="flex gap-2">
                     <span className="font-bold min-w-[30px]">Q{i + 1}.</span>
                     <div dangerouslySetInnerHTML={{ __html: q.title || q.heading || '' }} className="prose max-w-none" />
                   </div>
                   
                   <div className="ml-[38px] mt-3 space-y-3">
                      {opts.map((opt, j) => (
                         <div key={j} className="flex gap-2">
                            <span className="font-medium min-w-[30px]">({String.fromCharCode(65 + j)})</span>
                            <div dangerouslySetInnerHTML={{ __html: opt }} className="prose max-w-none" />
                         </div>
                      ))}
                   </div>

                   {withSolutions && (
                     <div className="ml-[38px] mt-4 p-4 bg-gray-50 border border-gray-200 rounded text-sm">
                       <div className="font-bold mb-1">Answer: {q.correctOption ? `Option ${q.correctOption.replace('option', '')}` : 'N/A'}</div>
                       {q.solutionText && (
                         <div className="mt-2">
                           <span className="font-bold">Solution:</span>
                           <div className="mt-1 prose max-w-none" dangerouslySetInnerHTML={{ __html: q.solutionText }} />
                         </div>
                       )}
                     </div>
                   )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
