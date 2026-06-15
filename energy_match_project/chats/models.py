from django.conf import settings
from django.db import models

from utils.models import BaseModel


class ChatRoom(BaseModel):
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL, related_name="chat_rooms"
    )

    def __str__(self):
        names = ", ".join(self.participants.values_list("username", flat=True))
        return f"ChatRoom<{names}>"


class Message(BaseModel):
    room = models.ForeignKey(
        ChatRoom, on_delete=models.CASCADE, related_name="messages"
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="messages"
    )
    content = models.TextField()

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender.username}: {self.content[:30]}"
