from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.http import HttpResponse
from django.conf import settings
from django.db.models import Q, Sum, Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta, datetime
import os
from collections import defaultdict

from .models import Client, Service, Quotation, Invoice, ActivityLog, User, NumberSequence, Interaction, ClientAttachment
from .serializers import (
    UserSerializer, ClientSerializer, ServiceSerializer,
    QuotationSerializer, InvoiceSerializer, ActivityLogSerializer, NumberSequenceSerializer,
    InteractionSerializer, ClientAttachmentSerializer
)
from .permissions import RoleBasedPermission
from .utils import generate_pdf, send_email_with_pdf

# Authentication Views
class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        # Use default JWT authentication
        response = super().post(request, *args, **kwargs)
        
        # If authentication successful, log the activity
        if response.status_code == 200:
            username = request.data.get('username')
            password = request.data.get('password')
            user = authenticate(username=username, password=password)
            if user:
                ActivityLog.objects.create(
                    user=user,
                    action='login',
                    content_type='auth',
                    object_id=user.id,
                    description=f'User {user.username} logged in'
                )
        
        return response

@api_view(['POST'])
def logout_view(request):
    try:
        refresh_token = request.data.get("refresh")
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        # Log logout activity
        if request.user.is_authenticated:
            ActivityLog.objects.create(
                user=request.user,
                action='logout',
                content_type='auth',
                object_id=request.user.id,
                description=f'User {request.user.username} logged out'
            )
        
        return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def profile_view(request):
    if request.user.is_authenticated:
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    return Response({"error": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
def dashboard_view(request):
    # Get statistics for dashboard
    total_clients = Client.objects.count()
    total_quotations = Quotation.objects.count()
    total_invoices = Invoice.objects.count()
    pending_invoices = Invoice.objects.filter(status__in=['draft', 'sent']).count()
    paid_invoices = Invoice.objects.filter(status='paid').count()
    
    # Recent activity
    recent_activities = ActivityLog.objects.select_related('user').order_by('-created_at')[:10]
    
    # Monthly stats
    current_month = timezone.now().date().replace(day=1)
    monthly_quotations = Quotation.objects.filter(date__gte=current_month).count()
    monthly_invoices = Invoice.objects.filter(date__gte=current_month).count()
    
    return Response({
        'stats': {
            'total_clients': total_clients,
            'total_quotations': total_quotations,
            'total_invoices': total_invoices,
            'pending_invoices': pending_invoices,
            'paid_invoices': paid_invoices,
            'monthly_quotations': monthly_quotations,
            'monthly_invoices': monthly_invoices,
        },
        'recent_activities': ActivityLogSerializer(recent_activities, many=True).data
    })

from .utils import generate_pdf, send_email_with_pdf
from .permissions import RoleBasedPermission

@api_view(['POST'])
def logout_view(request):
    try:
        refresh_token = request.data.get("refresh")
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        # Log logout activity
        if request.user.is_authenticated:
            ActivityLog.objects.create(
                user=request.user,
                action='logout',
                content_type='auth',
                object_id=request.user.id,
                description=f'User {request.user.username} logged out'
            )
        
        return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def profile_view(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['GET'])
def dashboard_view(request):
    # Get statistics for dashboard
    total_clients = Client.objects.count()
    total_quotations = Quotation.objects.count()
    total_invoices = Invoice.objects.count()
    pending_invoices = Invoice.objects.filter(status__in=['draft', 'sent']).count()
    paid_invoices = Invoice.objects.filter(status='paid').count()
    
    # This month quotations and invoices
    current_month = timezone.now().month
    current_year = timezone.now().year
    
    monthly_quotations = Quotation.objects.filter(
        date__month=current_month,
        date__year=current_year
    ).count()
    
    monthly_invoices = Invoice.objects.filter(
        date__month=current_month,
        date__year=current_year
    ).count()
    
    # Recent activity
    recent_activities = ActivityLog.objects.select_related('user').order_by('-created_at')[:10]
    
    return Response({
        'stats': {
            'total_clients': total_clients,
            'total_quotations': total_quotations,
            'total_invoices': total_invoices,
            'pending_invoices': pending_invoices,
            'paid_invoices': paid_invoices,
            'monthly_quotations': monthly_quotations,
            'monthly_invoices': monthly_invoices,
        },
        'recent_activities': ActivityLogSerializer(recent_activities, many=True).data
    })
@api_view(['GET'])
@permission_classes([AllowAny])
def currency_choices_view(request):
    """Get available currency choices"""
    from django.conf import settings
    currencies = getattr(settings, 'CURRENCY_CHOICES', [('PKR', 'Pakistani Rupee', 'Rs')])
    
    return Response({
        'currencies': [
            {
                'code': code,
                'name': name,
                'symbol': symbol
            }
            for code, name, symbol in currencies
        ],
        'default': getattr(settings, 'DEFAULT_CURRENCY', 'PKR')
    })

class RoleBasedPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.role == 'admin':
            return True
        
        if request.user.role == 'sales':
            if view.basename in ['client', 'quotation', 'service']:
                return True
            if view.basename == 'invoice' and request.method in ['GET', 'POST']:
                return True
        
        if request.user.role == 'accountant':
            if view.basename == 'invoice':
                return True
            if view.basename in ['client', 'quotation', 'service'] and request.method == 'GET':
                return True
        
        if request.user.role == 'viewer':
            return request.method == 'GET'
        
        return False

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, RoleBasedPermission]
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Bulk delete users"""
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': 'No IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Prevent self-deletion
        if request.user.id in ids:
            return Response({'error': 'Cannot delete your own account'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            deleted_count = User.objects.filter(id__in=ids).count()
            User.objects.filter(id__in=ids).delete()
            
            # Log bulk deletion activity
            ActivityLog.objects.create(
                user=request.user,
                action='bulk_delete',
                content_type='user',
                object_id=0,
                description=f'Bulk deleted {deleted_count} users'
            )
            
            return Response({'message': f'Successfully deleted {deleted_count} users'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all().select_related('assigned_to').prefetch_related('interactions', 'attachments')
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status', None)
        assigned_to = self.request.query_params.get('assigned_to', None)
        search = self.request.query_params.get('search', None)
        
        if status:
            queryset = queryset.filter(status=status)
        if assigned_to:
            queryset = queryset.filter(assigned_to=assigned_to)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(company__icontains=search) | 
                Q(email__icontains=search) |
                Q(tags__icontains=search)
            )
        
        return queryset.order_by('-updated_at')
    
    @action(detail=True, methods=['get'])
    def interactions(self, request, pk=None):
        """Get all interactions for a specific client"""
        client = self.get_object()
        interactions = client.interactions.all().order_by('-created_at')
        
        # Filter by interaction type if specified
        interaction_type = request.query_params.get('type', None)
        if interaction_type:
            interactions = interactions.filter(interaction_type=interaction_type)
        
        serializer = InteractionSerializer(interactions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def attachments(self, request, pk=None):
        """Get all attachments for a specific client"""
        client = self.get_object()
        attachments = client.attachments.all().order_by('-created_at')
        serializer = ClientAttachmentSerializer(attachments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Bulk delete clients"""
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': 'No IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            deleted_count = Client.objects.filter(id__in=ids).count()
            Client.objects.filter(id__in=ids).delete()
            
            # Log bulk deletion activity
            ActivityLog.objects.create(
                user=request.user,
                action='bulk_delete',
                content_type='client',
                object_id=0,  # No specific object ID for bulk operations
                description=f'Bulk deleted {deleted_count} clients'
            )
            
            return Response({'message': f'Successfully deleted {deleted_count} clients'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['get'])
    def summary(self, request, pk=None):
        """Get client summary with statistics"""
        client = self.get_object()
        
        # Get recent interactions
        recent_interactions = client.interactions.all().order_by('-created_at')[:5]
        
        # Get quotations and invoices
        quotations = client.quotation_set.all()
        invoices = client.invoice_set.all()
        
        return Response({
            'client': ClientSerializer(client).data,
            'statistics': {
                'total_interactions': client.interactions.count(),
                'total_quotations': quotations.count(),
                'total_invoices': invoices.count(),
                'total_quoted_amount': sum(q.total_amount for q in quotations),
                'total_invoiced_amount': sum(i.total_amount for i in invoices),
                'pending_invoices': invoices.filter(status='pending').count(),
                'paid_invoices': invoices.filter(status='paid').count(),
            },
            'recent_interactions': InteractionSerializer(recent_interactions, many=True).data,
            'recent_quotations': QuotationSerializer(quotations.order_by('-created_at')[:3], many=True).data,
            'recent_invoices': InvoiceSerializer(invoices.order_by('-created_at')[:3], many=True).data,
        })

class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated, RoleBasedPermission]
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Bulk delete services"""
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': 'No IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            deleted_count = Service.objects.filter(id__in=ids).count()
            Service.objects.filter(id__in=ids).delete()
            
            # Log bulk deletion activity
            ActivityLog.objects.create(
                user=request.user,
                action='bulk_delete',
                content_type='service',
                object_id=0,
                description=f'Bulk deleted {deleted_count} services'
            )
            
            return Response({'message': f'Successfully deleted {deleted_count} services'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.all()
    serializer_class = QuotationSerializer
    permission_classes = [permissions.IsAuthenticated, RoleBasedPermission]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        self._log_activity('create', serializer.instance)

    def perform_update(self, serializer):
        serializer.save()
        self._log_activity('update', serializer.instance)

    def perform_destroy(self, instance):
        self._log_activity('delete', instance)
        instance.delete()

    @action(detail=True, methods=['get'])
    def generate_pdf(self, request, pk=None):
        quotation = self.get_object()
        
        try:
            pdf_content = generate_pdf('quotation', quotation)
            response = HttpResponse(pdf_content, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="quotation_{quotation.number}.pdf"'
            
            # Log activity
            ActivityLog.objects.create(
                user=request.user,
                action='export',
                content_type='quotation',
                object_id=quotation.id,
                description=f'Generated PDF for quotation {quotation.number}'
            )
            
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def send_email(self, request, pk=None):
        quotation = self.get_object()
        email = request.data.get('email', quotation.client.email)
        message = request.data.get('message', '')
        
        try:
            send_email_with_pdf('quotation', quotation, email, message)
            
            # Log activity
            ActivityLog.objects.create(
                user=request.user,
                action='email',
                content_type='quotation',
                object_id=quotation.id,
                description=f'Sent quotation {quotation.number} via email to {email}'
            )
            
            return Response({'message': 'Email sent successfully'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def convert_to_invoice(self, request, pk=None):
        quotation = self.get_object()
        
        # Check if invoice already exists
        if hasattr(quotation, 'invoice'):
            return Response(
                {'error': 'Invoice already exists for this quotation'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create invoice from quotation
        invoice = Invoice.objects.create(
            quotation=quotation,
            client=quotation.client,
            project=quotation.project,  # Add project if it exists
            date=timezone.now().date(),
            due_date=timezone.now().date() + timedelta(days=30),
            currency=quotation.currency,  # Add the missing currency field
            notes=quotation.notes,
            created_by=request.user
        )
        
        # Copy quotation items to invoice items
        for qitem in quotation.items.all():
            from .models import InvoiceItem
            InvoiceItem.objects.create(
                invoice=invoice,
                service=qitem.service,
                quantity=qitem.quantity,
                price=qitem.price,
                description=qitem.description,
                tax_type=qitem.tax_type  # Copy tax type as well
            )

        # Update quotation status to converted
        quotation.status = 'converted'
        quotation.save()

        # Log activity
        ActivityLog.objects.create(
            user=request.user,
            action='convert',
            content_type='quotation',
            object_id=quotation.id,
            description=f'Converted quotation {quotation.number} to invoice {invoice.number}'
        )
        
        return Response(InvoiceSerializer(invoice).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        quotation = self.get_object()
        
        if quotation.status == 'approved':
            return Response(
                {'error': 'Quotation is already approved'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        quotation.status = 'approved'
        quotation.approved_by = request.user
        quotation.approved_at = timezone.now()
        quotation.save()
        
        # Log activity
        ActivityLog.objects.create(
            user=request.user,
            action='approve',
            content_type='quotation',
            object_id=quotation.id,
            description=f'Approved quotation {quotation.number}'
        )
        
        return Response({'message': 'Quotation approved successfully'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        quotation = self.get_object()
        reason = request.data.get('reason', '')
        
        quotation.status = 'rejected'
        quotation.save()
        
        # Log activity
        ActivityLog.objects.create(
            user=request.user,
            action='reject',
            content_type='quotation',
            object_id=quotation.id,
            description=f'Rejected quotation {quotation.number}. Reason: {reason}'
        )
        
        return Response({'message': 'Quotation rejected'})

    def _log_activity(self, action, instance):
        ActivityLog.objects.create(
            user=self.request.user,
            action=action,
            content_type='quotation',
            object_id=instance.id,
            description=f'{action.capitalize()} quotation {instance.number}'
        )
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Bulk delete quotations"""
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': 'No IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            deleted_count = Quotation.objects.filter(id__in=ids).count()
            Quotation.objects.filter(id__in=ids).delete()
            
            # Log bulk deletion activity
            ActivityLog.objects.create(
                user=request.user,
                action='bulk_delete',
                content_type='quotation',
                object_id=0,
                description=f'Bulk deleted {deleted_count} quotations'
            )
            
            return Response({'message': f'Successfully deleted {deleted_count} quotations'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated, RoleBasedPermission]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        self._log_activity('create', serializer.instance)

    def perform_update(self, serializer):
        serializer.save()
        self._log_activity('update', serializer.instance)

    def perform_destroy(self, instance):
        self._log_activity('delete', instance)
        instance.delete()

    @action(detail=True, methods=['get'])
    def generate_pdf(self, request, pk=None):
        invoice = self.get_object()
        
        try:
            pdf_content = generate_pdf('invoice', invoice)
            response = HttpResponse(pdf_content, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="invoice_{invoice.number}.pdf"'
            
            # Log activity
            ActivityLog.objects.create(
                user=request.user,
                action='export',
                content_type='invoice',
                object_id=invoice.id,
                description=f'Generated PDF for invoice {invoice.number}'
            )
            
            return response
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def send_email(self, request, pk=None):
        invoice = self.get_object()
        email = request.data.get('email', invoice.client.email)
        message = request.data.get('message', '')
        
        try:
            send_email_with_pdf('invoice', invoice, email, message)
            
            # Log activity
            ActivityLog.objects.create(
                user=request.user,
                action='email',
                content_type='invoice',
                object_id=invoice.id,
                description=f'Sent invoice {invoice.number} via email to {email}'
            )
            
            return Response({'message': 'Email sent successfully'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def mark_as_paid(self, request, pk=None):
        invoice = self.get_object()
        invoice.status = 'paid'
        invoice.save()
        self._log_activity('update', invoice)
        return Response({'status': 'marked as paid'})
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        invoice = self.get_object()
        
        if invoice.status == 'approved':
            return Response(
                {'error': 'Invoice is already approved'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        invoice.status = 'approved'
        invoice.approved_by = request.user
        invoice.approved_at = timezone.now()
        invoice.save()
        
        # Log activity
        ActivityLog.objects.create(
            user=request.user,
            action='approve',
            content_type='invoice',
            object_id=invoice.id,
            description=f'Approved invoice {invoice.number}'
        )
        
        return Response({'message': 'Invoice approved successfully'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        invoice = self.get_object()
        reason = request.data.get('reason', '')
        
        invoice.status = 'cancelled'
        invoice.save()
        
        # Log activity
        ActivityLog.objects.create(
            user=request.user,
            action='reject',
            content_type='invoice',
            object_id=invoice.id,
            description=f'Rejected invoice {invoice.number}. Reason: {reason}'
        )
        
        return Response({'message': 'Invoice rejected'})

    def _log_activity(self, action, instance):
        ActivityLog.objects.create(
            user=self.request.user,
            action=action,
            content_type='invoice',
            object_id=instance.id,
            description=f'{action.capitalize()} invoice {instance.number}'
        )
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Bulk delete invoices"""
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': 'No IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            deleted_count = Invoice.objects.filter(id__in=ids).count()
            Invoice.objects.filter(id__in=ids).delete()
            
            # Log bulk deletion activity
            ActivityLog.objects.create(
                user=request.user,
                action='bulk_delete',
                content_type='invoice',
                object_id=0,
                description=f'Bulk deleted {deleted_count} invoices'
            )
            
            return Response({'message': f'Successfully deleted {deleted_count} invoices'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated, RoleBasedPermission]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role != 'admin':
            queryset = queryset.filter(user=self.request.user)
        return queryset.order_by('-created_at')

class NumberSequenceViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing number sequences - admin only
    Allows tracking of document numbering
    """
    queryset = NumberSequence.objects.all().order_by('-year', '-month', 'document_type')
    serializer_class = NumberSequenceSerializer
    permission_classes = [permissions.IsAuthenticated, RoleBasedPermission]

    def get_queryset(self):
        # Only admin users can view number sequences
        if self.request.user.role != 'admin':
            return NumberSequence.objects.none()
        return super().get_queryset()

    @action(detail=False, methods=['get'])
    def current_numbers(self, request):
        """Get current number for each document type this month"""
        current_date = timezone.now().date()
        sequences = {}
        
        for doc_type in ['quotation', 'invoice']:
            try:
                sequence = NumberSequence.objects.get(
                    document_type=doc_type,
                    year=current_date.year,
                    month=current_date.month
                )
                sequences[doc_type] = {
                    'last_number': sequence.last_number,
                    'next_number': sequence.last_number + 1,
                    'year': sequence.year,
                    'month': sequence.month
                }
            except NumberSequence.DoesNotExist:
                sequences[doc_type] = {
                    'last_number': 0,
                    'next_number': 1,
                    'year': current_date.year,
                    'month': current_date.month
                }
        
        return Response(sequences)

class InteractionViewSet(viewsets.ModelViewSet):
    queryset = Interaction.objects.all().select_related('client', 'created_by', 'quotation', 'invoice')
    serializer_class = InteractionSerializer
    permission_classes = [permissions.IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        client_id = self.request.query_params.get('client', None)
        interaction_type = self.request.query_params.get('type', None)
        direction = self.request.query_params.get('direction', None)
        
        if client_id:
            queryset = queryset.filter(client=client_id)
        if interaction_type:
            queryset = queryset.filter(interaction_type=interaction_type)
        if direction:
            queryset = queryset.filter(direction=direction)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        
        # Log activity
        ActivityLog.objects.create(
            user=self.request.user,
            action='create',
            content_type='interaction',
            object_id=serializer.instance.id,
            description=f'Created interaction: {serializer.instance.subject}'
        )

class ClientAttachmentViewSet(viewsets.ModelViewSet):
    queryset = ClientAttachment.objects.all().select_related('client', 'uploaded_by')
    serializer_class = ClientAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        client_id = self.request.query_params.get('client', None)
        
        if client_id:
            queryset = queryset.filter(client=client_id)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
        
        # Log activity
        ActivityLog.objects.create(
            user=self.request.user,
            action='create',
            content_type='attachment',
            object_id=serializer.instance.id,
            description=f'Uploaded attachment: {serializer.instance.name} for {serializer.instance.client.name}'
        )

# Financial Chart APIs
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def financial_charts_data(request):
    """
    Get comprehensive financial chart data for dashboard
    """
    # Date filtering
    date_from = request.GET.get('date_from')
    date_to = request.GET.get('date_to')
    client_filter = request.GET.get('client')
    status_filter = request.GET.get('status')
    
    # Default to last 12 months if no date filter
    if not date_from:
        date_from = timezone.now().date() - timedelta(days=365)
    else:
        date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
    
    if not date_to:
        date_to = timezone.now().date()
    else:
        date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
    
    # Apply filters
    invoice_queryset = Invoice.objects.filter(date__gte=date_from, date__lte=date_to)
    if client_filter:
        invoice_queryset = invoice_queryset.filter(client_id=client_filter)
    if status_filter:
        invoice_queryset = invoice_queryset.filter(status=status_filter)
    
    # 1. Invoice vs Payments Data (Monthly)
    invoice_payment_data = []
    current_date = date_from.replace(day=1)
    
    while current_date <= date_to:
        month_invoices = invoice_queryset.filter(
            date__year=current_date.year,
            date__month=current_date.month
        )
        
        # Calculate total invoice amounts for the month
        total_invoices = sum(invoice.total_amount for invoice in month_invoices)
        
        # Calculate payments received (assuming paid invoices represent payments)
        total_payments = sum(
            invoice.total_amount for invoice in month_invoices.filter(status='paid')
        )
        
        invoice_payment_data.append({
            'month': current_date.strftime('%b %Y'),
            'invoices': float(total_invoices),
            'payments': float(total_payments)
        })
        
        # Move to next month
        if current_date.month == 12:
            current_date = current_date.replace(year=current_date.year + 1, month=1)
        else:
            current_date = current_date.replace(month=current_date.month + 1)
    
    # 2. Outstanding Receivables per Client
    client_receivables = defaultdict(float)
    outstanding_invoices = invoice_queryset.exclude(status='paid')
    
    for invoice in outstanding_invoices:
        client_receivables[invoice.client.name] += float(invoice.total_amount)
    
    client_receivables_data = [
        {'client': client, 'amount': amount}
        for client, amount in client_receivables.items()
    ]
    
    # 3. Invoice Status Overview
    status_counts = invoice_queryset.values('status').annotate(
        count=Count('id')
    )
    
    invoice_status_data = []
    for status_data in status_counts:
        # Calculate total amount for this status
        status_invoices = invoice_queryset.filter(status=status_data['status'])
        total_amount = 0
        for invoice in status_invoices:
            total_amount += invoice.total_amount
            
        invoice_status_data.append({
            'status': status_data['status'].title(),
            'count': status_data['count'],
            'amount': float(total_amount)
        })
    
    # 4. Receivables Aging Report
    today = timezone.now().date()
    aging_data = defaultdict(lambda: {
        'days_0_30': 0,
        'days_31_60': 0,
        'days_61_90': 0,
        'days_90_plus': 0
    })
    
    for invoice in outstanding_invoices:
        days_outstanding = (today - invoice.due_date).days
        client_name = invoice.client.name
        amount = float(invoice.total_amount)
        
        if days_outstanding <= 30:
            aging_data[client_name]['days_0_30'] += amount
        elif days_outstanding <= 60:
            aging_data[client_name]['days_31_60'] += amount
        elif days_outstanding <= 90:
            aging_data[client_name]['days_61_90'] += amount
        else:
            aging_data[client_name]['days_90_plus'] += amount
    
    receivables_aging_data = [
        {
            'client': client,
            **amounts
        }
        for client, amounts in aging_data.items()
    ]
    
    return Response({
        'invoice_payments': invoice_payment_data,
        'client_receivables': client_receivables_data,
        'invoice_status': invoice_status_data,
        'receivables_aging': receivables_aging_data,
        'filters_applied': {
            'date_from': date_from.isoformat(),
            'date_to': date_to.isoformat(),
            'client': client_filter,
            'status': status_filter
        }
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def financial_summary(request):
    """
    Get financial summary metrics for dashboard
    """
    # Calculate key financial metrics using Python properties
    unpaid_invoices = Invoice.objects.exclude(status='paid')
    total_receivables = sum(invoice.total_amount for invoice in unpaid_invoices)
    
    overdue_invoices = Invoice.objects.filter(status='overdue')
    overdue_amount = sum(invoice.total_amount for invoice in overdue_invoices)
    
    paid_this_month = Invoice.objects.filter(
        date__month=timezone.now().month,
        date__year=timezone.now().year,
        status='paid'
    )
    this_month_revenue = sum(invoice.total_amount for invoice in paid_this_month)
    
    return Response({
        'total_receivables': float(total_receivables),
        'overdue_amount': float(overdue_amount),
        'this_month_revenue': float(this_month_revenue),
        'invoice_count': Invoice.objects.count(),
        'paid_invoice_count': Invoice.objects.filter(status='paid').count(),
        'overdue_invoice_count': Invoice.objects.filter(status='overdue').count()
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def approved_quotations_view(request):
    """Get all approved quotations that haven't been converted to invoices yet"""
    try:
        # Get approved quotations that don't have an associated invoice
        approved_quotations = Quotation.objects.filter(
            status='approved'
        ).exclude(
            invoice__isnull=False  # Exclude quotations that already have invoices
        ).select_related('client', 'approved_by')
        
        serializer = QuotationSerializer(approved_quotations, many=True)
        return Response({
            'results': serializer.data,
            'count': approved_quotations.count()
        })
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
