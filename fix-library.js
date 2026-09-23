const fs = require('fs');

const path = 'src/components/cms/test-portal/question-library.tsx';
let content = fs.readFileSync(path, 'utf8');

// Remove Add Question button
content = content.replace(
  /<Button onClick=\{openAddEditor\} className="w-full sm:w-auto bg-black hover:bg-gray-800 text-white">\s*<Plus className="size-4 mr-2" \/>\s*Add Question\s*<\/Button>/g,
  `{/* Add Question Button Removed: Questions must be added within a specific test context */}`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed question-library!');
