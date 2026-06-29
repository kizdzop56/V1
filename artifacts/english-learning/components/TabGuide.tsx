import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, Animated, StyleSheet, Modal, Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { AnimatedMascotImage } from "@/components/AnimatedMascotImage";

const { width: W } = Dimensions.get("window");

// Same transparent animated WebP used on the intro slide (672x544, alpha).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const WAVE_WEBP = require("../assets/images/mascot_wave.webp");

export type TabGuideTab =
  | "assignments"
  | "voice-chat"
  | "leaderboard"
  | "calendar"
  | "profile"
  | "students"
  | "analysis";

interface TabGuideInfo {
  tab: TabGuideTab;
  emoji: string;
  title: string;
  description: string;
}

export const TAB_GUIDE_CONTENT: Record<TabGuideTab, TabGuideInfo> = {
  assignments: {
    tab: "assignments",
    emoji: "📚",
    title: "Задания",
    description:
      "Здесь собраны все задания от твоего учителя: тесты, аудирование, чтение и видео. Выполняй их и зарабатывай XP очки — чем больше заданий, тем выше уровень!",
  },
  "voice-chat": {
    tab: "voice-chat",
    emoji: "🎤",
    title: "AI-тьютор",
    description:
      "Общайся по-английски с искусственным интеллектом! Он поправит ошибки, объяснит грамматику и поможет улучшить произношение. Это как живая беседа с носителем языка!",
  },
  leaderboard: {
    tab: "leaderboard",
    emoji: "🏆",
    title: "Рейтинг",
    description:
      "Смотри, кто набрал больше всего XP за неделю! Соревнуйся с друзьями, поднимайся в топ и получай бонусы за лидерство. Стань лучшим учеником!",
  },
  calendar: {
    tab: "calendar",
    emoji: "📅",
    title: "Календарь",
    description:
      "Все занятия и задания по дням. Ты всегда будешь знать, что нужно сдать и когда — никаких неожиданностей и пропущенных дедлайнов!",
  },
  profile: {
    tab: "profile",
    emoji: "👤",
    title: "Профиль",
    description:
      "Твои достижения, уровень, XP и статистика. Здесь же можно добавить друзей и следить за их прогрессом. Можешь даже переименовать меня — Снежу! 😄",
  },
  students: {
    tab: "students",
    emoji: "👨‍🎓",
    title: "Ученики",
    description:
      "Список всех твоих учеников. Смотри их прогресс, уровень и статистику. Назначай задания отдельным ученикам или группам!",
  },
  analysis: {
    tab: "analysis",
    emoji: "📊",
    title: "Анализ",
    description:
      "Детальная аналитика по всем ученикам: успеваемость, выполнение заданий и прогресс по времени. Принимай решения на основе данных!",
  },
};

interface TabGuideProps {
  tabName: TabGuideTab | null;
  visible: boolean;
  mascotName?: string;
  onClose: () => void;
}

export function TabGuide({
  tabName,
  visible,
  mascotName = "Снежа",
  onClose,
}: TabGuideProps) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [imgFailed, setImgFailed] = useState(false);

  const info = tabName ? TAB_GUIDE_CONTENT[tabName] : null;

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 340, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 90, friction: 10, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, tabName]);

  if (!visible || !info) return null;

  const cardW   = Math.min(W - 32, 400);
  // mascot_wave.webp is 672x544 (landscape) — keep its true ratio.
  const mascotW = cardW;
  const mascotH = Math.round(mascotW * (544 / 672));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.content,
            { width: cardW, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Mascot — transparent animated WebP (autoplays everywhere).
              Falls back to the static PNG mascot if it fails to load. */}
          {imgFailed ? (
            <AnimatedMascotImage pose="wave" width={mascotW} height={mascotH} />
          ) : (
            <Image
              source={WAVE_WEBP}
              style={{ width: mascotW, height: mascotH }}
              contentFit="contain"
              autoplay
              onError={() => setImgFailed(true)}
            />
          )}

          {/* Name */}
          <Text
            style={[
              styles.nameLabel,
              {
                // @ts-ignore web
                backgroundImage: "linear-gradient(90deg, #a78bfa, #c084fc, #e879f9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              },
            ]}
          >
            {mascotName}
          </Text>

          {/* Title */}
          <Text style={styles.title}>
            {info.emoji}{"  "}{info.title}
          </Text>

          {/* Description — neon-bordered bubble */}
          <View
            style={[
              styles.bubble,
              {
                // @ts-ignore web
                boxShadow: "0 0 16px rgba(168,85,247,0.7), 0 0 5px rgba(168,85,247,0.4)",
              },
            ]}
          >
            <Text style={styles.desc}>{info.description}</Text>
          </View>

          {/* CTA */}
          <TouchableOpacity style={styles.btn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.btnText}>Понятно! 👍</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#000000b8",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  content: {
    alignItems: "center",
  },
  nameLabel: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    color: "#c084fc",
    marginTop: 12,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    color: "#ffffff",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  bubble: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#a855f7",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 22,
  },
  desc: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "500",
    textAlign: "center",
    color: "#ede9ff",
  },
  btn: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    backgroundColor: "#8b5cf6",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.35)",
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
