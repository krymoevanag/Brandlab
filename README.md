<div align="center">

<img src="frontend_app/src/assets/logos/az-graphics.jpg" height="64" alt="A to Z Graphics" />
&nbsp;&nbsp;&nbsp;
<img src="frontend_app/src/assets/logos/az-cnc-services.jpg" height="64" alt="A to Z CNC Services" />

# A to Z Business & Production Management System

**A unified full-stack platform for A to Z Graphics — Branding & Gifts Shop and A to Z CNC Services.**  
Centralises customer management, job tracking, quotations, finance, expenses, production and reporting across the Nairobi (NBI) and Meru (MER) branches.

[![Django](https://img.shields.io/badge/Django-5.2-0C4B33?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/Django_REST_Framework-3.16-red)](https://www.django-rest-framework.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

</div>

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Prerequisites](#prerequisites)
6. [Backend Setup (Django)](#backend-setup-django)
7. [Frontend Setup (React + Vite)](#frontend-setup-react--vite)
8. [Environment Variables Reference](#environment-variables-reference)
9. [Database Setup (PostgreSQL)](#database-setup-postgresql)
10. [Running the Full Stack](#running-the-full-stack)
11. [API Documentation](#api-documentation)
12. [Demo Login Credentials](#demo-login-credentials)
13. [Module Overview](#module-overview)
14. [Role & Permissions Matrix](#role--permissions-matrix)
15. [Contributing](#contributing)

---

## System Overview

The **A to Z Business & Production Management System** (BPMS) is a multi-branch, multi-business-unit web application built for two closely related Kenyan businesses:

| Business | Domain | Accent Color |
|---|---|---|
| **A to Z Graphics — Branding & Gifts Shop** | Design, printing, signage, corporate gifts | Cyan `#08BCE5` |
| **A to Z CNC Services** | CNC cutting, precision machining, fabrication | Orange `#F7941D` |

Both businesses share a single platform, unified authentication, role-based access control (RBAC), and branch-level data scoping. The system currently supports the Nairobi Head Office (NBI) and Meru Regional Branch (MER).

**Currency:** KES (Kenyan Shilling)  
**Timezone:** Africa/Nairobi (EAT, UTC+3)

---

## Technology Stack

### Backend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | **Django** | 5.2 | Core web framework |
| REST API | **Django REST Framework** | 3.16 | RESTful API layer |
| Authentication | **djangorestframework-simplejwt** | 5.5 | JWT access + refresh tokens |
| API Schema | **drf-spectacular** | 0.30 | OpenAPI 3 / Swagger docs |
| CORS | **django-cors-headers** | 4.9 | Cross-origin request handling |
| Filtering | **django-filter** | 24.3 | Query-param filtering |
| Image handling | **Pillow** | 10.4 | Logo / media processing |
| Database ORM | **Django ORM** | — | Database abstraction |
| Database driver | **dj-database-url** | — | DATABASE_URL parsing |
| Config | **python-dotenv** | — | `.env` file loading |

### Database

| Technology | Purpose |
|---|---|
| **PostgreSQL 15+** | Primary production database |
| **SQLite 3** | Dev fallback (auto-used when `DATABASE_URL` is empty) |

### Frontend

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Framework | **React** | 19 | UI component framework |
| Language | **TypeScript** | 7 | Typed JavaScript |
| Build tool | **Vite** | 8 | Fast dev server + bundler |
| Styling | **Tailwind CSS** | 3 | Utility-first CSS |
| Icons | **Lucide React** | 1.59 | Consistent icon set |
| HTTP client | **Axios** | 1.20 | API communication |
| Server state | **TanStack Query** | 5 | Caching & async state |
| Linting | **oxlint** | 1.88 | Fast TypeScript/React linter |

### Typography (Google Fonts)

| Font | Usage |
|---|---|
| **Space Grotesk** | Page headings, dashboard totals, section titles |
| **Manrope** | Body text, forms, tables, navigation |
| **IBM Plex Mono** | Job refs, invoice numbers, transaction codes |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (React SPA)                  │
│              http://localhost:5173                      │
│                                                         │
│  ┌──────────┐  ┌────────────┐  ┌────────────────────┐  │
│  │  Login   │  │  Sidebar   │  │   Module Pages      │  │
│  │  (JWT)   │  │  + Header  │  │  Customers / Jobs   │  │
│  └──────────┘  └────────────┘  │  Quotations / Inv.  │  │
│                                │  Expenses / Reports  │  │
│                                │  Audit Logs         │  │
│                                └────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/JSON  Bearer JWT
                     ▼
┌─────────────────────────────────────────────────────────┐
│               Django REST Framework API                 │
│               http://localhost:8000/api/v1/             │
│                                                         │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │accounts │ │customers │ │quotation │ │   jobs    │  │
│  ├─────────┤ ├──────────┤ ├──────────┤ ├───────────┤  │
│  │branches │ │services  │ │ designs  │ │  finance  │  │
│  ├─────────┤ ├──────────┤ ├──────────┤ ├───────────┤  │
│  │  audit  │ │expenses  │ │   core   │ │           │  │
│  └─────────┘ └──────────┘ └──────────┘ └───────────┘  │
│                                                         │
│              JWT Auth · RBAC · Branch Scoping           │
└────────────────────┬────────────────────────────────────┘
                     │ Django ORM
                     ▼
         ┌───────────────────────┐
         │    PostgreSQL 15+     │
         │   az_business_db      │
         └───────────────────────┘
```

**Key architectural decisions:**

- **Append-only audit ledger** — all `CREATE`, `UPDATE`, `DELETE`, `APPROVE`, `REJECT` and status-change operations are logged to `apps.audit`.
- **Price snapshots** — quotation and job-item `unit_price` / `description` fields are snapshotted at creation time so historical records are unaffected by catalogue changes.
- **Decimal-safe finance** — all monetary fields use `DecimalField(max_digits=12, decimal_places=2)`; totals are always authoritative from the backend.
- **Branch scoping** — every business record carries a `branch` FK enforced at the serializer / queryset layer, not just the UI.
- **JWT auth** — 60-minute access tokens, 7-day rotating refresh tokens, `Bearer` scheme.

---

## Project Structure

```
Brandlab/
├── backend/                          # Django project
│   ├── config/
│   │   ├── settings.py               # Central settings (env-driven)
│   │   ├── urls.py                   # Root URL config + DRF router
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── apps/
│   │   ├── core/                     # Abstract base models, pagination, permissions, exceptions
│   │   ├── accounts/                 # Custom User model, Role model, JWT views
│   │   ├── branches/                 # Branch model (NBI / MER)
│   │   ├── audit/                    # AuditLog append-only model + utils
│   │   ├── customers/                # Customer CRM
│   │   ├── services/                 # Service catalogue (ServiceCategory + Service)
│   │   ├── quotations/               # Quotation + QuotationItem
│   │   ├── jobs/                     # Job + JobItem + JobStatusHistory
│   │   ├── designs/                  # DesignAssignment (artwork proofing)
│   │   ├── finance/                  # Invoice + Payment + Receipt
│   │   └── expenses/                 # Expense + approval workflow
│   ├── .env                          # Local secrets (git-ignored)
│   ├── .env.example                  # Template — copy to .env
│   ├── requirements.txt              # Python dependencies
│   └── manage.py
│
├── frontend_app/                     # React + Vite SPA
│   ├── src/
│   │   ├── assets/logos/             # az-graphics.jpg, az-cnc-services.jpg
│   │   ├── types/
│   │   │   └── business.ts           # BusinessUnit type + BUSINESS_UNITS config
│   │   ├── components/
│   │   │   ├── layout/               # MainLayout, AppSidebar, AppHeader
│   │   │   └── branding/             # BrandLogo, BrandHeader, BusinessUnitSwitcher
│   │   ├── features/
│   │   │   ├── auth/                 # LoginPage (JWT + demo fallback)
│   │   │   ├── dashboard/            # DashboardPage (KPIs, pipeline, quick actions)
│   │   │   ├── customers/            # CustomersPage (grid + modal)
│   │   │   ├── quotations/           # QuotationsPage (pipeline + table)
│   │   │   ├── jobs/                 # JobsPage (expandable cards + status pipeline)
│   │   │   ├── finance/              # InvoicesPage (invoices + payment ledger)
│   │   │   ├── expenses/             # ExpensesPage (approval workflow)
│   │   │   ├── reports/              # ReportsPage (KPIs, bar chart, top customers)
│   │   │   └── audit/                # AuditPage (append-only log)
│   │   ├── App.tsx                   # Root — JWT state, login/app routing
│   │   ├── main.tsx
│   │   └── index.css                 # Tailwind imports + scrollbar styles
│   ├── tailwind.config.js            # Brand design tokens
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── comprehensive_plan.md             # Full technical specification v2.0
└── README.md                         # This file
```

---

## Prerequisites

Ensure the following are installed before starting:

| Tool | Minimum version | Check |
|---|---|---|
| **Python** | 3.11 | `python --version` |
| **Node.js** | 18 (LTS) | `node --version` |
| **npm** | 9 | `npm --version` |
| **PostgreSQL** | 15 | `psql --version` |
| **Git** | 2.x | `git --version` |

> **Windows users:** The backend uses a `.venv` virtual environment. All `python` / `pip` commands below assume you have activated it.

---

## Backend Setup (Django)

### 1. Clone the repository

```bash
git clone https://github.com/krymoevanag/Brandlab.git
cd Brandlab
```

### 2. Create and activate a virtual environment

```bash
# Windows (PowerShell)
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# macOS / Linux
cd backend
python -m venv .venv
source .venv/bin/activate
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

```bash
# Copy the template
cp .env.example .env
```

Open `.env` and fill in your values (see [Environment Variables Reference](#environment-variables-reference)).

### 5. Run database migrations

```bash
python manage.py migrate
```

### 6. Seed initial data (branches, roles, owner account)

```bash
python manage.py seed_initial_data
```

This creates:
- Branches: **Nairobi (NBI)** and **Meru (MER)**
- Roles: `owner`, `branch_manager`, `finance_officer`, `sales_attendant`, `designer`, `cnc_operator`, `storekeeper`
- A default owner account (credentials printed to console)

### 7. Create a superuser (optional — for Django Admin)

```bash
python manage.py createsuperuser
```

### 8. Verify the setup

```bash
python manage.py check
# Expected: System check identified no issues (0 silenced).
```

### 9. Start the development server

```bash
python manage.py runserver 8000
```

The API is now live at **http://localhost:8000/api/v1/**.

---

## Frontend Setup (React + Vite)

### 1. Navigate to the frontend directory

```bash
cd ../frontend_app   # from project root: cd Brandlab/frontend_app
```

### 2. Install Node dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

The React app is now live at **http://localhost:5173**.

> Vite proxies are not configured — the frontend calls the Django API at `http://localhost:8000` directly. Ensure Django is running before logging in.

### Other frontend commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start local development server (HMR) |
| `npm run build` | Production bundle (`dist/`) |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run oxlint TypeScript/React linter |
| `npx tsc --noEmit` | TypeScript type-check without emitting files |

---

## Environment Variables Reference

All backend configuration is controlled by `.env` inside the `backend/` directory.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DJANGO_SECRET_KEY` | ✅ Yes | — | Django secret key. Generate with `python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"` |
| `DJANGO_DEBUG` | No | `False` | Set to `True` for local development |
| `DJANGO_ALLOWED_HOSTS` | No | `127.0.0.1,localhost` | Comma-separated list of allowed hostnames |
| `DJANGO_CORS_ALLOWED_ORIGINS` | No | `http://localhost:5173` | Comma-separated list of frontend origins allowed to call the API |
| `DATABASE_URL` | No* | — | Full PostgreSQL connection string. If omitted, SQLite is used as a fallback. **Use PostgreSQL in production.** |

**`DATABASE_URL` format:**
```
postgresql://USER:PASSWORD@HOST:PORT/DBNAME
# Example:
postgresql://az_app_user:mypassword@127.0.0.1:5432/az_business_db
```

---

## Database Setup (PostgreSQL)

### Create the database and user

```sql
-- Connect as postgres superuser
psql -U postgres

-- Create a dedicated database user
CREATE USER az_app_user WITH PASSWORD 'your_strong_password';

-- Create the database
CREATE DATABASE az_business_db OWNER az_app_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE az_business_db TO az_app_user;

\q
```

### Update your `.env`

```env
DATABASE_URL=postgresql://az_app_user:your_strong_password@127.0.0.1:5432/az_business_db
```

Then run migrations:

```bash
cd backend
python manage.py migrate
python manage.py seed_initial_data
```

---

## Running the Full Stack

Open **two terminal windows**:

**Terminal 1 — Django API:**
```bash
cd Brandlab/backend
.\.venv\Scripts\Activate.ps1     # Windows
# source .venv/bin/activate      # macOS/Linux
python manage.py runserver 8000
```

**Terminal 2 — React Frontend:**
```bash
cd Brandlab/frontend_app
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## API Documentation

Interactive API documentation is auto-generated by **drf-spectacular**:

| URL | Interface |
|---|---|
| http://localhost:8000/api/docs/ | **Swagger UI** — try requests live |
| http://localhost:8000/api/redoc/ | **ReDoc** — clean reference view |
| http://localhost:8000/api/schema/ | **OpenAPI 3 YAML** — raw schema |

### Core API endpoints

```
POST   /api/v1/auth/token/           # Login → { access, refresh, user }
POST   /api/v1/auth/token/refresh/   # Refresh access token
GET    /api/v1/auth/me/              # Current user profile

GET    /api/v1/branches/             # List branches
GET    /api/v1/customers/            # List / search customers
POST   /api/v1/customers/            # Create customer
GET    /api/v1/services/             # Service catalogue
GET    /api/v1/quotations/           # Quotations
GET    /api/v1/jobs/                 # Job cards
GET    /api/v1/invoices/             # Invoices
GET    /api/v1/payments/             # Payment records
GET    /api/v1/expenses/             # Expenses
GET    /api/v1/audit-logs/           # Audit trail (read-only)
GET    /api/v1/reports/              # Financial summary endpoints
```

All endpoints require `Authorization: Bearer <access_token>` except `/api/v1/auth/token/`.

---

## Demo Login Credentials

The `seed_initial_data` management command creates the following demo accounts:

| Role | Email | Password |
|---|---|---|
| 👑 Owner / Super Admin | `owner@atozgraphics.co.ke` | `Password123!` |
| 🏢 Branch Manager (NBI) | `mgr.nbi@atozgraphics.co.ke` | `Password123!` |
| 🏢 Branch Manager (MER) | `mgr.mer@atozgraphics.co.ke` | `Password123!` |
| 💼 Sales Attendant | `sales.nbi@atozgraphics.co.ke` | `Password123!` |
| 🎨 Designer | `designer@atozgraphics.co.ke` | `Password123!` |

> The login page includes a **Demo Staff Roles** quick-fill panel so you can switch between roles during development without typing credentials.

> **If the Django server is not running**, the frontend automatically falls back to demo mode and detects the role from the email address pattern (`mgr` → Branch Manager, `sales` → Sales Attendant, `designer` → Designer).

---

## Module Overview

| Sidebar Item | Backend App | Status | Description |
|---|---|---|---|
| Dashboard | — | ✅ Done | KPIs, job pipeline, quick actions, business-unit breakdown |
| Customers | `apps.customers` | ✅ Done | CRM directory, card grid, add-customer modal |
| Orders & Quotations | `apps.quotations` | ✅ Done | Pipeline summary (Draft→Converted), status table |
| Job Cards | `apps.jobs` | ✅ Done | Expandable cards, 7-step pipeline, priority badges |
| Invoices & Payments | `apps.finance` | ✅ Done | Invoice table, payment ledger (Cash/M-Pesa/Bank) |
| Expenses | `apps.expenses` | ✅ Done | Approval workflow, category breakdown |
| Reports | — | ✅ Done | KPIs, 6-month bar chart, branch & top-customer tables |
| Audit Logs | `apps.audit` | ✅ Done | Append-only ledger, action filter, tamper-proof |
| CNC Production | `apps.jobs` | 🔲 Planned | Machine run sheets, operator assignment |
| Materials & Stock | — | 🔲 Planned | Inventory, low-stock alerts, branch transfers |
| Design Studio | `apps.designs` | 🔲 Planned | Artwork upload, proofing, approval workflow |

---

## Role & Permissions Matrix

| Permission | Owner | Br. Manager | Finance Officer | Sales | Designer | CNC Operator |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| View all branches | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve expenses | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create quotations | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Advance job status | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| View financial reports | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Issue invoices | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Record payments | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View audit log | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

> All permissions are enforced **server-side** via DRF permission classes. UI hiding is for usability only.

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`.
3. Commit your changes with a meaningful message.
4. Open a Pull Request against `main`.

### Code standards

- **Backend:** PEP 8, meaningful model `__str__`, always add `log_audit()` for state-changing operations.
- **Frontend:** TypeScript strict mode, functional components, props typed with interfaces.
- **Database:** Never delete financial or audit records — use soft deletes or reversal records.

---

<div align="center">

Built for **A to Z Graphics & CNC Services** · Nairobi & Meru, Kenya 🇰🇪

</div>
