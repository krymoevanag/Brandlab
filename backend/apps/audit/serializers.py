from rest_framework import serializers
from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    branch_code = serializers.CharField(source="branch.code", read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            "id",
            "user",
            "user_email",
            "branch",
            "branch_name",
            "branch_code",
            "action",
            "entity",
            "entity_id",
            "before",
            "after",
            "reason",
            "ip_address",
            "created_at",
        ]
        read_only_fields = fields
