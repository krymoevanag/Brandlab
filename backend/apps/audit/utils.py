from django.core.serializers.json import DjangoJSONEncoder
import json
from .models import AuditLog


def get_client_ip(request):
    """Safely extracts client IP address from request headers."""
    if not request:
        return None
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def sanitize_audit_payload(data):
    """
    Strips out sensitive credentials before logging.
    Never log: passwords, tokens, M-Pesa PINs, provider secrets.
    """
    if not isinstance(data, dict):
        return data
    sensitive_keys = {
        "password", "password_hash", "token", "access_token", "refresh_token",
        "secret", "pin", "mpesa_pin", "authorization", "csrf_token"
    }
    clean = {}
    for k, v in data.items():
        if k.lower() in sensitive_keys:
            clean[k] = "[REDACTED]"
        elif isinstance(v, dict):
            clean[k] = sanitize_audit_payload(v)
        else:
            clean[k] = v
    # Ensure JSON serializable
    return json.loads(json.dumps(clean, cls=DjangoJSONEncoder))


def log_audit(
    request_or_user,
    action,
    entity,
    entity_id,
    before=None,
    after=None,
    reason="",
    branch=None,
):
    """
    Core immutable audit logging utility.
    """
    user = None
    ip_address = None

    if hasattr(request_or_user, "user"):
        request = request_or_user
        user = request.user if request.user.is_authenticated else None
        ip_address = get_client_ip(request)
        if branch is None and hasattr(request, "active_branch"):
            branch = request.active_branch
    elif request_or_user and getattr(request_or_user, "is_authenticated", False):
        user = request_or_user

    clean_before = sanitize_audit_payload(before) if before else {}
    clean_after = sanitize_audit_payload(after) if after else {}

    return AuditLog.objects.create(
        user=user,
        branch=branch,
        action=action,
        entity=str(entity),
        entity_id=str(entity_id),
        before=clean_before,
        after=clean_after,
        reason=reason,
        ip_address=ip_address,
    )
