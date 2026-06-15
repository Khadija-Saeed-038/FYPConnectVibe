from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from chats.models import ChatRoom, Message

User = get_user_model()


class ChatEndpointTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="alice", password="pw" * 6)
        self.bob = User.objects.create_user(username="bob", password="pw" * 6)
        self.carol = User.objects.create_user(username="carol", password="pw" * 6)
        self.client.force_authenticate(user=self.alice)

    def _make_room(self, *users):
        room = ChatRoom.objects.create()
        room.participants.add(*users)
        return room

    def test_list_chat_rooms_only_returns_users_rooms(self):
        mine = self._make_room(self.alice, self.bob)
        self._make_room(self.bob, self.carol)
        res = self.client.get("/api/chats/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        ids = [r["id"] for r in res.json()["results"]]
        self.assertEqual(ids, [mine.id])

    def test_create_room_adds_caller_automatically(self):
        res = self.client.post(
            "/api/chats/", {"participant_ids": [self.bob.id]}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        usernames = res.json()["participants"]
        self.assertIn("alice", usernames)
        self.assertIn("bob", usernames)

    def test_retrieve_room_as_participant(self):
        room = self._make_room(self.alice, self.bob)
        res = self.client.get(f"/api/chats/{room.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_retrieve_room_as_non_participant_returns_404(self):
        room = self._make_room(self.bob, self.carol)
        res = self.client.get(f"/api/chats/{room.id}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_put_patch_delete_disallowed(self):
        room = self._make_room(self.alice, self.bob)
        for method, kwargs in [
            ("put", {"data": {"participant_ids": [self.bob.id]}, "format": "json"}),
            ("patch", {"data": {"participant_ids": [self.bob.id]}, "format": "json"}),
            ("delete", {}),
        ]:
            res = getattr(self.client, method)(f"/api/chats/{room.id}/", **kwargs)
            self.assertEqual(
                res.status_code,
                status.HTTP_405_METHOD_NOT_ALLOWED,
                msg=f"{method} should be 405",
            )

    def test_list_messages_in_room(self):
        room = self._make_room(self.alice, self.bob)
        Message.objects.create(room=room, sender=self.alice, content="hi")
        Message.objects.create(room=room, sender=self.bob, content="hey")
        res = self.client.get(f"/api/chats/{room.id}/messages/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.json()), 2)

    def test_post_message_into_room(self):
        room = self._make_room(self.alice, self.bob)
        res = self.client.post(
            f"/api/chats/{room.id}/messages/",
            {"content": "hello world"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        body = res.json()
        self.assertEqual(body["sender"], "alice")
        self.assertEqual(body["content"], "hello world")
        self.assertEqual(Message.objects.count(), 1)

    def test_non_participant_cannot_send_message(self):
        room = self._make_room(self.bob, self.carol)
        res = self.client.post(
            f"/api/chats/{room.id}/messages/", {"content": "spam"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        res = self.client.get("/api/chats/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
