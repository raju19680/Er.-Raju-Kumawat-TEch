const fs = require('fs');

function fixFile(path, names, keyword) {
  let content = fs.readFileSync(path, 'utf8');
  for (const name of names) {
    if (keyword === 'function') {
      content = content.replace(new RegExp(`export function \\\\(`), `export function ${name}(`);
    } else {
      content = content.replace(new RegExp(`export ${keyword} \\\\{`), `export ${keyword} ${name} {`);
      content = content.replace(new RegExp(`export ${keyword} \\s*\\\\{`), `export ${keyword} ${name} {`);
      content = content.replace(new RegExp(`export ${keyword} \\s*=`), `export ${keyword} ${name} =`);
    }
  }
  // Let's just do a smarter replacement.
  fs.writeFileSync(path, content);
}

// Better yet, since we lost the names, and they match the order in componentsToExport:
// No we didn't lose the names, the names are gone from the file!
// Let me just recreate the file by using split.js again! But this time taking from the git backup?
// No, the original file is overwritten.
// Wait, I have the original file content from my `split.js`? No, `split.js` read the overwritten file!
