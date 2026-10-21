from decimal import Decimal
from django.db import transaction
from rest_framework import viewsets, permissions, filters, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from apps.core.permissions import get_user_branches, user_is_owner, user_has_role, RoleAccessPermission, user_within_approval_limit
from apps.audit.utils import log_audit
from apps.jobs.models import Job
from apps.customers.models import Customer
from .models import (
    Invoice,
    Payment,
    PaymentAllocation,
    Receipt,
    generate_invoice_number,
    generate_receipt_number,
)
from .serializers import (
    InvoiceSerializer,
    PaymentSerializer,
    ReceiptSerializer,
)


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    Invoice Management:
    - Branch-scoped access
    - Balance tracking linked to payment allocations
    """
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated, RoleAccessPermission]
    permission_access = {"list": "finance.view", "retrieve": "finance.view", "create": "finance.view", "update": "finance.view", "partial_update": "finance.view", "destroy": "finance.view", "generate_from_job": "finance.view"}
    role_access = {"GET": ["branch_manager", "finance_officer"], "POST": ["branch_manager", "finance_officer"], "PUT": ["branch_manager", "finance_officer"], "PATCH": ["branch_manager", "finance_officer"], "DELETE": ["branch_manager"]}
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["branch", "customer", "job", "status"]
    search_fields = ["number", "customer__name", "customer__phone"]
    ordering_fields = ["created_at", "total", "balance_due", "due_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Invoice.objects.none()
        if user.is_superuser or user_is_owner(user):
            return (
                Invoice.objects.select_related("branch", "customer", "job", "created_by")
                .prefetch_related("allocations")
                .all()
            )
        branches = get_user_branches(user)
        return (
            Invoice.objects.filter(branch__in=branches)
            .select_related("branch", "customer", "job", "created_by")
            .prefetch_related("allocations")
        )

    def perform_create(self, serializer):
        branch = serializer.validated_data.get("branch")
        customer = serializer.validated_data.get("customer")
        job = serializer.validated_data.get("job")
        user = self.request.user
        if not (user.is_superuser or user_is_owner(user)):
            permitted = get_user_branches(user)
            if not branch or not permitted.filter(id=branch.id).exists():
                raise PermissionDenied("You cannot create an invoice for this branch.")
            if customer and customer.branch_id != branch.id:
                raise ValidationError({"customer": "The customer must belong to the invoice branch."})
            if job and job.branch_id != branch.id:
                raise ValidationError({"job": "The job must belong to the invoice branch."})
        invoice = serializer.save(created_by=self.request.user)
        log_audit(
            request_or_user=self.request,
            action="CREATE",
            entity="Invoice",
            entity_id=invoice.number,
            after={"total": str(invoice.total), "customer": invoice.customer.name},
            reason="Issued new invoice",
            branch=invoice.branch,
        )

    def perform_update(self, serializer):
        branch = serializer.validated_data.get("branch", serializer.instance.branch)
        customer = serializer.validated_data.get("customer", serializer.instance.customer)
        job = serializer.validated_data.get("job", serializer.instance.job)
        user = self.request.user
        if not (user.is_superuser or user_is_owner(user)):
            permitted = get_user_branches(user)
            if not branch or not permitted.filter(id=branch.id).exists():
                raise PermissionDenied("You cannot move an invoice to this branch.")
            if customer and customer.branch_id != branch.id:
                raise ValidationError({"customer": "The customer must belong to the invoice branch."})
            if job and job.branch_id != branch.id:
                raise ValidationError({"job": "The job must belong to the invoice branch."})
        invoice = serializer.save()
        log_audit(
            request_or_user=self.request,
            action="UPDATE",
            entity="Invoice",
            entity_id=invoice.number,
            after={"total": str(invoice.total), "status": invoice.status},
            reason="Updated invoice details",
            branch=invoice.branch,
        )

    @action(detail=False, methods=["post"], url_path="generate-from-job")
    def generate_from_job(self, request):
        """
        Generates an Invoice directly from a confirmed Job.
        Payload: {"job_id": 1, "due_at": "2026-11-01", "notes": "..."}
        """
        job_id = request.data.get("job_id")
        if not job_id:
            return Response({"error": "job_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            job = Job.objects.select_related("branch", "customer").get(id=job_id)
        except Job.DoesNotExist:
            return Response({"error": "Job not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check branch permission
        branches = get_user_branches(request.user)
        if not (request.user.is_superuser or user_is_owner(request.user) or job.branch in branches):
            return Response({"error": "You do not have access to this job's branch."}, status=status.HTTP_403_FORBIDDEN)

        with transaction.atomic():
            invoice_num = generate_invoice_number(job.branch.code)
            invoice = Invoice.objects.create(
                number=invoice_num,
                branch=job.branch,
                customer=job.customer,
                job=job,
                status="issued",
                subtotal=job.subtotal,
                discount=job.discount,
                tax=job.tax,
                total=job.total,
                paid_amount=Decimal("0.00"),
                balance_due=job.total,
                due_at=request.data.get("due_at"),
                notes=request.data.get("notes", f"Generated from Job {job.number}"),
                created_by=request.user,
            )

            log_audit(
                request_or_user=request,
                action="CREATE",
                entity="Invoice",
                entity_id=invoice.number,
                after={"job": job.number, "total": str(invoice.total)},
                reason=f"Generated invoice from Job {job.number}",
                branch=invoice.branch,
            )

        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)


class PaymentViewSet(viewsets.ModelViewSet):
    """
    Payment Processing:
    - Idempotency key protection against duplicates
    - Partial and multi-invoice allocations
    - Automated separate Receipt generation
    - Documented reversal workflow
    """
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated, RoleAccessPermission]
    permission_access = {"list": "finance.view", "retrieve": "finance.view", "create": "payments.verify", "update": "payments.verify", "partial_update": "payments.verify", "destroy": "payments.verify", "reverse_payment": "payments.reverse"}
    role_access = {"GET": ["branch_manager", "finance_officer"], "POST": ["branch_manager", "finance_officer"], "PUT": ["branch_manager", "finance_officer"], "PATCH": ["branch_manager", "finance_officer"], "DELETE": ["branch_manager"]}
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["branch", "customer", "method", "status"]
    search_fields = ["reference", "idempotency_key", "customer__name"]
    ordering_fields = ["received_at", "amount"]
    ordering = ["-received_at"]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Payment.objects.none()
        if user.is_superuser or user_is_owner(user):
            return (
                Payment.objects.select_related("branch", "customer", "recorded_by", "receipt")
                .prefetch_related("allocations")
                .all()
            )
        branches = get_user_branches(user)
        return (
            Payment.objects.filter(branch__in=branches)
            .select_related("branch", "customer", "recorded_by", "receipt")
            .prefetch_related("allocations")
        )

    def create(self, request, *args, **kwargs):
        requested_branch_id = request.data.get("branch")
        user = request.user
        permitted_branches = get_user_branches(user)
        if not (user.is_superuser or user_is_owner(user)) and not permitted_branches.filter(id=requested_branch_id).exists():
            return Response({"error": "You do not have access to this payment branch."}, status=status.HTTP_403_FORBIDDEN)
        try:
            payment_customer = Customer.objects.get(id=request.data.get("customer"))
        except Customer.DoesNotExist:
            return Response({"error": "Payment customer was not found."}, status=status.HTTP_400_BAD_REQUEST)
        if str(payment_customer.branch_id) != str(requested_branch_id):
            return Response({"error": "The payment customer must belong to the payment branch."}, status=status.HTTP_400_BAD_REQUEST)

        idempotency_key = request.data.get("idempotency_key")
        if not idempotency_key:
            return Response(
                {"error": "idempotency_key is required for all payment records."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check existing payment with same idempotency key
        existing_payment = Payment.objects.filter(idempotency_key=idempotency_key).first()
        if existing_payment:
            if not (user.is_superuser or user_is_owner(user)) and not permitted_branches.filter(id=existing_payment.branch_id).exists():
                return Response({"error": "You do not have access to this payment."}, status=status.HTTP_403_FORBIDDEN)
            serializer = PaymentSerializer(existing_payment)
            return Response(serializer.data, status=status.HTTP_200_OK)

        allocations_data = request.data.get("allocations", [])
        total_amount = Decimal(str(request.data.get("amount", "0")))

        if total_amount <= Decimal("0.00"):
            return Response({"error": "Payment amount must be greater than zero."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate allocations sum does not exceed total payment amount
        alloc_sum = sum(Decimal(str(a.get("amount", "0"))) for a in allocations_data)
        if alloc_sum > total_amount:
            return Response(
                {"error": f"Allocation total ({alloc_sum}) cannot exceed payment amount ({total_amount})."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        allocation_invoice_ids = [
            a_data.get("invoice")
            for a_data in allocations_data
            if a_data.get("invoice") and Decimal(str(a_data.get("amount", "0"))) > Decimal("0.00")
        ]
        allocation_totals = {}
        for invoice_id in allocation_invoice_ids:
            try:
                invoice = Invoice.objects.get(id=invoice_id)
            except Invoice.DoesNotExist:
                return Response({"error": f"Invoice {invoice_id} was not found."}, status=status.HTTP_400_BAD_REQUEST)
            if str(invoice.branch_id) != str(requested_branch_id):
                return Response({"error": "Payment allocations must use invoices from the payment branch."}, status=status.HTTP_400_BAD_REQUEST)
            if str(invoice.customer_id) != str(request.data.get("customer")):
                return Response({"error": "Payment allocations must use invoices for the payment customer."}, status=status.HTTP_400_BAD_REQUEST)
            if not (user.is_superuser or user_is_owner(user)) and not permitted_branches.filter(id=invoice.branch_id).exists():
                return Response({"error": "You do not have access to the allocated invoice."}, status=status.HTTP_403_FORBIDDEN)
            allocation_totals[invoice.id] = allocation_totals.get(invoice.id, Decimal("0.00")) + sum(
                Decimal(str(item.get("amount", "0"))) for item in allocations_data if item.get("invoice") == invoice.id
            )
            if allocation_totals[invoice.id] > invoice.balance_due:
                return Response({"error": f"Allocation exceeds the remaining balance for invoice {invoice.number}."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            payment = serializer.save(recorded_by=request.user)

            # Process allocations
            first_invoice = None
            for a_data in allocations_data:
                inv_id = a_data.get("invoice")
                a_amt = Decimal(str(a_data.get("amount", "0")))
                if inv_id and a_amt > Decimal("0.00"):
                    invoice = Invoice.objects.select_for_update().get(id=inv_id)
                    PaymentAllocation.objects.create(payment=payment, invoice=invoice, amount=a_amt)
                    invoice.update_balance()
                    if not first_invoice:
                        first_invoice = invoice

            # Auto-generate separate Receipt
            receipt_num = generate_receipt_number(payment.branch.code)
            Receipt.objects.create(
                number=receipt_num,
                payment=payment,
                invoice=first_invoice,
                branch=payment.branch,
                customer=payment.customer,
                created_by=request.user,
            )

            # Audit Log
            log_audit(
                request_or_user=request,
                action="PAYMENT",
                entity="Payment",
                entity_id=payment.id,
                after={"amount": str(payment.amount), "method": payment.method, "reference": payment.reference},
                reason=f"Recorded payment of KES {payment.amount}",
                branch=payment.branch,
            )

        headers = self.get_success_headers(serializer.data)
        return Response(PaymentSerializer(payment).data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=["post"], url_path="reverse")
    def reverse_payment(self, request, pk=None):
        """
        Reverses a posted payment. Requires Finance Officer or Owner/Manager approval.
        Updates allocated invoices and logs full audit trail.
        """
        payment = self.get_object()
        user = request.user

        if not (user.is_superuser or user_is_owner(user) or user_has_role(user, ["finance_officer", "branch_manager"])):
            return Response(
                {"error": "Only Finance Officers, Branch Managers, or Owners can reverse payments."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not user_within_approval_limit(user, "payments.reverse", payment.amount, payment.branch):
            return Response(
                {"error": "This payment reversal exceeds your configured approval limit."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if payment.status != "completed":
            return Response(
                {"error": f"Payment is already {payment.status} and cannot be reversed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = request.data.get("reason", "").strip()
        if not reason:
            return Response({"error": "A documented reason is required to reverse a payment."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            payment.status = "reversed"
            payment.notes += f"\n[REVERSED by {user.email}]: {reason}"
            payment.save(update_fields=["status", "notes", "updated_at"])

            # Recalculate affected invoices
            for alloc in payment.allocations.all():
                alloc.invoice.update_balance()

            log_audit(
                request_or_user=request,
                action="REVERSE",
                entity="Payment",
                entity_id=payment.id,
                before={"status": "completed"},
                after={"status": "reversed"},
                reason=f"Reversed payment: {reason}",
                branch=payment.branch,
            )

        return Response(PaymentSerializer(payment).data)


class ReceiptViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Receipt Records:
    Separately numbered from invoices, immutable payment proof.
    """
    serializer_class = ReceiptSerializer
    permission_classes = [permissions.IsAuthenticated, RoleAccessPermission]
    permission_access = {"list": "finance.view", "retrieve": "finance.view"}
    role_access = {"GET": ["branch_manager", "finance_officer"]}
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["branch", "customer"]
    search_fields = ["number", "customer__name", "payment__reference"]
    ordering = ["-created_at"]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Receipt.objects.none()
        if user.is_superuser or user_is_owner(user):
            return Receipt.objects.select_related("branch", "customer", "payment", "invoice", "created_by").all()
        branches = get_user_branches(user)
        return Receipt.objects.filter(branch__in=branches).select_related("branch", "customer", "payment", "invoice", "created_by")
