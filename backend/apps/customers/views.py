from rest_framework import viewsets, permissions, filters
from rest_framework.exceptions import PermissionDenied, ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.permissions import get_user_branches, user_is_owner, RoleAccessPermission
from apps.audit.utils import log_audit
from .models import Customer
from .serializers import CustomerSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    """
    Customer Directory:
    Searchable across name, phone, email, address.
    """
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated, RoleAccessPermission]
    permission_access = {"list": "customers.view", "retrieve": "customers.view", "create": "customers.create", "update": "customers.edit", "partial_update": "customers.edit", "destroy": "customers.delete"}
    role_access = {"GET": ["branch_manager", "sales_attendant", "designer", "cnc_operator"], "POST": ["branch_manager", "sales_attendant"], "PUT": ["branch_manager", "sales_attendant"], "PATCH": ["branch_manager", "sales_attendant"], "DELETE": ["branch_manager"]}
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["customer_type", "branch", "is_active"]
    search_fields = ["name", "phone", "email", "address"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Customer.objects.none()
        
        queryset = Customer.objects.select_related("branch").filter(is_active=True)
        if user_is_owner(user):
            return queryset
        return queryset.filter(branch__in=get_user_branches(user))

    def perform_create(self, serializer):
        # Default customer's branch to user's default branch if not supplied
        branch = serializer.validated_data.get("branch")
        if not branch:
            branch = self.request.user.default_branch
        if not branch and not user_is_owner(self.request.user):
            raise ValidationError({"branch": "A permitted branch is required for this customer."})
        if branch and not user_is_owner(self.request.user) and not get_user_branches(self.request.user).filter(id=branch.id).exists():
            raise PermissionDenied("You cannot create a customer for this branch.")
        customer = serializer.save(branch=branch)

        log_audit(
            request_or_user=self.request,
            action="CREATE",
            entity="Customer",
            entity_id=customer.id,
            after=CustomerSerializer(customer).data,
            reason="Registered new customer",
            branch=customer.branch,
        )

    def perform_update(self, serializer):
        branch = serializer.validated_data.get("branch", serializer.instance.branch)
        if not branch and not user_is_owner(self.request.user):
            raise ValidationError({"branch": "A permitted branch is required for this customer."})
        if branch and not user_is_owner(self.request.user) and not get_user_branches(self.request.user).filter(id=branch.id).exists():
            raise PermissionDenied("You cannot move a customer to this branch.")
        old_data = CustomerSerializer(serializer.instance).data
        customer = serializer.save()
        log_audit(
            request_or_user=self.request,
            action="UPDATE",
            entity="Customer",
            entity_id=customer.id,
            before=old_data,
            after=CustomerSerializer(customer).data,
            reason="Updated customer details",
            branch=customer.branch,
        )
