# Software Requirements Specification (SRS)

## 1. Introduction

### 1.1 Purpose
This document specifies the requirements for SkyWorld SaaS Platform, a production-grade service platform providing App Development, Web Development, and Branding & Creative services.

### 1.2 Scope
The system will support three user roles (Admin, Developer, Client) with role-based access control, authentication via email/password and Google OAuth, project management, service requests, payments, and messaging.

### 1.3 Definitions, Acronyms, and Abbreviations
- **SaaS**: Software as a Service
- **MERN**: MongoDB, Express.js, React, Node.js
- **RBAC**: Role-Based Access Control
- **JWT**: JSON Web Token
- **OAuth**: Open Authorization
- **API**: Application Programming Interface
- **OWASP**: Open Web Application Security Project

### 1.4 References
- IEEE 830-1998 Standard for Software Requirements Specifications
- OWASP Top 10 Security Risks
- MongoDB Best Practices
- React Documentation
- Express.js Documentation

### 1.5 Overview
This document is organized into sections covering overall description, specific requirements, and constraints.

## 2. Overall Description

### 2.1 Product Perspective
SkyWorld is a standalone SaaS platform that integrates with:
- Google OAuth 2.0 for authentication
- Payment gateways (Stripe) for transactions
- Cloud storage (AWS S3) for file uploads
- Email services for notifications

### 2.2 Product Functions
1. **User Management**
   - Registration and authentication
   - Profile management
   - Role assignment

2. **Service Management**
   - Service catalog (App Dev, Web Dev, Branding)
   - Service request creation and tracking
   - Service delivery management

3. **Project Management**
   - Project creation and assignment
   - Project status tracking
   - File sharing and collaboration

4. **Payment Processing**
   - Payment initiation
   - Transaction history
   - Invoice generation

5. **Communication**
   - Messaging between users
   - Notifications
   - Activity logs

6. **Administration**
   - User management
   - System configuration
   - Audit logging

### 2.3 User Classes and Characteristics

#### 2.3.1 Admin
- **Characteristics**: System administrators with full access
- **Access Level**: Highest security clearance
- **Creation Method**: Manually assigned only (cannot signup)
- **Permissions**: All system functions

#### 2.3.2 Developer
- **Characteristics**: Service providers assigned to projects
- **Access Level**: Project and service management
- **Creation Method**: Assigned by Admin only
- **Permissions**: View assigned projects, update project status, communicate with clients

#### 2.3.3 Client
- **Characteristics**: Service consumers
- **Access Level**: Default role
- **Creation Method**: Self-registration (email/password or Google OAuth)
- **Permissions**: Create service requests, view own projects, make payments, communicate

### 2.4 Operating Environment
- **Frontend**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Backend**: Node.js 18+ runtime
- **Database**: MongoDB Atlas (cloud)
- **Deployment**: Cloud-based (Vercel, AWS/Render)

### 2.5 Design and Implementation Constraints
- Must use MERN stack
- Must support mobile responsiveness
- Must comply with OWASP Top 10
- Must use HTTPS in production
- Must support Google OAuth 2.0

### 2.6 Assumptions and Dependencies
- Users have internet connectivity
- MongoDB Atlas account available
- Google OAuth credentials available
- Payment gateway account available (for production)

## 3. System Features

### 3.1 Authentication & Authorization

#### 3.1.1 Email/Password Authentication
- **FR-AUTH-001**: System shall allow users to register with email and password
- **FR-AUTH-002**: System shall validate email format and password strength
- **FR-AUTH-003**: System shall hash passwords using bcrypt (salt rounds: 10)
- **FR-AUTH-004**: System shall issue JWT access token (15min expiry) and refresh token (7 days expiry)
- **FR-AUTH-005**: System shall store refresh tokens in HttpOnly cookies
- **FR-AUTH-006**: System shall allow password reset via email

#### 3.1.2 Google OAuth Authentication
- **FR-AUTH-007**: System shall support Google OAuth 2.0 login
- **FR-AUTH-008**: System shall create user account with CLIENT role on first Google login
- **FR-AUTH-009**: System shall link existing accounts if email matches
- **FR-AUTH-010**: System shall handle OAuth callback and token exchange

#### 3.1.3 Role-Based Access Control
- **FR-AUTH-011**: System shall enforce RBAC on all protected routes
- **FR-AUTH-012**: System shall prevent Admin role creation via signup
- **FR-AUTH-013**: System shall allow Admin to assign Developer role
- **FR-AUTH-014**: System shall restrict access based on user role

### 3.2 User Management

#### 3.2.1 User Registration
- **FR-USER-001**: System shall allow Client registration via email/password
- **FR-USER-002**: System shall allow Client registration via Google OAuth
- **FR-USER-003**: System shall validate unique email addresses
- **FR-USER-004**: System shall send welcome email upon registration

#### 3.2.2 User Profile
- **FR-USER-005**: Users shall view their profile
- **FR-USER-006**: Users shall update their profile (name, phone, avatar)
- **FR-USER-007**: Users shall change password (authenticated users)
- **FR-USER-008**: Admin shall view all user profiles
- **FR-USER-009**: Admin shall update user roles

### 3.3 Service Management

#### 3.3.1 Service Catalog
- **FR-SVC-001**: System shall display available services (App Dev, Web Dev, Branding)
- **FR-SVC-002**: Clients shall view service details
- **FR-SVC-003**: System shall allow Admin to manage service catalog

#### 3.3.2 Service Requests
- **FR-SVC-004**: Clients shall create service requests
- **FR-SVC-005**: Clients shall specify service type and requirements
- **FR-SVC-006**: Admin shall assign Developers to service requests
- **FR-SVC-007**: System shall track request status (Pending, In Progress, Completed, Cancelled)
- **FR-SVC-008**: Clients and Developers shall view assigned requests

### 3.4 Project Management

#### 3.4.1 Project Creation
- **FR-PROJ-001**: System shall create projects from approved service requests
- **FR-PROJ-002**: Admin shall assign Developers to projects
- **FR-PROJ-003**: Projects shall have status (Planning, In Progress, Review, Completed)

#### 3.4.2 Project Collaboration
- **FR-PROJ-004**: Clients and Developers shall view project details
- **FR-PROJ-005**: Developers shall update project status
- **FR-PROJ-006**: Users shall upload files to projects
- **FR-PROJ-007**: Users shall download project files
- **FR-PROJ-008**: System shall maintain project activity log

### 3.5 Payment Processing

#### 3.5.1 Payment Initiation
- **FR-PAY-001**: Clients shall initiate payments for services
- **FR-PAY-002**: System shall integrate with payment gateway (Stripe)
- **FR-PAY-003**: System shall generate invoices
- **FR-PAY-004**: System shall track payment status

#### 3.5.2 Payment History
- **FR-PAY-005**: Clients shall view payment history
- **FR-PAY-006**: Admin shall view all payments
- **FR-PAY-007**: System shall send payment confirmation emails

### 3.6 Messaging

#### 3.6.1 Communication
- **FR-MSG-001**: Users shall send messages within projects
- **FR-MSG-002**: System shall support real-time messaging (future enhancement)
- **FR-MSG-003**: Users shall receive notifications for new messages
- **FR-MSG-004**: System shall maintain message history

### 3.7 Administration

#### 3.7.1 User Management
- **FR-ADMIN-001**: Admin shall view all users
- **FR-ADMIN-002**: Admin shall assign Developer role
- **FR-ADMIN-003**: Admin shall deactivate users
- **FR-ADMIN-004**: Admin shall view audit logs

#### 3.7.2 System Management
- **FR-ADMIN-005**: Admin shall manage service catalog
- **FR-ADMIN-006**: Admin shall view system statistics
- **FR-ADMIN-007**: Admin shall configure system settings

## 4. Non-Functional Requirements

### 4.1 Performance
- **NFR-PERF-001**: API response time < 200ms (95th percentile)
- **NFR-PERF-002**: Page load time < 2 seconds
- **NFR-PERF-003**: Support 1000+ concurrent users
- **NFR-PERF-004**: Database queries optimized with indexes

### 4.2 Security
- **NFR-SEC-001**: All data transmitted over HTTPS
- **NFR-SEC-002**: Passwords hashed with bcrypt
- **NFR-SEC-003**: JWT tokens signed with strong secret
- **NFR-SEC-004**: Input validation and sanitization
- **NFR-SEC-005**: Protection against XSS, CSRF, SQL/NoSQL injection
- **NFR-SEC-006**: Rate limiting on authentication endpoints
- **NFR-SEC-007**: Security headers (CSP, HSTS, X-Frame-Options)
- **NFR-SEC-008**: Audit logging for sensitive operations

### 4.3 Usability
- **NFR-USE-001**: Responsive design (mobile, tablet, desktop)
- **NFR-USE-002**: Intuitive navigation
- **NFR-USE-003**: Accessible UI (WCAG 2.1 AA compliance)
- **NFR-USE-004**: Clear error messages

### 4.4 Reliability
- **NFR-REL-001**: System uptime 99.9%
- **NFR-REL-002**: Graceful error handling
- **NFR-REL-003**: Database backup and recovery
- **NFR-REL-004**: Transaction rollback on failures

### 4.5 Scalability
- **NFR-SCAL-001**: Horizontal scaling support
- **NFR-SCAL-002**: Stateless API design
- **NFR-SCAL-003**: Database sharding ready
- **NFR-SCAL-004**: CDN for static assets

### 4.6 Maintainability
- **NFR-MAIN-001**: Modular code structure
- **NFR-MAIN-002**: Comprehensive documentation
- **NFR-MAIN-003**: Code comments and JSDoc
- **NFR-MAIN-004**: Version control (Git)

## 5. Security Requirements

### 5.1 Authentication Security
- Strong password policy (min 8 chars, uppercase, lowercase, number)
- Account lockout after 5 failed login attempts
- Session timeout after 30 minutes of inactivity
- Refresh token rotation

### 5.2 Authorization Security
- Principle of least privilege
- Role-based access control enforcement
- Admin routes protected with additional verification
- API endpoint authorization checks

### 5.3 Data Security
- Encryption at rest (MongoDB Atlas)
- Encryption in transit (HTTPS/TLS)
- PII data protection
- Secure file upload validation

### 5.4 Application Security
- OWASP Top 10 mitigation
- Input validation and sanitization
- Output encoding
- Secure headers configuration
- CORS policy enforcement

## 6. Constraints

### 6.1 Technical Constraints
- Must use MERN stack
- Must support Node.js 18+
- Must use MongoDB Atlas
- Must support modern browsers

### 6.2 Business Constraints
- Budget for cloud services
- Third-party service dependencies (Google, Stripe, AWS)

### 6.3 Regulatory Constraints
- GDPR compliance (if applicable)
- Data privacy regulations
- Payment card industry (PCI) compliance for payments

## 7. Assumptions and Dependencies

### 7.1 Assumptions
- Users have stable internet connection
- Users have modern web browsers
- Cloud service providers maintain uptime
- Third-party APIs remain available

### 7.2 Dependencies
- MongoDB Atlas account
- Google OAuth credentials
- Payment gateway account (Stripe)
- Cloud storage (AWS S3) for file uploads
- Email service (SendGrid/AWS SES) for notifications

