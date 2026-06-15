from django.conf import settings
from django.db import models

from utils.models import BaseModel


class Mood(models.TextChoices):
    HAPPY = "happy", "Happy"
    CALM = "calm", "Calm"
    ENERGETIC = "energetic", "Energetic"
    NEUTRAL = "neutral", "Neutral"
    SAD = "sad", "Sad"
    ANXIOUS = "anxious", "Anxious"
    ANGRY = "angry", "Angry"


class AvailabilityStatus(models.TextChoices):
    AVAILABLE = "available", "Available"
    BUSY = "busy", "Busy"
    AWAY = "away", "Away"


class Interest(BaseModel):
    name = models.CharField(max_length=64, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class UserProfile(BaseModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )
    bio = models.TextField(blank=True)
    mood = models.CharField(
        max_length=16, choices=Mood.choices, default=Mood.NEUTRAL
    )
    availability = models.CharField(
        max_length=16,
        choices=AvailabilityStatus.choices,
        default=AvailabilityStatus.AVAILABLE,
    )
    interests = models.ManyToManyField(Interest, blank=True, related_name="profiles")

    def __str__(self):
        return f"Profile<{self.user.username}>"
