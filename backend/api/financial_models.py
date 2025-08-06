"""
Financial Models for BS Engineering System
Advanced Project Expense and Financial Flow Tracking
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
import os

User = get_user_model()


class FinancialAccount(models.Model):
    """Chart of Accounts for double-entry bookkeeping"""
    ACCOUNT_TYPES = (
        ('asset', 'Asset'),
        ('liability', 'Liability'),
        ('equity', 'Equity'),
        ('revenue', 'Revenue'),
        ('expense', 'Expense'),
    )
    
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    account_type = models.CharField(max_length=20, choices=ACCOUNT_TYPES)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class FinancialActivity(models.Model):
    """Base model for all financial activities"""
    ACTIVITY_TYPES = (
        ('receivable', 'Receivable'),
        ('payable', 'Payable'),
        ('expense', 'Expense'),
        ('income', 'Income'),
    )
    
    PAYMENT_METHODS = (
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('check', 'Check'),
        ('credit_card', 'Credit Card'),
        ('digital_wallet', 'Digital Wallet'),
        ('crypto', 'Cryptocurrency'),
        ('other', 'Other'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    )
    
    # Core fields
    reference_number = models.CharField(max_length=50, unique=True)
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(
        max_length=10,
        choices=[(code, code) for code, name, symbol in getattr(settings, 'CURRENCY_CHOICES', [('PKR', 'Pakistani Rupee', 'Rs')])],
        default=getattr(settings, 'DEFAULT_CURRENCY', 'PKR')
    )
    
    # Relationships
    client = models.ForeignKey('Client', on_delete=models.CASCADE, related_name='financial_activities')
    project = models.ForeignKey('Project', on_delete=models.SET_NULL, null=True, blank=True, related_name='financial_activities')
    project_quotation = models.ForeignKey('Quotation', on_delete=models.SET_NULL, null=True, blank=True, related_name='financial_activities')
    project_invoice = models.ForeignKey('Invoice', on_delete=models.SET_NULL, null=True, blank=True, related_name='financial_activities')
    account = models.ForeignKey(FinancialAccount, on_delete=models.CASCADE, related_name='activities')
    
    # Enhanced project tracking for expenses
    project_number = models.CharField(max_length=100, blank=True, null=True, help_text="Project reference number for expense tracking")
    invoice_number = models.CharField(max_length=100, blank=True, null=True, help_text="Invoice reference for expense tracking")
    expense_category = models.CharField(max_length=100, blank=True, null=True, help_text="Specific expense category for detailed tracking")
    cost_center = models.CharField(max_length=100, blank=True, null=True, help_text="Cost center or department for expense allocation")
    
    # Details
    description = models.TextField()
    bill_to = models.CharField(max_length=200, blank=True, help_text="Vendor/Supplier name")
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='bank_transfer')
    
    # Status and dates
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    transaction_date = models.DateField()
    due_date = models.DateField(null=True, blank=True)
    paid_date = models.DateField(null=True, blank=True)
    
    # Approval workflow
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_activities')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Metadata
    notes = models.TextField(blank=True)
    tags = models.CharField(max_length=500, blank=True, help_text="Comma-separated tags")
    is_recurring = models.BooleanField(default=False)
    recurring_frequency = models.CharField(max_length=20, blank=True, choices=[
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('annually', 'Annually'),
    ])
    
    # Audit fields
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_activities')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-transaction_date', '-created_at']
        verbose_name_plural = 'Financial Activities'
    
    def save(self, *args, **kwargs):
        if not self.reference_number:
            # Generate reference number with microseconds for uniqueness
            from datetime import datetime
            import uuid
            prefix = self.activity_type.upper()[:3]
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            unique_suffix = str(uuid.uuid4()).split('-')[0][:4].upper()
            self.reference_number = f"{prefix}-{timestamp}-{unique_suffix}"
        super().save(*args, **kwargs)
    
    @property
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
        return f"{self.currency_symbol} {self.amount:,.2f}"
    
    @property
    def is_overdue(self):
        """Check if activity is overdue"""
        if self.due_date and self.status in ['pending', 'approved']:
            return timezone.now().date() > self.due_date
        return False
    
    def __str__(self):
        return f"{self.reference_number} - {self.activity_type.title()} - {self.formatted_amount}"


class FinancialAttachment(models.Model):
    """File attachments for financial activities"""
    FILE_TYPES = (
        ('receipt', 'Receipt'),
        ('invoice', 'Invoice/Bill'),
        ('contract', 'Contract'),
        ('proof_of_payment', 'Proof of Payment'),
        ('bank_statement', 'Bank Statement'),
        ('tax_document', 'Tax Document'),
        ('other', 'Other'),
    )
    
    activity = models.ForeignKey(FinancialActivity, on_delete=models.CASCADE, related_name='attachments')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    file_type = models.CharField(max_length=20, choices=FILE_TYPES, default='receipt')
    file = models.FileField(upload_to='financial_attachments/%Y/%m/')
    file_size = models.IntegerField(null=True, blank=True)  # in bytes
    mime_type = models.CharField(max_length=100, blank=True)
    
    # Cloud storage support (Cloudinary ready)
    cloud_url = models.URLField(blank=True, help_text="Cloud storage URL if using external storage")
    
    # Metadata
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if self.file:
            self.file_size = self.file.size
            # Extract MIME type
            import mimetypes
            self.mime_type, _ = mimetypes.guess_type(self.file.name)
            if not self.mime_type:
                self.mime_type = 'application/octet-stream'
        super().save(*args, **kwargs)
    
    @property
    def file_extension(self):
        """Get file extension"""
        if self.file:
            return os.path.splitext(self.file.name)[1].lower()
        return ''
    
    @property
    def is_image(self):
        """Check if file is an image"""
        return self.mime_type.startswith('image/') if self.mime_type else False
    
    @property
    def formatted_size(self):
        """Get human-readable file size"""
        if not self.file_size:
            return 'Unknown'
        
        for unit in ['B', 'KB', 'MB', 'GB']:
            if self.file_size < 1024.0:
                return f"{self.file_size:.1f} {unit}"
            self.file_size /= 1024.0
        return f"{self.file_size:.1f} TB"
    
    def __str__(self):
        return f"{self.name} - {self.activity.reference_number}"


class JournalEntry(models.Model):
    """Double-entry journal entries for accounting compliance"""
    reference_number = models.CharField(max_length=50, unique=True)
    description = models.TextField()
    transaction_date = models.DateField()
    
    # Relationships
    financial_activity = models.ForeignKey(FinancialActivity, on_delete=models.CASCADE, related_name='journal_entries')
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-transaction_date', '-created_at']
        verbose_name_plural = 'Journal Entries'
    
    def save(self, *args, **kwargs):
        if not self.reference_number:
            # Generate journal entry reference
            from datetime import datetime
            import uuid
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            unique_suffix = str(uuid.uuid4()).split('-')[0][:4].upper()
            self.reference_number = f"JE-{timestamp}-{unique_suffix}"
        super().save(*args, **kwargs)
    
    @property
    def total_debits(self):
        """Calculate total debits"""
        return sum(line.debit_amount for line in self.lines.all())
    
    @property
    def total_credits(self):
        """Calculate total credits"""
        return sum(line.credit_amount for line in self.lines.all())
    
    @property
    def is_balanced(self):
        """Check if journal entry is balanced"""
        return abs(self.total_debits - self.total_credits) < Decimal('0.01')
    
    def __str__(self):
        return f"{self.reference_number} - {self.description[:50]}"


class JournalEntryLine(models.Model):
    """Individual lines in journal entries"""
    journal_entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='lines')
    account = models.ForeignKey(FinancialAccount, on_delete=models.CASCADE)
    description = models.CharField(max_length=200)
    debit_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    credit_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    class Meta:
        ordering = ['id']
    
    def __str__(self):
        if self.debit_amount > 0:
            return f"Dr. {self.account.name} - {self.debit_amount}"
        else:
            return f"Cr. {self.account.name} - {self.credit_amount}"


class FinancialReport(models.Model):
    """Generated financial reports for caching and audit trail"""
    REPORT_TYPES = (
        ('balance_sheet', 'Balance Sheet'),
        ('income_statement', 'Income Statement'),
        ('cash_flow', 'Cash Flow Statement'),
        ('expense_report', 'Expense Report'),
        ('receivables_report', 'Receivables Report'),
        ('payables_report', 'Payables Report'),
    )
    
    report_type = models.CharField(max_length=30, choices=REPORT_TYPES)
    title = models.CharField(max_length=200)
    period_from = models.DateField()
    period_to = models.DateField()
    
    # Report data (JSON format)
    report_data = models.JSONField()
    
    # Files
    pdf_file = models.FileField(upload_to='financial_reports/%Y/%m/', null=True, blank=True)
    csv_file = models.FileField(upload_to='financial_reports/%Y/%m/', null=True, blank=True)
    
    # Metadata
    generated_by = models.ForeignKey(User, on_delete=models.CASCADE)
    generated_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-generated_at']
    
    def __str__(self):
        return f"{self.get_report_type_display()} - {self.period_from} to {self.period_to}"


class FinancialAuditLog(models.Model):
    """Enhanced audit logging for financial activities"""
    ACTION_CHOICES = (
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('approve', 'Approve'),
        ('reject', 'Reject'),
        ('pay', 'Mark as Paid'),
        ('cancel', 'Cancel'),
    )
    
    # What was changed
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    content_type = models.CharField(max_length=50)  # e.g., 'financial_activity', 'journal_entry'
    object_id = models.IntegerField()
    object_representation = models.CharField(max_length=200)
    
    # Change details
    field_changes = models.JSONField(null=True, blank=True)  # {"field": {"old": "value", "new": "value"}}
    description = models.TextField()
    
    # Context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Financial Audit Log'
        verbose_name_plural = 'Financial Audit Logs'
    
    def __str__(self):
        return f"{self.user.username} - {self.action} - {self.content_type} - {self.created_at}"
