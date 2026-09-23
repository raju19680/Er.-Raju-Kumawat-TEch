# Architecture & System Design

## 1. Overview & Tech Stack
The platform is a high-performance, multi-tenant EdTech operating system built for scalability, real-time interaction, and comprehensive analytics.

### Core Technology Stack:
- **Framework**: Next.js 16 (Turbopack) with React 19 & TypeScript.
- **Database & ORM**: PostgreSQL hosted on Supabase, managed through Prisma ORM.
- **State Management**: Zustand for global application state, active exams, and real-time collaboration contexts.
- **Styling & UI**: Tailwind CSS, Radix UI primitives, Lucide Icons, and Framer Motion.
- **Mobile Engine**: Capacitor 8.4+ for native Android and iOS packaging.
- **Authentication**: JWT-based session security with bcrypt, rate limiting, and brute-force lockouts.

## 2. Multi-Tenant Architecture
The platform is designed to serve multiple organizations seamlessly while ensuring strict data isolation across all features (including live classes, chat, and analytics).

### Tenant Isolation Model:
1. Every organization has a unique `id` and an institute `code`.
2. ALL data entities (Courses, Tests, Assignments, Forum Posts, Chat Messages) are scoped to their parent `organizationId`.
3. The `resolveOrgId()` helper dynamically parses the active organization from JWT tokens, request headers, query parameters, or falls back to the default platform ID.

## 3. Real-Time & Collaboration Subsystem (Phase 4 Ready)
To support upcoming live features:
- **Notification Service (Port 3003)**: A dedicated Node.js/Socket.IO server handles low-latency communication.
- **Presence & Chat**: Leverages Socket.IO rooms partitioned by `organizationId` and `courseId` to ensure messages and presence states are securely isolated.
- **Live Virtual Classroom**: Video infrastructure will integrate via third-party SDKs (e.g., Zoom API, Daily.co), orchestrated by our backend which generates secure join tokens mapping to internal user identities.

## 4. Data Analytics Pipeline (Phase 1 Ready)
- **Aggregation**: Complex queries for Teacher Progress Analytics and Student Dashboards must avoid blocking the main event loop.
- **Optimization**: We rely on database-level aggregations (e.g., `GROUP BY` in Prisma) and indexing on highly queried fields like `studentId`, `courseId`, and `status`. For scale, materialized views or cron-based background aggregation tasks may be introduced.

## 5. Storage Subsystem (Phase 2 & 3 Ready)
- **Asset Management**: Bulk uploads for courses and student assignment submissions are streamed directly to cloud storage (S3/Supabase Storage) using pre-signed URLs to reduce load on the Next.js API nodes.
- **Security**: Uploaded files are strictly validated (size, MIME type) and their access is gated by the requester's `organizationId` and enrollment status.


## Phase 3 Architectural Additions
- **Flashcard Rendering**: The `StudentFlashcards` component uses `framer-motion` for 3D flip animations (`rotateX`) maintaining a dual-sided card structure in the DOM without heavy WebGL.
- **Assignment Submissions**: Uses Prisma `upsert` on `AssignmentSubmission` (composite key `assignmentId_studentId`) to allow students to draft or resubmit seamlessly until graded.

## Phase 4 Architectural Additions
- **Jitsi Meet Integration**: Utilized Jitsi's external iframe API (`https://meet.jit.si/${roomId}`) to avoid heavy WebRTC signaling backend maintenance while providing a robust live video experience.
- **Unified Chat Model**: `CourseChat` and `CourseChatMessage` utilize standard relational models fetching via API, ready for future WebSocket or Polling upgrades if scale requires it.

## Phase 5 Architectural Additions
- **Automatic Streak Computation**: The `/api/student/gamification/streak` route uses absolute day-difference calculations to intelligently update consecutive login streaks. It is invoked silently by `student-layout.tsx` on mount.
- **Dynamic Leaderboards**: Uses Prisma's `groupBy` over `StudentAssignment` to compute total points in real-time, eliminating the need for a desynced manual 'points' column on the Student table.