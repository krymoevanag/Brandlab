from rest_framework import viewsets, permissions, filters
from apps.core.permissions import user_is_owner, IsOwnerOrSuperAdmin
from apps.audit.utils import log_audit
from .models import Branch
from .serializers import BranchSerializer


class BranchViewSet(viewsets.ModelViewSet):
    """
    CRUD for branches.
    Only Owner / Super Admin can create, update, or deactivate branches.
    All authenticated staff can view branches they have access to.
    """
    serializer_class = BranchSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["code", "name", "address"]
    ordering_fields = ["code", "name", "created_at"]
    ordering = ["name"]

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsOwnerOrSuperAdmin()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Branch.objects.none()
        if user.is_superuser or user_is_owner(user):
            return Branch.objects.all()
        # Non-owners only see branches they are assigned to and active
        return user.branches.filter(is_active=True)

    def perform_create(self, serializer):
        branch = serializer.save()
        log_audit(
            request_or_user=self.request,
            action="CREATE",
            entity="Branch",
            entity_id=branch.id,
            after=serializer.data,
            reason="Created new branch",
            branch=branch,
        )

    def perform_update(self, serializer):
        old_data = BranchSerializer(serializer.instance).data
        branch = serializer.save()
        log_audit(
            request_or_user=self.request,
            action="UPDATE",
            entity="Branch",
            entity_id=branch.id,
            before=old_data,
            after=serializer.data,
            reason="Updated branch details",
            branch=branch,
        )
