# Generated for jobsite feature

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_delivery_deliveryitem'),
    ]

    operations = [
        migrations.CreateModel(
            name='Jobsite',
            fields=[
                ('jobsite_id', models.AutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=255, unique=True)),
                ('address', models.CharField(blank=True, default='', max_length=512)),
                ('notes', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='jobsites_created', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddField(
            model_name='inventoryitem',
            name='jobsite',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='items', to='api.jobsite'),
        ),
        migrations.AddField(
            model_name='delivery',
            name='jobsite',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='deliveries', to='api.jobsite'),
        ),
    ]
