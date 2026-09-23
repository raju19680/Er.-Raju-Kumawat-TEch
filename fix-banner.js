const fs = require('fs');
const path = 'student-app/src/components/student-portal/public/public-components.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'className=\"relative mx-4 sm:mx-6 lg:mx-8 my-4 sm:my-6 rounded-xl sm:rounded-2xl overflow-hidden shadow-md flex items-center justify-center bg-gray-100\"',
  'className=\"relative mx-4 sm:mx-6 lg:mx-8 my-4 sm:my-6 rounded-xl sm:rounded-2xl overflow-hidden shadow-md flex items-center justify-center bg-gray-100 aspect-video sm:aspect-[2/1] lg:aspect-[3/1]\"'
);

content = content.replace(
  'className=\"w-full h-auto object-contain\"',
  'className=\"w-full h-full object-contain\"'
);

fs.writeFileSync(path, content, 'utf8');
