from rest_framework import serializers
from decimal import Decimal
from apps.branches.serializers import BranchSerializer
from apps.customers.serializers import CustomerSerializer
from .models import Invoice, Payment, PaymentAllocation, Receipt, generate_invoice_number, generate_receipt_number


class PaymentAllocationSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source="invoice.number", read_only=True)

    class Meta:
        model = PaymentAllocation
        fields = ["id", "invoice", "invoice_number", "amount", "created_at"]
        read_only_fields = ["id", "created_at"]


class ReceiptSerializer(serializers.ModelSerializer):
    payment_amount = serializers.DecimalField(source="payment.amount", max_digits=12, decimal_places=2, read_only=True)
    payment_method = serializers.CharField(source="payment.method", read_only=True)
    payment_reference = serializers.CharField(source="payment.reference", read_only=True)
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = Receipt
        fields = [
            "id",
            "number",
            "branch",
            "branch_name",
            "customer",
            "customer_name",
            "payment",
            "payment_amount",
            "payment_method",
            "payment_reference",
            "invoice",
            "created_by",
            "created_at",
        ]
        read_only_fields = fields


class InvoiceSerializer(serializers.ModelSerializer):
    allocations = PaymentAllocationSerializer(many=True, read_only=True)
    branch_details = BranchSerializer(source="branch", read_only=True)
    customer_details = CustomerSerializer(source="customer", read_only=True)
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)

    class Meta:
        model = Invoice
        fields = [
            "id",
            "number",
            "branch",
            "branch_details",
            "customer",
            "customer_details",
            "job",
            "status",
            "subtotal",
            "discount",
            "tax",
            "total",
            "paid_amount",
            "balance_due",
            "due_at",
            "notes",
            "created_by",
            "created_by_email",
            "allocations",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "number",
            "paid_amount",
            "balance_due",
            "created_by",
            "created_at",
            "updated_at",
        ]

    def create(self, validated_data):
        branch = validated_data.get("branch")
        validated_data["number"] = generate_invoice_number(branch.code)
        subtotal = validated_data.get("subtotal", Decimal("0.00"))
        discount = validated_data.get("discount", Decimal("0.00"))
        tax = validated_data.get("tax", Decimal("0.00"))
        validated_data["total"] = max(Decimal("0.00"), subtotal - discount + tax)
        validated_data["balance_due"] = validated_data["total"]
        return super().create(validated_data)


class PaymentSerializer(serializers.ModelSerializer):
    allocations = PaymentAllocationSerializer(many=True, read_only=True)
    receipt = ReceiptSerializer(read_only=True)
    branch_details = BranchSerializer(source="branch", read_only=True)
    customer_details = CustomerSerializer(source="customer", read_only=True)
    recorded_by_email = serializers.EmailField(source="recorded_by.email", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "branch",
            "branch_details",
            "customer",
            "customer_details",
            "method",
            "amount",
            "reference",
            "idempotency_key",
            "status",
            "received_at",
            "recorded_by",
            "recorded_by_email",
            "notes",
            "allocations",
            "receipt",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "recorded_by", "created_at", "updated_at"]
