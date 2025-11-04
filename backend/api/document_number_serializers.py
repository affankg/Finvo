"""
Document Number Settings Serializers for Django REST Framework
"""
from rest_framework import serializers
from .document_number_models import DocumentNumberSettings, DocumentNumberHistory


class DocumentNumberSettingsSerializer(serializers.ModelSerializer):
    """Serializer for Document Number Settings"""
    
    class Meta:
        model = DocumentNumberSettings
        fields = [
            'id', 'type', 'prefix', 'current_number', 'padding_length',
            'include_year', 'include_month', 'reset_rule', 'last_reset_date',
            'enabled', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_prefix(self, value):
        """Validate prefix format"""
        if value and not value.replace('-', '').isalnum():
            raise serializers.ValidationError(
                "Prefix can only contain letters, numbers, and hyphens"
            )
        if len(value) > 50:
            raise serializers.ValidationError("Prefix must be 50 characters or less")
        return value.upper()
    
    def validate_padding_length(self, value):
        """Validate padding length"""
        if not 1 <= value <= 8:
            raise serializers.ValidationError("Padding length must be between 1 and 8")
        return value
    
    def validate_current_number(self, value):
        """Validate current number"""
        if value < 0:
            raise serializers.ValidationError("Current number cannot be negative")
        return value


class DocumentNumberHistorySerializer(serializers.ModelSerializer):
    """Serializer for Document Number History"""
    
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = DocumentNumberHistory
        fields = [
            'id', 'type', 'type_display', 'document_id', 'generated_number',
            'sequence_number', 'date_token', 'assigned_at'
        ]
        read_only_fields = fields


class DocumentNumberPreviewSerializer(serializers.Serializer):
    """Serializer for number preview response"""
    
    preview = serializers.CharField()
    next_sequence = serializers.IntegerField()
    will_reset = serializers.BooleanField()
    date_token = serializers.CharField(allow_null=True)


class DocumentNumberAssignSerializer(serializers.Serializer):
    """Serializer for number assignment request"""
    
    document_id = serializers.IntegerField(required=True, min_value=1)


class DocumentNumberAssignResponseSerializer(serializers.Serializer):
    """Serializer for number assignment response"""
    
    number = serializers.CharField()
    sequence_number = serializers.IntegerField()
    was_reset = serializers.BooleanField()
    already_assigned = serializers.BooleanField(default=False)
