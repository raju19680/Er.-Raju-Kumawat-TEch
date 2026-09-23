const fs = require('fs');
const file = 'src/components/cms/test-portal/question-library.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace Interface
const interfaceRegex = /interface Question \{[\s\S]*?correctOption\?: string\n\}/;
const newInterface = interface Question {
  id: string
  type: string
  title: string
  heading?: string
  directive?: string
  image1?: string
  image2?: string
  image3?: string
  option1?: string
  option2?: string
  option3?: string
  option4?: string
  option5?: string
  correctOption?: string
  solutionHeading?: string
  solutionText?: string
  solutionVideo?: string
  section?: string
  positiveMarks: number
  negativeMarks: number
  sortOrder: number
  testId: string
};
content = content.replace(interfaceRegex, newInterface);

// Replace {question.text} with dangerouslySetInnerHTML or just {question.title}
// But wait, the user said "ui ko question shi dike read kiye ja sake", so if it's HTML, we need dangerouslySetInnerHTML.
// For grid view:
content = content.replace(
  '<p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">\n                  {question.text}\n                </p>',
  '<div className="text-sm text-gray-700 line-clamp-3 leading-relaxed prose prose-sm prose-p:my-0 prose-headings:my-0" dangerouslySetInnerHTML={{ __html: question.title || \'\' }} />'
);

// For list view:
content = content.replace(
  '<p className="flex-1 text-sm text-gray-700 truncate">\n                    {question.text}\n                  </p>',
  '<div className="flex-1 text-sm text-gray-700 truncate prose prose-sm prose-p:inline prose-headings:inline" dangerouslySetInnerHTML={{ __html: question.title || \'\' }} />'
);

// Replace difficulty and marks rendering
// Grid view
content = content.replace(
  '<Badge variant="secondary" className={	ext-xs }>\n                      <span className={size-1.5 rounded-full  mr-1} />\n                      {question.difficulty}\n                    </Badge>',
  ''
);
content = content.replace(
  '{question.marks} marks',
  '{question.positiveMarks} marks'
);

// List view
content = content.replace(
  '<Badge variant="secondary" className={	ext-xs shrink-0 hidden md:inline-flex }>\n                    {question.difficulty}\n                  </Badge>',
  ''
);
content = content.replace(
  '{question.marks}m',
  '{question.positiveMarks}m'
);

// Duplicate handler
content = content.replace(
  '          text: question.text + \' (Copy)\',\n          questionTitle: (question.questionTitle ?? question.title ?? \'\') + \' (Copy)\',',
  '          title: (question.title || \'\') + \' (Copy)\','
);

// Delete text rendering
content = content.replace(
  '<p className="text-sm text-gray-700 line-clamp-2">{questionToDelete.text}</p>',
  '<div className="text-sm text-gray-700 line-clamp-2" dangerouslySetInnerHTML={{ __html: questionToDelete.title || \'\' }} />'
);

fs.writeFileSync(file, content);
console.log('Fixed QuestionLibrary interface and rendering');
