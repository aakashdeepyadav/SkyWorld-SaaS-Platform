# API Documentation

Base URL: `http://localhost:5000/api` (Development)  
Production: `https://api.skyworld.com/api`

All endpoints require authentication except where noted. Authentication is done via HttpOnly cookies containing JWT tokens.

## Authentication

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "client"
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

### Google OAuth
```http
POST /api/auth/google
Content-Type: application/json

{
  "code": "google_oauth_code"
}
```

### Get Current User
```http
GET /api/auth/me
```

### Logout
```http
POST /api/auth/logout
```

### Refresh Token
```http
POST /api/auth/refresh
```

## Users

### Get All Users (Admin)
```http
GET /api/users?role=client&isActive=true&page=1&limit=10
```

### Get User by ID
```http
GET /api/users/:id
```

### Get My Profile
```http
GET /api/users/profile/me
```

### Update My Profile
```http
PUT /api/users/profile/me
Content-Type: application/json

{
  "name": "John Doe",
  "phone": "+1234567890",
  "avatar": "https://..."
}
```

### Update User Role (Admin)
```http
PUT /api/users/:id/role
Content-Type: application/json

{
  "role": "developer"
}
```

### Update User Status (Admin)
```http
PUT /api/users/:id/status
Content-Type: application/json

{
  "isActive": false
}
```

## Services

### Get All Services
```http
GET /api/services?category=app-development&isActive=true
```

### Get Service by ID
```http
GET /api/services/:id
```

### Create Service (Admin)
```http
POST /api/services
Content-Type: application/json

{
  "name": "Mobile App Development",
  "description": "Full-stack mobile app development",
  "category": "app-development",
  "basePrice": 5000
}
```

### Update Service (Admin)
```http
PUT /api/services/:id
```

### Delete Service (Admin)
```http
DELETE /api/services/:id
```

## Service Requests

### Get Service Requests
```http
GET /api/requests?status=pending&page=1&limit=10
```

### Get Request by ID
```http
GET /api/requests/:id
```

### Create Service Request (Client)
```http
POST /api/requests
Content-Type: application/json

{
  "serviceId": "...",
  "title": "E-commerce Mobile App",
  "description": "Need a mobile app for my online store",
  "requirements": "iOS and Android support"
}
```

### Assign Developer (Admin)
```http
PUT /api/requests/:id/assign
Content-Type: application/json

{
  "developerId": "...",
  "estimatedPrice": 8000
}
```

### Update Request Status
```http
PUT /api/requests/:id/status
Content-Type: application/json

{
  "status": "approved"
}
```

## Projects

### Get Projects
```http
GET /api/projects?status=in-progress&page=1&limit=10
```

### Get Project by ID
```http
GET /api/projects/:id
```

### Create Project (Admin)
```http
POST /api/projects
Content-Type: application/json

{
  "serviceRequestId": "...",
  "developerIds": ["..."],
  "startDate": "2024-01-10",
  "endDate": "2024-03-10",
  "budget": 8000
}
```

### Update Project
```http
PUT /api/projects/:id
Content-Type: application/json

{
  "status": "in-progress",
  "progress": 45,
  "milestones": [...]
}
```

## Payments

### Get Payments
```http
GET /api/payments?status=completed&page=1&limit=10
```

### Get Payment by ID
```http
GET /api/payments/:id
```

### Create Payment (Client)
```http
POST /api/payments
Content-Type: application/json

{
  "projectId": "...",
  "serviceRequestId": "...",
  "amount": 4000,
  "paymentMethod": "card"
}
```

### Update Payment Status (Admin)
```http
PUT /api/payments/:id/status
Content-Type: application/json

{
  "status": "completed",
  "transactionId": "txn_123",
  "stripePaymentIntentId": "pi_123"
}
```

## Messages

### Get Messages
```http
GET /api/messages?projectId=...&page=1&limit=50
```

### Create Message
```http
POST /api/messages
Content-Type: application/json

{
  "projectId": "...",
  "content": "Can we schedule a meeting?",
  "recipientId": "...",
  "attachments": []
}
```

### Mark Message as Read
```http
PUT /api/messages/:id/read
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [] // For validation errors
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

