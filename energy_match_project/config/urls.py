from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import RedirectView
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework.authtoken.views import ObtainAuthToken

from accounts.serializers import EmailAuthTokenSerializer
from accounts.views import SignupView


class LoginView(ObtainAuthToken):
    """POST {email, password} → {token, user_id, email}."""

    authentication_classes = []
    serializer_class = EmailAuthTokenSerializer


urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/auth/signup/", SignupView.as_view(), name="signup"),
    path("api/auth/login/", LoginView.as_view(), name="login"),

    path("api/accounts/", include("accounts.urls")),
    path("api/matches/", include("matching.urls")),
    path("api/chats/", include("chats.urls")),
    path("api/reflections/", include("reflections.urls")),
    path("api/notifications/", include("notifications.urls")),

    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),

    re_path(
        r"^.*$",
        RedirectView.as_view(url="/api/docs/", permanent=False),
        name="catch-all",
    ),
]
