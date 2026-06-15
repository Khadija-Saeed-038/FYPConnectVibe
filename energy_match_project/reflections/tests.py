from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from chats.models import ChatRoom, Message
from reflections.models import Reflection

User = get_user_model()


class ReflectionEndpointTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="alice", password="pw" * 6)
        self.bob = User.objects.create_user(username="bob", password="pw" * 6)
        self.eve = User.objects.create_user(username="eve", password="pw" * 6)
        self.room = ChatRoom.objects.create()
        self.room.participants.add(self.alice, self.bob)
        Message.objects.create(room=self.room, sender=self.alice, content="I love this!")
        Message.objects.create(room=self.room, sender=self.bob, content="Me too, this is amazing.")
        Message.objects.create(room=self.room, sender=self.alice, content="Today was awful though.")
        self.client.force_authenticate(user=self.alice)

    def test_generate_reflection_returns_payload(self):
        res = self.client.post(f"/api/reflections/rooms/{self.room.id}/")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        body = res.json()
        self.assertIn("summary", body)
        self.assertIn("sentiment_scores", body)
        self.assertIn("compound", body["sentiment_scores"])
        self.assertIn(
            body["dominant_tone"],
            {"very negative", "negative", "neutral", "positive", "very positive"},
        )
        self.assertEqual(Reflection.objects.count(), 1)

    def test_non_participant_cannot_reflect_on_room(self):
        self.client.force_authenticate(user=self.eve)
        res = self.client.post(f"/api/reflections/rooms/{self.room.id}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_list_reflections_only_returns_callers_records(self):
        Reflection.objects.create(
            user=self.alice, room=self.room, summary="hers",
            sentiment_scores={"compound": 0.5}, dominant_tone="positive",
        )
        Reflection.objects.create(
            user=self.bob, room=self.room, summary="his",
            sentiment_scores={"compound": -0.1}, dominant_tone="neutral",
        )
        res = self.client.get("/api/reflections/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        body = res.json()
        self.assertEqual(body["count"], 1)
        self.assertEqual(body["results"][0]["summary"], "hers")

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        res = self.client.post(f"/api/reflections/rooms/{self.room.id}/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_from_transcript_creates_reflection_without_django_room(self):
        payload = {
            "messages": [
                {"content": "I love this!", "sender": "alice"},
                {"content": "Me too!", "sender": "bob"},
            ]
        }
        res = self.client.post("/api/reflections/from-transcript/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        body = res.json()
        self.assertIn("summary", body)
        self.assertIsNone(body.get("room"))
        self.assertEqual(Reflection.objects.filter(user=self.alice).count(), 1)
        ref = Reflection.objects.get(user=self.alice)
        self.assertIsNone(ref.room)
