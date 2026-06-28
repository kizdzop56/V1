import React, { useRef, useEffect } from "react";
import { View, Text, Animated, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";
import { XP_LEVELS, getXpProgress, type XpLevel } from "@/constants/xpLevels";

interface XpLevelBarProps {
  totalPoints: number;
  compact?: boolean;
}

export function XpLevelBar({ totalPoints, compact = false }: XpLevelBarProps) {
  const colors = useColors();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const { current, next, progressPercent } = getXpProgress(totalPoints);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercent / 100,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [progressPercent, progressAnim]);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.compactBadge, { backgroundColor: current.bgColor, borderColor: current.color + "60" }]}>
          <Text style={styles.compactEmoji}>{current.emoji}</Text>
          <Text style={[styles.compactLevel, { color: current.color }]}>Ур. {current.level}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={[styles.compactTitle, { color: colors.foreground }]}>{current.title}</Text>
            <Text style={[styles.compactXp, { color: colors.mutedForeground }]}>
              {totalPoints} / {next?.xpRequired ?? "MAX"} XP
            </Text>
          </View>
          <View style={[styles.track, { backgroundColor: colors.muted }]}>
            <Animated.View
              style={[
                styles.fill,
                {
                  backgroundColor: current.color,
                  width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
                },
              ]}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: current.bgColor + "80", borderColor: current.color + "40", borderWidth: 1, borderRadius: 16, padding: 16 }]}>
      <View style={styles.topRow}>
        <View style={[styles.levelBadge, { backgroundColor: current.color }]}>
          <Text style={styles.levelEmoji}>{current.emoji}</Text>
          <Text style={styles.levelNum}>Ур. {current.level}</Text>
        </View>
        <View style={{ flex: 1, paddingLeft: 12 }}>
          <Text style={[styles.titleText, { color: current.color }]}>{current.title}</Text>
          <Text style={[styles.xpText, { color: colors.mutedForeground }]}>
            {totalPoints} XP
            {next ? ` · до ур.${next.level}: ${next.xpRequired - totalPoints} XP` : " · Максимальный уровень!"}
          </Text>
        </View>
        <View style={[styles.pctBadge, { backgroundColor: current.color + "20" }]}>
          <Text style={[styles.pctText, { color: current.color }]}>{progressPercent}%</Text>
        </View>
      </View>

      <View style={[styles.track, { backgroundColor: colors.muted, marginTop: 10, height: 10 }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: current.color,
              width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
              height: 10, borderRadius: 5,
            },
          ]}
        />
      </View>

      {next && (
        <View style={styles.nextRow}>
          <Text style={[styles.nextText, { color: colors.mutedForeground }]}>
            Следующий: {next.emoji} {next.title}
          </Text>
          <Text style={[styles.nextReward, { color: current.color }]}>
            🎁 {next.reward}
          </Text>
        </View>
      )}
    </View>
  );
}

export function LevelBadgesShowcase({ currentLevel }: { currentLevel: number }) {
  const colors = useColors();
  const unlocked: XpLevel[] = XP_LEVELS.filter((l) => l.level <= currentLevel);
  const mostRecent = unlocked.slice(-6).reverse();

  if (unlocked.length === 0) return null;

  return (
    <View style={styles.badgesContainer}>
      <Text style={[styles.badgesTitle, { color: colors.mutedForeground }]}>
        ЗНАЧКИ УРОВНЕЙ · {unlocked.length}/50
      </Text>
      <View style={styles.badgesRow}>
        {mostRecent.map((lvl) => (
          <View
            key={lvl.level}
            style={[styles.badge, { backgroundColor: lvl.bgColor, borderColor: lvl.color + "50" }]}
          >
            <Text style={styles.badgeEmoji}>{lvl.emoji}</Text>
            <Text style={[styles.badgeLvl, { color: lvl.color }]}>Ур.{lvl.level}</Text>
          </View>
        ))}
        {unlocked.length > 6 && (
          <View style={[styles.badge, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.badgeLvl, { color: colors.mutedForeground }]}>+{unlocked.length - 6}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  topRow: { flexDirection: "row", alignItems: "center" },
  levelBadge: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: "center", alignItems: "center",
  },
  levelEmoji: { fontSize: 22 },
  levelNum: { fontSize: 10, color: "#fff", fontWeight: "800", marginTop: -2 },
  titleText: { fontSize: 16, fontWeight: "800" },
  xpText: { fontSize: 12, marginTop: 2 },
  pctBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pctText: { fontSize: 14, fontWeight: "800" },
  track: { height: 8, borderRadius: 4, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 4 },
  nextRow: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  nextText: { fontSize: 12 },
  nextReward: { fontSize: 12, fontWeight: "700" },
  compactContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
  compactBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  compactEmoji: { fontSize: 14 },
  compactLevel: { fontSize: 12, fontWeight: "700" },
  compactTitle: { fontSize: 13, fontWeight: "700" },
  compactXp: { fontSize: 11 },
  badgesContainer: { marginBottom: 16 },
  badgesTitle: {
    fontSize: 12, fontWeight: "700", marginBottom: 10,
    textTransform: "uppercase", letterSpacing: 0.6,
  },
  badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badge: {
    width: 52, height: 52, borderRadius: 12, borderWidth: 1.5,
    justifyContent: "center", alignItems: "center",
  },
  badgeEmoji: { fontSize: 22 },
  badgeLvl: { fontSize: 10, fontWeight: "700" },
});
