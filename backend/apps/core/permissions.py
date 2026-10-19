from rest_framework import permissions


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
