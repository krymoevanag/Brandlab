from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from .models import ApprovalLimit, BusinessUnit, Permission, Role, User

admin.site.register(Permission)
admin.site.register(BusinessUnit)
admin.site.register(ApprovalLimit)

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "is_system_role", "created_at")
    search_fields = ("name", "code")
    list_filter = ("is_system_role",)
    filter_horizontal = ("permissions",)

@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ("email",)
    list_display = ("email", "first_name", "last_name", "is_staff", "is_active")
    search_fields = ("email", "first_name", "last_name", "phone_number")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal information", {"fields": ("first_name", "last_name", "phone_number")}),
        ("Business access", {"fields": ("roles", "branches", "business_units", "default_branch")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = ((None, {"classes": ("wide",), "fields": ("email", "password1", "password2", "is_staff", "is_superuser")}),)
    filter_horizontal = ("roles", "branches", "business_units", "groups", "user_permissions")
