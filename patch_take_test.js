const fs = require('fs');
const p = 'src/components/student-portal/take-test.tsx';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(
  /const questions = test\?\.questions \|\| \[\]/g,
  `const questions = test?.questions || []
  const optionCount = test?.examProfile?.rules?.[0]?.optionCount || (test?.optionsCount || 4)
  const optionsList = Array.from({ length: optionCount }, (_, i) => String(i + 1))
  const unattemptedPenalty = test?.examProfile?.rules?.[0]?.unattempted || 0`
);

c = c.replace(
  /\{?\['1', '2', '3', '4', '5'\]\.map\(\(num\) => \{/g,
  `{optionsList.map((num) => {`
);

c = c.replace(
  /<DialogDescription>\s*Are you sure you want to submit the test\? You cannot change your answers after submission\.\s*<\/DialogDescription>/,
  `<DialogDescription>
                Are you sure you want to submit the test? You cannot change your answers after submission.
                {unattemptedPenalty > 0 && notAnsweredCnt > 0 && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-md font-semibold text-left">
                    Warning: You have {notAnsweredCnt} unattempted questions! 
                    Your exam profile has a penalty ({unattemptedPenalty} marks) for leaving questions completely blank. 
                    {optionCount === 5 && " Please select the 5th option (E) if you do not want to attempt."}
                  </div>
                )}
              </DialogDescription>`
);

fs.writeFileSync(p, c);
console.log('patched');
