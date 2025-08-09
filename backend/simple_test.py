#!/usr/bin/env python3
import os
import sys

# Add backend to path
backend_path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_path)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bs_engineering_backend.settings')

import django
django.setup()

# Now import Django models
from api.models import Invoice
from api.utils import generate_pdf

# Test
invoice = Invoice.objects.first()
if invoice:
    print(f"Found invoice: {invoice.number}")
    pdf = generate_pdf('invoice', invoice)
    if pdf:
        with open(f"SIMPLE_TEST_{invoice.number}.pdf", 'wb') as f:
            f.write(pdf)
        print(f"Generated SIMPLE_TEST_{invoice.number}.pdf ({len(pdf)} bytes)")
    else:
        print("PDF generation failed")
else:
    print("No invoices found")
