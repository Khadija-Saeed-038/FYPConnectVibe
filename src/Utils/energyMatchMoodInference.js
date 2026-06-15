/**
 * Map Energy Match reflection (VADER aggregate) to simple vibes and Django moods.
 * Django moods must match energy_match_project.accounts.models.Mood.
 */

/**
 * @param {object} ref Reflection API object (dominant_tone, sentiment_scores)
 * @returns {{ vibe: 'good'|'bad'|'sad', djangoMood: string }}
 */
export function inferVibeAndDjangoMoodFromReflection(ref) {
  const tone = String(ref?.dominant_tone || '').toLowerCase();
  const c = ref?.sentiment_scores?.compound;
  const compound = typeof c === 'number' ? c : null;

  let vibe = 'good';
  if (tone.includes('very negative') || (compound != null && compound <= -0.35)) {
    vibe = 'sad';
  } else if (tone.includes('negative') || (compound != null && compound < -0.05)) {
    vibe = 'bad';
  } else if (tone.includes('very positive') || tone.includes('positive')) {
    vibe = 'good';
  } else if (compound != null && compound >= 0.05) {
    vibe = 'good';
  }

  const djangoMood = vibe === 'sad' ? 'sad' : vibe === 'bad' ? 'anxious' : 'happy';
  return {vibe, djangoMood};
}

export function formatVibeLabel(vibe) {
  const v = String(vibe || '').toLowerCase();
  if (v === 'good') {
    return 'Good';
  }
  if (v === 'bad') {
    return 'Bad';
  }
  if (v === 'sad') {
    return 'Sad';
  }
  return vibe ? String(vibe) : '';
}
