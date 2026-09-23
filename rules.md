# Project Rules & Best Practices

## 1. Coding Standards
- **TypeScript**: Strict mode must be enabled. All interfaces and types should be strongly defined. Avoid `any`.
- **Framework**: Use Next.js App Router conventions (`app/` directory). Prefer Server Components where possible for performance, and Client Components (`"use client"`) only for interactive UI (e.g., Dashboards, Virtual Classrooms).
- **Styling**: Use Tailwind CSS for all styling. Use `cn()` utility for conditional class merging.

## 2. Multi-Tenancy Rules (CRITICAL)
- **Data Isolation**: EVERY database query for a tenant-specific resource MUST include the `organizationId` filter. This applies to new features like Assignments, Forums, and Live Classes.
- **Org Resolution**: Always use the `resolveOrgId()` utility to determine the current tenant context. Never trust client-side data for authorization without verifying against the token.

## 3. Database Performance & Analytics (Phase 1)
- **Heavy Queries**: Analytics queries for the Progress Dashboards must be optimized. Ensure appropriate indexes exist on foreign keys (`studentId`, `courseId`) and timestamps.
- **N+1 Problem**: Use Prisma's `include` carefully. Avoid fetching deep nested relations if a simple aggregation (`_count`, `_avg`) suffices.

## 4. File Upload & Storage Rules (Phase 2 & 3)
- **Direct Uploads**: For Course Materials and Assignments, prefer generating Pre-signed URLs on the server and uploading directly from the client to S3/Supabase Storage to save backend bandwidth.
- **Validation**: Always validate file types (MIME) and enforce size limits on both client and server before accepting assignment submissions.

## 5. Third-Party Integrations (Phase 4)
- **Adapter Pattern**: When integrating Live Virtual Classroom providers (Zoom, Daily.co, etc.), wrap the SDK in a generic adapter interface. Do not tightly couple the UI components to a specific provider's SDK, allowing us to swap providers if needed.
- **Secrets**: Never expose provider API keys to the client. Always generate temporary access tokens securely on the server.

## 6. Mobile Integration (Capacitor)
- **Responsive Design**: All Student and Teacher portal UI must be mobile-first and responsive to support WebView rendering via Capacitor.
- **File System**: When implementing offline Study Material Organization, use Capacitor Filesystem plugins for safe cross-platform local storage.
