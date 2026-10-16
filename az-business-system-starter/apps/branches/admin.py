from django.contrib import admin
from .models import Branch

@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "is_active", "phone_number", "email")
    list_filter = ("is_active",)
    search_fields = ("name", "code", "address")
    prepopulated_fields = {"code": ("name",)}
