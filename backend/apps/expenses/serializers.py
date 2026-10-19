from rest_framework import serializers
from apps.branches.serializers import BranchSerializer
from .models import Expense, generate_expense_number


class ExpenseSerializer(serializers.ModelSerializer):
    branch_details = BranchSerializer(source="branch", read_only=True)
    submitted_by_email = serializers.EmailField(source="submitted_by.email", read_only=True)
    approved_by_email = serializers.EmailField(source="approved_by.email", read_only=True)
    job_number = serializers.CharField(source="job.number", read_only=True)
    receipt_file_url = serializers.FileField(source="receipt_file", read_only=True)

    class Meta:
        model = Expense
        fields = [
            "id",
            "expense_number",
            "branch",
            "branch_details",
            "department",
            "category",
            "amount",
            "supplier",
            "description",
            "date_incurred",
            "date_paid",
            "payment_method",
            "status",
            "submitted_by",
            "submitted_by_email",
            "approved_by",
            "approved_by_email",
            "approved_at",
            "job",
            "job_number",
            "receipt_file",
            "receipt_file_url",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "expense_number",
            "submitted_by",
            "approved_by",
            "approved_at",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        branch = validated_data.get("branch")
        validated_data["expense_number"] = generate_expense_number(branch.code)
        return super().create(validated_data)
