const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (file === 'route.ts') {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk('src/app/api/student');
let changed = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Replace `{ studentId: studentId }` or `studentId: studentId,` with `studentId: studentId || 'admin-bypass'`
  const newContent = content.replace(/studentId:\s*studentId(?!\s*\|\|)/g, "studentId: studentId || 'admin-bypass'");
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changed++;
    console.log('Fixed', file);
  }
});
console.log('Total fixed:', changed);
