from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from apps.accounts.views import (
    CustomTokenObtainPairView,
    UserProfileView,
    UserViewSet,
    RoleViewSet,
    BusinessUnitViewSet,
)
from apps.branches.views import BranchViewSet
from apps.audit.views import AuditLogViewSet
from apps.customers.views import CustomerViewSet
from apps.services.views import ServiceCategoryViewSet, ServiceViewSet
from apps.quotations.views import QuotationViewSet
from apps.jobs.views import JobViewSet
from apps.designs.views import DesignAssignmentViewSet
from apps.finance.views import InvoiceViewSet, PaymentViewSet, ReceiptViewSet
from apps.expenses.views import ExpenseViewSet

router = DefaultRouter()
router.register(r"branches", BranchViewSet, basename="branch")
router.register(r"users", UserViewSet, basename="user")
router.register(r"roles", RoleViewSet, basename="role")
router.register(r"business-units", BusinessUnitViewSet, basename="business-unit")
router.register(r"audit-logs", AuditLogViewSet, basename="audit-log")
router.register(r"customers", CustomerViewSet, basename="customer")
router.register(r"service-categories", ServiceCategoryViewSet, basename="service-category")
router.register(r"services", ServiceViewSet, basename="service")
router.register(r"quotations", QuotationViewSet, basename="quotation")
router.register(r"jobs", JobViewSet, basename="job")
router.register(r"design-assignments", DesignAssignmentViewSet, basename="design-assignment")
router.register(r"invoices", InvoiceViewSet, basename="invoice")
router.register(r"payments", PaymentViewSet, basename="payment")
router.register(r"receipts", ReceiptViewSet, basename="receipt")
router.register(r"expenses", ExpenseViewSet, basename="expense")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", include("apps.core.urls")),
    path("api/v1/core/", include("apps.core.urls")),
    
    # Authentication endpoints
    path("api/v1/auth/token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/v1/auth/login/", CustomTokenObtainPairView.as_view(), name="auth_login"),
    path("api/v1/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/v1/auth/me/", UserProfileView.as_view(), name="user_profile"),
    
    # Global API v1 Router
    path("api/v1/", include(router.urls)),
    
    # OpenAPI 3 Schema & Interactive Documentation
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
