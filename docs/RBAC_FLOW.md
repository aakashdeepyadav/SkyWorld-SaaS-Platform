# Role Rights and Flow

## Roles

- `admin`: platform operator
- `developer`: delivery team member
- `client`: buyer/customer

## Access Matrix

### Client

- Can:
  - Manage own profile and settings
  - Start starter-plan checkout (`/checkout`)
  - Create custom requests (`POST /api/custom-requests`)
  - View own requests, custom requests, projects, messages, files, and payments
- Cannot:
  - Create direct service requests with `POST /api/requests`
  - Assign developers
  - Update request status
  - Update projects directly
  - Access admin user/service/stats endpoints

### Developer

- Can:
  - Manage own profile and settings
  - View assigned requests and update assigned request status with limited transitions:
    - `approved -> in-progress`
    - `in-progress -> completed`
  - View assigned projects and update project `status`, `progress`, `milestones`
  - Access project messages/files where assigned
- Cannot:
  - Access payments list/details
  - Access custom requests list
  - Access admin endpoints
  - Update unassigned requests/projects

### Admin

- Can:
  - Full access to users, services, stats, requests, projects, payments
  - Change any user role (`client`, `developer`, `admin`)
  - Assign developers to requests
  - Update any request status
  - Manually create direct service requests (`POST /api/requests`)
  - Update any project
  - Quote/update custom requests

## Primary Flow

1. Client selects a service and goes to checkout.
2. Payment is created and verified by Razorpay.
3. Backend creates/attaches project records after successful verification.
4. Admin/developer run delivery workflow on request/project status.
5. Client tracks progress via requests/projects and communicates in project messages.

## Guarding Rules

- Enforce access at both route middleware and controller ownership checks.
- Keep frontend route guards/navigation aligned with backend RBAC so users do not see actions they cannot execute.
