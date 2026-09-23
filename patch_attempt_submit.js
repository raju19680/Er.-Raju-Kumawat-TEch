const fs = require('fs');
const p = 'src/app/api/student/test-attempts/[id]/route.ts';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(
  /const questions = await db.question.findMany\(\{\s*where: \{ testId: attempt.testId \},\s*select: \{[\s\S]*?\}\s*\}\)/,
  `const testDetails = await db.test.findUnique({
      where: { id: attempt.testId },
      include: { examProfile: { include: { rules: true } } }
    })
    const unattemptedPenalty = testDetails?.examProfile?.rules?.[0]?.unattempted || 0

    const questions = await db.question.findMany({
      where: { testId: attempt.testId },
      select: {
        id: true,
        correctOption: true,
        positiveMarks: true,
        negativeMarks: true,
        type: true,
      },
    })`
);

c = c.replace(
  /for \(const q of questions\) \{\s*const selectedOption = answersMap\[q.id\]\s*if \(\!selectedOption\) continue/,
  `for (const q of questions) {
      const selectedOption = answersMap[q.id]
      if (!selectedOption) {
        if (unattemptedPenalty > 0) {
          score -= Math.abs(unattemptedPenalty)
        }
        continue
      }`
);

fs.writeFileSync(p, c);
console.log('patched attempt submit route');
