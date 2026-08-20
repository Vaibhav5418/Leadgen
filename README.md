# 🚀 LeadGen — Enterprise Outbound Lead Generation & RBAC Management Platform

An enterprise-grade B2B outbound campaign management platform designed to orchestrate multi-channel outreach (LinkedIn, Cold Calling, Email), track prospect pipelines, analyze team performance, and enforce role-based access control (RBAC).

---

## 📑 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Project Structure](#project-structure)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Scripts & Utilities](#scripts--utilities)
- [License](#license)

---

## 🌟 Overview

**LeadGen** provides a single centralized workspace for lead generation teams, sales development representatives (SDRs), campaign managers, and administrators to:
- Monitor holistic outbound performance across all client campaigns.
- Ingest, enrich, and transition prospects through a comprehensive pipeline.
- Log multi-channel touchpoints with real-time analytics.
- Authorize and govern employee access to client projects via an enterprise **Admin Panel**.

---

## ✨ Key Features

### 1. 📊 Master & Executive Dashboard
- **Real-Time KPIs**: Total prospects, leads added daily/weekly, touched prospects, meetings booked, and won deals.
- **Channel Efficiency Analysis**: Real-time conversion tracking for LinkedIn (acceptance & reply rate), Cold Calling (connect rate & meetings), and Email (open, bounce & reply rate).
- **Team Leaderboard & Activity Velocity**: SDR performance rankings and channel contribution comparisons.
- **Data Quality & SLA Compliance**: Automated contact health auditing (valid email/phone percentages) and follow-up SLA monitoring.

### 2. 📁 Project & Campaign Management
- Manage multiple client campaigns with custom Ideal Customer Profiles (ICPs), target industries, company sizes, and geography.
- Allocate and manage dedicated team members per project.
- Visual progress bars and milestone tracking.

### 3. 👥 Prospect Pipeline & Contact Management
- Bulk import prospects via Excel (`.xlsx`) or CSV (`.csv`).
- Comprehensive pipeline stages: `Cold` ➔ `Engaged` ➔ `Meeting Proposed` ➔ `Meeting Scheduled` ➔ `Meeting Completed` ➔ `SQL` ➔ `Won` / `Lost`.
- Multi-channel touchpoint logging (LinkedIn Connect/Message, Phone Call, Cold Email, Notes).

### 4. 📈 Multi-Channel Funnel Reports & Exporting
- Dedicated channel funnel reporting for **LinkedIn**, **Cold Calling**, and **Email**.
- Interactive charts powered by Chart.js.
- One-click export to styled Excel sheets and PDF reports.

### 5. 🛡️ Enterprise Admin Panel & Access Governance
- **Role-Based Access Control (RBAC)**: Supports `Admin`, `Manager`, and `Employee` tiers.
- **Employee Directory**: Search users by name, email, or employee ID; filter by role and status (`active`, `inactive`, `suspended`).
- **Project Access Allocation**: Assign or revoke project permissions for team members individually or in bulk.
- **Change Role Modal**: Guided role updates with caution warnings and self-demotion prevention.
- **Roles & Permissions Matrix**: Visual reference of capabilities across administrative, project, and analytics modules.
- **Audit Trail & Activity Log**: Timestamped, searchable audit logs capturing all role changes, project allocations, and user status updates with previous vs. new diff summaries.

---

## 🛠️ Architecture & Tech Stack

```mermaid
graph TD
    Client[React + Vite Frontend (SPA)] -->|REST API / Axios| Express[Express 5.x Backend]
    Express -->|Authentication & RBAC| Middleware[JWT & Admin Middleware]
    Middleware -->|Queries & Updates| Mongo[(MongoDB Database / Mongoose)]
    Express -->|AI / LLM Services| GroqOpenAI[Groq / OpenAI SDK]
```

### Frontend
- **Framework**: React 19, Vite
- **Routing**: React Router DOM 7
- **Styling**: Tailwind CSS, Vanilla CSS
- **Visualizations**: Chart.js, `react-chartjs-2`
- **Exports**: `xlsx`, `xlsx-js-style`, `jspdf`, `jspdf-autotable`
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js, Express 5.x
- **Database**: MongoDB with Mongoose 9.x
- **Security & Auth**: JWT (JSON Web Tokens), `bcryptjs`, CORS, Helmet
- **Validation**: Joi
- **File Uploads & Parsing**: Multer, `csv-parser`, `xlsx`
- **Schedulers**: `node-cron`
- **AI Integrations**: Groq SDK, OpenAI SDK

---

## 📂 Project Structure

```
LeadGen/
├── README.md
├── leadgen-backend/
│   ├── package.json
│   ├── server.js               # Entry point
│   ├── set-admin.js            # CLI utility to grant admin role
│   └── src/
│       ├── app.js              # Express app configuration & middleware
│       ├── config/             # Database connection & env config
│       ├── middleware/         # Auth, RBAC & error handling
│       │   ├── auth.js         # JWT authentication guard
│       │   └── admin.js        # requireAdmin & requireRole middleware
│       ├── models/             # Mongoose schemas
│       │   ├── User.js         # User model with role & assignedProjects
│       │   ├── Project.js      # Project model with team members
│       │   ├── Prospect.js     # Prospect & contact pipeline
│       │   ├── Activity.js     # Touchpoint logging
│       │   └── AuditLog.js     # Administrative audit trail
│       └── routes/             # Express API route modules
│           ├── admin.js        # Admin panel & RBAC endpoints
│           ├── auth.js         # Register, login, me
│           ├── projects.js     # Projects CRUD & dashboards
│           ├── prospects.js    # Prospects CRUD & pipeline
│           ├── activities.js   # Touchpoint logging
│           └── reports.js      # Funnel & performance reports
│
└── leadgen-frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── App.jsx             # Route definitions & router setup
        ├── api/                # Axios instance & interceptors
        ├── components/         # Shared UI components
        │   ├── Layout.jsx      # Navigation bar & layout wrapper
        │   ├── Sidebar.jsx     # App sidebar navigation with Admin badge
        │   └── AdminRoute.jsx  # Admin-only client route guard & 403 screen
        └── pages/              # Application views
            ├── AdminPanel.jsx  # Enterprise Admin Control Center
            ├── MasterDashboard.jsx # Global analytics
            ├── Projects.jsx    # Projects listing & creation
            ├── ProjectDashboard.jsx
            ├── ProspectDashboard.jsx
            ├── EmployeePerformance.jsx
            ├── Login.jsx       # Auth login screen
            └── Report.jsx      # Funnel & export reports
```

---

## 🔒 Role-Based Access Control (RBAC)

| Platform Capability | Administrator (`admin`) | Manager (`manager`) | Employee (`employee`) |
|---|:---:|:---:|:---:|
| **Admin Panel Access** | ✅ Full Access | ❌ Denied | ❌ Denied |
| **Manage Roles & Assign Permissions** | ✅ Full Control | ❌ Denied | ❌ Denied |
| **View Audit Trail Logs** | ✅ Full Access | ❌ Denied | ❌ Denied |
| **Project Access** | ✅ All Projects | ✅ All Projects | 🔒 Assigned Projects Only |
| **Master Analytics Dashboard** | ✅ Full Access | ✅ Full Access | ✅ Full Access |
| **Employee Performance Analytics** | ✅ All Team Members | ✅ All Team Members | 🔒 Self & Assigned |
| **Log Prospect Touchpoints** | ✅ Global | ✅ Global | ✅ Assigned Projects |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **MongoDB**: Local MongoDB instance or MongoDB Atlas URI

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd leadgen-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env` (refer to [Environment Variables](#environment-variables)).

4. Start the backend server:
   ```bash
   # Development mode with nodemon
   npm run dev

   # Production mode
   npm start
   ```
   Backend will start on `http://localhost:5000`.

5. *(Optional)* Grant Administrator role to an account:
   ```bash
   node set-admin.js <email>
   ```

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd leadgen-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Frontend will open at `http://localhost:5173`.

4. Build for production:
   ```bash
   npm run build
   ```

---

## 🔑 Environment Variables

### Backend (`leadgen-backend/.env`)

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/leadgen
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d

# AI API Keys (Optional)
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key
```

### Frontend (`leadgen-frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📡 API Reference

### Administrative Routes (`/api/admin`)
*(Protected with `requireAdmin`)*

- `GET /api/admin/dashboard` — Overview statistics, role counts, recent changes.
- `GET /api/admin/employees` — Search, filter, and paginate employee directory.
- `GET /api/admin/employees/:id` — Employee profile, assigned projects, and user audit logs.
- `PUT /api/admin/employees/:id/role` — Update employee role (`admin`, `manager`, `employee`).
- `PUT /api/admin/employees/:id/status` — Update account status (`active`, `inactive`, `suspended`).
- `POST /api/admin/employees/:id/assign-projects` — Bulk assign projects to employee.
- `POST /api/admin/employees/:id/remove-project` — Unassign a project from employee.
- `GET /api/admin/projects` — List projects with resolved assigned team members.
- `POST /api/admin/projects/:id/members` — Add members to a project.
- `DELETE /api/admin/projects/:id/members/:email` — Remove member from project.
- `GET /api/admin/audit-logs` — Filtered, searchable, paginated audit trail logs.
- `GET /api/admin/permissions-matrix` — Matrix capability reference.

### Authentication Routes (`/api/auth`)
- `POST /api/auth/register` — Register a new account.
- `POST /api/auth/login` — Login with credentials and receive JWT.
- `GET /api/auth/me` — Retrieve current authenticated profile and permissions.

---

## 📜 Scripts & Utilities

| Command | Working Directory | Description |
|---|---|---|
| `npm run dev` | `leadgen-backend` | Starts Express server with hot-reload via nodemon |
| `node set-admin.js <email>` | `leadgen-backend` | Grants superuser `admin` role to the given email |
| `npm run dev` | `leadgen-frontend` | Starts Vite client dev server on `http://localhost:5173` |
| `npm run build` | `leadgen-frontend` | Builds production client assets to `dist/` |

---

## 📄 License

This project is proprietary and confidential. All rights reserved.
