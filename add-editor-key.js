const fs = require('fs');
const file = 'src/components/cms/test-portal/question-library.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<QuestionEditor\n        open={editorOpen}',
  '<QuestionEditor\n        key={editQuestion?.id || \'new\'}\n        open={editorOpen}'
);

fs.writeFileSync(file, content);
console.log('Added key to QuestionEditor');
