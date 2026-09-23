const fs = require('fs');
const file = 'src/components/cms/test-portal/question-editor.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add useEffect import if not present
if (!content.includes('useEffect')) {
  content = content.replace('useState', 'useState, useEffect');
}

// Add useEffect hook
const hook = 
  useEffect(() => {
    if (open) {
      setQuestionTitle(editData?.title ?? '');
      setQuestionType(editData?.type ?? 'mcq');
      setImage1(editData?.image1 ?? '');
      setImage2(editData?.image2 ?? '');
      setImage3(editData?.image3 ?? '');
      setOption1(editData?.option1 ?? '');
      setOption2(editData?.option2 ?? '');
      setOption3(editData?.option3 ?? '');
      setOption4(editData?.option4 ?? '');
      setOption5(editData?.option5 ?? '');
      setOption1Image(editData?.option1Image ?? '');
      setOption2Image(editData?.option2Image ?? '');
      setOption3Image(editData?.option3Image ?? '');
      setOption4Image(editData?.option4Image ?? '');
      setOption5Image(editData?.option5Image ?? '');
      setCorrectOption(editData?.correctOption ?? 'option1');
      setSolutionText(editData?.solutionText ?? '');
      setSolutionVideo(editData?.solutionVideo ?? '');
      setPositiveMarks(editData?.positiveMarks ?? 1);
      setNegativeMarks(editData?.negativeMarks ?? 0);
    }
  }, [open, editData]);
;

content = content.replace(
  'const [saving, setSaving] = useState(false);',
  'const [saving, setSaving] = useState(false);\n' + hook
);

fs.writeFileSync(file, content);
console.log('Added useEffect to QuestionEditor');
