const fs = require('fs');
const file = 'src/components/cms/test-portal/question-library.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<QuestionEditor\n        open={editorOpen}',
  '<QuestionEditor\n        key={editQuestion?.id || \'new\'}\n        open={editorOpen}'
);
if (!content.includes('key={editQuestion?.id')) {
  // Try another approach
  content = content.replace(
    '<QuestionEditor',
    '<QuestionEditor key={editQuestion?.id || \'new\'}'
  );
}

fs.writeFileSync(file, content);
console.log('Added key to QuestionEditor');
