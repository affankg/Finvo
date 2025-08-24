#!/usr/bin/env python3
"""
Script to troubleshoot login issues and check user credentials
"""

import os
import sys
import django
import requests
import json

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bs_engineering_backend.settings')
django.setup()

from django.contrib.auth.models import User
from django.contrib.auth import authenticate

def check_user_credentials():
    """Check if the user exists and credentials are correct"""
    print("🔍 Checking User Credentials")
    print("=" * 50)
    
    username = "affan"
    password = "Oblique/111"
    
    print(f"Username: {username}")
    print(f"Password: {password}")
    print()
    
    # Check if user exists
    try:
        user = User.objects.get(username=username)
        print(f"✅ User '{username}' found in database")
        print(f"   - ID: {user.id}")
        print(f"   - Email: {user.email}")
        print(f"   - First name: {user.first_name}")
        print(f"   - Last name: {user.last_name}")
        print(f"   - Is active: {user.is_active}")
        print(f"   - Is staff: {user.is_staff}")
        print(f"   - Is superuser: {user.is_superuser}")
        print(f"   - Date joined: {user.date_joined}")
        print(f"   - Last login: {user.last_login}")
    except User.DoesNotExist:
        print(f"❌ User '{username}' not found in database")
        print("\n💡 Creating user...")
        try:
            user = User.objects.create_user(
                username=username,
                password=password,
                email="affan@example.com",
                first_name="Affan",
                is_staff=True,
                is_superuser=True
            )
            print(f"✅ User '{username}' created successfully")
        except Exception as e:
            print(f"❌ Failed to create user: {e}")
            return False
    
    # Test authentication
    print(f"\n🔐 Testing authentication...")
    auth_user = authenticate(username=username, password=password)
    
    if auth_user:
        print(f"✅ Authentication successful for '{username}'")
    else:
        print(f"❌ Authentication failed for '{username}'")
        
        # Try to reset password
        print("\n🔄 Attempting to reset password...")
        try:
            user.set_password(password)
            user.save()
            print(f"✅ Password reset successful")
            
            # Test again
            auth_user = authenticate(username=username, password=password)
            if auth_user:
                print(f"✅ Authentication now successful after password reset")
            else:
                print(f"❌ Authentication still failing after password reset")
        except Exception as e:
            print(f"❌ Failed to reset password: {e}")
    
    return True

def test_login_api():
    """Test the login API endpoint"""
    print("\n🌐 Testing Login API")
    print("=" * 30)
    
    api_url = "http://127.0.0.1:8000/api/auth/login/"
    credentials = {
        "username": "affan",
        "password": "Oblique/111"
    }
    
    try:
        print(f"Making POST request to: {api_url}")
        response = requests.post(api_url, json=credentials, timeout=5)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Login API successful")
            print(f"Response: {json.dumps(data, indent=2)}")
        else:
            print(f"❌ Login API failed")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server")
        print("💡 Make sure Django backend is running on port 8000")
    except Exception as e:
        print(f"❌ API test failed: {e}")

def check_project_urls():
    """Check correct URLs for the application"""
    print("\n🌐 Correct Application URLs")
    print("=" * 30)
    print("Frontend (React/Vite): http://localhost:5173")
    print("Backend (Django): http://localhost:8000")
    print("API Base: http://localhost:8000/api/")
    print()
    print("❌ Incorrect URL: http://192.168.0.158:3000/")
    print("✅ Correct URL: http://localhost:5173/")
    print()
    print("💡 If you want to access from another device:")
    print("   Frontend: http://192.168.0.158:5173/")
    print("   Backend: http://192.168.0.158:8000/")

def main():
    print("🚀 FinVo Login Troubleshooting Tool")
    print("="*60)
    
    # Check user credentials in database
    check_user_credentials()
    
    # Test login API
    test_login_api()
    
    # Show correct URLs
    check_project_urls()
    
    print("\n📋 Troubleshooting Steps:")
    print("1. ✅ Use correct URL: http://localhost:5173 (not port 3000)")
    print("2. ✅ Ensure Django backend is running: py manage.py runserver")
    print("3. ✅ Ensure React frontend is running: npm run dev")
    print("4. ✅ User credentials should now work: affan / Oblique/111")
    print("5. ✅ Check browser console for any JavaScript errors")

if __name__ == "__main__":
    main()
