from django.core.management.base import BaseCommand, CommandError
from apps.accounts.models import BusinessUnit, Permission, Role, User
from apps.branches.models import Branch


class Command(BaseCommand):
    help = "Seeds initial system roles and branches (Nairobi, Meru)."

    def add_arguments(self, parser):
        parser.add_argument("--user-email", help="Optionally create or configure a staff login.")
        parser.add_argument("--user-password", help="Password for a newly created staff login.")
        parser.add_argument("--user-role", default="owner", help="Role for the optional staff login.")
        parser.add_argument("--user-branch", default="NBI", help="Default branch code for the optional staff login.")

    def handle(self, *args, **options):
        # 1. Branches
        branches_data = [
            {
                "code": "NBI",
                "name": "Nairobi Branch",
                "address": "Nairobi, Kenya",
                "phone_number": "+254700000001",
                "email": "nairobi@atozgraphics.co.ke",
                "is_active": True,
            },
            {
                "code": "MER",
                "name": "Meru Branch",
                "address": "Meru, Kenya",
                "phone_number": "+254700000002",
                "email": "meru@atozgraphics.co.ke",
                "is_active": True,
            },
        ]
        for b_data in branches_data:
            branch, created = Branch.objects.get_or_create(code=b_data["code"], defaults=b_data)
            action = "Created" if created else "Found existing"
            self.stdout.write(f"{action} branch: {branch.name} ({branch.code})")

        # 2. Roles
        roles_data = [
            ("owner", "Owner / Business Administrator", "Full business authority and sensitive approvals"),
            ("branch_manager", "Branch Manager", "Branch operations, staff oversight, delegated approvals"),
            ("finance_officer", "Finance Officer", "Payment verification, invoices, receipts, expenses and reconciliation"),
            ("sales_attendant", "Sales & Customer Service", "Customers, quotations, job intake and customer communication"),
            ("designer", "Graphic Designer", "Artwork, proofs, revisions and design status"),
            ("cnc_operator", "Production / CNC Operator", "Production status, machine work and material usage"),
            ("storekeeper", "Storekeeper / Inventory Officer", "Stock receipts, issues, usage, wastage and transfers"),
            ("auditor", "Auditor / Read-Only Reviewer", "Read-only review of authorized records and audit logs"),
        ]
        created_role_codes = set()
        for code, name, description in roles_data:
            role, created = Role.objects.get_or_create(
                code=code,
                defaults={"name": name, "description": description, "is_system_role": True},
            )
            action = "Created" if created else "Found existing"
            if created:
                created_role_codes.add(code)
            self.stdout.write(f"{action} role: {role.name} ({role.code})")

        # 3. Business scopes
        units = {}
        for code, name in [("graphics", "A to Z Graphics"), ("cnc", "A to Z CNC Services")]:
            unit, created = BusinessUnit.objects.get_or_create(code=code, defaults={"name": name})
            units[code] = unit
            self.stdout.write(f"{'Created' if created else 'Found existing'} business unit: {unit.name}")

        # 4. Granular permission catalogue
        permission_data = {
            "customers.view": "View customers",
            "customers.create": "Create customers",
            "customers.edit": "Edit customers",
            "customers.delete": "Delete customers",
            "quotations.view": "View quotations",
            "quotations.create": "Create quotations",
            "quotations.edit": "Edit quotations",
            "quotations.delete": "Delete quotations",
            "jobs.view": "View jobs",
            "jobs.create": "Create jobs",
            "jobs.edit": "Edit jobs and production status",
            "jobs.delete": "Delete jobs",
            "designs.view": "View design assignments",
            "designs.submit": "Submit artwork and proofs",
            "designs.approve": "Approve artwork",
            "finance.view": "View financial records",
            "payments.verify": "Verify and record payments",
            "payments.reverse": "Reverse payments",
            "expenses.create": "Record expenses",
            "expenses.approve": "Approve expenses",
            "expenses.pay": "Pay approved expenses",
            "inventory.view": "View inventory",
            "inventory.receive": "Receive inventory",
            "inventory.issue": "Issue inventory",
            "inventory.adjust": "Approve inventory adjustments",
            "reports.view": "View reports",
            "audit.view": "View audit logs",
            "users.manage": "Manage users and role assignments",
            "settings.manage": "Manage system settings",
            "dashboard.view": "View the business dashboard",
            "dashboard.cnc.view": "View CNC production dashboard",
        }
        permissions = {
            code: Permission.objects.get_or_create(code=code, defaults={"name": name})[0]
            for code, name in permission_data.items()
        }

        role_permissions = {
            "branch_manager": [p for code, p in permissions.items() if code not in {"users.manage", "settings.manage"}],
            "finance_officer": [permissions[c] for c in ["dashboard.view", "finance.view", "payments.verify", "payments.reverse", "expenses.create", "expenses.approve", "expenses.pay", "reports.view"]],
            "sales_attendant": [permissions[c] for c in ["dashboard.view", "customers.view", "customers.create", "customers.edit", "quotations.view", "quotations.create", "quotations.edit", "jobs.view", "jobs.create"]],
            "designer": [permissions[c] for c in ["dashboard.view", "customers.view", "jobs.view", "designs.view", "designs.submit"]],
            "cnc_operator": [permissions[c] for c in ["dashboard.view", "dashboard.cnc.view", "customers.view", "quotations.view", "jobs.view", "jobs.edit", "inventory.view", "inventory.issue"]],
            "storekeeper": [permissions[c] for c in ["dashboard.view", "inventory.view", "inventory.receive", "inventory.issue", "expenses.create"]],
            "auditor": [permissions[c] for c in ["dashboard.view", "finance.view", "inventory.view", "reports.view", "audit.view"]],
            "owner": list(permissions.values()),
        }
        for code, assigned_permissions in role_permissions.items():
            role = Role.objects.get(code=code)
            if code in created_role_codes:
                role.permissions.set(assigned_permissions)
            else:
                role.permissions.add(*assigned_permissions)

        # Owners can access both units. Other users receive explicit scope during account creation.
        self.stdout.write("Assigned granular permissions to system roles.")

        user_email = options.get("user_email")
        user_password = options.get("user_password")
        if user_email and not user_password:
            raise CommandError("--user-password is required when --user-email is supplied.")
        if user_password and not user_email:
            raise CommandError("--user-email is required when --user-password is supplied.")

        if user_email:
            role_code = options["user_role"]
            branch_code = options["user_branch"]
            try:
                role = Role.objects.get(code=role_code)
                branch = Branch.objects.get(code=branch_code)
            except (Role.DoesNotExist, Branch.DoesNotExist) as exc:
                raise CommandError(f"Unknown seeded user role or branch: {exc}") from exc

            user, created = User.objects.get_or_create(
                email=user_email.strip().lower(),
                defaults={"is_active": True},
            )
            if created:
                user.set_password(user_password)
                user.save(update_fields=["password"])
            user.roles.add(role)
            user.branches.add(branch)
            user.default_branch = branch
            user.business_units.set(units.values())
            user.save(update_fields=["default_branch"])
            self.stdout.write(f"{'Created' if created else 'Configured'} seeded user: {user.email} ({role.code}, {branch.code})")

        self.stdout.write(self.style.SUCCESS("Successfully seeded initial branches and roles!"))
