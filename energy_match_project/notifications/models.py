from django.conf import settings
from django.db import models

from utils.models import BaseModel


class Notification(BaseModel):
    class Kind(models.TextChoices):
        NEW_MATCH = "new_match", "New Match"
        NEW_MESSAGE = "new_message", "New Message"
        REFLECTION = "reflection", "Reflection"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    kind = models.CharField(max_length=32, choices=Kind.choices)
    message = models.CharField(max_length=255)
    payload = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["recipient", "is_read"])]

    def __str__(self):
        return f"Notification<{self.recipient.username}: {self.kind}>"
