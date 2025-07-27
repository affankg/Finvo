#!/usr/bin/env python3
"""
Script to add tax calculation methods to Quotation and Invoice models
"""

# Read the current models.py file
with open('api/models.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the tax methods to add
tax_methods = '''
    @property
    def subtotal_amount(self):
        """Calculate subtotal before tax from all items"""
        return sum(item.subtotal if hasattr(item, 'subtotal') else (item.quantity * item.price) for item in self.items.all())
    
    @property
    def total_tax_amount(self):
        """Calculate total tax amount from all items"""
        return sum(item.tax_amount if hasattr(item, 'tax_amount') else 0 for item in self.items.all())
'''

# Add methods to Quotation model (after total_amount method)
quotation_pattern = '''    @property
    def total_amount(self):
        """Calculate total amount from all items"""
        return sum(item.total for item in self.items.all())
    
    @property
    def currency_symbol(self):'''

quotation_replacement = '''    @property
    def total_amount(self):
        """Calculate total amount from all items"""
        return sum(item.total for item in self.items.all())
''' + tax_methods + '''
    @property
    def currency_symbol(self):'''

# Replace for Quotation
if quotation_pattern in content:
    content = content.replace(quotation_pattern, quotation_replacement)
    print("Added tax methods to Quotation model")
else:
    print("Could not find Quotation model pattern")

# Add methods to Invoice model (after total_amount method)
# Find the second occurrence for Invoice
invoice_sections = content.split('@property\n    def total_amount(self):\n        """Calculate total amount from all items"""\n        return sum(item.total for item in self.items.all())')

if len(invoice_sections) >= 3:  # Should have 3 parts if there are 2 occurrences
    # Find the second occurrence (Invoice model)
    second_part = invoice_sections[2]
    currency_symbol_pos = second_part.find('\n    @property\n    def currency_symbol(self):')
    
    if currency_symbol_pos != -1:
        invoice_replacement = tax_methods + '\n    @property\n    def currency_symbol(self):'
        second_part = second_part[:currency_symbol_pos] + invoice_replacement + second_part[currency_symbol_pos + len('\n    @property\n    def currency_symbol(self):'):]
        
        # Reconstruct the content
        content = '@property\n    def total_amount(self):\n        """Calculate total amount from all items"""\n        return sum(item.total for item in self.items.all())'.join([
            invoice_sections[0],
            invoice_sections[1],
            second_part
        ])
        print("Added tax methods to Invoice model")
    else:
        print("Could not find Invoice currency_symbol method")
else:
    print("Could not find second total_amount method (Invoice)")

# Write the updated content back
with open('api/models.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Tax methods added successfully!")
