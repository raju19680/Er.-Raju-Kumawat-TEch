const fs = require('fs');
const file = 'src/components/cms/test-portal/question-library.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "<QuestionEditor key={editQuestion?.id || 'new'}",
  "<QuestionEditor"
);

fs.writeFileSync(file, content);
