"""
Management command to create sample financial data for BS Engineering System
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
import random

from api.models import Client, Quotation, Invoice
from api.financial_models import (
    FinancialAccount,
    FinancialActivity,
    FinancialAttachment,
    JournalEntry,
    JournalEntryLine,
    FinancialAuditLog,
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Create sample financial data for testing and demonstration'

    def add_arguments(self, parser):
        parser.add_argument(
            '--accounts',
            type=int,
            default=20,
            help='Number of financial accounts to create',
        )
        parser.add_argument(
            '--activities',
            type=int,
            default=50,
            help='Number of financial activities to create',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Creating sample financial data...'))
        
        # Create sample financial accounts
        self.create_financial_accounts(options['accounts'])
        
        # Create sample financial activities
        self.create_financial_activities(options['activities'])
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {options["accounts"]} accounts and {options["activities"]} activities'
            )
        )

    def create_financial_accounts(self, count):
        """Create sample financial accounts"""
        self.stdout.write('Creating financial accounts...')
        
        # Chart of Accounts structure
        accounts_data = [
            # Assets
            {'code': '1000', 'name': 'Assets', 'type': 'asset', 'parent': None},
            {'code': '1100', 'name': 'Current Assets', 'type': 'asset', 'parent': '1000'},
            {'code': '1110', 'name': 'Cash and Cash Equivalents', 'type': 'asset', 'parent': '1100'},
            {'code': '1120', 'name': 'Accounts Receivable', 'type': 'asset', 'parent': '1100'},
            {'code': '1130', 'name': 'Inventory', 'type': 'asset', 'parent': '1100'},
            {'code': '1200', 'name': 'Fixed Assets', 'type': 'asset', 'parent': '1000'},
            {'code': '1210', 'name': 'Equipment', 'type': 'asset', 'parent': '1200'},
            {'code': '1220', 'name': 'Furniture and Fixtures', 'type': 'asset', 'parent': '1200'},
            
            # Liabilities
            {'code': '2000', 'name': 'Liabilities', 'type': 'liability', 'parent': None},
            {'code': '2100', 'name': 'Current Liabilities', 'type': 'liability', 'parent': '2000'},
            {'code': '2110', 'name': 'Accounts Payable', 'type': 'liability', 'parent': '2100'},
            {'code': '2120', 'name': 'Accrued Expenses', 'type': 'liability', 'parent': '2100'},
            {'code': '2130', 'name': 'Short-term Loans', 'type': 'liability', 'parent': '2100'},
            
            # Equity
            {'code': '3000', 'name': 'Equity', 'type': 'equity', 'parent': None},
            {'code': '3100', 'name': 'Owner\'s Equity', 'type': 'equity', 'parent': '3000'},
            {'code': '3200', 'name': 'Retained Earnings', 'type': 'equity', 'parent': '3000'},
            
            # Revenue
            {'code': '4000', 'name': 'Revenue', 'type': 'revenue', 'parent': None},
            {'code': '4100', 'name': 'Service Revenue', 'type': 'revenue', 'parent': '4000'},
            {'code': '4200', 'name': 'Project Revenue', 'type': 'revenue', 'parent': '4000'},
            
            # Expenses
            {'code': '5000', 'name': 'Expenses', 'type': 'expense', 'parent': None},
            {'code': '5100', 'name': 'Operating Expenses', 'type': 'expense', 'parent': '5000'},
            {'code': '5110', 'name': 'Office Rent', 'type': 'expense', 'parent': '5100'},
            {'code': '5120', 'name': 'Utilities', 'type': 'expense', 'parent': '5100'},
            {'code': '5130', 'name': 'Software Subscriptions', 'type': 'expense', 'parent': '5100'},
            {'code': '5140', 'name': 'Travel and Transportation', 'type': 'expense', 'parent': '5100'},
            {'code': '5150', 'name': 'Marketing and Advertising', 'type': 'expense', 'parent': '5100'},
            {'code': '5160', 'name': 'Professional Services', 'type': 'expense', 'parent': '5100'},
            {'code': '5200', 'name': 'Personnel Expenses', 'type': 'expense', 'parent': '5000'},
            {'code': '5210', 'name': 'Salaries and Wages', 'type': 'expense', 'parent': '5200'},
            {'code': '5220', 'name': 'Employee Benefits', 'type': 'expense', 'parent': '5200'},
        ]
        
        # Create accounts hierarchy
        created_accounts = {}
        for account_data in accounts_data:
            parent = None
            if account_data['parent']:
                parent = created_accounts.get(account_data['parent'])
            
            account, created = FinancialAccount.objects.get_or_create(
                code=account_data['code'],
                defaults={
                    'name': account_data['name'],
                    'account_type': account_data['type'],
                    'parent': parent,
                    'description': f"Sample account for {account_data['name']}",
                }
            )
            created_accounts[account_data['code']] = account
            
            if created:
                self.stdout.write(f'  Created account: {account.code} - {account.name}')

    def create_financial_activities(self, count):
        """Create sample financial activities"""
        self.stdout.write('Creating financial activities...')
        
        # Get required data
        clients = list(Client.objects.all())
        quotations = list(Quotation.objects.all())
        invoices = list(Invoice.objects.all())
        users = list(User.objects.all())
        accounts = list(FinancialAccount.objects.filter(children__isnull=True))  # Leaf accounts only
        
        if not clients or not users or not accounts:
            self.stdout.write(
                self.style.WARNING(
                    'Please create clients, users, and financial accounts first'
                )
            )
            return
        
        activity_types = ['receivable', 'payable', 'expense', 'income']
        payment_methods = ['cash', 'bank_transfer', 'check', 'credit_card', 'digital_wallet']
        statuses = ['pending', 'approved', 'rejected', 'paid']
        
        # Common vendor names for expenses
        vendors = [
            'Office Depot', 'Microsoft', 'Adobe', 'Google Workspace', 'Amazon',
            'Zoom', 'Slack', 'GitHub', 'DigitalOcean', 'AWS',
            'PakistanTelecom', 'K-Electric', 'Shell', 'Toyota Motors',
            'Ahmad Legal Services', 'Khan & Associates', 'Elite Marketing',
        ]
        
        for i in range(count):
            activity_type = random.choice(activity_types)
            client = random.choice(clients)
            account = random.choice(accounts)
            user = random.choice(users)
            
            # Generate realistic amounts based on activity type
            if activity_type == 'receivable':
                amount = Decimal(random.uniform(10000, 500000))
                description = f"Payment due for services provided to {client.name}"
                bill_to = ""
            elif activity_type == 'payable':
                amount = Decimal(random.uniform(5000, 100000))
                vendor = random.choice(vendors)
                description = f"Outstanding payment to {vendor}"
                bill_to = vendor
            elif activity_type == 'expense':
                amount = Decimal(random.uniform(1000, 50000))
                vendor = random.choice(vendors)
                description = f"Business expense - {account.name}"
                bill_to = vendor
            else:  # income
                amount = Decimal(random.uniform(20000, 1000000))
                description = f"Income from client project - {client.name}"
                bill_to = ""
            
            # Generate dates
            transaction_date = timezone.now().date() - timedelta(days=random.randint(0, 180))
            due_date = None
            if activity_type in ['receivable', 'payable']:
                due_date = transaction_date + timedelta(days=random.randint(15, 90))
            
            # Create activity
            activity = FinancialActivity.objects.create(
                activity_type=activity_type,
                amount=amount,
                currency='PKR',
                client=client,
                account=account,
                description=description,
                bill_to=bill_to,
                payment_method=random.choice(payment_methods),
                status=random.choice(statuses),
                transaction_date=transaction_date,
                due_date=due_date,
                notes=f"Sample activity created for testing purposes",
                created_by=user,
            )
            
            # Link to quotations/invoices occasionally
            if random.random() < 0.3 and quotations:
                activity.project_quotation = random.choice(quotations)
                activity.save()
            elif random.random() < 0.2 and invoices:
                activity.project_invoice = random.choice(invoices)
                activity.save()
            
            # Approve some activities
            if activity.status == 'pending' and random.random() < 0.7:
                approver = random.choice([u for u in users if u.role in ['admin', 'accountant']])
                if approver:
                    activity.status = 'approved'
                    activity.approved_by = approver
                    activity.approved_at = timezone.now()
                    activity.save()
            
            # Create audit log for creation
            FinancialAuditLog.objects.create(
                user=user,
                action='create',
                content_type='financial_activity',
                object_id=activity.id,
                object_representation=str(activity),
                description=f"Created financial activity: {activity.reference_number}",
                ip_address='127.0.0.1',
                user_agent='Sample Data Generator'
            )
            
            if i % 10 == 0:
                self.stdout.write(f'  Created {i+1} activities...')
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {count} financial activities')
        )
