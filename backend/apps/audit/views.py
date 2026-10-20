from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.permissions import user_is_owner, get_user_branches, RoleAccessPermission
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only viewset for immutable audit logs.
    Restricted to Owners and Superadmins.
    """
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, RoleAccessPermission]
    permission_access = {"list": "audit.view", "retrieve": "audit.view"}
    role_access = {"GET": ["owner"]}
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["action", "entity", "branch", "user"]
    search_fields = ["entity_id", "reason", "user__email"]
    ordering_fields = ["created_at", "action", "entity"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return AuditLog.objects.none()
        
        # Superuser and Owner can see all audit logs across all branches
        if user.is_superuser or user_is_owner(user):
            return AuditLog.objects.select_related("user", "branch").all()

        # Branch Manager / Finance Officer can see logs for their assigned branches
        branches = get_user_branches(user)
        return AuditLog.objects.filter(branch__in=branches).select_related("user", "branch")
