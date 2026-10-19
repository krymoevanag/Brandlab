from django.db import models
from apps.core.models import TimeStampedModel


class ServiceCategory(TimeStampedModel):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Service Category"
        verbose_name_plural = "Service Categories"

    def __str__(self):
        return self.name


class Service(TimeStampedModel):
    category = models.ForeignKey(
        ServiceCategory,
        on_delete=models.PROTECT,
        related_name="services",
    )
    code = models.SlugField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    unit = models.CharField(
        max_length=30,
        help_text="Measurement unit e.g. sqm, m, pcs, sheet, hour",
    )
    base_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Base price in KES per unit",
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["category__name", "name"]
        indexes = [
            models.Index(fields=["code"]),
            models.Index(fields=["name"]),
            models.Index(fields=["category", "is_active"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.code}) - KES {self.base_price}/{self.unit}"
