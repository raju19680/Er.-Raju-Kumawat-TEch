import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const withSol = searchParams.get('solutions') === 'true'

    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { sortOrder: 'asc' }
        },
      }
    })

    if (!test) {
      return new NextResponse('Test not found', { status: 404 })
    }

    const brandName = "Er. Raju Kumawat"
    const safeName = (test.title || 'Test').replace(/[^a-zA-Z0-9_ -]/g, '_').substring(0, 50)
    const filename = `${safeName}${withSol ? '_With_Solutions' : '_Questions_Only'}.pdf`

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${filename}</title>
        <style>
          body { font-family: sans-serif; color: black; background: white; margin: 0; padding: 0; }
          * { box-sizing: border-box; border-color: #e5e7eb; }
          .page-break-avoid { page-break-inside: avoid; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; }
          table, th, td { border: 1px solid black; }
          th, td { padding: 8px; text-align: left; }
        </style>
        <script src="/html2pdf.bundle.min.js"></script>
      </head>
      <body>
        <div id="pdf-content" style="padding: 20px; position: relative; background: white;">
          <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; opacity: 0.1; pointer-events: none; overflow: hidden; z-index: 0;">
            <h1 style="font-size: 150px; transform: rotate(-45deg); white-space: nowrap;">${brandName}</h1>
          </div>
          <div style="position: relative; z-index: 10; max-width: 800px; margin: 0 auto;">
            <div style="text-align: center; border-bottom: 2px solid black; padding-bottom: 16px; margin-bottom: 24px;">
              <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 8px;">${brandName}</h1>
              <h2 style="font-size: 20px; font-weight: 600;">${test.title}</h2>
              <p style="color: #4b5563; margin-top: 8px;">
                ${test.subject} &bull; Total Marks: ${test.totalMarks} &bull; Duration: ${test.totalDuration} mins<br/>
                ${withSol ? '(With Solutions)' : '(Questions Only)'}
              </p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 32px;">
    `

    const questions = test.questions || []
    questions.forEach((q: any, i: number) => {
      const opts = [q.option1, q.option2, q.option3, q.option4, q.option5].filter(Boolean)
      html += `
        <div class="page-break-avoid">
          <div style="display: flex; gap: 8px;">
            <span style="font-weight: bold; min-width: 30px;">Q${i + 1}.</span>
            <div>${q.title || q.heading || ''}</div>
          </div>
          <div style="margin-left: 38px; margin-top: 12px; display: flex; flex-direction: column; gap: 12px;">
      `
      opts.forEach((opt, j) => {
        html += `
          <div style="display: flex; gap: 8px;">
            <span style="font-weight: 500; min-width: 30px;">(${String.fromCharCode(65 + j)})</span>
            <div>${opt}</div>
          </div>
        `
      })
      html += `</div>`

      if (withSol) {
        html += `
          <div style="margin-left: 38px; margin-top: 16px; padding: 16px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; font-size: 14px;">
            <div style="font-weight: bold; margin-bottom: 4px;">Answer: ${q.correctOption ? 'Option ' + q.correctOption.replace('option', '') : 'N/A'}</div>
        `
        if (q.solutionText) {
          html += `
            <div style="margin-top: 8px;">
              <span style="font-weight: bold;">Solution:</span>
              <div style="margin-top: 4px;">${q.solutionText}</div>
            </div>
          `
        }
        html += `</div>`
      }
      html += `</div>`
    })

    html += `
            </div>
          </div>
        </div>
        <script>
          window.onload = function() {
            try {
              if (typeof html2pdf === 'undefined') {
                window.parent.postMessage({ type: 'pdf-error', message: 'html2pdf library failed to load' }, '*');
                return;
              }
              var element = document.getElementById('pdf-content');
              var opt = {
                margin:       10,
                filename:     '${filename}',
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2, useCORS: true, letterRendering: true, windowWidth: 1000 },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
              };
              
              // We will pass the data URI to parent to ensure it downloads even if iframe downloads are blocked
              html2pdf().set(opt).from(element).outputPdf('datauristring').then(function(pdfDataUri) {
                 window.parent.postMessage({ type: 'pdf-done', data: pdfDataUri, filename: '${filename}' }, '*');
              }).catch(function(err) {
                 window.parent.postMessage({ type: 'pdf-error', message: err.toString() }, '*');
              });
            } catch (err) {
              window.parent.postMessage({ type: 'pdf-error', message: err.toString() }, '*');
            }
          };
        </script>
      </body>
      </html>
    `

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error) {
    console.error('Error generating PDF HTML:', error)
    return new NextResponse('Failed to generate PDF', { status: 500 })
  }
}
