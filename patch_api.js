const fs = require('fs');

function patch(p) {
  let c = fs.readFileSync(p, 'utf8');
  if (c.includes('examProfileId: body.examProfileId')) return;

  c = c.replace(
    /allowPdfDownload: body\.allowPdfDownload \?\? false,/g,
    `allowPdfDownload: body.allowPdfDownload ?? false,
      examProfileId: body.examProfileId || null,
      themeId: body.themeId || null,`
  );

  fs.writeFileSync(p, c);
}

patch('src/app/api/teacher/tests/route.ts');
patch('src/app/api/teacher/tests/[id]/route.ts');
console.log('patched');
