import os
import django
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bs_engineering_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

def verify_user_roles():
    """Verify that user roles are being saved correctly"""
    # List all users and their roles
    print("Current users and their roles:")
    for user in User.objects.all():
        print(f"User: {user.username}, Role: {user.role}")
        
        # Test changing the role
        original_role = user.role
        test_role = 'admin' if original_role != 'admin' else 'sales'
        
        print(f"Attempting to change role from {original_role} to {test_role}")
        user.role = test_role
        user.save()
        
        # Verify the change
        user.refresh_from_db()
        print(f"Role after save: {user.role}")
        
        # Change it back
        user.role = original_role
        user.save()
        user.refresh_from_db()
        print(f"Role after changing back: {user.role}")
        print("-" * 50)

if __name__ == '__main__':
    try:
        verify_user_roles()
    except Exception as e:
        print(f"Error: {str(e)}")