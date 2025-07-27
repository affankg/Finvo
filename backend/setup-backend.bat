@echo off
echo Setting up BS Engineering Backend...
echo.

echo Installing Python dependencies...
pip install -r requirements.txt

echo.
echo Creating database migrations...
python manage.py makemigrations

echo.
echo Applying migrations...
python manage.py migrate

echo.
echo Creating sample data...
python manage.py create_sample_data

echo.
echo Setup completed successfully!
echo.
echo You can now run the server with:
echo python manage.py runserver
echo.
echo Access the admin panel at: http://127.0.0.1:8000/admin/
echo Admin credentials: admin/admin123
echo.
echo API is available at: http://127.0.0.1:8000/api/
echo.
pause
