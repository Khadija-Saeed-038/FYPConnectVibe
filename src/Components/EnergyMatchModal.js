import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  formatVibeLabel,
  inferVibeAndDjangoMoodFromReflection,
} from '../Utils/energyMatchMoodInference';

function formatReflectionUpdatedAt(iso) {
  if (!iso) {
    return '';
  }
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return String(iso);
    }
    return d.toLocaleString();
  } catch {
    return String(iso);
  }
}

/**
 * Shared Energy Match UI (Django API) for 1:1 and group Firebase chats.
 */
export default function EnergyMatchModal({
  visible,
  panel,
  onClose,
  onBackToMenu,
  energyBusy,
  colors,
  energyMatches,
  energyReflections,
  openMatchesPanel,
  openReflectionsPanel,
  onGenerateReflection,
}) {
  const {
    inputBackground,
    textColor,
    placeholderColor,
    headerBackgroundColor,
  } = colors;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => !energyBusy && onClose()}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'center',
          padding: 20,
        }}
        onPress={() => !energyBusy && onClose()}>
        <Pressable
          onPress={e => e.stopPropagation()}
          style={{
            borderRadius: 14,
            padding: 16,
            maxHeight: '78%',
            backgroundColor: inputBackground,
          }}>
          {panel === 'menu' && (
            <>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: textColor,
                  marginBottom: 14,
                }}>
                Energy Match
              </Text>
              <TouchableOpacity
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: placeholderColor,
                }}
                onPress={openMatchesPanel}>
                <Text style={{color: textColor, fontSize: 16}}>
                  Energy matches
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{paddingVertical: 12}}
                onPress={openReflectionsPanel}>
                <Text style={{color: textColor, fontSize: 16}}>Reflections</Text>
              </TouchableOpacity>
            </>
          )}

          {panel === 'matches' && (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                }}>
                <TouchableOpacity
                  onPress={onBackToMenu}
                  disabled={energyBusy}>
                  <Ionicons name="chevron-back" size={22} color={textColor} />
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '600',
                    color: textColor,
                    marginLeft: 6,
                  }}>
                  Matches
                </Text>
              </View>
              {energyBusy && !energyMatches ? (
                <ActivityIndicator color={textColor} />
              ) : null}
              {energyMatches != null && (
                <FlatList
                  data={energyMatches.results || []}
                  keyExtractor={(item, index) =>
                    String(item?.profile?.id ?? index)
                  }
                  style={{maxHeight: 360}}
                  ListEmptyComponent={
                    <Text style={{color: textColor, paddingVertical: 12}}>
                      No matches returned.
                    </Text>
                  }
                  renderItem={({item}) => {
                    const score =
                      item?.compatibility_score != null
                        ? Number(item.compatibility_score).toFixed(3)
                        : null;
                    const intSim =
                      item?.interest_similarity != null
                        ? (Number(item.interest_similarity) * 100).toFixed(0)
                        : null;
                    const moodFit =
                      item?.mood_compatibility != null
                        ? (Number(item.mood_compatibility) * 100).toFixed(0)
                        : null;
                    const vibeLabel = item?.energy_vibe
                      ? formatVibeLabel(item.energy_vibe)
                      : null;
                    return (
                    <View
                      style={{
                        paddingVertical: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: placeholderColor,
                      }}>
                      <Text style={{color: textColor, fontWeight: '600'}}>
                        {item?.profile?.username ?? '—'}
                      </Text>
                      <Text
                        style={{color: textColor, fontSize: 13, marginTop: 4}}>
                        {score != null ? `Score: ${score}` : 'Score: —'}
                        {intSim != null ? ` · Interests ${intSim}%` : ''}
                        {moodFit != null ? ` · Mood fit ${moodFit}%` : ''}
                      </Text>
                      <Text
                        style={{
                          color: textColor,
                          fontSize: 13,
                          marginTop: 2,
                          opacity: 0.92,
                        }}>
                        Vibe: {vibeLabel ?? '—'}
                        {item?.latest_reflection_tone
                          ? ` · tone: ${item.latest_reflection_tone}`
                          : ''}
                      </Text>
                      {item?.reflection_updated_at ? (
                        <Text
                          style={{
                            color: textColor,
                            fontSize: 11,
                            marginTop: 4,
                            opacity: 0.7,
                          }}>
                          Reflection:{' '}
                          {formatReflectionUpdatedAt(item.reflection_updated_at)}
                        </Text>
                      ) : null}
                    </View>
                    );
                  }}
                />
              )}
            </>
          )}

          {panel === 'reflections' && (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12,
                }}>
                <TouchableOpacity
                  onPress={onBackToMenu}
                  disabled={energyBusy}>
                  <Ionicons name="chevron-back" size={22} color={textColor} />
                </TouchableOpacity>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '600',
                    color: textColor,
                    marginLeft: 6,
                  }}>
                  Reflections
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: headerBackgroundColor,
                  paddingVertical: 10,
                  borderRadius: 8,
                  marginBottom: 12,
                  alignItems: 'center',
                  opacity: energyBusy ? 0.6 : 1,
                }}
                disabled={energyBusy}
                onPress={onGenerateReflection}>
                <Text style={{color: 'white', fontWeight: '600'}}>
                  Generate reflection
                </Text>
              </TouchableOpacity>
              {energyBusy && energyReflections == null ? (
                <ActivityIndicator color={textColor} />
              ) : null}
              <ScrollView
                style={{maxHeight: 280}}
                keyboardShouldPersistTaps="handled">
                {(energyReflections || []).length === 0 ? (
                  <Text style={{color: textColor, paddingVertical: 8}}>
                    No saved reflections yet.
                  </Text>
                ) : (
                  (energyReflections || []).map(ref => {
                    const {vibe} = inferVibeAndDjangoMoodFromReflection(ref);
                    const compound =
                      ref?.sentiment_scores &&
                      typeof ref.sentiment_scores.compound === 'number'
                        ? Number(ref.sentiment_scores.compound).toFixed(3)
                        : null;
                    return (
                    <View
                      key={String(ref.id)}
                      style={{
                        paddingVertical: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: placeholderColor,
                      }}>
                      <Text style={{color: textColor, fontWeight: '600'}}>
                        Vibe: {formatVibeLabel(vibe)}
                        {ref.dominant_tone
                          ? ` · ${String(ref.dominant_tone)}`
                          : ''}
                      </Text>
                      {compound != null ? (
                        <Text
                          style={{
                            color: textColor,
                            fontSize: 12,
                            marginTop: 2,
                            opacity: 0.85,
                          }}>
                          Compound: {compound}
                        </Text>
                      ) : null}
                      <Text
                        style={{
                          color: textColor,
                          fontSize: 12,
                          marginTop: 4,
                          opacity: 0.85,
                        }}
                        numberOfLines={3}>
                        {ref.summary ?? ''}
                      </Text>
                      {ref.created_at ? (
                        <Text
                          style={{
                            color: textColor,
                            fontSize: 11,
                            marginTop: 4,
                            opacity: 0.7,
                          }}>
                          {formatReflectionUpdatedAt(ref.created_at)}
                        </Text>
                      ) : null}
                    </View>
                    );
                  })
                )}
              </ScrollView>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
