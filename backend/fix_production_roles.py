#!/usr/bin/env python3
"""
Fix production role persistence issues
This script should be run on the production server
"""
import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bs_engineering_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.db import transaction
from django.conf import settings

User = get_user_model()

def fix_production_roles():
    """Fix role persistence issues in production"""
    print("🚀 Fixing production role persistence issues...")
    print(f"📊 Database: {settings.DATABASES['default']['ENGINE']}")
    
    try:
        with transaction.atomic():
            # Ensure admin user exists with correct role
            admin_user, created = User.objects.get_or_create(
                username='admin',
                defaults={
                    'email': 'admin@bsengineering.com',
                    'first_name': 'Admin',
                    'last_name': 'User',
                    'role': 'admin',
                    'is_staff': True,
                    'is_superuser': True,
                    'is_active': True
                }
            )
            
            # Force update admin user role
            admin_user.role = 'admin'
            admin_user.is_staff = True
            admin_user.is_superuser = True
            admin_user.is_active = True
            admin_user.save()
            
            print(f"✅ Admin user {'created' if created else 'updated'}: {admin_user.username}")
            
            # Fix all superusers to have admin role
            superusers = User.objects.filter(is_superuser=True)
            for user in superusers:
                if user.role != 'admin':
                    user.role = 'admin'
                    user.save()
                    print(f"✅ Fixed role for superuser: {user.username}")
            
            # Create a production test user
            prod_user, created = User.objects.get_or_create(
                username='prodtest',
                defaults={
                    'email': 'prodtest@bsengineering.com',
                    'first_name': 'Production',
                    'last_name': 'Test',
                    'role': 'admin',
                    'is_staff': True,
                    'is_superuser': True,
                    'is_active': True
                }
            )
            
            prod_user.role = 'admin'
            prod_user.is_staff = True
            prod_user.is_superuser = True
            prod_user.is_active = True
            prod_user.set_password('prod123')
            prod_user.save()
            
            print(f"✅ Production test user {'created' if created else 'updated'}: {prod_user.username}")
            
            # Verify all users have correct roles
            print("\n📋 User roles verification:")
            for user in User.objects.all():
                print(f"   {user.username}: {user.role} (staff: {user.is_staff}, superuser: {user.is_superuser})")
            
            print(f"\n🎉 Production role fix completed!")
            print(f"📊 Total users: {User.objects.count()}")
            print(f"📊 Admin users: {User.objects.filter(role='admin').count()}")
            
    except Exception as e:
        print(f"❌ Error fixing production roles: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == '__main__':
    success = fix_production_roles()
    if success:
        print("\n✅ Production role fix completed successfully!")
    else:
        print("\n❌ Production role fix failed!")
        sys.exit(1)
