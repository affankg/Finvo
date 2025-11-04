"""
Document Number Settings Models for Django
Provides custom document numbering for Invoices, Quotations, and Projects
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.utils import timezone


class DocumentNumberSettings(models.Model):
    """Configuration for document numbering"""
    
    TYPE_CHOICES = [
        ('invoice', 'Invoice'),
        ('quotation', 'Quotation'),
        ('project', 'Project'),
    ]
    
    RESET_CHOICES = [
        ('never', 'Never'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]
    
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, unique=True)
    prefix = models.CharField(
        max_length=50,
        blank=True,
        default='',
        validators=[
            RegexValidator(
                regex=r'^[A-Z0-9-]*$',
                message='Prefix can only contain letters, numbers, and hyphens',
                flags=0
            )
        ]
    )
    current_number = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    padding_length = models.IntegerField(
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(8)]
    )
    include_year = models.BooleanField(default=False)
    include_month = models.BooleanField(default=False)
    reset_rule = models.CharField(max_length=10, choices=RESET_CHOICES, default='never')
    last_reset_date = models.DateField(null=True, blank=True)
    enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'document_number_settings'
        verbose_name = 'Document Number Setting'
        verbose_name_plural = 'Document Number Settings'
    
    def __str__(self):
        return f"{self.get_type_display()} - {self.prefix or 'No Prefix'}"


class DocumentNumberHistory(models.Model):
    """Audit trail for document number assignments"""
    
    TYPE_CHOICES = DocumentNumberSettings.TYPE_CHOICES
    
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    document_id = models.IntegerField()
    generated_number = models.CharField(max_length=100, unique=True, db_index=True)
    sequence_number = models.IntegerField()
    date_token = models.CharField(max_length=20, blank=True, null=True)
    assigned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'document_number_history'
        verbose_name = 'Document Number History'
        verbose_name_plural = 'Document Number History'
        indexes = [
            models.Index(fields=['type', 'document_id']),
            models.Index(fields=['generated_number']),
        ]
        ordering = ['-assigned_at']
    
    def __str__(self):
        return f"{self.get_type_display()} - {self.generated_number}"
