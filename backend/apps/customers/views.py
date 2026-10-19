from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.permissions import get_user_branches, user_is_owner
from apps.audit.utils import log_audit
from .models import Customer
from .serializers import CustomerSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    """
    Customer Directory:
    Searchable across name, phone, email, address.
    """
    serializer_class = CustomerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["customer_type", "branch", "is_active"]
    search_fields = ["name", "phone", "email", "address"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Customer.objects.none()
        
        # Customers can be viewed across branches, but can be filtered by branch affinity
        return Customer.objects.select_related("branch").filter(is_active=True)

    def perform_create(self, serializer):
        # Default customer's branch to user's default branch if not supplied
        branch = serializer.validated_data.get("branch")
        if not branch and self.request.user.default_branch:
            customer = serializer.save(branch=self.request.user.default_branch)
        else:
            customer = serializer.save()

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
