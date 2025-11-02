@echo off
echo ============================================
echo FINVO - Quick Fix for Login Issues
echo ============================================
echo.

echo This script will help diagnose and fix login problems.
echo.

echo OPTION 1: Reset Admin Password on Production
echo ----------------------------------------
echo Run this command:
echo.
echo fly ssh console -C "python /app/backend/manage.py shell -c \"from django.contrib.auth import get_user_model; User = get_user_model(); admin = User.objects.get(username='admin'); admin.set_password('admin123'); admin.save(); print('Password reset to: admin123')\""
echo.
echo.

echo OPTION 2: Check Application Logs
echo ----------------------------------------
echo Run: fly logs
echo Look for authentication errors or traceback
echo.
echo.

echo OPTION 3: Clear Browser Data
echo ----------------------------------------
echo 1. Press Ctrl+Shift+Delete in your browser
echo 2. Select "Cookies and other site data"
echo 3. Select "Cached images and files"
echo 4. Clear data
echo 5. Try logging in again in incognito mode
echo.
echo.

echo OPTION 4: Verify Backend Health
echo ----------------------------------------
echo Run: fly status
echo Check if app is running and healthy
echo.
echo.

echo OPTION 5: Test API Directly
echo ----------------------------------------
echo Visit: https://finvo-1vyg1q.fly.dev/api/
echo If you see JSON with endpoints, backend is working
echo.
echo.

echo ============================================
echo Current Backend Status:
echo ============================================
fly status
echo.

echo ============================================
echo Recent Logs (Last 20 lines):
echo ============================================
fly logs --limit 20
echo.

pause
