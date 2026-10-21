# A to Z Business & Production Management System

The **A to Z Business & Production Management System (BPMS)** is a web application designed to help **A to Z Graphics — Branding & Gifts Shop** and **A to Z CNC Services** manage their daily work from one place.

Instead of keeping customer details, quotations, jobs, payments, expenses, and reports in separate records, staff can use one system to manage them. The system supports the Nairobi Head Office (NBI) and the Meru Regional Branch (MER).

- **A to Z Graphics:** branding, printing, signage, and corporate gifts.
- **A to Z CNC Services:** CNC cutting, precision machining, and fabrication.
- **Currency:** Kenyan shillings (KES).
- **Time zone:** East Africa Time (Africa/Nairobi, UTC+3).

The two businesses share the same login system and application, while staff permissions and access to records depend on their role and branch.

## Contents

1. [How the system works](#how-the-system-works)
2. [Technologies used](#technologies-used)
3. [System design](#system-design)
4. [Project folders](#project-folders)
5. [What you need before starting](#what-you-need-before-starting)
6. [Set up the Django backend](#set-up-the-django-backend)
7. [Set up the React frontend](#set-up-the-react-frontend)
8. [Environment settings](#environment-settings)
9. [Set up PostgreSQL](#set-up-postgresql)
10. [Run the whole system](#run-the-whole-system)
11. [API documentation](#api-documentation)
12. [Development accounts](#development-accounts)
13. [System features](#system-features)
14. [Staff roles and permissions](#staff-roles-and-permissions)
15. [Access-control setup](#access-control-setup)
16. [Contributing to the project](#contributing-to-the-project)

## How the system works

The system has three main parts:

1. **Frontend:** the website that staff open in a browser. It contains the login page, navigation menu, dashboards, forms, tables, and reports.
2. **Backend:** the Django application that receives requests from the website, checks permissions, applies business rules, and returns data.
3. **Database:** PostgreSQL stores business information such as customers, jobs, quotations, invoices, payments, and expenses. During local development, the project can use SQLite if no database connection has been configured.

When a staff member performs an action, the website sends a request to the backend. The backend checks the request and the user's permissions, works with the database, and sends a response back to the website.

### Main business areas

| Business | Main activities | Brand colour |
|---|---|---|
| A to Z Graphics — Branding & Gifts Shop | Design, printing, signage, and corporate gifts | Cyan (`#08BCE5`) |
| A to Z CNC Services | CNC cutting, precision machining, and fabrication | Orange (`#F7941D`) |

## Technologies used

The project uses the following tools and technologies.

### Backend

| Technology | What it does |
|---|---|
| Django 5.2 | Provides the main backend application and business logic. |
| Django REST Framework 3.16 | Allows the frontend to communicate with the backend through an API. |
| Simple JWT 5.5 | Handles login tokens used to authenticate API requests. |
| drf-spectacular 0.30 | Generates the interactive API documentation. |
| django-cors-headers 4.9 | Controls which frontend websites are allowed to make requests to the API. |
| django-filter 24.3 | Supports filtering API results. |
| Pillow 10.4 | Supports image processing, including logos and media. |
| Django ORM | Lets the application work with database records using Python models. |
| dj-database-url | Reads database connection settings from a URL. |
| python-dotenv | Loads configuration values from a `.env` file. |

### Database

- **PostgreSQL 15 or later:** the recommended database for production.
- **SQLite 3:** a lightweight option used automatically for local development when `DATABASE_URL` is empty.

### Frontend

| Technology | What it does |
|---|---|
| React 19 | Builds the website interface from reusable components. |
| TypeScript 7 | Adds types to JavaScript code to help catch mistakes. |
| Vite 8 | Runs the development server and builds the website for production. |
| Tailwind CSS 3 | Provides utility classes for styling the interface. |
| Lucide React 1.59 | Supplies icons used throughout the website. |
| Axios 1.20 | Sends HTTP requests to the backend API. |
| TanStack Query 5 | Manages, caches, and refreshes data received from the API. |
| oxlint 1.88 | Checks the frontend code for common issues. |

### Fonts

The interface uses three Google Fonts for different purposes:

- **Space Grotesk:** headings, dashboard totals, and section titles.
- **Manrope:** ordinary text, forms, tables, and navigation.
- **IBM Plex Mono:** job references, invoice numbers, and transaction codes.

## System design

The application follows a frontend–backend–database structure.

1. A staff member opens the React website in a browser at `http://localhost:5173`.
2. The website sends API requests to Django at `http://localhost:8000/api/v1/`.
3. Django checks authentication, user permissions, and branch access before processing the request.
4. Django reads or updates the database through its ORM.
5. The API returns a response that the website displays to the user.

The backend contains separate applications for accounts, branches, customers, services, quotations, jobs, designs, finance, expenses, and audit logs.

### Important design decisions

- **Audit history:** important actions such as creating, updating, deleting, approving, rejecting, or changing a record's status are recorded in the audit application. Audit entries are designed to be append-only.
- **Historical prices:** quotations and job items keep a copy of the description and unit price used when they were created. Later changes to the service catalogue therefore do not automatically change old records.
- **Accurate financial calculations:** money fields use decimal values with two decimal places. Financial totals should be calculated and confirmed by the backend rather than trusted solely to the browser.
- **Branch access:** business records are linked to a branch. The backend applies branch restrictions when returning or changing records, rather than relying only on what the interface displays.
- **Token-based login:** the frontend uses JSON Web Tokens (JWT) to authenticate API requests. The access token is sent using the `Bearer` authorization scheme.

> **Note:** The architecture section describes the intended configuration. Check the current settings and code if you need to confirm exact token lifetimes or production behaviour.

## Project folders

The repository is named `Brandlab`. Its main folders are organised as follows:

```text
Brandlab/
├── backend/                         # Django backend
│   ├── config/
│   │   ├── settings.py              # Main application settings
│   │   ├── urls.py                  # Main URL and API routing
│   │   ├── wsgi.py                  # WSGI entry point
│   │   └── asgi.py                  # ASGI entry point
│   ├── apps/
│   │   ├── core/                    # Shared models, permissions and utilities
│   │   ├── accounts/                # Users, roles and access management
│   │   ├── branches/                # Nairobi and Meru branches
│   │   ├── audit/                   # Audit history
│   │   ├── customers/               # Customer records
│   │   ├── services/                # Services and service categories
│   │   ├── quotations/              # Quotations and quotation items
│   │   ├── jobs/                    # Jobs, job items and status history
│   │   ├── designs/                 # Design assignments and artwork proofing
│   │   ├── finance/                 # Invoices, payments and receipts
│   │   └── expenses/                # Expenses and approvals
│   ├── .env                         # Local secrets; do not commit this file
│   ├── .env.example                 # Example configuration template
│   ├── requirements.txt             # Python package list
│   └── manage.py                    # Django management commands
├── frontend_app/                    # React website
│   ├── src/
│   │   ├── assets/logos/             # Business logos
│   │   ├── types/                    # TypeScript types and business-unit settings
│   │   ├── components/
│   │   │   ├── layout/               # Main layout, sidebar and header
│   │   │   └── branding/             # Logos, headers and business switcher
│   │   ├── features/
│   │   │   ├── auth/                 # Login
│   │   │   ├── dashboard/             # Summary dashboard and quick actions
│   │   │   ├── customers/             # Customer directory
│   │   │   ├── quotations/            # Quotations
│   │   │   ├── jobs/                  # Job cards and progress
│   │   │   ├── finance/               # Invoices and payments
│   │   │   ├── expenses/              # Expense approval
│   │   │   ├── reports/               # Business reports
│   │   │   └── audit/                 # Audit history
│   │   ├── App.tsx                    # Main app and login routing
│   │   ├── main.tsx                   # Frontend entry point
│   │   └── index.css                  # Global styles
│   ├── tailwind.config.js             # Styling configuration
│   ├── vite.config.ts                 # Vite configuration
│   ├── tsconfig.json                  # TypeScript configuration
│   └── package.json                  # Frontend dependencies and commands
├── comprehensive_plan.md              # Detailed technical plan
└── README.md                          # Project instructions
```

## What you need before starting

Install these tools before setting up the project:

| Tool | Minimum version | How to check |
|---|---:|---|
| Python | 3.11 | `python --version` |
| Node.js | 18 LTS | `node --version` |
| npm | 9 | `npm --version` |
| PostgreSQL | 15 | `psql --version` |
| Git | 2.x | `git --version` |

On Windows, the backend instructions use a Python virtual environment called `.venv`. Activate it before running the backend's Python or pip commands.

## Set up the Django backend

### 1. Download the project

Open a terminal and run:

```bash
git clone https://github.com/krymoevanag/Brandlab.git
cd Brandlab
```

### 2. Create and activate a Python virtual environment

**Windows PowerShell:**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**macOS or Linux:**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
```

A virtual environment keeps this project's Python packages separate from packages used by other projects.

### 3. Install the backend packages

With the virtual environment activated, run:

```bash
pip install -r requirements.txt
```

### 4. Configure the environment

Copy the example configuration file to a new `.env` file:

```bash
cp .env.example .env
```

On Windows, you can also copy `.env.example` to `.env` using File Explorer. Open `.env` and enter the values required for your setup. The most important settings are explained in the [Environment settings](#environment-settings) section.

Do not commit `.env` to Git because it may contain passwords or secret keys.

### 5. Create the database tables

Run the database migrations:

```bash
python manage.py migrate
```

Migrations create or update the database tables required by the application.

### 6. Add the initial data

Run:

```bash
python manage.py seed_initial_data
```

According to the project setup, this command creates or updates:

- The Nairobi (`NBI`) and Meru (`MER`) branches.
- The roles `owner`, `branch_manager`, `finance_officer`, `sales_attendant`, `designer`, `cnc_operator`, `storekeeper`, and `auditor`.
- The Graphics and CNC business units.
- The granular permission catalogue and role-to-permission assignments.

The command does not create a login unless you explicitly provide one. To create a fresh local owner who can create business records, provide credentials at runtime:

```bash
python manage.py seed_initial_data --user-email owner@example.com --user-password "choose-a-local-password" --user-role owner --user-branch NBI
```

The password is never stored in source code. Use Django Admin or the owner's **Staff & Access** screen to create additional staff accounts.

### 7. Create a Django administrator account (optional)

If you need access to Django's built-in administration site, run:

```bash
python manage.py createsuperuser
```

Follow the prompts to create the account.

### 8. Check the project configuration

Run:

```bash
python manage.py check
```

If everything is configured correctly, Django should report that it found no system-check issues.

### 9. Start the backend

Run:

```bash
python manage.py runserver 8000
```

The backend API should now be available at `http://localhost:8000/api/v1/`.

## Set up the React frontend

Keep the backend running, then open a **second terminal**.

### 1. Open the frontend folder

From the project root, run:

```bash
cd frontend_app
```

If your terminal is still inside `backend`, run `cd ../frontend_app` instead.

### 2. Install the frontend packages

```bash
npm install
```

This installs the packages listed in `package.json`.

### 3. Start the website

```bash
npm run dev
```

Vite normally makes the development website available at `http://localhost:5173/`.

The frontend is configured to call Django directly at `http://localhost:8000`. The README does not describe a Vite proxy, so start the Django backend before trying to log in.

### Other useful frontend commands

| Command | Purpose |
|---|---|
| `npm run dev` | Starts the development website and reloads changes as you work. |
| `npm run build` | Builds the production version into `dist/`. |
| `npm run preview` | Lets you preview the production build locally. |
| `npm run lint` | Checks the frontend code using oxlint. |
| `npx tsc --noEmit` | Checks TypeScript types without generating output files. |

## Environment settings

The backend reads its configuration from the `.env` file inside the `backend/` folder.

| Setting | Required? | Default | What it means |
|---|---|---|---|
| `DJANGO_SECRET_KEY` | Yes | None | A private key Django uses for security-related functions. Generate a strong key for your environment. |
| `DJANGO_DEBUG` | No | `False` | Enables extra debugging information. Use `True` only for local development; keep it `False` in production. |
| `DJANGO_ALLOWED_HOSTS` | No | `127.0.0.1,localhost` | The hostnames that Django is allowed to serve. |
| `DJANGO_CORS_ALLOWED_ORIGINS` | No | `http://localhost:5173` | Frontend origins permitted to send browser requests to the API. |
| `DATABASE_URL` | No for local fallback | None | The database connection details. If it is empty, the project falls back to SQLite. Use PostgreSQL for production. |

Generate a Django secret key with:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

A PostgreSQL connection URL follows this format:

```text
postgresql://USER:PASSWORD@HOST:PORT/DBNAME
```

For example, a local database URL might look like this:

```text
postgresql://az_app_user:your_strong_password@127.0.0.1:5432/az_business_db
```

Replace the example username, password, host, port, and database name with your own values. Do not use the example password in a real deployment.

## Set up PostgreSQL

PostgreSQL is recommended for a production installation.

### 1. Create a database user and database

Open `psql` using an account with permission to create databases and users:

```bash
psql -U postgres
```

Then run the following SQL commands, replacing the example password with a strong password:

```sql
CREATE USER az_app_user WITH PASSWORD 'your_strong_password';
CREATE DATABASE az_business_db OWNER az_app_user;
GRANT ALL PRIVILEGES ON DATABASE az_business_db TO az_app_user;
```

Exit the PostgreSQL prompt:

```sql
\q
```

### 2. Add the database connection to `.env`

Set `DATABASE_URL` in `backend/.env`:

```env
DATABASE_URL=postgresql://az_app_user:your_strong_password@127.0.0.1:5432/az_business_db
```

Use the actual password you set when creating the database user.

### 3. Create the tables and initial data

From the `backend/` folder, with the virtual environment activated, run:

```bash
python manage.py migrate
python manage.py seed_initial_data
```

## Run the whole system

You need **two terminal windows**: one for Django and one for React.

**Terminal 1 — Backend**

```powershell
cd Brandlab\backend
.\.venv\Scripts\Activate.ps1
python manage.py runserver 8000
```

On macOS or Linux, activate the environment with `source .venv/bin/activate` instead.

**Terminal 2 — Frontend**

```bash
cd Brandlab/frontend_app
npm run dev
```

Open `http://localhost:5173/` in your browser. Keep both terminal windows running while you use the application.

## API documentation

The project generates interactive API documentation automatically. Start the Django server first, then open one of these addresses:

| Address | What it provides |
|---|---|
| `http://localhost:8000/api/docs/` | **Swagger UI:** explore API endpoints and try requests. |
| `http://localhost:8000/api/redoc/` | **ReDoc:** a readable reference guide to the API. |
| `http://localhost:8000/api/schema/` | The OpenAPI schema in YAML format. |

### Main API endpoints

The following routes are listed in the project documentation:

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/v1/auth/token/` | Log in and receive access and refresh tokens, along with user information. |
| `POST` | `/api/v1/auth/token/refresh/` | Request a new access token using a refresh token. |
| `GET` | `/api/v1/auth/me/` | Get information about the currently logged-in user. |
| `GET` | `/api/v1/branches/` | List branches the user is allowed to access. |
| `GET` | `/api/v1/customers/` | List or search customers. |
| `POST` | `/api/v1/customers/` | Create a customer record. |
| `GET` | `/api/v1/services/` | View the service catalogue. |
| `GET` | `/api/v1/quotations/` | View quotations. |
| `GET` | `/api/v1/jobs/` | View job cards. |
| `GET` | `/api/v1/invoices/` | View invoices. |
| `GET` | `/api/v1/payments/` | View payment records. |
| `POST` | `/api/v1/payments/` | Record an idempotent payment and allocate it to invoices. |
| `POST` | `/api/v1/payments/{id}/reverse/` | Reverse a completed payment with an authorized reason. |
| `GET` | `/api/v1/receipts/` | View generated payment receipts. |
| `GET` | `/api/v1/expenses/` | View expenses. |
| `POST` | `/api/v1/expenses/` | Record an expense in the authenticated user's permitted branch scope. |
| `GET` | `/api/v1/design-assignments/` | View branch-scoped design assignments. |
| `POST` | `/api/v1/design-assignments/{id}/upload-file/` | Submit a design file where permitted. |
| `POST` | `/api/v1/design-assignments/{id}/approve/` | Approve a design where permitted. |
| `GET` | `/api/v1/audit-logs/` | Read the audit history. |
| `GET` | `/api/v1/reports/` | Access financial summary endpoints. |

Except for the login endpoint, API requests require an access token in the request header:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

The exact data and permissions available from an endpoint depend on the backend implementation and the logged-in user's role.

### Authentication and branch selection

The login form sends the selected branch to the JWT endpoint. The backend rejects a login when the user is not assigned to that active branch. Selecting a branch in the frontend does not grant access to it.

The frontend refreshes the authenticated profile after login and during an active session. If a role or permission changes, the updated effective permissions are reflected after the profile refresh.

## Development accounts

No shared passwords or automatic demo accounts are created by the seed command. Create a local owner account with:

```bash
python manage.py seed_initial_data --user-email owner@example.com --user-password "choose-a-local-password" --user-role owner --user-branch NBI
```

After logging in, use Django Admin or the owner-only **Staff & Access** screen to create staff accounts and assign their roles, branches, and business units. Never reuse development passwords in production.

## System features

The README marks the following modules as complete or planned. Actual availability should be confirmed against the current code.

| Feature | Current status in the README | What it does |
|---|---|---|
| Dashboard | Partially connected | Displays authorized operational data and current workflow information. Backend-derived summary metrics remain the next integration step. |
| Customers | Complete | Shows customer records in a directory and provides a form for adding customers. |
| Orders and quotations | Complete | Tracks quotations from draft through to conversion. |
| Job cards | Complete | Displays job details, priority, and progress through a seven-stage workflow. |
| Invoices and payments | Complete | Manages invoices, idempotent cash/M-Pesa/bank payments, invoice allocation, balances, receipts, and authorized payment reversal. |
| Expenses | Complete | Supports expense approval and summaries by category. |
| Reports | Complete | Displays key figures, a six-month chart, branch summaries, and top-customer information. |
| Audit logs | Complete | Keeps a history of recorded actions for review. |
| CNC production | Protected dashboard | Branch-scoped production metrics and jobs are available to authorized CNC operators and owners. |
| Materials and stock | Planned | Intended to track inventory, low-stock alerts, and transfers between branches. |
| Design studio | Complete | Shows branch-scoped assignments and supports permitted artwork submission, approval, revision requests, and comments. |

## Staff roles and permissions

Access is enforced by the backend using roles, granular permissions, branches, and business units. The frontend hides unavailable modules, but the API remains the security boundary.

Users can have multiple roles. Effective permissions are the union of permissions granted by all assigned roles, while branch scope, record ownership, workflow state, approval limits, and separation-of-duties rules are enforced separately by the backend. Removing one role removes its exclusive permissions while preserving permissions from the remaining roles.

| Permission | Owner | Branch Manager | Finance Officer | Sales Attendant | Designer | CNC Operator | Storekeeper | Auditor |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Manage users and roles | Yes | No | No | No | No | No | No | No |
| View customers and jobs | All | Branch | — | Yes | Assigned | Assigned | — | Read-only |
| Create quotations | Yes | Yes | No | Yes | No | No | No | No |
| Submit artwork | Yes | Approve | No | No | Yes | No | No | No |
| Update production | Yes | Monitor | No | No | No | Yes | Usage only | No |
| Verify payments | Yes | Limited | Yes | Submit evidence | No | No | No | No |
| Approve expenses | Yes | Delegated | Delegated | No | No | No | Request | No |
| Manage inventory | Yes | Monitor | No | No | No | Usage | Yes | Read-only |
| View audit logs | Yes | Scoped | Financial | No | No | No | Stock | Yes |

Each user also receives explicit branch and business-unit scope. An owner or superuser is unrestricted; other users only receive records and modules allowed by both their permissions and assigned scope.

The current seed configuration grants `expenses.create` to owners, branch managers, finance officers, and storekeepers. Payment recording requires `payments.verify`; payment reversal requires `payments.reverse`; financial viewing requires `finance.view`. Direct per-user permission grants are not currently included in effective permission calculation, so additional access should be provided through a narrowly scoped role.

Financial safeguards include required payment idempotency keys, atomic allocation and receipt creation, persisted balance recalculation, cross-branch checks, over-allocation checks, and documented reversal reasons. The frontend reuses the same idempotency key after an ambiguous payment failure so a retry cannot create a second payment record.

## Verification

The current backend test suite covers authentication, multi-role permissions, branch isolation, customer and quotation workflows, design approval, audit access, expenses, invoices, payments, idempotency, receipts, and payment validation.

Run the main checks with:

```bash
cd backend
python manage.py check
python manage.py test

cd ../frontend_app
npm run build
npm run lint
```

The frontend currently reports non-fatal React hook warnings during linting. These warnings do not fail the lint command and are tracked for cleanup.

## Access-control setup

The access-control models are defined in `backend/apps/accounts/models.py`:

- `User`: authentication, assigned roles, branches, and business units.
- `Role`: reusable staff role.
- `Permission`: granular action such as `payments.verify` or `inventory.adjust`.
- `ApprovalLimit`: optional monetary ceiling for a role, action, and branch.
- `BusinessUnit`: `graphics` or `cnc` access scope.

Useful endpoints include:

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/v1/roles/` | List roles and their permission codes. |
| `GET` | `/api/v1/business-units/` | List assignable business units. |
| `GET/POST` | `/api/v1/users/` | Owner-only staff management. |
| `GET` | `/api/v1/core/cnc-dashboard/` | Protected, branch-scoped CNC dashboard data. |

For local setup, run:

```bash
python manage.py migrate
python manage.py seed_initial_data
python manage.py createsuperuser
```

Then sign in as the owner and create staff accounts with the minimum role, branch, and business-unit scope required for their work.

## Contributing to the project

If you want to contribute code:

1. Fork the repository on GitHub.
2. Create a separate branch for your change:

   ```bash
   git checkout -b feature/my-feature
   ```

3. Make your changes and commit them with a clear message.
4. Open a pull request against the `main` branch.

### Coding guidelines

- **Backend:** follow PEP 8, give models useful `__str__` methods, and call `log_audit()` when an operation changes important business data or state.
- **Frontend:** use TypeScript strict mode, React functional components, and interfaces to define component props.
- **Financial and audit records:** do not permanently delete these records. Use soft deletion or reversal records where appropriate so the history remains available.

---

**Built for A to Z Graphics and A to Z CNC Services — Nairobi and Meru, Kenya.**
