"""
Financial Serializers for BS Engineering System
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .financial_models import (
    FinancialAccount,
    FinancialActivity,
    FinancialAttachment,
    JournalEntry,
    JournalEntryLine,
    FinancialReport,
    FinancialAuditLog,
)
from .models import Client, Quotation, Invoice

User = get_user_model()


class FinancialAccountSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    balance = serializers.SerializerMethodField()
    
    class Meta:
        model = FinancialAccount
        fields = '__all__'
        read_only_fields = ('created_at',)
    
    def get_children(self, obj):
        """Get child accounts"""
        children = obj.children.filter(is_active=True)
        return FinancialAccountSerializer(children, many=True).data
    
    def get_balance(self, obj):
        """Calculate account balance"""
        # This would typically involve complex calculations
        # For now, return a placeholder
        return 0.0


class FinancialAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.CharField(source='uploaded_by.username', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = FinancialAttachment
        fields = '__all__'
        read_only_fields = ('uploaded_by', 'created_at', 'file_size', 'mime_type')
    
    def get_file_url(self, obj):
        """Get file URL"""
        if obj.cloud_url:
            return obj.cloud_url
        elif obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class FinancialActivitySerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    project_number = serializers.CharField(source='project.project_number', read_only=True)
    project_quotation_number = serializers.CharField(source='project_quotation.number', read_only=True)
    project_invoice_number = serializers.CharField(source='project_invoice.number', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    account_code = serializers.CharField(source='account.code', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)
    attachments = FinancialAttachmentSerializer(many=True, read_only=True)
    formatted_amount = serializers.CharField(read_only=True)
    currency_symbol = serializers.CharField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = FinancialActivity
        fields = '__all__'
        read_only_fields = (
            'reference_number', 'created_by', 'created_at', 'updated_at',
            'approved_by', 'approved_at'
        )
    
    def create(self, validated_data):
        """Create financial activity with audit trail"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)
    
    def validate(self, data):
        """Validate financial activity data"""
        # Ensure due_date is not before transaction_date
        if data.get('due_date') and data.get('transaction_date'):
            if data['due_date'] < data['transaction_date']:
                raise serializers.ValidationError(
                    "Due date cannot be before transaction date"
                )
        
        # Validate amount is positive
        if data.get('amount') and data['amount'] <= 0:
            raise serializers.ValidationError(
                "Amount must be greater than zero"
            )
        
        return data


class FinancialActivityListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    client_name = serializers.CharField(source='client.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    project_number = serializers.CharField(source='project.project_number', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    formatted_amount = serializers.CharField(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    attachment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FinancialActivity
        fields = (
            'id', 'reference_number', 'activity_type', 'amount', 'formatted_amount',
            'currency', 'client_name', 'project_name', 'project_number', 'account_name', 
            'description', 'bill_to', 'invoice_number', 'expense_category', 
            'cost_center', 'status', 'transaction_date', 'due_date', 'created_by_name',
            'is_overdue', 'attachment_count', 'created_at'
        )
    
    def get_attachment_count(self, obj):
        """Get number of attachments"""
        return obj.attachments.count()


class JournalEntryLineSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    account_code = serializers.CharField(source='account.code', read_only=True)
    
    class Meta:
        model = JournalEntryLine
        fields = '__all__'


class JournalEntrySerializer(serializers.ModelSerializer):
    lines = JournalEntryLineSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    financial_activity_reference = serializers.CharField(source='financial_activity.reference_number', read_only=True)
    total_debits = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    total_credits = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    is_balanced = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = JournalEntry
        fields = '__all__'
        read_only_fields = ('reference_number', 'created_by', 'created_at')


class FinancialReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.CharField(source='generated_by.username', read_only=True)
    report_type_display = serializers.CharField(source='get_report_type_display', read_only=True)
    pdf_url = serializers.SerializerMethodField()
    csv_url = serializers.SerializerMethodField()
    
    class Meta:
        model = FinancialReport
        fields = '__all__'
        read_only_fields = ('generated_by', 'generated_at')
    
    def get_pdf_url(self, obj):
        """Get PDF file URL"""
        if obj.pdf_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.pdf_file.url)
            return obj.pdf_file.url
        return None
    
    def get_csv_url(self, obj):
        """Get CSV file URL"""
        if obj.csv_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.csv_file.url)
            return obj.csv_file.url
        return None


class FinancialAuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = FinancialAuditLog
        fields = '__all__'
        read_only_fields = ('created_at',)


class BalanceSheetSerializer(serializers.Serializer):
    """Serializer for balance sheet data"""
    period_from = serializers.DateField()
    period_to = serializers.DateField()
    assets = serializers.DictField()
    liabilities = serializers.DictField()
    equity = serializers.DictField()
    total_assets = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_liabilities = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_equity = serializers.DecimalField(max_digits=15, decimal_places=2)
    generated_at = serializers.DateTimeField()


class IncomeStatementSerializer(serializers.Serializer):
    """Serializer for income statement data"""
    period_from = serializers.DateField()
    period_to = serializers.DateField()
    revenue = serializers.DictField()
    expenses = serializers.DictField()
    total_revenue = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_expenses = serializers.DecimalField(max_digits=15, decimal_places=2)
    net_income = serializers.DecimalField(max_digits=15, decimal_places=2)
    gross_profit_margin = serializers.DecimalField(max_digits=5, decimal_places=2)
    generated_at = serializers.DateTimeField()


class DashboardInsightsSerializer(serializers.Serializer):
    """Serializer for dashboard financial insights"""
    total_receivables = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_payables = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_expenses_current_month = serializers.DecimalField(max_digits=15, decimal_places=2)
    total_income_current_month = serializers.DecimalField(max_digits=15, decimal_places=2)
    overdue_receivables = serializers.DecimalField(max_digits=15, decimal_places=2)
    overdue_payables = serializers.DecimalField(max_digits=15, decimal_places=2)
    pending_approvals = serializers.IntegerField()
    cash_flow_trend = serializers.ListField()
    top_expenses_by_category = serializers.ListField()
    revenue_vs_expenses_chart = serializers.DictField()
