const fs = require('fs');
const file = 'src/components/student-portal/public-portal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace Enroll Now click
content = content.replace(
  /onClick=\{\(\) => !isAuthenticated \? onLoginClick\(\) : openCheckout\(\{ id: course.id, type: 'course', title: course.title, price: course.price, mrp: course.mrp, thumbnail: course.thumbnail \}\)\}/g,
  "onClick={() => { const payload = { id: course.id, type: 'course', title: course.title, price: course.price, mrp: course.mrp, thumbnail: course.thumbnail }; if (!isAuthenticated || !['student', 'user'].includes((userRole || '').toLowerCase())) { useAppStore.getState().setCheckoutIntent(payload); onLoginClick(); } else { openCheckout(payload); } }}"
);

// Replace Buy Now click
content = content.replace(
  /onClick=\{\(\) => !isAuthenticated \? onLoginClick\(\) : openCheckout\(\{ id: item.id, type: 'test_series', title: item.title, price: item.price, mrp: item.mrp, thumbnail: item.thumbnail \}\)\}/g,
  "onClick={() => { const payload = { id: item.id, type: 'test_series', title: item.title, price: item.price, mrp: item.mrp, thumbnail: item.thumbnail }; if (!isAuthenticated || !['student', 'user'].includes((userRole || '').toLowerCase())) { useAppStore.getState().setCheckoutIntent(payload); onLoginClick(); } else { openCheckout(payload); } }}"
);

fs.writeFileSync(file, content);
