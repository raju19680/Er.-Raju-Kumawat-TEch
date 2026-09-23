-- ═══════════════════════════════════════════════════════════
-- 🌱 SEED DATA for Supabase PostgreSQL
-- ═══════════════════════════════════════════════════════════
-- Run this AFTER supabase-migration.sql in the Supabase SQL Editor

-- Super Admin Organization (Institute ID: 9680177120)
INSERT INTO "Organization" ("id", "name", "code", "accentColor", "status", "adminCommission", "gatewayCharge", "createdAt", "updatedAt")
VALUES ('cl_admin_org_001', 'Er. Raju Kumawat Tech - Platform', '9680177120', '#111111', 'active', 20, 2.36, NOW(), NOW());

-- Demo Teacher Organization (Institute ID: ERKT0001)
INSERT INTO "Organization" ("id", "name", "code", "accentColor", "status", "adminCommission", "gatewayCharge", "createdAt", "updatedAt")
VALUES ('cl_teacher_org_001', 'Demo Institute', 'ERKT0001', '#6366f1', 'trial', 20, 2.36, NOW(), NOW());

-- Super Admin User
-- Email: rajulalkumawat1995@gmail.com | Password: Kumawat@4321
INSERT INTO "User" ("id", "email", "name", "password", "role", "organizationId", "failedLoginAttempts", "passwordChangedAt", "createdAt", "updatedAt")
VALUES ('cl_admin_user_001', 'rajulalkumawat1995@gmail.com', 'Er. Raju Kumawat', '$2b$12$jhkrqvn3Mwci5A76SRF7pOCRe7Pt62sfymDc2yD8MqTDbk1qYEaRS', 'platform_admin', 'cl_admin_org_001', 0, NOW(), NOW(), NOW());

-- Demo Teacher User
-- Email: teacher@erraju.com | Password: teacher123
INSERT INTO "User" ("id", "email", "name", "password", "role", "organizationId", "failedLoginAttempts", "passwordChangedAt", "createdAt", "updatedAt")
VALUES ('cl_teacher_user_001', 'teacher@erraju.com', 'Demo Teacher', '$2b$12$C7TTOk5UF.fiMBHwNgItlOOxPpMIZn6EPTX379dO0amhsPgNYLOEm', 'teacher', 'cl_teacher_org_001', 0, NOW(), NOW(), NOW());

-- ═══════════════════════════════════════════════════════════
