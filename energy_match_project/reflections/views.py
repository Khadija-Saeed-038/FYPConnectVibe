from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from chats.models import ChatRoom

from .models import Reflection
from .serializers import (
    ReflectionSerializer,
    TranscriptReflectionRequestSerializer,
)
from .services import analyze_room, analyze_transcript


@extend_schema(
    tags=["Reflections"],
    summary="Generate a Conversation Reflection",
    description=(
        "Runs VADER sentiment analysis across every message in the room, "
        "stores the aggregated tone, dominant sentiment, and a heuristic "
        "summary as a Reflection owned by the caller."
    ),
    request=None,
    responses={201: ReflectionSerializer},
)
class GenerateReflectionView(APIView):
    """POST /api/reflections/rooms/<room_id>/"""

    def post(self, request, room_id):
        room = get_object_or_404(ChatRoom, pk=room_id, participants=request.user)
        analysis = analyze_room(room)
        reflection = Reflection.objects.create(
            user=request.user,
            room=room,
            summary=analysis["summary"],
            sentiment_scores=analysis["sentiment_scores"],
            dominant_tone=analysis["dominant_tone"],
        )
        return Response(
            ReflectionSerializer(reflection).data, status=status.HTTP_201_CREATED
        )


@extend_schema_view(
    get=extend_schema(
        tags=["Reflections"],
        description="List the authenticated user's saved reflections.",
    ),
)
class ReflectionListView(generics.ListAPIView):
    serializer_class = ReflectionSerializer

    def get_queryset(self):
        return Reflection.objects.filter(user=self.request.user)


@extend_schema(
    tags=["Reflections"],
    summary="Reflect on a message transcript (e.g. Firebase chat)",
    description=(
        "Runs the same VADER + summary pipeline as room-based reflection, "
        "without requiring a Django ChatRoom. Persists a Reflection with "
        "`room` null. Message count and total character limits apply."
    ),
    request=TranscriptReflectionRequestSerializer,
    responses={201: ReflectionSerializer},
)
class FromTranscriptReflectionView(APIView):
    """POST /api/reflections/from-transcript/"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ser = TranscriptReflectionRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        rows = [
            (m.get("sender") or "participant", m["content"])
            for m in ser.validated_data["messages"]
        ]
        analysis = analyze_transcript(rows)
        reflection = Reflection.objects.create(
            user=request.user,
            room=None,
            summary=analysis["summary"],
            sentiment_scores=analysis["sentiment_scores"],
            dominant_tone=analysis["dominant_tone"],
        )
        return Response(
            ReflectionSerializer(reflection).data, status=status.HTTP_201_CREATED
        )
