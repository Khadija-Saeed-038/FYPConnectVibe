"""Helpers to fan out match notifications (FR-10)."""
from __future__ import annotations

from datetime import timedelta

from django.utils import timezone

from .models import Notification

DEDUPE_WINDOW = timedelta(hours=6)
MIN_SCORE_FOR_NOTIFY = 0.5


def notify_new_matches(viewer, ranked_matches: list[dict]) -> int:
    """For each high-quality match, alert the matched user.

    Skips if a similar unread notification was created in the last 6 hours.
    Returns the number of notifications created.
    """
    cutoff = timezone.now() - DEDUPE_WINDOW
    created = 0
    for entry in ranked_matches:
        if entry["compatibility_score"] < MIN_SCORE_FOR_NOTIFY:
            continue
        recipient = entry["profile"].user
        if recipient == viewer:
            continue

        already = Notification.objects.filter(
            recipient=recipient,
            kind=Notification.Kind.NEW_MATCH,
            payload__viewer_id=viewer.id,
            created_at__gte=cutoff,
        ).exists()
        if already:
            continue

        Notification.objects.create(
            recipient=recipient,
            kind=Notification.Kind.NEW_MATCH,
            message=f"{viewer.username} could be a great match for you.",
            payload={
                "viewer_id": viewer.id,
                "viewer_username": viewer.username,
                "compatibility_score": entry["compatibility_score"],
            },
        )
        created += 1
    return created
