# Database Design

## Collections Overview

1. **users** - User accounts and authentication
2. **services** - Service catalog
3. **projects** - Project management
4. **serviceRequests** - Service requests from clients
5. **payments** - Payment transactions
6. **messages** - User messages
7. **files** - File uploads metadata
8. **auditLogs** - System audit trail

## Collection Schemas

### 1. Users Collection

```javascript
{
  _id: ObjectId,
  email: String (unique, required, indexed),
  password: String (hashed, required for email/password users),
  googleId: String (unique, sparse, indexed),
  name: String (required),
  phone: String,
  avatar: String (URL),
  role: String (enum: ['admin', 'developer', 'client'], default: 'client', indexed),
  isActive: Boolean (default: true, indexed),
  emailVerified: Boolean (default: false),
  lastLogin: Date,
  createdAt: Date (indexed),
  updatedAt: Date
}
```

**Indexes:**
- `email`: unique
- `googleId`: unique, sparse
- `role`: for role-based queries
- `isActive`: for filtering active users
- `createdAt`: for sorting

**Sample Document:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "client@example.com",
  "password": "$2b$10$...",
  "name": "John Doe",
  "phone": "+1234567890",
  "avatar": "https://example.com/avatar.jpg",
  "role": "client",
  "isActive": true,
  "emailVerified": true,
  "lastLogin": "2024-01-15T10:30:00Z",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### 2. Services Collection

```javascript
{
  _id: ObjectId,
  name: String (required, unique),
  description: String,
  category: String (enum: ['app-development', 'web-development', 'branding-creative'], required, indexed),
  basePrice: Number,
  isActive: Boolean (default: true, indexed),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `name`: unique
- `category`: for filtering by service type
- `isActive`: for filtering active services

**Sample Document:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Mobile App Development",
  "description": "Full-stack mobile application development",
  "category": "app-development",
  "basePrice": 5000,
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

### 3. Service Requests Collection

```javascript
{
  _id: ObjectId,
  clientId: ObjectId (ref: 'User', required, indexed),
  serviceId: ObjectId (ref: 'Service', required, indexed),
  title: String (required),
  description: String (required),
  requirements: String,
  status: String (enum: ['pending', 'approved', 'in-progress', 'completed', 'cancelled'], default: 'pending', indexed),
  assignedDeveloperId: ObjectId (ref: 'User', sparse, indexed),
  estimatedPrice: Number,
  approvedAt: Date,
  completedAt: Date,
  createdAt: Date (indexed),
  updatedAt: Date
}
```

**Indexes:**
- `clientId`: for client queries
- `serviceId`: for service filtering
- `status`: for status filtering
- `assignedDeveloperId`: for developer queries
- `createdAt`: for sorting

**Sample Document:**
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "clientId": "507f1f77bcf86cd799439011",
  "serviceId": "507f1f77bcf86cd799439012",
  "title": "E-commerce Mobile App",
  "description": "Need a mobile app for my online store",
  "requirements": "iOS and Android support, payment integration",
  "status": "in-progress",
  "assignedDeveloperId": "507f1f77bcf86cd799439014",
  "estimatedPrice": 8000,
  "approvedAt": "2024-01-10T00:00:00Z",
  "createdAt": "2024-01-05T00:00:00Z",
  "updatedAt": "2024-01-10T00:00:00Z"
}
```

### 4. Projects Collection

```javascript
{
  _id: ObjectId,
  serviceRequestId: ObjectId (ref: 'ServiceRequest', required, indexed),
  title: String (required),
  description: String,
  clientId: ObjectId (ref: 'User', required, indexed),
  developerIds: [ObjectId] (ref: 'User', indexed),
  status: String (enum: ['planning', 'in-progress', 'review', 'completed', 'cancelled'], default: 'planning', indexed),
  startDate: Date,
  endDate: Date,
  budget: Number,
  progress: Number (0-100, default: 0),
  milestones: [{
    title: String,
    description: String,
    dueDate: Date,
    completed: Boolean,
    completedAt: Date
  }],
  createdAt: Date (indexed),
  updatedAt: Date
}
```

**Indexes:**
- `serviceRequestId`: unique, for linking
- `clientId`: for client queries
- `developerIds`: for developer queries
- `status`: for status filtering
- `createdAt`: for sorting

**Sample Document:**
```json
{
  "_id": "507f1f77bcf86cd799439015",
  "serviceRequestId": "507f1f77bcf86cd799439013",
  "title": "E-commerce Mobile App",
  "description": "Development of e-commerce mobile application",
  "clientId": "507f1f77bcf86cd799439011",
  "developerIds": ["507f1f77bcf86cd799439014"],
  "status": "in-progress",
  "startDate": "2024-01-10T00:00:00Z",
  "endDate": "2024-03-10T00:00:00Z",
  "budget": 8000,
  "progress": 45,
  "milestones": [
    {
      "title": "UI Design",
      "description": "Complete UI/UX design",
      "dueDate": "2024-01-25T00:00:00Z",
      "completed": true,
      "completedAt": "2024-01-24T00:00:00Z"
    }
  ],
  "createdAt": "2024-01-10T00:00:00Z",
  "updatedAt": "2024-01-20T00:00:00Z"
}
```

### 5. Payments Collection

```javascript
{
  _id: ObjectId,
  clientId: ObjectId (ref: 'User', required, indexed),
  projectId: ObjectId (ref: 'Project', indexed),
  serviceRequestId: ObjectId (ref: 'ServiceRequest', indexed),
  amount: Number (required),
  currency: String (default: 'USD'),
  status: String (enum: ['pending', 'processing', 'completed', 'failed', 'refunded'], default: 'pending', indexed),
  paymentMethod: String,
  transactionId: String (unique, sparse),
  stripePaymentIntentId: String,
  invoiceNumber: String (unique),
  paidAt: Date,
  createdAt: Date (indexed),
  updatedAt: Date
}
```

**Indexes:**
- `clientId`: for client payment history
- `projectId`: for project payments
- `status`: for status filtering
- `transactionId`: unique, sparse
- `invoiceNumber`: unique
- `createdAt`: for sorting

**Sample Document:**
```json
{
  "_id": "507f1f77bcf86cd799439016",
  "clientId": "507f1f77bcf86cd799439011",
  "projectId": "507f1f77bcf86cd799439015",
  "serviceRequestId": "507f1f77bcf86cd799439013",
  "amount": 4000,
  "currency": "USD",
  "status": "completed",
  "paymentMethod": "card",
  "transactionId": "txn_1234567890",
  "stripePaymentIntentId": "pi_1234567890",
  "invoiceNumber": "INV-2024-001",
  "paidAt": "2024-01-15T00:00:00Z",
  "createdAt": "2024-01-15T00:00:00Z",
  "updatedAt": "2024-01-15T00:00:00Z"
}
```

### 6. Messages Collection

```javascript
{
  _id: ObjectId,
  projectId: ObjectId (ref: 'Project', required, indexed),
  senderId: ObjectId (ref: 'User', required, indexed),
  recipientId: ObjectId (ref: 'User', indexed),
  content: String (required),
  attachments: [{
    fileId: ObjectId (ref: 'File'),
    fileName: String,
    fileUrl: String
  }],
  isRead: Boolean (default: false, indexed),
  readAt: Date,
  createdAt: Date (indexed),
  updatedAt: Date
}
```

**Indexes:**
- `projectId`: for project messages
- `senderId`: for sender queries
- `recipientId`: for recipient queries
- `isRead`: for unread message filtering
- `createdAt`: for sorting

**Sample Document:**
```json
{
  "_id": "507f1f77bcf86cd799439017",
  "projectId": "507f1f77bcf86cd799439015",
  "senderId": "507f1f77bcf86cd799439011",
  "recipientId": "507f1f77bcf86cd799439014",
  "content": "Can we schedule a meeting to discuss the UI changes?",
  "attachments": [],
  "isRead": false,
  "createdAt": "2024-01-20T10:00:00Z",
  "updatedAt": "2024-01-20T10:00:00Z"
}
```

### 7. Files Collection

```javascript
{
  _id: ObjectId,
  projectId: ObjectId (ref: 'Project', indexed),
  uploadedBy: ObjectId (ref: 'User', required, indexed),
  fileName: String (required),
  originalName: String (required),
  fileType: String (required),
  fileSize: Number (required),
  fileUrl: String (required),
  storageProvider: String (enum: ['s3', 'local'], default: 's3'),
  mimeType: String,
  isPublic: Boolean (default: false),
  createdAt: Date (indexed),
  updatedAt: Date
}
```

**Indexes:**
- `projectId`: for project files
- `uploadedBy`: for user uploads
- `createdAt`: for sorting

**Sample Document:**
```json
{
  "_id": "507f1f77bcf86cd799439018",
  "projectId": "507f1f77bcf86cd799439015",
  "uploadedBy": "507f1f77bcf86cd799439014",
  "fileName": "design-mockup-v1.png",
  "originalName": "Design Mockup v1.png",
  "fileType": "image",
  "fileSize": 2048576,
  "fileUrl": "https://s3.amazonaws.com/bucket/design-mockup-v1.png",
  "storageProvider": "s3",
  "mimeType": "image/png",
  "isPublic": false,
  "createdAt": "2024-01-18T00:00:00Z",
  "updatedAt": "2024-01-18T00:00:00Z"
}
```

### 8. Audit Logs Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', indexed),
  action: String (required, indexed),
  resource: String (required),
  resourceId: ObjectId,
  details: Object,
  ipAddress: String,
  userAgent: String,
  timestamp: Date (required, indexed)
}
```

**Indexes:**
- `userId`: for user activity
- `action`: for action filtering
- `timestamp`: for time-based queries
- Compound: `{userId: 1, timestamp: -1}` for user activity timeline

**Sample Document:**
```json
{
  "_id": "507f1f77bcf86cd799439019",
  "userId": "507f1f77bcf86cd799439011",
  "action": "login",
  "resource": "auth",
  "resourceId": null,
  "details": {
    "method": "email",
    "success": true
  },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Relationships

```
Users (1) ──< (many) ServiceRequests (clientId)
Users (1) ──< (many) ServiceRequests (assignedDeveloperId)
Users (1) ──< (many) Projects (clientId)
Users (many) ──< (many) Projects (developerIds)
ServiceRequests (1) ──< (1) Projects (serviceRequestId)
Projects (1) ──< (many) Messages (projectId)
Projects (1) ──< (many) Files (projectId)
Projects (1) ──< (many) Payments (projectId)
Users (1) ──< (many) Payments (clientId)
Users (1) ──< (many) Messages (senderId/recipientId)
Users (1) ──< (many) AuditLogs (userId)
```

## Indexing Strategy

### Primary Indexes
- All `_id` fields (automatic)
- Foreign key fields (for joins)
- Status fields (for filtering)
- Date fields (for sorting)

### Compound Indexes
- `{userId: 1, timestamp: -1}` on AuditLogs
- `{projectId: 1, createdAt: -1}` on Messages
- `{clientId: 1, status: 1}` on ServiceRequests

### Text Indexes
- `{title: 'text', description: 'text'}` on Projects (for search)

## Data Validation Rules

1. **Email**: Must be valid email format, unique
2. **Password**: Min 8 chars, must contain uppercase, lowercase, number
3. **Role**: Must be one of: admin, developer, client
4. **Status**: Must match enum values for each collection
5. **Amounts**: Must be positive numbers
6. **Dates**: Must be valid ISO dates
7. **ObjectIds**: Must be valid MongoDB ObjectIds

## Data Migration Considerations

- User passwords must be hashed before storage
- Google OAuth users may not have passwords
- Soft deletes: Use `isActive` flag instead of hard deletes
- Audit logs should never be deleted (archive old logs)

