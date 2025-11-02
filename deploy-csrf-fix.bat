@echo off
echo ============================================
echo Deploying CSRF Fix to Fly.io
echo ============================================

echo.
echo Step 1: Committing changes...
git add -A
git commit -m "Fix CSRF issues with debug middleware and proper cookie settings"

echo.
echo Step 2: Deploying to Fly.io...
fly deploy

echo.
echo Step 3: After deployment, clear browser cache:
echo    - Press Ctrl+Shift+Delete in Chrome
echo    - Clear cookies for finvo-1vyg1q.fly.dev
echo    - Or use Incognito/Private mode
echo.
echo Step 4: Clear sessions on server (if needed):
echo    fly ssh console
echo    python manage.py clear_sessions
echo    exit
echo.
echo ============================================
echo Deployment process initiated!
echo ============================================
pause
