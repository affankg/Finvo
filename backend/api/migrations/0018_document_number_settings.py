# Generated migration for Document Number Settings

from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0017_make_service_optional'),
    ]

    operations = [
        migrations.CreateModel(
            name='DocumentNumberSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(choices=[('invoice', 'Invoice'), ('quotation', 'Quotation'), ('project', 'Project')], max_length=20, unique=True)),
                ('prefix', models.CharField(blank=True, default='', max_length=50, validators=[django.core.validators.RegexValidator(flags=0, message='Prefix can only contain letters, numbers, and hyphens', regex='^[A-Z0-9-]*$')])),
                ('current_number', models.IntegerField(default=0, validators=[django.core.validators.MinValueValidator(0)])),
                ('padding_length', models.IntegerField(default=3, validators=[django.core.validators.MinValueValidator(1), django.core.validators.MaxValueValidator(8)])),
                ('include_year', models.BooleanField(default=False)),
                ('include_month', models.BooleanField(default=False)),
                ('reset_rule', models.CharField(choices=[('never', 'Never'), ('monthly', 'Monthly'), ('yearly', 'Yearly')], default='never', max_length=10)),
                ('last_reset_date', models.DateField(blank=True, null=True)),
                ('enabled', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Document Number Setting',
                'verbose_name_plural': 'Document Number Settings',
                'db_table': 'document_number_settings',
            },
        ),
        migrations.CreateModel(
            name='DocumentNumberHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('type', models.CharField(choices=[('invoice', 'Invoice'), ('quotation', 'Quotation'), ('project', 'Project')], max_length=20)),
                ('document_id', models.IntegerField()),
                ('generated_number', models.CharField(db_index=True, max_length=100, unique=True)),
                ('sequence_number', models.IntegerField()),
                ('date_token', models.CharField(blank=True, max_length=20, null=True)),
                ('assigned_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'verbose_name': 'Document Number History',
                'verbose_name_plural': 'Document Number History',
                'db_table': 'document_number_history',
                'ordering': ['-assigned_at'],
            },
        ),
        migrations.AddIndex(
            model_name='documentnumberhistory',
            index=models.Index(fields=['type', 'document_id'], name='document_nu_type_69fa07_idx'),
        ),
        migrations.AddIndex(
            model_name='documentnumberhistory',
            index=models.Index(fields=['generated_number'], name='document_nu_generat_1a8c99_idx'),
        ),
        # Insert default settings
        migrations.RunPython(
            lambda apps, schema_editor: insert_default_settings(apps),
            reverse_code=lambda apps, schema_editor: None,
        ),
    ]


def insert_default_settings(apps):
    """Insert default document number settings"""
    DocumentNumberSettings = apps.get_model('api', 'DocumentNumberSettings')
    
    defaults = [
        {'type': 'invoice', 'prefix': 'INV', 'enabled': False},
        {'type': 'quotation', 'prefix': 'QUO', 'enabled': False},
        {'type': 'project', 'prefix': 'PRO', 'enabled': False},
    ]
    
    for default in defaults:
        DocumentNumberSettings.objects.get_or_create(
            type=default['type'],
            defaults={
                'prefix': default['prefix'],
                'current_number': 0,
                'padding_length': 3,
                'enabled': default['enabled']
            }
        )
