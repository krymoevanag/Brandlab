from datetime import datetime
from decimal import Decimal
from django.conf import settings
from django.db import models
from apps.core.models import BranchScopedModel, TimeStampedModel


def generate_job_number(branch_code):
    year = datetime.now().year
    prefix = f"{branch_code}-JOB-{year}-"
    last_job = (
        Job.objects.filter(number__startswith=prefix)
        .order_by("-number")
        .values_list("number", flat=True)
        .first()
    )
    if last_job:
        try:
            last_seq = int(last_job.split("-")[-1])
            new_seq = last_seq + 1
        except ValueError:
            new_seq = 1
    else:
        new_seq = 1
    return f"{prefix}{new_seq:04d}"


class Job(BranchScopedModel):
    STATUS_CHOICES = [
        ("pending_deposit", "Pending Deposit"),
        ("design_pending", "Design / Artwork Pending"),
        ("design_approved", "Design Approved"),
        ("in_production", "In Production"),
        ("quality_check", "Quality Check"),
        ("ready_for_delivery", "Ready for Delivery / Collection"),
        ("delivered", "Delivered / Completed"),
        ("cancelled", "Cancelled"),
    ]

    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("normal", "Normal"),
        ("high", "High"),
        ("urgent", "Urgent"),
    ]

    number = models.CharField(max_length=50, unique=True, db_index=True)
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.PROTECT,
        related_name="jobs",
    )
    quotation = models.ForeignKey(
        "quotations.Quotation",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="jobs",
    )
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="pending_deposit",
        db_index=True,
    )
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default="normal",
        db_index=True,
    )
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    total = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    due_at = models.DateTimeField(null=True, blank=True, db_index=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_jobs",
    )

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["branch", "status"]),
            models.Index(fields=["customer"]),
            models.Index(fields=["number"]),
            models.Index(fields=["due_at"]),
        ]

    def __str__(self):
        return f"{self.number} - {self.customer.name} ({self.get_status_display()})"

    def recalculate_totals(self):
        """Recalculates subtotal and total based on job items."""
        items_total = sum((item.line_total for item in self.items.all()), Decimal("0.00"))
        self.subtotal = items_total
        self.total = max(Decimal("0.00"), self.subtotal - self.discount + self.tax)
        self.save(update_fields=["subtotal", "total", "updated_at"])


class JobItem(TimeStampedModel):
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name="items",
    )
    service = models.ForeignKey(
        "services.Service",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="job_items",
    )
    description = models.CharField(max_length=255, help_text="Snapshot description")
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("1.00"))
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, help_text="Price snapshot")
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    line_total = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        ordering = ["id"]

    def save(self, *args, **kwargs):
        line_subtotal = self.quantity * self.unit_price
        self.line_total = max(Decimal("0.00"), line_subtotal - self.discount)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} ({self.quantity} @ {self.unit_price})"


class JobStatusHistory(models.Model):
    job = models.ForeignKey(
        Job,
        on_delete=models.CASCADE,
        related_name="status_history",
    )
    from_status = models.CharField(max_length=30)
    to_status = models.CharField(max_length=30)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )
    reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.job.number}: {self.from_status} -> {self.to_status}"
