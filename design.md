# Design System & UI Guidelines

## 1. Design Philosophy
The platform prioritizes clarity, accessibility, and focus. The interface must minimize distractions for students during learning, while providing dense, actionable data for teachers and administrators.

## 2. Core UI Libraries
- **CSS Framework**: Tailwind CSS (v3/v4).
- **Component Library**: shadcn/ui (built on Radix UI primitives) for accessible, customizable components.
- **Data Visualization**: Recharts (or similar accessible charting library) for Analytics Dashboards.
- **Drag-and-Drop**: `dnd-kit` for accessible and robust course module reordering.
- **Icons**: Lucide React for consistent, crisp iconography.

## 3. UI Patterns for New Features

### Dashboards & Analytics (Phase 1)
- **Visual Hierarchy**: Use prominent summary cards at the top for KPIs (e.g., Average Score, Completion Rate).
- **Charts**: Use clean line charts for trends over time, and bar charts for comparative data. Always provide tooltips with exact numbers.
- **Empty States**: Design friendly empty states for new students/teachers without data yet (e.g., "No tests taken yet. Start exploring courses!").

### Content Organization (Phase 2)
- **Course Builder**: Implement a clear sidebar for module lists and a main canvas for lesson editing. Use grab handles (six dots) to indicate draggable elements.
- **Student Library**: Offer both Grid (cover images) and List views for study materials. Include a prominent search bar and visual tags/chips for categorization.

### Interactive Tools & Assignments (Phase 3)
- **Grading Interface**: Utilize a split-pane layout. Student submission (PDF/Document) on the left, grading rubric and feedback text area on the right.
- **Flashcards**: Implement 3D flip animations using Framer Motion/CSS transforms to simulate real physical cards.

### Live Virtual Classroom (Phase 4)
- **Video UI**: Implement dynamic grid layouts that adjust based on participant count. 
- **Floating Controls**: Auto-hiding control bars for mute/video/screen-share to maximize teaching space.
- **Side Panels**: Collapsible sidebars for Live Chat and Participant lists to prevent overlaying the main video feed.

## 4. Responsive & Mobile-First Constraints
- **Touch Targets**: Ensure buttons (especially in the Live Video and Exam UI) have a minimum size of 44x44px for easy tapping on Capacitor mobile builds.
- **Viewport Locking**: For CBT Exams and Live Video, lock the viewport scaling to prevent accidental zooming.


## Phase 3 UI Design Decisions
- **Teacher Assignment Manager**: A split view with a grid of cards for each assignment, highlighting the number of submissions in a green badge and due date in orange to signify urgency.
- **Student Flashcards**: The UI isolates one card at a time with a massive 3D-perspective container. A `rotateX` transform on click provides physical feedback, while 'Next/Prev' buttons manage the queue.