"""
URL configuration for bs_engineering_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.db import connection

def health_check(request):
    """Lightweight health check that doesn't hit the database"""
    from django.db import connection
    from django.db.utils import OperationalError
    
    try:
        # Quick memory status check
        import psutil
        memory = psutil.virtual_memory()
        if memory.percent > 95:  # If memory usage is above 95%
            return HttpResponse("Memory critical", status=500)
            
        # Verify DB connection is available but don't query
        connection.ensure_connection()
        
        return HttpResponse(
            "OK",
            status=200,
            headers={
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        )
    except OperationalError:
        return HttpResponse("Database unavailable", status=503)
    except Exception as e:
        return HttpResponse(str(e), status=500)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('health/', health_check, name='health_check'),
]
