from django.shortcuts import get_object_or_404
from drf_spectacular.utils import (
    OpenApiParameter,
    extend_schema,
    extend_schema_view,
    inline_serializer,
)
from rest_framework import generics, serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


@extend_schema_view(
    get=extend_schema(
        tags=["Notifications"],
        description="List the authenticated user's notifications. Use `?unread=1` to filter to unread only.",
        parameters=[
            OpenApiParameter(
                name="unread",
                description="Pass `1` to return only unread notifications.",
                required=False,
                type=str,
            ),
        ],
    ),
)
class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        qs = Notification.objects.filter(recipient=self.request.user)
        unread = self.request.query_params.get("unread")
        if unread in ("1", "true", "True"):
            qs = qs.filter(is_read=False)
        return qs


@extend_schema(
    tags=["Notifications"],
    description="Mark a single notification as read.",
    request=None,
    responses={200: NotificationSerializer},
)
class MarkReadView(APIView):
    def post(self, request, pk):
        notif = get_object_or_404(Notification, pk=pk, recipient=request.user)
        notif.is_read = True
        notif.save(update_fields=["is_read"])
        return Response(NotificationSerializer(notif).data)


@extend_schema(
    tags=["Notifications"],
    description="Mark all of the caller's unread notifications as read.",
    request=None,
    responses={
        200: inline_serializer(
            name="MarkAllReadResponse",
            fields={"marked_read": serializers.IntegerField()},
        )
    },
)
class MarkAllReadView(APIView):
    def post(self, request):
        updated = Notification.objects.filter(
            recipient=request.user, is_read=False
        ).update(is_read=True)
        return Response({"marked_read": updated})
