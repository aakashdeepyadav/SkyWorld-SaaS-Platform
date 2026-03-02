# SkyWorld — Role-Based Access Control (RBAC)

> **Last updated**: aligned with the new business model (fixed-price plans via checkout, custom requests with admin quoting, service requests as admin-only internal tool).

---

## Table of Contents

1. [Roles](#1-roles)
2. [Business Model Overview](#2-business-model-overview)
3. [RBAC Middleware](#3-rbac-middleware)
4. [Role Access Matrix](#4-role-access-matrix)
5. [Server-Side Route Guards](#5-server-side-route-guards)
6. [Frontend Route Guards](#6-frontend-route-guards)
7. [Sidebar Navigation Per Role](#7-sidebar-navigation-per-role)
8. [Business Flows Per Role](#8-business-flows-per-role)
9. [Status Transitions & Ownership](#9-status-transitions--ownership)
10. [Payment Model](#10-payment-model)
11. [Security Notes](#11-security-notes)

---

## 1. Roles

Defined in `server/utils/constants.js`:

| Role | Description |
|---|---|
| **admin** | Platform operator — full control over users, services, requests, projects, payments, analytics |
| **developer** | Delivery team member — works on assigned requests/projects, updates progress |
| **client** | Buyer/customer — browses services, purchases plans, submits custom requests, tracks projects |

---

## 2. Business Model Overview

### Fixed-Price Plans (Checkout Flow)
- Client browses **ServiceDetail** → picks a plan → proceeds to **Checkout**
- Prices are **server-validated** against `PLAN_PRICES` in constants
- Payment uses **50/50 split**: advance (50%) → project starts → final (50%)
- A project is auto-created after successful advance payment verification

### Custom Requests
- Client submits a **CustomRequestForm** describing their needs
- Admin reviews and **quotes** a price
- Client **approves** the quote → pays full amount → project auto-created

### Service Requests (Admin-Only Internal Tool)
- `POST /api/v1/requests` is restricted to **admin only**
- Used internally by admin to create direct service requests
- Clients **cannot** create service requests — they use plans or custom requests

---

## 3. RBAC Middleware

Defined in `server/middleware/rbac.js`:

| Helper | Signature | Resolves To |
|---|---|---|
| `authorize` | `authorize(...roles)` | Returns 403 if `req.user.role` ∉ `roles`. Logs unauthorized attempts to audit log. |
| `adminOnly` | — | `authorize('admin')` |
| `adminOrDeveloper` | — | `authorize('admin', 'developer')` |
| `adminOrClient` | — | `authorize('admin', 'client')` |
| `ownerOrAdmin` | `ownerOrAdmin(field)` | Admin passes always. Otherwise checks: `resource[field]` / `resource.clientId` / `resource.uploadedBy` matches `req.user._id`, **or** `req.user._id` ∈ `resource.developerIds` |

Frontend guards (in `App.jsx`):

| Component | Behaviour |
|---|---|
| `ProtectedRoute` | Redirects to `/login` if not authenticated. No role check. |
| `RoleRoute({ allowedRoles })` | Redirects to `/dashboard/{role}` if user's role ∉ `allowedRoles`. Also redirects to `/login` if unauthenticated. |

---

## 4. Role Access Matrix

### Client

**Can:**
- Manage own profile and settings
- Browse services and view service details (public)
- Purchase fixed-price plans via `/checkout` (50/50 split payment)
- Submit custom requests (`POST /api/v1/custom-requests`)
- View own custom requests
- View own requests (read-only — assigned by admin)
- View own projects and track progress
- Access project messages and files for own projects
- View own payments and download invoices

**Cannot:**
- Create service requests (`POST /api/v1/requests` → 403)
- Assign developers to requests
- Update request status
- Update projects directly
- Update/review custom requests (admin-only)
- Access admin user/service/stats/analytics endpoints
- See "Requests" link in sidebar

### Developer

**Can:**
- Manage own profile and settings
- View assigned requests
- Update assigned request status (limited transitions):
  - `approved` → `in-progress`
  - `in-progress` → `completed`
- View assigned projects
- Update assigned project `status`, `progress`, `milestones`
- Access project messages and files for assigned projects

**Cannot:**
- Create service requests
- Create or view custom requests
- Access payments list/details
- Access checkout
- Access admin user/service/stats/analytics endpoints
- See "Payments" or "Custom Requests" in sidebar

### Admin

**Can:**
- **Full access** to all platform features
- Manage all users — list, view, change role, change status
- Manage services — create, update, delete
- Create service requests manually (`POST /api/v1/requests`)
- Assign developers to requests
- Update any request status (all transitions)
- Create, view, update projects
- Quote and update custom requests
- View all payments, update payment status
- Access analytics/stats dashboards
- Access all messages, files, notifications

---

## 5. Server-Side Route Guards

### 5.1 Auth — `/api/v1/auth`

| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | `/register` | **Public** (rate-limited) | |
| POST | `/login` | **Public** (rate-limited) | |
| POST | `/google` | **Public** (rate-limited) | Google OAuth |
| POST | `/verify-otp` | **Public** (rate-limited) | |
| POST | `/resend-otp` | **Public** (rate-limited) | |
| POST | `/refresh` | **Public** (rate-limited) | Token refresh |
| POST | `/forgot-password` | **Public** (rate-limited) | |
| POST | `/reset-password` | **Public** (rate-limited) | |
| POST | `/2fa/verify` | **Public** (rate-limited) | Completes 2FA login |
| POST | `/logout` | `authenticate` | Any authenticated user |
| GET | `/me` | `authenticate` | Any authenticated user |
| POST | `/change-password` | `authenticate` + `sensitiveRateLimiter` | Any authenticated user |
| DELETE | `/account` | `authenticate` + `sensitiveRateLimiter` | Any authenticated user |
| POST | `/2fa/setup` | `authenticate` + `sensitiveRateLimiter` | Any authenticated user |
| POST | `/2fa/verify-setup` | `authenticate` + `sensitiveRateLimiter` | Any authenticated user |
| POST | `/2fa/disable` | `authenticate` + `sensitiveRateLimiter` | Any authenticated user |

### 5.2 Users — `/api/v1/users`

All routes use `authenticate` + `apiRateLimiter`.

| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | `/profile/me` | `authenticate` | Any authenticated user |
| PUT | `/profile/me` | `authenticate` | Any authenticated user |
| GET | `/` | `adminOnly` | List all users |
| GET | `/:id` | `adminOnly` | View any user |
| PUT | `/:id/role` | `adminOnly` | Change user role |
| PUT | `/:id/status` | `adminOnly` | Change user status |

### 5.3 Services — `/api/v1/services`

| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | `/` | **Public** | List services |
| GET | `/:id` | **Public** | View service detail |
| POST | `/` | `authenticate` + `adminOnly` | Create service |
| PUT | `/:id` | `authenticate` + `adminOnly` | Update service |
| DELETE | `/:id` | `authenticate` + `adminOnly` | Delete service |

### 5.4 Requests — `/api/v1/requests`

All routes use `authenticate` + `apiRateLimiter`.

| Method | Path | Guard | Allowed Roles |
|---|---|---|---|
| POST | `/` | `adminOnly` | **admin** |
| GET | `/` | `authenticate` | **admin, developer, client** (controller filters by role/ownership) |
| GET | `/:id` | `authenticate` | **admin, developer, client** (controller filters by role/ownership) |
| PUT | `/:id/assign` | `adminOnly` | **admin** |
| PUT | `/:id/status` | `adminOrDeveloper` | **admin, developer** |

> **Note:** Clients can read their own assigned requests but cannot create, assign, or update status.

### 5.5 Custom Requests — `/api/v1/custom-requests`

All routes use `authenticate` + `apiRateLimiter`.

| Method | Path | Guard | Allowed Roles |
|---|---|---|---|
| POST | `/` | `adminOrClient` | **client, admin** |
| GET | `/` | `adminOrClient` | **client** (own only), **admin** (all) |
| GET | `/:id` | `adminOrClient` | **client, admin** |
| PUT | `/:id` | `adminOnly` | **admin** (quote/status updates) |

### 5.6 Projects — `/api/v1/projects`

All routes use `authenticate` + `apiRateLimiter`.

| Method | Path | Guard | Allowed Roles |
|---|---|---|---|
| GET | `/` | `authenticate` | **admin, developer, client** (controller filters by role) |
| GET | `/:id` | `authenticate` | **admin, developer, client** (controller checks ownership/assignment) |
| POST | `/` | `adminOnly` | **admin** |
| PUT | `/:id` | `adminOrDeveloper` | **admin, developer** |

### 5.7 Payments — `/api/v1/payments`

| Method | Path | Guard | Allowed Roles |
|---|---|---|---|
| POST | `/razorpay/webhook` | **Public** (no auth) | Razorpay callback |
| GET | `/` | `authenticate` + `adminOrClient` | **client, admin** |
| GET | `/:id` | `authenticate` + `adminOrClient` | **client, admin** |
| GET | `/:id/invoice` | `authenticate` + `adminOrClient` | **client, admin** |
| POST | `/` | `authenticate` + `adminOrClient` | **client, admin** |
| POST | `/razorpay/order` | `authenticate` + `adminOrClient` | **client, admin** |
| POST | `/razorpay/final-order` | `authenticate` + `adminOrClient` | **client, admin** |
| POST | `/razorpay/verify` | `authenticate` + `adminOrClient` | **client, admin** |
| PUT | `/:id/status` | `authenticate` + `adminOnly` | **admin** |

### 5.8 Messages — `/api/v1/messages`

All routes use `authenticate` + `apiRateLimiter`.

| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | `/` | `authenticate` | All authenticated (controller scopes to project membership) |
| POST | `/` | `authenticate` | All authenticated |
| PUT | `/:id/read` | `authenticate` | All authenticated |

### 5.9 Files — `/api/v1/files`

All routes use `authenticate` + `apiRateLimiter`.

| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | `/upload` | `authenticate` | All authenticated (ownership checks in controller) |
| POST | `/avatar` | `authenticate` | All authenticated |
| GET | `/` | `authenticate` | All authenticated |
| DELETE | `/:id` | `authenticate` | All authenticated (ownership checks in controller) |

### 5.10 Stats — `/api/v1/stats`

| Method | Path | Guard | Allowed Roles |
|---|---|---|---|
| GET | `/stats` | `authenticate` + `adminOnly` + `apiRateLimiter` | **admin** |

### 5.11 Admin — `/api/v1/admin`

| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | `/analytics` | `authenticate` | ⚠️ Intended admin-only but **lacks `adminOnly` middleware** — potential security gap |

### 5.12 Notifications — `/api/v1/notifications`

All routes use `authenticate` + `apiRateLimiter`.

| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | `/` | `authenticate` | All authenticated |
| GET | `/unread-count` | `authenticate` | All authenticated |
| PUT | `/read-all` | `authenticate` | All authenticated |
| PUT | `/:id/read` | `authenticate` | All authenticated |
| DELETE | `/:id` | `authenticate` | All authenticated |

---

## 6. Frontend Route Guards

| Frontend Path | Guard | Allowed Roles |
|---|---|---|
| `/` | **Public** | Everyone |
| `/website` | **Public** | Everyone |
| `/login` | **Public** (redirects to `/dashboard` if logged in) | Everyone |
| `/register` | **Public** (redirects to `/dashboard` if logged in) | Everyone |
| `/auth/google/callback` | **Public** | Everyone |
| `/forgot-password` | **Public** (redirects if logged in) | Everyone |
| `/reset-password` | **Public** (redirects if logged in) | Everyone |
| `/privacy` | **Public** | Everyone |
| `/terms` | **Public** | Everyone |
| `/faq` | **Public** | Everyone |
| `/contact` | **Public** | Everyone |
| `/services/:slug` | **Public** | Everyone |
| `/dashboard` | `ProtectedRoute` | Auto-redirects to `/dashboard/{role}` |
| `/dashboard/admin` | `ProtectedRoute` + `RoleRoute` | **admin** |
| `/dashboard/developer` | `ProtectedRoute` + `RoleRoute` | **developer** |
| `/dashboard/client` | `ProtectedRoute` + `RoleRoute` | **client** |
| `/requests` | `ProtectedRoute` | **admin, developer, client** |
| `/requests/new` | `ProtectedRoute` + `RoleRoute` | **admin** |
| `/requests/:id` | `ProtectedRoute` | **admin, developer, client** |
| `/custom-requests` | `ProtectedRoute` + `RoleRoute` | **client, admin** |
| `/custom-request` | `ProtectedRoute` + `RoleRoute` | **client, admin** |
| `/custom-request/thanks` | `ProtectedRoute` + `RoleRoute` | **client, admin** |
| `/projects` | `ProtectedRoute` | **admin, developer, client** |
| `/projects/:id` | `ProtectedRoute` | **admin, developer, client** |
| `/payments` | `ProtectedRoute` + `RoleRoute` | **client, admin** |
| `/checkout` | `ProtectedRoute` + `RoleRoute` | **client, admin** |
| `/admin/users` | `ProtectedRoute` + `RoleRoute` | **admin** |
| `/admin/services` | `ProtectedRoute` + `RoleRoute` | **admin** |
| `/profile` | `ProtectedRoute` | **admin, developer, client** |
| `/settings` | `ProtectedRoute` | **admin, developer, client** |
| `*` | **Public** | 404 page |

---

## 7. Sidebar Navigation Per Role

### Main Navigation

| Sidebar Item | Link | admin | developer | client |
|---|---|:---:|:---:|:---:|
| Dashboard | `/dashboard/{role}` | ✅ | ✅ | ✅ |
| Custom Requests | `/custom-requests` | ✅ | ❌ | ✅ |
| Requests | `/requests` | ✅ | ✅ | ❌ |
| Projects | `/projects` | ✅ | ✅ | ✅ |
| Payments | `/payments` | ✅ | ❌ | ✅ |

### Admin Section (admin only)

| Sidebar Item | Link |
|---|---|
| Users | `/admin/users` |
| Services | `/admin/services` |

### Account Section (all roles)

| Sidebar Item | Link |
|---|---|
| Profile | `/profile` |
| Settings | `/settings` |

---

## 8. Business Flows Per Role

### Client Flow

```
Browse Services (public)
    │
    ├── Fixed-Price Plan ──► ServiceDetail ──► Pick Plan ──► Checkout
    │                                                           │
    │                                         Razorpay 50% advance payment
    │                                                           │
    │                                                     Project auto-created
    │                                                           │
    │                                         Track project ◄───┘
    │                                                           │
    │                                         Razorpay 50% final payment
    │
    └── Custom Request ──► Submit CustomRequestForm
                                     │
                             Admin reviews & quotes
                                     │
                             Client approves quote
                                     │
                             Full payment via Razorpay
                                     │
                             Project auto-created
                                     │
                             Track project
```

### Developer Flow

```
View Assigned Requests (Developer Dashboard)
    │
    ├── Update request status:  approved → in-progress → completed
    │
    └── View Assigned Projects
            │
            ├── Update project status / progress / milestones
            │
            └── Communicate via project messages & files
```

### Admin Flow

```
Full platform control
    │
    ├── User Management ──► List / view / change role / change status
    │
    ├── Service Management ──► Create / update / delete services
    │
    ├── Requests
    │       ├── Create service requests manually
    │       ├── Assign developers to requests
    │       └── Update any request status (all transitions)
    │
    ├── Custom Requests
    │       ├── View all custom requests
    │       └── Quote / update / approve / cancel
    │
    ├── Projects
    │       ├── Create projects
    │       └── Update any project
    │
    ├── Payments
    │       ├── View all payments
    │       └── Update payment status
    │
    └── Analytics & Stats dashboards
```

---

## 9. Status Transitions & Ownership

### Request Status (`REQUEST_STATUS`)

| Transition | Allowed By |
|---|---|
| `pending` → `approved` | **admin** |
| `approved` → `in-progress` | **admin**, **developer** (if assigned) |
| `in-progress` → `completed` | **admin**, **developer** (if assigned) |
| Any → `cancelled` | **admin** |

### Custom Request Status (`CUSTOM_REQUEST_STATUS`)

| Transition | Allowed By |
|---|---|
| `pending` → `quoted` | **admin** (sets price) |
| `quoted` → `approved` | **client** (accepts quote) |
| Any → `cancelled` | **admin** |

### Project Status (`PROJECT_STATUS`)

| Status | Description |
|---|---|
| `planning` | Initial state after creation |
| `in-progress` | Active development |
| `review` | Under client/admin review |
| `completed` | Delivered and accepted |
| `cancelled` | Project cancelled |

Admin can set any status. Developers can update assigned projects (`in-progress`, `review`, `completed`).

### Ownership & Scoping Rules

Controllers apply **additional filtering** beyond route-level middleware:

- **Requests**: Clients see only requests where `clientId === req.user._id`. Developers see requests where `developerIds` includes `req.user._id`.
- **Custom Requests**: Clients see only their own. Admin sees all.
- **Projects**: Clients see where `clientId` matches. Developers see where `developerIds` includes them. Admin sees all.
- **Payments**: Clients see only their own. Admin sees all.
- **Messages/Files**: Scoped to project membership (client, assigned developer, or admin).

---

## 10. Payment Model

### Fixed-Price Plans — 50/50 Split

| Phase | Amount | Trigger |
|---|---|---|
| `advance` | 50% of plan price | At checkout — project created on success |
| `final` | 50% of plan price | After project delivery — completes payment cycle |

### Custom Requests — Full Payment

| Phase | Amount | Trigger |
|---|---|---|
| `full` | 100% of quoted price | After client approves admin's quote |

### Plan Prices (INR, server-validated)

| Category | Plan | Price (₹) |
|---|---|---|
| Web Development | Launch | 3,999 |
| Web Development | Starter | 7,499 |
| Web Development | Growth | 11,999 |
| App Development | Mini | 18,999 |
| App Development | Lite | 34,999 |
| Branding & Creative | Starter | 2,499 |
| Branding & Creative | Plus | 4,999 |

### Combo Prices (via custom requests)

| Combo | Price (₹) |
|---|---|
| Restaurant Starter | 10,099 |
| Medical Growth | 17,508 |
| Premium Business | 33,205 |

### Payment Statuses

`pending` → `processing` → `completed` / `failed` / `refunded`

Only **admin** can manually update payment status via `PUT /api/v1/payments/:id/status`.

---

## 11. Security Notes

### Authentication
- JWT access + refresh tokens (HTTP-only cookies)
- Google OAuth integration
- OTP email verification on registration
- Optional 2FA (TOTP)

### Rate Limiting (from `constants.js`)

| Limiter | Window | Max Requests |
|---|---|---|
| Global | 15 min | 200/IP |
| Register | 1 hr | 5/IP, 3/email |
| Login/Auth | 15 min | 5/IP |
| Forgot Password | 1 hr | 5/IP, 3/email |
| Reset Password | 1 hr | 10/IP |
| OTP Send | 15 min | 5/IP, 5/email |
| OTP Verify | 15 min | 10/IP, 10/email |
| Sensitive (password change) | 15 min | 3/IP |
| API (general) | 15 min | 100/IP |

### Account Lockout
- **5 failed login attempts** → account locked for **30 minutes**

### Password Policy
- Minimum 8 characters
- Requires: uppercase, lowercase, number, special character

### File Upload Security
- SVG blocked (XSS vector via `<script>` tags)
- MIME type validation + size limits (image: 5 MB, doc: 10 MB, video: 100 MB, audio: 10 MB)

### Audit Logging
- Unauthorized access attempts are logged via `createAuditLog` in the `authorize` middleware
- Stored in `AuditLog` model

### CSRF Protection
- CSRF middleware applied to state-changing requests

### ⚠️ Known Gap
- `GET /api/v1/admin/analytics` uses only `authenticate` but **lacks `adminOnly` middleware** — any authenticated user could potentially access admin analytics. Consider adding `adminOnly` to the route.

---

## Guarding Rules (Summary)

1. **Enforce at both layers**: route middleware (`authorize`, `adminOnly`, etc.) **and** controller ownership checks
2. **Frontend mirrors backend**: sidebar items and route guards match server-side RBAC so users never see actions they cannot execute
3. **Fail closed**: if middleware fails or user data is missing, return 401/403
4. **Audit unauthorized attempts**: logged to `AuditLog` for security monitoring
5. **Server-validated prices**: plan prices checked against `PLAN_PRICES` constant — frontend values are display-only
