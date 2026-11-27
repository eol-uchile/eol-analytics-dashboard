
# -*- coding: utf-8 -*-
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='DataFile',
            fields=[
                (
                    'id',
                    models.AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID'
                    ),
                ),
                (
                    'key',
                    models.CharField(
                        max_length=50,
                        choices=[
                            ('uid_mapping', 'Mapeo user_id staging -> prod (CSV)'),
                            ('evaluaciones', 'Evaluaciones mock (JSON)'),
                            ('metricas', 'Métricas mock (JSON)'),
                            ('dashboard', 'Dashboard mock (JSON)'),
                        ],
                    ),
                ),
                (
                    'file',
                    models.FileField(
                        upload_to='eol_analitycs_dashboard/data_files/'
                    ),
                ),
                (
                    'uploaded_at',
                    models.DateTimeField(auto_now_add=True),
                ),
            ],
            options={
                'verbose_name': 'archivo de datos',
                'verbose_name_plural': 'archivos de datos',
                'ordering': ('-uploaded_at',),
            },
        ),
    ]
