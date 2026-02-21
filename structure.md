# SkyWorld Project Structure Overview

## 1) High-Level Architecture
- **Frontend**: React + Vite (client/)
- **Backend**: Express + MongoDB (server/)
- **Auth**: JWT with refresh token cookies, Google OAuth
- **Payments**: Razorpay (order creation, verification, webhook)
- **Storage**: Cloudinary for uploads
- **Roles**: Admin, Client, Developer

## 2) Root Level
- **package.json**: Workspace scripts to run client/server and build frontend
- **render.yaml**: Render deployment configuration
- **.github/workflows/deploy.yml**: CI/CD pipeline
- **docs/**: Product, API, and architecture documentation
- **client/**: Frontend application
- **server/**: Backend API

## 3) Frontend (client/)
### Entry and Core
- **src/main.jsx**: React bootstrapping and providers
- **src/App.jsx**: Routes, auth guard, role guard
- **src/index.css**: Tailwind base styles and component classes
- **src/services/api.js**: Axios instance and auth refresh flow

### Pages
- **Home.jsx**: Landing page with service cards and product sections
- **auth/**: Login, Register, Forgot/Reset Password, Google Callback
- **client/Dashboard.jsx**: Client dashboard (projects, requests, custom requests)
- **developer/Dashboard.jsx**: Developer dashboard (assigned projects)
- **admin/Dashboard.jsx**: Admin metrics and recent activity
- **admin/UserManagement.jsx**: Admin user management
- **admin/ServiceManagement.jsx**: Admin service catalog management
- **projects/**: Project list and detail views
- **requests/**:
  - Service request flow: RequestList, RequestDetail, NewRequest
  - Custom request flow: CustomRequestForm, CustomRequestList, CustomRequestThankYou
- **services/ServiceDetail.jsx**: Service details with plans and CTA
- **checkout/Checkout.jsx**: Starter plan checkout using Razorpay
- **payments/PaymentList.jsx**: Payment history
- **Profile.jsx / Settings.jsx**: Account screens

### Components
- **components/common/**: ProtectedRoute, RoleRoute
- **components/layout/**: Sidebar + layout shell

### Config & Assets
- **public/logo.png**
- **tailwind.config.js / postcss.config.js**
- **vite.config.js**
- **nginx.conf / vercel.json** for deployment

## 4) Backend (server/)
### Entry and Configuration
- **index.js**: App bootstrap, middleware, routes
- **config/**:
  - database.js: MongoDB connection
  - validateEnv.js: Required environment checks
  - cloudinary.js: Cloudinary setup

### Middleware
- **auth.js**: JWT auth, refresh, audit logging
- **rbac.js**: Role checks (admin-only, allowed roles)
- **validation.js**: Express-validator rules
- **rateLimiter.js**: API + auth rate limiting
- **upload.js**: Multer memory storage, file validations
- **errorHandler.js**: Centralized error handling

### Models
- **User.js**: User profiles and roles
- **Service.js**: Service catalog
- **ServiceRequest.js**: Standard service requests
- **CustomRequest.js**: Custom plan requests with file uploads
- **Project.js**: Projects created from payments or requests
- **Payment.js**: Razorpay payment records
- **Message.js**: Project messaging
- **File.js**: Project files
- **AuditLog.js**: System audit logs

### Controllers
- **authController.js**: Register/login/refresh/password reset
- **serviceController.js**: Service catalog CRUD
- **requestController.js**: Standard request CRUD and assignment
- **customRequestController.js**: Custom request creation + quoting
- **projectController.js**: Project CRUD
- **paymentController.js**: Razorpay order, verify, webhook
- **statsController.js**: Admin dashboard stats
- **userController.js**: User management
- **messageController.js**: Project messaging
- **fileController.js**: File uploads and retrieval

### Routes
- **auth.js**: /api/auth
- **services.js**: /api/services
- **requests.js**: /api/requests
- **customRequests.js**: /api/custom-requests
- **projects.js**: /api/projects
- **payments.js**: /api/payments
- **stats.js**: /api/admin/stats
- **users.js**: /api/users
- **messages.js**: /api/messages
- **files.js**: /api/files

### Services/Utils
- **services/authService.js**: Cookie/session helpers
- **services/cloudinaryService.js**: Upload handler
- **services/emailService.js**: Email utilities
- **utils/constants.js**: Enums for statuses, roles
- **utils/logger.js**: Logging setup

## 5) Key Functional Flows
### Authentication
- JWT access + refresh cookie strategy
- Role-based guards on protected routes

### Service Requests (Starter/Standard)
- Client submits request → Admin assigns developer → Project created

### Custom Requests
- Client submits custom form + optional file
- Admin adds quote and updates status
- Client pays via Razorpay → Project created

### Payments
- Razorpay order created on backend
- Signature verification on backend
- Payment record saved and project updated/created

## 6) Environment & Deployment
- **server/.env.example**: API secrets (Razorpay, DB, JWT, email)
- **client/.env.example**: API base URL and OAuth settings
- **render.yaml / nginx.conf / vercel.json**: Deployment configuration

## 7) Documentation (docs/)
- **API.md**: API endpoints and examples
- **ARCHITECTURE.md**: System design
- **DATABASE.md**: Schemas and indexes
- **DEPLOYMENT.md**: Deployment steps
- **SECURITY.md**: Security controls
- **SRS.md**: Requirements specification
- **UI_UX_DESIGN.md**: UI/UX guidelines
- **USER_MANUAL.md**: User guides
