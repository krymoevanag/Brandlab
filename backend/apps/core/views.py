from rest_framework import serializers
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.core.permissions import RoleAccessPermission
from apps.core.permissions import get_user_branches, user_is_owner
from apps.jobs.models import Job
from django.utils import timezone
from django.db.models import Count
from drf_spectacular.utils import extend_schema, inline_serializer


class HealthCheckView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        responses={
            200: inline_serializer(
                name="HealthCheckResponse",
                fields={
                    "status": serializers.CharField(),
                    "service": serializers.CharField(),
                },
            )
        }
    )
    def get(self, request):
        return Response({"status": "ok", "service": "az-business-api"})


class CncDashboardView(APIView):
    """Protected CNC dashboard boundary for production metrics and machine data."""

    permission_classes = [IsAuthenticated, RoleAccessPermission]
    permission_access = {"GET": "dashboard.cnc.view"}

    def get(self, request):
        jobs = Job.objects.select_related("branch", "customer").filter(
            status__in=["design_approved", "in_production", "quality_check", "ready_for_delivery"]
        )
        if not (request.user.is_superuser or user_is_owner(request.user)):
            jobs = jobs.filter(branch__in=get_user_branches(request.user))

        recent_jobs = jobs.order_by("due_at", "-created_at")[:10]
        return Response({
            "unit": "cnc",
            "active_jobs": jobs.filter(status__in=["design_approved", "in_production"]).count(),
            "quality_check": jobs.filter(status="quality_check").count(),
            "ready_for_delivery": jobs.filter(status="ready_for_delivery").count(),
            "jobs": [
                {
                    "id": job.id,
                    "number": job.number,
                    "customer": job.customer.name,
                    "branch": job.branch.code,
                    "status": job.status,
                    "priority": job.priority,
                    "due_at": job.due_at,
                    "total": job.total,
                }
                for job in recent_jobs
            ],
        })
