from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.permissions import IsOwnerOrSuperAdmin
from apps.audit.utils import log_audit
from .models import ServiceCategory, Service
from .serializers import ServiceCategorySerializer, ServiceSerializer


class ServiceCategoryViewSet(viewsets.ModelViewSet):
    queryset = ServiceCategory.objects.all()
    serializer_class = ServiceCategorySerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    ordering = ["name"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOwnerOrSuperAdmin()]

    def perform_create(self, serializer):
        category = serializer.save()
        log_audit(
            request_or_user=self.request,
            action="CREATE",
            entity="ServiceCategory",
            entity_id=category.id,
            after=serializer.data,
            reason="Added service category",
        )

    def perform_update(self, serializer):
        old_data = ServiceCategorySerializer(serializer.instance).data
        category = serializer.save()
        log_audit(
            request_or_user=self.request,
            action="UPDATE",
            entity="ServiceCategory",
            entity_id=category.id,
            before=old_data,
            after=serializer.data,
            reason="Updated service category",
        )


class ServiceViewSet(viewsets.ModelViewSet):
    """
    Service Catalogue & Base Pricing.
    Read-only for regular staff; CRUD restricted to Owner / Super Admin.
    """
    queryset = Service.objects.select_related("category").all()
    serializer_class = ServiceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category", "is_active", "unit"]
    search_fields = ["code", "name", "description"]
    ordering_fields = ["name", "base_price", "created_at"]
    ordering = ["name"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOwnerOrSuperAdmin()]

    def perform_create(self, serializer):
        service = serializer.save()
        log_audit(
            request_or_user=self.request,
            action="CREATE",
            entity="Service",
            entity_id=service.id,
            after=serializer.data,
            reason="Added service to catalogue",
        )

    def perform_update(self, serializer):
        old_data = ServiceSerializer(serializer.instance).data
        service = serializer.save()
        log_audit(
            request_or_user=self.request,
            action="UPDATE",
            entity="Service",
            entity_id=service.id,
            before=old_data,
            after=serializer.data,
            reason="Updated service catalogue item or price",
        )
