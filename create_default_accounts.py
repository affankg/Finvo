#!/usr/bin/env python3
"""
Quick script to create default financial accounts via Django management command
"""

import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bs_engineering_backend.settings')
django.setup()

from api.financial_models import FinancialAccount

def create_default_accounts():
    """Create default financial accounts if none exist"""
    if FinancialAccount.objects.exists():
        print("Financial accounts already exist. Skipping creation.")
        return
    
    print("Creating default financial accounts...")
    
    # Chart of Accounts structure
    accounts_data = [
        # Assets
        {'code': '1000', 'name': 'Assets', 'type': 'asset', 'parent': None},
        {'code': '1100', 'name': 'Current Assets', 'type': 'asset', 'parent': '1000'},
        {'code': '1110', 'name': 'Cash and Cash Equivalents', 'type': 'asset', 'parent': '1100'},
        {'code': '1120', 'name': 'Accounts Receivable', 'type': 'asset', 'parent': '1100'},
        
        # Liabilities
        {'code': '2000', 'name': 'Liabilities', 'type': 'liability', 'parent': None},
        {'code': '2100', 'name': 'Current Liabilities', 'type': 'liability', 'parent': '2000'},
        {'code': '2110', 'name': 'Accounts Payable', 'type': 'liability', 'parent': '2100'},
        
        # Equity
        {'code': '3000', 'name': 'Equity', 'type': 'equity', 'parent': None},
        {'code': '3100', 'name': 'Owner\'s Equity', 'type': 'equity', 'parent': '3000'},
        
        # Revenue
        {'code': '4000', 'name': 'Revenue', 'type': 'revenue', 'parent': None},
        {'code': '4100', 'name': 'Service Revenue', 'type': 'revenue', 'parent': '4000'},
        
        # Expenses
        {'code': '5000', 'name': 'Expenses', 'type': 'expense', 'parent': None},
        {'code': '5100', 'name': 'Operating Expenses', 'type': 'expense', 'parent': '5000'},
        {'code': '5110', 'name': 'Office Rent', 'type': 'expense', 'parent': '5100'},
        {'code': '5120', 'name': 'Utilities', 'type': 'expense', 'parent': '5100'},
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
                'description': f"Default account for {account_data['name']}",
            }
        )
        created_accounts[account_data['code']] = account
        
        if created:
            print(f'  Created account: {account.code} - {account.name}')
    
    print(f"Created {len(accounts_data)} financial accounts successfully!")

if __name__ == '__main__':
    create_default_accounts()
