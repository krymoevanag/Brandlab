from rest_framework import serializers
from apps.branches.serializers import BranchSerializer
from .models import BusinessUnit, Permission, User, Role


class RoleSerializer(serializers.ModelSerializer):
    permissions = serializers.SlugRelatedField(many=True, read_only=True, slug_field="code")
    class Meta:
        model = Role
        fields = ["id", "code", "name", "description", "is_system_role", "permissions"]
        read_only_fields = ["id"]


class BusinessUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessUnit
        fields = ["id", "code", "name", "is_active"]


class UserSerializer(serializers.ModelSerializer):
    roles = RoleSerializer(many=True, read_only=True)
    role_ids = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source="roles",
    )
    branches = BranchSerializer(many=True, read_only=True)
    branch_ids = serializers.PrimaryKeyRelatedField(
        queryset=User.branches.field.related_model.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source="branches",
    )
    business_unit_ids = serializers.PrimaryKeyRelatedField(
        queryset=BusinessUnit.objects.filter(is_active=True),
        many=True,
        write_only=True,
        required=False,
        source="business_units",
    )
    business_units = BusinessUnitSerializer(many=True, read_only=True)
    default_branch_details = BranchSerializer(source="default_branch", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "is_active",
            "is_staff",
            "roles",
            "role_ids",
            "branches",
            "branch_ids",
            "business_unit_ids",
            "business_units",
            "default_branch",
            "default_branch_details",
            "date_joined",
        ]
        read_only_fields = ["id", "date_joined", "is_staff"]


class UserCreateUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    role_ids = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source="roles",
    )
    branch_ids = serializers.PrimaryKeyRelatedField(
        queryset=User.branches.field.related_model.objects.all(),
        many=True,
        write_only=True,
        required=False,
        source="branches",
    )
    business_unit_ids = serializers.PrimaryKeyRelatedField(
        queryset=BusinessUnit.objects.filter(is_active=True),
        many=True,
        write_only=True,
        required=False,
        source="business_units",
    )

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "password",
            "first_name",
            "last_name",
            "phone_number",
            "is_active",
            "role_ids",
            "branch_ids",
            "business_unit_ids",
            "default_branch",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        roles = validated_data.pop("roles", [])
        branches = validated_data.pop("branches", [])
        business_units = validated_data.pop("business_units", [])
        
        user = User.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        if roles:
            user.roles.set(roles)
        if branches:
            user.branches.set(branches)
        if business_units:
            user.business_units.set(business_units)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        roles = validated_data.pop("roles", None)
        branches = validated_data.pop("branches", None)
        business_units = validated_data.pop("business_units", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)
        instance.save()

        if roles is not None:
            instance.roles.set(roles)
        if branches is not None:
            instance.branches.set(branches)
        if business_units is not None:
            instance.business_units.set(business_units)
        return instance


class UserProfileSerializer(serializers.ModelSerializer):
    roles = serializers.SlugRelatedField(many=True, read_only=True, slug_field="code")
    role_details = RoleSerializer(source="roles", many=True, read_only=True)
    branches = BranchSerializer(many=True, read_only=True)
    business_units = serializers.SlugRelatedField(many=True, read_only=True, slug_field="code")
    business_unit_details = BusinessUnitSerializer(many=True, read_only=True, source="business_units")
    default_branch = BranchSerializer(read_only=True)
    permissions = serializers.SerializerMethodField()

    def get_permissions(self, obj):
        if obj.is_superuser:
            return list(Permission.objects.values_list("code", flat=True))
        return list(
            Permission.objects.filter(roles__users=obj)
            .values_list("code", flat=True)
            .distinct()
        )

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "is_active",
            "is_superuser",
            "roles",
            "role_details",
            "branches",
            "business_units",
            "business_unit_details",
            "default_branch",
            "permissions",
            "date_joined",
        ]
        read_only_fields = fields
