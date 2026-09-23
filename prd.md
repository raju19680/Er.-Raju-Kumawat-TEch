# Product Requirements Document (PRD)
## Er. Raju Kumawat Tech - Education Super-Platform

### 1. Project Overview
Er. Raju Kumawat Educational Super-Platform is a comprehensive, multi-tenant EdTech operating system. It provides an end-to-end solution for scalable online education, interactive course delivery, real-time assessments (CBT), and mobile learning.

### 2. Target Audience & Personas
1. **Super Admin**: Platform owners managing overall operations, revenue, licensing, and multiple institutes.
2. **Teachers / Institutes (CMS Portal)**: Educators seeking powerful tools to create content, manage students, track analytics, and conduct live sessions.
3. **Students**: Learners requiring a focused, engaging, and personalized environment to access courses, submit assignments, and collaborate.

### 3. Detailed Feature Requirements (Phased Roadmap)

#### Phase 1: Analytics & Dashboards
Establishing the foundational views for tracking and progress.
- **[Student] Personalized Learning Dashboard**: 
  - Centralized hub showing enrolled courses and progress bars.
  - Recent test scores and performance trends.
  - Upcoming deadlines (assignments, live classes).
  - Recommended next steps based on weak areas identified in past tests.
- **[Teacher] Progress Analytics Dashboard**: 
  - Macro-level view of institute/class performance.
  - Average test scores across batches and individual student tracking.
  - Course completion rates and engagement metrics.
  - Early-warning system to identify at-risk students falling behind.

#### Phase 2: Content & Organization
Improving how material is stored, accessed, and managed.
- **[Teacher] Course Content Management Improvements**: 
  - Enhanced drag-and-drop course builder for modules and chapters.
  - Bulk upload capabilities for assets (PDFs, videos).
  - Rich-text support for text-based lessons and embedded media.
- **[Student] Study Material Organization**: 
  - "My Library" feature to bookmark, tag, and organize notes.
  - Search functionality to quickly retrieve specific study resources.

#### Phase 3: Active Learning & Assignments
Adding interactive elements and assignment workflows.
- **[Teacher] Assignment Management**: 
  - Ability to create assignments with deadlines and strict cut-offs.
  - Grading interface with rubric support and feedback mechanisms.
- **[Student] Interactive Learning Tools**: 
  - Built-in flashcards for quick revision.
  - Interactive code/math snippets within lessons.
  - Quick self-assessment checkpoints (mini-quizzes) within lesson flows.
- **[Student] Learning Enhancement Tools**: 
  - AI-assisted summaries of lengthy notes.
  - Built-in study planners and Pomodoro/focus timers.

#### Phase 4: Real-time Collaboration
Introducing live interactions.
- **[Teacher] Live Virtual Classroom**: 
  - Integration of video conferencing directly within the platform.
  - Features: Screen sharing, digital whiteboard, hand-raising, and session recording.
- **[Student] Collaboration Features**: 
  - Discussion forums attached to specific courses or lessons.
  - Peer-to-peer chat and study groups within the institute boundary.

### 4. Non-Functional Requirements
- **Performance**: Dashboards must load within 2 seconds using optimized database queries.
- **Multi-Tenancy**: Strict data isolation per organization/institute across all new features (e.g., chat, assignments).
- **Offline Capabilities**: Mobile app must support downloading assignments and syncing when back online.


## Phase 3: Active Learning & Assignments Updates
- **Assignment System**: Teachers can create assignments with due dates and total marks mapped directly to courses. Students can view and submit assignments using a text/rich-media submission system.
- **Interactive Flashcards**: A new study tool offering flippable cards organized into decks for memorization and spaced repetition.

## Phase 4: Real-time Collaboration Updates
- **Live Virtual Classrooms**: Embedded Jitsi Meet via iframe allowing teachers to schedule, start, and end live video sessions mapped to specific courses. Students join seamlessly through their portal.
- **Course Forums (Chat)**: A real-time chat interface tied to each course where students and teachers can interact, ask questions, and collaborate.

## Phase 5: Gamification Updates
- **Badges/Achievements**: Implemented dynamically via `Achievement` and `StudentAchievement` models.
- **Learning Streak**: A `Streak` model tracks consecutive student logins. Auto-increments on daily login.
- **Leaderboard**: Generates a dynamic point system based on the sum of `marksObtained` across all graded `StudentAssignment` records.

---

## 🚀 The Perfection & Deepening Phase
As of Phase 6 completion, the core platform exists. The new directive is **Zero New Modules**. We will now iterate through every existing module and upgrade them to enterprise standards.
This encompasses:
1. **Admin Full Control**
2. **Teacher Workflow UI**
3. **Student Immersive Experience**
4. **Security & Performance Optimization**

Please see [module_perfection_prd.md](file:///h:/Er.%20Raju%20Kumawat%20APP/module_perfection_prd.md) for the exhaustive, one-shot execution plan detailing exactly how each module will be perfected.
