const mammoth = require("mammoth");

const html = `<p>Question: What is this?</p><p><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" /></p><p>(a) A</p><p>(b) B</p><p>Answer: A</p><p>Solution: Look at the image.</p><p><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" /></p>`;

const blocks = html.replace(/[\r\n]+/g, ' ').split('</p>')
console.log(blocks);
const questions = [];
let currentQ = null;
let currentBlock = '';

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
console.log(JSON.stringify(questions, null, 2))
