# A to Z Business & Production Management System — Starter

Starter backend for React + TypeScript, Django REST Framework and PostgreSQL.

## Included
- Django project and environment configuration
- PostgreSQL connection via `DATABASE_URL` (temporary SQLite fallback for smoke tests)
- Custom email-based user model
- Branch and role models
- JWT token and refresh endpoints
- Public health check
- Django admin registrations and one API test

## Requirements
Python 3.11+ (3.12 recommended), PostgreSQL 15+, Git. Node.js 20+ will be used for the frontend stage.

## Windows PowerShell setup
```powershell
cd az-business-system-starter
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
```
If activation is blocked in the current terminal, use `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` and activate again.

## PostgreSQL setup
Create a database and user in PostgreSQL (for example, via pgAdmin's Query Tool):
```sql
CREATE USER az_app_user WITH PASSWORD 'replace-with-a-strong-local-password';
CREATE DATABASE az_business_db OWNER az_app_user;
```
Edit `.env` and set `DATABASE_URL` to your local connection string. Do not commit `.env` or use development credentials in production.

## Migrate and start
The custom user model is configured from the beginning. Keep `AUTH_USER_MODEL = "accounts.User"` and run initial migrations before creating business data.
```powershell
python manage.py check
python manage.py makemigrations accounts branches
python manage.py migrate
python manage.py createsuperuser
python manage.py test
python manage.py runserver
```

Endpoints:
- Health: `GET http://127.0.0.1:8000/api/health/`
- JWT token: `POST http://127.0.0.1:8000/api/auth/token/` with `email` and `password`
- JWT refresh: `POST http://127.0.0.1:8000/api/auth/token/refresh/`
- Admin: `http://127.0.0.1:8000/admin/`

Health response: `{"status":"ok","service":"az-business-api"}`.

For a temporary smoke test only, leaving `DATABASE_URL` blank uses SQLite. PostgreSQL must be configured and tested before normal development is considered complete.

## Next milestone
Implement role/branch assignment APIs and authorization tests, then scaffold React + TypeScript with Vite and build the login and application shell.

This is not yet a complete business system. Customers, quotations, jobs, invoices, expense tracking, inventory, CNC production, payment integrations and production deployment are later milestones. The role model is only a foundation; enforce branch and role authorization in API views before storing real business data.
