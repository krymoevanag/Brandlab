from django.db import transaction
from rest_framework import viewsets, permissions, filters, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.permissions import get_user_branches, user_is_owner, RoleAccessPermission
from apps.audit.utils import log_audit
from apps.jobs.models import Job, JobItem, JobStatusHistory, generate_job_number
from apps.jobs.serializers import JobSerializer
from .models import Quotation, QuotationItem
from .serializers import QuotationSerializer


class QuotationViewSet(viewsets.ModelViewSet):
    """
    Quotation Management:
    - Branch-scoped access.
    - Snapshot pricing on all lines.
    - 1-step atomic conversion to Job.
    """
    serializer_class = QuotationSerializer
    permission_classes = [permissions.IsAuthenticated, RoleAccessPermission]
    permission_access = {"list": "quotations.view", "retrieve": "quotations.view", "create": "quotations.create", "update": "quotations.edit", "partial_update": "quotations.edit", "destroy": "quotations.delete", "convert_to_job": "jobs.create"}
    role_access = {"GET": ["branch_manager", "sales_attendant", "designer", "cnc_operator"], "POST": ["branch_manager", "sales_attendant"], "PUT": ["branch_manager", "sales_attendant"], "PATCH": ["branch_manager", "sales_attendant"], "DELETE": ["branch_manager"]}
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["branch", "customer", "status"]
    search_fields = ["number", "customer__name", "customer__phone"]
    ordering_fields = ["created_at", "total", "valid_until"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Quotation.objects.none()
        if user.is_superuser or user_is_owner(user):
            return Quotation.objects.select_related("branch", "customer", "created_by").prefetch_related("items").all()
        branches = get_user_branches(user)
        return (
            Quotation.objects.filter(branch__in=branches)
            .select_related("branch", "customer", "created_by")
            .prefetch_related("items")
        )

    def perform_create(self, serializer):
        branch = serializer.validated_data.get("branch")
        customer = serializer.validated_data.get("customer")
        user = self.request.user
        if not (user.is_superuser or user_is_owner(user)):
            permitted = get_user_branches(user)
            if not branch or not permitted.filter(id=branch.id).exists():
                raise PermissionDenied("You cannot create a quotation for this branch.")
            if customer and customer.branch_id != branch.id:
                raise ValidationError({"customer": "The customer must belong to the quotation branch."})
        quotation = serializer.save(created_by=self.request.user)
        log_audit(
            request_or_user=self.request,
            action="CREATE",
            entity="Quotation",
            entity_id=quotation.number,
            after={"total": str(quotation.total), "customer": quotation.customer.name},
            reason="Created quotation",
            branch=quotation.branch,
        )

    def perform_update(self, serializer):
        branch = serializer.validated_data.get("branch", serializer.instance.branch)
        customer = serializer.validated_data.get("customer", serializer.instance.customer)
        user = self.request.user
        if not (user.is_superuser or user_is_owner(user)):
            permitted = get_user_branches(user)
            if not branch or not permitted.filter(id=branch.id).exists():
                raise PermissionDenied("You cannot move a quotation to this branch.")
            if customer and customer.branch_id != branch.id:
                raise ValidationError({"customer": "The customer must belong to the quotation branch."})
        old_data = {"status": serializer.instance.status, "total": str(serializer.instance.total)}
        quotation = serializer.save()
        log_audit(
            request_or_user=self.request,
            action="UPDATE",
            entity="Quotation",
            entity_id=quotation.number,
            before=old_data,
            after={"status": quotation.status, "total": str(quotation.total)},
            reason="Updated quotation",
            branch=quotation.branch,
        )

    @action(detail=True, methods=["post"], url_path="convert-to-job")
    def convert_to_job(self, request, pk=None):
        """
        Converts an accepted (or active) quotation to an official Job.
        Freezes exact agreed prices from quotation into job items.
        """
        quotation = self.get_object()

        if quotation.status == "converted":
            return Response(
                {"error": "This quotation has already been converted to a job."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            # 1. Create Job
            job_number = generate_job_number(quotation.branch.code)
            job = Job.objects.create(
                number=job_number,
                branch=quotation.branch,
                customer=quotation.customer,
                quotation=quotation,
                status="pending_deposit",
                priority="normal",
                subtotal=quotation.subtotal,
                discount=quotation.discount,
                tax=quotation.tax,
                total=quotation.total,
                notes=quotation.notes,
                created_by=request.user,
            )

            # 2. Copy items preserving exact snapshot prices
            for q_item in quotation.items.all():
                JobItem.objects.create(
                    job=job,
                    service=q_item.service,
                    description=q_item.description,
                    quantity=q_item.quantity,
                    unit_price=q_item.unit_price,
                    discount=q_item.discount,
                    line_total=q_item.total,
                )

            # 3. Update quotation status
            old_status = quotation.status
            quotation.status = "converted"
            quotation.save(update_fields=["status", "updated_at"])

            # 4. Job history log
            JobStatusHistory.objects.create(
                job=job,
                from_status="none",
                to_status=job.status,
                changed_by=request.user,
                reason=f"Converted from quotation {quotation.number}",
            )

            # 5. Audit Log
            log_audit(
                request_or_user=request,
                action="CONVERT",
                entity="Quotation",
                entity_id=quotation.number,
                before={"status": old_status},
                after={"status": "converted", "job_number": job.number},
                reason=f"Quotation converted to Job {job.number}",
                branch=quotation.branch,
            )

        serializer = JobSerializer(job)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
