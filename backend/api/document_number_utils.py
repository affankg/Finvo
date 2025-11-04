"""
Document Number Generator Utility for Django
Provides thread-safe document number generation and assignment
"""
from datetime import datetime, date
from django.db import transaction
from django.db.models import F
from .document_number_models import DocumentNumberSettings, DocumentNumberHistory


def should_reset(settings):
    """Check if reset is needed based on reset rule"""
    if settings.reset_rule == 'never':
        return False
    if not settings.last_reset_date:
        return False
    
    now = date.today()
    last_reset = settings.last_reset_date
    
    if settings.reset_rule == 'monthly':
        return now.month != last_reset.month or now.year != last_reset.year
    
    if settings.reset_rule == 'yearly':
        return now.year != last_reset.year
    
    return False


def generate_date_token(settings):
    """Generate date token based on settings"""
    if not settings.include_year and not settings.include_month:
        return ''
    
    now = datetime.now()
    year = str(now.year)[-2:]  # Last 2 digits
    month = str(now.month).zfill(2)
    
    if settings.include_year and settings.include_month:
        return f"{month}{year}"
    
    if settings.include_year:
        return year
    
    if settings.include_month:
        return month
    
    return ''


def format_document_number(settings, sequence_number):
    """Format the document number according to settings"""
    parts = []
    
    # Add prefix
    if settings.prefix:
        parts.append(settings.prefix)
    
    # Add date token
    date_token = generate_date_token(settings)
    if date_token:
        parts.append(date_token)
    
    # Add padded sequence number
    padded_number = str(sequence_number).zfill(settings.padding_length)
    parts.append(padded_number)
    
    return '-'.join(parts)


def preview_next_number(doc_type):
    """
    Preview the next document number without incrementing
    
    Args:
        doc_type: 'invoice', 'quotation', or 'project'
    
    Returns:
        dict with preview information or None if not enabled
    """
    try:
        settings = DocumentNumberSettings.objects.get(type=doc_type, enabled=True)
    except DocumentNumberSettings.DoesNotExist:
        return {
            'success': False,
            'message': f'Document numbering not enabled for {doc_type}',
            'use_existing': True
        }
    
    # Calculate what the next number would be
    next_number = settings.current_number + 1
    
    # Check if reset is needed
    if should_reset(settings):
        next_number = 1
    
    formatted_number = format_document_number(settings, next_number)
    date_token = generate_date_token(settings)
    
    return {
        'success': True,
        'preview': formatted_number,
        'next_sequence': next_number,
        'will_reset': should_reset(settings),
        'date_token': date_token if date_token else None
    }


@transaction.atomic
def assign_document_number(doc_type, document_id):
    """
    Assign and generate next document number (ATOMIC OPERATION)
    
    Args:
        doc_type: 'invoice', 'quotation', or 'project'
        document_id: The ID of the document being numbered
    
    Returns:
        dict with assignment result
    """
    try:
        # Lock the settings row for update
        settings = DocumentNumberSettings.objects.select_for_update().get(
            type=doc_type, 
            enabled=True
        )
    except DocumentNumberSettings.DoesNotExist:
        return {
            'success': False,
            'message': f'Document numbering not enabled for {doc_type}',
            'use_existing': True
        }
    
    # Check if document already has a number
    existing = DocumentNumberHistory.objects.filter(
        type=doc_type, 
        document_id=document_id
    ).first()
    
    if existing:
        return {
            'success': True,
            'number': existing.generated_number,
            'already_assigned': True
        }
    
    # Determine if reset is needed
    needs_reset = should_reset(settings)
    next_number = 1 if needs_reset else settings.current_number + 1
    
    # Generate formatted number
    formatted_number = format_document_number(settings, next_number)
    date_token = generate_date_token(settings)
    
    # Check for duplicate (extra safety)
    duplicate = DocumentNumberHistory.objects.filter(
        generated_number=formatted_number
    ).exists()
    
    if duplicate:
        # In rare case of duplicate, increment and retry once
        next_number += 1
        formatted_number = format_document_number(settings, next_number)
    
    # Update settings with new current number
    settings.current_number = next_number
    if needs_reset:
        settings.last_reset_date = date.today()
    settings.save()
    
    # Record in history
    DocumentNumberHistory.objects.create(
        type=doc_type,
        document_id=document_id,
        generated_number=formatted_number,
        sequence_number=next_number,
        date_token=date_token if date_token else None
    )
    
    return {
        'success': True,
        'number': formatted_number,
        'sequence_number': next_number,
        'was_reset': needs_reset
    }


def get_assigned_number(doc_type, document_id):
    """
    Get the assigned document number (if exists)
    
    Args:
        doc_type: Document type
        document_id: Document ID
    
    Returns:
        str: Assigned number or None
    """
    history = DocumentNumberHistory.objects.filter(
        type=doc_type,
        document_id=document_id
    ).first()
    
    return history.generated_number if history else None


def validate_settings(settings_data):
    """
    Validate document number settings
    
    Args:
        settings_data: dict with settings fields
    
    Returns:
        dict with validation result
    """
    errors = []
    
    # Validate prefix
    prefix = settings_data.get('prefix', '')
    if prefix and not prefix.replace('-', '').replace('_', '').isalnum():
        errors.append('Prefix can only contain letters, numbers, and hyphens')
    
    if len(prefix) > 50:
        errors.append('Prefix must be 50 characters or less')
    
    # Validate padding length
    padding = settings_data.get('padding_length', 3)
    if not 1 <= padding <= 8:
        errors.append('Padding length must be between 1 and 8')
    
    # Validate current number
    current_num = settings_data.get('current_number', 0)
    if current_num < 0:
        errors.append('Current number cannot be negative')
    
    # Validate reset rule
    reset_rule = settings_data.get('reset_rule', 'never')
    if reset_rule not in ['never', 'monthly', 'yearly']:
        errors.append('Reset rule must be one of: never, monthly, yearly')
    
    # Validate type
    doc_type = settings_data.get('type', '')
    if doc_type not in ['invoice', 'quotation', 'project']:
        errors.append('Type must be one of: invoice, quotation, project')
    
    return {
        'valid': len(errors) == 0,
        'errors': errors
    }
