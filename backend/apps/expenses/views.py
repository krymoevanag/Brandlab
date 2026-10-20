from datetime import date
from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum, Count, Q
from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.permissions import get_user_branches, user_is_owner, user_has_role, RoleAccessPermission, user_within_approval_limit
from apps.audit.utils import log_audit
from .models import Expense
from .serializers import ExpenseSerializer


class ExpenseViewSet(viewsets.ModelViewSet):
    """
    Elevated Expense Tracker:
    - Capture operational, production, transport, staff, and equipment costs
    - Independent approval policy (no self-approval)
    - Distinct tracking of incurred vs. paid dates
    - Executive dashboard summary metrics
    """
    serializer_class = ExpenseSerializer
    permission_classes = [permissions.IsAuthenticated, RoleAccessPermission]
    permission_access = {"list": "expenses.create", "retrieve": "expenses.create", "create": "expenses.create", "update": "expenses.create", "partial_update": "expenses.create", "destroy": "expenses.create", "approve_expense": "expenses.approve", "reject_expense": "expenses.approve", "mark_as_paid": "expenses.pay", "dashboard_summary": "expenses.create"}
    role_access = {"GET": ["branch_manager", "finance_officer", "storekeeper"], "POST": ["branch_manager", "finance_officer", "storekeeper"], "PUT": ["branch_manager", "finance_officer"], "PATCH": ["branch_manager", "finance_officer"], "DELETE": ["branch_manager"]}
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["branch", "department", "category", "status", "payment_method", "job"]
    search_fields = ["expense_number", "supplier", "description", "notes"]
    ordering_fields = ["date_incurred", "amount", "created_at"]
    ordering = ["-date_incurred", "-created_at"]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Expense.objects.none()
        if user.is_superuser or user_is_owner(user):
            return Expense.objects.select_related("branch", "submitted_by", "approved_by", "job").all()
        branches = get_user_branches(user)
        return Expense.objects.filter(branch__in=branches).select_related("branch", "submitted_by", "approved_by", "job")

    def perform_create(self, serializer):
        expense = serializer.save(submitted_by=self.request.user)
        log_audit(
            request_or_user=self.request,
            action="CREATE",
            entity="Expense",
            entity_id=expense.expense_number,
            after={"amount": str(expense.amount), "category": expense.category, "supplier": expense.supplier},
            reason="Submitted expense record",
            branch=expense.branch,
        )

    @action(detail=True, methods=["post"], url_path="approve")
    def approve_expense(self, request, pk=None):
        """
        Approves an expense.
        Rule: Staff cannot approve their own expense submission unless superuser.
        """
        expense = self.get_object()
        user = request.user

        # 1. Permission check
        if not (user.is_superuser or user_is_owner(user) or user_has_role(user, ["branch_manager", "finance_officer"])):
            return Response(
                {"error": "You do not have authorization to approve expenses."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not user_within_approval_limit(user, "expenses.approve", expense.amount, expense.branch):
            return Response(
                {"error": "This expense exceeds your configured approval limit."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # 2. Self-approval rule
        if expense.submitted_by_id == user.id and not user.is_superuser:
            return Response(
                {"error": "Policy violation: You cannot approve your own expense submission."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if expense.status not in ["pending", "rejected"]:
            return Response(
                {"error": f"Expense is already {expense.status}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        expense.status = "approved"
        expense.approved_by = user
        expense.approved_at = timezone.now()
        expense.save(update_fields=["status", "approved_by", "approved_at", "updated_at"])

        log_audit(
            request_or_user=request,
            action="APPROVE",
            entity="Expense",
            entity_id=expense.expense_number,
            after={"status": "approved", "approved_by": user.email},
            reason="Approved expense submission",
            branch=expense.branch,
        )

        return Response(ExpenseSerializer(expense).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject_expense(self, request, pk=None):
        """Rejects an expense with documented reason."""
        expense = self.get_object()
        user = request.user

        if not (user.is_superuser or user_is_owner(user) or user_has_role(user, ["branch_manager", "finance_officer"])):
            return Response({"error": "You do not have authorization to reject expenses."}, status=status.HTTP_403_FORBIDDEN)

        reason = request.data.get("reason", "").strip()
        if not reason:
            return Response({"error": "A rejection reason is required."}, status=status.HTTP_400_BAD_REQUEST)

        expense.status = "rejected"
        expense.notes += f"\n[REJECTED by {user.email}]: {reason}"
        expense.save(update_fields=["status", "notes", "updated_at"])

        log_audit(
            request_or_user=request,
            action="REJECT",
            entity="Expense",
            entity_id=expense.expense_number,
            before={"status": "pending"},
            after={"status": "rejected"},
            reason=f"Rejected expense: {reason}",
            branch=expense.branch,
        )

        return Response(ExpenseSerializer(expense).data)

    @action(detail=True, methods=["post"], url_path="pay")
    def mark_as_paid(self, request, pk=None):
        """
        Records the actual disbursement of funds for an approved expense.
        Payload: {"date_paid": "2026-10-19", "payment_method": "mpesa", "notes": "Ref: QKJ38..."}
        """
        expense = self.get_object()
        if expense.status not in ["approved", "pending"]:
            return Response(
                {"error": f"Cannot pay an expense with status '{expense.status}'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        pay_date = request.data.get("date_paid") or date.today()
        pay_method = request.data.get("payment_method") or expense.payment_method or "cash"
        extra_notes = request.data.get("notes", "")

        expense.status = "paid"
        expense.date_paid = pay_date
        expense.payment_method = pay_method
        if extra_notes:
            expense.notes += f"\n[Payment Info]: {extra_notes}"
        expense.save(update_fields=["status", "date_paid", "payment_method", "notes", "updated_at"])

        log_audit(
            request_or_user=request,
            action="PAYMENT",
            entity="Expense",
            entity_id=expense.expense_number,
            after={"status": "paid", "date_paid": str(pay_date), "method": pay_method},
            reason="Recorded payment for expense",
            branch=expense.branch,
        )

        return Response(ExpenseSerializer(expense).data)

    @action(detail=False, methods=["get"], url_path="summary")
    def dashboard_summary(self, request):
        """
        Summary metrics for the Release 1 Expense Dashboard:
        - Expenses this month
        - Pending approval count
        - Unpaid expenses
        - Paid this month
        """
        qs = self.get_queryset()
        today = date.today()
        first_of_month = date(today.year, today.month, 1)

        this_month_qs = qs.filter(date_incurred__gte=first_of_month)
        paid_this_month_qs = qs.filter(status="paid", date_paid__gte=first_of_month)

        total_this_month = this_month_qs.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        pending_count = qs.filter(status="pending").count()
        unpaid_total = qs.filter(status__in=["pending", "approved"]).aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        paid_this_month = paid_this_month_qs.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

        # Category breakdown
        category_breakdown = list(
            qs.filter(date_incurred__gte=first_of_month)
            .values("category")
            .annotate(total=Sum("amount"), count=Count("id"))
            .order_by("-total")
        )

        return Response({
            "expenses_this_month": total_this_month,
            "pending_approval_count": pending_count,
            "unpaid_expenses": unpaid_total,
            "paid_this_month": paid_this_month,
            "category_breakdown": category_breakdown,
        })
