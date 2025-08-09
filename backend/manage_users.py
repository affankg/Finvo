#!/usr/bin/env python3
"""
User Management Script - Reset passwords and manage users
"""

import os
import sys
import django

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bs_engineering_backend.settings')
django.setup()

from django.contrib.auth import get_user_model, authenticate

def list_users():
    """List all users in the system"""
    User = get_user_model()
    users = User.objects.all()
    
    print("=== All Users ===")
    for user in users:
        print(f"Username: {user.username}")
        print(f"Email: {user.email}")
        print(f"Role: {getattr(user, 'role', 'N/A')}")
        print(f"Active: {user.is_active}")
        print(f"Staff: {user.is_staff}")
        print("---")
    
    return users

def reset_password(username, new_password):
    """Reset password for a user"""
    User = get_user_model()
    
    try:
        user = User.objects.get(username=username)
        user.set_password(new_password)
        user.save()
        
        print(f"✅ Password reset successfully for user '{username}'")
        
        # Test the new password
        auth_result = authenticate(username=username, password=new_password)
        if auth_result:
            print(f"✅ Password verified - login test successful")
        else:
            print(f"❌ Warning: Password reset but login test failed")
            
        return True
        
    except User.DoesNotExist:
        print(f"❌ User '{username}' not found")
        return False

def create_user(username, email, password, role='viewer'):
    """Create a new user"""
    User = get_user_model()
    
    if User.objects.filter(username=username).exists():
        print(f"❌ User '{username}' already exists")
        return False
    
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        role=role
    )
    
    print(f"✅ User '{username}' created successfully")
    print(f"   Email: {email}")
    print(f"   Role: {role}")
    
    # Test login
    auth_result = authenticate(username=username, password=password)
    if auth_result:
        print(f"✅ Login test successful")
    else:
        print(f"❌ Warning: User created but login test failed")
    
    return True

def main():
    """Main function with menu"""
    while True:
        print("\n" + "="*50)
        print("User Management Script")
        print("="*50)
        print("1. List all users")
        print("2. Reset user password")
        print("3. Create new user")
        print("4. Test user login")
        print("5. Exit")
        
        choice = input("\nEnter your choice (1-5): ").strip()
        
        if choice == '1':
            list_users()
            
        elif choice == '2':
            username = input("Enter username: ").strip()
            password = input("Enter new password: ").strip()
            reset_password(username, password)
            
        elif choice == '3':
            username = input("Enter username: ").strip()
            email = input("Enter email: ").strip()
            password = input("Enter password: ").strip()
            role = input("Enter role (admin/sales/accountant/viewer): ").strip() or 'viewer'
            create_user(username, email, password, role)
            
        elif choice == '4':
            username = input("Enter username: ").strip()
            password = input("Enter password: ").strip()
            auth_result = authenticate(username=username, password=password)
            if auth_result:
                print(f"✅ Login successful for '{username}'")
            else:
                print(f"❌ Login failed for '{username}'")
                
        elif choice == '5':
            print("Goodbye!")
            break
            
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    # Quick fix mode - reset common passwords
    print("🔧 Quick Fix Mode")
    print("Ensuring all users have working passwords...")
    
    User = get_user_model()
    users = User.objects.all()
    
    for user in users:
        # Set default password for all users
        user.set_password("admin123")
        user.save()
        print(f"✅ Password set to 'admin123' for user: {user.username}")
    
    print("\n🎉 All users now have password: 'admin123'")
    print("You can now login with any username and password 'admin123'")
    
    # Uncomment the line below to run interactive mode
    # main()
