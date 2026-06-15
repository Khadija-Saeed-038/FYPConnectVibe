"""Map latest transcript reflections to energy_vibe for match list (mirrors RN energyMatchMoodInference)."""

from __future__ import annotations

from typing import Any

from reflections.models import Reflection


def infer_energy_vibe(dominant_tone: str, sentiment_scores: dict[str, Any] | None) -> str:
    """Return good | bad | sad from dominant_tone and optional compound score."""
    tone = (dominant_tone or "").lower()
    scores = sentiment_scores or {}
    raw = scores.get("compound")
    compound: float | None
    try:
        compound = float(raw) if raw is not None else None
    except (TypeError, ValueError):
        compound = None

    if "very negative" in tone or (compound is not None and compound <= -0.35):
        return "sad"
    if "negative" in tone or (compound is not None and compound < -0.05):
        return "bad"
    if "very positive" in tone or "positive" in tone:
        return "good"
    if compound is not None and compound >= 0.05:
        return "good"
    return "good"


def bulk_latest_transcript_reflections(user_ids: list[int]) -> dict[int, Reflection]:
    """Latest Reflection per user with room=None (Firebase transcript), SQLite-friendly."""
    if not user_ids:
        return {}
    unique_ids = list({int(x) for x in user_ids})
    latest: dict[int, Reflection] = {}
    qs = (
        Reflection.objects.filter(user_id__in=unique_ids, room__isnull=True)
        .order_by("-created_at")
        .only("user_id", "dominant_tone", "sentiment_scores", "created_at")
    )
    for ref in qs:
        if ref.user_id not in latest:
            latest[ref.user_id] = ref
        if len(latest) == len(unique_ids):
            break
    return latest


def attach_energy_vibes_to_ranked(ranked: list[dict]) -> list[dict]:
    """Mutate each row with energy_vibe, latest_reflection_tone, reflection_updated_at."""
    user_ids = [int(row["profile"].user_id) for row in ranked]
    latest_by_uid = bulk_latest_transcript_reflections(user_ids)
    for row in ranked:
        uid = int(row["profile"].user_id)
        ref = latest_by_uid.get(uid)
        if ref is not None:
            row["energy_vibe"] = infer_energy_vibe(
                ref.dominant_tone, ref.sentiment_scores or {}
            )
            row["latest_reflection_tone"] = ref.dominant_tone
            row["reflection_updated_at"] = ref.created_at
        else:
            row["energy_vibe"] = None
            row["latest_reflection_tone"] = None
            row["reflection_updated_at"] = None
    return ranked
