# System Architecture

## High-Level Architecture (HLD)

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Browser    │  │   Mobile     │  │   Tablet     │         │
│  │   (React)    │  │   (React)    │  │   (React)    │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                 │
│         └──────────────────┼──────────────────┘                 │
│                            │                                    │
│                    ┌───────▼────────┐                           │
│                    │  Vite Dev      │                           │
│                    │  Server /      │                           │
│                    │  Vercel CDN    │                           │
│                    └───────┬────────┘                           │
└────────────────────────────┼────────────────────────────────────┘
                             │ HTTPS
                             │ REST API
┌────────────────────────────▼────────────────────────────────────┐
│                      API GATEWAY LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Express.js Server (Node.js)                             │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │  │
│  │  │   Auth   │  │   Rate   │  │   CORS   │  │  Security│ │  │
│  │  │Middleware│  │ Limiting │  │  Headers │  │  Headers │ │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │  │
│  │       └─────────────┼─────────────┼─────────────┘       │  │
│  │                     │             │                       │  │
│  │  ┌──────────────────▼─────────────▼──────────────────┐  │  │
│  │  │              Route Handlers                        │  │  │
│  │  │  /api/auth  /api/users  /api/projects  /api/...   │  │  │
│  │  └──────────────────┬─────────────────────────────────┘  │  │
│  │                     │                                     │  │
│  │  ┌──────────────────▼─────────────────────────────────┐  │  │
│  │  │              Controllers                            │  │  │
│  │  │  AuthController  UserController  ProjectController │  │  │
│  │  └──────────────────┬─────────────────────────────────┘  │  │
│  │                     │                                     │  │
│  │  ┌──────────────────▼─────────────────────────────────┐  │  │
│  │  │              Services Layer                         │  │  │
│  │  │  AuthService  UserService  ProjectService          │  │  │
│  │  └──────────────────┬─────────────────────────────────┘  │  │
│  └─────────────────────┼─────────────────────────────────────┘  │
└────────────────────────┼────────────────────────────────────────┘
                         │
                         │ Mongoose ODM
┌────────────────────────▼────────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              MongoDB Atlas (Cloud)                       │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│  │
│  │  │  Users   │  │ Projects │  │ Services │  │ Payments ││  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘│  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│  │
│  │  │ Messages │  │  Files   │  │Audit Logs│  │ Requests ││  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘│  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Google     │  │   Payment    │  │   File       │          │
│  │   OAuth 2.0  │  │   Gateway    │  │   Storage    │          │
│  │              │  │   (Stripe)   │  │   (AWS S3)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

## Low-Level Architecture (LLD)

### Backend Architecture

```
server/
├── config/
│   ├── database.js          # MongoDB connection
│   ├── jwt.js               # JWT configuration
│   └── oauth.js             # OAuth configuration
├── models/
│   ├── User.js              # User schema
│   ├── Project.js           # Project schema
│   ├── Service.js           # Service schema
│   ├── ServiceRequest.js    # Service request schema
│   ├── Payment.js           # Payment schema
│   ├── Message.js           # Message schema
│   ├── File.js              # File schema
│   └── AuditLog.js          # Audit log schema
├── middleware/
│   ├── auth.js              # JWT verification
│   ├── rbac.js              # Role-based access control
│   ├── validation.js        # Input validation
│   ├── rateLimiter.js       # Rate limiting
│   ├── errorHandler.js      # Error handling
│   └── upload.js            # File upload handling
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── userController.js    # User management
│   ├── projectController.js # Project management
│   ├── serviceController.js # Service management
│   ├── requestController.js # Service request handling
│   ├── paymentController.js # Payment processing
│   └── messageController.js # Messaging
├── services/
│   ├── authService.js       # Auth business logic
│   ├── userService.js       # User business logic
│   ├── projectService.js    # Project business logic
│   ├── emailService.js      # Email notifications
│   └── fileService.js       # File handling
├── routes/
│   ├── auth.js              # Auth routes
│   ├── users.js             # User routes
│   ├── projects.js          # Project routes
│   ├── services.js          # Service routes
│   ├── requests.js          # Request routes
│   ├── payments.js          # Payment routes
│   └── messages.js          # Message routes
├── utils/
│   ├── logger.js            # Logging utility
│   ├── validator.js         # Validation helpers
│   └── constants.js         # Constants
├── .env                     # Environment variables
└── index.js                 # Server entry point
```

### Frontend Architecture

```
client/
├── public/
│   └── assets/              # Static assets
├── src/
│   ├── components/
│   │   ├── common/          # Reusable components
│   │   ├── auth/            # Auth components
│   │   ├── dashboard/      # Dashboard components
│   │   └── forms/           # Form components
│   ├── pages/
│   │   ├── auth/            # Login, Register
│   │   ├── admin/           # Admin dashboard
│   │   ├── developer/       # Developer dashboard
│   │   └── client/          # Client dashboard
│   ├── hooks/               # Custom React hooks
│   ├── context/             # React Context (Auth, Theme)
│   ├── services/            # API service layer
│   ├── utils/               # Utility functions
│   ├── constants/           # Constants
│   ├── styles/              # Global styles
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── routes.jsx           # Route configuration
├── .env                     # Environment variables
└── vite.config.js           # Vite configuration
```

## Component Interaction Flow

### Authentication Flow

```
┌─────────┐         ┌─────────┐         ┌─────────┐         ┌─────────┐
│ Client  │────────▶│ Frontend│────────▶│ Backend │────────▶│ MongoDB │
└─────────┘         └─────────┘         └─────────┘         └─────────┘
     │                    │                    │                  │
     │  1. Login Request  │                    │                  │
     │───────────────────▶│                    │                  │
     │                    │  2. POST /api/auth │                  │
     │                    │      /login        │                  │
     │                    │───────────────────▶│                  │
     │                    │                    │  3. Verify User │
     │                    │                    │─────────────────▶│
     │                    │                    │  4. User Data   │
     │                    │                    │◀─────────────────│
     │                    │  5. Generate JWT   │                  │
     │                    │      + Refresh     │                  │
     │                    │◀───────────────────│                  │
     │  6. Set HttpOnly    │                    │                  │
     │     Cookies        │                    │                  │
     │◀───────────────────│                    │                  │
     │  7. Redirect to    │                    │                  │
     │     Dashboard      │                    │                  │
     │───────────────────▶│                    │                  │
```

### OAuth Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Client  │    │Frontend │    │ Backend │    │ Google  │    │ MongoDB │
└────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘
     │              │              │              │              │
     │ 1. Click     │              │              │              │
     │    "Sign in  │              │              │              │
     │    with      │              │              │              │
     │    Google"   │              │              │              │
     │─────────────▶│              │              │              │
     │              │ 2. Redirect  │              │              │
     │              │    to Google │              │              │
     │              │──────────────┼─────────────▶│              │
     │              │              │              │              │
     │              │              │ 3. User      │              │
     │              │              │    Auth      │              │
     │              │              │◀─────────────│              │
     │              │ 4. Callback  │              │              │
     │              │    with code │              │              │
     │              │◀─────────────│              │              │
     │              │ 5. POST      │              │              │
     │              │    /api/auth │              │              │
     │              │    /oauth    │              │              │
     │              │─────────────▶│              │              │
     │              │              │ 6. Exchange  │              │
     │              │              │    code for  │              │
     │              │              │    token     │              │
     │              │              │─────────────▶│              │
     │              │              │ 7. Get user  │              │
     │              │              │    info      │              │
     │              │              │◀─────────────│              │
     │              │              │ 8. Check/Create│            │
     │              │              │    User      │              │
     │              │              │──────────────┼─────────────▶│
     │              │              │ 9. User Data │              │
     │              │              │◀─────────────┼──────────────│
     │              │ 10. Generate │              │              │
     │              │     JWT      │              │              │
     │              │◀─────────────│              │              │
     │ 11. Set      │              │              │              │
     │     Cookies  │              │              │              │
     │◀─────────────│              │              │              │
```

### RBAC Enforcement Flow

```
┌─────────┐         ┌─────────┐         ┌─────────┐         ┌─────────┐
│ Client  │────────▶│ Frontend│────────▶│ Backend │────────▶│ MongoDB │
└─────────┘         └─────────┘         └─────────┘         └─────────┘
     │                    │                    │                  │
     │  1. API Request    │                    │                  │
     │     with JWT       │                    │                  │
     │───────────────────▶│                    │                  │
     │                    │  2. Request +      │                  │
     │                    │     Cookie         │                  │
     │                    │───────────────────▶│                  │
     │                    │                    │  3. Verify JWT   │
     │                    │                    │     Extract Role │
     │                    │                    │─────────────────▶│
     │                    │                    │  4. User + Role  │
     │                    │                    │◀─────────────────│
     │                    │                    │  5. Check        │
     │                    │                    │     Permissions  │
     │                    │                    │     (RBAC)       │
     │                    │                    │                  │
     │                    │  6a. Allowed       │                  │
     │                    │      (200 OK)      │                  │
     │                    │◀───────────────────│                  │
     │  7a. Success       │                    │                  │
     │◀───────────────────│                    │                  │
     │                    │  6b. Forbidden     │                  │
     │                    │      (403)         │                  │
     │                    │◀───────────────────│                  │
     │  7b. Error         │                    │                  │
     │◀───────────────────│                    │                  │
```

## Scalability & Performance Strategy

### Horizontal Scaling
- **Frontend**: CDN distribution (Vercel)
- **Backend**: Load balancer + multiple Node.js instances
- **Database**: MongoDB replica sets + sharding

### Caching Strategy
- **Redis** for session storage
- **CDN** for static assets
- **Browser caching** for API responses (where appropriate)

### Database Optimization
- Indexed queries
- Connection pooling
- Query optimization
- Aggregation pipelines for complex queries

### Performance Monitoring
- Application Performance Monitoring (APM)
- Error tracking (Sentry)
- Log aggregation
- Real-time metrics dashboard

