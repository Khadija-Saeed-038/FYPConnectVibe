from rest_framework import serializers

from accounts.serializers import UserProfileSerializer


class MatchSerializer(serializers.Serializer):
    profile = UserProfileSerializer()
    interest_similarity = serializers.FloatField()
    mood_compatibility = serializers.FloatField()
    compatibility_score = serializers.FloatField()
    energy_vibe = serializers.CharField(allow_null=True, required=False)
    latest_reflection_tone = serializers.CharField(allow_null=True, required=False)
    reflection_updated_at = serializers.DateTimeField(allow_null=True, required=False)
