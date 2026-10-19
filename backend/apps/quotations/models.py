from datetime import datetime
from decimal import Decimal
from django.conf import settings
from django.db import models, transaction
from apps.core.models import BranchScopedModel, TimeStampedModel


def generate_quotation_number(branch_code):
    year = datetime.now().year
    prefix = f"{branch_code}-QT-{year}-"
    # Find the latest number for this branch and year
    last_quote = (
        Quotation.objects.filter(number__startswith=prefix)
        .order_by("-number")
        .values_list("number", flat=True)
        .first()
    )
    if last_quote:
        try:
            last_seq = int(last_quote.split("-")[-1])
            new_seq = last_seq + 1
        except ValueError:
            new_seq = 1
    else:
        new_seq = 1
    return f"{prefix}{new_seq:04d}"


class Quotation(BranchScopedModel):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("sent", "Sent to Customer"),
        ("accepted", "Accepted"),
        ("rejected", "Rejected"),
        ("expired", "Expired"),
        ("converted", "Converted to Job"),
    ]

    number = models.CharField(max_length=50, unique=True, db_index=True)
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.PROTECT,
        related_name="quotations",
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
    valid_until = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_quotations",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["branch", "status"]),
            models.Index(fields=["customer"]),
            models.Index(fields=["number"]),
        ]

    def __str__(self):
        return f"{self.number} - {self.customer.name} (KES {self.total})"

    def recalculate_totals(self):
        """Recalculates subtotal and total based on quotation items."""
        items_total = sum((item.total for item in self.items.all()), Decimal("0.00"))
        self.subtotal = items_total
        self.total = max(Decimal("0.00"), self.subtotal - self.discount + self.tax)
        self.save(update_fields=["subtotal", "total", "updated_at"])


class QuotationItem(TimeStampedModel):
    quotation = models.ForeignKey(
        Quotation,
        on_delete=models.CASCADE,
        related_name="items",
    )
    service = models.ForeignKey(
        "services.Service",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="quotation_items",
    )
    description = models.CharField(max_length=255, help_text="Snapshot description")
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("1.00"))
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, help_text="Price snapshot")
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ["id"]

    def save(self, *args, **kwargs):
        # Calculate line total: (qty * unit_price) - discount
        line_subtotal = self.quantity * self.unit_price
        self.total = max(Decimal("0.00"), line_subtotal - self.discount)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} ({self.quantity} @ {self.unit_price})"
