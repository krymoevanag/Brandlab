from rest_framework import permissions
from decimal import Decimal
from django.db import models


def user_has_role(user, role_codes):
    """Check if user has any of the given role codes."""
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    if isinstance(role_codes, str):
        role_codes = [role_codes]
    return user.roles.filter(code__in=role_codes).exists()


def user_is_owner(user):
    return user_has_role(user, ["owner", "superadmin"])


def user_has_permission(user, permission_code):
    """Return whether a user has a catalog permission through any assigned role."""
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser or user_is_owner(user):
        return True
    return user.roles.filter(permissions__code=permission_code).exists()


def user_has_business_unit(user, business_unit_code):
    """Owners can access all units; other users need an explicit business scope."""
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser or user_is_owner(user):
        return True
    return user.business_units.filter(code=business_unit_code, is_active=True).exists()


def user_within_approval_limit(user, action, amount, branch=None):
    """Check a configured approval ceiling; no configured ceiling preserves role access."""
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser or user_is_owner(user):
        return True
    from apps.accounts.models import ApprovalLimit
    limits = ApprovalLimit.objects.filter(
        role__users=user,
        action=action,
        is_active=True,
    ).filter(models.Q(branch__isnull=True) | models.Q(branch=branch))
    if not limits.exists():
        return True
    return limits.filter(max_amount__gte=Decimal(str(amount))).exists()


def get_user_branches(user):
    """Returns queryset of branches accessible by user. For owner/superuser, returns all branches."""
    from apps.branches.models import Branch
    if not user or not user.is_authenticated:
        return Branch.objects.none()
    if user.is_superuser or user_is_owner(user):
        return Branch.objects.all()
    return user.branches.all()


class IsOwnerOrSuperAdmin(permissions.BasePermission):
    """Allows access only to Superadmins or Users with the Owner role."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and user_is_owner(request.user))


class HasRolePermission(permissions.BasePermission):
    """Requires user to have at least one of the roles defined on the view `required_roles`."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_superuser or user_is_owner(request.user):
            return True
        required_roles = getattr(view, "required_roles", None)
        if not required_roles:
            return True
        return user_has_role(request.user, required_roles)


class RoleAccessPermission(permissions.BasePermission):
    """Authorize a view using its ``role_access`` HTTP-method mapping."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser or user_is_owner(user):
            return True
        permission_access = getattr(view, "permission_access", {})
        access_key = getattr(view, "action", None) or request.method
        required_permission = permission_access.get(access_key) or permission_access.get(request.method)
        if required_permission:
            return user_has_permission(user, required_permission)

        role_access = getattr(view, "role_access", {})
        required_roles = role_access.get(request.method) or role_access.get("*")
        return bool(required_roles and user_has_role(user, required_roles))


class BranchScopedPermission(permissions.BasePermission):
    """
    Enforces branch isolation:
    - User can only view or modify objects belonging to their assigned branches.
    - Superusers and Owners can access all branches.
    """

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser or user_is_owner(request.user):
            return True
        
        branch = getattr(obj, "branch", None)
        if branch is None and hasattr(obj, "branch_id"):
            branch_id = obj.branch_id
            return request.user.branches.filter(id=branch_id).exists()
        if branch is not None:
            return request.user.branches.filter(id=branch.id).exists()
        
        return True
