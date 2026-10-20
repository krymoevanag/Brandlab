from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.permissions import get_user_branches, user_is_owner, RoleAccessPermission
from apps.audit.utils import log_audit
from .models import Job, JobItem, JobStatusHistory
from .serializers import JobSerializer, JobStatusHistorySerializer


class JobViewSet(viewsets.ModelViewSet):
    """
    Job / Order Management:
    - Branch-scoped querysets.
    - Snapshot pricing.
    - Status transitions with history and audit logs.
    """
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated, RoleAccessPermission]
    permission_access = {"list": "jobs.view", "retrieve": "jobs.view", "create": "jobs.create", "update": "jobs.edit", "partial_update": "jobs.edit", "destroy": "jobs.delete", "update_status": "jobs.edit"}
    role_access = {"GET": ["branch_manager", "sales_attendant", "designer", "cnc_operator"], "POST": ["branch_manager", "sales_attendant"], "PUT": ["branch_manager", "cnc_operator"], "PATCH": ["branch_manager", "cnc_operator"], "DELETE": ["branch_manager"]}
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["branch", "customer", "status", "priority"]
    search_fields = ["number", "customer__name", "customer__phone", "notes"]
    ordering_fields = ["created_at", "due_at", "total", "priority"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Job.objects.none()
        if user.is_superuser or user_is_owner(user):
            return (
                Job.objects.select_related("branch", "customer", "quotation", "created_by")
                .prefetch_related("items", "status_history")
                .all()
            )
        branches = get_user_branches(user)
        return (
            Job.objects.filter(branch__in=branches)
            .select_related("branch", "customer", "quotation", "created_by")
            .prefetch_related("items", "status_history")
        )

    def perform_create(self, serializer):
        job = serializer.save(created_by=self.request.user)
        JobStatusHistory.objects.create(
            job=job,
            from_status="none",
            to_status=job.status,
            changed_by=self.request.user,
            reason="Initial job creation",
        )
        log_audit(
            request_or_user=self.request,
            action="CREATE",
            entity="Job",
            entity_id=job.number,
            after={"customer": job.customer.name, "status": job.status, "total": str(job.total)},
            reason="Created job",
            branch=job.branch,
        )

    @action(detail=True, methods=["post"], url_path="status")
    def update_status(self, request, pk=None):
        """
        Updates job status with reason and audit history.
        Payload: {"status": "in_production", "reason": "Deposit confirmed"}
        """
        job = self.get_object()
        new_status = request.data.get("status")
        reason = request.data.get("reason", "")

        valid_statuses = dict(Job.STATUS_CHOICES)
        if new_status not in valid_statuses:
            return Response(
                {"error": f"Invalid status '{new_status}'. Valid choices: {list(valid_statuses.keys())}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_status = job.status
        job.status = new_status
        job.save(update_fields=["status", "updated_at"])

        JobStatusHistory.objects.create(
            job=job,
            from_status=old_status,
            to_status=new_status,
            changed_by=request.user,
            reason=reason,
        )

        log_audit(
            request_or_user=request,
            action="UPDATE",
            entity="Job",
            entity_id=job.number,
            before={"status": old_status},
            after={"status": new_status},
            reason=f"Status changed: {reason}",
            branch=job.branch,
        )

        return Response(JobSerializer(job).data)
