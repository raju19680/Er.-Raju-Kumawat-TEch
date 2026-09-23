# 🗄️ Database Schema & Entity Relational Guide

## 1. Schema Overview
The database is structured in PostgreSQL via Prisma ORM with strict multi-tenant referential integrity and optimized indexing for fast search and lookup.

---

## 2. Core Entities

### Organization & Multi-Tenancy
- **`Organization`**:
  - `id`: CUID Primary Key
  - `name`: Organization name (e.g. `Er. Raju Kumawat Academy`)
  - `code`: Unique alphanumeric code (e.g. `9680177120`, `ERKTACADEMY`)
  - `accentColor`: Hex color for white-label branding
  - `adminCommission`: Platform percentage take (0 to 100)
  - `gatewayCharge`: Payment processing fee percentage
  - `status`: `active` | `trial` | `suspended`

### Users & Permissions
- **`User`**:
  - `id`: CUID
  - `name`, `email` (unique), `phone`, `password` (bcrypt hash)
  - `role`: `platform_admin` | `teacher` | `student` | `staff`
  - `organizationId`: Foreign key to `Organization`
  - `is2FAEnabled`, `twoFactorSecret`

---

## 3. Academic & Content Models

### Courses & Learning Modules
- **`Course`**: Title, slug, description, price, mrp, category, validityDays, status (`draft` | `published` | `archived`), organizationId.
- **`CourseModule`**: Chapter / module grouping within a course, sortOrder.
- **`CourseLesson`**: Video URL, duration, attachment PDF, sortOrder, isFreeDemo.
- **`VideoTranslation`**: Multilingual audio/video track mapping for English, Hindi, Tamil, Telugu, etc.
- **`LessonProgress`**: Tracks student completion percentage and watch duration per lesson.

### Assessments & CBT Test Series
- **`TestSeries`**: Exam bundle (JEE, NEET, CUET, GATE), combo package toggle, pricing, organizationId.
- **`Test`**: Individual exam instance, durationMinutes, totalMarks, passMarks, negativeMarking, instructions.
- **`Section`**: Subject sections (e.g. Physics, Chemistry, Mathematics) with sectional time limits.
- **`Question`**: Content, questionType (`mcq_single` | `mcq_multiple` | `numerical` | `assertion_reason`), options (JSON), correctOption, explanation, marks, negativeMarks.
- **`TestAttempt`**: Student exam submission, score, totalQuestions, correctAnswers, incorrectAnswers, unattempted, timeSpentSeconds, rank, percentile, status (`in_progress` | `completed`).

### Digital Products (Notes, E-Books, Formula Sheets)
- **`DigitalProduct`**: Title, type (`notes` | `ebook` | `formula_sheet`), format (`pdf` | `epub`), fileUrl, pages, sizeMb, price, isFree.
- **`PurchasedDigitalProduct`**: Records student ownership and download access.

---

## 4. Commerce & Monetization

- **`Order`**: Order reference number, amount, discountAmount, taxAmount, finalAmount, status (`pending` | `completed` | `failed`), gateway (`razorpay` | `phonepe` | `stripe`).
- **`Payment`**: Transaction ID, gateway signature, timestamp.
- **`Coupon`**: Promo code, discount percentage or flat amount, validity, usage limit.
- **`PurchasedCourse`**: Student course enrollment with expiry timestamp.
- **`PurchasedTestSeries`**: Student test series purchase entitlement.
