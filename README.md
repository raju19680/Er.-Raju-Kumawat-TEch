# Educational Management System (EMS) & Student Portal

A comprehensive, full-stack educational platform built with Next.js (App Router), Prisma, PostgreSQL, and Tailwind CSS. The platform consists of two distinct applications sharing a single database and component ecosystem:
1. **Teacher CMS**: A powerful dashboard for educators to manage courses, students, live classes, and analytics.
2. **Student Portal**: An immersive, gamified learning environment for students to access courses, submit assignments, and track their progress.

## Features

### 1. Analytics & Dashboards
- **Real-time Analytics**: High-level overview of revenue, active students, and course completions.
- **Interactive Charts**: Visualizations for enrollment trends and revenue using Recharts.
- **Student Engagement**: Progress tracking and recent activity logs.

### 2. Content Management & Discovery
- **Course Builder**: Create and edit courses with rich-text descriptions.
- **Module Manager**: Organize course content into structured modules and lessons.
- **Student Enrollment**: Direct integration with Stripe for course purchases, automatically granting access to the student.

### 3. Active Learning & Assignments
- **Assignment System**: Teachers can create detailed assignments with due dates. Students can submit text or file-based answers.
- **Grading Interface**: Split-pane grading UI for teachers to review submissions, assign marks, and leave feedback.
- **Interactive Flashcards**: 3D flippable flashcard decks for interactive study and memorization (built with `framer-motion`).

### 4. Real-time Collaboration
- **Live Virtual Classrooms**: Embedded Jitsi Meet integration. Teachers can schedule live sessions, and students can join seamlessly from their portal without external links or auth tokens.
- **Course Discussion Forums**: Real-time chat interface tied to each course for peer-to-peer and student-teacher collaboration.

### 5. Gamification & Engagement
- **Learning Streaks**: Automatic day-difference tracking of consecutive logins.
- **Achievements & Badges**: Unlockable badges with flexible criteria (e.g., First Login, Week Streak, Perfect Score).
- **Class Leaderboards**: Dynamic ranking system based on total marks obtained across all graded assignments.

## Architecture

- **Framework**: Next.js 16+ (App Router)
- **Database**: PostgreSQL (hosted on Supabase)
- **ORM**: Prisma
- **Styling**: Tailwind CSS & shadcn/ui
- **Authentication**: Custom JWT-based auth via Next.js Edge Middleware
- **Deployment**: Both apps are fully production-ready and optimized.

## Getting Started

1. Clone the repository.
2. Install dependencies: `npm install` (and `npm install` in `student-app`).
3. Set up environment variables in `.env`.
4. Sync database: `npx prisma db push`
5. Run the Teacher CMS: `npm run dev` (Port 3000)
6. Run the Student Portal: `npm run dev` in `student-app` (Port 3002)
