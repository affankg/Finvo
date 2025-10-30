"""
Test script to verify role persistence fix
Run this after deployment to verify the fix is working
"""

import requests
import time

# Configuration
BASE_URL = "https://finvo-1vyg1q.fly.dev"
ADMIN_URL = f"{BASE_URL}/admin"

print("=" * 60)
print("Role Persistence Verification Script")
print("=" * 60)

# Test 1: Check if backend is responding
print("\n1. Testing backend health...")
try:
    response = requests.get(f"{BASE_URL}/health/", timeout=10)
    if response.status_code == 200:
        print("   ✓ Backend is healthy")
    else:
        print(f"   ✗ Backend returned status code: {response.status_code}")
except Exception as e:
    print(f"   ✗ Error connecting to backend: {e}")

# Test 2: Check API endpoint
print("\n2. Testing API availability...")
try:
    response = requests.get(f"{BASE_URL}/api/", timeout=10)
    if response.status_code in [200, 401]:  # 401 is expected without auth
        print("   ✓ API is accessible")
    else:
        print(f"   ✗ API returned status code: {response.status_code}")
except Exception as e:
    print(f"   ✗ Error accessing API: {e}")

# Test 3: Check admin panel
print("\n3. Testing admin panel...")
try:
    response = requests.get(f"{ADMIN_URL}/", timeout=10, allow_redirects=False)
    if response.status_code in [200, 302]:  # 302 redirect to login is normal
        print("   ✓ Admin panel is accessible")
    else:
        print(f"   ✗ Admin returned status code: {response.status_code}")
except Exception as e:
    print(f"   ✗ Error accessing admin: {e}")

# Test 4: Check CSRF token availability
print("\n4. Testing CSRF configuration...")
try:
    session = requests.Session()
    response = session.get(f"{ADMIN_URL}/login/", timeout=10)
    
    # Check if CSRF cookie is set
    csrf_cookie = session.cookies.get('csrftoken')
    if csrf_cookie:
        print(f"   ✓ CSRF token cookie is set")
    else:
        print("   ✗ CSRF token cookie not found")
    
    # Check CSRF in response headers
    if 'csrftoken' in session.cookies or 'csrf' in response.text.lower():
        print("   ✓ CSRF protection is active")
    else:
        print("   ⚠ CSRF configuration may need verification")
        
except Exception as e:
    print(f"   ✗ Error checking CSRF: {e}")

print("\n" + "=" * 60)
print("Manual Testing Required:")
print("=" * 60)
print(f"""
1. Go to: {ADMIN_URL}
2. Login with your admin credentials
3. Navigate to: {ADMIN_URL}/api/user/1/change/
4. Change the role from 'viewer' to 'admin'
5. Click 'Save'
6. Wait 5 minutes and check if role is still 'admin'
7. Check the logs with: fly logs

Expected Results:
- No CSRF errors in admin login
- Role changes save successfully
- Role persists after hours (not reverting to viewer)
- Logs show: "Role successfully saved as admin"
""")

print("=" * 60)
print("Deployment Complete - Please test manually!")
print("=" * 60)
