from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import AvailabilityStatus, Interest, Mood, UserProfile

User = get_user_model()


class AuthEndpointsTests(APITestCase):
    def setUp(self):
        self.music = Interest.objects.create(name="music")
        self.movies = Interest.objects.create(name="movies")

    def test_signup_creates_user_profile_and_returns_token(self):
        url = reverse("signup")
        payload = {
            "username": "grace",
            "email": "g@example.com",
            "password": "supersecret123",
            "password_confirm": "supersecret123",
            "mood": "calm",
            "availability": "available",
            "bio": "hi",
            "interest_ids": [self.music.id],
        }
        res = self.client.post(url, payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        body = res.json()
        self.assertIn("token", body)
        self.assertTrue(len(body["token"]) >= 40)
        self.assertEqual(body["user"]["username"], "grace")
        self.assertEqual(body["profile"]["mood"], "calm")
        self.assertEqual(len(body["profile"]["interests"]), 1)

    def test_signup_rejects_password_mismatch(self):
        url = reverse("signup")
        res = self.client.post(
            url,
            {
                "username": "grace",
                "email": "g@example.com",
                "password": "supersecret123",
                "password_confirm": "different12345",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password_confirm", res.json())

    def test_signup_rejects_duplicate_username(self):
        User.objects.create_user(
            username="taken", email="taken@example.com", password="x" * 12
        )
        url = reverse("signup")
        res = self.client.post(
            url,
            {
                "username": "taken",
                "email": "fresh@example.com",
                "password": "supersecret123",
                "password_confirm": "supersecret123",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", res.json())

    def test_signup_rejects_duplicate_email(self):
        User.objects.create_user(
            username="alice", email="alice@example.com", password="x" * 12
        )
        url = reverse("signup")
        res = self.client.post(
            url,
            {
                "username": "freshname",
                "email": "ALICE@example.com",
                "password": "supersecret123",
                "password_confirm": "supersecret123",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", res.json())

    def test_signup_requires_email(self):
        url = reverse("signup")
        res = self.client.post(
            url,
            {
                "username": "noemail",
                "password": "supersecret123",
                "password_confirm": "supersecret123",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", res.json())

    def test_login_with_email_returns_token(self):
        User.objects.create_user(
            username="alice", email="alice@example.com", password="pw" * 6
        )
        res = self.client.post(
            reverse("login"),
            {"email": "alice@example.com", "password": "pw" * 6},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        body = res.json()
        self.assertIn("token", body)
        self.assertTrue(len(body["token"]) >= 40)

    def test_login_email_is_case_insensitive(self):
        User.objects.create_user(
            username="alice", email="alice@example.com", password="pw" * 6
        )
        res = self.client.post(
            reverse("login"),
            {"email": "ALICE@Example.COM", "password": "pw" * 6},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("token", res.json())

    def test_login_with_wrong_password_fails(self):
        User.objects.create_user(
            username="alice", email="alice@example.com", password="pw" * 6
        )
        res = self.client.post(
            reverse("login"),
            {"email": "alice@example.com", "password": "wrongpassword"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_unknown_email_fails(self):
        res = self.client.post(
            reverse("login"),
            {"email": "ghost@example.com", "password": "pw" * 6},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_token_authenticates_subsequent_requests(self):
        User.objects.create_user(
            username="alice", email="alice@example.com", password="pw" * 6
        )
        login = self.client.post(
            reverse("login"),
            {"email": "alice@example.com", "password": "pw" * 6},
            format="json",
        ).json()
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {login['token']}")
        res = self.client.get(reverse("my-profile"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["username"], "alice")

    def test_login_returns_same_token_each_time(self):
        User.objects.create_user(
            username="alice", email="alice@example.com", password="pw" * 6
        )
        first = self.client.post(
            reverse("login"),
            {"email": "alice@example.com", "password": "pw" * 6},
            format="json",
        ).json()["token"]
        second = self.client.post(
            reverse("login"),
            {"email": "alice@example.com", "password": "pw" * 6},
            format="json",
        ).json()["token"]
        self.assertEqual(first, second)


class ProfileEndpointsTests(APITestCase):
    def setUp(self):
        self.music = Interest.objects.create(name="music")
        self.movies = Interest.objects.create(name="movies")
        self.alice = User.objects.create_user(username="alice", password="pw" * 6)
        self.bob = User.objects.create_user(username="bob", password="pw" * 6)
        self.client.force_authenticate(user=self.alice)

    def test_get_my_profile(self):
        res = self.client.get(reverse("my-profile"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        body = res.json()
        self.assertEqual(body["username"], "alice")
        self.assertEqual(body["mood"], Mood.NEUTRAL)
        self.assertEqual(body["availability"], AvailabilityStatus.AVAILABLE)

    def test_patch_my_profile_updates_fields(self):
        res = self.client.patch(
            reverse("my-profile"),
            {
                "mood": "happy",
                "availability": "busy",
                "bio": "feeling great",
                "interest_ids": [self.music.id, self.movies.id],
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        body = res.json()
        self.assertEqual(body["mood"], "happy")
        self.assertEqual(body["availability"], "busy")
        self.assertEqual(body["bio"], "feeling great")
        self.assertEqual({i["name"] for i in body["interests"]}, {"music", "movies"})

    def test_put_is_disallowed_on_my_profile(self):
        res = self.client.put(reverse("my-profile"), {"mood": "happy"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_unauthenticated_my_profile_returns_401(self):
        self.client.force_authenticate(user=None)
        res = self.client.get(reverse("my-profile"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_other_users_profile(self):
        res = self.client.get(reverse("profile-detail", args=[self.bob.id]))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["username"], "bob")


class InterestEndpointsTests(APITestCase):
    def setUp(self):
        Interest.objects.create(name="music")
        Interest.objects.create(name="reading")
        self.user = User.objects.create_user(username="alice", password="pw" * 6)
        self.client.force_authenticate(user=self.user)

    def test_list_interests(self):
        res = self.client.get("/api/accounts/interests/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        body = res.json()
        self.assertEqual(body["count"], 2)
        names = {i["name"] for i in body["results"]}
        self.assertSetEqual(names, {"music", "reading"})

    def test_post_interest_is_disallowed(self):
        res = self.client.post(
            "/api/accounts/interests/", {"name": "yoga"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_delete_interest_is_disallowed(self):
        i = Interest.objects.first()
        res = self.client.delete(f"/api/accounts/interests/{i.id}/")
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
