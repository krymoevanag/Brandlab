from django.utils import timezone
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.permissions import get_user_branches, user_is_owner, user_has_role
from apps.audit.utils import log_audit
from .models import DesignAssignment, DesignFile, DesignComment
from .serializers import (
    DesignAssignmentSerializer,
    DesignFileSerializer,
    DesignCommentSerializer,
)


class DesignAssignmentViewSet(viewsets.ModelViewSet):
    """
    Design & Artwork Lifecycle:
    - Versioned artwork uploads
    - Revision requests and commenting
    - Authorized approval gate
    """
    serializer_class = DesignAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["job", "designer", "status"]
    search_fields = ["job__number", "designer__email", "notes"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return DesignAssignment.objects.none()
        
        # Designers see their assigned work
        if user_has_role(user, "designer") and not (user.is_superuser or user_is_owner(user)):
            return DesignAssignment.objects.filter(designer=user).select_related("job", "designer", "approved_by").prefetch_related("files", "comments")

        # Superusers and owners see all
        if user.is_superuser or user_is_owner(user):
            return DesignAssignment.objects.select_related("job", "designer", "approved_by").prefetch_related("files", "comments").all()

        # Branch managers / sales see branch designs
        branches = get_user_branches(user)
        return (
            DesignAssignment.objects.filter(job__branch__in=branches)
            .select_related("job", "designer", "approved_by")
            .prefetch_related("files", "comments")
        )

    def perform_create(self, serializer):
        assignment = serializer.save()
        log_audit(
            request_or_user=self.request,
            action="CREATE",
            entity="DesignAssignment",
            entity_id=assignment.id,
            after={"job": assignment.job.number, "designer": assignment.designer.email},
            reason="Assigned designer to job",
            branch=assignment.job.branch,
        )

    @action(detail=True, methods=["post"], url_path="upload-file")
    def upload_file(self, request, pk=None):
        """
        Uploads a new version of artwork for this assignment.
        Auto-increments version and calculates SHA-256.
        """
        assignment = self.get_object()
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        notes = request.data.get("notes", "")
        filename = request.data.get("filename", file_obj.name)

        design_file = DesignFile.objects.create(
            assignment=assignment,
            file=file_obj,
            filename=filename,
            notes=notes,
            uploaded_by=request.user,
        )

        # Update assignment status to review_pending
        assignment.status = "review_pending"
        assignment.save(update_fields=["status", "updated_at"])

        log_audit(
            request_or_user=request,
            action="CREATE",
            entity="DesignFile",
            entity_id=f"{assignment.job.number}-v{design_file.version}",
            after={"version": design_file.version, "filename": design_file.filename, "checksum": design_file.checksum},
            reason="Uploaded new artwork version",
            branch=assignment.job.branch,
        )

        return Response(DesignFileSerializer(design_file).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="comment")
    def add_comment(self, request, pk=None):
        """Adds a review comment or feedback to the assignment."""
        assignment = self.get_object()
        comment_text = request.data.get("comment", "").strip()
        if not comment_text:
            return Response({"error": "Comment text cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        comment = DesignComment.objects.create(
            assignment=assignment,
            author=request.user,
            comment=comment_text,
        )
        return Response(DesignCommentSerializer(comment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        """
        Approves design. Authorized: Owner, Branch Manager, or Sales Attendant.
        Also transitions Job status to 'design_approved'.
        """
        assignment = self.get_object()
        user = request.user

        # Only authorized approvers can approve (Designer cannot self-approve)
        if user_has_role(user, "designer") and not (user.is_superuser or user_is_owner(user) or user_has_role(user, ["branch_manager", "sales_attendant"])):
            return Response({"error": "Designers cannot approve artwork."}, status=status.HTTP_403_FORBIDDEN)

        assignment.status = "approved"
        assignment.approved_by = user
        assignment.approved_at = timezone.now()
        assignment.save(update_fields=["status", "approved_by", "approved_at", "updated_at"])

        # Update linked job status
        job = assignment.job
        if job.status in ["design_pending", "pending_deposit"]:
            job.status = "design_approved"
            job.save(update_fields=["status", "updated_at"])

        log_audit(
            request_or_user=request,
            action="APPROVE",
            entity="DesignAssignment",
            entity_id=assignment.id,
            after={"status": "approved", "approved_by": user.email},
            reason="Design approved for production",
            branch=assignment.job.branch,
        )

        return Response(DesignAssignmentSerializer(assignment).data)

    @action(detail=True, methods=["post"], url_path="request-revision")
    def request_revision(self, request, pk=None):
        """Requests artwork revision with feedback note."""
        assignment = self.get_object()
        reason = request.data.get("reason", "Revision requested.")

        assignment.status = "revision_requested"
        assignment.save(update_fields=["status", "updated_at"])

        if reason:
            DesignComment.objects.create(
                assignment=assignment,
                author=request.user,
                comment=f"Revision requested: {reason}",
            )

        log_audit(
            request_or_user=request,
            action="REJECT",
            entity="DesignAssignment",
            entity_id=assignment.id,
            after={"status": "revision_requested"},
            reason=reason,
            branch=assignment.job.branch,
        )

        return Response(DesignAssignmentSerializer(assignment).data)
