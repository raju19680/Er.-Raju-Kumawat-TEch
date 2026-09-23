const fs = require('fs');
const file = 'src/components/cms/test-portal/question-editor.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('useEffect')) {
  content = content.replace('useState', 'useState, useEffect');
}

const hook = '\n  useEffect(() => {\n    if (open) {\n      setQuestionTitle(editData?.title ?? \'\');\n      setQuestionType(editData?.type ?? \'mcq\');\n      setImage1(editData?.image1 ?? \'\');\n      setImage2(editData?.image2 ?? \'\');\n      setImage3(editData?.image3 ?? \'\');\n      setOption1(editData?.option1 ?? \'\');\n      setOption2(editData?.option2 ?? \'\');\n      setOption3(editData?.option3 ?? \'\');\n      setOption4(editData?.option4 ?? \'\');\n      setOption5(editData?.option5 ?? \'\');\n      setOption1Image(editData?.option1Image ?? \'\');\n      setOption2Image(editData?.option2Image ?? \'\');\n      setOption3Image(editData?.option3Image ?? \'\');\n      setOption4Image(editData?.option4Image ?? \'\');\n      setOption5Image(editData?.option5Image ?? \'\');\n      setCorrectOption(editData?.correctOption ?? \'option1\');\n      setSolutionText(editData?.solutionText ?? \'\');\n      setSolutionVideo(editData?.solutionVideo ?? \'\');\n      setPositiveMarks(editData?.positiveMarks ?? 1);\n      setNegativeMarks(editData?.negativeMarks ?? 0);\n    }\n  }, [open, editData]);\n';

content = content.replace(
  'const [saving, setSaving] = useState(false);',
  'const [saving, setSaving] = useState(false);\n' + hook
);

fs.writeFileSync(file, content);
console.log('Added useEffect to QuestionEditor');
