from rest_framework import serializers
from decimal import Decimal
from apps.branches.serializers import BranchSerializer
from apps.customers.serializers import CustomerSerializer
from .models import Job, JobItem, JobStatusHistory, generate_job_number


class JobItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobItem
        fields = [
            "id",
            "service",
            "description",
            "quantity",
            "unit_price",
            "discount",
            "line_total",
        ]
        read_only_fields = ["id", "line_total"]


class JobStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.EmailField(source="changed_by.email", read_only=True)

    class Meta:
        model = JobStatusHistory
        fields = [
            "id",
            "from_status",
            "to_status",
            "changed_by",
            "changed_by_email",
            "reason",
            "created_at",
        ]
        read_only_fields = fields


class JobSerializer(serializers.ModelSerializer):
    items = JobItemSerializer(many=True, required=False)
    status_history = JobStatusHistorySerializer(many=True, read_only=True)
    branch_details = BranchSerializer(source="branch", read_only=True)
    customer_details = CustomerSerializer(source="customer", read_only=True)
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)

    class Meta:
        model = Job
        fields = [
            "id",
            "number",
            "branch",
            "branch_details",
            "customer",
            "customer_details",
            "quotation",
            "status",
            "priority",
            "subtotal",
            "discount",
            "tax",
            "total",
            "due_at",
            "notes",
            "created_by",
            "created_by_email",
            "items",
            "status_history",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "number", "subtotal", "total", "created_by", "created_at", "updated_at"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        branch = validated_data.get("branch")
        validated_data["number"] = generate_job_number(branch.code)
        job = Job.objects.create(**validated_data)

        for item_data in items_data:
            JobItem.objects.create(job=job, **item_data)

        job.recalculate_totals()
        return job

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                JobItem.objects.create(job=instance, **item_data)
            instance.recalculate_totals()

        return instance
