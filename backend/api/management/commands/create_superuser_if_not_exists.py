from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import IntegrityError
import os

User = get_user_model()

class Command(BaseCommand):
    help = 'Create a superuser for production deployment'

    def handle(self, *args, **options):
        username = os.getenv('DJANGO_SUPERUSER_USERNAME', 'admin')
        email = os.getenv('DJANGO_SUPERUSER_EMAIL', 'admin@example.com')
        password = os.getenv('DJANGO_SUPERUSER_PASSWORD', 'admin123')

        try:
            if not User.objects.filter(username=username).exists():
                User.objects.create_superuser(
                    username=username,
                    email=email,
                    password=password
                )
                self.stdout.write(
                    self.style.SUCCESS(f'Superuser {username} created successfully!')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Superuser {username} already exists!')
                )
        except IntegrityError:
            self.stdout.write(
                self.style.ERROR('Error creating superuser!')
            )
