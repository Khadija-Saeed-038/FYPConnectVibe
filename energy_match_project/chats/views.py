from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import mixins, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import ChatRoom, Message
from .serializers import ChatRoomSerializer, MessageSerializer

ROOM_ID_PARAM = OpenApiParameter(
    name="id", type=OpenApiTypes.INT, location=OpenApiParameter.PATH,
    description="Chat room id.",
)


class IsParticipant(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return request.user in obj.participants.all()


@extend_schema_view(
    list=extend_schema(tags=["Chats"], description="List chat rooms the user participates in."),
    retrieve=extend_schema(tags=["Chats"], parameters=[ROOM_ID_PARAM]),
    create=extend_schema(
        tags=["Chats"],
        description="Create a chat room. The caller is auto-added; pass other users in `participant_ids`.",
    ),
)
class ChatRoomViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = ChatRoom.objects.all()
    serializer_class = ChatRoomSerializer
    permission_classes = [permissions.IsAuthenticated, IsParticipant]

    def get_queryset(self):
        return (
            self.request.user.chat_rooms.all()
            .prefetch_related("participants", "messages")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        room = serializer.save()
        room.participants.add(self.request.user)

    @extend_schema(
        tags=["Chats"],
        description="GET: list messages in a room. POST: send a message.",
        request=MessageSerializer,
        responses={200: MessageSerializer(many=True), 201: MessageSerializer},
        parameters=[ROOM_ID_PARAM],
    )
    @action(detail=True, methods=["get", "post"])
    def messages(self, request, pk=None):
        room = self.get_object()
        if request.method == "POST":
            serializer = MessageSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            msg = Message.objects.create(
                room=room,
                sender=request.user,
                content=serializer.validated_data["content"],
            )
            return Response(MessageSerializer(msg).data, status=201)

        qs = room.messages.select_related("sender").all()
        return Response(MessageSerializer(qs, many=True).data)
