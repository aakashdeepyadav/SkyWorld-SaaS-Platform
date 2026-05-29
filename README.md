<div align="center">
  <img src="client/public/logo.png" alt="SkyWorld" width="64" height="64" />
  <h1>SkyWorld</h1>
  <p><strong>Premium digital studio — apps, websites & brands.</strong></p>

  <p>
    <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" alt="React" />
    <img src="https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white" alt="Node" />
    <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white" alt="Mongo" />
    <img src="https://img.shields.io/badge/Tailwind-3.3-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/License-MIT-blue" alt="License" />
  </p>
</div>

---

## What is SkyWorld?

A **production-grade SaaS platform** where clients can request, track, and pay for digital services — app development, web development, and branding & design. Built on the MERN stack with role-based dashboards, milestone tracking, Razorpay payments, Cloudinary file management, and email notifications.

### Core Features

- 🛒 **Service Catalog** — Three categories with configurable pricing
- 📋 **Service & Custom Requests** — Structured or freeform project briefs
- 📊 **Project Dashboard** — Milestone tracking, progress bars, developer assignment
- 💳 **Razorpay Payments** — Order creation, verification, auto-invoicing
- 💬 **Messaging** — Per-project chat between clients & developers
- 📁 **File Uploads** — Cloudinary-backed with MIME validation
- 🔐 **Auth** — Email/password + OTP verification + Google OAuth
- 🛡️ **Security** — Helmet, CSRF, rate limiting, mongo-sanitize, account lockout

---

## Tech Stack

| Layer        | Technologies                                                    |
| ------------ | --------------------------------------------------------------- |
| **Frontend** | React 18, Vite 5, Tailwind CSS 3.3, React Query, React Router 6 |
| **Backend**  | Node.js, Express 4, Mongoose 8, JWT (HTTP-only cookies)         |
| **Database** | MongoDB Atlas                                                   |
| **Payments** | Razorpay                                                        |
| **Storage**  | Cloudinary                                                      |
| **Email**    | Nodemailer + Brevo SMTP                                         |
| **Deploy**   | Vercel (frontend) + Render (backend)                            |

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster (or local MongoDB)
- Google OAuth credentials (optional, for social login)
- Razorpay account (optional, for payments)
- Cloudinary account (optional, for file uploads)

### 1. Install

```bash
git clone https://github.com/aakashdeepyadav/SkyWorld-SaaS-Platform.git
cd SkyWorld-SaaS-Platform
npm run install-all
```

### 2. Configure

Copy the example env files and fill in your credentials:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**Server** (`server/.env`):

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
FRONTEND_URL=http://localhost:5173
```

**Client** (`client/.env`):

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run

```bash
npm run dev
```

This starts both the Express server (`:5000`) and Vite dev server (`:5173`) concurrently.

---

## Project Structure

```
SkyWorld/
├── client/                   # React SPA (Vite)
│   ├── src/
│   │   ├── pages/            # 28 page components
│   │   │   ├── auth/         # Login, Register, OAuth, Password Reset
│   │   │   ├── admin/        # Admin Dashboard, User & Service Management
│   │   │   ├── client/       # Client Dashboard
│   │   │   ├── developer/    # Developer Dashboard
│   │   │   ├── requests/     # Service & Custom Requests
│   │   │   ├── projects/     # Project List & Detail
│   │   │   ├── payments/     # Payment List
│   │   │   └── checkout/     # Razorpay Checkout
│   │   ├── components/       # ProtectedRoute, RoleRoute, Layout
│   │   ├── context/          # AuthContext (auth state management)
│   │   ├── services/         # Axios instance + token refresh interceptor
│   │   └── utils/            # Currency formatting
│   ├── tailwind.config.js    # Brand colors, fonts, animations
│   └── vercel.json           # Vercel deployment config
│
├── server/                   # Express API
│   ├── models/               # 9 Mongoose models
│   ├── controllers/          # 10 controllers
│   ├── routes/               # 10 route files
│   ├── middleware/            # Auth, RBAC, rate limiting, CSRF, validation, uploads
│   ├── services/             # Auth, Email, Cloudinary service layers
│   ├── config/               # Database, Cloudinary, env validation
│   └── utils/                # Constants, Logger
│
├── docs/                     # Architecture, API, Database, Security, SRS docs
└── render.yaml               # Render deployment config
```

---

## User Roles

| Role          | Access                                                      | Assignment        |
| ------------- | ----------------------------------------------------------- | ----------------- |
| **Client**    | Request services, track projects, make payments, chat       | Default on signup |
| **Developer** | View assigned projects, update progress, chat               | Assigned by admin |
| **Admin**     | Full access — users, services, requests, projects, payments | Manual            |

---

## API Overview

All endpoints prefixed with `/api`. See [docs/API.md](./docs/API.md) for full reference.

| Resource           | Endpoints | Description                                 |
| ------------------ | --------- | ------------------------------------------- |
| `/auth`            | 10        | Register, login, OAuth, OTP, password reset |
| `/users`           | 8         | User management, profile, avatar            |
| `/services`        | 5         | Service catalog CRUD                        |
| `/requests`        | 5         | Service request lifecycle                   |
| `/custom-requests` | 4         | Custom request + quoting                    |
| `/projects`        | 5         | Project management                          |
| `/payments`        | 4         | Razorpay orders & verification              |
| `/messages`        | 3         | Per-project messaging                       |
| `/files`           | 3         | Cloudinary file management                  |
| `/admin/stats`     | 1         | Platform analytics                          |

---

## Security

| Measure            | Detail                                                 |
| ------------------ | ------------------------------------------------------ |
| Password hashing   | bcrypt (cost 12)                                       |
| Account lockout    | 5 failed attempts → 30min lock                         |
| JWT                | Short access (15m) + refresh (7d) in HTTP-only cookies |
| CSRF               | Origin/referrer header validation                      |
| Rate limiting      | Per-endpoint (auth: 5/15min, global: 200/15min)        |
| Input sanitization | express-validator + mongo-sanitize                     |
| File validation    | MIME whitelist, size limits, no SVG (XSS risk)         |
| Audit trail        | Action logging with 90-day TTL auto-cleanup            |

---

## Deployment

### Frontend → Vercel

Deployed automatically from the `client/` directory. Config in `client/vercel.json`.

### Backend → Render

Deployed via `render.yaml`. Free tier web service in Oregon region.

### Docker (alternative)

```bash
cd client
docker build -t skyworld-client .
docker run -p 80:80 skyworld-client
```

---

## Documentation

| Document                                       | Description                |
| ---------------------------------------------- | -------------------------- |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture        |
| [docs/API.md](./docs/API.md)                   | API endpoint reference     |
| [docs/DATABASE.md](./docs/DATABASE.md)         | Database schema            |
| [docs/SECURITY.md](./docs/SECURITY.md)         | Security details           |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)     | Deployment guide           |
| [docs/SRS.md](./docs/SRS.md)                   | Software Requirements Spec |
| [docs/RBAC_FLOW.md](./docs/RBAC_FLOW.md)       | Role-based access flow     |
| [docs/UI_UX_DESIGN.md](./docs/UI_UX_DESIGN.md) | UI/UX design docs          |
| [docs/USER_MANUAL.md](./docs/USER_MANUAL.md)   | End-user manual            |

---

## Scripts

```bash
npm run dev          # Start both server & client
npm run server       # Server only (nodemon)
npm run client       # Client only (Vite HMR)
npm run build        # Production build (client)
npm run install-all  # Install all dependencies
npm start            # Production server
```

---

## License

MIT — see [LICENSE](LICENSE) for details.
