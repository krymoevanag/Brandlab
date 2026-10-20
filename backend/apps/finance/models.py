from datetime import datetime
from decimal import Decimal
from django.conf import settings
from django.db import models, transaction
from django.utils import timezone
from apps.core.models import BranchScopedModel, TimeStampedModel
from apps.core.utils import get_branch_prefix


def generate_invoice_number(branch_code):
    year = datetime.now().year
    b_prefix = get_branch_prefix(branch_code)
    prefix = f"{b_prefix}-INV-{year}-"
    last_inv = (
        Invoice.objects.filter(number__startswith=prefix)
        .order_by("-number")
        .values_list("number", flat=True)
        .first()
    )
    if last_inv:
        try:
            last_seq = int(last_inv.split("-")[-1])
            new_seq = last_seq + 1
        except ValueError:
            new_seq = 1
    else:
        new_seq = 1
    return f"{prefix}{new_seq:04d}"


def generate_receipt_number(branch_code):
    year = datetime.now().year
    b_prefix = get_branch_prefix(branch_code)
    prefix = f"{b_prefix}-REC-{year}-"
    last_rec = (
        Receipt.objects.filter(number__startswith=prefix)
        .order_by("-number")
        .values_list("number", flat=True)
        .first()
    )
    if last_rec:
        try:
            last_seq = int(last_rec.split("-")[-1])
            new_seq = last_seq + 1
        except ValueError:
            new_seq = 1
    else:
        new_seq = 1
    return f"{prefix}{new_seq:04d}"


class Invoice(BranchScopedModel):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("issued", "Issued"),
        ("partially_paid", "Partially Paid"),
        ("paid", "Paid in Full"),
        ("voided", "Voided"),
        ("cancelled", "Cancelled"),
    ]

    number = models.CharField(max_length=50, unique=True, db_index=True)
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.PROTECT,
        related_name="invoices",
    )
    job = models.ForeignKey(
        "jobs.Job",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="invoices",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="draft",
        db_index=True,
    )
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    due_at = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_invoices",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["branch", "status"]),
            models.Index(fields=["customer"]),
            models.Index(fields=["number"]),
        ]

    def __str__(self):
        return f"{self.number} - {self.customer.name} (Total: KES {self.total}, Due: KES {self.balance_due})"

    def update_balance(self):
        """Recalculates paid_amount and balance_due based on valid payment allocations."""
        total_paid = sum(
            (alloc.amount for alloc in self.allocations.filter(payment__status="completed")),
            Decimal("0.00"),
        )
        self.paid_amount = total_paid
        self.balance_due = max(Decimal("0.00"), self.total - self.paid_amount)
        if self.balance_due == Decimal("0.00") and self.total > Decimal("0.00"):
            self.status = "paid"
        elif self.paid_amount > Decimal("0.00"):
            self.status = "partially_paid"
        elif self.status in ["partially_paid", "paid"]:
            self.status = "issued"
        self.save(update_fields=["paid_amount", "balance_due", "status", "updated_at"])


class Payment(BranchScopedModel):
    METHOD_CHOICES = [
        ("mpesa", "M-Pesa"),
        ("cash", "Cash"),
        ("bank_transfer", "Bank Transfer"),
    ]

    STATUS_CHOICES = [
        ("completed", "Completed"),
        ("reversed", "Reversed"),
        ("refunded", "Refunded"),
    ]

    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.PROTECT,
        related_name="payments",
    )
    method = models.CharField(max_length=20, choices=METHOD_CHOICES, db_index=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    reference = models.CharField(
        max_length=100,
        blank=True,
        help_text="M-Pesa transaction code, bank reference, etc.",
    )
    idempotency_key = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Prevents duplicate transaction processing",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="completed",
        db_index=True,
    )
    received_at = models.DateTimeField(default=timezone.now)
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="recorded_payments",
    )
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-received_at"]
        indexes = [
            models.Index(fields=["branch", "status"]),
            models.Index(fields=["reference"]),
            models.Index(fields=["idempotency_key"]),
        ]

    def __str__(self):
        return f"Payment {self.id} - KES {self.amount} via {self.get_method_display()} ({self.reference})"


class PaymentAllocation(models.Model):
    payment = models.ForeignKey(
        Payment,
        on_delete=models.PROTECT,
        related_name="allocations",
    )
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.PROTECT,
        related_name="allocations",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Allocated KES {self.amount} from Payment {self.payment_id} to {self.invoice.number}"


class Receipt(BranchScopedModel):
    number = models.CharField(max_length=50, unique=True, db_index=True)
    payment = models.OneToOneField(
        Payment,
        on_delete=models.PROTECT,
        related_name="receipt",
    )
    invoice = models.ForeignKey(
        Invoice,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="receipts",
    )
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.PROTECT,
        related_name="receipts",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="issued_receipts",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["branch", "number"]),
            models.Index(fields=["customer"]),
        ]

    def __str__(self):
        return f"Receipt {self.number} for Payment {self.payment_id} (KES {self.payment.amount})"
