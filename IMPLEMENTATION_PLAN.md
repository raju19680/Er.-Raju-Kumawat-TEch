# Er. Raju Kumawat Tech - Complete Implementation Plan

## 🎯 User Requirements
1. **Every module working** - Fix all broken/dead modules
2. **Cybersecurity** - Apply security checks, ethical hacking tests
3. **White-label** - Each teacher gets separate website (white-labeled)
4. **Mobile App** - Works on ALL devices (Android, iOS, Windows, Mac)
5. **One codebase** - Write once, deploy per teacher

---

## 📋 Phase 1: Security Hardening (Critical)

### 1.1 Fix Authentication Security
- [x] Set real NEXTAUTH_SECRET in .env
- [x] Remove hardcoded secret fallbacks
- [x] Set secure cookie flags for production
- [x] Add security headers in middleware
- [x] Rate limit all sensitive endpoints
- [x] Hash 2FA backup codes
- [x] Encrypt Razorpay keys at rest

### 1.2 Input Validation
- [x] Validate org codes (alphanumeric only)
- [x] Add input length caps
- [x] CSRF protection

---

## 📋 Phase 2: Fix All Modules

### 2.1 CMS Dead Modules (FIX)
- [x] Wire `courses-list.tsx` into CMS sidebar
- [x] Wire `test-series-list.tsx` into CMS sidebar
- [x] Wire `students-list.tsx` into CMS sidebar
- [x] Remove dead duplicate code in `cms/custom/` and `cms/marketing/`

### 2.2 Student Portal
- [x] Wire `PublicPortal` into student layout (branded landing page)
- [x] Make portal-data use org from request (not hardcoded)

---

## 📋 Phase 3: White-Label Architecture (Strategy B - Multi-Tenant)

### Architecture
```
Teacher 1: academy.errkt.com → Organization: ERKTACADEMY
Teacher 2: dps.errkt.com     → Organization: DPS2024
Teacher 3: vision.errkt.com  → Organization: VISN2024
Any custom domain: myacademy.com → Organization: CUSTOM
```

### 3.1 Middleware Enhancement
- [x] Check Host header against CustomDomain table
- [x] Inject x-org-id/x-org-code headers
- [x] Cache domain lookups (in-memory LRU)

### 3.2 Public Portal API
- [x] `/api/public/portal-data` - returns org branding + content
- [x] `/api/public/manifest` - dynamic PWA manifest per org
- [x] `/api/public/sw` - dynamic service worker per org

### 3.3 Branding System
- [x] `BrandingProvider` React context
- [x] Apply logo, colors, fonts, customCSS dynamically
- [x] Per-teacher hero sections, footers, social links

### 3.4 Admin White-Label
- [x] Configure branding from admin panel
- [x] Add/verify custom domains
- [x] Real DNS CNAME verification
- [x] SSL auto-provisioning (via Caddy)

---

## 📋 Phase 4: Mobile App (PWA + TWA)

### Technology Choice: PWA → TWA (Trusted Web Activity)

**Why PWA + TWA?**
- ✅ One codebase (same Next.js app)
- ✅ Works on Android (TWA), iOS (PWA), Desktop (PWA)
- ✅ No separate React Native/Flutter team needed
- ✅ Instant updates (no app store review for PWA)
- ✅ Offline support via Service Worker
- ✅ Push notifications
- ✅ Can be "installed" on all devices

### 4.1 PWA Enhancement
- [x] Register service worker in layout
- [x] Dynamic manifest per teacher
- [x] Offline caching strategy
- [x] Push notification support

### 4.2 Android App (TWA)
- [x] Generate TWA wrapper per teacher
- [x] Custom app icon per teacher
- [x] App package name per teacher
- [x] Play Store ready

### 4.3 iOS App (PWA)
- [x] Apple Touch Icon per teacher
- [x] Splash screen per teacher
- [x] Standalone display mode
- [x] Push notifications (iOS 16.4+)

---

## 📋 Phase 5: Cybersecurity Testing

### 5.1 Automated Security Tests
- [x] SQL Injection tests
- [x] XSS tests
- [x] CSRF tests
- [x] Authentication bypass tests
- [x] Authorization tests (role-based)
- [x] Rate limiting tests
- [x] Input validation tests

### 5.2 Security Headers
- [x] Content-Security-Policy
- [x] X-Frame-Options: DENY
- [x] X-Content-Type-Options: nosniff
- [x] Referrer-Policy
- [x] Permissions-Policy

---

## 🚀 Implementation Order
1. Security fixes (Phase 1)
2. Module fixes (Phase 2)
3. White-label (Phase 3) - MAIN FEATURE
4. Mobile app (Phase 4) - MAIN FEATURE
5. Security testing (Phase 5)
