from rest_framework import serializers

from .models import Reflection
from .services import MAX_CONTENT_PER_MESSAGE, MAX_TRANSCRIPT_MESSAGES, MAX_TRANSCRIPT_TOTAL_CHARS


class TranscriptItemSerializer(serializers.Serializer):
    """One chat line from an external source (e.g. Firebase RTDB)."""

    content = serializers.CharField(max_length=MAX_CONTENT_PER_MESSAGE)
    sender = serializers.CharField(max_length=150, required=False, default="participant")


class TranscriptReflectionRequestSerializer(serializers.Serializer):
    messages = serializers.ListField(
        child=TranscriptItemSerializer(),
        min_length=1,
        max_length=MAX_TRANSCRIPT_MESSAGES,
    )

    def validate_messages(self, msgs):
        total = sum(len(str(m.get("content") or "")) for m in msgs)
        if total > MAX_TRANSCRIPT_TOTAL_CHARS:
            raise serializers.ValidationError(
                f"Transcript exceeds maximum size ({MAX_TRANSCRIPT_TOTAL_CHARS} characters)."
            )
        return msgs


class ReflectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reflection
        fields = [
            "id",
            "room",
            "summary",
            "sentiment_scores",
            "dominant_tone",
            "created_at",
        ]
        read_only_fields = fields
