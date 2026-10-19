import hashlib
from django.conf import settings
from django.db import models
from apps.core.models import TimeStampedModel


class DesignAssignment(TimeStampedModel):
    STATUS_CHOICES = [
        ("assigned", "Assigned"),
        ("in_progress", "In Progress"),
        ("review_pending", "Pending Review"),
        ("revision_requested", "Revision Requested"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    job = models.ForeignKey(
        "jobs.Job",
        on_delete=models.CASCADE,
        related_name="design_assignments",
    )
    designer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="assigned_designs",
    )
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default="assigned",
        db_index=True,
    )
    due_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_designs",
    )
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Design for Job {self.job.number} ({self.get_status_display()})"


class DesignFile(TimeStampedModel):
    assignment = models.ForeignKey(
        DesignAssignment,
        on_delete=models.CASCADE,
        related_name="files",
    )
    version = models.PositiveIntegerField()
    file = models.FileField(upload_to="artwork/%Y/%m/")
    filename = models.CharField(max_length=255)
    checksum = models.CharField(max_length=64, blank=True, help_text="SHA-256 checksum")
    file_size = models.PositiveBigIntegerField(default=0)
    notes = models.TextField(blank=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
    )

    class Meta:
        ordering = ["-version"]
        unique_together = ("assignment", "version")

    def save(self, *args, **kwargs):
        if not self.version:
            latest_version = (
                DesignFile.objects.filter(assignment=self.assignment)
                .order_by("-version")
                .values_list("version", flat=True)
                .first()
            )
            self.version = (latest_version or 0) + 1

        if self.file and hasattr(self.file, "file"):
            try:
                # Calculate SHA-256 checksum
                hasher = hashlib.sha256()
                for chunk in self.file.chunks():
                    hasher.update(chunk)
                self.checksum = hasher.hexdigest()
                self.file_size = self.file.size
                if not self.filename:
                    self.filename = self.file.name
            except Exception:
                pass

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.assignment.job.number} - v{self.version} ({self.filename})"


class DesignComment(models.Model):
    assignment = models.ForeignKey(
        DesignAssignment,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
    )
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Comment by {self.author.email} on {self.assignment}"
