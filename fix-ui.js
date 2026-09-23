const fs = require('fs');

const path = 'src/components/cms/test-portal/reported-questions.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix the API fetch and response formatting in handleViewQuestion
content = content.replace(
  /const data = await res\.json\(\)\s*setQuestionDetail\(data\)/g,
  `const data = await res.json()
        const q = data.question || data
        
        // Format options array
        const options = []
        if (q.option1) options.push({ text: q.option1, isCorrect: q.correctOption?.includes('1') || q.correctOption === 'Option 1' })
        if (q.option2) options.push({ text: q.option2, isCorrect: q.correctOption?.includes('2') || q.correctOption === 'Option 2' })
        if (q.option3) options.push({ text: q.option3, isCorrect: q.correctOption?.includes('3') || q.correctOption === 'Option 3' })
        if (q.option4) options.push({ text: q.option4, isCorrect: q.correctOption?.includes('4') || q.correctOption === 'Option 4' })
        if (q.option5) options.push({ text: q.option5, isCorrect: q.correctOption?.includes('5') || q.correctOption === 'Option 5' })

        setQuestionDetail({
          type: q.type || 'multiple_choice',
          section: q.section || 'General',
          marks: q.positiveMarks || 1,
          difficulty: 'Medium',
          text: q.title || q.text || 'No question text provided',
          options,
          solutionText: q.solutionText || ''
        })`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed reported-questions UI logic!');
