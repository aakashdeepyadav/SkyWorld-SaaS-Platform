# SkyWorld SaaS Platform

A production-grade SaaS platform built with the MERN stack, providing App Development, Web Development, and Branding & Creative services.

## 🏗️ Architecture

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT + Google OAuth 2.0
- **Deployment**: Vercel (Frontend) + Render (Backend)
- **Storage**: Cloudinary (Images/Files)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account
- Google OAuth credentials

### Installation

```bash
# Install all dependencies
npm run install-all

# Set up environment variables (see .env.example files)
# server/.env
# client/.env

# Run development servers
npm run dev
```

### Environment Setup

1. **Backend** (`server/.env`):
   - MongoDB connection string
   - JWT secrets
   - Google OAuth credentials
   - Server port

2. **Frontend** (`client/.env`):
   - API base URL
   - Google OAuth client ID

## 📁 Project Structure

```
SkyWorld/
├── server/          # Backend (Node.js + Express)
├── client/          # Frontend (React + Vite)
├── docs/            # Documentation
└── README.md
```

## 🔐 User Roles

- **Admin**: Full system access (manually assigned)
- **Developer**: Service provider (assigned by admin)
- **Client**: Default role (signup)

## 📚 Documentation

- [System Architecture](./docs/ARCHITECTURE.md)
- [SRS Document](./docs/SRS.md)
- [API Documentation](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

- [User Manuals](./docs/USER_MANUAL.md)

## 🛡️ Security

- OWASP Top-10 compliant
- JWT with HttpOnly cookies
- Role-based access control (RBAC)
- Rate limiting
- Input validation & sanitization

## 📄 License

MIT

