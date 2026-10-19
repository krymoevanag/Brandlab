from django.core.management.base import BaseCommand
from apps.accounts.models import Role
from apps.branches.models import Branch


class Command(BaseCommand):
    help = "Seeds initial system roles and branches (Nairobi, Meru)."

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
            ("owner", "Owner / Super Admin", "All branches, users, settings, consolidated reports, exceptional approvals"),
            ("branch_manager", "Branch Manager", "Branch operations, staff oversight, delegated approvals"),
            ("finance_officer", "Finance Officer", "Invoices, payments, allocations, receipts, expenses, finance reports"),
            ("sales_attendant", "Sales Attendant", "Customers, quotations, jobs"),
            ("designer", "Designer", "Artwork uploads, revisions, design status"),
            ("cnc_operator", "CNC Operator", "CNC tasks, machine status, material usage"),
            ("storekeeper", "Storekeeper", "Stock receipts, issues, adjustments, transfers"),
        ]
        for code, name, description in roles_data:
            role, created = Role.objects.get_or_create(
                code=code,
                defaults={"name": name, "description": description, "is_system_role": True},
            )
            action = "Created" if created else "Found existing"
            self.stdout.write(f"{action} role: {role.name} ({role.code})")

        self.stdout.write(self.style.SUCCESS("Successfully seeded initial branches and roles!"))
