from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import InterestViewSet, MyProfileView, ProfileDetailView

router = DefaultRouter()
router.register("interests", InterestViewSet, basename="interest")

urlpatterns = [
    path("me/", MyProfileView.as_view(), name="my-profile"),
    path("profiles/<int:user_id>/", ProfileDetailView.as_view(), name="profile-detail"),
    path("", include(router.urls)),
]
