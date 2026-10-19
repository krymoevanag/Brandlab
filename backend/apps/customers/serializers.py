from rest_framework import serializers
from apps.branches.serializers import BranchSerializer
from .models import Customer


class CustomerSerializer(serializers.ModelSerializer):
    branch_details = BranchSerializer(source="branch", read_only=True)

    class Meta:
        model = Customer
        fields = [
            "id",
            "name",
            "phone",
            "email",
            "customer_type",
            "address",
            "branch",
            "branch_details",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
