const fs = require('fs');

function replaceLoose(file, searchRegex, replacement) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(searchRegex, replacement);
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log('Fixed', file);
  } else {
    console.log('Failed to match in', file);
  }
}

// take-test
replaceLoose('student-app/src/components/student-portal/take-test.tsx', 
  /allowPdfDownload\?: boolean\r?\n\s*pdfPasswordProtected\?: boolean/, 
  'allowPdfDownload?: boolean\n  pdfPasswordProtected?: boolean\n  themeSnapshot?: string | null\n  theme?: any'
);

// test-result
replaceLoose('student-app/src/components/student-portal/test-result.tsx', 
  /section: string \| null\r?\n\s*solution: \{/, 
  'section: string | null\n  timeTaken?: number\n  solution: {'
);

// notes
replaceLoose('student-app/src/app/api/student/courses/[id]/notes/route.ts',
  /export async function POST\(req: NextRequest, \{ params \}: \{ params: \{ id: string \} \}\)/g,
  'export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> })'
);

// track-view
replaceLoose('student-app/src/app/api/student/track-view/route.ts',
  /where: whereClause\.sessionId_productId/g,
  'where: whereClause'
);
