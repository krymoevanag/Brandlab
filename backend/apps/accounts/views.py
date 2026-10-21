from rest_framework import viewsets, permissions, filters, status, serializers
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from apps.core.permissions import IsOwnerOrSuperAdmin
from apps.audit.utils import log_audit
from apps.branches.models import Branch
from apps.branches.serializers import BranchSerializer
from apps.core.permissions import user_is_owner
from .models import BusinessUnit, User, Role
from .serializers import (
    UserSerializer,
    UserCreateUpdateSerializer,
    UserProfileSerializer,
    RoleSerializer,
    BusinessUnitSerializer,
)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    branch = serializers.CharField(write_only=True, required=False)

    def validate(self, attrs):
        selected_branch_code = attrs.pop("branch", None)
        data = super().validate(attrs)
        # Check active status
        if not self.user.is_active:
            raise permissions.exceptions.AuthenticationFailed("This account is inactive.")

        selected_branch = None
        if selected_branch_code:
            try:
                selected_branch = Branch.objects.get(code__iexact=selected_branch_code, is_active=True)
            except Branch.DoesNotExist as exc:
                raise permissions.exceptions.AuthenticationFailed("The selected branch is not available.") from exc
            if not (self.user.is_superuser or user_is_owner(self.user)) and not self.user.branches.filter(id=selected_branch.id).exists():
                raise permissions.exceptions.AuthenticationFailed("You are not assigned to the selected branch.")
        
        # Attach user summary in token response
        data["user"] = UserProfileSerializer(self.user).data
        if selected_branch is not None:
            data["user"]["default_branch"] = BranchSerializer(selected_branch).data
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


from drf_spectacular.utils import extend_schema


class UserProfileView(APIView):
    """
    Returns profile information of the currently authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserProfileSerializer

    @extend_schema(responses={200: UserProfileSerializer})
    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)


class RoleViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List and retrieve available system roles.
    """
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering = ["name"]


class BusinessUnitViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BusinessUnit.objects.filter(is_active=True)
    serializer_class = BusinessUnitSerializer
    permission_classes = [permissions.IsAuthenticated]


class UserViewSet(viewsets.ModelViewSet):
    """
    User Management:
    Strictly restricted to Superadmins and Owners.
    Every creation, update, role/branch assignment, and deactivation is audited.
    """
    queryset = User.objects.prefetch_related("roles", "branches").select_related("default_branch").all()
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrSuperAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["email", "first_name", "last_name", "phone_number"]
    ordering_fields = ["email", "date_joined", "is_active"]
    ordering = ["email"]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return UserCreateUpdateSerializer
        return UserSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        log_audit(
            request_or_user=self.request,
            action="CREATE",
            entity="User",
            entity_id=user.id,
            after={"email": user.email, "roles": list(user.roles.values_list("code", flat=True))},
            reason="Created new user account",
        )

    def perform_update(self, serializer):
        old_user = self.get_object()
        old_data = {
            "email": old_user.email,
            "is_active": old_user.is_active,
            "roles": list(old_user.roles.values_list("code", flat=True)),
            "branches": list(old_user.branches.values_list("code", flat=True)),
        }
        user = serializer.save()
        new_data = {
            "email": user.email,
            "is_active": user.is_active,
            "roles": list(user.roles.values_list("code", flat=True)),
            "branches": list(user.branches.values_list("code", flat=True)),
        }
        log_audit(
            request_or_user=self.request,
            action="UPDATE",
            entity="User",
            entity_id=user.id,
            before=old_data,
            after=new_data,
            reason="Updated user account, roles, or branch assignments",
        )
