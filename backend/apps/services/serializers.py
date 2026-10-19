from rest_framework import serializers
from .models import ServiceCategory, Service


class ServiceCategorySerializer(serializers.ModelSerializer):
    services_count = serializers.IntegerField(source="services.count", read_only=True)

    class Meta:
        model = ServiceCategory
        fields = ["id", "name", "description", "is_active", "services_count", "created_at"]
        read_only_fields = ["id", "created_at"]


class ServiceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Service
        fields = [
            "id",
            "category",
            "category_name",
            "code",
            "name",
            "description",
            "unit",
            "base_price",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
