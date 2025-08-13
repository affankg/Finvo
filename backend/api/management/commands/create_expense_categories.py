"""
Management command to create default project expense categories
"""
from django.core.management.base import BaseCommand
from api.project_models import ProjectExpenseCategory


class Command(BaseCommand):
    help = 'Create default project expense categories'

    def handle(self, *args, **options):
        """Create default expense categories"""
        created_categories = ProjectExpenseCategory.get_default_categories()
        
        if created_categories:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created {len(created_categories)} default expense categories:'
                )
            )
            for category in created_categories:
                self.stdout.write(f'  - {category.name}')
        else:
            self.stdout.write(
                self.style.WARNING('All default expense categories already exist.')
            )
