import React, { useState } from "react";
import {
  View, Text, Image, TouchableOpacity, Modal, StyleSheet,
  ScrollView, Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import type { Achievement } from "@/constants/achievements";

interface AchievementsShowcaseProps {
  unlocked: Achievement[];
  locked?: Achievement[];
  /** If true shows locked achievements dimmed below (own profile). If false — only earned (friend/teacher profile). */
  showLocked?: boolean;
  title?: string;
}

function BadgeCard({
  achievement,
  isLocked = false,
  onPress,
}: {
  achievement: Achievement;
  isLocked?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.badgeWrap,
        isLocked && styles.badgeWrapLocked,
      ]}
    >
      {/* Glow ring for earned */}
      {!isLocked && (
        <View style={[styles.glowRing, { borderColor: achievement.color + "60" }]} />
      )}

      {/* Badge image or emoji */}
      <View style={[styles.badgeImgWrap, isLocked && { opacity: 0.22 }]}>
        {achievement.image ? (
          <Image
            source={achievement.image}
            style={styles.badgeImg}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.emojiFallback, { backgroundColor: isLocked ? "#555" : achievement.bgColor }]}>
            <Text style={styles.badgeEmoji}>{achievement.emoji}</Text>
          </View>
        )}
      </View>

      {/* Lock overlay */}
      {isLocked && (
        <View style={styles.lockOverlay}>
          <Feather name="lock" size={16} color="rgba(255,255,255,0.7)" />
        </View>
      )}

      {/* Title below */}
      <Text
        style={[
          styles.badgeTitle,
          { color: isLocked ? "#888" : achievement.color },
        ]}
        numberOfLines={2}
      >
        {achievement.title}
      </Text>
    </TouchableOpacity>
  );
}

function BadgeDetailModal({
  achievement,
  isLocked,
  onClose,
}: {
  achievement: Achievement | null;
  isLocked: boolean;
  onClose: () => void;
}) {
  const colors = useColors();
  if (!achievement) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.modalCard, { backgroundColor: isLocked ? "#1e1b2e" : "#16122a" }]}>
          {/* Badge */}
          <View style={[styles.modalBadgeWrap, isLocked && { opacity: 0.35 }]}>
            {achievement.image ? (
              <Image source={achievement.image} style={styles.modalBadgeImg} resizeMode="cover" />
            ) : (
              <View style={[styles.modalEmojiWrap, { backgroundColor: achievement.bgColor }]}>
                <Text style={styles.modalEmoji}>{achievement.emoji}</Text>
              </View>
            )}
            {isLocked && (
              <View style={styles.modalLockOverlay}>
                <Feather name="lock" size={28} color="rgba(255,255,255,0.8)" />
              </View>
            )}
          </View>

          {/* Status badge */}
          <View style={[styles.statusBadge, {
            backgroundColor: isLocked ? "#374151" : achievement.color + "25",
            borderColor: isLocked ? "#4b5563" : achievement.color + "60",
          }]}>
            <Feather
              name={isLocked ? "lock" : "check-circle"}
              size={12}
              color={isLocked ? "#9ca3af" : achievement.color}
            />
            <Text style={[styles.statusText, { color: isLocked ? "#9ca3af" : achievement.color }]}>
              {isLocked ? "Не получена" : "Получена"}
            </Text>
          </View>

          <Text style={styles.modalTitle}>{achievement.title}</Text>
          <Text style={styles.modalDesc}>{achievement.description}</Text>

          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
            <Text style={styles.modalCloseTxt}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export function AchievementsShowcase({
  unlocked,
  locked = [],
  showLocked = false,
  title = "Витрина наград",
}: AchievementsShowcaseProps) {
  const [selected, setSelected] = useState<{ achievement: Achievement; isLocked: boolean } | null>(null);

  const total = unlocked.length + locked.length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="award" size={16} color="#a78bfa" />
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {unlocked.length}
            {showLocked ? `/${total}` : ""} наград
          </Text>
        </View>
      </View>

      {unlocked.length === 0 && !showLocked ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏆</Text>
          <Text style={styles.emptyText}>Пока нет полученных наград</Text>
        </View>
      ) : (
        <>
          {/* Earned grid */}
          {unlocked.length > 0 && (
            <View style={styles.grid}>
              {unlocked.map((a) => (
                <BadgeCard
                  key={a.id}
                  achievement={a}
                  isLocked={false}
                  onPress={() => setSelected({ achievement: a, isLocked: false })}
                />
              ))}
            </View>
          )}

          {/* Locked section — only on own profile */}
          {showLocked && locked.length > 0 && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Ещё не получены</Text>
                <View style={styles.dividerLine} />
              </View>
              <View style={styles.grid}>
                {locked.map((a) => (
                  <BadgeCard
                    key={a.id}
                    achievement={a}
                    isLocked={true}
                    onPress={() => setSelected({ achievement: a, isLocked: true })}
                  />
                ))}
              </View>
            </>
          )}
        </>
      )}

      <BadgeDetailModal
        achievement={selected?.achievement ?? null}
        isLocked={selected?.isLocked ?? false}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0f0c1d",
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#2d2555",
  },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 7 },
  headerTitle: { fontSize: 14, fontWeight: "800", color: "#e2e8f0", letterSpacing: 0.4 },
  countBadge: {
    backgroundColor: "#6366f130",
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 10, borderWidth: 1, borderColor: "#6366f150",
  },
  countText: { fontSize: 11, fontWeight: "700", color: "#a5b4fc" },

  // Grid
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  // Badge card
  badgeWrap: {
    width: "22%",
    alignItems: "center",
    position: "relative",
  },
  badgeWrapLocked: { opacity: 0.9 },
  glowRing: {
    position: "absolute",
    top: -3, left: -3, right: -3, bottom: -3,
    borderRadius: 38,
    borderWidth: 2,
    zIndex: 0,
  },
  badgeImgWrap: {
    width: 66, height: 66, borderRadius: 33,
    overflow: "hidden",
    backgroundColor: "#1a1740",
  },
  badgeImg: { width: 66, height: 66 },
  emojiFallback: {
    width: 66, height: 66, borderRadius: 33,
    justifyContent: "center", alignItems: "center",
  },
  badgeEmoji: { fontSize: 32 },
  lockOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 22,
    borderRadius: 33,
    justifyContent: "center", alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    zIndex: 2,
  },
  badgeTitle: {
    fontSize: 9, fontWeight: "700", textAlign: "center",
    marginTop: 6, lineHeight: 12,
  },

  // Divider
  divider: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#2d2555" },
  dividerText: { fontSize: 10, color: "#6b7280", fontWeight: "600", letterSpacing: 0.5 },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 28, gap: 8 },
  emptyIcon: { fontSize: 36 },
  emptyText: { fontSize: 13, color: "#6b7280" },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center", alignItems: "center", padding: 32,
  },
  modalCard: {
    borderRadius: 24, padding: 28, width: "100%",
    alignItems: "center",
    borderWidth: 1, borderColor: "#2d2555",
    shadowColor: "#6366f1", shadowOpacity: 0.3, shadowRadius: 20,
  },
  modalBadgeWrap: { position: "relative", marginBottom: 16 },
  modalBadgeImg: { width: 110, height: 110, borderRadius: 55 },
  modalEmojiWrap: {
    width: 110, height: 110, borderRadius: 55,
    justifyContent: "center", alignItems: "center",
  },
  modalEmoji: { fontSize: 56 },
  modalLockOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 55, justifyContent: "center", alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1, marginBottom: 12,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  modalTitle: { fontSize: 20, fontWeight: "900", color: "#f1f5f9", textAlign: "center", marginBottom: 8 },
  modalDesc: { fontSize: 13, color: "#94a3b8", textAlign: "center", lineHeight: 19, marginBottom: 24 },
  modalCloseBtn: {
    backgroundColor: "#6366f120", borderRadius: 12, paddingHorizontal: 28,
    paddingVertical: 10, borderWidth: 1, borderColor: "#6366f140",
  },
  modalCloseTxt: { fontSize: 14, fontWeight: "700", color: "#a5b4fc" },
});
