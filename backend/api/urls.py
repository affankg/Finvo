from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    UserViewSet, ClientViewSet, ServiceViewSet,
    QuotationViewSet, InvoiceViewSet, ActivityLogViewSet, NumberSequenceViewSet,
    InteractionViewSet, ClientAttachmentViewSet,
    CustomTokenObtainPairView, logout_view, profile_view, dashboard_view, currency_choices_view,
    financial_charts_data, financial_summary
)
from .financial_views import (
    FinancialAccountViewSet, FinancialActivityViewSet, FinancialAttachmentViewSet,
    FinancialAuditLogViewSet, financial_dashboard, generate_balance_sheet,
    export_financial_report, simple_export_test, get_approved_quotations
)
from .project_views import (
    ProjectViewSet, ProjectAssignmentViewSet, ProjectAttachmentViewSet,
    ProjectMilestoneViewSet, ProjectNoteViewSet, ProjectAnalyticsViewSet
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

# Financial endpoints
router.register(r'financial-accounts', FinancialAccountViewSet)
router.register(r'financial-activities', FinancialActivityViewSet)
router.register(r'financial-attachments', FinancialAttachmentViewSet)
router.register(r'financial-audit-logs', FinancialAuditLogViewSet)

# Project Management endpoints
router.register(r'projects', ProjectViewSet)
router.register(r'project-assignments', ProjectAssignmentViewSet)
router.register(r'project-attachments', ProjectAttachmentViewSet)
router.register(r'project-milestones', ProjectMilestoneViewSet)
router.register(r'project-notes', ProjectNoteViewSet)
router.register(r'project-analytics', ProjectAnalyticsViewSet, basename='project-analytics')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/profile/', profile_view, name='profile'),
    path('dashboard/', dashboard_view, name='dashboard'),
    path('currencies/', currency_choices_view, name='currency_choices'),
    # Financial endpoints
    path('financial-dashboard/', financial_dashboard, name='financial_dashboard'),
    path('balance-sheet/', generate_balance_sheet, name='balance_sheet'),
    path('test-export/', simple_export_test, name='test_export'),
    path('simple-export/', simple_export_test, name='simple_export'),
    path('export-financial-report/', export_financial_report, name='export_financial_report'),
    path('approved-quotations/', get_approved_quotations, name='approved_quotations'),
    
    # New Chart Data endpoints
    path('financial-charts/', financial_charts_data, name='financial_charts_data'),
    path('financial-summary/', financial_summary, name='financial_summary'),
]
