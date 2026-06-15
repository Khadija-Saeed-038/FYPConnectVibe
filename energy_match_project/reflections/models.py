from django.conf import settings
from django.db import models

from chats.models import ChatRoom
from utils.models import BaseModel


class Reflection(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reflections"
    )
    room = models.ForeignKey(
        ChatRoom,
        on_delete=models.CASCADE,
        related_name="reflections",
        null=True,
        blank=True,
    )
    summary = models.TextField()
    sentiment_scores = models.JSONField(default=dict)
    dominant_tone = models.CharField(max_length=32)

    def __str__(self):
        rid = self.room_id or "external"
        return f"Reflection<user={self.user.username} room={rid}>"
