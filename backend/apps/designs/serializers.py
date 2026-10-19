from rest_framework import serializers
from .models import DesignAssignment, DesignFile, DesignComment


class DesignFileSerializer(serializers.ModelSerializer):
    uploaded_by_email = serializers.EmailField(source="uploaded_by.email", read_only=True)
    file_url = serializers.FileField(source="file", read_only=True)

    class Meta:
        model = DesignFile
        fields = [
            "id",
            "assignment",
            "version",
            "file",
            "file_url",
            "filename",
            "checksum",
            "file_size",
            "notes",
            "uploaded_by",
            "uploaded_by_email",
            "created_at",
        ]
        read_only_fields = ["id", "version", "checksum", "file_size", "uploaded_by", "created_at"]


class DesignCommentSerializer(serializers.ModelSerializer):
    author_email = serializers.EmailField(source="author.email", read_only=True)

    class Meta:
        model = DesignComment
        fields = ["id", "assignment", "author", "author_email", "comment", "created_at"]
        read_only_fields = ["id", "author", "created_at"]


class DesignAssignmentSerializer(serializers.ModelSerializer):
    files = DesignFileSerializer(many=True, read_only=True)
    comments = DesignCommentSerializer(many=True, read_only=True)
    designer_email = serializers.EmailField(source="designer.email", read_only=True)
    approved_by_email = serializers.EmailField(source="approved_by.email", read_only=True)
    job_number = serializers.CharField(source="job.number", read_only=True)

    class Meta:
        model = DesignAssignment
        fields = [
            "id",
            "job",
            "job_number",
            "designer",
            "designer_email",
            "status",
            "due_at",
            "notes",
            "approved_by",
            "approved_by_email",
            "approved_at",
            "files",
            "comments",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "approved_by", "approved_at", "created_at", "updated_at"]
