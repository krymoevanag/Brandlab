from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("An email address is required.")
        email = self.normalize_email(email).strip().lower()
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("A superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("A superuser must have is_superuser=True.")
        return self.create_user(email, password, **extra_fields)


class Permission(models.Model):
    code = models.SlugField(max_length=80, unique=True)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["code"]

    def __str__(self):
        return self.code


class BusinessUnit(models.Model):
    code = models.SlugField(max_length=30, unique=True)
    name = models.CharField(max_length=80)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Role(models.Model):
    code = models.SlugField(max_length=40, unique=True)
    name = models.CharField(max_length=80)
    description = models.TextField(blank=True)
    is_system_role = models.BooleanField(default=False)
    permissions = models.ManyToManyField(Permission, blank=True, related_name="roles")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=25, blank=True)
    roles = models.ManyToManyField(Role, blank=True, related_name="users")
    branches = models.ManyToManyField("branches.Branch", blank=True, related_name="users")
    business_units = models.ManyToManyField(BusinessUnit, blank=True, related_name="users")
    default_branch = models.ForeignKey("branches.Branch", null=True, blank=True, on_delete=models.SET_NULL, related_name="default_users")

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
    objects = UserManager()

    class Meta:
        ordering = ["email"]

    def __str__(self):
        return self.email


class ApprovalLimit(models.Model):
    """Configurable monetary approval ceiling for a role and action."""

    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="approval_limits")
    action = models.SlugField(max_length=80)
    max_amount = models.DecimalField(max_digits=14, decimal_places=2)
    branch = models.ForeignKey("branches.Branch", null=True, blank=True, on_delete=models.CASCADE, related_name="approval_limits")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["action", "max_amount"]
        constraints = [
            models.UniqueConstraint(fields=["role", "action", "branch"], name="unique_role_action_branch_limit"),
        ]

    def __str__(self):
        return f"{self.role.code}: {self.action} <= {self.max_amount}"
