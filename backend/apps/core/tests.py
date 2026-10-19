from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.accounts.models import User, Role
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
        self.assertTrue(quote_number.startswith("NBI-QT-"))
        # 10 * 1200 - 500 = 11500
        self.assertEqual(Decimal(str(create_resp.data["total"])), Decimal("11500.00"))

        # Convert to job
        conv_resp = self.client.post(f"/api/v1/quotations/{quote_id}/convert-to-job/")
        self.assertEqual(conv_resp.status_code, status.HTTP_201_CREATED)
        job_number = conv_resp.data["number"]
        self.assertTrue(job_number.startswith("NBI-JOB-"))
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
        self.assertTrue(receipt_num.startswith("NBI-REC-"))
        self.assertNotEqual(receipt_num, invoice.number)

        # 2. Check invoice balance updated
        invoice.refresh_from_db()
        self.assertEqual(invoice.paid_amount, Decimal("6000.00"))
        self.assertEqual(invoice.balance_due, Decimal("4000.00"))
        self.assertEqual(invoice.status, "partially_paid")

        # 3. Test idempotency (replaying same request with same idempotency key)
        replay_resp = self.client.post("/api/v1/payments/", payment_data, format="json")
        self.assertEqual(replay_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(Payment.objects.filter(idempotency_key="IDEM-TEST-1001").count(), 1)

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
        self.assertTrue(exp_num.startswith("NBI-EXP-"))

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
