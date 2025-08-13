"""
Project Management Views for BS Engineering System
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Sum, Count, Avg, F
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.conf import settings
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .project_models import (
    Project, 
    ProjectAssignment, 
    ProjectAttachment, 
    ProjectMilestone, 
    ProjectNote,
    ProjectExpenseCategory,
    ProjectExpense
)
from .project_serializers import (
    ProjectListSerializer,
    ProjectDetailSerializer,
    ProjectCreateUpdateSerializer,
    ProjectDashboardSerializer,
    ProjectAssignmentSerializer,
    ProjectAttachmentSerializer,
    ProjectMilestoneSerializer,
    ProjectNoteSerializer,
    ProjectFinancialSummarySerializer,
    ProjectExpenseCategorySerializer,
    ProjectExpenseSerializer,
    ProjectExpenseListSerializer,
    ProjectExpenseSummarySerializer
)
from .permissions import RoleBasedPermission
from .financial_models import FinancialActivity
from .models import Quotation, Invoice
from decimal import Decimal


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing projects with comprehensive project management features
    """
    queryset = Project.objects.all()
    permission_classes = [permissions.IsAuthenticated, RoleBasedPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'project_type', 'client', 'project_manager']
    search_fields = ['name', 'project_number', 'description', 'location']
    ordering_fields = ['name', 'start_date', 'end_date', 'created_at', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filter projects based on user role and permissions"""
        user = self.request.user
        queryset = Project.objects.select_related('client', 'project_manager', 'created_by')
        
        # Role-based filtering
        if user.role == 'admin':
            return queryset  # Admin can see all projects
        elif user.role in ['sales', 'accountant']:
            return queryset  # Sales and accountants can see all projects
        else:
            # Viewers and other roles can only see projects they're assigned to
            return queryset.filter(
                Q(assigned_users=user) | Q(project_manager=user) | Q(created_by=user)
            ).distinct()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return ProjectListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProjectCreateUpdateSerializer
        elif self.action == 'dashboard':
            return ProjectDashboardSerializer
        else:
            return ProjectDetailSerializer
    
    def perform_create(self, serializer):
        """Set the current user as the creator and handle validation"""
        try:
            serializer.save(created_by=self.request.user)
        except Exception as e:
            print(f"Error creating project: {e}")
            print(f"Validation errors: {serializer.errors}")
            raise
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get projects formatted for dashboard view"""
        projects = self.filter_queryset(self.get_queryset())[:10]  # Limit to 10 for dashboard
        serializer = ProjectDashboardSerializer(projects, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'], url_path='dashboard')
    def project_dashboard(self, request, pk=None):
        """Get detailed dashboard for a specific project"""
        project = self.get_object()
        
        # Get related data
        try:
            # Get financial activities
            recent_activities = project.financial_activities.all().order_by('-transaction_date')[:10]
            
            # Get team members (ProjectAssignment has no related_name, so use default)
            team_members = project.projectassignment_set.filter(is_active=True).select_related('user')
            
            # Get milestones
            milestones = project.milestones.all().order_by('due_date')[:10]
            
            # Calculate analytics
            total_expenses = project.financial_activities.filter(
                activity_type='expense'
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            total_payments = project.financial_activities.filter(
                activity_type__in=['payment', 'income']
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            outstanding_balance = project.budget - total_expenses if project.budget else 0
            profitability = total_payments - total_expenses
            
            dashboard_data = {
                'project': {
                    'id': project.id,
                    'name': project.name,
                    'project_number': project.project_number,
                    'description': project.description,
                    'client': project.client.id,
                    'client_name': project.client.name,
                    'status': project.status,
                    'priority': project.priority,
                    'start_date': project.start_date,
                    'end_date': project.end_date,
                    'budget': str(project.budget) if project.budget else '0',
                    'currency': project.currency,
                    'project_manager': project.project_manager.id if project.project_manager else None,
                    'project_manager_name': project.project_manager.username if project.project_manager else None,
                    'created_by': project.created_by.id if project.created_by else None,
                    'created_by_name': project.created_by.username if project.created_by else None,
                    'created_at': project.created_at,
                    'updated_at': project.updated_at,
                },
                'analytics': {
                    'total_expenses': str(total_expenses),
                    'total_payments': str(total_payments),
                    'outstanding_balance': str(outstanding_balance),
                    'profitability': str(profitability),
                    'expense_breakdown': [],
                    'payment_timeline': []
                },
                'recent_activities': [
                    {
                        'id': activity.id,
                        'activity_type': activity.activity_type,
                        'amount': str(activity.amount),
                        'description': activity.description,
                        'date': activity.transaction_date.isoformat()
                    } for activity in recent_activities
                ],
                'team_members': [
                    {
                        'id': assignment.id,
                        'user_name': assignment.user.username,
                        'role': assignment.role,
                        'assigned_date': assignment.assigned_date.isoformat()
                    } for assignment in team_members
                ],
                'milestones': [
                    {
                        'id': milestone.id,
                        'title': milestone.title,
                        'due_date': milestone.due_date.isoformat(),
                        'status': milestone.status,
                        'completion_percentage': milestone.completion_percentage
                    } for milestone in milestones
                ]
            }
            
            return Response(dashboard_data)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to fetch dashboard data: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def financial_summary(self, request, pk=None):
        """Get detailed financial summary for a project"""
        project = self.get_object()
        
        # Get financial data
        quotations = project.quotations.all()
        invoices = project.invoices.all()
        expenses = project.financial_activities.filter(activity_type='expense')
        
        # Calculate totals
        total_quotations = sum(q.total_amount for q in quotations)
        total_invoices = sum(i.total_amount for i in invoices)
        total_expenses = sum(e.amount for e in expenses)
        total_revenue = sum(i.total_amount for i in invoices.filter(status='paid'))
        profitability = total_revenue - total_expenses
        
        # Calculate percentages
        profit_margin = (profitability / total_revenue * 100) if total_revenue > 0 else 0
        budget_utilization = ((total_expenses / project.estimated_budget) * 100) if project.estimated_budget else 0
        
        summary_data = {
            'project_id': project.id,
            'project_name': project.name,
            'project_number': project.project_number,
            'total_quotations': total_quotations,
            'total_invoices': total_invoices,
            'total_expenses': total_expenses,
            'total_revenue': total_revenue,
            'profitability': profitability,
            'quotations_count': quotations.count(),
            'invoices_count': invoices.count(),
            'expenses_count': expenses.count(),
            'profit_margin': profit_margin,
            'budget_utilization': budget_utilization,
        }
        
        serializer = ProjectFinancialSummarySerializer(summary_data)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def quotations(self, request, pk=None):
        """Get quotations for a specific project"""
        project = self.get_object()
        quotations = project.quotations.all()
        
        # Import here to avoid circular imports
        from .serializers import QuotationSerializer
        serializer = QuotationSerializer(quotations, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def invoices(self, request, pk=None):
        """Get invoices for a specific project"""
        project = self.get_object()
        invoices = project.invoices.all()
        
        # Import here to avoid circular imports
        from .serializers import InvoiceSerializer
        serializer = InvoiceSerializer(invoices, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def financial_activities(self, request, pk=None):
        """Get financial activities for a specific project"""
        project = self.get_object()
        activities = project.financial_activities.all()
        
        from .financial_serializers import FinancialActivitySerializer
        serializer = FinancialActivitySerializer(activities, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get', 'post'])
    def team(self, request, pk=None):
        """Manage project team assignments"""
        project = self.get_object()
        
        if request.method == 'GET':
            assignments = ProjectAssignment.objects.filter(project=project, is_active=True)
            serializer = ProjectAssignmentSerializer(assignments, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            data = request.data.copy()
            data['project'] = project.id
            data['assigned_by'] = request.user.id
            
            serializer = ProjectAssignmentSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update project status"""
        project = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in dict(Project.STATUS_CHOICES):
            project.status = new_status
            
            # Auto-set completion date when marked as completed
            if new_status == 'completed':
                project.actual_completion_date = timezone.now().date()
            
            project.save()
            serializer = self.get_serializer(project)
            return Response(serializer.data)
        
        return Response(
            {'error': 'Invalid status'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['get', 'post'])
    def expenses(self, request, pk=None):
        """Manage project expenses"""
        project = self.get_object()
        
        if request.method == 'GET':
            # Get query parameters for filtering
            category = request.query_params.get('category')
            status_filter = request.query_params.get('status')
            date_from = request.query_params.get('date_from')
            date_to = request.query_params.get('date_to')
            
            # Build queryset
            expenses = project.expenses.all()
            
            if category:
                expenses = expenses.filter(category_id=category)
            if status_filter:
                expenses = expenses.filter(status=status_filter)
            if date_from:
                expenses = expenses.filter(expense_date__gte=date_from)
            if date_to:
                expenses = expenses.filter(expense_date__lte=date_to)
            
            # Order by expense date (newest first)
            expenses = expenses.order_by('-expense_date', '-created_at')
            
            # Paginate if needed
            page = self.paginate_queryset(expenses)
            if page is not None:
                serializer = ProjectExpenseListSerializer(page, many=True, context={'request': request})
                return self.get_paginated_response(serializer.data)
            
            serializer = ProjectExpenseListSerializer(expenses, many=True, context={'request': request})
            return Response(serializer.data)
        
        elif request.method == 'POST':
            # Create new expense
            data = request.data.copy()
            data['project'] = project.id
            
            serializer = ProjectExpenseSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                serializer.save(created_by=request.user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def expense_summary(self, request, pk=None):
        """Get expense summary for a project"""
        project = self.get_object()
        
        # Calculate totals
        expenses = project.expenses.all()
        total_expenses = expenses.aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        pending_expenses = expenses.filter(status='pending').aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        # Category breakdown
        category_breakdown = expenses.filter(status__in=['approved', 'paid']).values(
            'category__name'
        ).annotate(
            total=Sum('total_amount'),
            count=Count('id')
        ).order_by('-total')
        
        # Recent expenses
        recent_expenses = expenses.order_by('-created_at')[:5]
        
        return Response({
            'project_id': project.id,
            'project_name': project.name,
            'total_expenses': float(total_expenses),
            'pending_expenses': float(pending_expenses),
            'expenses_count': expenses.count(),
            'category_breakdown': list(category_breakdown),
            'recent_expenses': ProjectExpenseListSerializer(recent_expenses, many=True).data,
            'currency': project.currency,
        })
    
    @action(detail=True, methods=['get'])
    def expense_categories(self, request, pk=None):
        """Get expense categories with project-specific totals"""
        project = self.get_object()
        categories = ProjectExpenseCategory.objects.filter(is_active=True)
        
        serializer = ProjectExpenseCategorySerializer(
            categories, 
            many=True, 
            context={'request': request, 'project': project}
        )
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def from_quotation(self, request):
        """Create a project from an approved quotation"""
        quotation_id = request.data.get('quotation_id')
        
        if not quotation_id:
            return Response(
                {'error': 'quotation_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            quotation = get_object_or_404(Quotation, id=quotation_id, status='approved')
        except Quotation.DoesNotExist:
            return Response(
                {'error': 'Approved quotation not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if quotation already has a project
        if quotation.project:
            return Response(
                {'error': 'A project already exists for this quotation', 'project_id': quotation.project.id}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate project number
        from .models import NumberSequence
        project_number = NumberSequence.get_next_number('project', timezone.now().date())
        
        # Create project from quotation
        project_data = {
            'name': f"Project for {quotation.client.name} - {quotation.number}",
            'project_number': project_number,
            'client': quotation.client.id,
            'description': quotation.description or f"Project created from quotation {quotation.number}",
            'start_date': timezone.now().date(),
            'project_type': 'service',  # Default type, can be customized
            'status': 'planning',
            'priority': 'medium',
            'budget': str(quotation.total_amount) if hasattr(quotation, 'total_amount') else '0',
            'currency': quotation.currency,
            'project_manager': request.user.id,
            'created_by': request.user.id
        }
        
        # Create project using serializer
        serializer = ProjectCreateUpdateSerializer(data=project_data, context={'request': request})
        if serializer.is_valid():
            project = serializer.save(created_by=request.user)
            
            # Link quotation to project
            quotation.project = project
            quotation.save()
            
            # Log activity
            from .models import ActivityLog
            ActivityLog.objects.create(
                user=request.user,
                action='create_from_quotation',
                content_type='project',
                object_id=project.id,
                description=f'Created project {project.project_number} from quotation {quotation.number}'
            )
            
            # Return project details
            project_serializer = ProjectDetailSerializer(project, context={'request': request})
            return Response(project_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProjectAssignmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing project team assignments"""
    queryset = ProjectAssignment.objects.all()
    serializer_class = ProjectAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated, RoleBasedPermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['project', 'user', 'role', 'is_active']
    
    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)


class ProjectAttachmentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing project attachments"""
    queryset = ProjectAttachment.objects.all()
    serializer_class = ProjectAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated, RoleBasedPermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['project', 'attachment_type']
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class ProjectMilestoneViewSet(viewsets.ModelViewSet):
    """ViewSet for managing project milestones"""
    queryset = ProjectMilestone.objects.all()
    serializer_class = ProjectMilestoneSerializer
    permission_classes = [permissions.IsAuthenticated, RoleBasedPermission]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['project', 'status', 'assigned_to']
    ordering_fields = ['due_date', 'order', 'created_at']
    ordering = ['order', 'due_date']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ProjectNoteViewSet(viewsets.ModelViewSet):
    """ViewSet for managing project notes"""
    queryset = ProjectNote.objects.all()
    serializer_class = ProjectNoteSerializer
    permission_classes = [permissions.IsAuthenticated, RoleBasedPermission]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['project', 'is_important']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ProjectAnalyticsViewSet(viewsets.ViewSet):
    """ViewSet for project analytics and reporting"""
    permission_classes = [permissions.IsAuthenticated, RoleBasedPermission]
    
    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Get overall project analytics"""
        user = request.user
        
        # Get base queryset based on user permissions
        if user.role == 'admin':
            projects = Project.objects.all()
        elif user.role in ['sales', 'accountant']:
            projects = Project.objects.all()
        else:
            projects = Project.objects.filter(
                Q(assigned_users=user) | Q(project_manager=user) | Q(created_by=user)
            ).distinct()
        
        # Calculate statistics
        total_projects = projects.count()
        active_projects = projects.filter(status='in_progress').count()
        completed_projects = projects.filter(status='completed').count()
        overdue_projects = projects.filter(
            end_date__lt=timezone.now().date(),
            status__in=['planned', 'in_progress']
        ).count()
        
        # Financial statistics
        total_budget = projects.aggregate(
            total=Sum('estimated_budget')
        )['total'] or 0
        
        total_expenses = FinancialActivity.objects.filter(
            project__in=projects,
            activity_type='expense'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        total_revenue = projects.aggregate(
            revenue=Sum('invoices__total_amount', filter=Q(invoices__status='paid'))
        )['revenue'] or 0
        
        # Project type distribution
        project_types = projects.values('project_type').annotate(
            count=Count('id'),
            total_budget=Sum('estimated_budget')
        ).order_by('-count')
        
        # Status distribution
        status_distribution = projects.values('status').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return Response({
            'summary': {
                'total_projects': total_projects,
                'active_projects': active_projects,
                'completed_projects': completed_projects,
                'overdue_projects': overdue_projects,
                'total_budget': float(total_budget),
                'total_expenses': float(total_expenses),
                'total_revenue': float(total_revenue),
                'profitability': float(total_revenue - total_expenses),
            },
            'project_types': list(project_types),
            'status_distribution': list(status_distribution),
        })
    
    @action(detail=False, methods=['get'])
    def financial_performance(self, request):
        """Get financial performance analytics across projects"""
        user = request.user
        
        # Get base queryset based on user permissions
        if user.role == 'admin':
            projects = Project.objects.all()
        elif user.role in ['sales', 'accountant']:
            projects = Project.objects.all()
        else:
            projects = Project.objects.filter(
                Q(assigned_users=user) | Q(project_manager=user) | Q(created_by=user)
            ).distinct()
        
        project_performance = []
        
        for project in projects:
            quotations_total = project.quotations.aggregate(
                total=Sum('items__total')
            )['total'] or 0
            
            invoices_total = project.invoices.aggregate(
                total=Sum('items__total')
            )['total'] or 0
            
            expenses_total = project.financial_activities.filter(
                activity_type='expense'
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            revenue_total = project.invoices.filter(
                status='paid'
            ).aggregate(total=Sum('items__total'))['total'] or 0
            
            profitability = revenue_total - expenses_total
            profit_margin = (profitability / revenue_total * 100) if revenue_total > 0 else 0
            
            project_performance.append({
                'project_id': project.id,
                'project_name': project.name,
                'project_number': project.project_number,
                'quotations_total': float(quotations_total),
                'invoices_total': float(invoices_total),
                'expenses_total': float(expenses_total),
                'revenue_total': float(revenue_total),
                'profitability': float(profitability),
                'profit_margin': float(profit_margin),
                'status': project.status,
            })
        
        # Sort by profitability
        project_performance.sort(key=lambda x: x['profitability'], reverse=True)
        
        return Response({
            'projects': project_performance,
            'summary': {
                'total_quotations': sum(p['quotations_total'] for p in project_performance),
                'total_invoices': sum(p['invoices_total'] for p in project_performance),
                'total_expenses': sum(p['expenses_total'] for p in project_performance),
                'total_revenue': sum(p['revenue_total'] for p in project_performance),
                'total_profitability': sum(p['profitability'] for p in project_performance),
                'average_profit_margin': sum(p['profit_margin'] for p in project_performance) / len(project_performance) if project_performance else 0,
            }
        })


class ProjectExpenseCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing project expense categories"""
    queryset = ProjectExpenseCategory.objects.filter(is_active=True)
    serializer_class = ProjectExpenseCategorySerializer
    permission_classes = [permissions.IsAuthenticated, RoleBasedPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_predefined', 'parent_category']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['post'])
    def create_defaults(self, request):
        """Create default expense categories"""
        created_categories = ProjectExpenseCategory.get_default_categories()
        serializer = self.get_serializer(created_categories, many=True)
        return Response({
            'message': f'Created {len(created_categories)} default categories',
            'categories': serializer.data
        }, status=status.HTTP_201_CREATED)


class ProjectExpenseViewSet(viewsets.ModelViewSet):
    """ViewSet for managing project expenses"""
    queryset = ProjectExpense.objects.all()
    permission_classes = [permissions.IsAuthenticated, RoleBasedPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['project', 'category', 'status', 'payment_method', 'created_by']
    search_fields = ['description', 'subcategory', 'vendor_name', 'invoice_reference', 'expense_number']
    ordering_fields = ['expense_date', 'amount', 'total_amount', 'created_at']
    ordering = ['-expense_date', '-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProjectExpenseListSerializer
        return ProjectExpenseSerializer
    
    def get_queryset(self):
        """Filter expenses based on user permissions and project access"""
        user = self.request.user
        queryset = ProjectExpense.objects.all()
        
        # Filter by project if specified
        project_id = self.request.query_params.get('project')
        if project_id:
            queryset = queryset.filter(project_id=project_id)
        
        # Apply user-based filtering
        if user.role not in ['admin', 'accountant']:
            # Users can only see expenses from projects they're associated with
            accessible_projects = Project.objects.filter(
                Q(assigned_users=user) | Q(project_manager=user) | Q(created_by=user)
            ).distinct()
            queryset = queryset.filter(project__in=accessible_projects)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve an expense"""
        expense = self.get_object()
        
        # Check if user has permission to approve
        if request.user.role not in ['admin', 'accountant']:
            return Response(
                {'error': 'You do not have permission to approve expenses'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if expense.status != 'pending':
            return Response(
                {'error': f'Cannot approve expense with status: {expense.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        expense.approve(request.user)
        serializer = self.get_serializer(expense)
        return Response({
            'message': 'Expense approved successfully',
            'expense': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject an expense"""
        expense = self.get_object()
        
        # Check if user has permission to reject
        if request.user.role not in ['admin', 'accountant']:
            return Response(
                {'error': 'You do not have permission to reject expenses'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if expense.status != 'pending':
            return Response(
                {'error': f'Cannot reject expense with status: {expense.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        expense.reject()
        serializer = self.get_serializer(expense)
        return Response({
            'message': 'Expense rejected',
            'expense': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark an expense as paid"""
        expense = self.get_object()
        payment_date = request.data.get('payment_date')
        
        # Check if user has permission
        if request.user.role not in ['admin', 'accountant']:
            return Response(
                {'error': 'You do not have permission to mark expenses as paid'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if expense.status != 'approved':
            return Response(
                {'error': 'Only approved expenses can be marked as paid'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            if payment_date:
                from datetime import datetime
                payment_date = datetime.strptime(payment_date, '%Y-%m-%d').date()
            expense.mark_as_paid(payment_date)
            
            serializer = self.get_serializer(expense)
            return Response({
                'message': 'Expense marked as paid',
                'expense': serializer.data
            })
        except ValueError:
            return Response(
                {'error': 'Invalid payment date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get expense summary for a project or all projects"""
        project_id = request.query_params.get('project')
        
        if project_id:
            try:
                project = Project.objects.get(id=project_id)
                
                # Check access permissions
                user = request.user
                if user.role not in ['admin', 'accountant']:
                    accessible_projects = Project.objects.filter(
                        Q(assigned_users=user) | Q(project_manager=user) | Q(created_by=user)
                    ).distinct()
                    if project not in accessible_projects:
                        return Response(
                            {'error': 'You do not have access to this project'},
                            status=status.HTTP_403_FORBIDDEN
                        )
                
                # Get expenses for the project
                expenses = project.expenses.all()
                
                # Calculate totals
                total_expenses = expenses.aggregate(
                    total=Sum('total_amount')
                )['total'] or 0
                
                total_pending = expenses.filter(status='pending').aggregate(
                    total=Sum('total_amount')
                )['total'] or 0
                
                total_approved = expenses.filter(status='approved').aggregate(
                    total=Sum('total_amount')
                )['total'] or 0
                
                total_paid = expenses.filter(status='paid').aggregate(
                    total=Sum('total_amount')
                )['total'] or 0
                
                # Get category breakdown
                expenses_by_category = expenses.filter(status__in=['approved', 'paid']).values(
                    'category__name'
                ).annotate(
                    total=Sum('total_amount'),
                    count=Count('id')
                ).order_by('-total')
                
                # Get top categories
                top_categories = list(expenses_by_category[:5])
                
                # Get recent expenses
                recent_expenses = expenses.order_by('-created_at')[:10]
                
                # Get currency info
                currency = project.currency
                currency_symbol = next(
                    (symbol for code, name, symbol in getattr(settings, 'CURRENCY_CHOICES', []) if code == currency),
                    currency
                )
                
                summary_data = {
                    'project_id': project.id,
                    'project_name': project.name,
                    'total_expenses': total_expenses,
                    'total_pending': total_pending,
                    'total_approved': total_approved,
                    'total_paid': total_paid,
                    'expenses_count': expenses.count(),
                    'pending_count': expenses.filter(status='pending').count(),
                    'approved_count': expenses.filter(status='approved').count(),
                    'paid_count': expenses.filter(status='paid').count(),
                    'expenses_by_category': list(expenses_by_category),
                    'top_categories': top_categories,
                    'recent_expenses': ProjectExpenseListSerializer(recent_expenses, many=True).data,
                    'currency': currency,
                    'currency_symbol': currency_symbol,
                }
                
                serializer = ProjectExpenseSummarySerializer(summary_data)
                return Response(serializer.data)
                
            except Project.DoesNotExist:
                return Response(
                    {'error': 'Project not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            return Response(
                {'error': 'Project ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """Get expense analytics across projects"""
        user = request.user
        
        # Get accessible projects based on user role
        if user.role in ['admin', 'accountant']:
            projects = Project.objects.all()
        else:
            projects = Project.objects.filter(
                Q(assigned_users=user) | Q(project_manager=user) | Q(created_by=user)
            ).distinct()
        
        # Get all expenses from accessible projects
        expenses = ProjectExpense.objects.filter(project__in=projects)
        
        # Calculate overall statistics
        total_expenses = expenses.aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        pending_expenses = expenses.filter(status='pending').aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        # Expenses by category across all projects
        category_breakdown = expenses.filter(status__in=['approved', 'paid']).values(
            'category__name'
        ).annotate(
            total=Sum('total_amount'),
            count=Count('id')
        ).order_by('-total')
        
        # Monthly expense trend (last 12 months)
        from datetime import datetime, timedelta
        twelve_months_ago = datetime.now().date() - timedelta(days=365)
        
        monthly_expenses = expenses.filter(
            expense_date__gte=twelve_months_ago,
            status__in=['approved', 'paid']
        ).extra(
            select={'month': 'strftime("%%Y-%%m", expense_date)'}
        ).values('month').annotate(
            total=Sum('total_amount'),
            count=Count('id')
        ).order_by('month')
        
        # Top spending projects
        project_expenses = expenses.filter(status__in=['approved', 'paid']).values(
            'project__name', 'project__project_number'
        ).annotate(
            total=Sum('total_amount'),
            count=Count('id')
        ).order_by('-total')[:10]
        
        return Response({
            'summary': {
                'total_expenses': float(total_expenses),
                'pending_expenses': float(pending_expenses),
                'total_projects': projects.count(),
                'expenses_count': expenses.count(),
            },
            'category_breakdown': list(category_breakdown),
            'monthly_trend': list(monthly_expenses),
            'top_projects': list(project_expenses),
        })
