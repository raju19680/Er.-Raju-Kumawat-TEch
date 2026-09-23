const fs = require('fs');
const file = 'student-app/src/lib/store.ts';
let content = fs.readFileSync(file, 'utf8');

// Add HistoryState type
const historyType = 
export interface StudentHistoryState {
  page: StudentPage
  courseId: string
  testSeriesId: string
  testId: string
  productId: string
}
;

if (!content.includes('StudentHistoryState')) {
  content = content.replace('export type StudentPage =', historyType + '\nexport type StudentPage =');
}

// Add state properties
if (!content.includes('studentPageHistory:')) {
  content = content.replace('studentPage: StudentPage', 'studentPageHistory: StudentHistoryState[]\n  studentPage: StudentPage');
  content = content.replace('setStudentPage: (page: StudentPage) => void', 'setStudentPage: (page: StudentPage) => void\n  goBackStudentPage: () => void');
  content = content.replace('studentPage: \'dashboard\',', 'studentPageHistory: [],\n    studentPage: \'dashboard\',');
  content = content.replace('studentPage: \'dashboard\',', 'studentPageHistory: [],\n        studentPage: \'dashboard\',');
  
  // Replace setStudentPage implementation
  content = content.replace(
    'setStudentPage: (page) => set({ studentPage: page, studentSidebarMobileOpen: false }),',
    setStudentPage: (page) => set((state) => {
      if (state.studentPage === page) return { studentSidebarMobileOpen: false };
      const newHistory = [...(state.studentPageHistory || []), {
        page: state.studentPage,
        courseId: state.selectedCourseId,
        testSeriesId: state.selectedTestSeriesId,
        testId: state.selectedTestId,
        productId: state.selectedProductId
      }].slice(-20); // Keep last 20
      return { studentPage: page, studentPageHistory: newHistory, studentSidebarMobileOpen: false };
    }),
    goBackStudentPage: () => set((state) => {
      const history = state.studentPageHistory || [];
      if (history.length === 0) {
        return { studentPage: 'dashboard' };
      }
      const newHistory = [...history];
      const prevState = newHistory.pop()!;
      return {
        studentPageHistory: newHistory,
        studentPage: prevState.page,
        selectedCourseId: prevState.courseId,
        selectedTestSeriesId: prevState.testSeriesId,
        selectedTestId: prevState.testId,
        selectedProductId: prevState.productId
      };
    }),
  );

  fs.writeFileSync(file, content);
  console.log('Added history state to store');
} else {
  console.log('History already added');
}
