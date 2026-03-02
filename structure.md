# SkyWorld — Full Project Structure Reference

_Last updated: 2026-03-02_

This document describes the complete current project layout for the SkyWorld workspace.
It is intended to be a maintainable reference for onboarding, debugging, deployment, and ownership.

## 1) Repository Summary

- **Architecture**: Monorepo with React frontend (`client/`) + Express backend (`server/`)
- **Deployment**: Vercel (frontend), Render (backend), Docker support
- **Documentation**: Deep technical docs in `docs/` plus top-level reports
- **Testing**: Backend unit tests under `server/__tests__/`

## 2) Complete Structure Tree (source-oriented)

> Notes:
>
> - Dependency internals (`node_modules/**`) are intentionally not expanded.
> - Build output folders are included as folders only where present.
> - Local runtime artifacts (e.g., `.env`, concrete `*.log` files) are intentionally omitted.

```text
SkyWorld/
├── .dockerignore
├── .gitignore
├── .prettierignore
├── .prettierrc
├── docker-compose.yml
├── Dockerfile
├── ENHANCEMENT_REPORT.md
├── package-lock.json
├── package.json
├── PROJECT_DOCS.md
├── PROJECT_SUMMARY.md
├── README.md
├── render.yaml
├── structure.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── client/
│   ├── .env.example
│   ├── Dockerfile
│   ├── index.html
│   ├── nginx.conf
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vercel.json
│   ├── vite.config.js
│   ├── dist/                          (build output)
│   ├── node_modules/                  (dependencies)
│   ├── public/
│   │   ├── favicon_183px.png
│   │   ├── favicon_48px.png
│   │   ├── favicon_96px.png
│   │   ├── iconAsset 57@2x.png
│   │   ├── icon_logo_black_normal.png
│   │   ├── icon_logo_coloured.png
│   │   ├── icon_logo_coloured_normal.png
│   │   ├── icon_logo_mini.png
│   │   ├── logo.png
│   │   ├── v1Asset 40SkyWorld.png
│   │   ├── wordmark_logo_all_black.png
│   │   ├── wordmark_logo_all_white_fullname.png
│   │   ├── wordmark_logo_black_fullname.png
│   │   ├── wordmark_logo_coloured_.png
│   │   ├── wordmark_logo_coloured_fullname.png
│   │   ├── wordmark_logo_white_.png
│   │   └── wordmark_logo_white_fullname.png
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── components/
│       │   ├── common/
│       │   │   ├── CommandPalette.jsx
│       │   │   ├── ErrorBoundary.jsx
│       │   │   ├── NotificationBell.jsx
│       │   │   ├── ProjectTracker.jsx
│       │   │   ├── ProtectedRoute.jsx
│       │   │   └── RoleRoute.jsx
│       │   └── layout/
│       │       └── Layout.jsx
│       ├── context/
│       │   ├── AuthContext.jsx
│       │   ├── SocketContext.jsx
│       │   └── ThemeContext.jsx
│       ├── pages/
│       │   ├── FAQ.jsx
│       │   ├── Home.jsx
│       │   ├── NotFound.jsx
│       │   ├── PrivacyPolicy.jsx
│       │   ├── Profile.jsx
│       │   ├── Settings.jsx
│       │   ├── TermsOfService.jsx
│       │   ├── admin/
│       │   │   ├── Dashboard.jsx
│       │   │   ├── ServiceManagement.jsx
│       │   │   └── UserManagement.jsx
│       │   ├── auth/
│       │   │   ├── ForgotPassword.jsx
│       │   │   ├── GoogleCallback.jsx
│       │   │   ├── Login.jsx
│       │   │   ├── Register.jsx
│       │   │   └── ResetPassword.jsx
│       │   ├── checkout/
│       │   │   └── Checkout.jsx
│       │   ├── client/
│       │   │   └── Dashboard.jsx
│       │   ├── developer/
│       │   │   └── Dashboard.jsx
│       │   ├── payments/
│       │   │   └── PaymentList.jsx
│       │   ├── projects/
│       │   │   ├── ProjectDetail.jsx
│       │   │   └── ProjectList.jsx
│       │   ├── requests/
│       │   │   ├── CustomRequestForm.jsx
│       │   │   ├── CustomRequestList.jsx
│       │   │   ├── CustomRequestThankYou.jsx
│       │   │   ├── NewRequest.jsx
│       │   │   ├── RequestDetail.jsx
│       │   │   └── RequestList.jsx
│       │   └── services/
│       │       └── ServiceDetail.jsx
│       ├── services/
│       │   └── api.js
│       └── utils/
│           └── currency.js
│
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   ├── RBAC_FLOW.md
│   ├── SECURITY.md
│   ├── SRS.md
│   ├── UI_UX_DESIGN.md
│   └── USER_MANUAL.md
│
├── logs/
│   └── (runtime logs, ignored)
│
└── server/
    ├── .env.example
    ├── eslint.config.js
    ├── index.js
    ├── package-lock.json
    ├── package.json
    ├── socket.js
    ├── vitest.config.js
    ├── node_modules/                  (dependencies)
    ├── logs/
    │   └── (runtime logs, ignored)
    ├── __tests__/
    │   ├── helpers.js
    │   └── unit/
    │       ├── AppError.test.js
    │       ├── constants.test.js
    │       ├── errorHandler.test.js
    │       └── rbac.test.js
    ├── config/
    │   ├── cloudinary.js
    │   ├── database.js
    │   ├── sentry.js
    │   └── validateEnv.js
    ├── controllers/
    │   ├── analyticsController.js
    │   ├── authController.js
    │   ├── customRequestController.js
    │   ├── fileController.js
    │   ├── messageController.js
    │   ├── notificationController.js
    │   ├── paymentController.js
    │   ├── projectController.js
    │   ├── requestController.js
    │   ├── serviceController.js
    │   ├── statsController.js
    │   ├── twoFactorController.js
    │   └── userController.js
    ├── middleware/
    │   ├── auth.js
    │   ├── csrfProtection.js
    │   ├── errorHandler.js
    │   ├── rateLimiter.js
    │   ├── rbac.js
    │   ├── socketAuth.js
    │   ├── upload.js
    │   └── validation.js
    ├── models/
    │   ├── AuditLog.js
    │   ├── CustomRequest.js
    │   ├── File.js
    │   ├── Message.js
    │   ├── Notification.js
    │   ├── Payment.js
    │   ├── Project.js
    │   ├── Service.js
    │   ├── ServiceRequest.js
    │   └── User.js
    ├── routes/
    │   ├── admin.js
    │   ├── auth.js
    │   ├── customRequests.js
    │   ├── files.js
    │   ├── messages.js
    │   ├── notifications.js
    │   ├── payments.js
    │   ├── projects.js
    │   ├── requests.js
    │   ├── services.js
    │   ├── stats.js
    │   └── users.js
    ├── services/
    │   ├── authService.js
    │   ├── cloudinaryService.js
    │   ├── emailService.js
    │   ├── invoiceService.js
    │   └── notificationService.js
    └── utils/
        ├── AppError.js
        ├── constants.js
        ├── logger.js
        └── testEmail.js
```

## 3) Folder Responsibilities

### Root files and directories

- **`package.json` / `package-lock.json`**: Root workspace scripts and dependency lock.
- **`docker-compose.yml` + `Dockerfile`**: Containerized local/deployment workflows.
- **`render.yaml`**: Render service definition.
- **`README.md`**: Product and setup guide.
- **`PROJECT_DOCS.md`, `PROJECT_SUMMARY.md`, `ENHANCEMENT_REPORT.md`**: Project-level design and progress artifacts.
- **`.github/workflows/`**: CI/CD automation pipelines.
- **`logs/`**: Root-level runtime logs (local/ignored).

### `client/` (Frontend SPA)

- **Entry + app shell**: `src/main.jsx`, `src/App.jsx`, `src/index.css`
- **Core UI blocks**: `src/components/common/`, `src/components/layout/`
- **Global state/providers**: `src/context/` (auth, socket, theme)
- **Route pages**: `src/pages/` grouped by feature/role
- **API client layer**: `src/services/api.js`
- **Utility layer**: `src/utils/currency.js`
- **Brand assets**: `public/` logos/icons/wordmarks
- **Build + deploy config**: `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `nginx.conf`, `vercel.json`, `Dockerfile`

### `server/` (Backend API)

- **Bootstrap/runtime**: `index.js`, `socket.js`
- **Configuration**: `config/` (DB, env validation, cloudinary, sentry)
- **HTTP layer**: `routes/` + `controllers/`
- **Business/application services**: `services/`
- **Cross-cutting middleware**: auth, RBAC, validation, rate limiting, upload, CSRF, error handler
- **Data models**: `models/` (Mongoose schema layer)
- **Utility modules**: `utils/` (errors, constants, logger, test email)
- **Test suite**: `__tests__/unit/` and helpers
- **Server env template**: `.env.example` (runtime `.env*` files are local/ignored)
- **Server logs**: `server/logs/`

### `docs/` (Project documentation)

- **`API.md`**: Endpoint contracts and usage.
- **`ARCHITECTURE.md`**: Technical architecture and system boundaries.
- **`DATABASE.md`**: Data modeling and storage reference.
- **`DEPLOYMENT.md`**: Deployment pipelines and environments.
- **`RBAC_FLOW.md`**: Role-based access behavior.
- **`SECURITY.md`**: Security controls and practices.
- **`SRS.md`**: Requirement specification.
- **`UI_UX_DESIGN.md`**: UI/UX system and decisions.
- **`USER_MANUAL.md`**: End-user workflow documentation.

## 4) Maintenance Guidance for This File

Use this checklist when updating structure docs:

1. Add/remove paths whenever files or folders are added/removed.
2. Keep each folder’s “responsibility” summary aligned with current implementation.
3. Keep generated/dependency folders collapsed (do not expand package internals).
4. Update the “Last updated” date each time this file is revised.
5. If architecture changes materially, also update `README.md` and `docs/ARCHITECTURE.md`.
