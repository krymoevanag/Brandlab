from rest_framework import serializers
from apps.branches.serializers import BranchSerializer
from .models import User, Role


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "code", "name", "description", "is_system_role"]
        read_only_fields = ["id"]


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
            "default_branch",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        roles = validated_data.pop("roles", [])
        branches = validated_data.pop("branches", [])
        
        user = User.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        if roles:
            user.roles.set(roles)
        if branches:
            user.branches.set(branches)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        roles = validated_data.pop("roles", None)
        branches = validated_data.pop("branches", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)
        instance.save()

        if roles is not None:
            instance.roles.set(roles)
        if branches is not None:
            instance.branches.set(branches)
        return instance


class UserProfileSerializer(serializers.ModelSerializer):
    roles = serializers.SlugRelatedField(many=True, read_only=True, slug_field="code")
    role_details = RoleSerializer(source="roles", many=True, read_only=True)
    branches = BranchSerializer(many=True, read_only=True)
    default_branch = BranchSerializer(read_only=True)

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
            "default_branch",
            "date_joined",
        ]
        read_only_fields = fields
