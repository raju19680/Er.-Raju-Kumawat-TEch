const fs = require('fs');
const file = 'src/components/teacher/course-management-page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add to CourseFormState
content = content.replace(
  '  discountCode: string\n  sortOrder: number\n}',
  '  discountCode: string\n  sortOrder: number\n  seoTitle: string\n  seoDescription: string\n  autoGenerateSeo: boolean\n}'
);

content = content.replace(
  '  discountCode: \'\',\n  sortOrder: 0,\n}',
  '  discountCode: \'\',\n  sortOrder: 0,\n  seoTitle: \'\',\n  seoDescription: \'\',\n  autoGenerateSeo: true,\n}'
);

// Map API response to form
content = content.replace(
  '            setForm({\n              title: data.title || \'\',',
  '            setForm({\n              title: data.title || \'\',\n              seoTitle: data.seoTitle || \'\',\n              seoDescription: data.seoDescription || \'\',\n              autoGenerateSeo: !data.seoTitle && !data.seoDescription,'
);

// Map form to API request body
content = content.replace(
  '        discountCode: form.discountCode,\n        sortOrder: form.sortOrder,',
  '        discountCode: form.discountCode,\n        sortOrder: form.sortOrder,\n        seoTitle: form.autoGenerateSeo ? form.title : form.seoTitle,\n        seoDescription: form.autoGenerateSeo ? form.description : form.seoDescription,'
);

fs.writeFileSync(file, content);
console.log('Modified CourseFormState');
