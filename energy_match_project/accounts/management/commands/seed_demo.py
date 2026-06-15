"""Seed demo interests + sample users with profiles, plus a chat with messages.

Run:  python manage.py seed_demo
"""
from __future__ import annotations

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from accounts.models import AvailabilityStatus, Interest, Mood
from chats.models import ChatRoom, Message

User = get_user_model()

INTERESTS = [
    "music", "movies", "gaming", "reading", "hiking",
    "cooking", "travel", "photography", "fitness", "art",
    "tech", "anime", "writing", "yoga", "coffee",
]

USERS = [
    {
        "username": "alice", "password": "demopass123",
        "mood": Mood.HAPPY, "availability": AvailabilityStatus.AVAILABLE,
        "interests": ["music", "movies", "travel", "coffee", "art"],
        "bio": "Loves indie films and weekend road trips.",
    },
    {
        "username": "bob", "password": "demopass123",
        "mood": Mood.ENERGETIC, "availability": AvailabilityStatus.AVAILABLE,
        "interests": ["gaming", "tech", "anime", "music"],
        "bio": "Gamer / hobby coder.",
    },
    {
        "username": "carol", "password": "demopass123",
        "mood": Mood.CALM, "availability": AvailabilityStatus.AVAILABLE,
        "interests": ["reading", "yoga", "coffee", "writing"],
        "bio": "Bookworm and tea (sometimes coffee) drinker.",
    },
    {
        "username": "dave", "password": "demopass123",
        "mood": Mood.SAD, "availability": AvailabilityStatus.AVAILABLE,
        "interests": ["music", "writing", "movies", "photography"],
        "bio": "Songwriting through the gloomy days.",
    },
    {
        "username": "eve", "password": "demopass123",
        "mood": Mood.HAPPY, "availability": AvailabilityStatus.BUSY,
        "interests": ["hiking", "fitness", "travel", "photography", "yoga"],
        "bio": "Outdoors all weekend.",
    },
    {
        "username": "frank", "password": "demopass123",
        "mood": Mood.ANXIOUS, "availability": AvailabilityStatus.AVAILABLE,
        "interests": ["tech", "reading", "coffee", "writing"],
        "bio": "Caffeinated and overthinking it.",
    },
]

DEMO_MESSAGES = [
    ("alice", "Hey! Loved your travel pics — where was that mountain shot?"),
    ("bob", "Thanks! That was Banff last summer. Best trip ever."),
    ("alice", "Stunning. I've been meaning to get out there."),
    ("bob", "You'd love it. Honestly the lakes are surreal."),
    ("alice", "I'm a bit burnt out lately though, work has been rough."),
    ("bob", "Sorry to hear that. A trip might be exactly what you need."),
    ("alice", "Yeah, you're probably right. Thanks for the cheer up :)"),
]


class Command(BaseCommand):
    help = "Seed demo interests, users, profiles, and a sample chat."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Seeding interests...")
        interest_map = {}
        for name in INTERESTS:
            obj, _ = Interest.objects.get_or_create(name=name)
            interest_map[name] = obj

        self.stdout.write("Seeding users + profiles...")
        users = {}
        for spec in USERS:
            user, created = User.objects.get_or_create(
                username=spec["username"],
                defaults={"email": f"{spec['username']}@example.com"},
            )
            if created:
                user.set_password(spec["password"])
                user.save()
            profile = user.profile
            profile.mood = spec["mood"]
            profile.availability = spec["availability"]
            profile.bio = spec["bio"]
            profile.save()
            profile.interests.set([interest_map[n] for n in spec["interests"]])
            users[spec["username"]] = user
            tag = "created" if created else "exists"
            self.stdout.write(f"  {spec['username']:<8} ({tag})  pw={spec['password']}")

        self.stdout.write("Seeding sample chat between alice and bob...")
        alice, bob = users["alice"], users["bob"]
        room = (
            ChatRoom.objects.filter(participants=alice)
            .filter(participants=bob)
            .first()
        )
        if room is None:
            room = ChatRoom.objects.create()
            room.participants.add(alice, bob)
            for sender_name, content in DEMO_MESSAGES:
                Message.objects.create(
                    room=room, sender=users[sender_name], content=content
                )
            self.stdout.write(f"  chat room id={room.id} created with {len(DEMO_MESSAGES)} messages")
        else:
            self.stdout.write(f"  chat room id={room.id} already exists, skipping messages")

        self.stdout.write(self.style.SUCCESS("Done. Try logging in as alice / demopass123."))
