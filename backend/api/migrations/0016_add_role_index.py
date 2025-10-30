# Generated manually for role persistence fix

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0015_projectexpensecategory_projectexpense'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('admin', 'Admin'),
                    ('sales', 'Sales'),
                    ('accountant', 'Accountant'),
                    ('viewer', 'Viewer')
                ],
                db_index=True,
                default='viewer',
                max_length=20
            ),
        ),
    ]
