"""
Project Management Models for BS Engineering System
Integration with existing client, quotation, invoice, and financial flows
"""

from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
import os

User = get_user_model()


class Project(models.Model):
    """Main Project model for tracking engineering/construction projects"""
    PROJECT_TYPES = (
        ('construction', 'Construction'),
        ('service', 'Service'),
        ('rebuilding', 'Rebuilding'),
        ('maintenance', 'Maintenance'),
        ('consulting', 'Consulting'),
        ('design', 'Design'),
        ('inspection', 'Inspection'),
        ('other', 'Other'),
    )
    
    STATUS_CHOICES = (
        ('planning', 'Planning'),
        ('active', 'Active'),
        ('on_hold', 'On Hold'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    
    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    )
    
    # Core project fields
    name = models.CharField(max_length=200)
    project_number = models.CharField(max_length=50, unique=True, help_text="Project code/number")
    client = models.ForeignKey('Client', on_delete=models.CASCADE, related_name='projects')
    project_type = models.CharField(max_length=20, choices=PROJECT_TYPES, default='construction')
    
    # Project timeline
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    estimated_completion_date = models.DateField(null=True, blank=True)
    actual_completion_date = models.DateField(null=True, blank=True)
    
    # Project details
    description = models.TextField(blank=True, help_text="Detailed project description and scope")
    location = models.CharField(max_length=500, blank=True, help_text="Project site location")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    
    # Budget and financial tracking
    budget = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True, help_text="Project budget")
    currency = models.CharField(
        max_length=10,
        choices=[(code, code) for code, name, symbol in getattr(settings, 'CURRENCY_CHOICES', [('PKR', 'Pakistani Rupee', 'Rs')])],
        default=getattr(settings, 'DEFAULT_CURRENCY', 'PKR')
    )
    
    # Team management
    project_manager = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='managed_projects'
    )
    assigned_users = models.ManyToManyField(
        User, 
        blank=True, 
        related_name='assigned_projects',
        through='ProjectAssignment',
        through_fields=('project', 'user')
    )
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_projects')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['project_number']),
            models.Index(fields=['status']),
            models.Index(fields=['client']),
            models.Index(fields=['start_date']),
        ]
    
    def __str__(self):
        return f"{self.project_number} - {self.name}"
    
    def save(self, *args, **kwargs):
        """Auto-generate project code if not provided"""
        if not self.project_number:
            # Generate project code: PROJ-YYYY-NNNN
            year = self.start_date.year if self.start_date else timezone.now().year
            last_project = Project.objects.filter(
                project_number__startswith=f'PROJ-{year}-'
            ).order_by('project_number').last()
            
            if last_project:
                last_num = int(last_project.project_number.split('-')[-1])
                new_num = str(last_num + 1).zfill(4)
            else:
                new_num = '0001'
            
            self.project_number = f'PROJ-{year}-{new_num}'
        
        super().save(*args, **kwargs)
    
    @property
    def duration_days(self):
        """Calculate project duration in days"""
        if self.start_date and self.end_date:
            return (self.end_date - self.start_date).days
        return None
    
    @property
    def progress_percentage(self):
        """Calculate project progress percentage"""
        if self.status == 'completed':
            return 100
        elif self.status in ['planning', 'cancelled']:
            return 0
        elif self.status == 'active':
            if self.start_date and self.end_date:
                total_days = (self.end_date - self.start_date).days
                elapsed_days = (timezone.now().date() - self.start_date).days
                if total_days > 0:
                    return min(90, max(10, int((elapsed_days / total_days) * 100)))
            return 50  # Default for in-progress projects
        return 25  # Default for other statuses
    
    @property
    def total_quotations_amount(self):
        """Total amount from linked quotations"""
        return sum(q.total_amount for q in self.quotations.all())
    
    @property
    def total_invoices_amount(self):
        """Total amount from linked invoices"""
        return sum(i.total_amount for i in self.invoices.all())
    
    @property
    def total_expenses_amount(self):
        """Total approved/paid expenses from ProjectExpense model"""
        return self.expenses.filter(status__in=['approved', 'paid']).aggregate(
            total=models.Sum('total_amount')
        )['total'] or Decimal('0')
    
    @property
    def all_expenses_amount(self):
        """Total of all expenses regardless of status"""
        return self.expenses.aggregate(
            total=models.Sum('total_amount')
        )['total'] or Decimal('0')
    
    @property
    def total_expenses_by_category(self):
        """Get expenses grouped by category"""
        from django.db.models import Sum
        return self.expenses.filter(status__in=['approved', 'paid']).values(
            'category__name'
        ).annotate(
            total=Sum('total_amount'),
            count=models.Count('id')
        ).order_by('-total')
    
    @property
    def pending_expenses_amount(self):
        """Total pending expenses"""
        return self.expenses.filter(status='pending').aggregate(
            total=models.Sum('total_amount')
        )['total'] or Decimal('0')
    
    @property
    def expenses_count(self):
        """Count of all expenses"""
        return self.expenses.count()
    
    @property
    def approved_expenses_count(self):
        """Count of approved expenses"""
        return self.expenses.filter(status__in=['approved', 'paid']).count()
    
    @property
    def total_revenue(self):
        """Total revenue (paid invoices)"""
        paid_invoices = self.invoices.filter(status='paid')
        return sum(inv.total_amount for inv in paid_invoices)
    
    @property
    def profitability(self):
        """Calculate project profitability (Revenue - Expenses)"""
        return self.total_revenue - self.total_expenses_amount
    
    @property
    def budget_utilization_percentage(self):
        """Calculate budget utilization percentage"""
        if self.budget and self.budget > 0:
            total_spent = self.total_expenses_amount + self.total_invoices_amount
            return min(100, (total_spent / self.budget) * 100)
        return 0
    
    @property
    def is_overdue(self):
        """Check if project is overdue"""
        if self.end_date and self.status not in ['completed', 'cancelled']:
            return timezone.now().date() > self.end_date
        return False
    
    @property
    def days_remaining(self):
        """Calculate days remaining until end date"""
        if self.end_date and self.status not in ['completed', 'cancelled']:
            remaining = (self.end_date - timezone.now().date()).days
            return max(0, remaining)
        return None


class ProjectAssignment(models.Model):
    """Through model for project-user assignments with roles"""
    ROLE_CHOICES = (
        ('project_manager', 'Project Manager'),
        ('team_lead', 'Team Lead'),
        ('engineer', 'Engineer'),
        ('designer', 'Designer'),
        ('supervisor', 'Supervisor'),
        ('consultant', 'Consultant'),
        ('contractor', 'Contractor'),
        ('other', 'Other'),
    )
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='engineer')
    assigned_date = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='assigned_team_members'
    )
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['project', 'user']
    
    def __str__(self):
        return f"{self.user.username} - {self.project.name} ({self.role})"


class ProjectAttachment(models.Model):
    """File attachments for projects (site plans, permits, etc.)"""
    ATTACHMENT_TYPES = (
        ('site_plan', 'Site Plan'),
        ('permit', 'Permit'),
        ('drawing', 'Technical Drawing'),
        ('photo', 'Photo'),
        ('document', 'Document'),
        ('contract', 'Contract'),
        ('report', 'Report'),
        ('other', 'Other'),
    )
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='attachments')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    attachment_type = models.CharField(max_length=20, choices=ATTACHMENT_TYPES, default='document')
    file = models.FileField(upload_to='project_attachments/%Y/%m/')
    file_type = models.CharField(max_length=50, blank=True)
    file_size = models.IntegerField(null=True, blank=True)  # in bytes
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} - {self.project.name}"
    
    def save(self, *args, **kwargs):
        if self.file:
            self.file_size = self.file.size
            # Extract file type from file name
            self.file_type = os.path.splitext(self.file.name)[1].lower()
        super().save(*args, **kwargs)


class ProjectMilestone(models.Model):
    """Project milestones and key deliverables"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('delayed', 'Delayed'),
    )
    
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='milestones')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    due_date = models.DateField()
    completed_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_to = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='assigned_milestones'
    )
    order = models.IntegerField(default=0, help_text="Order of milestone in project timeline")
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['order', 'due_date']
    
    def __str__(self):
        return f"{self.project.name} - {self.title}"
    
    @property
    def is_overdue(self):
        """Check if milestone is overdue"""
        if self.status not in ['completed'] and self.due_date:
            return timezone.now().date() > self.due_date
        return False


class ProjectNote(models.Model):
    """Project notes and updates"""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='notes')
    title = models.CharField(max_length=200, blank=True)
    content = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_important = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.project.name} - {self.title or 'Note'} ({self.created_at.strftime('%Y-%m-%d')})"


class ProjectExpenseCategory(models.Model):
    """Predefined and custom expense categories for projects"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    is_predefined = models.BooleanField(default=False, help_text="System predefined category")
    is_active = models.BooleanField(default=True)
    parent_category = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategories')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
        verbose_name_plural = "Project Expense Categories"
    
    def __str__(self):
        return self.name
    
    @classmethod
    def get_default_categories(cls):
        """Create default expense categories if they don't exist"""
        defaults = [
            ('Labour', 'Direct labour costs including wages, overtime, and benefits'),
            ('Material', 'Raw materials, supplies, and consumables'),
            ('Equipment', 'Equipment rental, purchase, and maintenance'),
            ('Transport', 'Transportation, logistics, and delivery costs'),
            ('Subcontractor', 'Subcontractor and third-party service costs'),
            ('Utilities', 'Electricity, water, gas, and other utilities'),
            ('Administrative', 'Office expenses, communication, and administrative costs'),
            ('Professional Services', 'Consulting, legal, and professional service fees'),
            ('Safety & Compliance', 'Safety equipment, permits, and compliance costs'),
            ('Miscellaneous', 'Other project-related expenses'),
        ]
        
        created_categories = []
        for name, description in defaults:
            category, created = cls.objects.get_or_create(
                name=name,
                defaults={
                    'description': description,
                    'is_predefined': True,
                    'is_active': True
                }
            )
            if created:
                created_categories.append(category)
        
        return created_categories


class ProjectExpense(models.Model):
    """Detailed expense tracking for projects"""
    PAYMENT_METHODS = (
        ('cash', 'Cash'),
        ('cheque', 'Cheque'),
        ('bank_transfer', 'Bank Transfer'),
        ('credit_card', 'Credit Card'),
        ('digital_wallet', 'Digital Wallet'),
        ('other', 'Other'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('paid', 'Paid'),
        ('rejected', 'Rejected'),
    )
    
    # Core fields
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='expenses')
    expense_number = models.CharField(max_length=50, unique=True, blank=True)
    
    # Expense details
    category = models.ForeignKey(ProjectExpenseCategory, on_delete=models.CASCADE, related_name='expenses')
    subcategory = models.CharField(max_length=200, blank=True, help_text="Sub-category or specific description")
    description = models.TextField(help_text="Detailed description of the expense")
    
    # Financial details
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    currency = models.CharField(
        max_length=10,
        choices=[(code, code) for code, name, symbol in getattr(settings, 'CURRENCY_CHOICES', [('PKR', 'Pakistani Rupee', 'Rs')])],
        default=getattr(settings, 'DEFAULT_CURRENCY', 'PKR')
    )
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='bank_transfer')
    
    # Dates
    expense_date = models.DateField(help_text="Date when the expense was incurred")
    payment_date = models.DateField(null=True, blank=True, help_text="Date when payment was made")
    
    # Vendor/Supplier information
    vendor_name = models.CharField(max_length=200, blank=True, help_text="Vendor or supplier name")
    vendor_contact = models.CharField(max_length=100, blank=True, help_text="Vendor contact information")
    invoice_reference = models.CharField(max_length=100, blank=True, help_text="Vendor invoice number")
    
    # Status and approval
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='approved_expenses'
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    
    # Additional information
    notes = models.TextField(blank=True, help_text="Additional notes or remarks")
    attachment = models.FileField(
        upload_to='project_expense_attachments/%Y/%m/',
        null=True,
        blank=True,
        help_text="Receipt, invoice, or supporting document"
    )
    attachment_name = models.CharField(max_length=200, blank=True)
    
    # Tax information
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Tax rate percentage")
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, help_text="Amount including tax")
    
    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_expenses')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-expense_date', '-created_at']
        indexes = [
            models.Index(fields=['project', 'expense_date']),
            models.Index(fields=['category']),
            models.Index(fields=['status']),
            models.Index(fields=['expense_number']),
        ]
    
    def __str__(self):
        return f"{self.expense_number} - {self.project.name} - {self.category.name} - {self.amount}"
    
    def save(self, *args, **kwargs):
        """Auto-generate expense number and calculate totals"""
        if not self.expense_number:
            # Generate expense number: EXP-PROJ-YYYY-NNNN
            year = self.expense_date.year if self.expense_date else timezone.now().year
            project_code = self.project.project_number.replace('PROJ-', '') if self.project.project_number else 'UNKN'
            last_expense = ProjectExpense.objects.filter(
                project=self.project,
                expense_number__startswith=f'EXP-{project_code}-{year}-'
            ).order_by('expense_number').last()
            
            if last_expense:
                last_num = int(last_expense.expense_number.split('-')[-1])
                new_num = str(last_num + 1).zfill(4)
            else:
                new_num = '0001'
            
            self.expense_number = f'EXP-{project_code}-{year}-{new_num}'
        
        # Calculate tax amount and total
        if self.amount and self.tax_rate:
            self.tax_amount = (self.amount * self.tax_rate) / 100
        else:
            self.tax_amount = 0
        
        self.total_amount = self.amount + self.tax_amount
        
        # Set attachment name if file is provided
        if self.attachment and not self.attachment_name:
            self.attachment_name = os.path.basename(self.attachment.name)
        
        super().save(*args, **kwargs)
    
    @property
    def is_approved(self):
        """Check if expense is approved"""
        return self.status == 'approved'
    
    @property
    def is_paid(self):
        """Check if expense is paid"""
        return self.status == 'paid'
    
    def approve(self, approved_by_user):
        """Approve the expense"""
        self.status = 'approved'
        self.approved_by = approved_by_user
        self.approved_at = timezone.now()
        self.save()
    
    def mark_as_paid(self, payment_date=None):
        """Mark expense as paid"""
        self.status = 'paid'
        self.payment_date = payment_date or timezone.now().date()
        self.save()
    
    def reject(self):
        """Reject the expense"""
        self.status = 'rejected'
        self.save()
