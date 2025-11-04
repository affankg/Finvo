"""
Document Number Settings Views for Django REST Framework
Handles all document numbering configuration and assignment operations
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db.models import Q

from .document_number_models import DocumentNumberSettings, DocumentNumberHistory
from .document_number_serializers import (
    DocumentNumberSettingsSerializer,
    DocumentNumberHistorySerializer,
    DocumentNumberPreviewSerializer,
    DocumentNumberAssignSerializer,
    DocumentNumberAssignResponseSerializer
)
from .document_number_utils import (
    preview_next_number,
    assign_document_number,
    validate_settings
)


class DocumentNumberSettingsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Document Number Settings
    Admin-only access to configure document numbering
    """
    queryset = DocumentNumberSettings.objects.all()
    serializer_class = DocumentNumberSettingsSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        """Optionally filter by type"""
        queryset = DocumentNumberSettings.objects.all()
        doc_type = self.request.query_params.get('type', None)
        if doc_type:
            queryset = queryset.filter(type=doc_type)
        return queryset.order_by('type')
    
    def list(self, request):
        """Get all settings with recent numbers"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        # Add recent numbers for each type
        data_with_recent = []
        for setting_data in serializer.data:
            doc_type = setting_data['type']
            recent = DocumentNumberHistory.objects.filter(type=doc_type).order_by('-assigned_at')[:3]
            recent_serializer = DocumentNumberHistorySerializer(recent, many=True)
            setting_data['recent_numbers'] = recent_serializer.data
            data_with_recent.append(setting_data)
        
        return Response({
            'success': True,
            'data': data_with_recent
        })
    
    def retrieve(self, request, pk=None):
        """Get settings for specific type"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        # Add recent numbers
        recent = DocumentNumberHistory.objects.filter(
            type=instance.type
        ).order_by('-assigned_at')[:5]
        recent_serializer = DocumentNumberHistorySerializer(recent, many=True)
        
        data = serializer.data
        data['recent_numbers'] = recent_serializer.data
        
        return Response({
            'success': True,
            'data': data
        })
    
    def create(self, request):
        """Create or update settings"""
        doc_type = request.data.get('type')
        
        # Validate settings
        validation = validate_settings(request.data)
        if not validation['valid']:
            return Response({
                'success': False,
                'message': 'Validation failed',
                'errors': validation['errors']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get or create
        instance, created = DocumentNumberSettings.objects.get_or_create(
            type=doc_type,
            defaults=request.data
        )
        
        if not created:
            serializer = self.get_serializer(instance, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
        else:
            serializer = self.get_serializer(instance)
        
        # Generate preview
        preview = preview_next_number(doc_type)
        
        return Response({
            'success': True,
            'message': 'Settings saved successfully',
            'data': serializer.data,
            'preview': preview.get('preview') if preview.get('success') else None
        })
    
    def update(self, request, pk=None):
        """Update existing settings"""
        instance = self.get_object()
        
        # Validate
        validation = validate_settings(request.data)
        if not validation['valid']:
            return Response({
                'success': False,
                'message': 'Validation failed',
                'errors': validation['errors']
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Generate preview
        preview = preview_next_number(instance.type)
        
        return Response({
            'success': True,
            'message': 'Settings updated successfully',
            'data': serializer.data,
            'preview': preview.get('preview') if preview.get('success') else None
        })
    
    @action(detail=True, methods=['get'])
    def preview_next(self, request, pk=None):
        """Preview next document number without incrementing"""
        instance = self.get_object()
        preview = preview_next_number(instance.type)
        
        if not preview.get('success'):
            return Response(preview, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'success': True,
            'data': preview
        })
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """Assign document number (ATOMIC)"""
        instance = self.get_object()
        
        # Validate request
        assign_serializer = DocumentNumberAssignSerializer(data=request.data)
        if not assign_serializer.is_valid():
            return Response({
                'success': False,
                'errors': assign_serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        document_id = assign_serializer.validated_data['document_id']
        
        # Assign number
        result = assign_document_number(instance.type, document_id)
        
        if not result.get('success'):
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        
        message = 'Number already assigned' if result.get('already_assigned') else 'Number assigned successfully'
        
        return Response({
            'success': True,
            'message': message,
            'data': result
        })
    
    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get document number history"""
        instance = self.get_object()
        
        limit = int(request.query_params.get('limit', 20))
        offset = int(request.query_params.get('offset', 0))
        
        history_qs = DocumentNumberHistory.objects.filter(
            type=instance.type
        ).order_by('-assigned_at')
        
        total = history_qs.count()
        history = history_qs[offset:offset+limit]
        
        serializer = DocumentNumberHistorySerializer(history, many=True)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'total': total,
            'limit': limit,
            'offset': offset
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminUser])
def preview_next_by_type(request, doc_type):
    """Preview next number for specific type"""
    if doc_type not in ['invoice', 'quotation', 'project']:
        return Response({
            'success': False,
            'message': 'Invalid document type'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    preview = preview_next_number(doc_type)
    
    if not preview.get('success'):
        return Response(preview, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({
        'success': True,
        'data': preview
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def test_format(request):
    """Test number format without saving"""
    prefix = request.data.get('prefix', '')
    padding_length = int(request.data.get('padding_length', 3))
    include_year = request.data.get('include_year', False)
    include_month = request.data.get('include_month', False)
    test_number = int(request.data.get('test_number', 1))
    
    # Create temporary settings object
    from datetime import datetime
    now = datetime.now()
    year = str(now.year)[-2:]
    month = str(now.month).zfill(2)
    
    parts = []
    if prefix:
        parts.append(prefix)
    
    if include_year and include_month:
        parts.append(f"{month}{year}")
    elif include_year:
        parts.append(year)
    elif include_month:
        parts.append(month)
    
    parts.append(str(test_number).zfill(padding_length))
    
    formatted = '-'.join(parts)
    
    return Response({
        'success': True,
        'formatted': formatted,
        'parts': {
            'prefix': prefix if prefix else 'none',
            'date_token': 'current date' if (include_year or include_month) else 'none',
            'sequence_number': str(test_number).zfill(padding_length)
        }
    })
