from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model
from .models import ActivityLog
import json

User = get_user_model()

class AuditLogMiddleware(MiddlewareMixin):
    """
    Middleware to log user activities for audit purposes
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        super().__init__(get_response)
    
    def process_request(self, request):
        # Store the original request data for POST/PUT/PATCH requests
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            request._original_data = getattr(request, 'body', b'').decode('utf-8')
        return None
    
    def process_response(self, request, response):
        # Only log authenticated users
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return response
        
        # Only log API endpoints
        if not request.path.startswith('/api/'):
            return response
        
        # Skip logging for certain endpoints
        skip_paths = [
            '/api/auth/profile/',
            '/api/activities/',
            '/api/dashboard/',
        ]
        
        if any(skip_path in request.path for skip_path in skip_paths):
            return response
        
        # Log based on HTTP method and response status
        if response.status_code < 400:  # Only log successful requests
            self._log_activity(request, response)
        
        return response
    
    def _log_activity(self, request, response):
        """
        Log the activity based on request method and path
        """
        try:
            # Extract content type and object ID from path
            path_parts = request.path.strip('/').split('/')
            
            if len(path_parts) < 3:  # /api/endpoint/
                return
            
            content_type = path_parts[1]  # clients, services, quotations, invoices, etc.
            
            # Determine action based on HTTP method
            action_map = {
                'GET': 'view',
                'POST': 'create',
                'PUT': 'update',
                'PATCH': 'update',
                'DELETE': 'delete'
            }
            
            action = action_map.get(request.method, 'unknown')
            
            # Extract object ID if present
            object_id = None
            if len(path_parts) > 2 and path_parts[2].isdigit():
                object_id = int(path_parts[2])
            
            # Create description based on action and content
            description = self._create_description(request, action, content_type, object_id)
            
            # Skip logging for list views (GET requests without object ID)
            if action == 'view' and object_id is None:
                return
            
            # Create activity log entry
            ActivityLog.objects.create(
                user=request.user,
                action=action,
                content_type=content_type,
                object_id=object_id or 0,
                description=description
            )
            
        except Exception as e:
            # Silently fail to avoid breaking the request
            pass
    
    def _create_description(self, request, action, content_type, object_id):
        """
        Create a human-readable description of the activity
        """
        content_type_names = {
            'clients': 'client',
            'services': 'service',
            'quotations': 'quotation',
            'invoices': 'invoice',
            'users': 'user',
        }
        
        content_name = content_type_names.get(content_type, content_type.rstrip('s'))
        
        if object_id:
            return f"{action.title()}d {content_name} (ID: {object_id})"
        else:
            return f"{action.title()}d {content_name}"
