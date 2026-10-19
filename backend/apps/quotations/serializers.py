from rest_framework import serializers
from decimal import Decimal
from apps.branches.serializers import BranchSerializer
from apps.customers.serializers import CustomerSerializer
from apps.services.models import Service
from .models import Quotation, QuotationItem, generate_quotation_number


class QuotationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationItem
        fields = [
            "id",
            "service",
            "description",
            "quantity",
            "unit_price",
            "discount",
            "total",
        ]
        read_only_fields = ["id", "total"]


class QuotationSerializer(serializers.ModelSerializer):
    items = QuotationItemSerializer(many=True, required=False)
    branch_details = BranchSerializer(source="branch", read_only=True)
    customer_details = CustomerSerializer(source="customer", read_only=True)
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)

    class Meta:
        model = Quotation
        fields = [
            "id",
            "number",
            "branch",
            "branch_details",
            "customer",
            "customer_details",
            "status",
            "subtotal",
            "discount",
            "tax",
            "total",
            "valid_until",
            "notes",
            "created_by",
            "created_by_email",
            "items",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "number", "subtotal", "total", "created_by", "created_at", "updated_at"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        branch = validated_data.get("branch")
        validated_data["number"] = generate_quotation_number(branch.code)
        quotation = Quotation.objects.create(**validated_data)

        for item_data in items_data:
            QuotationItem.objects.create(quotation=quotation, **item_data)

        quotation.recalculate_totals()
        return quotation

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                QuotationItem.objects.create(quotation=instance, **item_data)
            instance.recalculate_totals()

        return instance
