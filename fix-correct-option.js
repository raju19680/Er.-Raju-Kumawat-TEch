const fs = require('fs');
const file = 'src/components/cms/test-portal/question-editor.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "setCorrectOption(editData?.correctOption ?? 'option1');",
  "setCorrectOption(editData?.correctOption ? editData.correctOption.split(',') : []);"
);

fs.writeFileSync(file, content);
console.log('Fixed correctOption in useEffect');
