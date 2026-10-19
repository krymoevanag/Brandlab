from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base model that provides self-updating created_at and updated_at fields."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class BranchScopedModel(TimeStampedModel):
    """Abstract base model for models that belong to a specific branch."""
    branch = models.ForeignKey(
        "branches.Branch",
        on_delete=models.PROTECT,
        related_name="%(app_label)s_%(class)s_set",
    )

    class Meta:
        abstract = True
