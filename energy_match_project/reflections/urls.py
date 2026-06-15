from django.urls import path

from .views import (
    FromTranscriptReflectionView,
    GenerateReflectionView,
    ReflectionListView,
)

urlpatterns = [
    path(
        "from-transcript/",
        FromTranscriptReflectionView.as_view(),
        name="reflection-from-transcript",
    ),
    path("", ReflectionListView.as_view(), name="reflection-list"),
    path(
        "rooms/<int:room_id>/",
        GenerateReflectionView.as_view(),
        name="reflection-generate",
    ),
]
