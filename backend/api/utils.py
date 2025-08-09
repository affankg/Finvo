from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether, PageTemplate, BaseDocTemplate, Frame, Flowable
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from django.core.mail import EmailMessage
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone
from io import BytesIO
from decimal import Decimal
import os
from datetime import datetime, timedelta

def get_currency_symbol(currency_code=None):
    """
    Get currency symbol for a given currency code
    Default to PKR (Rs) if currency_code is None or not found
    """
    if not currency_code:
        currency_code = getattr(settings, 'DEFAULT_CURRENCY', 'PKR')
    
    currency_choices = getattr(settings, 'CURRENCY_CHOICES', [('PKR', 'Pakistani Rupee', 'Rs')])
    
    for code, name, symbol in currency_choices:
        if code == currency_code:
            return symbol
    
    # Default fallback to Rs if currency not found
    return 'Rs'

def format_currency(amount, currency_code=None):
    """
    Format amount with currency symbol - clean formatting without unnecessary decimals
    """
    symbol = get_currency_symbol(currency_code)
    try:
        amount_float = float(amount) if amount else 0.0
        
        # If amount is a whole number, don't show decimals
        if amount_float == int(amount_float):
            return f"{symbol}{int(amount_float):,}"
        else:
            return f"{symbol}{amount_float:,.2f}"
    except (ValueError, TypeError):
        return f"{symbol}0"

class IntelligentTableWithTotals(Flowable):
    """
    Custom flowable that intelligently handles table and totals positioning.
    Ensures totals always appear immediately after the table on the same page.
    """
    
    def __init__(self, items_table, totals_container, min_rows_with_totals=2):
        """
        Initialize with the items table and totals container.
        """
        self.items_table = items_table
        self.totals_container = totals_container
        self.min_rows_with_totals = min_rows_with_totals
        
        # Store original table data for intelligent splitting
        self.table_data = getattr(items_table, '_data', [])
        self.col_widths = getattr(items_table, '_colWidths', [])
        self.table_style_commands = []
        
        # Extract style commands if available
        if hasattr(items_table, '_tablestyle') and items_table._tablestyle:
            self.table_style_commands = items_table._tablestyle.getCommands()
        
        # Calculate dimensions
        self.items_width, self.items_height = items_table.wrapOn(None, 6.3*inch, 999*inch)
        self.totals_width, self.totals_height = totals_container.wrapOn(None, 6.3*inch, 999*inch)
        
        # Total flowable dimensions
        self.width = max(self.items_width, self.totals_width)
        self.height = self.items_height + self.totals_height + 15  # Add spacing
    
    def wrapOn(self, canv, aW, aH):
        """Calculate space needed for this flowable"""
        return self.width, self.height
    
    def drawOn(self, canv, x, y):
        """Draw the table and totals with intelligent positioning"""
        # Draw table first
        table_y = y - self.items_height
        self.items_table.drawOn(canv, x, table_y)
        
        # Draw totals immediately after table with small spacing
        totals_y = table_y - 15 - self.totals_height
        self.totals_container.drawOn(canv, x, totals_y)
    
    def split(self, aW, aH):
        """
        Split the flowable intelligently to keep totals with table.
        Returns empty list to move entire content to next page if needed.
        """
        # Calculate minimum space needed for totals plus some table content
        totals_space_needed = self.totals_height + 40  # Extra padding for totals
        min_table_space = 80  # Minimum space for header + a few rows
        min_total_space = totals_space_needed + min_table_space
        
        # If we don't have enough space for meaningful content, move everything to next page
        if aH < min_total_space:
            return []  # This will move the entire flowable to the next page
        
        # If we can fit everything, return self
        if self.height <= aH:
            return [self]
        
        # For complex splitting, we'll use a simpler approach:
        # If the content doesn't fit, move everything to the next page
        # This ensures totals are never separated from the table
        return []  # Move entire content to next page to keep it together

class SimpleTableFlowable(Flowable):
    """Simple wrapper for a table that doesn't have totals"""
    
    def __init__(self, table):
        self.table = table
        self.width, self.height = table.wrapOn(None, 6.3*inch, 999*inch)
    
    def wrapOn(self, canv, aW, aH):
        return self.width, self.height
    
    def drawOn(self, canv, x, y):
        self.table.drawOn(canv, x, y - self.height)

class BottomFooter(Flowable):
    """Custom flowable that positions footer at the bottom of the page"""
    
    def __init__(self, footer_text, style):
        self.footer_text = footer_text
        self.style = style
        self.width = 6.3 * inch
        self.height = 0.6 * inch  # Reduced height for better layout
        
    def wrapOn(self, canv, aW, aH):
        """Return the space needed by this flowable"""
        return self.width, self.height
    
    def drawOn(self, canv, x, y, _sW=0):
        """Draw the footer at the very bottom of the page, perfectly centered"""
        # Get page dimensions
        page_width = canv._pagesize[0]  # Get page width
        page_height = canv._pagesize[1]  # Get page height
        bottom_margin = 60  # Our document's bottom margin
        
        # Position footer at bottom of page
        footer_y = bottom_margin + 10  # 10 points from very bottom
        
        # Create footer paragraph
        footer_para = Paragraph(self.footer_text, self.style)
        footer_para.wrapOn(canv, self.width, 100)
        
        # Calculate center position for perfect centering
        # Use page width minus margins to center properly
        left_margin = 35  # Document's left margin
        right_margin = 35  # Document's right margin
        content_width = page_width - left_margin - right_margin
        
        # Center the footer within the content area
        footer_x = left_margin + (content_width - self.width) / 2
        
        # Draw the footer centered at bottom
        footer_para.drawOn(canv, footer_x, footer_y)

def generate_pdf(doc_type, instance):
    """
    Generate PDF for quotation or invoice - Professional Layout with Fixed Footer
    """
    buffer = BytesIO()
    
    # Create document with standard margins (no special footer handling)
    doc = BaseDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=35,
        leftMargin=35,
        topMargin=35,
        bottomMargin=60,  # Standard bottom margin
        showBoundary=0
    )
    
    # Create single frame for content
    main_frame = Frame(
        doc.leftMargin,
        doc.bottomMargin,
        doc.width,
        doc.height,
        leftPadding=0,
        bottomPadding=0,
        rightPadding=0,
        topPadding=0,
        showBoundary=0
    )
    
    # Create single page template - no special footer template needed
    main_template = PageTemplate(id='main', frames=[main_frame])
    
    # Add template to document
    doc.addPageTemplates([main_template])
    
    styles = getSampleStyleSheet()
    story = []
    
    # Company info from settings
    company_info = settings.COMPANY_INFO
    
    # Header with LOGO ON LEFT and DOCUMENT INFO ON RIGHT - Properly Sized
    logo_paths = [
        os.path.join(settings.MEDIA_ROOT, 'images', 'company-logo.png'),
        os.path.join(settings.MEDIA_ROOT, 'images', 'bs-logo-new.png'),
    ]
    
    logo_element = ""
    logo_loaded = False
    
    for logo_path in logo_paths:
        if os.path.exists(logo_path):
            try:
                # Logo size adjusted to match header table width (4.2")
                logo = Image(logo_path, width=4.2*inch, height=1.9*inch, kind='proportional')
                logo_element = logo
                logo_loaded = True
                break
            except Exception as e:
                print(f"Warning: Could not load logo {logo_path}: {e}")
                continue
    
    if not logo_loaded:
        logo_element = Spacer(4.2*inch, 1.9*inch)  # Match header table width
    
    # Document info - right side, properly aligned with vertical centering
    document_info_style = ParagraphStyle(
        'DocumentHeader',
        parent=styles['Normal'],
        fontSize=12,
        alignment=TA_RIGHT,
        leading=14,
        spaceAfter=0,
        spaceBefore=0
    )
    
    # Document info paragraph
    if doc_type == 'quotation':
        doc_info_text = (
            f'<b><font size="16" color="#2563eb">{doc_type.upper()}</font></b><br/>'
            f'<font size="12"><b>#{instance.number}</b></font><br/>'
            f'<font size="10">Date: {instance.date.strftime("%B %d, %Y")}</font><br/>'
            f'<font size="10">Due Date: {(instance.date + timedelta(days=instance.validity)).strftime("%B %d, %Y")}</font>'
        )
    else:
        po_number_line = ""
        if hasattr(instance, 'po_number') and instance.po_number:
            po_number_line = f'<font size="10"><b>PO: {instance.po_number}</b></font><br/>'
        
        doc_info_text = (
            f'<b><font size="16" color="#2563eb">{doc_type.upper()}</font></b><br/>'
            f'<font size="12"><b>#{instance.number}</b></font><br/>'
            f'{po_number_line}'
            f'<font size="10">Date: {instance.date.strftime("%B %d, %Y")}</font><br/>'
            f'<font size="10">Delivery Date: {instance.due_date.strftime("%B %d, %Y")}</font>'
        )
    
    document_paragraph = Paragraph(doc_info_text, document_info_style)
    
    # Header table - matched proportions with client section (4.2" + 2.1" = 6.3")
    header_table_data = [[logo_element, document_paragraph]]
    header_table = Table(header_table_data, colWidths=[4.2*inch, 2.1*inch])  # Match client table proportions exactly
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),  # Changed from TOP to MIDDLE for better alignment
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 20))
    
    # Client information table with Purchase Requisition OR Tax Info for invoices
    client_style = ParagraphStyle(
        'Client',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,  # Increased line spacing for better readability
        leftIndent=0,
        rightIndent=0,
        spaceBefore=0,
        spaceAfter=0
    )
    
    # Build client info text with enhanced formatting
    client_info_text = f"<b style='font-size:11pt'>{instance.client.name}</b>"
    
    if hasattr(instance.client, 'address') and instance.client.address:
        # Handle multi-line addresses properly
        address_lines = instance.client.address.split('\n')
        for line in address_lines:
            if line.strip():
                client_info_text += f"<br/>{line.strip()}"
    
    if hasattr(instance.client, 'phone') and instance.client.phone:
        client_info_text += f"<br/><b>Phone:</b> {instance.client.phone}"
    
    if hasattr(instance.client, 'email') and instance.client.email:
        client_info_text += f"<br/><b>Email:</b> {instance.client.email}"
    
    client_paragraph = Paragraph(client_info_text, client_style)
    
    # Right side content - Purchase Requisition for quotations, Tax Info for invoices
    right_side_style = ParagraphStyle(
        'RightSide',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_RIGHT,
        leading=14,  # Consistent line spacing
        leftIndent=0,
        rightIndent=0,
        spaceBefore=0,
        spaceAfter=0
    )
    
    if doc_type == 'quotation':
        # Purchase Requisition for quotations
        right_side_text = ""
        if hasattr(instance, 'purchase_requisition') and instance.purchase_requisition:
            right_side_text = f"{instance.purchase_requisition}"
    else:
        # Tax registration info for invoices - positioned on right side parallel to client address
        right_side_text = (
            'GST: 3277876177913<br/>'
            'PRA: P7176390-6<br/>'
            'SRB: S7176390-6<br/>'
            'NTN: 7176390-6'
        )
    
    right_side_paragraph = Paragraph(right_side_text, right_side_style)
    
    # Enhanced Client and Right Side table with better spacing
    client_table_data = [[client_paragraph, right_side_paragraph]]
    client_table = Table(client_table_data, colWidths=[4.2*inch, 2.1*inch])  # Match items table total width (6.3")
    client_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 8),     # Increased top padding
        ('BOTTOMPADDING', (0, 0), (-1, -1), 20), # Significantly increased bottom padding for better separation
    ]))
    story.append(client_table)
    story.append(Spacer(1, 25))  # Enhanced spacing after client section
    
    # ITEMS & SERVICES section - Professional header with consistent alignment
    items_header_style = ParagraphStyle(
        'ItemsHeader',
        parent=styles['Normal'],
        fontSize=13,  # Slightly larger for better hierarchy
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#2c3e50'),  # Professional dark color
        alignment=TA_LEFT,
        spaceAfter=6,
        spaceBefore=8,
        leftIndent=0,
        rightIndent=0,
        keepWithNext=True  # Keep header with table
    )
    
    # Items table with tax information and totals included - allow natural page splitting
    items_data = [['Description', 'Qty', 'Unit Price', 'Tax', 'Total']]
    subtotal_amount = 0
    total_tax_amount = 0
    total_amount = 0
    
    # Get currency symbol from instance
    currency_symbol = instance.currency_symbol
    
    # Helper function for clean currency formatting with no-wrap protection
    def format_clean_currency(amount):
        """Format currency with no-break protection to prevent line wrapping"""
        if amount == int(amount):
            return f"<nobr>{currency_symbol}&nbsp;{int(amount):,}</nobr>"
        else:
            # Ensure decimal amounts are formatted without line breaks
            return f"<nobr>{currency_symbol}&nbsp;{amount:,.2f}</nobr>"
    
    for item in instance.items.all():
        # Enhanced description with proper text wrapping and formatting
        description_text = f"<b>{item.service.name}</b>"
        if item.description:
            # Handle multi-line descriptions properly
            description_lines = item.description.split('\n')
            clean_lines = [line.strip() for line in description_lines if line.strip()]
            if clean_lines:
                description_text += f"<br/><font size='8'>{('<br/>'.join(clean_lines))}</font>"
        
        description_paragraph = Paragraph(
            description_text,
            ParagraphStyle(
                'ItemDescription',
                parent=styles['Normal'],
                fontSize=9,
                leading=12,  # Better line spacing
                leftIndent=0,
                rightIndent=0,
                spaceBefore=4,  # Uniform padding
                spaceAfter=4,   # Uniform padding
                alignment=TA_LEFT,
                wordWrap='CJK'  # Allow proper word wrapping within cell boundaries
            )
        )
        
        # Calculate item subtotal (quantity * price)
        item_subtotal = item.quantity * item.price
        
        # Get tax display and calculate tax amount
        tax_display = "No Tax"
        item_tax_amount = Decimal('0')
        
        if hasattr(item, 'tax_type') and item.tax_type != 'none':
            if item.tax_type == 'gst_18':
                tax_display = "GST 18%"
                item_tax_amount = item_subtotal * Decimal('0.18')
            elif item.tax_type == 'gst_17':
                tax_display = "GST 17%"
                item_tax_amount = item_subtotal * Decimal('0.17')
            elif item.tax_type == 'srb_15':
                tax_display = "SRB 15%"
                item_tax_amount = item_subtotal * Decimal('0.15')
        
        # Calculate item total (subtotal + tax)
        item_total = item_subtotal + item_tax_amount
        
        # Create perfectly aligned Paragraph objects for all cells
        quantity_paragraph = Paragraph(
            f"<b><nobr>{item.quantity}</nobr></b>",  # Prevent quantity wrapping
            ParagraphStyle(
                'ItemQuantity',
                parent=styles['Normal'],
                fontSize=9,
                alignment=TA_CENTER,  # Changed to center-align as requested
                spaceBefore=4,  # Uniform padding
                spaceAfter=4,   # Uniform padding
                leading=12,
                wordWrap='LTR'
            )
        )
        
        price_paragraph = Paragraph(
            f"<b>{format_clean_currency(item.price)}</b>",
            ParagraphStyle(
                'ItemPrice',
                parent=styles['Normal'],
                fontSize=9,
                alignment=TA_RIGHT,
                spaceBefore=4,  # Uniform padding
                spaceAfter=4,   # Uniform padding
                leading=12,
                wordWrap='LTR'  # Prevent word wrapping
            )
        )
        
        tax_paragraph = Paragraph(
            f"<font size='8'><nobr>{tax_display}</nobr></font>",  # Prevent tax display wrapping
            ParagraphStyle(
                'ItemTax',
                parent=styles['Normal'],
                fontSize=9,
                alignment=TA_CENTER,  # Changed to center-align for consistency
                spaceBefore=4,  # Uniform padding
                spaceAfter=4,   # Uniform padding
                leading=12,
                wordWrap='LTR'
            )
        )
        
        total_paragraph = Paragraph(
            f"<b>{format_clean_currency(item_total)}</b>",
            ParagraphStyle(
                'ItemTotal',
                parent=styles['Normal'],
                fontSize=9,
                alignment=TA_RIGHT,
                spaceBefore=4,  # Uniform padding
                spaceAfter=4,   # Uniform padding
                leading=12,
                textColor=colors.HexColor('#2c3e50'),
                wordWrap='LTR'  # Prevent word wrapping
            )
        )
        
        items_data.append([
            description_paragraph,
            quantity_paragraph,
            price_paragraph,
            tax_paragraph,
            total_paragraph
        ])
        
        subtotal_amount += item_subtotal
        total_tax_amount += item_tax_amount
        total_amount += item_total

    # Enhanced items table with optimized column widths - adjusted for better proportions
    total_width = 6.3 * inch
    description_width = total_width * 0.40  # 40% for Description
    qty_width = total_width * 0.08         # 8% for Qty (reduced)
    tax_width = total_width * 0.10         # 10% for Tax (reduced)
    unit_price_width = total_width * 0.21  # 21% for Unit Price (increased)
    total_width_col = total_width * 0.21   # 21% for Total (increased)
    
    items_table = Table(items_data, colWidths=[description_width, qty_width, unit_price_width, tax_width, total_width_col])
    
    # Calculate number of data rows for styling
    num_data_rows = len(items_data) - 1
    num_items = len(instance.items.all())
    
    # Enhanced professional table styling with proper alignment and uniform padding
    table_style_commands = [
        # Professional header with enhanced colors
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),  # Slightly larger header text
        
        # Items data alignment - proper alignment as specified
        ('ALIGN', (0, 1), (0, num_items), 'LEFT'),      # Description left-aligned
        ('ALIGN', (1, 1), (1, num_items), 'CENTER'),    # Qty center-aligned (FIXED)
        ('ALIGN', (2, 1), (2, num_items), 'RIGHT'),     # Unit Price right-aligned
        ('ALIGN', (3, 1), (3, num_items), 'CENTER'),    # Tax center-aligned
        ('ALIGN', (4, 1), (4, num_items), 'RIGHT'),     # Total right-aligned
        
        # Enhanced typography for readability
        ('FONTNAME', (0, 1), (-1, num_items), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, num_items), 9),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        
        # Professional padding - uniform 4px as requested
        ('TOPPADDING', (0, 0), (-1, 0), 12),           # Header padding
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),        # Header padding
        ('TOPPADDING', (0, 1), (-1, num_items), 4),    # 4px uniform padding for items
        ('BOTTOMPADDING', (0, 1), (-1, num_items), 4), # 4px uniform padding for items
        ('LEFTPADDING', (0, 0), (-1, -1), 8),          # Consistent left padding
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),         # Consistent right padding
        
        # Professional borders with consistent styling
        ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor('#2c3e50')),  # Strong header border
        ('GRID', (0, 1), (-1, num_items), 0.5, colors.HexColor('#bdc3c7')),  # Item borders
        
        # Perfect vertical alignment
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        
        # Prevent awkward row splits - entire rows move to next page if needed
        ('SPLITBYROW', (0, 0), (-1, -1), True),  # Split table by complete rows only
        
        # Prevent text overflow into adjacent columns
        ('WORDWRAP', (0, 1), (0, num_items), True),  # Allow wrapping only in description column
    ]
    
    # Create a unified table that includes both items and totals
    # This ensures totals are never separated from the table
    
    # Create separate calculation table for better control
    calculation_data = []
    
    # Subtotal row - using single cell approach for no wrapping
    calculation_data.append([
        Paragraph(f"<b>Subtotal: {format_clean_currency(subtotal_amount)}</b>", 
                 ParagraphStyle('SubtotalRow', parent=styles['Normal'], fontSize=10, alignment=TA_RIGHT, fontName='Helvetica-Bold', wordWrap='LTR'))
    ])
    
    # Tax row if applicable - using single cell approach for no wrapping
    if total_tax_amount > 0:
        calculation_data.append([
            Paragraph(f"<b>Total Tax: {format_clean_currency(total_tax_amount)}</b>", 
                     ParagraphStyle('TaxRow', parent=styles['Normal'], fontSize=10, alignment=TA_RIGHT, fontName='Helvetica-Bold', textColor=colors.HexColor('#e74c3c'), wordWrap='LTR'))
        ])
    
    # Final total row - using single cell approach for no wrapping  
    calculation_data.append([
        Paragraph(f"<b>TOTAL AMOUNT: {format_clean_currency(total_amount)}</b>", 
                 ParagraphStyle('TotalRow', parent=styles['Normal'], fontSize=11, alignment=TA_RIGHT, fontName='Helvetica-Bold', textColor=colors.HexColor('#2c3e50'), wordWrap='LTR'))
    ])
    
    # Create calculation table with full width to prevent wrapping
    calculation_table = Table(calculation_data, colWidths=[6.3*inch])  # Full width single column
    calculation_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        # Special styling for final total row
        ('LINEABOVE', (0, -1), (-1, -1), 2, colors.HexColor('#2c3e50')),  # Strong line above final total
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f8f9fa')),     # Light background for final total
    ]))
    
    # Combine items table and calculation table in unified data structure
    # (Line removed - not needed for separate table approach)
    
    # Now create the unified table approach - but using separate calculation table
    unified_items_table = items_table  # Use the items table that was already created above
    
    # Calculate row indices for styling (only for items now)
    num_item_rows = len(instance.items.all())
    
    # Enhanced professional table styling for items only
    enhanced_table_style_commands = [
        # Professional header with enhanced colors
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2c3e50')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 11),
        
        # Items data alignment
        ('ALIGN', (0, 1), (0, num_item_rows), 'LEFT'),      # Description left-aligned
        ('ALIGN', (1, 1), (1, num_item_rows), 'CENTER'),    # Qty center-aligned
        ('ALIGN', (2, 1), (2, num_item_rows), 'RIGHT'),     # Unit Price right-aligned
        ('ALIGN', (3, 1), (3, num_item_rows), 'CENTER'),    # Tax center-aligned
        ('ALIGN', (4, 1), (4, num_item_rows), 'RIGHT'),     # Total right-aligned
        
        # Typography for items
        ('FONTNAME', (0, 1), (-1, num_item_rows), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, num_item_rows), 9),
        ('TEXTCOLOR', (0, 1), (-1, num_item_rows), colors.black),
        
        # Padding for header and items
        ('TOPPADDING', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('TOPPADDING', (0, 1), (-1, num_item_rows), 4),
        ('BOTTOMPADDING', (0, 1), (-1, num_item_rows), 4),
        ('LEFTPADDING', (0, 0), (-1, num_item_rows), 8),
        ('RIGHTPADDING', (0, 0), (-1, num_item_rows), 8),
        
        # Borders for items section
        ('LINEBELOW', (0, 0), (-1, 0), 2, colors.HexColor('#2c3e50')),
        ('GRID', (0, 1), (-1, num_item_rows), 0.5, colors.HexColor('#bdc3c7')),
        
        # Perfect vertical alignment
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        
        # Row splitting control - split by complete rows
        ('SPLITBYROW', (0, 0), (-1, -1), True),
    ]
    
    unified_items_table.setStyle(TableStyle(enhanced_table_style_commands))
    
    # UNIFIED TABLE APPROACH - ITEMS AND TOTALS IN ONE TABLE
    # This is the most reliable way to ensure totals never get separated from items
    
    # Create header paragraph for items section
    items_header_paragraph = Paragraph("<b>ITEMS &amp; SERVICES</b>", items_header_style)
    items_header_table = Table([[items_header_paragraph]], colWidths=[6.3*inch])
    items_header_table.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    
    # Add the header to story
    story.append(items_header_table)
    
    # Add the items table
    story.append(unified_items_table)
    
    # Add small spacing before calculation
    story.append(Spacer(1, 10))
    
    # Add the separate calculation table - this prevents text wrapping
    story.append(calculation_table)
    story.append(Spacer(1, 25))  # Professional spacing after calculations
    
    # Notes section - Enhanced professional formatting and alignment with page flow
    if instance.notes:
        # Notes header with consistent professional styling
        notes_header_style = ParagraphStyle(
            'NotesHeader',
            parent=styles['Normal'],
            fontSize=13,  # Consistent with items header
            alignment=TA_LEFT,
            fontName='Helvetica-Bold',
            spaceAfter=6,
            textColor=colors.HexColor('#2c3e50'),  # Professional color consistency
            leftIndent=0,
            rightIndent=0,
            keepWithNext=True  # Keep header with content
        )
        
        # Create header table with perfect alignment to content
        notes_header_paragraph = Paragraph("<b>NOTES</b>", notes_header_style)
        notes_header_table = Table([[notes_header_paragraph]], colWidths=[6.3*inch])  # Match items table width
        notes_header_table.setStyle(TableStyle([
            ('LEFTPADDING', (0, 0), (-1, -1), 12),  # Match notes content padding exactly
            ('RIGHTPADDING', (0, 0), (-1, -1), 12), # Match notes content padding exactly
            ('TOPPADDING', (0, 0), (-1, -1), 0),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10), # Professional spacing
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        # Enhanced notes content with better text handling
        notes_content_style = ParagraphStyle(
            'NotesContent',
            parent=styles['Normal'],
            fontSize=10,  # Slightly larger for better readability
            alignment=TA_LEFT,
            leading=14,   # Better line spacing
            spaceAfter=0,
            leftIndent=0,
            rightIndent=0,
            spaceBefore=0
        )
        
        # Handle multi-line notes properly
        notes_text = instance.notes.strip()
        if '\n' in notes_text:
            # Replace line breaks with HTML breaks for proper formatting
            notes_text = notes_text.replace('\n', '<br/>')
        
        # Create notes content table with perfect alignment
        notes_content_paragraph = Paragraph(notes_text, notes_content_style)
        notes_content_table = Table([[notes_content_paragraph]], colWidths=[6.3*inch])  # Match items table width
        notes_content_table.setStyle(TableStyle([
            ('LEFTPADDING', (0, 0), (-1, -1), 12),  # Match items table padding exactly
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 15), # Enhanced bottom spacing
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        # Keep notes header and content together for page flow
        notes_section = KeepTogether([notes_header_table, notes_content_table])
        story.append(notes_section)
        story.append(Spacer(1, 20))  # Enhanced spacing after notes
    
    # Professional Terms and Conditions - Enhanced layout and formatting with page flow
    # Terms header with consistent professional styling
    terms_header_style = ParagraphStyle(
        'TermsHeader',
        parent=styles['Normal'],
        fontSize=13,  # Consistent with other headers
        alignment=TA_LEFT,
        fontName='Helvetica-Bold',
        spaceAfter=6,
        textColor=colors.HexColor('#2c3e50'),  # Professional color consistency
        leftIndent=0,
        rightIndent=0,
        keepWithNext=True  # Keep header with content
    )
    
    # Create header table with perfect alignment to content
    terms_header_paragraph = Paragraph("<b>TERMS AND CONDITIONS</b>", terms_header_style)
    terms_header_table = Table([[terms_header_paragraph]], colWidths=[6.3*inch])  # Match items table width
    terms_header_table.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), 12),  # Match terms content padding exactly
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),  # Match terms content padding 
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10), # Professional spacing
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    
    # Enhanced terms and conditions - professional and comprehensive
    terms_conditions = [
        "Customer will be billed after indicating acceptance of this quote",
        "Extra amount will be charged if work activity increases beyond scope", 
        "Payment will be due prior to delivery of service and goods",
        "Sales tax will be charged as additional cost where applicable",
        "Purchase orders for supply and services required separately",
        "BSE and client will not hire or contract each other's employees"
    ]
    
    # Create professional terms table with enhanced formatting
    terms_data = []
    for i, term in enumerate(terms_conditions, 1):
        # Create paragraph for each term with consistent formatting
        term_paragraph = Paragraph(
            term,
            ParagraphStyle(
                'TermText',
                parent=styles['Normal'],
                fontSize=9,
                leading=12,  # Better line spacing
                leftIndent=0,
                rightIndent=0,
                spaceBefore=1,
                spaceAfter=1,
                alignment=TA_LEFT
            )
        )
        
        # Create number paragraph with consistent styling
        number_paragraph = Paragraph(
            f"<b>{i}.</b>",
            ParagraphStyle(
                'TermNumber',
                parent=styles['Normal'],
                fontSize=9,
                fontName='Helvetica-Bold',
                textColor=colors.HexColor('#2c3e50'),
                alignment=TA_LEFT,
                spaceBefore=1,
                spaceAfter=1
            )
        )
        
        terms_data.append([number_paragraph, term_paragraph])
    
    # Create terms table with perfect width and professional styling
    terms_table = Table(terms_data, colWidths=[0.4*inch, 5.9*inch])  # Total: 6.3 inches to match items table
    terms_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),  # Match items table left padding exactly
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 4),    # Professional spacing
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4), # Professional spacing
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#2c3e50')),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
    ]))
    
    # Keep terms header and content together for page flow
    terms_section = KeepTogether([terms_header_table, terms_table])
    story.append(terms_section)
    
    # Footer positioned at bottom of page using custom flowable
    story.append(Spacer(1, 0.2*inch))  # Small spacing after terms
    
    # Footer content with improved formatting
    current_date = datetime.now().strftime("%B %d, %Y at %I:%M %p")
    footer_text = (
        f'<b>Thank you for choosing BS Engineering!</b><br/>'
        f'<font size="8">Generated: {current_date}</font><br/>'
        f'<font size="8">Questions? Contact us: <b>bs@bsconsults.com</b> | '
        f'<b>P: 92.21.34982786</b> | '
        f'<b>C: +92.3063216344</b> | <b>C: +92.3443311303</b></font><br/>'
        f'<i><font size="8">Your trusted engineering partner</font></i>'
    )
    
    # Footer styling - 9pt, centered with better spacing
    footer_style = ParagraphStyle(
        'FooterContent',
        fontName='Helvetica',
        fontSize=9,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#2c3e50'),
        leading=12,  # Increased line spacing for better readability
        spaceAfter=0,
        spaceBefore=0,
        leftIndent=0,
        rightIndent=0
    )
    
    # Add custom bottom footer flowable
    bottom_footer = BottomFooter(footer_text, footer_style)
    story.append(bottom_footer)
    
    # Build the document
    doc.build(story)
    
    pdf_content = buffer.getvalue()
    buffer.close()
    
    return pdf_content

def send_email_with_pdf(doc_type, instance, recipient_email, custom_message=''):
    """
    Send email with PDF attachment
    """
    # Generate PDF
    pdf_content = generate_pdf(doc_type, instance)
    
    # Email subject and content
    subject = f"{doc_type.title()} #{instance.number} from {settings.COMPANY_INFO['name']}"
    
    # Default message if none provided
    if not custom_message:
        if doc_type == 'quotation':
            custom_message = f"Please find attached the quotation #{instance.number}. This quotation is valid until {(instance.date + timedelta(days=instance.validity)).strftime('%B %d, %Y')}."
        else:
            custom_message = f"Please find attached the invoice #{instance.number}. Payment is due by {instance.due_date.strftime('%B %d, %Y')}."
    
    # Email body
    email_body = f"""
    Dear {instance.client.name},

    {custom_message}

    If you have any questions or need clarification, please don't hesitate to contact us.

    Best regards,
    {settings.COMPANY_INFO['name']}
    {settings.COMPANY_INFO['phone']}
    {settings.COMPANY_INFO['email']}
    """
    
    # Create email
    email = EmailMessage(
        subject=subject,
        body=email_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[recipient_email],
    )
    
    # Attach PDF
    filename = f"{doc_type}_{instance.number}.pdf"
    email.attach(filename, pdf_content, 'application/pdf')
    
    # Send email
    email.send()
    
    return True

def save_pdf_to_media(doc_type, instance):
    """
    Save PDF to media directory and return file path
    """
    pdf_content = generate_pdf(doc_type, instance)
    
    # Create directory if it doesn't exist
    pdf_dir = settings.PDF_STORAGE_PATH
    os.makedirs(pdf_dir, exist_ok=True)
    
    # File path
    filename = f"{doc_type}_{instance.number}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    file_path = os.path.join(pdf_dir, filename)
    
    # Save file
    with open(file_path, 'wb') as f:
        f.write(pdf_content)
    
    return file_path
