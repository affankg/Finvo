from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserViewSet, ClientViewSet, ServiceViewSet,
    QuotationViewSet, InvoiceViewSet, ActivityLogViewSet, NumberSequenceViewSet,
    InteractionViewSet, ClientAttachmentViewSet,
    CustomTokenObtainPairView, logout_view, profile_view, dashboard_view, currency_choices_view
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'clients', ClientViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'quotations', QuotationViewSet)
router.register(r'invoices', InvoiceViewSet)
router.register(r'activity-logs', ActivityLogViewSet)
router.register(r'number-sequences', NumberSequenceViewSet)
router.register(r'interactions', InteractionViewSet)
router.register(r'client-attachments', ClientAttachmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/profile/', profile_view, name='profile'),
    path('dashboard/', dashboard_view, name='dashboard'),
    path('currencies/', currency_choices_view, name='currency_choices'),
]
