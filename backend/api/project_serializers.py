"""
Project Management Serializers for BS Engineering System
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db import models
from django.conf import settings
from .project_models import (
    Project, 
    ProjectAssignment, 
    ProjectAttachment, 
    ProjectMilestone, 
    ProjectNote,
    ProjectExpenseCategory,
    ProjectExpense
)
from .serializers import ClientSerializer, UserSerializer
from .financial_serializers import FinancialActivitySerializer

User = get_user_model()


class ProjectAssignmentSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    assigned_by_details = UserSerializer(source='assigned_by', read_only=True)
    
    class Meta:
        model = ProjectAssignment
        fields = [
            'id', 'user', 'user_details', 'role', 'assigned_date', 
            'assigned_by', 'assigned_by_details', 'is_active', 'notes'
        ]
        read_only_fields = ['assigned_date']


class ProjectAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_details = UserSerializer(source='uploaded_by', read_only=True)
    file_url = serializers.SerializerMethodField()
    file_size_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectAttachment
        fields = [
            'id', 'name', 'description', 'attachment_type', 'file', 'file_url',
            'file_type', 'file_size', 'file_size_formatted', 'uploaded_by', 
            'uploaded_by_details', 'created_at'
        ]
        read_only_fields = ['file_type', 'file_size', 'uploaded_by', 'created_at']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def get_file_size_formatted(self, obj):
        if obj.file_size:
            # Convert bytes to human readable format
            for unit in ['B', 'KB', 'MB', 'GB']:
                if obj.file_size < 1024.0:
                    return f"{obj.file_size:.1f} {unit}"
                obj.file_size /= 1024.0
            return f"{obj.file_size:.1f} TB"
        return None


class ProjectMilestoneSerializer(serializers.ModelSerializer):
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)
    is_overdue = serializers.ReadOnlyField()
    days_until_due = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectMilestone
        fields = [
            'id', 'title', 'description', 'due_date', 'completed_date', 'status',
            'assigned_to', 'assigned_to_details', 'order', 'created_by', 
            'created_by_details', 'created_at', 'updated_at', 'is_overdue',
            'days_until_due'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']
    
    def get_days_until_due(self, obj):
        if obj.due_date and obj.status != 'completed':
            from django.utils import timezone
            remaining = (obj.due_date - timezone.now().date()).days
            return remaining
        return None


class ProjectNoteSerializer(serializers.ModelSerializer):
    created_by_details = UserSerializer(source='created_by', read_only=True)
    
    class Meta:
        model = ProjectNote
        fields = [
            'id', 'title', 'content', 'created_by', 'created_by_details',
            'created_at', 'updated_at', 'is_important'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class ProjectListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for project lists"""
    client_name = serializers.CharField(source='client.name', read_only=True)
    project_manager_name = serializers.CharField(source='project_manager.username', read_only=True)
    progress_percentage = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    days_remaining = serializers.ReadOnlyField()
    total_expenses_amount = serializers.ReadOnlyField()
    total_revenue = serializers.ReadOnlyField()
    profitability = serializers.ReadOnlyField()
    assigned_users_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'project_number', 'client', 'client_name', 'project_type',
            'start_date', 'end_date', 'status', 'priority', 'project_manager',
            'project_manager_name', 'budget', 'currency', 'progress_percentage',
            'is_overdue', 'days_remaining', 'total_expenses_amount', 'total_revenue',
            'profitability', 'assigned_users_count', 'created_at', 'updated_at'
        ]
    
    def get_assigned_users_count(self, obj):
        return obj.assigned_users.filter(projectassignment__is_active=True).count()


class ProjectDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for project detail views"""
    client_details = ClientSerializer(source='client', read_only=True)
    project_manager_details = UserSerializer(source='project_manager', read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)
    
    # Calculated fields
    duration_days = serializers.ReadOnlyField()
    progress_percentage = serializers.ReadOnlyField()
    total_quotations_amount = serializers.ReadOnlyField()
    total_invoices_amount = serializers.ReadOnlyField()
    total_expenses_amount = serializers.ReadOnlyField()
    total_revenue = serializers.ReadOnlyField()
    profitability = serializers.ReadOnlyField()
    budget_utilization_percentage = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    days_remaining = serializers.ReadOnlyField()
    
    # Related data
    assignments = ProjectAssignmentSerializer(source='projectassignment_set', many=True, read_only=True)
    attachments = ProjectAttachmentSerializer(many=True, read_only=True)
    milestones = ProjectMilestoneSerializer(many=True, read_only=True)
    recent_notes = serializers.SerializerMethodField()
    
    # Stats
    quotations_count = serializers.SerializerMethodField()
    invoices_count = serializers.SerializerMethodField()
    expenses_count = serializers.SerializerMethodField()
    milestones_completed_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'project_number', 'client', 'client_details', 'project_type',
            'start_date', 'end_date', 'estimated_completion_date', 'actual_completion_date',
            'description', 'location', 'status', 'priority', 'budget', 'currency',
            'project_manager', 'project_manager_details', 'created_by', 'created_by_details',
            'created_at', 'updated_at',
            
            # Calculated fields
            'duration_days', 'progress_percentage', 'total_quotations_amount',
            'total_invoices_amount', 'total_expenses_amount', 'total_revenue',
            'profitability', 'budget_utilization_percentage', 'is_overdue', 'days_remaining',
            
            # Related data
            'assignments', 'attachments', 'milestones', 'recent_notes',
            
            # Stats
            'quotations_count', 'invoices_count', 'expenses_count', 'milestones_completed_count'
        ]
        read_only_fields = ['project_number', 'created_by', 'created_at', 'updated_at']
    
    def get_recent_notes(self, obj):
        recent_notes = obj.notes.order_by('-created_at')[:5]
        return ProjectNoteSerializer(recent_notes, many=True, context=self.context).data
    
    def get_quotations_count(self, obj):
        return obj.quotations.count()
    
    def get_invoices_count(self, obj):
        return obj.invoices.count()
    
    def get_expenses_count(self, obj):
        return obj.financial_activities.filter(activity_type='expense').count()
    
    def get_milestones_completed_count(self, obj):
        return obj.milestones.filter(status='completed').count()


class ProjectCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating projects"""
    
    class Meta:
        model = Project
        fields = [
            'name', 'client', 'project_type', 'start_date', 'end_date',
            'estimated_completion_date', 'description', 'location', 'status',
            'priority', 'budget', 'currency', 'project_manager'
        ]
    
    def validate(self, data):
        """Validate project dates"""
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        estimated_completion_date = data.get('estimated_completion_date')
        
        if start_date and end_date:
            if end_date < start_date:
                raise serializers.ValidationError("End date must be after start date")
        
        if start_date and estimated_completion_date:
            if estimated_completion_date < start_date:
                raise serializers.ValidationError("Estimated completion date must be after start date")
        
        return data


class ProjectDashboardSerializer(serializers.ModelSerializer):
    """Serializer for project dashboard analytics"""
    client_name = serializers.CharField(source='client.name', read_only=True)
    project_manager_name = serializers.CharField(source='project_manager.username', read_only=True)
    
    # Financial metrics
    total_budget = serializers.DecimalField(source='budget', max_digits=15, decimal_places=2, read_only=True)
    total_spent = serializers.SerializerMethodField()
    total_billed = serializers.SerializerMethodField()
    remaining_budget = serializers.SerializerMethodField()
    profit_margin = serializers.SerializerMethodField()
    
    # Progress metrics
    progress_percentage = serializers.ReadOnlyField()
    milestones_completed = serializers.SerializerMethodField()
    milestones_total = serializers.SerializerMethodField()
    days_remaining = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    
    # Team metrics
    team_size = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'project_number', 'client_name', 'project_manager_name',
            'status', 'priority', 'start_date', 'end_date', 'currency',
            
            # Financial metrics
            'total_budget', 'total_spent', 'total_billed', 'remaining_budget',
            'profit_margin',
            
            # Progress metrics
            'progress_percentage', 'milestones_completed', 'milestones_total',
            'days_remaining', 'is_overdue',
            
            # Team metrics
            'team_size'
        ]
    
    def get_total_spent(self, obj):
        return float(obj.total_expenses_amount)
    
    def get_total_billed(self, obj):
        return float(obj.total_invoices_amount)
    
    def get_remaining_budget(self, obj):
        if obj.budget:
            return float(obj.budget - obj.total_expenses_amount)
        return 0
    
    def get_profit_margin(self, obj):
        if obj.total_invoices_amount > 0:
            return float((obj.profitability / obj.total_invoices_amount) * 100)
        return 0
    
    def get_milestones_completed(self, obj):
        return obj.milestones.filter(status='completed').count()
    
    def get_milestones_total(self, obj):
        return obj.milestones.count()
    
    def get_team_size(self, obj):
        return obj.assigned_users.filter(projectassignment__is_active=True).count()


class ProjectFinancialSummarySerializer(serializers.Serializer):
    """Serializer for project financial summaries"""
    project_id = serializers.IntegerField()
    project_name = serializers.CharField()
    project_number = serializers.CharField()
    
    # Financial data
    total_quotations = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_invoices = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_expenses = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    profitability = serializers.DecimalField(max_digits=15, decimal_places=2)
    
    # Counts
    quotations_count = serializers.IntegerField()
    invoices_count = serializers.IntegerField()
    expenses_count = serializers.IntegerField()
    
    # Percentages
    profit_margin = serializers.DecimalField(max_digits=5, decimal_places=2)
    budget_utilization = serializers.DecimalField(max_digits=5, decimal_places=2)


class ProjectExpenseCategorySerializer(serializers.ModelSerializer):
    """Serializer for project expense categories"""
    subcategories = serializers.SerializerMethodField()
    total_expenses = serializers.SerializerMethodField()
    expenses_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectExpenseCategory
        fields = [
            'id', 'name', 'description', 'is_predefined', 'is_active', 
            'parent_category', 'subcategories', 'total_expenses', 'expenses_count',
            'created_at'
        ]
        read_only_fields = ['created_at', 'is_predefined']
    
    def get_subcategories(self, obj):
        if obj.subcategories.exists():
            return ProjectExpenseCategorySerializer(obj.subcategories.filter(is_active=True), many=True).data
        return []
    
    def get_total_expenses(self, obj):
        # Get project from context if available for filtering
        project = self.context.get('project')
        if project:
            return obj.expenses.filter(
                project=project,
                status__in=['approved', 'paid']
            ).aggregate(total=models.Sum('total_amount'))['total'] or 0
        return obj.expenses.filter(status__in=['approved', 'paid']).aggregate(
            total=models.Sum('total_amount')
        )['total'] or 0
    
    def get_expenses_count(self, obj):
        project = self.context.get('project')
        if project:
            return obj.expenses.filter(project=project).count()
        return obj.expenses.count()


class ProjectExpenseSerializer(serializers.ModelSerializer):
    """Serializer for project expenses"""
    category_details = ProjectExpenseCategorySerializer(source='category', read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)
    approved_by_details = UserSerializer(source='approved_by', read_only=True)
    attachment_url = serializers.SerializerMethodField()
    attachment_size_formatted = serializers.SerializerMethodField()
    currency_symbol = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectExpense
        fields = [
            'id', 'expense_number', 'project', 'category', 'category_details',
            'subcategory', 'description', 'amount', 'currency', 'currency_symbol',
            'tax_rate', 'tax_amount', 'total_amount', 'payment_method', 
            'expense_date', 'payment_date', 'vendor_name', 'vendor_contact',
            'invoice_reference', 'status', 'approved_by', 'approved_by_details',
            'approved_at', 'notes', 'attachment', 'attachment_url', 
            'attachment_name', 'attachment_size_formatted', 'created_by', 
            'created_by_details', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'expense_number', 'tax_amount', 'total_amount', 'approved_by',
            'approved_at', 'attachment_name', 'created_by', 'created_at', 'updated_at'
        ]
    
    def get_attachment_url(self, obj):
        if obj.attachment:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.attachment.url)
            return obj.attachment.url
        return None
    
    def get_attachment_size_formatted(self, obj):
        if obj.attachment and hasattr(obj.attachment, 'size'):
            size = obj.attachment.size
            for unit in ['bytes', 'KB', 'MB', 'GB']:
                if size < 1024.0:
                    return f"{size:.1f} {unit}"
                size /= 1024.0
            return f"{size:.1f} TB"
        return None
    
    def get_currency_symbol(self, obj):
        currency_choices = getattr(settings, 'CURRENCY_CHOICES', [])
        for code, name, symbol in currency_choices:
            if code == obj.currency:
                return symbol
        return obj.currency
    
    def validate(self, data):
        """Custom validation for expense data"""
        if data.get('expense_date') and data.get('payment_date'):
            if data['payment_date'] < data['expense_date']:
                raise serializers.ValidationError({
                    'payment_date': 'Payment date cannot be earlier than expense date.'
                })
        
        if data.get('amount') and data['amount'] <= 0:
            raise serializers.ValidationError({
                'amount': 'Amount must be greater than zero.'
            })
        
        if data.get('tax_rate') and (data['tax_rate'] < 0 or data['tax_rate'] > 100):
            raise serializers.ValidationError({
                'tax_rate': 'Tax rate must be between 0 and 100.'
            })
        
        return data


class ProjectExpenseListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for expense lists"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    currency_symbol = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = ProjectExpense
        fields = [
            'id', 'expense_number', 'category_name', 'subcategory', 
            'description', 'amount', 'currency', 'currency_symbol',
            'total_amount', 'payment_method', 'expense_date', 'status',
            'status_display', 'vendor_name', 'created_by_name', 'created_at'
        ]
    
    def get_currency_symbol(self, obj):
        currency_choices = getattr(settings, 'CURRENCY_CHOICES', [])
        for code, name, symbol in currency_choices:
            if code == obj.currency:
                return symbol
        return obj.currency


class ProjectExpenseSummarySerializer(serializers.Serializer):
    """Serializer for project expense summaries and analytics"""
    project_id = serializers.IntegerField()
    project_name = serializers.CharField()
    
    # Total amounts
    total_expenses = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_pending = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_approved = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_paid = serializers.DecimalField(max_digits=15, decimal_places=2)
    
    # Counts
    expenses_count = serializers.IntegerField()
    pending_count = serializers.IntegerField()
    approved_count = serializers.IntegerField()
    paid_count = serializers.IntegerField()
    
    # Category breakdown
    expenses_by_category = serializers.ListField()
    top_categories = serializers.ListField()
    
    # Recent expenses
    recent_expenses = ProjectExpenseListSerializer(many=True)
    
    # Currency
    currency = serializers.CharField()
    currency_symbol = serializers.CharField()
