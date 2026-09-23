export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkModuleAccess } from '@/lib/module-guard'
import mammoth from 'mammoth'

export async function POST(request: NextRequest) {
  try {
    const access = await checkModuleAccess(request, 'bulk-uploader')
    if (!access.allowed) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const testId = formData.get('testId') as string | null
    const format = formData.get('format') as string | null
    const parseOption = formData.get('parseOption') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!testId) {
      return NextResponse.json({ error: 'Test ID is required' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    
    let text = ''
    let html = ''

    if (parseOption === 'equations') {
      // Use adm-zip to read document.xml directly to preserve equations
      const AdmZip = (await import('adm-zip')).default
      const { DOMParser } = await import('@xmldom/xmldom')
      
      const zip = new AdmZip(buffer)
      const docXml = zip.readAsText('word/document.xml')
      
      if (docXml) {
        const doc = new DOMParser().parseFromString(docXml, 'text/xml')
        const paragraphs = doc.getElementsByTagName('w:p')
        for (let i = 0; i < paragraphs.length; i++) {
          const p = paragraphs[i]
          let pText = ''
          
          // Traverse children to find text and math nodes
          const traverse = (node: any) => {
            if (node.nodeName === 'w:t') {
              pText += node.textContent || ''
            } else if (node.nodeName === 'm:t') {
              // Math text
              pText += node.textContent || ''
            } else if (node.childNodes) {
              for (let j = 0; j < node.childNodes.length; j++) {
                traverse(node.childNodes[j])
              }
            }
          }
          traverse(p)
          
          if (pText.trim()) {
            text += pText.trim() + '\n'
            html += `<p>${pText.trim()}</p>`
          }
        }
      }
    } else {
      const { value } = await mammoth.convertToHtml({ buffer })
      html = value
    }
    
    let questions: any[] = []

    if (format === 'default') {
      questions = parseDefaultHtml(html)
    } else if (format === 'format1') {
      questions = parseFormat1Html(html)
    } else if (format === 'format2') {
      questions = parseFormat2Html(html)
    } else if (format === 'format3') {
      questions = parseFormat3Html(html)
    } else {
      return NextResponse.json({ error: 'Unsupported format selected' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      questions
    }, { status: 200 })

  } catch (error: any) {
    console.error('Bulk upload DOCX failed:', error)
    return NextResponse.json({ error: `Bulk upload failed: ${error.message || String(error)}` }, { status: 500 })
  }
}

// Default format uses: "Question:", "(a)", "Answer:", "Solution:", "Positive Marks:", "Negative Marks:"
function parseDefault(text: string) {
  const lines = text.split('\n').map(l => l.trim())
  const questions: any[] = []
  
  let currentQ: any = null
  let currentBlock = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue

    if (line.toLowerCase().startsWith('question:')) {
      if (currentQ) questions.push(currentQ)
      currentQ = { 
        id: questions.length + 1, 
        title: line.substring(9).trim(), 
        type: 'mcq', 
        posMarks: 4, 
        negMarks: 1, 
        status: 'valid' 
      }
      currentBlock = 'Question'
      continue
    }

    if (!currentQ) continue

    const optMatch = line.match(/^\(([a-e])\)\s+(.*)/i)
    if (optMatch) {
      const optLetter = optMatch[1].toLowerCase()
      const optText = optMatch[2]
      
      let optIdx = 1
      if (optLetter === 'a') optIdx = 1
      if (optLetter === 'b') optIdx = 2
      if (optLetter === 'c') optIdx = 3
      if (optLetter === 'd') optIdx = 4
      if (optLetter === 'e') optIdx = 5
      
      currentQ[`option${optIdx}`] = optText
      currentBlock = `Option${optIdx}`
      continue
    }

    if (line.toLowerCase().startsWith('answer:')) {
      let ans = line.substring(7).trim().toLowerCase()
      if (ans === 'a') ans = '1'
      if (ans === 'b') ans = '2'
      if (ans === 'c') ans = '3'
      if (ans === 'd') ans = '4'
      if (ans === 'e') ans = '5'
      currentQ.correctOption = ans
      currentBlock = 'Answer'
      continue
    }

    if (line.toLowerCase().startsWith('solution:')) {
      currentQ.solution = line.substring(9).trim()
      currentBlock = 'Solution'
      continue
    }

    if (line.toLowerCase().startsWith('positive marks:')) {
      currentQ.posMarks = parseFloat(line.substring(15).trim()) || 4
      currentBlock = 'Positive Marks'
      continue
    }

    if (line.toLowerCase().startsWith('negative marks:')) {
      currentQ.negMarks = parseFloat(line.substring(15).trim()) || 0
      currentBlock = 'Negative Marks'
      continue
    }

    // Append to current block
    switch (currentBlock) {
      case 'Question':
        currentQ.title += '\n' + line
        break
      case 'Option1':
        currentQ.option1 += '\n' + line
        break
      case 'Option2':
        currentQ.option2 += '\n' + line
        break
      case 'Option3':
        currentQ.option3 += '\n' + line
        break
      case 'Option4':
        currentQ.option4 += '\n' + line
        break
      case 'Option5':
        currentQ.option5 += '\n' + line
        break
      case 'Solution':
        currentQ.solution = currentQ.solution ? currentQ.solution + '\n' + line : line
        break
    }
  }

  if (currentQ) questions.push(currentQ)

  return questions.map(q => {
    if (!q.title) q.status = 'error', q.error = 'Missing title'
    else if (!q.option1 || !q.option2) q.status = 'error', q.error = 'Requires at least 2 options'
    else if (!q.correctOption) q.status = 'error', q.error = 'Missing correct answer'
    return q
  })
}

// Format 1 uses block keywords: Question, Type, Option, Answer, Solution, Positive Marks, Negative Marks
function parseFormat1(text: string) {
  const lines = text.split('\n').map(l => l.trim())
  const questions: any[] = []
  
  let currentBlock = ''
  let currentQ: any = null
  let optionCount = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue

    if (line === 'Question') {
      if (currentQ) questions.push(currentQ)
      currentQ = { id: questions.length + 1, type: 'mcq', posMarks: 4, negMarks: 0, status: 'valid' }
      currentBlock = 'Question'
      optionCount = 0
      continue
    }

    if (!currentQ) continue

    if (line === 'Type') { currentBlock = 'Type'; continue }
    if (line === 'Option') { 
      currentBlock = 'Option'
      optionCount++
      continue 
    }
    if (line === 'Answer') { currentBlock = 'Answer'; continue }
    if (line === 'Solution') { currentBlock = 'Solution'; continue }
    if (line === 'Positive Marks') { currentBlock = 'Positive Marks'; continue }
    if (line === 'Negative Marks') { currentBlock = 'Negative Marks'; continue }

    // Append to current block
    switch (currentBlock) {
      case 'Question':
        currentQ.title = currentQ.title ? currentQ.title + '\n' + line : line
        break
      case 'Type':
        currentQ.type = line
        break
      case 'Option':
        const optKey = `option${optionCount}`
        currentQ[optKey] = currentQ[optKey] ? currentQ[optKey] + '\n' + line : line
        break
      case 'Answer':
        // Answer might be "1" or "1,2". Just take the first valid one or store as is
        currentQ.correctOption = currentQ.correctOption ? currentQ.correctOption + ',' + line : line
        break
      case 'Solution':
        currentQ.solution = currentQ.solution ? currentQ.solution + '\n' + line : line
        break
      case 'Positive Marks':
        currentQ.posMarks = parseFloat(line) || 4
        break
      case 'Negative Marks':
        currentQ.negMarks = parseFloat(line) || 0
        break
    }
  }

  if (currentQ) questions.push(currentQ)

  // Validate
  return questions.map(q => {
    if (!q.title) q.status = 'error', q.error = 'Missing title'
    else if (!q.option1 || !q.option2) q.status = 'error', q.error = 'Requires at least 2 options'
    else if (!q.correctOption) q.status = 'error', q.error = 'Missing correct answer'
    return q
  })
}

// Format 2 uses numbered list: "1. Question text", "A. Option", "Answer A", "Solution."
function parseFormat2(text: string) {
  const lines = text.split('\n').map(l => l.trim())
  const questions: any[] = []
  
  let currentQ: any = null
  let currentBlock = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue

    // Match "1. " or "12. "
    const qMatch = line.match(/^(\d+)\.\s+(.*)/)
    if (qMatch) {
      if (currentQ) questions.push(currentQ)
      currentQ = { 
        id: parseInt(qMatch[1]), 
        title: qMatch[2], 
        type: 'mcq', 
        posMarks: 4, 
        negMarks: 1, 
        status: 'valid' 
      }
      currentBlock = 'Question'
      continue
    }

    if (!currentQ) continue

    // Match "A. ", "B. ", etc.
    const optMatch = line.match(/^([A-E])\.\s+(.*)/)
    if (optMatch) {
      const optLetter = optMatch[1] // A, B, C, D, E
      const optText = optMatch[2]
      
      let optIdx = 1
      if (optLetter === 'A') optIdx = 1
      if (optLetter === 'B') optIdx = 2
      if (optLetter === 'C') optIdx = 3
      if (optLetter === 'D') optIdx = 4
      if (optLetter === 'E') optIdx = 5
      
      currentQ[`option${optIdx}`] = optText
      currentBlock = `Option${optIdx}`
      continue
    }

    // Match "Answer A" or "Answer: A"
    const ansMatch = line.match(/^Answer\s*:?\s*([A-E1-5])/i)
    if (ansMatch) {
      let ans = ansMatch[1].toUpperCase()
      if (ans === 'A') ans = '1'
      if (ans === 'B') ans = '2'
      if (ans === 'C') ans = '3'
      if (ans === 'D') ans = '4'
      if (ans === 'E') ans = '5'
      currentQ.correctOption = ans
      currentBlock = 'Answer'
      continue
    }

    if (line.match(/^Solution\.?/i)) {
      currentBlock = 'Solution'
      continue
    }

    // Append to current block
    switch (currentBlock) {
      case 'Question':
        currentQ.title += '\n' + line
        break
      case 'Option1':
        currentQ.option1 += '\n' + line
        break
      case 'Option2':
        currentQ.option2 += '\n' + line
        break
      case 'Option3':
        currentQ.option3 += '\n' + line
        break
      case 'Option4':
        currentQ.option4 += '\n' + line
        break
      case 'Option5':
        currentQ.option5 += '\n' + line
        break
      case 'Solution':
        currentQ.solution = currentQ.solution ? currentQ.solution + '\n' + line : line
        break
    }
  }

  if (currentQ) questions.push(currentQ)

  return questions.map(q => {
    if (!q.title) q.status = 'error', q.error = 'Missing title'
    else if (!q.option1 || !q.option2) q.status = 'error', q.error = 'Requires at least 2 options'
    else if (!q.correctOption) q.status = 'error', q.error = 'Missing correct answer'
    return q
  })
}








































































































function parseDefaultHtml(html: string) {
  const blocks = html.replace(/[\r\n]+/g, ' ').split('</p>')
  const questions: any[] = []
  
  let currentQ: any = null
  let currentBlock = ''

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i] + '</p>'
    const textContent = block.replace(/<[^>]*>?/gm, '').trim()
    const imgMatch = block.match(/<img[^>]+src="([^">]+)"/i)
    const imgSrc = imgMatch ? imgMatch[1] : null

    if (!textContent && !imgSrc) continue

    if (textContent.toLowerCase().startsWith('question:')) {
      if (currentQ) questions.push(currentQ)
      currentQ = { 
        id: questions.length + 1, 
        title: textContent.substring(9).trim(), 
        type: 'mcq', 
        posMarks: 4, 
        negMarks: 1, 
        status: 'valid' 
      }
      if (imgSrc) currentQ.image1 = imgSrc
      currentBlock = 'Question'
      continue
    }

    if (!currentQ) continue

    const optMatch = textContent.match(/^\(([a-e])\)\s*(.*)/i)
    if (optMatch) {
      const optLetter = optMatch[1].toLowerCase()
      const optText = optMatch[2]
      
      let optIdx = 1
      if (optLetter === 'a') optIdx = 1
      if (optLetter === 'b') optIdx = 2
      if (optLetter === 'c') optIdx = 3
      if (optLetter === 'd') optIdx = 4
      if (optLetter === 'e') optIdx = 5
      
      currentQ['option' + optIdx] = optText
      if (imgSrc) currentQ['option' + optIdx + 'Image'] = imgSrc
      currentBlock = 'option' + optIdx
      continue
    }

    if (textContent.toLowerCase().startsWith('answer:')) {
      let ans = textContent.substring(7).trim().toLowerCase()
      if (ans === 'a') ans = '1'
      if (ans === 'b') ans = '2'
      if (ans === 'c') ans = '3'
      if (ans === 'd') ans = '4'
      if (ans === 'e') ans = '5'
      currentQ.correctOption = ans
      currentBlock = 'Answer'
      continue
    }

    if (textContent.toLowerCase().startsWith('solution:')) {
      currentQ.solution = textContent.substring(9).trim()
      currentBlock = 'Solution'
      continue
    }

    if (textContent.toLowerCase().startsWith('positive marks:')) {
      currentQ.posMarks = parseFloat(textContent.substring(15).trim()) || 4
      currentBlock = 'Positive Marks'
      continue
    }

    if (textContent.toLowerCase().startsWith('negative marks:')) {
      currentQ.negMarks = parseFloat(textContent.substring(15).trim()) || 0
      currentBlock = 'Negative Marks'
      continue
    }

    // Append to current block
    switch (currentBlock) {
      case 'Question':
        if (textContent) currentQ.title += '\n' + textContent
        if (imgSrc && !currentQ.image1) currentQ.image1 = imgSrc
        break
      case 'Option1':
      case 'Option2':
      case 'Option3':
      case 'Option4':
      case 'Option5':
        const optKey = currentBlock.toLowerCase()
        if (textContent) currentQ[optKey] += '\n' + textContent
        if (imgSrc && !currentQ[optKey + 'Image']) currentQ[optKey + 'Image'] = imgSrc
        break
      case 'Solution':
        if (textContent) currentQ.solution = currentQ.solution ? currentQ.solution + '\n' + textContent : textContent
        if (imgSrc && !currentQ.solutionImage1) currentQ.solutionImage1 = imgSrc
        break
    }
  }

  if (currentQ) questions.push(currentQ)

  return questions.map(q => {
    if (!q.title && !q.image1) q.status = 'error', q.error = 'Missing title'
    else if ((!q.option1 && !q.option1Image) || (!q.option2 && !q.option2Image)) q.status = 'error', q.error = 'Requires at least 2 options'
    else if (!q.correctOption) q.status = 'error', q.error = 'Missing correct answer'
    return q
  })
}

function parseFormat1Html(html: string) {
  const blocks = html.replace(/[\r\n]+/g, ' ').split('</p>')
  const questions: any[] = []
  
  let currentBlock = ''
  let currentQ: any = null
  let optionCount = 0

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i] + '</p>'
    const textContent = block.replace(/<[^>]*>?/gm, '').trim()
    const imgMatch = block.match(/<img[^>]+src="([^">]+)"/i)
    const imgSrc = imgMatch ? imgMatch[1] : null

    if (!textContent && !imgSrc) continue

    if (textContent === 'Question') {
      if (currentQ) questions.push(currentQ)
      currentQ = { id: questions.length + 1, type: 'mcq', posMarks: 4, negMarks: 0, status: 'valid' }
      currentBlock = 'Question'
      optionCount = 0
      continue
    }

    if (!currentQ) continue

    if (textContent === 'Type') { currentBlock = 'Type'; continue }
    if (textContent === 'Option') { 
      currentBlock = 'Option'
      optionCount++
      continue 
    }
    if (textContent === 'Answer') { currentBlock = 'Answer'; continue }
    if (textContent === 'Solution') { currentBlock = 'Solution'; continue }
    if (textContent === 'Positive Marks') { currentBlock = 'Positive Marks'; continue }
    if (textContent === 'Negative Marks') { currentBlock = 'Negative Marks'; continue }

    // Append to current block
    switch (currentBlock) {
      case 'Question':
        if (textContent) currentQ.title = currentQ.title ? currentQ.title + '\n' + textContent : textContent
        if (imgSrc && !currentQ.image1) currentQ.image1 = imgSrc
        break
      case 'Type':
        if (textContent) currentQ.type = textContent
        break
      case 'Option':
        const optKey = 'option' + optionCount
        if (textContent) currentQ[optKey] = currentQ[optKey] ? currentQ[optKey] + '\n' + textContent : textContent
        if (imgSrc && !currentQ[optKey + 'Image']) currentQ[optKey + 'Image'] = imgSrc
        break
      case 'Answer':
        if (textContent) currentQ.correctOption = currentQ.correctOption ? currentQ.correctOption + ',' + textContent : textContent
        break
      case 'Solution':
        if (textContent) currentQ.solution = currentQ.solution ? currentQ.solution + '\n' + textContent : textContent
        if (imgSrc && !currentQ.solutionImage1) currentQ.solutionImage1 = imgSrc
        break
      case 'Positive Marks':
        if (textContent) currentQ.posMarks = parseFloat(textContent) || 4
        break
      case 'Negative Marks':
        if (textContent) currentQ.negMarks = parseFloat(textContent) || 0
        break
    }
  }

  if (currentQ) questions.push(currentQ)

  return questions.map(q => {
    if (!q.title && !q.image1) q.status = 'error', q.error = 'Missing title'
    else if ((!q.option1 && !q.option1Image) || (!q.option2 && !q.option2Image)) q.status = 'error', q.error = 'Requires at least 2 options'
    else if (!q.correctOption) q.status = 'error', q.error = 'Missing correct answer'
    return q
  })
}

function parseFormat2Html(html: string) {
  const blocks = html.replace(/[\r\n]+/g, ' ').split('</p>')
  const questions: any[] = []
  
  let currentQ: any = null
  let currentBlock = ''

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i] + '</p>'
    const textContent = block.replace(/<[^>]*>?/gm, '').trim()
    const imgMatch = block.match(/<img[^>]+src="([^">]+)"/i)
    const imgSrc = imgMatch ? imgMatch[1] : null

    if (!textContent && !imgSrc) continue

    const qMatch = textContent.match(/^(\d+)\.\s+(.*)/)
    if (qMatch) {
      if (currentQ) questions.push(currentQ)
      currentQ = { 
        id: parseInt(qMatch[1]), 
        title: qMatch[2], 
        type: 'mcq', 
        posMarks: 4, 
        negMarks: 1, 
        status: 'valid' 
      }
      if (imgSrc) currentQ.image1 = imgSrc
      currentBlock = 'Question'
      continue
    }

    if (!currentQ) continue

    const optMatch = textContent.match(/^([A-E])\.\s+(.*)/)
    if (optMatch) {
      const optLetter = optMatch[1]
      const optText = optMatch[2]
      
      let optIdx = 1
      if (optLetter === 'A') optIdx = 1
      if (optLetter === 'B') optIdx = 2
      if (optLetter === 'C') optIdx = 3
      if (optLetter === 'D') optIdx = 4
      if (optLetter === 'E') optIdx = 5
      
      currentQ['option' + optIdx] = optText
      if (imgSrc) currentQ['option' + optIdx + 'Image'] = imgSrc
      currentBlock = 'Option' + optIdx
      continue
    }

    const ansMatch = textContent.match(/^Answer\s*:?\s*([A-E1-5])/i)
    if (ansMatch) {
      let ans = ansMatch[1].toUpperCase()
      if (ans === 'A') ans = '1'
      if (ans === 'B') ans = '2'
      if (ans === 'C') ans = '3'
      if (ans === 'D') ans = '4'
      if (ans === 'E') ans = '5'
      currentQ.correctOption = ans
      currentBlock = 'Answer'
      continue
    }

    if (textContent.match(/^Solution\.?/i)) {
      currentQ.solution = textContent.replace(/^Solution\.?\s*/i, '').trim()
      currentBlock = 'Solution'
      continue
    }

    // Append to current block
    switch (currentBlock) {
      case 'Question':
        if (textContent) currentQ.title += '\n' + textContent
        if (imgSrc && !currentQ.image1) currentQ.image1 = imgSrc
        break
      case 'Option1':
      case 'Option2':
      case 'Option3':
      case 'Option4':
      case 'Option5':
        const optKey = currentBlock.toLowerCase()
        if (textContent) currentQ[optKey] += '\n' + textContent
        if (imgSrc && !currentQ[optKey + 'Image']) currentQ[optKey + 'Image'] = imgSrc
        break
      case 'Solution':
        if (textContent) currentQ.solution = currentQ.solution ? currentQ.solution + '\n' + textContent : textContent
        if (imgSrc && !currentQ.solutionImage1) currentQ.solutionImage1 = imgSrc
        break
    }
  }

  if (currentQ) questions.push(currentQ)

  return questions.map(q => {
    if (!q.title && !q.image1) q.status = 'error', q.error = 'Missing title'
    else if ((!q.option1 && !q.option1Image) || (!q.option2 && !q.option2Image)) q.status = 'error', q.error = 'Requires at least 2 options'
    else if (!q.correctOption) q.status = 'error', q.error = 'Missing correct answer'
    return q
  })
}

function parseFormat3Html(html: string) {
  const blocks = html.replace(/[\r\n]+/g, ' ').split('</p>')
  const questions: any[] = []
  
  let currentQ: any = null
  let currentBlock = ''

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i] + '</p>'
    const textContent = block.replace(/<[^>]*>?/gm, '').trim()
    const imgMatch = block.match(/<img[^>]+src="([^">]+)"/i)
    const imgSrc = imgMatch ? imgMatch[1] : null

    if (!textContent && !imgSrc) continue

    const qMatch = textContent.match(/^Question\s*:\s*(.*)/i)
    if (qMatch) {
      if (currentQ) questions.push(currentQ)
      currentQ = { 
        id: questions.length + 1, 
        title: qMatch[1], 
        type: 'mcq', 
        posMarks: 4, 
        negMarks: 1, 
        status: 'valid' 
      }
      if (imgSrc) currentQ.image1 = imgSrc
      currentBlock = 'Question'
      continue
    }

    if (!currentQ) continue

    const optMatch = textContent.match(/^\(([a-eA-E])\)\s+(.*)/)
    if (optMatch) {
      const optLetter = optMatch[1].toUpperCase()
      const optText = optMatch[2]
      
      let optIdx = 1
      if (optLetter === 'A') optIdx = 1
      if (optLetter === 'B') optIdx = 2
      if (optLetter === 'C') optIdx = 3
      if (optLetter === 'D') optIdx = 4
      if (optLetter === 'E') optIdx = 5
      
      currentQ['option' + optIdx] = optText
      if (imgSrc) currentQ['option' + optIdx + 'Image'] = imgSrc
      currentBlock = 'Option' + optIdx
      continue
    }

    const ansMatch = textContent.match(/^Answer\s*:?\s*([a-eA-E1-5])/i)
    if (ansMatch) {
      let ans = ansMatch[1].toUpperCase()
      if (ans === 'A') ans = '1'
      if (ans === 'B') ans = '2'
      if (ans === 'C') ans = '3'
      if (ans === 'D') ans = '4'
      if (ans === 'E') ans = '5'
      currentQ.correctOption = ans
      currentBlock = 'Answer'
      continue
    }

    if (textContent.match(/^Solution\s*:?/i)) {
      currentQ.solution = textContent.replace(/^Solution\s*:?\s*/i, '').trim()
      currentBlock = 'Solution'
      continue
    }
    
    const posMatch = textContent.match(/^Positive Marks\s*:?\s*([\d\.]+)/i)
    if (posMatch) {
      currentQ.posMarks = parseFloat(posMatch[1]) || 4
      continue
    }

    const negMatch = textContent.match(/^Negative Marks\s*:?\s*([\d\.]+)/i)
    if (negMatch) {
      currentQ.negMarks = parseFloat(negMatch[1]) || 0
      continue
    }

    // Append to current block (if they write multiple lines for an option/question)
    switch (currentBlock) {
      case 'Question':
        if (textContent) currentQ.title += '\n' + textContent
        if (imgSrc && !currentQ.image1) currentQ.image1 = imgSrc
        break
      case 'Option1':
      case 'Option2':
      case 'Option3':
      case 'Option4':
      case 'Option5':
        const optKey = currentBlock.toLowerCase()
        if (textContent) currentQ[optKey] += '\n' + textContent
        if (imgSrc && !currentQ[optKey + 'Image']) currentQ[optKey + 'Image'] = imgSrc
        break
      case 'Solution':
        if (textContent) currentQ.solution = currentQ.solution ? currentQ.solution + '\n' + textContent : textContent
        if (imgSrc && !currentQ.solutionImage1) currentQ.solutionImage1 = imgSrc
        break
    }
  }

  if (currentQ) questions.push(currentQ)

  return questions.map(q => {
    if (!q.title && !q.image1) q.status = 'error', q.error = 'Missing title'
    else if ((!q.option1 && !q.option1Image) || (!q.option2 && !q.option2Image)) q.status = 'error', q.error = 'Requires at least 2 options'
    else if (!q.correctOption) q.status = 'error', q.error = 'Missing correct answer'
    return q
  })
}
