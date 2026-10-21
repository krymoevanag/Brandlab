from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import Permission, User, Role
from apps.branches.models import Branch
from apps.customers.models import Customer
from apps.services.models import ServiceCategory, Service
from apps.quotations.models import Quotation, QuotationItem
from apps.jobs.models import Job
from apps.designs.models import DesignAssignment, DesignFile
from apps.finance.models import Invoice, Payment, Receipt
from apps.expenses.models import Expense
from apps.audit.models import AuditLog


class AtoZBusinessSystemAPITests(APITestCase):
    def setUp(self):
        # 1. Branches
        self.branch_nbi = Branch.objects.create(code="NBI", name="Nairobi Branch")
        self.branch_mer = Branch.objects.create(code="MER", name="Meru Branch")

        # 2. Roles
        self.role_owner = Role.objects.create(code="owner", name="Owner")
        self.role_manager = Role.objects.create(code="branch_manager", name="Branch Manager")
        self.role_finance = Role.objects.create(code="finance_officer", name="Finance Officer")
        self.role_sales = Role.objects.create(code="sales_attendant", name="Sales Attendant")
        self.role_designer = Role.objects.create(code="designer", name="Designer")

        # Explicit permissions used by the role-gated API tests.
        permission_codes = [
            "customers.view", "customers.create", "customers.edit", "customers.delete",
            "quotations.view", "quotations.create", "quotations.edit", "jobs.create",
            "finance.view", "payments.verify", "expenses.create", "expenses.approve", "expenses.pay",
            "dashboard.view", "dashboard.cnc.view", "designs.view", "designs.submit", "designs.approve", "audit.view",
        ]
        permissions_by_code = {
            code: Permission.objects.create(code=code, name=code.replace(".", " "))
            for code in permission_codes
        }
        self.role_manager.permissions.set(permissions_by_code.values())
        self.role_sales.permissions.set([permissions_by_code["quotations.view"]])
        self.role_designer.permissions.set([permissions_by_code["designs.view"], permissions_by_code["designs.submit"]])

        # 3. Users
        # Owner (All branches)
        self.user_owner = User.objects.create_user(
            email="owner@atozgraphics.co.ke", password="Password123!"
        )
        self.user_owner.roles.add(self.role_owner)

        # Nairobi Branch Manager
        self.user_nbi_mgr = User.objects.create_user(
            email="mgr.nbi@atozgraphics.co.ke", password="Password123!"
        )
        self.user_nbi_mgr.roles.add(self.role_manager)
        self.user_nbi_mgr.branches.add(self.branch_nbi)
        self.user_nbi_mgr.default_branch = self.branch_nbi
        self.user_nbi_mgr.save()

        # Meru Sales Attendant
        self.user_mer_sales = User.objects.create_user(
            email="sales.mer@atozgraphics.co.ke", password="Password123!"
        )
        self.user_mer_sales.roles.add(self.role_sales)
        self.user_mer_sales.branches.add(self.branch_mer)
        self.user_mer_sales.default_branch = self.branch_mer
        self.user_mer_sales.save()

        # Designer
        self.user_designer = User.objects.create_user(
            email="designer@atozgraphics.co.ke", password="Password123!"
        )
        self.user_designer.roles.add(self.role_designer)
        self.user_designer.branches.add(self.branch_nbi)
        self.user_designer.save()

        # 4. Service Catalogue
        self.cat_printing = ServiceCategory.objects.create(name="Printing")
        self.service_vinyl = Service.objects.create(
            category=self.cat_printing,
            code="VINYL-PRINT",
            name="Vinyl Sticker Printing",
            unit="sqm",
            base_price=Decimal("1200.00"),
        )

        # 5. Customer
        self.customer_nbi = Customer.objects.create(
            name="Acme Corp Kenya",
            phone="+254711223344",
            email="info@acmeco.ke",
            customer_type="corporate",
            branch=self.branch_nbi,
        )

    def test_05_customer_api_lists_and_creates_in_authorized_branch(self):
        self.client.force_authenticate(user=self.user_nbi_mgr)
        response = self.client.get("/api/v1/customers/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

        create_response = self.client.post("/api/v1/customers/", {
            "name": "New Nairobi Customer",
            "phone": "+254700000001",
            "email": "new@example.com",
            "customer_type": "individual",
        }, format="json")
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_response.data["branch"], self.branch_nbi.id)

    def test_06_customer_api_rejects_invalid_and_cross_branch_access(self):
        self.client.force_authenticate(user=self.user_nbi_mgr)
        invalid_response = self.client.post("/api/v1/customers/", {"name": "Missing phone"}, format="json")
        self.assertEqual(invalid_response.status_code, status.HTTP_400_BAD_REQUEST)

        meru_customer = Customer.objects.create(name="Meru Customer", phone="+254700000002", branch=self.branch_mer)
        self.client.force_authenticate(user=self.user_nbi_mgr)
        self.assertEqual(self.client.get(f"/api/v1/customers/{meru_customer.id}/").status_code, status.HTTP_404_NOT_FOUND)
        update_response = self.client.patch(f"/api/v1/customers/{self.customer_nbi.id}/", {"branch": self.branch_mer.id}, format="json")
        self.assertEqual(update_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_07_customer_api_requires_authentication(self):
        self.client.logout()
        response = self.client.get("/api/v1/customers/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_01_authentication_and_user_profile(self):
        """Test JWT token acquisition and me endpoint."""
        url = reverse("token_obtain_pair")
        resp = self.client.post(url, {"email": "mgr.nbi@atozgraphics.co.ke", "password": "Password123!"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)
        self.assertIn("user", resp.data)
        self.assertEqual(resp.data["user"]["email"], "mgr.nbi@atozgraphics.co.ke")

        # Test auth me endpoint
        token = resp.data["access"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        me_resp = self.client.get(reverse("user_profile"))
        self.assertEqual(me_resp.status_code, status.HTTP_200_OK)
        self.assertIn("branch_manager", me_resp.data["roles"])
        self.assertIn("customers.view", me_resp.data["permissions"])

    def test_login_rejects_user_from_unassigned_branch(self):
        response = self.client.post(reverse("token_obtain_pair"), {
            "email": "sales.mer@atozgraphics.co.ke",
            "password": "Password123!",
            "branch": "NBI",
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("not assigned", str(response.data).lower())

        allowed = self.client.post(reverse("token_obtain_pair"), {
            "email": "sales.mer@atozgraphics.co.ke",
            "password": "Password123!",
            "branch": "MER",
        })
        self.assertEqual(allowed.status_code, status.HTTP_200_OK)
        self.assertEqual(allowed.data["user"]["default_branch"]["code"], "MER")

    def test_02_quote_to_job_conversion_with_snapshot_pricing(self):
        """Test creating a quotation and converting it to a Job without price changes."""
        self.client.force_authenticate(user=self.user_nbi_mgr)

        quote_data = {
            "branch": self.branch_nbi.id,
            "customer": self.customer_nbi.id,
            "status": "accepted",
            "items": [
                {
                    "service": self.service_vinyl.id,
                    "description": "Vinyl Branding for Fleet",
                    "quantity": "10.00",
                    "unit_price": "1200.00",
                    "discount": "500.00",
                }
            ],
        }
        create_resp = self.client.post("/api/v1/quotations/", quote_data, format="json")
        self.assertEqual(create_resp.status_code, status.HTTP_201_CREATED)
        quote_id = create_resp.data["id"]
        quote_number = create_resp.data["number"]
        self.assertTrue(quote_number.startswith("AZNr-QT-"))
        # 10 * 1200 - 500 = 11500
        self.assertEqual(Decimal(str(create_resp.data["total"])), Decimal("11500.00"))

        # Convert to job
        conv_resp = self.client.post(f"/api/v1/quotations/{quote_id}/convert-to-job/")
        self.assertEqual(conv_resp.status_code, status.HTTP_201_CREATED)
        job_number = conv_resp.data["number"]
        self.assertTrue(job_number.startswith("AZNr-JOB-"))
        self.assertEqual(Decimal(str(conv_resp.data["total"])), Decimal("11500.00"))

        # Verify snapshot pricing remains intact even if catalogue base_price changes
        self.service_vinyl.base_price = Decimal("2000.00")
        self.service_vinyl.save()

        job = Job.objects.get(number=job_number)
        job_item = job.items.first()
        self.assertEqual(job_item.unit_price, Decimal("1200.00"))

        # Check audit log
        self.assertTrue(AuditLog.objects.filter(action="CONVERT", entity="Quotation").exists())

    def test_03_branch_isolation_security(self):
        """Meru user cannot view or modify Nairobi's quotations or jobs."""
        quotation = Quotation.objects.create(
            number="NBI-QT-2026-9999",
            branch=self.branch_nbi,
            customer=self.customer_nbi,
            status="draft",
            total=Decimal("5000.00"),
            created_by=self.user_nbi_mgr,
        )

        # Authenticate as Meru user
        self.client.force_authenticate(user=self.user_mer_sales)
        resp = self.client.get(f"/api/v1/quotations/{quotation.id}/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

        # Owner CAN view
        self.client.force_authenticate(user=self.user_owner)
        owner_resp = self.client.get(f"/api/v1/quotations/{quotation.id}/")
        self.assertEqual(owner_resp.status_code, status.HTTP_200_OK)

    def test_quotation_creation_cannot_select_another_branch(self):
        self.client.force_authenticate(user=self.user_nbi_mgr)
        response = self.client.post("/api/v1/quotations/", {
            "branch": self.branch_mer.id,
            "customer": self.customer_nbi.id,
            "items": [{"service": self.service_vinyl.id, "description": "Restricted work", "quantity": "1", "unit_price": "100"}],
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_04_invoicing_payment_idempotency_and_separate_receipts(self):
        """Test invoice creation, idempotent payment processing, balances, and separate receipts."""
        self.client.force_authenticate(user=self.user_nbi_mgr)

        invoice = Invoice.objects.create(
            number="NBI-INV-2026-0001",
            branch=self.branch_nbi,
            customer=self.customer_nbi,
            status="issued",
            subtotal=Decimal("10000.00"),
            total=Decimal("10000.00"),
            balance_due=Decimal("10000.00"),
            created_by=self.user_nbi_mgr,
        )

        payment_data = {
            "branch": self.branch_nbi.id,
            "customer": self.customer_nbi.id,
            "method": "mpesa",
            "amount": "6000.00",
            "reference": "QKB81920AA",
            "idempotency_key": "IDEM-TEST-1001",
            "allocations": [
                {"invoice": invoice.id, "amount": "6000.00"}
            ],
        }

        # 1. Record payment
        pay_resp = self.client.post("/api/v1/payments/", payment_data, format="json")
        self.assertEqual(pay_resp.status_code, status.HTTP_201_CREATED)
        self.assertIn("receipt", pay_resp.data)
        receipt_num = pay_resp.data["receipt"]["number"]
        self.assertTrue(receipt_num.startswith("AZNr-REC-"))
        self.assertNotEqual(receipt_num, invoice.number)
        receipt = Receipt.objects.get(number=receipt_num)
        receipt_resp = self.client.get(f"/api/v1/receipts/{receipt.id}/")
        self.assertEqual(receipt_resp.status_code, status.HTTP_200_OK)

        # 2. Check invoice balance updated
        invoice.refresh_from_db()
        self.assertEqual(invoice.paid_amount, Decimal("6000.00"))
        self.assertEqual(invoice.balance_due, Decimal("4000.00"))
        self.assertEqual(invoice.status, "partially_paid")

        # 3. Test idempotency (replaying same request with same idempotency key)
        replay_resp = self.client.post("/api/v1/payments/", payment_data, format="json")
        self.assertEqual(replay_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(Payment.objects.filter(idempotency_key="IDEM-TEST-1001").count(), 1)

        over_allocation = {**payment_data, "amount": "5000.00", "reference": "OVER-ALLOC", "idempotency_key": "OVER-ALLOC-IDEM", "allocations": [{"invoice": invoice.id, "amount": "5000.00"}]}
        over_resp = self.client.post("/api/v1/payments/", over_allocation, format="json")
        self.assertEqual(over_resp.status_code, status.HTTP_400_BAD_REQUEST)

        invalid_amount = {**payment_data, "amount": "0.00", "reference": "ZERO-AMOUNT", "idempotency_key": "ZERO-AMOUNT-IDEM", "allocations": []}
        invalid_resp = self.client.post("/api/v1/payments/", invalid_amount, format="json")
        self.assertEqual(invalid_resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("greater than zero", str(invalid_resp.data).lower())

        self.client.force_authenticate(user=self.user_mer_sales)
        unauthorized_resp = self.client.post("/api/v1/payments/", payment_data, format="json")
        self.assertEqual(unauthorized_resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_payment_cannot_allocate_invoice_from_another_branch(self):
        meru_invoice = Invoice.objects.create(
            number="MER-INV-2026-0001",
            branch=self.branch_mer,
            customer=Customer.objects.create(
                name="Meru Billing Customer",
                phone="+254700000003",
                branch=self.branch_mer,
            ),
            status="issued",
            subtotal=Decimal("5000.00"),
            total=Decimal("5000.00"),
            balance_due=Decimal("5000.00"),
            created_by=self.user_mer_sales,
        )
        self.client.force_authenticate(user=self.user_nbi_mgr)
        response = self.client.post("/api/v1/payments/", {
            "branch": self.branch_nbi.id,
            "customer": self.customer_nbi.id,
            "method": "mpesa",
            "amount": "1000.00",
            "reference": "CROSS-BRANCH-1",
            "idempotency_key": "CROSS-BRANCH-IDEM-1",
            "allocations": [{"invoice": meru_invoice.id, "amount": "1000.00"}],
        }, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Payment.objects.filter(idempotency_key="CROSS-BRANCH-IDEM-1").exists())

    def test_05_expense_tracking_and_self_approval_policy(self):
        """Staff cannot approve their own expenses; separate tracking of incurred vs paid."""
        self.client.force_authenticate(user=self.user_nbi_mgr)

        # 1. Submit expense
        expense_data = {
            "branch": self.branch_nbi.id,
            "department": "graphics",
            "category": "production",
            "amount": "4500.00",
            "supplier": "Ink & Vinyl Supplies Co",
            "description": "Solvent ink refill",
            "date_incurred": "2026-10-19",
        }
        exp_resp = self.client.post("/api/v1/expenses/", expense_data, format="json")
        self.assertEqual(exp_resp.status_code, status.HTTP_201_CREATED)
        exp_id = exp_resp.data["id"]
        exp_num = exp_resp.data["expense_number"]
        self.assertTrue(exp_num.startswith("AZNr-EXP-"))

        # 2. Self-approval attempt must fail
        self_appr = self.client.post(f"/api/v1/expenses/{exp_id}/approve/")
        self.assertEqual(self_appr.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("cannot approve your own expense", self_appr.data["error"])

        # 3. Independent approval by Owner succeeds
        self.client.force_authenticate(user=self.user_owner)
        owner_appr = self.client.post(f"/api/v1/expenses/{exp_id}/approve/")
        self.assertEqual(owner_appr.status_code, status.HTTP_200_OK)
        self.assertEqual(owner_appr.data["status"], "approved")

        # 4. Mark as paid
        pay_exp = self.client.post(
            f"/api/v1/expenses/{exp_id}/pay/",
            {"date_paid": "2026-10-20", "payment_method": "mpesa", "notes": "M-Pesa Ref QJH928"},
            format="json",
        )
        self.assertEqual(pay_exp.status_code, status.HTTP_200_OK)
        self.assertEqual(pay_exp.data["status"], "paid")
        self.assertEqual(pay_exp.data["date_paid"], "2026-10-20")

        # 5. Dashboard summary endpoint
        summary_resp = self.client.get("/api/v1/expenses/summary/")
        self.assertEqual(summary_resp.status_code, status.HTTP_200_OK)
        self.assertIn("expenses_this_month", summary_resp.data)
        self.assertIn("paid_this_month", summary_resp.data)

    def test_06_branch_naming_prefixes_nairobi_and_meru(self):
        """Verify Nairobi generates AZNr-* and Meru generates AZMr-* across document numbers."""
        from apps.jobs.models import generate_job_number
        from apps.quotations.models import generate_quotation_number
        from apps.finance.models import generate_invoice_number, generate_receipt_number
        from apps.expenses.models import generate_expense_number

        # Nairobi tests (NBI -> AZNr)
        self.assertTrue(generate_job_number("NBI").startswith("AZNr-JOB-"))
        self.assertTrue(generate_quotation_number("NBI").startswith("AZNr-QT-"))
        self.assertTrue(generate_invoice_number("NBI").startswith("AZNr-INV-"))
        self.assertTrue(generate_receipt_number("NBI").startswith("AZNr-REC-"))
        self.assertTrue(generate_expense_number("NBI").startswith("AZNr-EXP-"))

        # Meru tests (MER -> AZMr)
        self.assertTrue(generate_job_number("MER").startswith("AZMr-JOB-"))
        self.assertTrue(generate_quotation_number("MER").startswith("AZMr-QT-"))
        self.assertTrue(generate_invoice_number("MER").startswith("AZMr-INV-"))
        self.assertTrue(generate_receipt_number("MER").startswith("AZMr-REC-"))
        self.assertTrue(generate_expense_number("MER").startswith("AZMr-EXP-"))

    def test_07_cnc_dashboard_uses_granular_permission_and_branch_scope(self):
        """CNC dashboard access follows the granular permission, not a role name."""
        url = "/api/v1/core/cnc-dashboard/"

        self.client.force_authenticate(user=self.user_designer)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.user_nbi_mgr)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_200_OK)

        cnc_role = Role.objects.create(code="cnc_operator", name="CNC Operator")
        cnc_role.permissions.add(Permission.objects.get(code="dashboard.cnc.view"))
        cnc_user = User.objects.create_user(email="cnc@atozgraphics.co.ke", password="Password123!")
        cnc_user.roles.add(cnc_role)
        self.client.force_authenticate(user=cnc_user)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_200_OK)

    def test_effective_permissions_union_multiple_roles(self):
        self.role_designer.permissions.add(Permission.objects.get(code="designs.submit"))
        self.user_designer.roles.add(self.role_sales)
        self.assertTrue(self.user_designer.roles.filter(code="sales_attendant").exists())
        self.assertTrue(self.user_designer.roles.filter(permissions__code="quotations.view").exists())
        self.assertTrue(self.user_designer.roles.filter(permissions__code="designs.submit").exists())

    def test_multiple_roles_persist_through_login_and_removing_one_role_updates_permissions(self):
        self.user_designer.roles.add(self.role_sales)
        login = self.client.post(reverse("token_obtain_pair"), {
            "email": "designer@atozgraphics.co.ke",
            "password": "Password123!",
            "branch": "NBI",
        })
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertCountEqual(login.data["user"]["roles"], ["designer", "sales_attendant"])
        self.assertIn("designs.submit", login.data["user"]["permissions"])
        self.assertIn("quotations.view", login.data["user"]["permissions"])

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")
        profile = self.client.get(reverse("user_profile"))
        self.assertEqual(profile.status_code, status.HTTP_200_OK)
        self.assertCountEqual(profile.data["roles"], ["designer", "sales_attendant"])
        self.assertIn("quotations.view", profile.data["permissions"])

        self.user_designer.roles.remove(self.role_sales)
        refreshed_profile = self.client.get(reverse("user_profile"))
        self.assertEqual(refreshed_profile.status_code, status.HTTP_200_OK)
        self.assertEqual(refreshed_profile.data["roles"], ["designer"])
        self.assertNotIn("quotations.view", refreshed_profile.data["permissions"])
        self.assertIn("designs.submit", refreshed_profile.data["permissions"])

    def test_design_list_is_branch_scoped_and_unauthorized_users_are_denied(self):
        nbi_job = Job.objects.create(number="AZNr-JOB-2026-9001", branch=self.branch_nbi, customer=self.customer_nbi, status="design_pending")
        meru_customer = Customer.objects.create(name="Meru Design Customer", phone="+254700000004", branch=self.branch_mer)
        meru_job = Job.objects.create(number="AZMr-JOB-2026-9001", branch=self.branch_mer, customer=meru_customer, status="design_pending")
        DesignAssignment.objects.create(job=nbi_job, designer=self.user_designer)
        meru_assignment = DesignAssignment.objects.create(job=meru_job, designer=self.user_designer)

        self.client.force_authenticate(user=self.user_designer)
        response = self.client.get("/api/v1/design-assignments/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([item["id"] for item in response.data["results"]], [DesignAssignment.objects.get(job=nbi_job).id])

        self.client.force_authenticate(user=self.user_mer_sales)
        self.assertEqual(self.client.get("/api/v1/design-assignments/").status_code, status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(user=self.user_nbi_mgr)
        self.assertEqual(self.client.get(f"/api/v1/design-assignments/{meru_assignment.id}/").status_code, status.HTTP_404_NOT_FOUND)

    def test_design_assignment_and_approval_enforce_permissions_and_branch(self):
        nbi_job = Job.objects.create(number="AZNr-JOB-2026-9002", branch=self.branch_nbi, customer=self.customer_nbi, status="design_pending")
        meru_customer = Customer.objects.create(name="Meru Design Customer 2", phone="+254700000005", branch=self.branch_mer)
        meru_job = Job.objects.create(number="AZMr-JOB-2026-9002", branch=self.branch_mer, customer=meru_customer, status="design_pending")

        self.client.force_authenticate(user=self.user_designer)
        denied_assignment = self.client.post("/api/v1/design-assignments/", {"job": nbi_job.id, "designer": self.user_designer.id}, format="json")
        self.assertEqual(denied_assignment.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(user=self.user_nbi_mgr)
        cross_branch = self.client.post("/api/v1/design-assignments/", {"job": meru_job.id, "designer": self.user_designer.id}, format="json")
        self.assertEqual(cross_branch.status_code, status.HTTP_403_FORBIDDEN)
        created = self.client.post("/api/v1/design-assignments/", {"job": nbi_job.id, "designer": self.user_designer.id}, format="json")
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        assignment_id = created.data["id"]

        self.client.force_authenticate(user=self.user_designer)
        self.assertEqual(self.client.post(f"/api/v1/design-assignments/{assignment_id}/approve/").status_code, status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(user=self.user_nbi_mgr)
        approved = self.client.post(f"/api/v1/design-assignments/{assignment_id}/approve/")
        self.assertEqual(approved.status_code, status.HTTP_200_OK)
        self.assertEqual(approved.data["status"], "approved")

    def test_audit_log_permission_and_branch_isolation(self):
        AuditLog.objects.create(user=self.user_nbi_mgr, branch=self.branch_nbi, action="CREATE", entity="Customer", entity_id="1", reason="Nairobi event")
        meru_log = AuditLog.objects.create(user=self.user_mer_sales, branch=self.branch_mer, action="CREATE", entity="Customer", entity_id="2", reason="Meru event")
        self.client.force_authenticate(user=self.user_designer)
        self.assertEqual(self.client.get("/api/v1/audit-logs/").status_code, status.HTTP_403_FORBIDDEN)
        self.client.force_authenticate(user=self.user_nbi_mgr)
        response = self.client.get("/api/v1/audit-logs/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(all(item["branch"] == self.branch_nbi.id for item in response.data["results"]))
        self.assertEqual(self.client.get(f"/api/v1/audit-logs/{meru_log.id}/").status_code, status.HTTP_404_NOT_FOUND)
