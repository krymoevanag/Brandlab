from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ("CREATE", "Create"),
        ("UPDATE", "Update"),
        ("DELETE", "Delete"),
        ("APPROVE", "Approve"),
        ("REJECT", "Reject"),
        ("VOID", "Void / Cancel"),
        ("REVERSE", "Reverse"),
        ("EXPORT", "Export"),
        ("LOGIN", "Login"),
        ("PAYMENT", "Payment"),
        ("CONVERT", "Convert Quotation to Job"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
    )
    branch = models.ForeignKey(
        "branches.Branch",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="audit_logs",
    )
    action = models.CharField(max_length=30, choices=ACTION_CHOICES, db_index=True)
    entity = models.CharField(max_length=100, db_index=True)
    entity_id = models.CharField(max_length=100, db_index=True)
    before = models.JSONField(default=dict, blank=True)
    after = models.JSONField(default=dict, blank=True)
    reason = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        indexes = [
            models.Index(fields=["entity", "entity_id"]),
            models.Index(fields=["branch", "action"]),
        ]

    def __str__(self):
        user_email = self.user.email if self.user else "System"
        return f"{self.action} on {self.entity} #{self.entity_id} by {user_email} at {self.created_at}"
