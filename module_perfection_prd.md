# Total Platform Perfection & Deepening PRD

**Directive**: Stop adding new conceptual features. Focus purely on making the existing system enterprise-grade, secure, hyper-fast, and beautiful. Provide "God-Mode Control" to Admins, powerful workflows to Teachers, and an immersive experience for Students.

---

## 1. Platform Administration & Settings (Admin Only)
**Goal**: Complete white-labeling, configuration, and structural control of the LMS.

* **Admin Role**:
  * **Branding & White-labeling**: UI to dynamically change the platform's primary/secondary colors, upload Logos/Favicons, and change the Organization Name.
  * **Email & SMTP Control**: UI to configure custom SMTP servers and visually edit email templates (Welcome, Password Reset, Receipt) using a rich-text or HTML editor.
  * **Feature Toggles**: Admin can globally turn on/off entire features (e.g., "Disable Gamification globally", "Disable Live Classes").
  * **Maintenance Mode**: 1-click toggle to put the platform in maintenance mode (locks out teachers/students with a custom message).
* **Security & Performance**:
  * Settings are cached in Redis/memory to prevent database hits on every page load.
  * All global settings changes are logged in the System Audit Log.

---

## 2. User & Role Management (Admin / Teacher)
**Goal**: Granular permissions, bulk operations, and deep user oversight.

* **Admin Role**:
  * **Staff & Role Management**: Create custom roles (e.g., "Support Staff", "Junior Teacher") with specific granular permissions (e.g., "Can view students but cannot edit grades").
  * **Student Deep-View**: View a single student's entire history (Logins, IPs, Devices, Courses, Grades, Support Tickets, Chat Logs).
  * **Bulk Operations**: CSV Import/Export for Students and Teachers. Bulk enroll/unenroll students from courses.
  * **Session & Security Control**: View active devices for any user and click "Force Logout". Ability to instantly Block/Suspend a user with a reason.
* **Teacher Role**:
  * View a list of their assigned students, but restricted from seeing platform-wide financials or other teachers' data.
* **Security & Performance**:
  * Strict RBAC (Role-Based Access Control) enforced at the Edge middleware.

---

## 3. Financials, Sales & Revenue (Admin)
**Goal**: Enterprise-grade billing, coupons, and teacher payouts.

* **Admin Role**:
  * **Global Revenue Dashboard**: Net MRR, Gross Volume, Refund rates, and failed payments sync'd with Stripe.
  * **Coupon & Discount Engine**: Create advanced coupons (e.g., "20% off only for Course X, expires in 3 days, max 50 uses").
  * **Teacher Payouts (Commissions)**: If multi-teacher, a UI to calculate commission splits and mark them as "Paid".
  * **Manual Invoicing**: Generate and send PDF invoices to students manually.
* **Student Role**:
  * Access to a "Billing" tab to view past receipts, download invoices, and manage saved payment methods.
* **Security & Performance**:
  * Cryptographic verification of Stripe Webhooks. No local storage of raw credit card data.

---

## 4. System Audit, Health & Moderation (Admin)
**Goal**: God-level visibility into system stability and user behavior.

* **Admin Role**:
  * **System Audit Log**: A highly searchable ledger of *every* mutating action (Who did what, at what time, from what IP). 
  * **Content Moderation Hub**: A centralized inbox for "Reported Messages" from the course forums. Admin can warn users, delete messages, or shadowban.
  * **Storage & Health Metrics**: View Database size, S3/Video storage consumption, and API error rates in real-time.
* **Security & Performance**:
  * Audit logs are read-only and immutable.
  * Asynchronous logging to prevent slowing down actual user requests.

---

## 5. Course Management & Content Engine
**Goal**: Flawless content delivery and intuitive curriculum building.

* **Admin Role**:
  * **Course Approval Workflow**: Require admin approval before a teacher's course goes "Live".
  * **Global Asset Manager**: View all uploaded videos/PDFs across the platform and delete orphaned files to save space.
* **Teacher Role**:
  * **Auto-Save & Drafts**: Background syncing every 10 seconds while editing modules.
  * **Advanced Drag & Drop**: Fluid, animated reordering of modules and lessons.
* **Student Role**:
  * **Distraction-Free Mode**: UI toggle to hide sidebars and navigation, focusing entirely on the lesson content.
  * **Smart Video Player**: Auto-resume from the last watched timestamp. Playback speed controls.
* **Security & Performance**:
  * Signed URLs for videos to prevent students from sharing direct links.

---

## 6. Live Classes (Virtual Classrooms)
**Goal**: Professional, controllable, and deeply integrated real-time video.

* **Admin Role**:
  * Dashboard of all active live classes happening right now across all teachers.
  * Ability to silently join any class as a "Hidden Moderator".
* **Teacher Role**:
  * **Waiting Rooms & Mass Controls**: Mute all, disable cameras, or end class for everyone via API.
  * **Automated Attendance**: Post-class report showing exactly who joined and for how long.
* **Student Role**:
  * Beautiful waiting room UI counting down to the class start time. 
* **Security & Performance**:
  * Secure Jitsi JWT token generation so external users cannot guess the room URL.

---

## 7. Assessments (Assignments & Flashcards)
**Goal**: Streamlined grading and anti-cheat mechanisms.

* **Admin Role**:
  * View platform-wide statistics on assessment pass/fail rates.
* **Teacher Role**:
  * **Advanced Split-Pane Grading**: PDF annotator or rich-text feedback box side-by-side with the student's submission.
  * **Grading Rubrics**: Clickable criteria blocks to auto-calculate marks.
* **Student Role**:
  * **Anti-Cheat UI**: For timed tests, warning modals if the student switches browser tabs.
  * **Interactive Flashcards**: 3D flip animations with spaced-repetition logic.

---

## 8. Communication (Chat, Forums & Notifications)
**Goal**: Organized, moderated, and real-time community building.

* **Admin Role**:
  * **Global Broadcasts**: Send a platform-wide push notification or alert banner to all users (e.g., "Scheduled Maintenance at 12 AM").
* **Teacher Role**:
  * **Threaded Forums & Pinning**: Organized Q&A where teachers can mark an "Accepted Answer" or pin announcements.
* **Student Role**:
  * **Rich Chat UI**: Read receipts, typing indicators, and the ability to upload images.
* **Security & Performance**:
  * WebSockets (or highly optimized SWR polling) for zero-latency messaging.

---

## 9. Gamification (Streaks, Badges, Leaderboards)
**Goal**: Addictive UX with dynamic configuration.

* **Admin Role**:
  * **Gamification Engine UI**: Admin panel to manually adjust points, upload custom badge SVG icons, and set global streak rules.
* **Teacher Role**:
  * **Manual Awards**: Ability to manually award "Bonus Points" or custom badges to students.
* **Student Role**:
  * **Animated UI**: Fullscreen confetti animations (using `framer-motion`) when leveling up.

---

## 10. Complete UI Tree Structure Overhaul (Navigation & Routing)
**Goal**: Ensure *every single module* (even floating or hidden ones) is systematically organized into a logical, nested sidebar tree structure for both Admin and Student portals. No orphaned features.

* **Admin / Teacher CMS Sidebar Tree (Dynamic via Role-Based Access Control - RBAC)**:
  *The sidebar will automatically hide/show modules based on whether the logged-in user is an Admin, a standard Teacher, or a custom role.*
  1. **Dashboard** (Visible to All)
  2. **Courses & Content** (Visible to All - Admin sees all, Teacher sees their own)
  3. **Assessments & Grading** (Visible to All)
  4. **Live & Community** (Visible to All)
  5. **Users & Roles** (Admin Only - Teachers get a simplified "My Students" view instead)
  6. **Sales & Financials** (Admin Only)
  7. **Gamification** (Visible to All)
  8. **Oversight & Moderation** (Admin Only)
  9. **Platform Settings** (Admin Only - White-labeling, SMTP, Feature Toggles)

* **Student Portal Navigation Tree Structure**:
  1. **Dashboard** (Resume Learning, Streaks Overview)
  2. **My Learning** (Courses, Modules, Lesson Viewer)
  3. **Interactive** (Flashcards, Live Classes, Assignments)
  4. **Community** (Forums, Global Chat)
  5. **Achievements** (Badges, Global Leaderboard)
  6. **Account & Support** (Profile, Billing/Invoices, Support Tickets, Notification Settings)

---

## Execution Plan ("One-Shot" Strategy)
We will execute these vertically. For each module listed above, we will complete the Admin oversight, Teacher UI, Student UI, and Security logic in a single continuous workflow before moving to the next module. 
