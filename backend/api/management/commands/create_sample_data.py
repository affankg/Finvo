from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import Client, Service, Quotation, QuotationItem, Invoice, InvoiceItem, ActivityLog
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Create sample data for the BS Engineering system'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Creating sample data...'))

        # Create admin user
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@bsengineering.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'admin',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(f'Created admin user: admin/admin123')

        # Create other users
        users_data = [
            {
                'username': 'sales1',
                'email': 'sales1@bsengineering.com',
                'first_name': 'John',
                'last_name': 'Sales',
                'role': 'sales',
                'password': 'sales123'
            },
            {
                'username': 'accountant1',
                'email': 'accountant1@bsengineering.com',
                'first_name': 'Jane',
                'last_name': 'Finance',
                'role': 'accountant',
                'password': 'acc123'
            },
            {
                'username': 'viewer1',
                'email': 'viewer1@bsengineering.com',
                'first_name': 'Mike',
                'last_name': 'Viewer',
                'role': 'viewer',
                'password': 'view123'
            },
        ]

        for user_data in users_data:
            user, created = User.objects.get_or_create(
                username=user_data['username'],
                defaults={
                    'email': user_data['email'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'role': user_data['role'],
                }
            )
            if created:
                user.set_password(user_data['password'])
                user.save()
                self.stdout.write(f'Created user: {user_data["username"]}/{user_data["password"]}')

        # Create sample clients
        clients_data = [
            {
                'name': 'Tech Solutions Inc.',
                'email': 'contact@techsolutions.com',
                'phone': '+1-555-0101',
                'address': '123 Tech Street, Silicon Valley, CA 94000'
            },
            {
                'name': 'Manufacturing Corp',
                'email': 'procurement@manufacturing.com',
                'phone': '+1-555-0102',
                'address': '456 Industrial Ave, Detroit, MI 48000'
            },
            {
                'name': 'Healthcare Systems',
                'email': 'admin@healthsystems.com',
                'phone': '+1-555-0103',
                'address': '789 Medical Center Dr, Houston, TX 77000'
            },
            {
                'name': 'Financial Services Ltd.',
                'email': 'info@financialservices.com',
                'phone': '+1-555-0104',
                'address': '321 Wall Street, New York, NY 10000'
            },
            {
                'name': 'Education Institute',
                'email': 'contact@education.edu',
                'phone': '+1-555-0105',
                'address': '654 University Blvd, Boston, MA 02000'
            },
        ]

        for client_data in clients_data:
            client, created = Client.objects.get_or_create(
                email=client_data['email'],
                defaults=client_data
            )
            if created:
                self.stdout.write(f'Created client: {client.name}')

        # Create sample services
        services_data = [
            {
                'name': 'Software Development',
                'description': 'Custom software development services including web applications, mobile apps, and enterprise solutions.',
                'price': Decimal('5000.00')
            },
            {
                'name': 'System Integration',
                'description': 'Integration of various systems and platforms to ensure seamless data flow and business processes.',
                'price': Decimal('3500.00')
            },
            {
                'name': 'Database Design & Management',
                'description': 'Database architecture, design, optimization, and ongoing management services.',
                'price': Decimal('2500.00')
            },
            {
                'name': 'Cloud Migration',
                'description': 'Migration of existing systems to cloud platforms with minimal downtime and maximum efficiency.',
                'price': Decimal('4000.00')
            },
            {
                'name': 'Technical Consulting',
                'description': 'Expert technical consulting for technology strategy, architecture decisions, and best practices.',
                'price': Decimal('1500.00')
            },
            {
                'name': 'Security Audit',
                'description': 'Comprehensive security assessment and vulnerability testing for applications and infrastructure.',
                'price': Decimal('3000.00')
            },
            {
                'name': 'Training & Support',
                'description': 'User training and ongoing technical support for implemented solutions.',
                'price': Decimal('1000.00')
            },
            {
                'name': 'API Development',
                'description': 'Custom API development and integration services for third-party applications.',
                'price': Decimal('2000.00')
            },
        ]

        for service_data in services_data:
            service, created = Service.objects.get_or_create(
                name=service_data['name'],
                defaults=service_data
            )
            if created:
                self.stdout.write(f'Created service: {service.name}')

        # Create sample quotations
        clients = list(Client.objects.all())
        services = list(Service.objects.all())
        sales_users = list(User.objects.filter(role__in=['admin', 'sales']))

        # Check if quotations already exist
        if Quotation.objects.count() > 0:
            self.stdout.write('Quotations already exist, skipping creation.')
        else:
            for i in range(10):
                client = random.choice(clients)
                created_by = random.choice(sales_users)
                
                quotation = Quotation.objects.create(
                    client=client,
                    date=timezone.now().date() - timedelta(days=random.randint(1, 90)),
                    validity=random.choice([15, 30, 45, 60]),
                    notes=f'Sample quotation for {client.name}. This is a test quotation with sample services.',
                    created_by=created_by
                )

            # Add 2-4 services to each quotation
            num_services = random.randint(2, 4)
            selected_services = random.sample(services, num_services)
            
            for service in selected_services:
                QuotationItem.objects.create(
                    quotation=quotation,
                    service=service,
                    quantity=random.randint(1, 3),
                    price=service.price * Decimal(random.uniform(0.8, 1.2)),  # ±20% price variation
                    description=f'Customized {service.name.lower()} for {client.name}'
                )

            self.stdout.write(f'Created quotation: {quotation.number}')

        # Create sample invoices (convert some quotations to invoices)
        quotations = list(Quotation.objects.all()[:6])  # Convert 6 quotations to invoices
        
        # Check if invoices already exist
        if Invoice.objects.count() > 0:
            self.stdout.write('Invoices already exist, skipping creation.')
        else:
            for quotation in quotations:
                invoice = Invoice.objects.create(
                    quotation=quotation,
                    client=quotation.client,
                    date=quotation.date + timedelta(days=random.randint(1, 30)),
                    due_date=quotation.date + timedelta(days=random.randint(31, 60)),
                    status=random.choice(['draft', 'sent', 'paid', 'overdue']),
                    notes=quotation.notes,
                    created_by=quotation.created_by
                )

                # Copy quotation items to invoice items
                for qitem in quotation.items.all():
                    InvoiceItem.objects.create(
                        invoice=invoice,
                        service=qitem.service,
                        quantity=qitem.quantity,
                        price=qitem.price,
                        description=qitem.description
                    )

                self.stdout.write(f'Created invoice: {invoice.number}')

        # Create some activity logs
        all_users = list(User.objects.all())
        activities = [
            'Created new client',
            'Updated service pricing',
            'Generated quotation PDF',
            'Sent invoice via email',
            'Updated client information',
            'Created new service offering',
        ]

        for i in range(20):
            ActivityLog.objects.create(
                user=random.choice(all_users),
                action=random.choice(['create', 'update', 'view']),
                content_type=random.choice(['client', 'service', 'quotation', 'invoice']),
                object_id=random.randint(1, 10),
                description=random.choice(activities)
            )

        self.stdout.write(self.style.SUCCESS('Sample data creation completed!'))
        self.stdout.write(self.style.SUCCESS('You can now login with:'))
        self.stdout.write('- Admin: admin/admin123')
        self.stdout.write('- Sales: sales1/sales123')
        self.stdout.write('- Accountant: accountant1/acc123')
        self.stdout.write('- Viewer: viewer1/view123')
