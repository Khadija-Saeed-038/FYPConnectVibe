from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import AvailabilityStatus, Interest, Mood
from notifications.models import Notification
from reflections.models import Reflection

User = get_user_model()


class MatchEndpointTests(APITestCase):
    def setUp(self):
        self.music = Interest.objects.create(name="music")
        self.movies = Interest.objects.create(name="movies")
        self.gaming = Interest.objects.create(name="gaming")

        self.alice = User.objects.create_user(username="alice", password="pw" * 6)
        self.alice.profile.mood = Mood.HAPPY
        self.alice.profile.availability = AvailabilityStatus.AVAILABLE
        self.alice.profile.save()
        self.alice.profile.interests.set([self.music, self.movies])

        self.bob = User.objects.create_user(username="bob", password="pw" * 6)
        self.bob.profile.mood = Mood.HAPPY
        self.bob.profile.availability = AvailabilityStatus.AVAILABLE
        self.bob.profile.save()
        self.bob.profile.interests.set([self.music, self.movies])

        self.eve = User.objects.create_user(username="eve", password="pw" * 6)
        self.eve.profile.mood = Mood.HAPPY
        self.eve.profile.availability = AvailabilityStatus.BUSY
        self.eve.profile.save()
        self.eve.profile.interests.set([self.music, self.movies])

        self.client.force_authenticate(user=self.alice)

    def test_match_list_excludes_self_and_busy_users(self):
        res = self.client.get("/api/matches/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        body = res.json()
        usernames = [r["profile"]["username"] for r in body["results"]]
        self.assertIn("bob", usernames)
        self.assertNotIn("alice", usernames)
        self.assertNotIn("eve", usernames)

    def test_match_score_is_high_for_perfect_match(self):
        res = self.client.get("/api/matches/")
        bob_entry = next(r for r in res.json()["results"] if r["profile"]["username"] == "bob")
        self.assertAlmostEqual(bob_entry["interest_similarity"], 1.0, places=4)
        self.assertAlmostEqual(bob_entry["mood_compatibility"], 1.0, places=4)
        self.assertAlmostEqual(bob_entry["compatibility_score"], 1.0, places=4)

    def test_match_creates_notification_for_matched_user(self):
        self.assertEqual(Notification.objects.filter(recipient=self.bob).count(), 0)
        self.client.get("/api/matches/")
        notifs = Notification.objects.filter(
            recipient=self.bob, kind=Notification.Kind.NEW_MATCH
        )
        self.assertEqual(notifs.count(), 1)
        self.assertEqual(notifs.first().payload["viewer_username"], "alice")

    def test_match_dedupes_notification_within_window(self):
        self.client.get("/api/matches/")
        self.client.get("/api/matches/")
        notifs = Notification.objects.filter(recipient=self.bob)
        self.assertEqual(notifs.count(), 1)

    def test_unauthenticated_returns_401(self):
        self.client.force_authenticate(user=None)
        res = self.client.get("/api/matches/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_limit_query_param_clamps(self):
        res = self.client.get("/api/matches/?limit=999")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertLessEqual(len(res.json()["results"]), 50)

    def test_match_list_includes_energy_vibe_from_latest_transcript_reflection(self):
        Reflection.objects.create(
            user=self.bob,
            room=None,
            summary="Test reflection for bob.",
            sentiment_scores={"compound": -0.2, "pos": 0.1, "neu": 0.6, "neg": 0.3},
            dominant_tone="negative",
        )
        res = self.client.get("/api/matches/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        bob_entry = next(r for r in res.json()["results"] if r["profile"]["username"] == "bob")
        self.assertEqual(bob_entry["energy_vibe"], "bad")
        self.assertEqual(bob_entry["latest_reflection_tone"], "negative")
        self.assertIsNotNone(bob_entry.get("reflection_updated_at"))

    def test_match_list_energy_vibe_null_without_reflection(self):
        self.assertFalse(
            Reflection.objects.filter(user=self.bob, room__isnull=True).exists()
        )
        res = self.client.get("/api/matches/")
        bob_entry = next(r for r in res.json()["results"] if r["profile"]["username"] == "bob")
        self.assertIsNone(bob_entry.get("energy_vibe"))
        self.assertIsNone(bob_entry.get("latest_reflection_tone"))
