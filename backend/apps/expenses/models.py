from datetime import datetime
from decimal import Decimal
from django.conf import settings
from django.db import models
from apps.core.models import BranchScopedModel, TimeStampedModel


def generate_expense_number(branch_code):
    year = datetime.now().year
    prefix = f"{branch_code}-EXP-{year}-"
    last_exp = (
        Expense.objects.filter(expense_number__startswith=prefix)
        .order_by("-expense_number")
        .values_list("expense_number", flat=True)
        .first()
    )
    if last_exp:
        try:
            last_seq = int(last_exp.split("-")[-1])
            new_seq = last_seq + 1
        except ValueError:
            new_seq = 1
    else:
        new_seq = 1
    return f"{prefix}{new_seq:04d}"


class Expense(BranchScopedModel):
    DEPARTMENT_CHOICES = [
        ("graphics", "Graphics & Printing"),
        ("cnc", "CNC Services"),
        ("administration", "Administration & Office"),
        ("transport", "Transport & Logistics"),
        ("sales", "Sales & Marketing"),
    ]

    CATEGORY_CHOICES = [
        ("operating", "Operating (Rent, Electricity, Water, Internet, Security)"),
        ("production", "Production (Consumables, Ink, Vinyl, Blades, Outsourced)"),
        ("transport", "Transport & Delivery (Fuel, Repairs, Courier, Delivery)"),
        ("staff", "Staff & Administration (Salaries, Casual Labour, Allowances, Supplies)"),
        ("equipment", "Equipment & Maintenance (Repairs, Subscriptions, Licences)"),
        ("other", "Other Miscellaneous"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending Approval"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("paid", "Paid"),
    ]

    PAYMENT_METHOD_CHOICES = [
        ("cash", "Cash"),
        ("mpesa", "M-Pesa"),
        ("bank_transfer", "Bank Transfer"),
    ]

    expense_number = models.CharField(max_length=50, unique=True, db_index=True)
    department = models.CharField(max_length=30, choices=DEPARTMENT_CHOICES, db_index=True)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, db_index=True)
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Amount in KES",
    )
    supplier = models.CharField(
        max_length=150,
        help_text="Supplier or recipient who received the funds",
    )
    description = models.TextField(help_text="Item purchased or service paid for")
    date_incurred = models.DateField(help_text="Date when expense occurred")
    date_paid = models.DateField(null=True, blank=True, help_text="Date payment occurred")
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        null=True,
        blank=True,
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
        db_index=True,
    )
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="submitted_expenses",
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_expenses",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    job = models.ForeignKey(
        "jobs.Job",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="expenses",
        help_text="Optional link to specific job costing",
    )
    receipt_file = models.FileField(
        upload_to="receipts/%Y/%m/",
        null=True,
        blank=True,
        help_text="Supporting receipt or bill attachment",
    )
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-date_incurred", "-created_at"]
        indexes = [
            models.Index(fields=["branch", "status"]),
            models.Index(fields=["date_incurred"]),
            models.Index(fields=["category", "department"]),
            models.Index(fields=["expense_number"]),
        ]

    def __str__(self):
        return f"{self.expense_number} - {self.supplier}: KES {self.amount} ({self.get_status_display()})"
