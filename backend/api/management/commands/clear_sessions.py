"""
Management command to clear all sessions
Use this if CSRF issues persist
"""
from django.core.management.base import BaseCommand
from django.contrib.sessions.models import Session


class Command(BaseCommand):
    help = 'Clear all sessions to fix CSRF token issues'

    def handle(self, *args, **options):
        count = Session.objects.all().count()
        Session.objects.all().delete()
        self.stdout.write(
            self.style.SUCCESS(f'Successfully cleared {count} sessions')
        )
        self.stdout.write(
            self.style.WARNING('Users will need to log in again')
        )
