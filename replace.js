const fs = require('fs');
const path = require('path');
const file = 'h:/Er. Raju Kumawat APP - Copy/student-app/src/components/student-portal/take-test.tsx';
let content = fs.readFileSync(file, 'utf8');

// First replace for MCQ
content = content.replace(
  "if (!text && !img && !(test.isPdfTest && num !== '5')) return null",
  "const isRssbOption5 = test.uiType === 'rssb' && num === '5'\n                        if (!text && !img && !(test.isPdfTest && num !== '5') && !isRssbOption5) return null"
);

// Second replace for multiple correct
content = content.replace(
  "if (!text && !img && !(test.isPdfTest && num !== '5')) return null",
  "const isRssbOption5 = test.uiType === 'rssb' && num === '5'\n                        if (!text && !img && !(test.isPdfTest && num !== '5') && !isRssbOption5) return null"
);

// Replace label for MCQ
content = content.replace(
  "{test.isPdfTest && !text && !img && <span className=\"font-semibold text-gray-500\">Option {['A','B','C','D','E'][parseInt(num)-1]}</span>}",
  "{test.isPdfTest && !text && !img && !isRssbOption5 && <span className=\"font-semibold text-gray-500\">Option {['A','B','C','D','E'][parseInt(num)-1]}</span>}\n                              {isRssbOption5 && !text && !img && <span className=\"font-semibold text-gray-600\">Not Attempted (????????? ??????)</span>}"
);

// Replace label for multiple correct
content = content.replace(
  "{test.isPdfTest && !text && !img && <span className=\"font-semibold text-gray-500\">Option {['A','B','C','D','E'][parseInt(num)-1]}</span>}",
  "{test.isPdfTest && !text && !img && !isRssbOption5 && <span className=\"font-semibold text-gray-500\">Option {['A','B','C','D','E'][parseInt(num)-1]}</span>}\n                              {isRssbOption5 && !text && !img && <span className=\"font-semibold text-gray-600\">Not Attempted (????????? ??????)</span>}"
);

fs.writeFileSync(file, content);
console.log('Replaced successfully');
