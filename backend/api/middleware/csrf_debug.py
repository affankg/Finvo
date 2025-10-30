"""
CSRF Debug Middleware
Helps debug CSRF token issues in production
"""
import logging

logger = logging.getLogger(__name__)


class CsrfDebugMiddleware:
    """Middleware to debug and log CSRF issues"""
    
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Log CSRF token information for admin requests
        if request.path.startswith('/admin/'):
            csrf_cookie = request.COOKIES.get('csrftoken')
            csrf_header = request.META.get('HTTP_X_CSRFTOKEN')
            csrf_post = request.POST.get('csrfmiddlewaretoken')
            
            logger.info(
                f"CSRF Debug - Path: {request.path}, "
                f"Method: {request.method}, "
                f"Cookie: {csrf_cookie[:10] if csrf_cookie else None}, "
                f"Header: {csrf_header[:10] if csrf_header else None}, "
                f"POST: {csrf_post[:10] if csrf_post else None}"
            )

        response = self.get_response(request)
        
        # Ensure CSRF cookie is set for admin pages
        if request.path.startswith('/admin/') and not request.COOKIES.get('csrftoken'):
            from django.middleware.csrf import get_token
            get_token(request)
            logger.info(f"CSRF token generated for {request.path}")
        
        return response

    def process_exception(self, request, exception):
        """Log CSRF exceptions"""
        if 'CSRF' in str(exception):
            logger.error(f"CSRF Exception: {exception} on {request.path}")
        return None
