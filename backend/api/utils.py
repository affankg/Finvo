from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from django.core.mail import EmailMessage
from django.conf import settings
from django.template.loader import render_to_string
from django.utils import timezone
from io import BytesIO
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
    Format amount with currency symbol
    """
    symbol = get_currency_symbol(currency_code)
    try:
        amount_float = float(amount) if amount else 0.0
        return f"{symbol}{amount_float:,.2f}"
    except (ValueError, TypeError):
        return f"{symbol}0.00"

def generate_pdf(doc_type, instance):
    """
    Generate PDF for quotation or invoice - Optimized single page layout
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=25,
        bottomMargin=25
    )
    styles = getSampleStyleSheet()
    story = []
    
    # Company info from settings
    company_info = settings.COMPANY_INFO
    
    # Header with company info and document title - Using Paragraphs for proper rendering
    company_info_style = ParagraphStyle(
        'CompanyHeader',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_LEFT,
        leading=12
    )
    
    document_info_style = ParagraphStyle(
        'DocumentHeader',
        parent=styles['Normal'],
        fontSize=12,
        alignment=TA_RIGHT,
        leading=14
    )
    
    # Create paragraphs for proper HTML rendering
    company_paragraph = Paragraph(
        f'<b><font size="14" color="#2563eb">{company_info["name"]}</font></b><br/>'
        f'<font size="9">{company_info["full_name"]}</font><br/>'
        f'<font size="8">{company_info["address"]}</font><br/>'
        f'<font size="8">Phone: {company_info["phone"]} | Email: {company_info["email"]}</font>',
        company_info_style
    )
    
    # Document info paragraph
    if doc_type == 'quotation':
        doc_info_text = (
            f'<b><font size="16" color="#2563eb">{doc_type.upper()}</font></b><br/>'
            f'<font size="12"><b>#{instance.number}</b></font><br/>'
            f'<font size="9">Date: {instance.date.strftime("%B %d, %Y")}</font><br/>'
            f'<font size="9">Valid Until: {(instance.date + timedelta(days=instance.validity)).strftime("%B %d, %Y")}</font>'
        )
    else:
        doc_info_text = (
            f'<b><font size="16" color="#2563eb">{doc_type.upper()}</font></b><br/>'
            f'<font size="12"><b>#{instance.number}</b></font><br/>'
            f'<font size="9">Date: {instance.date.strftime("%B %d, %Y")}</font><br/>'
            f'<font size="9">Due Date: {instance.due_date.strftime("%B %d, %Y")}</font><br/>'
            f'<font size="9">Status: <b>{instance.get_status_display()}</b></font>'
        )
    
    document_paragraph = Paragraph(doc_info_text, document_info_style)
    
    header_table_data = [[company_paragraph, document_paragraph]]
    header_table = Table(header_table_data, colWidths=[3.8*inch, 2.5*inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 12))
    
    # Client information - compact with full details
    client_style = ParagraphStyle(
        'Client',
        parent=styles['Normal'],
        fontSize=10,
        spaceAfter=12,
        leading=12
    )
    
    # Build client info text with all available details
    client_info_text = f"<b>Bill To:</b><br/>{instance.client.name}"
    
    if hasattr(instance.client, 'address') and instance.client.address:
        client_info_text += f"<br/>{instance.client.address}"
    
    if hasattr(instance.client, 'phone') and instance.client.phone:
        client_info_text += f"<br/>Phone: {instance.client.phone}"
    
    if hasattr(instance.client, 'email') and instance.client.email:
        client_info_text += f"<br/>Email: {instance.client.email}"
    
    story.append(Paragraph(client_info_text, client_style))
    
    # Items table with tax information
    items_data = [['Description', 'Qty', 'Unit Price', 'Tax', 'Total']]
    subtotal_amount = 0
    total_tax_amount = 0
    total_amount = 0
    
    # Get currency symbol from instance
    currency_symbol = instance.currency_symbol
    
    for item in instance.items.all():
        description = f"{item.service.name}"
        if item.description:
            description += f" - {item.description}"
        
        # Get tax display
        tax_display = "No Tax"
        if hasattr(item, 'tax_type') and item.tax_type != 'none':
            if item.tax_type == 'gst_18':
                tax_display = "GST 18%"
            elif item.tax_type == 'gst_17':
                tax_display = "GST 17%"
            elif item.tax_type == 'srb_15':
                tax_display = "SRB 15%"
        
        items_data.append([
            description,
            str(item.quantity),
            f"{currency_symbol}{item.price:,.2f}",
            tax_display,
            f"{currency_symbol}{item.total:,.2f}"
        ])
        
        subtotal_amount += item.subtotal if hasattr(item, 'subtotal') else (item.quantity * item.price)
        total_tax_amount += item.tax_amount if hasattr(item, 'tax_amount') else 0
        total_amount += item.total
    
    items_table = Table(items_data, colWidths=[2.5*inch, 0.5*inch, 0.9*inch, 0.9*inch, 1.0*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 3),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 8))
    
    # Totals breakdown - using Paragraphs for proper HTML rendering
    totals_style = ParagraphStyle(
        'TotalsLabel',
        parent=styles['Normal'],
        fontSize=10,
        fontName='Helvetica',
        alignment=TA_RIGHT
    )
    
    totals_amount_style = ParagraphStyle(
        'TotalsAmount',
        parent=styles['Normal'],
        fontSize=10,
        fontName='Helvetica',
        alignment=TA_RIGHT
    )
    
    total_final_style = ParagraphStyle(
        'TotalFinal',
        parent=styles['Normal'],
        fontSize=11,
        fontName='Helvetica-Bold',
        alignment=TA_RIGHT
    )
    
    # Create totals breakdown
    totals_data = []
    
    # Add subtotal
    totals_data.append([
        '', '', '', 
        Paragraph('<b>Subtotal:</b>', totals_style), 
        Paragraph(f'{currency_symbol}{subtotal_amount:,.2f}', totals_amount_style)
    ])
    
    # Add tax if applicable
    if total_tax_amount > 0:
        totals_data.append([
            '', '', '', 
            Paragraph('<b>Tax:</b>', totals_style), 
            Paragraph(f'{currency_symbol}{total_tax_amount:,.2f}', totals_amount_style)
        ])
    
    # Add final total
    totals_data.append([
        '', '', '', 
        Paragraph('<b>TOTAL:</b>', total_final_style), 
        Paragraph(f'<b>{currency_symbol}{total_amount:,.2f}</b>', total_final_style)
    ])
    
    totals_table = Table(totals_data, colWidths=[2.5*inch, 0.5*inch, 0.9*inch, 0.9*inch, 1.0*inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        # Highlight the final total row
        ('BACKGROUND', (3, -1), (-1, -1), colors.HexColor('#2563eb')),
        ('TEXTCOLOR', (3, -1), (-1, -1), colors.whitesmoke),
        ('BOX', (3, -1), (-1, -1), 1, colors.black),
    ]))
    story.append(totals_table)
    story.append(Spacer(1, 12))
    
    # Notes in compact format
    if instance.notes:
        notes_style = ParagraphStyle(
            'Notes',
            parent=styles['Normal'],
            fontSize=9,
            alignment=TA_LEFT,
            spaceAfter=8
        )
        story.append(Paragraph(f"<b>Notes:</b> {instance.notes}", notes_style))
    
    # Compact Terms and Conditions
    story.append(Spacer(1, 10))
    
    # Terms header
    terms_header_style = ParagraphStyle(
        'TermsHeader',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_LEFT,
        fontName='Helvetica-Bold',
        spaceAfter=6,
        textColor=colors.HexColor('#2563eb')
    )
    
    story.append(Paragraph("<b>Terms and Conditions:</b>", terms_header_style))
    
    # Define terms and conditions - more compact
    terms_conditions = [
        "Customer will be billed after indicating acceptance of this quote",
        "Extra Amount will be Charge, if work activity increase", 
        "Payment will be due prior to delivery of service and goods",
        "Sales Tax will be Charge in additional Cost will be applicable",
        "PO in respect of Supply and Services Separately",
        "BSE and Client will not hire or contract each others employees"
    ]
    
    # Create compact terms table
    terms_data = []
    for i, term in enumerate(terms_conditions, 1):
        terms_data.append([f"{i}.", term])
    
    # Create terms table - more compact
    terms_table = Table(terms_data, colWidths=[0.2*inch, 5.8*inch])
    terms_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f9fafb')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#2563eb')),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
    ]))
    
    story.append(terms_table)
    story.append(Spacer(1, 12))
    
    # Compact Footer
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=7,
        alignment=TA_CENTER,
        textColor=colors.grey,
        leading=8
    )
    
    footer_text = (
        f'<b>Thank you for choosing BS Engineering!</b> | '
        f'Generated: {datetime.now().strftime("%B %d, %Y at %I:%M %p")}<br/>'
        f'Questions? Contact us: {settings.COMPANY_INFO["email"]} | '
        f'{settings.COMPANY_INFO["phone"]} | '
        f'<i>Your trusted engineering partner</i>'
    )
    story.append(Paragraph(footer_text, footer_style))
    
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
