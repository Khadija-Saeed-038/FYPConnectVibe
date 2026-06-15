"""Conversation Reflection: VADER sentiment + heuristic summary."""
from __future__ import annotations

from statistics import mean

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from chats.models import ChatRoom

_analyzer = SentimentIntensityAnalyzer()

# Limits for POST /api/reflections/from-transcript/ (Firebase and other clients).
MAX_TRANSCRIPT_MESSAGES = 400
MAX_TRANSCRIPT_TOTAL_CHARS = 500_000
MAX_CONTENT_PER_MESSAGE = 4000


def _classify(compound: float) -> str:
    if compound >= 0.5:
        return "very positive"
    if compound >= 0.05:
        return "positive"
    if compound <= -0.5:
        return "very negative"
    if compound <= -0.05:
        return "negative"
    return "neutral"


def analyze_transcript(
    items: list[tuple[str, str]],
) -> dict:
    """
    Run VADER + summary on a list of (sender_label, content) pairs.

    Used for ad-hoc transcripts (e.g. Firebase RTDB) and by analyze_room().
    """
    if not items:
        return {
            "summary": "No messages to reflect on yet.",
            "sentiment_scores": {"compound": 0.0, "pos": 0.0, "neu": 0.0, "neg": 0.0},
            "dominant_tone": "neutral",
            "message_count": 0,
        }

    per_message = []
    for sender, content in items:
        text = (content or "").strip()
        if not text:
            continue
        scores = _analyzer.polarity_scores(text)
        per_message.append({"sender": sender or "unknown", "scores": scores, "content": text})

    if not per_message:
        return {
            "summary": "No messages to reflect on yet.",
            "sentiment_scores": {"compound": 0.0, "pos": 0.0, "neu": 0.0, "neg": 0.0},
            "dominant_tone": "neutral",
            "message_count": 0,
        }

    avg = {
        "compound": mean(p["scores"]["compound"] for p in per_message),
        "pos": mean(p["scores"]["pos"] for p in per_message),
        "neu": mean(p["scores"]["neu"] for p in per_message),
        "neg": mean(p["scores"]["neg"] for p in per_message),
    }
    dominant = _classify(avg["compound"])

    by_sender: dict[str, list[float]] = {}
    for p in per_message:
        by_sender.setdefault(p["sender"], []).append(p["scores"]["compound"])
    sender_summaries = ", ".join(
        f"{name} averaged {_classify(mean(vals))}" for name, vals in by_sender.items()
    )

    high = max(per_message, key=lambda p: p["scores"]["compound"])
    low = min(per_message, key=lambda p: p["scores"]["compound"])

    summary_lines = [
        f"Across {len(per_message)} message(s), the conversation was {dominant}.",
        sender_summaries + ".",
        f"Most positive moment: \"{high['content'][:80]}\" ({high['sender']}).",
        f"Most negative moment: \"{low['content'][:80]}\" ({low['sender']}).",
    ]
    return {
        "summary": "\n".join(summary_lines),
        "sentiment_scores": {k: round(v, 4) for k, v in avg.items()},
        "dominant_tone": dominant,
        "message_count": len(per_message),
    }


def analyze_room(room: ChatRoom) -> dict:
    messages = list(room.messages.select_related("sender").all())
    items = [(m.sender.username, m.content) for m in messages]
    return analyze_transcript(items)
