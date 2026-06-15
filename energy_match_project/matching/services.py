"""Energy Match scoring: 80% interest similarity + 20% mood compatibility."""
from __future__ import annotations

from accounts.models import AvailabilityStatus, Interest, Mood, UserProfile
from utils.helpers import cosine_similarity, one_hot

INTEREST_WEIGHT = 0.8
MOOD_WEIGHT = 0.2

# Symmetric mood-compatibility lookup. Values in [0, 1].
MOOD_COMPAT = {
    (Mood.HAPPY, Mood.HAPPY): 1.0,
    (Mood.HAPPY, Mood.ENERGETIC): 0.9,
    (Mood.HAPPY, Mood.CALM): 0.7,
    (Mood.HAPPY, Mood.NEUTRAL): 0.6,
    (Mood.HAPPY, Mood.SAD): 0.3,
    (Mood.HAPPY, Mood.ANXIOUS): 0.4,
    (Mood.HAPPY, Mood.ANGRY): 0.2,

    (Mood.ENERGETIC, Mood.ENERGETIC): 1.0,
    (Mood.ENERGETIC, Mood.CALM): 0.4,
    (Mood.ENERGETIC, Mood.NEUTRAL): 0.6,
    (Mood.ENERGETIC, Mood.SAD): 0.3,
    (Mood.ENERGETIC, Mood.ANXIOUS): 0.3,
    (Mood.ENERGETIC, Mood.ANGRY): 0.3,

    (Mood.CALM, Mood.CALM): 1.0,
    (Mood.CALM, Mood.NEUTRAL): 0.8,
    (Mood.CALM, Mood.SAD): 0.7,
    (Mood.CALM, Mood.ANXIOUS): 0.8,
    (Mood.CALM, Mood.ANGRY): 0.6,

    (Mood.NEUTRAL, Mood.NEUTRAL): 0.7,
    (Mood.NEUTRAL, Mood.SAD): 0.5,
    (Mood.NEUTRAL, Mood.ANXIOUS): 0.5,
    (Mood.NEUTRAL, Mood.ANGRY): 0.4,

    (Mood.SAD, Mood.SAD): 0.8,
    (Mood.SAD, Mood.ANXIOUS): 0.7,
    (Mood.SAD, Mood.ANGRY): 0.3,

    (Mood.ANXIOUS, Mood.ANXIOUS): 0.7,
    (Mood.ANXIOUS, Mood.ANGRY): 0.3,

    (Mood.ANGRY, Mood.ANGRY): 0.5,
}


def mood_compatibility(a: str, b: str) -> float:
    return MOOD_COMPAT.get((a, b)) or MOOD_COMPAT.get((b, a)) or 0.5


def _interest_vector(profile: UserProfile, interest_ids: list[int]):
    owned = set(profile.interests.values_list("id", flat=True))
    return one_hot(owned, interest_ids)


def score_pair(me: UserProfile, other: UserProfile, interest_ids: list[int]) -> dict:
    v_me = _interest_vector(me, interest_ids)
    v_other = _interest_vector(other, interest_ids)
    interest_sim = cosine_similarity(v_me, v_other)
    mood_sim = mood_compatibility(me.mood, other.mood)
    total = INTEREST_WEIGHT * interest_sim + MOOD_WEIGHT * mood_sim
    return {
        "interest_similarity": round(interest_sim, 4),
        "mood_compatibility": round(mood_sim, 4),
        "compatibility_score": round(total, 4),
    }


def rank_matches(me: UserProfile, limit: int = 10) -> list[dict]:
    interest_ids = list(Interest.objects.values_list("id", flat=True))
    candidates = (
        UserProfile.objects.exclude(user_id=me.user_id)
        .filter(availability=AvailabilityStatus.AVAILABLE)
        .select_related("user")
        .prefetch_related("interests")
    )
    results = []
    for other in candidates:
        scores = score_pair(me, other, interest_ids)
        results.append({"profile": other, **scores})
    results.sort(key=lambda r: r["compatibility_score"], reverse=True)
    return results[:limit]
