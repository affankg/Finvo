from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import NumberSequence, Quotation, Invoice
import re
from collections import defaultdict

class Command(BaseCommand):
    help = 'Initialize number sequences for existing quotations and invoices'

    def handle(self, *args, **options):
        self.stdout.write('Initializing number sequences...')
        
        with transaction.atomic():
            # Clear existing sequences
            NumberSequence.objects.all().delete()
            
            # Initialize sequences for quotations
            quotation_sequences = defaultdict(int)
            quotations = Quotation.objects.all().order_by('date', 'id')
            
            for quotation in quotations:
                year = quotation.date.year
                month = quotation.date.month
                key = f"{year}-{month:02d}"
                
                # Extract number from existing quotation number if possible
                match = re.search(r'QTN-(\d{6})-(\d+)', quotation.number)
                if match:
                    existing_number = int(match.group(2))
                    quotation_sequences[key] = max(quotation_sequences[key], existing_number)
                else:
                    quotation_sequences[key] += 1
            
            # Create NumberSequence records for quotations
            for key, last_number in quotation_sequences.items():
                year, month = key.split('-')
                NumberSequence.objects.create(
                    document_type='quotation',
                    year=int(year),
                    month=int(month),
                    last_number=last_number
                )
                self.stdout.write(f'Created quotation sequence: {key} -> {last_number}')
            
            # Initialize sequences for invoices
            invoice_sequences = defaultdict(int)
            invoices = Invoice.objects.all().order_by('date', 'id')
            
            for invoice in invoices:
                year = invoice.date.year
                month = invoice.date.month
                key = f"{year}-{month:02d}"
                
                # Extract number from existing invoice number if possible
                match = re.search(r'INV-(\d{6})-(\d+)', invoice.number)
                if match:
                    existing_number = int(match.group(2))
                    invoice_sequences[key] = max(invoice_sequences[key], existing_number)
                else:
                    invoice_sequences[key] += 1
            
            # Create NumberSequence records for invoices
            for key, last_number in invoice_sequences.items():
                year, month = key.split('-')
                NumberSequence.objects.create(
                    document_type='invoice',
                    year=int(year),
                    month=int(month),
                    last_number=last_number
                )
                self.stdout.write(f'Created invoice sequence: {key} -> {last_number}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully initialized {NumberSequence.objects.count()} number sequences'
            )
        )
