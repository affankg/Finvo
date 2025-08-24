#!/usr/bin/env python
"""
Reset admin password script
"""
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set the Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bs_engineering_backend.settings')

# Setup Django
django.setup()

from django.contrib.auth import get_user_model

def reset_admin_password():
    User = get_user_model()
    
    try:
        # Get or create admin user
        admin, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@bsengineering.com',
                'is_staff': True,
                'is_superuser': True
            }
        )
        
        # Set the password to 'admin123'
        admin.set_password('admin123')
        admin.is_staff = True
        admin.is_superuser = True
        admin.save()
        
        if created:
            print("✅ Admin user created successfully!")
        else:
            print("✅ Admin user password reset successfully!")
            
        print(f"Username: {admin.username}")
        print(f"Email: {admin.email}")
        print(f"Password: admin123")
        print(f"Is superuser: {admin.is_superuser}")
        print(f"Is staff: {admin.is_staff}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    reset_admin_password()
