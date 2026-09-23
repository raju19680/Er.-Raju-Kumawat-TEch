# Security & Compliance Guide (Er. Raju Kumawat APP)

This document outlines the security architecture, data isolation strategies, and compliance measures implemented across the platform.

## 1. Multi-Tenant Data Isolation
The platform serves multiple educational institutes. Strict logical isolation is enforced at the application and database tiers.
- **Organization ID (orgId)**: Every tenant-specific table (e.g., `Course`, `Student`, `Teacher`, `Payment`) includes an `organizationId` foreign key.
- **Query Scoping**: Prisma queries MUST include `{ where: { organizationId: currentOrgId } }`. Cross-tenant data leakage is prevented via rigorous backend validations in all API routes.
- **Tenant Context**: The tenant is resolved either via the custom domain/subdomain, or via the organizational code provided during login.

## 2. Authentication & Authorization
- **Token Management**: The application uses secure HTTP-only cookies and/or custom headers (`x-auth-token`) for stateful JWT or session-based authentication.
- **Role-Based Access Control (RBAC)**:
  - **Super Admin**: System-wide configuration.
  - **Organization Admin**: Institute-level configuration, reporting, and staff management.
  - **Teacher**: Restricted to assigned courses, grading, and student analytics within the institute.
  - **Student**: Strict access to purchased/enrolled courses and personal library data.
- **Helpers**: Server-side routes utilize standard helpers like `getAuthStudent(req)` and `getAuthTeacher(req)` to authenticate and reject unauthorized access immediately with `401 Unauthorized`.

## 3. Data Protection
- **Passwords**: Passwords must be hashed using `bcryptjs` or equivalent before database insertion. Plain-text passwords are never logged or stored.
- **Personally Identifiable Information (PII)**: Student details (email, phone, name) are isolated per organization. Data deletion requests (GDPR/compliance) map to cascading deletes in Prisma (`onDelete: Cascade`).
- **Content Protection (Video/PDF)**:
  - Secure Video Player prevents right-clicking and direct downloads.
  - URLs for premium content (e.g., AWS S3 or Supabase Storage) should ideally use signed URLs with short expirations to prevent link sharing.

## 4. API Security
- **Input Validation**: All incoming API requests must be validated. Missing fields should return `400 Bad Request`.
- **CORS**: Cross-Origin Resource Sharing is configured to only allow requests from the designated frontend clients (`student-app`, `admin-portal`, mobile wrapper origins).
- **Rate Limiting**: (Planned) Implement rate limiters on authentication endpoints to prevent brute-force attacks.

## 5. Vulnerability Prevention
- **SQL Injection**: Prevented inherently by using Prisma ORM with parameterized queries.
- **Cross-Site Scripting (XSS)**: React/Next.js automatically escapes user inputs in JSX. Any `dangerouslySetInnerHTML` usage (e.g., for rich text course content) must be sanitized using a library like `DOMPurify` before rendering.
- **Cross-Site Request Forgery (CSRF)**: Mitigated by SameSite cookie policies and custom header verification.

## 6. Audit & Logging
- **Access Logs**: The `ModuleAccessLog` and `EmailLog` models track critical system interactions.
- **Suspicious Activity**: Login failures and abnormal data access patterns should trigger alerts to the organization admin.
