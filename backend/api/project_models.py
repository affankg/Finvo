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
        """Total expenses linked to this project"""
        from .financial_models import FinancialActivity
        expenses = FinancialActivity.objects.filter(
            project=self,
            activity_type='expense'
        )
        return sum(exp.amount for exp in expenses)
    
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
