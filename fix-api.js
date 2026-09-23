const fs = require('fs');

const path = 'src/app/api/reported-questions/route.ts';
let content = fs.readFileSync(path, 'utf8');

// Update include to fetch test title and student info (if available)
content = content.replace(
  /include: \{\s*question: \{\s*select: \{\s*id: true,\s*title: true,\s*type: true,\s*testId: true,\s*\},\s*\},\s*\}/g,
  `include: {
          question: {
            select: {
              id: true,
              title: true,
              type: true,
              testId: true,
              test: {
                select: { title: true }
              }
            },
          },
        }`
);

// Map items before returning
content = content.replace(
  /return NextResponse\.json\(\{\ items,\ total,\ page,\ limit\ \}\)/g,
  `const formattedItems = items.map((item: any) => ({
      id: item.id,
      questionId: item.questionId,
      questionTitle: item.question?.title || 'Unknown Question',
      testName: item.question?.test?.title || 'Unknown Test',
      reportedBy: item.studentId || 'Anonymous',
      reason: item.reason,
      status: item.status,
      date: item.createdAt.toISOString().split('T')[0],
    }))

    return NextResponse.json({ items: formattedItems, total, page, limit })`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed reported-questions API route!');
