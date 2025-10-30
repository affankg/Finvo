from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.db import transaction
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('sales', 'Sales'),
        ('accountant', 'Accountant'),
        ('viewer', 'Viewer'),
    )
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='viewer',
        db_index=True  # Add index for better query performance
    )

    def save(self, *args, **kwargs):
        """Override save to ensure role persists correctly"""
        # Store the intended role before saving
        intended_role = self.role
        
        with transaction.atomic():
            # Use select_for_update if updating existing user
            if self.pk:
                try:
                    User.objects.select_for_update().get(pk=self.pk)
                except User.DoesNotExist:
                    pass
            
            super().save(*args, **kwargs)
            
            # Verify the role was saved correctly
            if self.pk:
                fresh_instance = User.objects.get(pk=self.pk)
                if fresh_instance.role != intended_role:
                    logger.error(f"Role mismatch after save for user {self.username}: Expected {intended_role}, got {fresh_instance.role}")
                    # Force the role update with raw SQL
                    from django.db import connection
                    with connection.cursor() as cursor:
                        cursor.execute(
                            "UPDATE api_user SET role = %s WHERE id = %s",
                            [intended_role, self.pk]
                        )
                    logger.info(f"Forced role update for user {self.username} to {intended_role}")

class NumberSequence(models.Model):
    """Track number sequences for different document types"""
    DOCUMENT_TYPES = (
        ('quotation', 'Quotation'),
        ('invoice', 'Invoice'),
    )
    
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    year = models.IntegerField()
    month = models.IntegerField()
    last_number = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['document_type', 'year', 'month']
    
    @classmethod
    def get_next_number(cls, document_type, date=None):
        """Get next sequential number for a document type"""
        if date is None:
            date = timezone.now().date()
        
        with transaction.atomic():
            sequence, created = cls.objects.select_for_update().get_or_create(
                document_type=document_type,
                year=date.year,
                month=date.month,
                defaults={'last_number': 0}
            )
            sequence.last_number += 1
            sequence.save()
            
            # Generate formatted number based on document type
            if document_type == 'quotation':
                prefix = 'QTN'
            elif document_type == 'invoice':
                prefix = 'INV'
            else:
                prefix = 'DOC'
            
            number = f'{prefix}-{date.strftime("%Y%m")}-{str(sequence.last_number).zfill(4)}'
            return number

class Client(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('prospect', 'Prospect'),
        ('lead', 'Lead'),
    )
    
    name = models.CharField(max_length=200)
    company = models.CharField(max_length=200, blank=True)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='prospect')
    tags = models.CharField(max_length=500, blank=True, help_text="Comma-separated tags")
    notes = models.TextField(blank=True)
    website = models.URLField(blank=True)
    industry = models.CharField(max_length=100, blank=True)
    source = models.CharField(max_length=100, blank=True, help_text="How did you find this client?")
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_clients')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.name} ({self.company})" if self.company else self.name
    
    @property
    def total_quotations(self):
        return self.quotation_set.count()
    
    @property
    def total_invoices(self):
        return self.invoice_set.count()
    
    @property
    def total_amount_quoted(self):
        return sum(q.total_amount for q in self.quotation_set.all())
    
    @property
    def total_amount_invoiced(self):
        return sum(i.total_amount for i in self.invoice_set.all())
    
    @property
    def last_interaction_date(self):
        interactions = self.interactions.all().order_by('-created_at')
        return interactions.first().created_at if interactions.exists() else None

class Service(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Interaction(models.Model):
    INTERACTION_TYPES = (
        ('quotation', 'Quotation'),
        ('invoice', 'Invoice'),
        ('call', 'Phone Call'),
        ('meeting', 'Meeting'),
        ('email', 'Email'),
        ('note', 'Note'),
        ('follow_up', 'Follow Up'),
        ('proposal', 'Proposal'),
        ('contract', 'Contract'),
        ('support', 'Support'),
    )
    
    DIRECTION_CHOICES = (
        ('inbound', 'Inbound'),
        ('outbound', 'Outbound'),
    )
    
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='interactions')
    interaction_type = models.CharField(max_length=20, choices=INTERACTION_TYPES)
    direction = models.CharField(max_length=10, choices=DIRECTION_CHOICES, default='outbound')
    subject = models.CharField(max_length=200)
    description = models.TextField()
    reference_number = models.CharField(max_length=50, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(
        max_length=10,
        choices=[(code, code) for code, name, symbol in getattr(settings, 'CURRENCY_CHOICES', [('PKR', 'Pakistani Rupee', 'Rs')])],
        default=getattr(settings, 'DEFAULT_CURRENCY', 'PKR')
    )
    status = models.CharField(max_length=50, blank=True)
    scheduled_date = models.DateTimeField(null=True, blank=True)
    completed_date = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Related objects (optional links)
    quotation = models.ForeignKey('Quotation', on_delete=models.SET_NULL, null=True, blank=True)
    invoice = models.ForeignKey('Invoice', on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def currency_symbol(self):
        """Get currency symbol"""
        currency_choices = getattr(settings, 'CURRENCY_CHOICES', [('PKR', 'Pakistani Rupee', 'Rs')])
        for code, name, symbol in currency_choices:
            if code == self.currency:
                return symbol
        return self.currency
    
    @property
    def formatted_amount(self):
        """Get formatted amount with currency symbol"""
        if self.amount:
            return f"{self.currency_symbol()} {self.amount:,.2f}"
        return None
    
    def __str__(self):
        return f"{self.get_interaction_type_display()} - {self.client.name} ({self.created_at.strftime('%Y-%m-%d')})"

class ClientAttachment(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='attachments')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    file = models.FileField(upload_to='client_attachments/%Y/%m/')
    file_type = models.CharField(max_length=50, blank=True)
    file_size = models.IntegerField(null=True, blank=True)  # in bytes
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - {self.client.name}"
    
    def save(self, *args, **kwargs):
        if self.file:
            self.file_size = self.file.size
            # Extract file type from file name
            import os
            self.file_type = os.path.splitext(self.file.name)[1].lower()
        super().save(*args, **kwargs)

class Quotation(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('converted', 'Converted to Invoice'),
        ('expired', 'Expired'),
    )
    
    number = models.CharField(max_length=20, unique=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    project = models.ForeignKey('Project', on_delete=models.SET_NULL, null=True, blank=True, related_name='quotations')
    date = models.DateField()
    validity = models.IntegerField(default=30)  # days
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    description = models.TextField(blank=True, help_text="Detailed description of the quotation scope")
    currency = models.CharField(
        max_length=3,
        choices=[(code, code) for code, name, symbol in getattr(settings, 'CURRENCY_CHOICES', [('PKR', 'Pakistani Rupee', 'Rs')])],
        default=getattr(settings, 'DEFAULT_CURRENCY', 'PKR')
    )
    purchase_requisition = models.CharField(max_length=50, blank=True, null=True, help_text="Purchase Requisition Number")
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_quotations')
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.number:
            # Generate unique quotation number using NumberSequence
            max_attempts = 10
            for attempt in range(max_attempts):
                try:
                    self.number = NumberSequence.get_next_number('quotation', self.date)
                    # Double-check uniqueness (shouldn't be needed with proper sequence, but safety first)
                    if not Quotation.objects.filter(number=self.number).exists():
                        break
                except Exception as e:
                    if attempt == max_attempts - 1:
                        # Fallback to timestamp-based number if all else fails
                        import time
                        timestamp = str(int(time.time() * 1000))[-6:]
                        self.number = f'QTN-{self.date.strftime("%Y%m")}-{timestamp}'
                        break
        
        super().save(*args, **kwargs)
    
    @property
    def total_amount(self):
        """Calculate total amount from all items"""
        return sum(item.total for item in self.items.all())

    @property
    def subtotal_amount(self):
        """Calculate subtotal before tax from all items"""
        return sum(item.subtotal if hasattr(item, 'subtotal') else (item.quantity * item.price) for item in self.items.all())
    
    @property
    def total_tax_amount(self):
        """Calculate total tax amount from all items"""
        return sum(item.tax_amount if hasattr(item, 'tax_amount') else 0 for item in self.items.all())

    @property
    def currency_symbol(self):
        """Get currency symbol"""
        currency_choices = getattr(settings, 'CURRENCY_CHOICES', [('PKR', 'Pakistani Rupee', 'Rs')])
        for code, name, symbol in currency_choices:
            if code == self.currency:
                return symbol
        return self.currency
    
    @property
    def formatted_total(self):
        """Get formatted total with currency symbol"""
        return f"{self.currency_symbol} {self.total_amount:,.2f}"
    
    def __str__(self):
        return f'{self.number} - {self.client.name}'

class QuotationItem(models.Model):
    TAX_CHOICES = (
        ('none', 'No Tax'),
        ('gst_18', 'GST 18%'),
        ('gst_17', 'GST 17%'),
        ('srb_15', 'SRB 15%'),
    )
    
    quotation = models.ForeignKey(Quotation, related_name='items', on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    tax_type = models.CharField(max_length=20, choices=TAX_CHOICES, default='none')

    @property
    def subtotal(self):
        """Subtotal before tax"""
        return self.quantity * self.price
    
    @property
    def tax_rate(self):
        """Get tax rate as decimal"""
        from decimal import Decimal
        tax_rates = {
            'none': Decimal('0'),
            'gst_18': Decimal('0.18'),
            'gst_17': Decimal('0.17'),
            'srb_15': Decimal('0.15'),
        }
        return tax_rates.get(self.tax_type, Decimal('0'))
    
    @property
    def tax_amount(self):
        """Calculate tax amount"""
        return self.subtotal * self.tax_rate
    
    @property
    def total(self):
        """Total including tax"""
        return self.subtotal + self.tax_amount

class Invoice(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('approved', 'Approved'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    )
    
    number = models.CharField(max_length=20, unique=True)
    po_number = models.CharField(max_length=50, blank=True, null=True, help_text="Purchase Order Number")
    quotation = models.OneToOneField(Quotation, on_delete=models.CASCADE, null=True, blank=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    project = models.ForeignKey('Project', on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    currency = models.CharField(
        max_length=3,
        choices=[(code, code) for code, name, symbol in getattr(settings, 'CURRENCY_CHOICES', [('PKR', 'Pakistani Rupee', 'Rs')])],
        default=getattr(settings, 'DEFAULT_CURRENCY', 'PKR')
    )
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_invoices')
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.number:
            # Generate unique invoice number using NumberSequence
            max_attempts = 10
            for attempt in range(max_attempts):
                try:
                    self.number = NumberSequence.get_next_number('invoice', self.date)
                    # Double-check uniqueness (shouldn't be needed with proper sequence, but safety first)
                    if not Invoice.objects.filter(number=self.number).exists():
                        break
                except Exception as e:
                    if attempt == max_attempts - 1:
                        # Fallback to timestamp-based number if all else fails
                        import time
                        timestamp = str(int(time.time() * 1000))[-6:]
                        self.number = f'INV-{self.date.strftime("%Y%m")}-{timestamp}'
                        break
        
        super().save(*args, **kwargs)
    
    @property
    def total_amount(self):
        """Calculate total amount from all items"""
        return sum(item.total for item in self.items.all())

    @property
    def subtotal_amount(self):
        """Calculate subtotal before tax from all items"""
        return sum(item.subtotal if hasattr(item, 'subtotal') else (item.quantity * item.price) for item in self.items.all())
    
    @property
    def total_tax_amount(self):
        """Calculate total tax amount from all items"""
        return sum(item.tax_amount if hasattr(item, 'tax_amount') else 0 for item in self.items.all())

    @property
    def currency_symbol(self):
        """Get currency symbol"""
        currency_choices = getattr(settings, 'CURRENCY_CHOICES', [('PKR', 'Pakistani Rupee', 'Rs')])
        for code, name, symbol in currency_choices:
            if code == self.currency:
                return symbol
        return self.currency
    
    @property
    def formatted_total(self):
        """Get formatted total with currency symbol"""
        return f"{self.currency_symbol} {self.total_amount:,.2f}"
    
    def __str__(self):
        return f'{self.number} - {self.client.name}'

class InvoiceItem(models.Model):
    TAX_CHOICES = (
        ('none', 'No Tax'),
        ('gst_18', 'GST 18%'),
        ('gst_17', 'GST 17%'),
        ('srb_15', 'SRB 15%'),
    )
    
    invoice = models.ForeignKey(Invoice, related_name='items', on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    tax_type = models.CharField(max_length=20, choices=TAX_CHOICES, default='none')

    @property
    def subtotal(self):
        """Subtotal before tax"""
        return self.quantity * self.price
    
    @property
    def tax_rate(self):
        """Get tax rate as decimal"""
        from decimal import Decimal
        tax_rates = {
            'none': Decimal('0'),
            'gst_18': Decimal('0.18'),
            'gst_17': Decimal('0.17'),
            'srb_15': Decimal('0.15'),
        }
        return tax_rates.get(self.tax_type, Decimal('0'))
    
    @property
    def tax_amount(self):
        """Calculate tax amount"""
        return self.subtotal * self.tax_rate
    
    @property
    def total(self):
        """Total including tax"""
        return self.subtotal + self.tax_amount

class ActivityLog(models.Model):
    ACTION_CHOICES = (
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    content_type = models.CharField(max_length=50)  # e.g., 'quotation', 'invoice', etc.
    object_id = models.IntegerField()
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


# Import financial models
from .financial_models import (
    FinancialAccount,
    FinancialActivity,
    FinancialAttachment,
    JournalEntry,
    JournalEntryLine,
    FinancialReport,
    FinancialAuditLog,
)

# Import project models
from .project_models import (
    Project,
    ProjectAssignment,
    ProjectAttachment,
    ProjectMilestone,
    ProjectNote,
)
