import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Standardizes error responses across all endpoints.
    Format:
    {
        "error": {
            "type": "ValidationException",
            "message": "...",
            "details": {...}
        }
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            "error": {
                "type": exc.__class__.__name__,
                "status_code": response.status_code,
                "message": getattr(exc, "detail", str(exc)) if isinstance(getattr(exc, "detail", None), str) else "A validation or processing error occurred.",
                "details": response.data if isinstance(response.data, dict) else {"non_field_errors": response.data},
            }
        }
        response.data = custom_data
        return response

    # Unhandled server errors (500)
    logger.exception("Unhandled server error: %s", exc)
    return Response(
        {
            "error": {
                "type": "InternalServerError",
                "status_code": 500,
                "message": "An internal error occurred. Please contact the system administrator.",
                "details": {},
            }
        },
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
