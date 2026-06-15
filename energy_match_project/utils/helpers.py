"""Reusable, framework-free helpers."""
from __future__ import annotations

import numpy as np


def cosine_similarity(v1: np.ndarray, v2: np.ndarray) -> float:
    """Cosine similarity in [0, 1] for non-negative vectors."""
    n1 = np.linalg.norm(v1)
    n2 = np.linalg.norm(v2)
    if n1 == 0 or n2 == 0:
        return 0.0
    return float(np.dot(v1, v2) / (n1 * n2))


def one_hot(present_ids: set[int], universe_ids: list[int]) -> np.ndarray:
    """Build a one-hot vector over `universe_ids` from a set of present ids."""
    return np.array([1.0 if i in present_ids else 0.0 for i in universe_ids])
