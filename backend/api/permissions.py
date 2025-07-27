from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the object.
        return obj.created_by == request.user

class HasRolePermission(permissions.BasePermission):
    """
    Custom permission to check user role permissions.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        # Check if the view has required_roles attribute
        required_roles = getattr(view, 'required_roles', [])
        if not required_roles:
            return True
            
        return request.user.role in required_roles

class RoleBasedPermission(permissions.BasePermission):
    """
    Role-based permission system for different user types.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        user_role = request.user.role
        
        # Admin has full access
        if user_role == 'admin':
            return True
        
        # Sales role permissions
        if user_role == 'sales':
            if view.basename in ['client', 'quotation', 'service']:
                return True
            if view.basename == 'invoice' and request.method in ['GET', 'POST', 'PUT', 'PATCH']:
                return True
        
        # Accountant role permissions
        if user_role == 'accountant':
            if view.basename == 'invoice':
                return True
            if view.basename in ['client', 'quotation', 'service'] and request.method in ['GET']:
                return True
        
        # Viewer role permissions (read-only)
        if user_role == 'viewer':
            return request.method in ['GET', 'HEAD', 'OPTIONS']
        
        return False

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
            
        user_role = request.user.role
        
        # Admin has full access
        if user_role == 'admin':
            return True
            
        # Check if user is the creator of the object
        if hasattr(obj, 'created_by') and obj.created_by == request.user:
            return True
            
        # Role-specific object permissions
        if user_role in ['sales', 'accountant']:
            # Allow read access to all objects for sales and accountant
            if request.method in ['GET', 'HEAD', 'OPTIONS']:
                return True
                
        # Viewer can only read
        if user_role == 'viewer':
            return request.method in ['GET', 'HEAD', 'OPTIONS']
            
        return False
