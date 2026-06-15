from django.contrib.auth import authenticate, get_user_model
from rest_framework import serializers

from .models import Interest, UserProfile

User = get_user_model()


_INVALID_LOGIN = "Unable to log in with provided credentials."


class EmailAuthTokenSerializer(serializers.Serializer):
    """Drop-in replacement for DRF's AuthTokenSerializer that uses email."""

    email = serializers.EmailField()
    password = serializers.CharField(
        style={"input_type": "password"}, trim_whitespace=False, write_only=True
    )

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        user = User.objects.filter(email__iexact=email).first()
        if user is None:
            raise serializers.ValidationError({"non_field_errors": [_INVALID_LOGIN]})
        authed = authenticate(
            request=self.context.get("request"),
            username=user.username,
            password=password,
        )
        if not authed:
            raise serializers.ValidationError({"non_field_errors": [_INVALID_LOGIN]})
        attrs["user"] = authed
        return attrs


class InterestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interest
        fields = ["id", "name"]


class UserProfileSerializer(serializers.ModelSerializer):
    interests = InterestSerializer(many=True, read_only=True)
    interest_ids = serializers.PrimaryKeyRelatedField(
        queryset=Interest.objects.all(),
        many=True,
        write_only=True,
        source="interests",
        required=False,
    )
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            "id",
            "username",
            "bio",
            "mood",
            "availability",
            "interests",
            "interest_ids",
            "updated_at",
        ]
        read_only_fields = ["id", "updated_at", "username"]


class SignupSerializer(serializers.Serializer):
    """Richer signup: creates user + applies optional profile fields."""

    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    mood = serializers.CharField(required=False)
    availability = serializers.CharField(required=False)
    bio = serializers.CharField(required=False, allow_blank=True)
    interest_ids = serializers.PrimaryKeyRelatedField(
        queryset=Interest.objects.all(), many=True, required=False
    )

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("That username is already taken.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("That email is already in use.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        interests = validated_data.pop("interest_ids", [])
        profile_fields = {
            key: validated_data.pop(key)
            for key in ("mood", "availability", "bio")
            if key in validated_data
        }

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data.get("email", ""),
            password=validated_data["password"],
        )

        profile = user.profile
        for key, value in profile_fields.items():
            setattr(profile, key, value)
        if profile_fields:
            profile.save()
        if interests:
            profile.interests.set(interests)
        return user
