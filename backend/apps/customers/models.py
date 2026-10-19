from django.db import models
from apps.core.models import TimeStampedModel


class Customer(TimeStampedModel):
    CUSTOMER_TYPE_CHOICES = [
        ("individual", "Individual"),
        ("corporate", "Corporate / Business"),
    ]

    name = models.CharField(max_length=150, db_index=True)
    phone = models.CharField(max_length=30, db_index=True)
    email = models.EmailField(blank=True)
    customer_type = models.CharField(
        max_length=20,
        choices=CUSTOMER_TYPE_CHOICES,
        default="individual",
    )
    address = models.TextField(blank=True)
    branch = models.ForeignKey(
        "branches.Branch",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="customers",
        help_text="Primary branch where customer was registered",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["phone"]),
            models.Index(fields=["name"]),
            models.Index(fields=["branch"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.phone})"
