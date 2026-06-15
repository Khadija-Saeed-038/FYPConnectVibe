from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer
from rest_framework import generics, permissions, serializers, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Interest, UserProfile
from .serializers import (
    InterestSerializer,
    SignupSerializer,
    UserProfileSerializer,
)


@extend_schema(
    tags=["Auth"],
    summary="Sign up",
    description=(
        "Create a new user with optional initial profile fields "
        "(`mood`, `availability`, `bio`, `interest_ids`) and immediately "
        "receive a fixed auth token — no separate login call needed."
    ),
    request=SignupSerializer,
    responses={
        201: inline_serializer(
            name="SignupResponse",
            fields={
                "user": inline_serializer(
                    name="SignupUser",
                    fields={
                        "id": serializers.IntegerField(),
                        "username": serializers.CharField(),
                        "email": serializers.EmailField(),
                    },
                ),
                "profile": UserProfileSerializer(),
                "token": serializers.CharField(),
            },
        ),
    },
)
class SignupView(APIView):
    """POST /api/auth/signup/"""

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
                "profile": UserProfileSerializer(user.profile).data,
                "token": token.key,
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema_view(
    list=extend_schema(tags=["Interests"], description="List all interests in the catalog."),
    retrieve=extend_schema(tags=["Interests"]),
)
class InterestViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only API. Catalog is managed by admins through the Django admin."""

    queryset = Interest.objects.all()
    serializer_class = InterestSerializer
    permission_classes = [permissions.IsAuthenticated]


@extend_schema_view(
    get=extend_schema(tags=["Accounts"], description="Get the authenticated user's profile."),
    patch=extend_schema(
        tags=["Accounts"],
        description="Update mood, availability, bio, or interest_ids (FR-8).",
    ),
)
class MyProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self):
        return self.request.user.profile


@extend_schema(tags=["Accounts"], description="Read another user's public profile.")
class ProfileDetailView(generics.RetrieveAPIView):
    queryset = UserProfile.objects.select_related("user").prefetch_related("interests")
    serializer_class = UserProfileSerializer
    lookup_field = "user_id"
