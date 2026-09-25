# LeadGen Repository Audit Report

## Stack Overview
- **Frontend Framework**: React 19, built with Vite.
- **Backend Framework**: Node.js with Express 5.2.1.
- **Database**: MongoDB (using Mongoose 9.1.2).
- **Authentication Mechanism**: JWT (JSON Web Tokens) with `jsonwebtoken` and `bcryptjs`.
- **Routing Architecture**: Express standard routing (`src/routes/*` prefix `/api/`).
- **Middleware**: `cors`, `compression`, custom `auth.js`, `admin.js`.
- **Models/Schemas**: `Activity`, `AuditLog`, `Category`, `Contact`, `Project`, `ProjectContact`, `ProspectContact`, `User`.
- **External APIs**: Groq, OpenAI, Google APIs, likely a LinkedIn integration.
- **Docker Configuration**: `Dockerfile` in both frontend and backend, `docker-compose.yml` and `docker-compose.prod.yml` in root.
- **Nginx Configuration**: `nginx.conf` present in frontend directory.
- **CI/CD**: Contains `.github` directory indicating GitHub Actions.
- **Environment Variables**: Managed via `.env` and `dotenv`.
- **Build System**: Vite for frontend.

## Major Components
- **Frontend**: Pages like `ProjectDetail.jsx`, `ProspectDashboard.jsx`, etc.
- **Backend**: Routes including `projects.js`, `activities.js`, `auth.js`, `master-dashboard.js`, `ai.js`, `company-analysis.js`.

## Areas of Focus for Remediation
1. **Security & Authorization**: CORS configuration, password reset token flow, JWT secret management, enforcing account status, protecting AI/LinkedIn routes.
2. **Data Isolation**: Securing project/contact access based on `createdBy` and `teamMembers`, distinguishing `ProjectContact` vs `ProspectContact`.
3. **Performance**: Bulk import optimizations (replacing N+1 queries with bulk operations), database indexing, frontend pagination/rendering.
4. **Validation & Error Handling**: Adding request validation (missing Zod/Joi, should add or use existing if any), centralized error handling.
5. **Code Quality**: Removing unused imports, fixing useEffect issues, removing generated build artifacts.
