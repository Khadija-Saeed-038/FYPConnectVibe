# Generated manually for Firebase transcript reflections (no Django ChatRoom).

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chats", "0001_initial"),
        ("reflections", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="reflection",
            name="room",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="reflections",
                to="chats.chatroom",
            ),
        ),
    ]
