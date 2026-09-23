# Project Context Memory (AI Assistant)

## Project Purpose
"Er. Raju Kumawat APP" is a multi-tenant, high-performance EdTech platform designed for online education, live tests, and interactive learning.

## Key Architectural Context
- **Multi-tenant**: Strict data isolation per institute via `organizationId`.
- **Stack**: Next.js 16 (App Router), Prisma, Supabase PostgreSQL, Zustand.
- **Mobile**: Capacitor-wrapped for native Android/iOS distribution.

## Active Development Focus: 4-Phase Roadmap
The user has established a comprehensive 4-phase roadmap for rolling out new features. All code generation and architectural decisions must align with this phased approach to ensure stability.

1. **Phase 1: Analytics & Dashboards** (Completed)
   - Student Personalized Learning Dashboard API & Frontend UI integrated.
   - Teacher Progress Analytics Dashboard API & Frontend UI integrated.
2. **Phase 2: Content & Organization** (Completed)
   - Database models added for Bookmarks, Tags, and Collections.
   - Teacher Course Builder drag-and-drop integrated using @dnd-kit/core.
   - Student 'My Library' UI implemented for Bookmarks and Collections in student-app.
   - Enhanced Teacher Course Builder (drag-and-drop).
   - Student "My Library" (bookmarks, tags).
3. **Phase 3: Active Learning & Assignments** (Completed)
   - Teacher Grading UI (split-pane viewing of submissions) and Flashcard creation logic integrated.
   - Database models, basic API endpoints, Teacher Assignment Creator UI, Student Assignment Submission UI, and Interactive Flashcards UI completed.
   - Teacher Assignment Management & Grading.
   - Student Interactive Tools (Flashcards) & AI Enhancements.
4. **Phase 4: Real-time Collaboration** (Completed)
   - Integrated Jitsi Meet for Live Virtual Classrooms via iframe.
   - Created Course Chat / Discussion Forums for student-teacher interactions.
   - Database schema mapped LiveClass to Course, and CourseChat to Course.
   - Live Virtual Classroom integration.
   - Peer-to-peer Chat and Discussion Forums.

## User Review & Open Questions
Before executing Phase 4, the following decisions are pending from the user:
1. **Live Virtual Classroom Infrastructure**: Which provider will be used? (e.g., Zoom API, Daily.co, Twilio Video, WebRTC).
2. **Interactive Tools specifics**: Clarification needed on exact tools for Phase 3 (flashcards vs interactive whiteboards vs code snippets).

## Operating Directives
- **Evolutionary Documentation**: The files `prd.md`, `architecture.md`, `rules.md`, `phases.md`, `design.md`, and `memory.md` must be continuously updated and deepened as new technical decisions are made or features are built.


## Phase 3 Status (Completed)
- **Progress**: In Progress.
- **Completed**: Database models, basic API endpoints, Teacher Assignment Creator UI, Student Assignment Submission UI, and Interactive Flashcards UI.
- **Remaining**: None.

**STATUS: ALL PHASES COMPLETED. PROJECT FINISHED.**