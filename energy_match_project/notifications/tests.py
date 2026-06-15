from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from notifications.models import Notification

User = get_user_model()


class NotificationEndpointTests(APITestCase):
    def setUp(self):
        self.alice = User.objects.create_user(username="alice", password="pw" * 6)
        self.bob = User.objects.create_user(username="bob", password="pw" * 6)
        self.client.force_authenticate(user=self.alice)

        self.unread = Notification.objects.create(
            recipient=self.alice,
            kind=Notification.Kind.NEW_MATCH,
            message="bob is a match",
            payload={"viewer_username": "bob"},
        )
        self.read = Notification.objects.create(
            recipient=self.alice,
            kind=Notification.Kind.NEW_MATCH,
            message="old one",
            is_read=True,
        )
        # Notification for someone else — must never leak
        Notification.objects.create(
            recipient=self.bob,
            kind=Notification.Kind.NEW_MATCH,
            message="not yours",
        )

    def test_list_returns_only_callers_notifications(self):
        res = self.client.get("/api/notifications/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        body = res.json()
        self.assertEqual(body["count"], 2)
        messages = {n["message"] for n in body["results"]}
        self.assertNotIn("not yours", messages)

    def test_unread_filter(self):
        res = self.client.get("/api/notifications/?unread=1")
        body = res.json()
        self.assertEqual(body["count"], 1)
        self.assertFalse(body["results"][0]["is_read"])

    def test_mark_one_as_read(self):
        res = self.client.post(f"/api/notifications/{self.unread.id}/read/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.json()["is_read"])
        self.unread.refresh_from_db()
        self.assertTrue(self.unread.is_read)

    def test_cannot_mark_someone_elses_notification(self):
        other = Notification.objects.filter(recipient=self.bob).first()
        res = self.client.post(f"/api/notifications/{other.id}/read/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_mark_all_read(self):
        res = self.client.post("/api/notifications/read-all/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["marked_read"], 1)
        self.assertEqual(
            Notification.objects.filter(recipient=self.alice, is_read=False).count(), 0
        )
        # Did not affect bob's
        self.assertEqual(
            Notification.objects.filter(recipient=self.bob, is_read=False).count(), 1
        )

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        res = self.client.get("/api/notifications/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
