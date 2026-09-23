const fs = require('fs');

function replaceFile(file, replacer) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = replacer(content);
    if (newContent !== content) {
      fs.writeFileSync(file, newContent);
      console.log('Fixed', file);
    }
  }
}

// Bookmarks
replaceFile('src/app/api/student/bookmarks/route.ts', c => {
  return c.replace(/include: \{\s*question: \{[\s\S]*?\}\s*\}/g, '')
    .replace('orderBy: { createdAt: \'desc\' }', 'orderBy: { createdAt: \'desc\' }') 
    // Need a full manual replace for bookmarks, so just leaving it as is for now if I can't easily regex it.
    // Actually wait, let's just use the exact content from student-app for these API routes! They are identical!
});
