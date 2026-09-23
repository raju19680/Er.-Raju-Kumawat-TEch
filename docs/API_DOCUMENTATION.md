# 📡 Complete REST API Specification & Architecture

This document provides a comprehensive reference for all REST API endpoints available in the platform, covering Authentication, Super Admin, Teacher/CMS, Student Portal, Assessments Engine, Digital Store, and Razorpay Payments.

---

## 1. 🔐 Authentication & Session Management

### `POST /api/auth/direct-login`
Direct credential verification bypassing reverse proxy redirects.
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "email": "student@example.com",
    "password": "password123",
    "orgId": "9680177120",
    "loginMode": "student"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "user": {
      "id": "usr_123",
      "email": "student@example.com",
      "name": "Rahul Kumar",
      "role": "student"
    },
    "organization": {
      "id": "org_123",
      "name": "Er. Raju Kumawat Academy",
      "code": "9680177120"
    }
  }
  ```

---

## 2. 🎓 Student Portal Endpoints

### `GET /api/student/stats`
Fetches personalized learning statistics, spend summary, enrolled courses count, and recent test attempts.
- **Authentication**: Student Session Cookie / Bearer Token
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "stats": {
      "totalEnrollments": 2,
      "totalTestSeries": 1,
      "totalTestsTaken": 8,
      "completedTests": 8,
      "totalNotesPurchased": 3,
      "totalSpent": 1499,
      "avgScore": 84
    },
    "recentEnrollments": [...],
    "recentAttempts": [...]
  }
  ```

### `GET /api/student/orders`
Retrieves purchase history, invoice details, item breakdown, and transaction status.
- **Authentication**: Student Session Cookie
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "orders": [
      {
        "id": "ord_101",
        "orderNumber": "ORD-2026-101",
        "amount": 499,
        "status": "COMPLETED",
        "paymentMethod": "RAZORPAY",
        "createdAt": "2026-08-04T12:00:00.000Z",
        "items": [
          { "id": "p1", "title": "Complete Physics Formula Handbook", "price": 499, "type": "product" }
        ],
        "organization": {
          "name": "Er. Raju Kumawat Academy",
          "code": "9680177120",
          "logo": "/logo.png"
        }
      }
    ]
  }
  ```

### `GET /api/student/announcements`
Fetches institute-wide broadcast announcements, urgent alerts, exam dates, and holiday notices.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "announcements": [
      {
        "id": "ann_1",
        "title": "All India Mock Test 04 Scheduled",
        "message": "The All India Mock Test 04 will be live this Sunday from 9:00 AM to 12:00 PM.",
        "type": "alert",
        "createdAt": "2026-08-04T08:30:00.000Z"
      }
    ]
  }
  ```

### `GET /api/student/doubts` & `POST /api/student/doubts`
Student doubt resolution desk for academic and technical queries.
- **POST Request Body**:
  ```json
  {
    "subject": "Thermodynamics Carnot Cycle query",
    "message": "Please explain step 3 of the PV indicator diagram.",
    "category": "academic",
    "priority": "high"
  }
  ```

### `GET /api/student/digital-products`
Fetches downloadable study notes, formula books, and test series revision PDFs.

### `GET /api/student/courses` & `GET /api/student/test-series`
Fetches enrolled vs catalog courses and CBT test series.

---

## 3. 💳 Razorpay Payment Integration

### `POST /api/payments/create-order`
Initiates a verified Razorpay order with discount coupon validation and organization payment gateway lookup.
- **Request Body**:
  ```json
  {
    "amount": 499,
    "orgCode": "9680177120",
    "itemType": "product",
    "itemId": "prod_123",
    "couponCode": "SUMMER50"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "orderId": "order_Rzp123456",
    "amount": 49900,
    "currency": "INR",
    "keyId": "rzp_test_TIwPoKSC0buIZV"
  }
  ```

### `POST /api/payments/verify`
Validates Razorpay HMAC SHA256 signature, creates an `Order` record, and unlocks student access to the purchased asset.
- **Request Body**:
  ```json
  {
    "razorpay_order_id": "order_Rzp123456",
    "razorpay_payment_id": "pay_Rzp789012",
    "razorpay_signature": "a1b2c3d4...",
    "itemType": "product",
    "itemId": "prod_123",
    "orgCode": "9680177120"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Payment verified successfully",
    "orderId": "ord_101"
  }
  ```

---

## 4. 👨‍🏫 Teacher & CMS Management Endpoints

- `GET /api/teacher/dashboard` - Real-time statistics on active students, test completions, and revenue.
- `GET/POST /api/teacher/courses` - Course syllabus, lecture management, video embedding.
- `GET/POST /api/teacher/test-series` - Test series creation, section configuration, and scheduling.
- `GET/POST /api/teacher/tests` - CBT test builder, question palette import, LaTeX support.
- `GET/POST /api/teacher/announcements` - Publish broadcasts to enrolled students.
- `GET/POST /api/teacher/support` - Resolve student doubts and queries.

---

## 5. 👑 Super Admin Platform Endpoints

- `GET /api/admin/dashboard` - Platform-wide GMV, active institutes count, gross student count.
- `GET/POST /api/admin/organizations` - Multi-tenant institute onboarding and domain white-labeling.
- `GET/POST /api/admin/teachers` - Teacher account management and permissions.
- `GET /api/admin/orders` - Global order transaction ledger and revenue settlement.
