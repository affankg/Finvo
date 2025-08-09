from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from .models import Client, Service, Quotation, QuotationItem, Invoice, InvoiceItem, ActivityLog, NumberSequence, Interaction, ClientAttachment

# Import financial serializers
from .financial_serializers import (
    FinancialAccountSerializer,
    FinancialActivitySerializer,
    FinancialActivityListSerializer,
    FinancialAttachmentSerializer,
    JournalEntrySerializer,
    FinancialReportSerializer,
    FinancialAuditLogSerializer,
    BalanceSheetSerializer,
    IncomeStatementSerializer,
    DashboardInsightsSerializer,
)

User = get_user_model()

class NumberSequenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NumberSequence
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if user.is_active:
                    data['user'] = user
                    return data
                else:
                    raise serializers.ValidationError('User account is disabled.')
            else:
                raise serializers.ValidationError('Invalid credentials.')
        else:
            raise serializers.ValidationError('Must include username and password.')

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'first_name', 'last_name', 'password', 'date_joined', 'is_active')
        read_only_fields = ('id', 'date_joined')
        
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user
        
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

class ClientSerializer(serializers.ModelSerializer):
    total_quotations = serializers.ReadOnlyField()
    total_invoices = serializers.ReadOnlyField()
    total_amount_quoted = serializers.ReadOnlyField()
    total_amount_invoiced = serializers.ReadOnlyField()
    last_interaction_date = serializers.ReadOnlyField()
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    
    class Meta:
        model = Client
        fields = [
            'id', 'name', 'company', 'email', 'phone', 'address', 'status', 'tags',
            'notes', 'website', 'industry', 'source', 'assigned_to', 'assigned_to_details',
            'created_at', 'updated_at', 'total_quotations', 'total_invoices',
            'total_amount_quoted', 'total_amount_invoiced', 'last_interaction_date'
        ]

class InteractionSerializer(serializers.ModelSerializer):
    created_by_details = UserSerializer(source='created_by', read_only=True)
    client_details = ClientSerializer(source='client', read_only=True)
    quotation_details = serializers.SerializerMethodField()
    invoice_details = serializers.SerializerMethodField()
    currency_symbol = serializers.ReadOnlyField()
    formatted_amount = serializers.ReadOnlyField()
    
    class Meta:
        model = Interaction
        fields = [
            'id', 'client', 'client_details', 'interaction_type', 'direction', 'subject',
            'description', 'reference_number', 'amount', 'currency', 'currency_symbol', 
            'formatted_amount', 'status', 'scheduled_date', 'completed_date', 'created_by', 
            'created_by_details', 'created_at', 'updated_at', 'quotation', 'quotation_details', 
            'invoice', 'invoice_details'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_quotation_details(self, obj):
        if obj.quotation:
            return {
                'id': obj.quotation.id,
                'number': obj.quotation.number,
                'total_amount': str(obj.quotation.total_amount)
            }
        return None
    
    def get_invoice_details(self, obj):
        if obj.invoice:
            return {
                'id': obj.invoice.id,
                'number': obj.invoice.number,
                'total_amount': str(obj.invoice.total_amount)
            }
        return None

class ClientAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_details = UserSerializer(source='uploaded_by', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ClientAttachment
        fields = [
            'id', 'client', 'name', 'description', 'file', 'file_url', 'file_type',
            'file_size', 'uploaded_by', 'uploaded_by_details', 'created_at'
        ]
        read_only_fields = ['id', 'file_type', 'file_size', 'created_at']
    
    def get_file_url(self, obj):
        if obj.file:
            return obj.file.url
        return None

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'

class QuotationItemSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    tax_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    tax_rate = serializers.DecimalField(max_digits=5, decimal_places=4, read_only=True)
    service_details = ServiceSerializer(source='service', read_only=True)

    class Meta:
        model = QuotationItem
        fields = ['id', 'service', 'service_details', 'quantity', 'price', 'description', 'tax_type', 'tax_rate', 'subtotal', 'tax_amount', 'total']
        read_only_fields = ['id', 'subtotal', 'tax_amount', 'total', 'tax_rate']

class QuotationSerializer(serializers.ModelSerializer):
    items = QuotationItemSerializer(many=True)
    total_amount = serializers.SerializerMethodField()
    subtotal_amount = serializers.SerializerMethodField()
    total_tax_amount = serializers.SerializerMethodField()
    formatted_total = serializers.SerializerMethodField()
    currency_symbol = serializers.SerializerMethodField()
    client_name = serializers.CharField(source='client.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    project_number = serializers.CharField(source='project.project_number', read_only=True)
    client_details = ClientSerializer(source='client', read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)
    currency_choices = serializers.SerializerMethodField()

    class Meta:
        model = Quotation
        fields = [
            'id', 'number', 'client', 'client_name', 'client_details', 'project', 'project_name', 
            'project_number', 'date', 'validity', 'status', 'currency', 'currency_symbol', 'currency_choices', 
            'purchase_requisition', 'notes', 'created_at', 'updated_at', 'created_by_details', 'items', 'total_amount', 
            'subtotal_amount', 'total_tax_amount', 'formatted_total'
        ]
        read_only_fields = ['id', 'number', 'created_at', 'updated_at', 'created_by_details']

    def get_total_amount(self, obj):
        return sum(item.total for item in obj.items.all())
    
    def get_subtotal_amount(self, obj):
        return sum(item.subtotal for item in obj.items.all())
    
    def get_total_tax_amount(self, obj):
        return sum(item.tax_amount for item in obj.items.all())
    
    def get_formatted_total(self, obj):
        return obj.formatted_total
    
    def get_currency_symbol(self, obj):
        return obj.currency_symbol
    
    def get_currency_choices(self, obj):
        from django.conf import settings
        return getattr(settings, 'CURRENCY_CHOICES', [('PKR', 'Pakistani Rupee', 'Rs')])

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        quotation = Quotation.objects.create(**validated_data)
        for item_data in items_data:
            QuotationItem.objects.create(quotation=quotation, **item_data)
        return quotation

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        
        # Update quotation fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Clear existing items and create new ones
        instance.items.all().delete()
        for item_data in items_data:
            QuotationItem.objects.create(quotation=instance, **item_data)
        
        return instance

class InvoiceItemSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    tax_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    tax_rate = serializers.DecimalField(max_digits=5, decimal_places=4, read_only=True)
    service_details = ServiceSerializer(source='service', read_only=True)

    class Meta:
        model = InvoiceItem
        fields = ['id', 'service', 'service_details', 'quantity', 'price', 'description', 'tax_type', 'tax_rate', 'subtotal', 'tax_amount', 'total']
        read_only_fields = ['id', 'subtotal', 'tax_amount', 'total', 'tax_rate']

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True)
    total_amount = serializers.SerializerMethodField()
    subtotal_amount = serializers.SerializerMethodField()
    total_tax_amount = serializers.SerializerMethodField()
    formatted_total = serializers.SerializerMethodField()
    currency_symbol = serializers.SerializerMethodField()
    client_name = serializers.CharField(source='client.name', read_only=True)
    project_name = serializers.CharField(source='project.name', read_only=True)
    project_number = serializers.CharField(source='project.project_number', read_only=True)
    client_details = ClientSerializer(source='client', read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)
    quotation_details = QuotationSerializer(source='quotation', read_only=True)
    currency_choices = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            'id', 'number', 'po_number', 'client', 'client_name', 'client_details', 'project', 'project_name', 
            'project_number', 'quotation', 'quotation_details', 'date', 'due_date', 'status', 
            'currency', 'currency_symbol', 'currency_choices', 'notes', 'created_at', 'updated_at', 
            'created_by', 'created_by_details', 'items', 'total_amount', 'subtotal_amount', 'total_tax_amount', 
            'formatted_total'
        ]
        read_only_fields = ['id', 'number', 'created_at', 'updated_at', 'created_by', 'created_by_details']

    def get_total_amount(self, obj):
        return sum(item.total for item in obj.items.all())
    
    def get_subtotal_amount(self, obj):
        return sum(item.subtotal for item in obj.items.all())
    
    def get_total_tax_amount(self, obj):
        return sum(item.tax_amount for item in obj.items.all())
    
    def get_formatted_total(self, obj):
        return obj.formatted_total
    
    def get_currency_symbol(self, obj):
        return obj.currency_symbol
    
    def get_currency_choices(self, obj):
        from django.conf import settings
        return getattr(settings, 'CURRENCY_CHOICES', [('PKR', 'Pakistani Rupee', 'Rs')])

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        invoice = Invoice.objects.create(**validated_data)
        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)
        return invoice

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        
        # Update invoice fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Clear existing items and create new ones
        instance.items.all().delete()
        for item_data in items_data:
            InvoiceItem.objects.create(invoice=instance, **item_data)
        
        return instance

class ActivityLogSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = ActivityLog
        fields = '__all__'
