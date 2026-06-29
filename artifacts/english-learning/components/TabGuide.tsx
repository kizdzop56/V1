import React, { useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, Animated, StyleSheet, Modal, Dimensions, Platform,
} from "react-native";
import { AnimatedMascotImage, type MascotPose } from "@/components/AnimatedMascotImage";

const { width: W } = Dimensions.get("window");

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
  mascotPose: MascotPose;
  accentColor: string;
}

export const TAB_GUIDE_CONTENT: Record<TabGuideTab, TabGuideInfo> = {
  assignments: {
    tab: "assignments",
    emoji: "📚",
    title: "Задания",
    description:
      "Здесь собраны все задания от твоего учителя: тесты, аудирование, чтение и видео. Выполняй их и зарабатывай XP очки — чем больше заданий, тем выше уровень!",
    mascotPose: "point",
    accentColor: "#8b5cf6",
  },
  "voice-chat": {
    tab: "voice-chat",
    emoji: "🎤",
    title: "AI-тьютор",
    description:
      "Общайся по-английски с искусственным интеллектом! Он поправит ошибки, объяснит грамматику и поможет улучшить произношение. Это как живая беседа с носителем языка!",
    mascotPose: "think",
    accentColor: "#06b6d4",
  },
  leaderboard: {
    tab: "leaderboard",
    emoji: "🏆",
    title: "Рейтинг",
    description:
      "Смотри, кто набрал больше всего XP за неделю! Соревнуйся с друзьями, поднимайся в топ и получай бонусы за лидерство. Стань лучшим учеником!",
    mascotPose: "celebrate",
    accentColor: "#f59e0b",
  },
  calendar: {
    tab: "calendar",
    emoji: "📅",
    title: "Календарь",
    description:
      "Все занятия и задания по дням. Ты всегда будешь знать, что нужно сдать и когда — никаких неожиданностей и пропущенных дедлайнов!",
    mascotPose: "sit",
    accentColor: "#10b981",
  },
  profile: {
    tab: "profile",
    emoji: "👤",
    title: "Профиль",
    description:
      "Твои достижения, уровень, XP и статистика. Здесь же можно добавить друзей и следить за их прогрессом. Можешь даже переименовать меня — Снежу! 😄",
    mascotPose: "wave",
    accentColor: "#6366f1",
  },
  students: {
    tab: "students",
    emoji: "👨‍🎓",
    title: "Ученики",
    description:
      "Список всех твоих учеников. Смотри их прогресс, уровень и статистику. Назначай задания отдельным ученикам или группам!",
    mascotPose: "curious",
    accentColor: "#8b5cf6",
  },
  analysis: {
    tab: "analysis",
    emoji: "📊",
    title: "Анализ",
    description:
      "Детальная аналитика по всем ученикам: успеваемость, выполнение заданий и прогресс по времени. Принимай решения на основе данных!",
    mascotPose: "think",
    accentColor: "#6366f1",
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
  const scaleAnim   = useRef(new Animated.Value(0.88)).current;
  const slideAnim   = useRef(new Animated.Value(50)).current;
  const mascotSlide = useRef(new Animated.Value(60)).current;

  const info = tabName ? TAB_GUIDE_CONTENT[tabName] : null;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.88);
      slideAnim.setValue(50);
      mascotSlide.setValue(60);
      Animated.parallel([
        Animated.spring(scaleAnim,   { toValue: 1, tension: 70,  friction: 8,  useNativeDriver: true }),
        Animated.spring(slideAnim,   { toValue: 0, tension: 80,  friction: 10, useNativeDriver: true }),
        Animated.spring(mascotSlide, { toValue: 0, tension: 55,  friction: 9,  useNativeDriver: true }),
      ]).start();
    }
  }, [visible, tabName]);

  if (!visible || !info) return null;

  const accent  = info.accentColor;
  const cardW   = Math.min(W - 40, 380);
  const mascotW = cardW * 0.62;
  const mascotH = mascotW * (16 / 9);
  const overlap = Math.round(mascotH * 0.28);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* No backdrop — card floats over live app content */}
      <View style={styles.overlay} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.cardWrapper,
            { width: cardW, transform: [{ scale: scaleAnim }] },
          ]}
          pointerEvents="auto"
        >
          {/* Mascot floats above card */}
          <Animated.View
            style={[styles.mascotWrap, { transform: [{ translateY: mascotSlide }] }]}
          >
            <AnimatedMascotImage pose={info.mascotPose} width={mascotW} height={mascotH} />
          </Animated.View>

          {/* Dark glass card */}
          <View
            style={[
              styles.card,
              {
                marginTop: -overlap,
                paddingTop: overlap + 10,
                // @ts-ignore web backdropFilter
                ...(Platform.OS === "web"
                  ? { backdropFilter: "blur(24px) saturate(1.3)", WebkitBackdropFilter: "blur(24px) saturate(1.3)" }
                  : {}),
              },
            ]}
          >
            {/* Title row */}
            <Animated.View style={{ transform: [{ translateY: slideAnim }], alignItems: "center", width: "100%" }}>
              <Text style={styles.title}>
                {info.emoji}{"  "}{info.title}
              </Text>

              {/* Description bubble */}
              <View style={[styles.bubble, { borderColor: accent + "55" }]}>
                <Text style={styles.bubbleText}>{info.description}</Text>
              </View>

              {/* Confirm button */}
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: accent }]}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>Далее</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cardWrapper: {
    alignItems: "center",
  },
  mascotWrap: {
    alignItems: "center",
    zIndex: 2,
  },
  card: {
    width: "100%",
    borderRadius: 28,
    backgroundColor: "rgba(42,36,60,0.88)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  bubble: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 16,
    marginBottom: 18,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "500",
    textAlign: "center",
    color: "#ede9ff",
  },
  btn: {
    width: "100%",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.45)",
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
