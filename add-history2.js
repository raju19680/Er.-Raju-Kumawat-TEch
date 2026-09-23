const fs = require('fs');
const file = 'student-app/src/lib/store.ts';
let content = fs.readFileSync(file, 'utf8');

const historyType = '\nexport interface StudentHistoryState {\n  page: StudentPage\n  courseId: string\n  testSeriesId: string\n  testId: string\n  productId: string\n}\n';

if (!content.includes('StudentHistoryState')) {
  content = content.replace('export type StudentPage =', historyType + 'export type StudentPage =');
}

if (!content.includes('studentPageHistory:')) {
  content = content.replace('studentPage: StudentPage', 'studentPageHistory: StudentHistoryState[]\n  studentPage: StudentPage');
  content = content.replace('setStudentPage: (page: StudentPage) => void', 'setStudentPage: (page: StudentPage) => void\n  goBackStudentPage: () => void');
  content = content.replace('studentPage: \'dashboard\',', 'studentPageHistory: [],\n    studentPage: \'dashboard\',');
  content = content.replace('studentPage: \'dashboard\',', 'studentPageHistory: [],\n        studentPage: \'dashboard\',');
  
  const newImpl = "setStudentPage: (page) => set((state) => { if (state.studentPage === page) return { studentSidebarMobileOpen: false }; const newHistory = [...(state.studentPageHistory || []), { page: state.studentPage, courseId: state.selectedCourseId, testSeriesId: state.selectedTestSeriesId, testId: state.selectedTestId, productId: state.selectedProductId }].slice(-20); return { studentPage: page, studentPageHistory: newHistory, studentSidebarMobileOpen: false }; }),\n  goBackStudentPage: () => set((state) => { const history = state.studentPageHistory || []; if (history.length === 0) { return { studentPage: 'dashboard' }; } const newHistory = [...history]; const prevState = newHistory.pop(); return { studentPageHistory: newHistory, studentPage: prevState.page, selectedCourseId: prevState.courseId, selectedTestSeriesId: prevState.testSeriesId, selectedTestId: prevState.testId, selectedProductId: prevState.productId }; }),";

  content = content.replace('setStudentPage: (page) => set({ studentPage: page, studentSidebarMobileOpen: false }),', newImpl);

  fs.writeFileSync(file, content);
  console.log('Added history state to store');
} else {
  console.log('History already added');
}
