"""
Financial Views for BS Engineering System
Advanced Project Expense and Financial Flow Tracking
"""

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Sum, Count, Avg
from django.utils import timezone
from django.http import HttpResponse
from datetime import datetime, timedelta
from decimal import Decimal
import csv
import json
import os
from io import StringIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet
from django.conf import settings

from .financial_models import (
    FinancialAccount,
    FinancialActivity,
    FinancialAttachment,
    JournalEntry,
    JournalEntryLine,
    FinancialReport,
    FinancialAuditLog,
)
from .financial_serializers import (
    FinancialAccountSerializer,
    FinancialActivitySerializer,
    FinancialActivityListSerializer,
    FinancialAttachmentSerializer,
    JournalEntrySerializer,
    FinancialReportSerializer,
    FinancialAuditLogSerializer,
    BalanceSheetSerializer,
    IncomeStatementSerializer,
    DashboardInsightsSerializer,
)
from .permissions import RoleBasedPermission
from .models import Client, Quotation, Invoice
from .serializers import QuotationSerializer


class FinancialAccountViewSet(viewsets.ModelViewSet):
    """ViewSet for managing financial accounts (Chart of Accounts)"""
    queryset = FinancialAccount.objects.all()
    serializer_class = FinancialAccountSerializer
    permission_classes = [RoleBasedPermission]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by account type
        account_type = self.request.query_params.get('account_type')
        if account_type:
            queryset = queryset.filter(account_type=account_type)
        
        # Filter by parent (for hierarchical view)
        parent_id = self.request.query_params.get('parent')
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        
        # Only active accounts by default
        if self.request.query_params.get('include_inactive') != 'true':
            queryset = queryset.filter(is_active=True)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def hierarchy(self, request):
        """Get account hierarchy"""
        accounts = FinancialAccount.objects.filter(parent__isnull=True, is_active=True)
        serializer = self.get_serializer(accounts, many=True)
        return Response(serializer.data)


class FinancialActivityViewSet(viewsets.ModelViewSet):
    """ViewSet for managing financial activities"""
    queryset = FinancialActivity.objects.select_related(
        'client', 'account', 'created_by', 'approved_by',
        'project_quotation', 'project_invoice'
    ).prefetch_related('attachments')
    permission_classes = [RoleBasedPermission]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return FinancialActivityListSerializer
        return FinancialActivitySerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by activity type
        activity_type = self.request.query_params.get('activity_type')
        if activity_type:
            queryset = queryset.filter(activity_type=activity_type)
            
        # Enhanced filtering
        client_id = self.request.query_params.get('client')
        if client_id:
            queryset = queryset.filter(client_id=client_id)
            
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
            
        date_from = self.request.query_params.get('date_from')
        if date_from:
            queryset = queryset.filter(transaction_date__gte=date_from)
            
        date_to = self.request.query_params.get('date_to')
        if date_to:
            queryset = queryset.filter(transaction_date__lte=date_to)

        return queryset

    def perform_create(self, serializer):
        """Create activity and associated records"""
        activity = serializer.save(created_by=self.request.user)

        # If an invoice is created, automatically generate a receivable
        if activity.project_invoice and activity.activity_type == 'invoice':
            FinancialActivity.objects.create(
                activity_type='receivable',
                client=activity.client,
                project_invoice=activity.project_invoice,
                project_quotation=activity.project_quotation,
                amount=activity.amount,
                currency=activity.currency,
                description=f"Receivable for Invoice {activity.project_invoice.number}",
                transaction_date=activity.transaction_date,
                due_date=activity.project_invoice.due_date,
                status='pending',
                created_by=self.request.user,
                account=activity.account # Or a specific receivables account
            )
        
        # Log the creation action
        self._log_action('create', activity, serializer.data)

    def perform_update(self, serializer):
        """Update activity and log changes"""
        instance = self.get_object()
        
        # Capture old data for logging
        old_data = FinancialActivitySerializer(instance).data
        
        updated_instance = serializer.save()
        
        # Capture new data
        new_data = FinancialActivitySerializer(updated_instance).data
        
        # Compare and log changes
        changes = {}
        for key, value in old_data.items():
            if new_data.get(key) != value:
                changes[key] = {
                    'old': value,
                    'new': new_data.get(key)
                }
        
        if changes:
            self._log_action('update', updated_instance, changes)

    def perform_destroy(self, instance):
        """Delete activity and log action"""
        self._log_action('delete', instance)
        instance.delete()

    def _log_action(self, action, instance, changes=None):
        """Helper to create audit log entries"""
        FinancialAuditLog.objects.create(
            user=self.request.user,
            action=action,
            content_type=f'financial_activity',
            object_id=instance.pk,
            object_representation=str(instance),
            field_changes=changes,
            description=f"User {self.request.user.username} {action}d financial activity {instance.reference_number}.",
            ip_address=self.request.META.get('REMOTE_ADDR')
        )

    @action(detail=True, methods=['post'], permission_classes=[RoleBasedPermission])
    def approve(self, request, pk=None):
        """Approve a financial activity"""
        activity = self.get_object()
        
        if request.user.role not in ['admin', 'accountant']:
            return Response(
                {'error': 'Only admin and accountant can approve activities'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if activity.status != 'pending':
            return Response(
                {'error': 'Only pending activities can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        activity.status = 'approved'
        activity.approved_by = request.user
        activity.approved_at = timezone.now()
        activity.save()
        
        # Create audit log
        FinancialAuditLog.objects.create(
            user=request.user,
            action='approve',
            content_type='financial_activity',
            object_id=activity.id,
            object_representation=str(activity),
            description=f"Approved financial activity: {activity.reference_number}",
            ip_address=self.get_client_ip(),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        serializer = self.get_serializer(activity)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject a financial activity"""
        activity = self.get_object()
        
        if request.user.role not in ['admin', 'accountant']:
            return Response(
                {'error': 'Only admin and accountant can reject activities'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if activity.status != 'pending':
            return Response(
                {'error': 'Only pending activities can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reason = request.data.get('reason', '')
        if not reason:
            return Response(
                {'error': 'Rejection reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        activity.status = 'rejected'
        activity.rejection_reason = reason
        activity.save()
        
        # Create audit log
        FinancialAuditLog.objects.create(
            user=request.user,
            action='reject',
            content_type='financial_activity',
            object_id=activity.id,
            object_representation=str(activity),
            description=f"Rejected financial activity: {activity.reference_number}. Reason: {reason}",
            ip_address=self.get_client_ip(),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        serializer = self.get_serializer(activity)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark a financial activity as paid"""
        activity = self.get_object()
        
        if request.user.role not in ['admin', 'accountant']:
            return Response(
                {'error': 'Only admin and accountant can mark activities as paid'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if activity.status != 'approved':
            return Response(
                {'error': 'Only approved activities can be marked as paid'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        activity.status = 'paid'
        activity.paid_date = timezone.now().date()
        activity.save()
        
        # Create audit log
        FinancialAuditLog.objects.create(
            user=request.user,
            action='pay',
            content_type='financial_activity',
            object_id=activity.id,
            object_representation=str(activity),
            description=f"Marked financial activity as paid: {activity.reference_number}",
            ip_address=self.get_client_ip(),
            user_agent=request.META.get('HTTP_USER_AGENT', '')
        )
        
        serializer = self.get_serializer(activity)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get financial activities summary"""
        queryset = self.get_queryset()
        
        summary = {
            'total_activities': queryset.count(),
            'by_type': {},
            'by_status': {},
            'total_amounts': {},
        }
        
        # Summary by type
        for activity_type in FinancialActivity.ACTIVITY_TYPES:
            type_key = activity_type[0]
            type_qs = queryset.filter(activity_type=type_key)
            summary['by_type'][type_key] = {
                'count': type_qs.count(),
                'total_amount': type_qs.aggregate(Sum('amount'))['amount__sum'] or 0
            }
        
        # Summary by status
        for status_choice in FinancialActivity.STATUS_CHOICES:
            status_key = status_choice[0]
            status_qs = queryset.filter(status=status_key)
            summary['by_status'][status_key] = {
                'count': status_qs.count(),
                'total_amount': status_qs.aggregate(Sum('amount'))['amount__sum'] or 0
            }
        
        return Response(summary)
    
    def get_client_ip(self):
        """Get client IP address"""
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = self.request.META.get('REMOTE_ADDR')
        return ip


class FinancialAttachmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing financial attachments"""
    queryset = FinancialAttachment.objects.select_related('activity', 'uploaded_by')
    serializer_class = FinancialAttachmentSerializer
    permission_classes = [RoleBasedPermission]
    
    def perform_create(self, serializer):
        """Create attachment with audit trail"""
        attachment = serializer.save(uploaded_by=self.request.user)
        
        # Create audit log
        FinancialAuditLog.objects.create(
            user=self.request.user,
            action='create',
            content_type='financial_attachment',
            object_id=attachment.id,
            object_representation=str(attachment),
            description=f"Uploaded attachment: {attachment.name} for activity {attachment.activity.reference_number}",
            ip_address=self.get_client_ip(),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
    
    def get_client_ip(self):
        """Get client IP address"""
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = self.request.META.get('REMOTE_ADDR')
        return ip


class FinancialAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing financial audit logs"""
    queryset = FinancialAuditLog.objects.select_related('user')
    serializer_class = FinancialAuditLogSerializer
    permission_classes = [RoleBasedPermission]
    
    def get_queryset(self):
        # Only admin can view audit logs
        if self.request.user.role != 'admin':
            return FinancialAuditLog.objects.none()
        
        queryset = super().get_queryset()
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(created_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(created_at__lte=date_to)
        
        # Filter by user
        user_id = self.request.query_params.get('user')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Filter by action
        action = self.request.query_params.get('action')
        if action:
            queryset = queryset.filter(action=action)
        
        # Filter by content type
        content_type = self.request.query_params.get('content_type')
        if content_type:
            queryset = queryset.filter(content_type=content_type)
        
        return queryset


@api_view(['GET'])
@permission_classes([RoleBasedPermission])
def financial_dashboard(request):
    """Get financial dashboard data with insights"""
    if request.user.role not in ['admin', 'accountant', 'sales']:
        return Response(
            {'error': 'Access denied'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    current_date = timezone.now().date()
    current_month_start = current_date.replace(day=1)
    
    # Base queryset based on user role
    if request.user.role == 'sales':
        activities_qs = FinancialActivity.objects.filter(
            Q(created_by=request.user) |
            Q(client__assigned_to=request.user)
        )
    else:
        activities_qs = FinancialActivity.objects.all()
    
    # Calculate insights
    insights = {
        'total_receivables': activities_qs.filter(
            activity_type='receivable',
            status__in=['pending', 'approved']
        ).aggregate(Sum('amount'))['amount__sum'] or 0,
        
        'total_payables': activities_qs.filter(
            activity_type='payable',
            status__in=['pending', 'approved']
        ).aggregate(Sum('amount'))['amount__sum'] or 0,
        
        'total_expenses_current_month': activities_qs.filter(
            activity_type='expense',
            transaction_date__gte=current_month_start,
            status='approved'
        ).aggregate(Sum('amount'))['amount__sum'] or 0,
        
        'total_income_current_month': activities_qs.filter(
            activity_type='income',
            transaction_date__gte=current_month_start,
            status='approved'
        ).aggregate(Sum('amount'))['amount__sum'] or 0,
        
        'overdue_receivables': activities_qs.filter(
            activity_type='receivable',
            status__in=['pending', 'approved'],
            due_date__lt=current_date
        ).aggregate(Sum('amount'))['amount__sum'] or 0,
        
        'overdue_payables': activities_qs.filter(
            activity_type='payable',
            status__in=['pending', 'approved'],
            due_date__lt=current_date
        ).aggregate(Sum('amount'))['amount__sum'] or 0,
        
        'pending_approvals': activities_qs.filter(status='pending').count(),
    }
    
    # Cash flow trend (last 6 months)
    cash_flow_trend = []
    for i in range(6):
        month_start = (current_date.replace(day=1) - timedelta(days=i*30)).replace(day=1)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)
        
        income = activities_qs.filter(
            activity_type='income',
            transaction_date__gte=month_start,
            transaction_date__lte=month_end,
            status='approved'
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        expenses = activities_qs.filter(
            activity_type='expense',
            transaction_date__gte=month_start,
            transaction_date__lte=month_end,
            status='approved'
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        cash_flow_trend.insert(0, {
            'month': month_start.strftime('%Y-%m'),
            'income': float(income),
            'expenses': float(expenses),
            'net': float(income - expenses)
        })
    
    insights['cash_flow_trend'] = cash_flow_trend
    
    # Top expenses by category (account)
    top_expenses = list(activities_qs.filter(
        activity_type='expense',
        status='approved',
        transaction_date__gte=current_month_start
    ).values(
        'account__name'
    ).annotate(
        total=Sum('amount')
    ).order_by('-total')[:5])
    
    insights['top_expenses_by_category'] = top_expenses
    
    # Revenue vs Expenses chart data
    insights['revenue_vs_expenses_chart'] = {
        'current_month_revenue': float(insights['total_income_current_month']),
        'current_month_expenses': float(insights['total_expenses_current_month']),
        'previous_month_revenue': 0,  # Could be calculated
        'previous_month_expenses': 0,  # Could be calculated
    }
    
    serializer = DashboardInsightsSerializer(insights)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def generate_balance_sheet(request):
    """Generate comprehensive balance sheet"""
    try:
        # Get date parameters
        date_to = request.query_params.get('date_to', timezone.now().date())
        if isinstance(date_to, str):
            date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
        
        # Calculate receivables (what customers owe us)
        total_receivables = FinancialActivity.objects.filter(
            activity_type='receivable',
            status__in=['pending', 'approved', 'overdue'],
            transaction_date__lte=date_to
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Calculate payables (what we owe to vendors)
        total_payables = FinancialActivity.objects.filter(
            activity_type='payable',
            status__in=['pending', 'approved', 'overdue'],
            transaction_date__lte=date_to
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Calculate total income (revenue earned)
        total_income = FinancialActivity.objects.filter(
            activity_type='income',
            status='paid',
            transaction_date__lte=date_to
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Calculate total expenses
        total_expenses = FinancialActivity.objects.filter(
            activity_type='expense',
            status__in=['paid', 'approved'],
            transaction_date__lte=date_to
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Calculate pending/unpaid amounts
        pending_receivables = FinancialActivity.objects.filter(
            activity_type='receivable',
            status='pending',
            transaction_date__lte=date_to
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        paid_receivables = FinancialActivity.objects.filter(
            activity_type='receivable',
            status='paid',
            transaction_date__lte=date_to
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Cash calculation (simplified - income received minus expenses paid)
        cash_on_hand = total_income - total_expenses
        
        # Retained earnings (cumulative profit)
        retained_earnings = total_income - total_expenses
        
        balance_sheet_data = {
            'period_from': date_to.replace(month=1, day=1),
            'period_to': date_to,
            'assets': {
                'cash_on_hand': float(cash_on_hand),
                'accounts_receivable_pending': float(pending_receivables),
                'accounts_receivable_paid': float(paid_receivables),
                'total_receivables': float(total_receivables),
            },
            'liabilities': {
                'accounts_payable': float(total_payables),
                'total_expenses_owed': float(total_expenses),
            },
            'equity': {
                'retained_earnings': float(retained_earnings),
                'current_period_income': float(total_income),
                'current_period_expenses': float(total_expenses),
            },
            'total_assets': float(cash_on_hand + total_receivables),
            'total_liabilities': float(total_payables),
            'total_equity': float(retained_earnings),
            'generated_at': timezone.now(),
            'balance_check': float((cash_on_hand + total_receivables) - (total_payables + retained_earnings)),
        }
        
        return Response(balance_sheet_data)
    
    except Exception as e:
        return Response(
            {'error': f'Failed to generate balance sheet: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def simple_export_test(request):
    """Simple export test"""
    return Response({'message': 'Simple export working', 'format': request.query_params.get('format', 'none')})


@api_view(['GET'])
def export_financial_report(request):
    """Export financial report as PDF or CSV"""
    try:
        # Simple permission check
        if not hasattr(request.user, 'role') or request.user.role not in ['admin', 'accountant']:
            return Response(
                {'error': 'Only admin and accountant can export reports'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        export_format = request.query_params.get('format', 'csv')
        
        # Get activities (simplified query)
        activities = FinancialActivity.objects.all()[:10]  # Limit for testing
        
        if export_format == 'csv':
            return export_activities_csv(activities)
        elif export_format == 'pdf':
            return export_activities_pdf_simple(activities)
        else:
            return Response(
                {'message': 'Export endpoint reached', 'format': export_format},
                status=status.HTTP_200_OK
            )
    except Exception as e:
        return Response(
            {'error': f'Export failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def export_activities_pdf_simple(activities):
    """Simple PDF export for testing"""
    try:
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="test_report.pdf"'
        
        doc = SimpleDocTemplate(response, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Simple title
        title = Paragraph("BS Engineering - Financial Report", styles['Title'])
        story.append(title)
        story.append(Spacer(1, 12))
        
        # Simple table
        data = [['Reference', 'Type', 'Amount', 'Status']]
        for activity in activities[:10]:
            data.append([
                activity.reference_number,
                activity.activity_type,
                str(activity.amount),
                activity.status
            ])
        
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        story.append(table)
        doc.build(story)
        
        return response
    except Exception as e:
        return Response(
            {'error': f'PDF export failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def export_activities_csv(activities):
    """Export activities to CSV"""
    try:
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="financial_activities.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Reference Number', 'Type', 'Amount', 'Currency', 'Client',
            'Account', 'Description', 'Bill To', 'Status', 'Transaction Date',
            'Due Date', 'Created By', 'Created At'
        ])
        
        for activity in activities:
            writer.writerow([
                activity.reference_number,
                activity.activity_type.capitalize(),
                str(activity.amount),
                activity.currency,
                activity.client.name if activity.client else 'N/A',
                activity.account.name,
                activity.description or '',
                activity.bill_to or '',
                activity.status.capitalize(),
                activity.transaction_date.strftime('%Y-%m-%d'),
                activity.due_date.strftime('%Y-%m-%d') if activity.due_date else '',
                activity.created_by.username,
                activity.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            ])
        
        return response
    except Exception as e:
        # Return an error response that's compatible with the calling function
        return Response(
            {'error': f'CSV export failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def export_activities_pdf(activities):
    """Export activities to PDF with professional BS Engineering branding"""
    try:
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="BS_Engineering_Financial_Report.pdf"'
        
        # Custom page template with header and footer
        def add_header_footer(canvas, doc):
            # Header
            canvas.saveState()
            
            # Company header with blue background
            canvas.setFillColor(colors.HexColor('#1e40af'))  # Professional blue
            canvas.rect(0, doc.height + 0.5*inch, doc.width + 2*inch, 1.2*inch, fill=1)
            
            # Add company logo if available
            logo_path = os.path.join(settings.MEDIA_ROOT, 'images', 'bs-logo-new.png')
            if os.path.exists(logo_path):
                try:
                    canvas.drawImage(logo_path, 0.5*inch, doc.height + 0.6*inch, 
                                   width=2.5*inch, height=1.25*inch, preserveAspectRatio=True)
                except Exception as e:
                    print(f"Warning: Could not load company logo in PDF: {e}")
            
            # Company name in white
            canvas.setFillColor(colors.white)
            canvas.setFont("Helvetica-Bold", 20)
            canvas.drawString(3.2*inch, doc.height + 0.9*inch, "BS ENGINEERING")
            
            # Company tagline
            canvas.setFont("Helvetica", 10)
            canvas.drawString(3.2*inch, doc.height + 0.7*inch, "Your trusted engineering partner")
            
            # Date and time aligned to right
            canvas.setFont("Helvetica", 9)
            current_time = datetime.now().strftime('%B %d, %Y at %I:%M %p')
            canvas.drawRightString(doc.width + 0.5*inch, doc.height + 0.9*inch, f"Generated: {current_time}")
            
            # Company contact info aligned to right
            canvas.setFont("Helvetica", 8)
            canvas.drawRightString(doc.width + 0.5*inch, doc.height + 0.75*inch, "Suite no 407, 4th Floor, Silver Trade Tower")
            canvas.drawRightString(doc.width + 0.5*inch, doc.height + 0.65*inch, "B46, Block 13-A, Gulshan-e-Iqbal, Karachi, Pakistan: 75300")
            
            # Footer
            canvas.setFillColor(colors.black)
            canvas.setFont("Helvetica", 8)
            footer_y = 0.5*inch
            
            # Footer line
            canvas.line(0.5*inch, footer_y + 0.2*inch, doc.width + 0.5*inch, footer_y + 0.2*inch)
            
            # Footer content
            canvas.drawString(0.5*inch, footer_y, "Thank you for choosing BS Engineering!")
            canvas.drawRightString(doc.width + 0.5*inch, footer_y, f"Generated: {current_time}")
            
            # Contact info in footer
            canvas.drawString(0.5*inch, footer_y - 0.15*inch, "Questions? Contact us: bs@bsconsults.com | P: 92.21.34982786 | C: +92.3063216344")
            canvas.drawRightString(doc.width + 0.5*inch, footer_y - 0.15*inch, "www.bsconsults.com")
            
            canvas.restoreState()
        
        # Create document with custom template
        doc = SimpleDocTemplate(
            response, 
            pagesize=letter,
            topMargin=2*inch,
            bottomMargin=1*inch,
            leftMargin=0.5*inch,
            rightMargin=0.5*inch
        )
        
        styles = getSampleStyleSheet()
        story = []
        
        # Custom styles
        title_style = styles['Heading1'].clone('CustomTitle')
        title_style.fontSize = 18
        title_style.textColor = colors.HexColor('#1e40af')
        title_style.alignment = TA_CENTER
        title_style.spaceAfter = 0.3*inch
        
        subtitle_style = styles['Heading2'].clone('CustomSubtitle')
        subtitle_style.fontSize = 12
        subtitle_style.textColor = colors.HexColor('#374151')
        subtitle_style.alignment = TA_LEFT
        subtitle_style.spaceBefore = 0.2*inch
        subtitle_style.spaceAfter = 0.1*inch
        
        # Title
        title = Paragraph("FINANCIAL ACTIVITIES REPORT", title_style)
        story.append(title)
        
        # Report summary
        total_amount = sum(float(activity.amount) for activity in activities)
        summary_text = f"""
        <b>Report Summary:</b><br/>
        Total Records: {len(activities)}<br/>
        Total Amount: {activities[0].currency if activities else 'USD'} {total_amount:,.2f}<br/>
        Report Date: {datetime.now().strftime('%B %d, %Y')}
        """
        summary = Paragraph(summary_text, styles['Normal'])
        story.append(summary)
        story.append(Spacer(1, 0.3*inch))
        
        # Activities table
        if activities:
            # Table headers
            data = [[
                Paragraph('<b>Reference No.</b>', styles['Normal']),
                Paragraph('<b>Type</b>', styles['Normal']),
                Paragraph('<b>Amount</b>', styles['Normal']),
                Paragraph('<b>Client</b>', styles['Normal']),
                Paragraph('<b>Status</b>', styles['Normal']),
                Paragraph('<b>Date</b>', styles['Normal'])
            ]]
            
            # Table data
            for activity in activities[:50]:  # Limit to 50 for PDF
                data.append([
                    Paragraph(activity.reference_number, styles['Normal']),
                    Paragraph(activity.activity_type.capitalize(), styles['Normal']),
                    Paragraph(f"{activity.currency} {float(activity.amount):,.2f}", styles['Normal']),
                    Paragraph(activity.client.name[:25] if activity.client else 'N/A', styles['Normal']),
                    Paragraph(activity.status.capitalize(), styles['Normal']),
                    Paragraph(activity.transaction_date.strftime('%d/%m/%Y'), styles['Normal']),
                ])
            
            # Create table with professional styling
            table = Table(data, colWidths=[1.2*inch, 0.8*inch, 1*inch, 1.5*inch, 0.8*inch, 0.8*inch])
            table.setStyle(TableStyle([
                # Header styling
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                
                # Data styling
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
                ('ALIGN', (2, 1), (2, -1), 'RIGHT'),  # Amount column right-aligned
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
                
                # Border styling
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
                ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor('#1e40af')),
                
                # Padding
                ('TOPPADDING', (0, 1), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
                ('LEFTPADDING', (0, 0), (-1, -1), 6),
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ]))
            
            story.append(table)
        else:
            no_data = Paragraph("No financial activities found for the selected criteria.", styles['Normal'])
            story.append(no_data)
        
        # Build PDF with custom header/footer
        doc.build(story, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
        
        return response
    except Exception as e:
        return Response(
            {'error': f'PDF export failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_approved_quotations(request):
    """
    Returns a list of approved quotations that don't have an associated invoice yet.
    """
    quotations = Quotation.objects.filter(status='approved', invoice__isnull=True)
    serializer = QuotationSerializer(quotations, many=True)
    return Response(serializer.data)


class FinancialReportViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing and generating financial reports"""
    queryset = FinancialReport.objects.all()
    serializer_class = FinancialReportSerializer
    permission_classes = [RoleBasedPermission]
    
    @action(detail=False, methods=['get'])
    def generate(self, request):
        """Generate financial report"""
        # Simplified report generation logic
        report_data = {
            'total_income': 0,
            'total_expense': 0,
            'net_income': 0,
        }
        
        # Income and expense activities
        income_activities = FinancialActivity.objects.filter(activity_type='income', status='approved')
        expense_activities = FinancialActivity.objects.filter(activity_type='expense', status='approved')
        
        # Calculate totals
        report_data['total_income'] = income_activities.aggregate(Sum('amount'))['amount__sum'] or 0
        report_data['total_expense'] = expense_activities.aggregate(Sum('amount'))['amount__sum'] or 0
        report_data['net_income'] = report_data['total_income'] - report_data['total_expense']
        
        serializer = self.get_serializer(report_data)
        return Response(serializer.data)
