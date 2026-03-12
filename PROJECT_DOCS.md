# SkyWorld — Project Documentation

> Production-grade SaaS platform for App Development, Web Development, and Branding & Creative services.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Server Architecture](#server-architecture)
5. [Client Architecture](#client-architecture)
6. [Database Schema](#database-schema)
7. [API Routes](#api-routes)
8. [Authentication & Security](#authentication--security)
9. [Environment Variables](#environment-variables)
10. [Scripts & Commands](#scripts--commands)
11. [Deployment](#deployment)

---

## Overview

SkyWorld is a **full-stack MERN SaaS platform** that enables clients to request, track, and pay for digital services (app development, web development, branding & design). It features role-based dashboards for clients, developers, and admins, a milestone-based project tracking system, integrated payment processing (Razorpay), file uploads (Cloudinary), and email notifications (Brevo SMTP).

### Key Capabilities

| Feature                | Description                                                       |
| ---------------------- | ----------------------------------------------------------------- |
| **Service Catalog**    | Three service categories with base pricing                        |
| **Service Requests**   | Clients submit structured requests for predefined services        |
| **Custom Requests**    | Clients submit freeform project briefs with file attachments      |
| **Project Management** | Milestone tracking, progress percentage, developer assignment     |
| **Payments**           | Razorpay integration, invoice generation, payment status tracking |
| **Messaging**          | Per-project messaging between clients and developers              |
| **File Management**    | Cloudinary-backed uploads with type validation                    |
| **RBAC**               | Admin, Developer, Client — with granular permissions              |
| **Auth**               | Email/password with OTP verification + Google OAuth               |
| **Audit Logging**      | Action tracking with 90-day TTL auto-cleanup                      |

---

## Tech Stack

### Server (Backend)

| Layer        | Technology                                                      |
| ------------ | --------------------------------------------------------------- |
| Runtime      | Node.js (ES modules)                                            |
| Framework    | Express.js 4.18                                                 |
| Database     | MongoDB via Mongoose 8                                          |
| Auth         | JWT (access + refresh tokens, HTTP-only cookies) + Google OAuth |
| Payments     | Razorpay                                                        |
| File Storage | Cloudinary                                                      |
| Email        | Nodemailer + Brevo SMTP                                         |
| Security     | Helmet, CORS, CSRF, mongo-sanitize, hpp, express-rate-limit     |
| Logging      | Winston + Morgan                                                |
| Validation   | express-validator                                               |
| Uploads      | Multer                                                          |

### Client (Frontend)

| Layer         | Technology                                         |
| ------------- | -------------------------------------------------- |
| Framework     | React 18 (Vite 5)                                  |
| Routing       | React Router DOM 6                                 |
| State         | React Query 3 (server state), React Context (auth) |
| Styling       | Tailwind CSS 3.3 + Inter font                      |
| HTTP          | Axios (with interceptors for token refresh)        |
| UI Components | Headless UI, Heroicons                             |
| Notifications | react-hot-toast                                    |

---

## Project Structure

```
SkyWorld/
├── package.json              # Root monorepo scripts (dev, build, install-all)
├── render.yaml               # Render deployment config (server)
│
├── client/                   # React SPA (Vite)
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js    # Brand colors, fonts, animations
│   ├── postcss.config.js
│   ├── index.html
│   ├── vercel.json           # Vercel deployment config (client)
│   ├── Dockerfile            # Docker config
│   ├── nginx.conf            # Nginx config for Docker
│   ├── public/               # Static assets (logo.png, etc.)
│   └── src/
│       ├── main.jsx          # React entry point (BrowserRouter, QueryClient, AuthProvider)
│       ├── App.jsx           # Route definitions
│       ├── index.css          # Tailwind base + component classes
│       ├── context/
│       │   └── AuthContext.jsx  # Auth state management
│       ├── services/
│       │   └── api.js         # Axios instance, interceptors, token refresh
│       ├── utils/
│       │   └── currency.js    # INR formatting utility
│       ├── components/
│       │   ├── common/
│       │   │   ├── ProtectedRoute.jsx
│       │   │   └── RoleRoute.jsx
│       │   └── layout/
│       │       └── Layout.jsx  # Dashboard shell (sidebar, header)
│       └── pages/
│           ├── Home.jsx            # Public landing page
│           ├── FAQ.jsx             # FAQ page
│           ├── PrivacyPolicy.jsx   # Privacy policy
│           ├── TermsOfService.jsx  # Terms of service
│           ├── NotFound.jsx        # 404 page
│           ├── Profile.jsx         # User profile
│           ├── Settings.jsx        # User settings
│           ├── auth/
│           │   ├── Login.jsx
│           │   ├── Register.jsx
│           │   ├── GoogleCallback.jsx
│           │   ├── ForgotPassword.jsx
│           │   └── ResetPassword.jsx
│           ├── admin/
│           │   ├── Dashboard.jsx       # Admin overview
│           │   ├── UserManagement.jsx   # User CRUD
│           │   └── ServiceManagement.jsx # Service CRUD
│           ├── client/
│           │   └── Dashboard.jsx   # Client overview
│           ├── developer/
│           │   └── Dashboard.jsx   # Developer overview
│           ├── services/
│           │   └── ServiceDetail.jsx  # Public service page
│           ├── requests/
│           │   ├── RequestList.jsx
│           │   ├── NewRequest.jsx
│           │   ├── RequestDetail.jsx
│           │   ├── CustomRequestList.jsx
│           │   ├── CustomRequestForm.jsx
│           │   └── CustomRequestThankYou.jsx
│           ├── projects/
│           │   ├── ProjectList.jsx
│           │   └── ProjectDetail.jsx
│           ├── payments/
│           │   └── PaymentList.jsx
│           └── checkout/
│               └── Checkout.jsx
│
├── server/                   # Express API
│   ├── package.json
│   ├── index.js              # Server entry point
│   ├── config/
│   │   ├── database.js       # MongoDB connection (connectDB)
│   │   ├── cloudinary.js     # Cloudinary SDK config
│   │   └── validateEnv.js    # Environment variable validation
│   ├── models/
│   │   ├── User.js
│   │   ├── Service.js
│   │   ├── ServiceRequest.js
│   │   ├── CustomRequest.js
│   │   ├── Project.js
│   │   ├── Payment.js
│   │   ├── Message.js
│   │   ├── File.js
│   │   └── AuditLog.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── serviceController.js
│   │   ├── requestController.js
│   │   ├── customRequestController.js
│   │   ├── projectController.js
│   │   ├── paymentController.js
│   │   ├── messageController.js
│   │   ├── fileController.js
│   │   └── statsController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── services.js
│   │   ├── requests.js
│   │   ├── customRequests.js
│   │   ├── projects.js
│   │   ├── payments.js
│   │   ├── messages.js
│   │   ├── files.js
│   │   └── stats.js
│   ├── middleware/
│   │   ├── auth.js           # JWT verification (protect, authorize)
│   │   ├── rbac.js           # Role-based access control
│   │   ├── rateLimiter.js    # Per-endpoint rate limiting
│   │   ├── csrfProtection.js # CSRF token validation
│   │   ├── validation.js     # express-validator schemas
│   │   ├── upload.js         # Multer config (file type/size validation)
│   │   └── errorHandler.js   # Centralized error handling
│   ├── services/
│   │   ├── authService.js       # Login, register, token, OTP logic
│   │   ├── emailService.js      # Transactional emails (Brevo/Nodemailer)
│   │   └── cloudinaryService.js # Upload, delete, avatar management
│   └── utils/
│       ├── constants.js      # Enums (roles, statuses, file types, rate limits)
│       └── logger.js         # Winston logger config
│
└── docs/                     # Existing documentation
    ├── API.md
    ├── ARCHITECTURE.md
    ├── DATABASE.md
    ├── DEPLOYMENT.md
    ├── SECURITY.md
    ├── SRS.md
    ├── RBAC_FLOW.md
    ├── UI_UX_DESIGN.md
    └── USER_MANUAL.md
```

---

## Server Architecture

### Request Flow

```
Client Request
     ↓
[Helmet]           → Secure HTTP headers
[mongo-sanitize]   → NoSQL injection protection
[hpp]              → Parameter pollution protection
[globalRateLimiter]→ 200 req / 15 min per IP
[CORS]             → Origin validation
[Body Parser]      → JSON (1MB limit)
[Cookie Parser]    → Parse JWT cookies
[CSRF Protection]  → Origin/referrer validation
[Morgan]           → Request logging
     ↓
[Route Handler]    → /api/{resource}
     ↓
[auth middleware]   → JWT verification (if protected)
[rbac middleware]   → Role check (if restricted)
[validation]        → Input validation (express-validator)
     ↓
[Controller]       → Business logic
[Service Layer]    → Email, Cloudinary, Auth logic
     ↓
[Model/DB]         → Mongoose operations
     ↓
[Error Handler]    → Centralized error response
```

### Middleware Stack

| Middleware         | File                           | Purpose                                 |
| ------------------ | ------------------------------ | --------------------------------------- |
| **Helmet**         | (npm package)                  | Secure HTTP headers, CSP                |
| **mongo-sanitize** | (npm package)                  | Strips `$` and `.` from input           |
| **hpp**            | (npm package)                  | Prevents HTTP parameter pollution       |
| **Rate Limiter**   | `middleware/rateLimiter.js`    | Per-endpoint rate limits (configurable) |
| **CORS**           | `index.js`                     | Allowlist-based origin validation       |
| **CSRF**           | `middleware/csrfProtection.js` | Origin/referrer-based CSRF protection   |
| **Auth**           | `middleware/auth.js`           | JWT access token verification           |
| **RBAC**           | `middleware/rbac.js`           | Role-based route access control         |
| **Validation**     | `middleware/validation.js`     | express-validator input schemas         |
| **Upload**         | `middleware/upload.js`         | Multer with MIME type & size validation |
| **Error Handler**  | `middleware/errorHandler.js`   | Catches all errors, returns JSON        |

### Service Layer

| Service               | File                            | Responsibilities                                                  |
| --------------------- | ------------------------------- | ----------------------------------------------------------------- |
| **AuthService**       | `services/authService.js`       | Registration, login, token generation, OTP, Google OAuth          |
| **EmailService**      | `services/emailService.js`      | Welcome emails, OTP emails, password reset, project notifications |
| **CloudinaryService** | `services/cloudinaryService.js` | Image/file upload, deletion, avatar management                    |

---

## Client Architecture

### Routing

The client uses React Router v6 with two routing contexts:

1. **Public routes** — No authentication required
   - `/` — Homepage
   - `/login`, `/register`, `/forgot-password`, `/reset-password`
   - `/auth/google/callback`
   - `/services/:slug`
   - `/faq`, `/privacy`, `/terms`

2. **Protected routes** — Wrapped in `<ProtectedRoute>` + `<Layout>`
   - `/dashboard/:role` — Role-specific dashboards
   - `/requests`, `/requests/new`, `/requests/:id`
   - `/custom-requests`, `/custom-request`
   - `/projects`, `/projects/:id`
   - `/payments`, `/checkout`
   - `/admin/users`, `/admin/services` (admin only)
   - `/profile`, `/settings`

### State Management

| Concern          | Solution                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------- |
| **Auth state**   | `AuthContext` — `user`, `login()`, `register()`, `verifyOtp()`, `googleLogin()`, `logout()` |
| **Server state** | React Query — caching, background refetching, stale-while-revalidate                        |
| **API layer**    | Axios instance with automatic token refresh interceptor                                     |

### Token Refresh Flow

```
API call returns 401
     ↓
Is it an auth endpoint? → YES → Reject (prevent loop)
     ↓ NO
Already refreshing? → YES → Reject
     ↓ NO
POST /auth/refresh (HTTP-only cookie)
     ↓
Success → Retry original request
Failure → Redirect to /login (only from /dashboard/* pages)
```

---

## Database Schema

### Models Overview

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│      User        │     │     Service      │     │   AuditLog       │
│ ─────────────    │     │ ─────────────    │     │ ─────────────    │
│ email            │     │ name             │     │ userId           │
│ password (hash)  │     │ description      │     │ action           │
│ googleId         │     │ category         │     │ resource         │
│ name, phone      │     │ basePrice        │     │ details          │
│ avatar, company  │     │ isActive         │     │ ipAddress        │
│ role (RBAC)      │     └──────────────────┘     │ TTL: 90 days     │
│ emailVerified    │                               └──────────────────┘
│ lockout fields   │
│ OTP fields       │
│ reset fields     │
└──────────────────┘
         │
         │ clientId
         ▼
┌──────────────────┐     ┌──────────────────┐
│ ServiceRequest   │     │  CustomRequest   │
│ ─────────────    │     │ ─────────────    │
│ clientId → User  │     │ clientId → User  │
│ serviceId →Svc   │     │ serviceType      │
│ title, desc      │     │ fullName, email  │
│ requirements     │     │ phone, business  │
│ status           │     │ projectDesc      │
│ assignedDev      │     │ features, budget │
│ estimatedPrice   │     │ file attachment  │
└────────┬─────────┘     │ status, quote    │
         │               └────────┬─────────┘
         │                        │
         ▼                        ▼
┌──────────────────────────────────────────┐
│              Project                     │
│ ─────────────────────────────            │
│ serviceRequestId / customRequestId       │
│ title, description                       │
│ clientId → User                          │
│ developerIds → [User]                    │
│ serviceType, plan                        │
│ status, deliveryStatus, paymentStatus    │
│ budget, progress (0-100)                 │
│ milestones [{ title, desc, due, done }]  │
│ startDate, endDate                       │
└──────────┬───────────────────────────────┘
           │
     ┌─────┴──────┐
     ▼            ▼
┌──────────┐ ┌──────────────┐ ┌──────────────┐
│ Message  │ │    File      │ │   Payment    │
│ ──────── │ │ ──────────── │ │ ──────────── │
│ projectId│ │ projectId    │ │ clientId     │
│ senderId │ │ uploadedBy   │ │ projectId    │
│ content  │ │ fileName     │ │ amount, INR  │
│attachments││ fileUrl      │ │ status       │
│ isRead   │ │ cloudinaryId │ │ razorpay IDs │
└──────────┘ │ storageType  │ │ invoiceNumber│
             │ mimeType     │ │ paidAt       │
             └──────────────┘ └──────────────┘
```

### Enums & Constants

| Constant                  | Values                                                         |
| ------------------------- | -------------------------------------------------------------- |
| **ROLES**                 | `admin`, `developer`, `client`                                 |
| **SERVICE_CATEGORIES**    | `app-development`, `web-development`, `branding-creative`      |
| **REQUEST_STATUS**        | `pending`, `approved`, `in-progress`, `completed`, `cancelled` |
| **PROJECT_STATUS**        | `planning`, `in-progress`, `review`, `completed`, `cancelled`  |
| **DELIVERY_STATUS**       | `pending`, `in-progress`, `completed`, `delivered`             |
| **CUSTOM_REQUEST_STATUS** | `pending`, `quoted`, `approved`, `cancelled`                   |
| **PAYMENT_STATUS**        | `pending`, `processing`, `completed`, `failed`, `refunded`     |
| **FILE_TYPES**            | `image`, `document`, `video`, `audio`, `other`                 |

---

## API Routes

All routes are prefixed with `/api`.

### Authentication — `/api/auth`

| Method | Endpoint           | Auth   | Description                              |
| ------ | ------------------ | ------ | ---------------------------------------- |
| POST   | `/register`        | ✗      | Register with email/password (sends OTP) |
| POST   | `/verify-otp`      | ✗      | Verify email OTP                         |
| POST   | `/resend-otp`      | ✗      | Resend OTP                               |
| POST   | `/login`           | ✗      | Email/password login                     |
| POST   | `/google`          | ✗      | Google OAuth login                       |
| POST   | `/refresh`         | Cookie | Refresh access token                     |
| POST   | `/logout`          | ✓      | Clear refresh token                      |
| GET    | `/me`              | ✓      | Get current user                         |
| POST   | `/forgot-password` | ✗      | Send password reset email                |
| POST   | `/reset-password`  | ✗      | Reset password with token                |

### Users — `/api/users`

| Method | Endpoint      | Auth | Role  | Description               |
| ------ | ------------- | ---- | ----- | ------------------------- |
| GET    | `/`           | ✓    | Admin | List all users            |
| GET    | `/:id`        | ✓    | Admin | Get user by ID            |
| PUT    | `/:id`        | ✓    | Admin | Update user               |
| PUT    | `/:id/role`   | ✓    | Admin | Change user role          |
| PUT    | `/:id/status` | ✓    | Admin | Activate/deactivate       |
| PUT    | `/profile`    | ✓    | Any   | Update own profile        |
| PUT    | `/password`   | ✓    | Any   | Change own password       |
| PUT    | `/avatar`     | ✓    | Any   | Upload avatar (multipart) |

### Services — `/api/services`

| Method | Endpoint | Auth | Role  | Description          |
| ------ | -------- | ---- | ----- | -------------------- |
| GET    | `/`      | ✗    | —     | List active services |
| GET    | `/:id`   | ✗    | —     | Get service detail   |
| POST   | `/`      | ✓    | Admin | Create service       |
| PUT    | `/:id`   | ✓    | Admin | Update service       |
| DELETE | `/:id`   | ✓    | Admin | Delete service       |

### Requests — `/api/requests`

| Method | Endpoint      | Auth | Role   | Description                      |
| ------ | ------------- | ---- | ------ | -------------------------------- |
| GET    | `/`           | ✓    | Any    | List requests (filtered by role) |
| GET    | `/:id`        | ✓    | Any    | Get request detail               |
| POST   | `/`           | ✓    | Client | Create service request           |
| PUT    | `/:id/status` | ✓    | Admin  | Update request status            |
| PUT    | `/:id/assign` | ✓    | Admin  | Assign developer                 |

### Custom Requests — `/api/custom-requests`

| Method | Endpoint       | Auth | Role         | Description           |
| ------ | -------------- | ---- | ------------ | --------------------- |
| GET    | `/`            | ✓    | Client/Admin | List custom requests  |
| POST   | `/`            | ✓    | Client       | Submit custom request |
| PUT    | `/:id/quote`   | ✓    | Admin        | Set quote price       |
| PUT    | `/:id/approve` | ✓    | Client       | Approve quote         |

### Projects — `/api/projects`

| Method | Endpoint      | Auth | Role      | Description                      |
| ------ | ------------- | ---- | --------- | -------------------------------- |
| GET    | `/`           | ✓    | Any       | List projects (filtered by role) |
| GET    | `/:id`        | ✓    | Any       | Get project detail               |
| POST   | `/`           | ✓    | Admin     | Create project                   |
| PUT    | `/:id`        | ✓    | Admin/Dev | Update project                   |
| PUT    | `/:id/status` | ✓    | Admin     | Change project status            |

### Payments — `/api/payments`

| Method | Endpoint        | Auth | Role         | Description             |
| ------ | --------------- | ---- | ------------ | ----------------------- |
| GET    | `/`             | ✓    | Client/Admin | List payments           |
| POST   | `/create-order` | ✓    | Client       | Create Razorpay order   |
| POST   | `/verify`       | ✓    | Client       | Verify Razorpay payment |
| GET    | `/:id`          | ✓    | Client/Admin | Get payment detail      |

### Messages — `/api/messages`

| Method | Endpoint              | Auth | Description                              |
| ------ | --------------------- | ---- | ---------------------------------------- |
| GET    | `/project/:projectId` | ✓    | Get project messages                     |
| POST   | `/`                   | ✓    | Send message (with optional attachments) |
| PUT    | `/:id/read`           | ✓    | Mark message as read                     |

### Files — `/api/files`

| Method | Endpoint              | Auth | Description                         |
| ------ | --------------------- | ---- | ----------------------------------- |
| POST   | `/upload`             | ✓    | Upload file (multipart, Cloudinary) |
| GET    | `/project/:projectId` | ✓    | List project files                  |
| DELETE | `/:id`                | ✓    | Delete file                         |

### Admin Stats — `/api/admin`

| Method | Endpoint | Auth | Role  | Description              |
| ------ | -------- | ---- | ----- | ------------------------ |
| GET    | `/stats` | ✓    | Admin | Platform-wide statistics |

---

## Authentication & Security

### Auth Flow

1. **Registration** → Email + password → OTP sent to email → Verify OTP → JWT issued
2. **Login** → Email + password → JWT access token (15min) + refresh token (7d, HTTP-only cookie)
3. **Google OAuth** → Authorization code → Exchange for Google profile → JWT issued
4. **Token Refresh** → `POST /auth/refresh` using HTTP-only cookie → New access token

### Security Measures

| Measure              | Implementation                                                          |
| -------------------- | ----------------------------------------------------------------------- |
| **Password hashing** | bcrypt with cost factor 12                                              |
| **Account lockout**  | 5 failed attempts → 30-minute lock                                      |
| **JWT tokens**       | Short-lived access (15m) + long-lived refresh (7d) in HTTP-only cookies |
| **CSRF protection**  | Origin/referrer header validation                                       |
| **Rate limiting**    | Per-endpoint limits (see constants.js)                                  |
| **Input validation** | express-validator on all endpoints                                      |
| **NoSQL injection**  | express-mongo-sanitize strips `$` and `.`                               |
| **XSS protection**   | Helmet CSP headers                                                      |
| **File validation**  | MIME type whitelist, size limits per type                               |
| **Audit logging**    | All sensitive actions logged with TTL cleanup                           |

### Rate Limits

| Endpoint             | Window | Max Requests |
| -------------------- | ------ | ------------ |
| Global               | 15 min | 200 / IP     |
| Login/Register       | 15 min | 5 / IP       |
| Registration (email) | 1 hour | 3 / email    |
| Forgot Password      | 1 hour | 5 / IP       |
| OTP Send             | 15 min | 5 / IP       |
| OTP Verify           | 15 min | 10 / IP      |
| Password Change      | 15 min | 3 / IP       |
| General API          | 15 min | 100 / IP     |

---

## Environment Variables

### Server (`server/.env`)

| Variable                  | Description                              |
| ------------------------- | ---------------------------------------- |
| `NODE_ENV`                | `development` or `production`            |
| `PORT`                    | Server port (default: 5000)              |
| `HOST`                    | Bind address (default: `0.0.0.0`)        |
| `MONGODB_URI`             | MongoDB connection string                |
| `JWT_ACCESS_SECRET`       | Secret for access tokens                 |
| `JWT_REFRESH_SECRET`      | Secret for refresh tokens                |
| `JWT_ACCESS_EXPIRY`       | Access token TTL (e.g., `15m`)           |
| `JWT_REFRESH_EXPIRY`      | Refresh token TTL (e.g., `7d`)           |
| `GOOGLE_CLIENT_ID`        | Google OAuth client ID                   |
| `GOOGLE_CLIENT_SECRET`    | Google OAuth client secret               |
| `GOOGLE_REDIRECT_URI`     | Google OAuth redirect URI                |
| `FRONTEND_URL`            | Client URL for CORS and emails           |
| `RAZORPAY_KEY_ID`         | Razorpay API key                         |
| `RAZORPAY_KEY_SECRET`     | Razorpay secret key                      |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook signature secret        |
| `CLOUDINARY_CLOUD_NAME`   | Cloudinary cloud name                    |
| `CLOUDINARY_API_KEY`      | Cloudinary API key                       |
| `CLOUDINARY_API_SECRET`   | Cloudinary API secret                    |
| `BREVO_SMTP_HOST`         | SMTP host (e.g., `smtp-relay.brevo.com`) |
| `BREVO_SMTP_PORT`         | SMTP port (e.g., `587`)                  |
| `BREVO_SMTP_USER`         | SMTP username                            |
| `BREVO_SMTP_PASS`         | SMTP password                            |
| `FROM_EMAIL`              | Sender email address                     |
| `FROM_NAME`               | Sender display name                      |

### Client (`client/.env`)

| Variable                | Description                                         |
| ----------------------- | --------------------------------------------------- |
| `VITE_API_URL`          | Backend API URL (e.g., `http://localhost:5000/api`) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID                              |
| `VITE_RAZORPAY_KEY_ID`  | Razorpay public key                                 |

---

## Scripts & Commands

### Root

```bash
npm run dev          # Start both server & client concurrently
npm run server       # Start server only
npm run client       # Start client only
npm run build        # Build client for production
npm run install-all  # Install dependencies for root, server, and client
npm start            # Start server in production mode
```

### Server

```bash
cd server
npm run dev          # Start with nodemon (auto-restart)
npm start            # Start with node (production)
```

### Client

```bash
cd client
npm run dev          # Vite dev server (HMR)
npm run build        # Production build
npm run preview      # Preview production build
```

---

## Deployment

### Server → Render

Configured via `render.yaml`:

- **Service**: `skyworld-api` (web service, Node runtime)
- **Region**: Oregon
- **Build**: `npm install`
- **Start**: `node index.js`
- **Plan**: Free tier

### Client → Vercel

Configured via `client/vercel.json`:

- SPA rewrites (all routes → `index.html`)
- Security headers
- API proxy rules

### Alternative: Docker

A `Dockerfile` and `nginx.conf` are provided in the `client/` directory for containerized deployment.

---

## Existing Documentation

Additional documentation is available in the `docs/` directory:

| File                                    | Description                         |
| --------------------------------------- | ----------------------------------- |
| [API.md](docs/API.md)                   | API endpoint reference              |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture deep-dive       |
| [DATABASE.md](docs/DATABASE.md)         | Database schema details             |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md)     | Deployment instructions             |
| [SECURITY.md](docs/SECURITY.md)         | Security implementation details     |
| [SRS.md](docs/SRS.md)                   | Software Requirements Specification |
| [RBAC_FLOW.md](docs/RBAC_FLOW.md)       | Role-based access control flow      |
| [UI_UX_DESIGN.md](docs/UI_UX_DESIGN.md) | UI/UX design documentation          |
| [USER_MANUAL.md](docs/USER_MANUAL.md)   | End-user manual                     |
