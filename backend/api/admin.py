from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Client, Service, Quotation, QuotationItem, Invoice, InvoiceItem, 
    ActivityLog, NumberSequence, Interaction, ClientAttachment
)

@admin.register(NumberSequence)
class NumberSequenceAdmin(admin.ModelAdmin):
    list_display = ('document_type', 'year', 'month', 'last_number', 'updated_at')
    list_filter = ('document_type', 'year', 'month')
    search_fields = ('document_type',)
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-year', '-month', 'document_type')

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined')
    list_filter = ('role', 'is_active', 'is_staff', 'is_superuser', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role Information', {'fields': ('role',)}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Role Information', {'fields': ('role',)}),
    )

# Client Admin with Interactions
class InteractionInline(admin.TabularInline):
    model = Interaction
    extra = 0
    readonly_fields = ('created_at',)
    fields = ('interaction_type', 'direction', 'subject', 'amount', 'status', 'created_by', 'created_at')

class ClientAttachmentInline(admin.TabularInline):
    model = ClientAttachment
    extra = 0
    readonly_fields = ('created_at', 'file_size', 'file_type')
    fields = ('name', 'file', 'description', 'uploaded_by', 'created_at')

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('name', 'company', 'email', 'status', 'assigned_to', 'total_quotations', 'total_invoices', 'last_interaction_date')
    list_filter = ('status', 'industry', 'assigned_to', 'created_at')
    search_fields = ('name', 'company', 'email', 'tags')
    readonly_fields = ('total_quotations', 'total_invoices', 'total_amount_quoted', 'total_amount_invoiced', 'last_interaction_date', 'created_at', 'updated_at')
    inlines = [InteractionInline, ClientAttachmentInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'company', 'email', 'phone', 'address')
        }),
        ('Business Details', {
            'fields': ('status', 'industry', 'website', 'source', 'assigned_to')
        }),
        ('Additional Information', {
            'fields': ('tags', 'notes')
        }),
        ('Statistics', {
            'fields': ('total_quotations', 'total_invoices', 'total_amount_quoted', 'total_amount_invoiced', 'last_interaction_date'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')

class QuotationItemInline(admin.TabularInline):
    model = QuotationItem
    extra = 1

@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):
    list_display = ('number', 'client', 'date', 'validity', 'created_by', 'created_at')
    list_filter = ('date', 'created_at', 'created_by')
    search_fields = ('number', 'client__name', 'notes')
    readonly_fields = ('number', 'created_at', 'updated_at')
    inlines = [QuotationItemInline]
    
    def save_model(self, request, obj, form, change):
        if not change:  # If creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('number', 'client', 'date', 'due_date', 'status', 'created_by', 'created_at')
    list_filter = ('status', 'date', 'due_date', 'created_at', 'created_by')
    search_fields = ('number', 'client__name', 'notes')
    readonly_fields = ('number', 'created_at', 'updated_at')
    inlines = [InvoiceItemInline]
    
    def save_model(self, request, obj, form, change):
        if not change:  # If creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'content_type', 'object_id', 'created_at')
    list_filter = ('action', 'content_type', 'created_at', 'user')
    search_fields = ('description', 'user__username')
    readonly_fields = ('created_at',)
    
    def has_add_permission(self, request):
        return False  # Prevent manual creation of activity logs
    
    def has_change_permission(self, request, obj=None):
        return False  # Prevent editing of activity logs

@admin.register(Interaction)
class InteractionAdmin(admin.ModelAdmin):
    list_display = ('client', 'interaction_type', 'direction', 'subject', 'amount', 'status', 'created_by', 'created_at')
    list_filter = ('interaction_type', 'direction', 'status', 'created_at', 'created_by')
    search_fields = ('client__name', 'subject', 'description', 'reference_number')
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('client', 'interaction_type', 'direction', 'subject', 'description')
        }),
        ('Details', {
            'fields': ('reference_number', 'amount', 'status', 'scheduled_date', 'completed_date')
        }),
        ('Related Documents', {
            'fields': ('quotation', 'invoice'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(ClientAttachment)
class ClientAttachmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'client', 'file_type', 'file_size', 'uploaded_by', 'created_at')
    list_filter = ('file_type', 'created_at', 'uploaded_by')
    search_fields = ('name', 'description', 'client__name')
    readonly_fields = ('file_type', 'file_size', 'created_at')

# Customize admin site
admin.site.site_header = 'BS Engineering Administration'
admin.site.site_title = 'BS Engineering Admin'
admin.site.index_title = 'Welcome to BS Engineering Administration'
