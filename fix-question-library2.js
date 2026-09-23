const fs = require('fs');
const file = 'src/components/cms/test-portal/question-library.tsx';
let content = fs.readFileSync(file, 'utf8');

const interfaceRegex = /interface Question \{[\s\S]*?correctOption\?: string\n\}/;
const newInterface = 'interface Question {\n  id: string\n  type: string\n  title: string\n  heading?: string\n  directive?: string\n  image1?: string\n  image2?: string\n  image3?: string\n  option1?: string\n  option2?: string\n  option3?: string\n  option4?: string\n  option5?: string\n  correctOption?: string\n  solutionHeading?: string\n  solutionText?: string\n  solutionVideo?: string\n  section?: string\n  positiveMarks: number\n  negativeMarks: number\n  sortOrder: number\n  testId: string\n}';
content = content.replace(interfaceRegex, newInterface);

content = content.replace(
  '<p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">\n                  {question.text}\n                </p>',
  '<div className="text-sm text-gray-700 line-clamp-3 leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: question.title || \'\' }} />'
);

content = content.replace(
  '<p className="flex-1 text-sm text-gray-700 truncate">\n                    {question.text}\n                  </p>',
  '<div className="flex-1 text-sm text-gray-700 truncate prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: question.title || \'\' }} />'
);

content = content.replace(
  '<Badge variant="secondary" className={	ext-xs }>\n                      <span className={size-1.5 rounded-full  mr-1} />\n                      {question.difficulty}\n                    </Badge>',
  ''
);
content = content.replace(
  '{question.marks} marks',
  '{question.positiveMarks} marks'
);

content = content.replace(
  '<Badge variant="secondary" className={	ext-xs shrink-0 hidden md:inline-flex }>\n                    {question.difficulty}\n                  </Badge>',
  ''
);
content = content.replace(
  '{question.marks}m',
  '{question.positiveMarks}m'
);

content = content.replace(
  '          text: question.text + \' (Copy)\',\n          questionTitle: (question.questionTitle ?? question.title ?? \'\') + \' (Copy)\',',
  '          title: (question.title || \'\') + \' (Copy)\','
);

content = content.replace(
  '<p className="text-sm text-gray-700 line-clamp-2">{questionToDelete.text}</p>',
  '<div className="text-sm text-gray-700 line-clamp-2" dangerouslySetInnerHTML={{ __html: questionToDelete.title || \'\' }} />'
);

fs.writeFileSync(file, content);
console.log('Fixed QuestionLibrary interface and rendering');
