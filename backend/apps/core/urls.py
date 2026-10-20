from django.urls import path
from .views import HealthCheckView, CncDashboardView

urlpatterns = [
    path("", HealthCheckView.as_view(), name="health-check"),
    path("cnc-dashboard/", CncDashboardView.as_view(), name="cnc-dashboard"),
]
