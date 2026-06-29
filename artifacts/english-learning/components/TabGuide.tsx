import React, { useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, Animated, StyleSheet, Modal, Image, Dimensions,
} from "react-native";
import { useColors } from "@/hooks/useColors";

const MASCOT_WAVE = require("../assets/images/mascot_full.png");
const MASCOT_CELEBRATE = require("../assets/images/mascot_full_celebrate.png");
const MASCOT_THINK = require("../assets/images/mascot_full_think.png");
const { width: W, height: H } = Dimensions.get("window");

export type TabGuideTab = "assignments" | "voice-chat" | "leaderboard" | "calendar" | "profile" | "students" | "analysis";

interface TabGuideInfo {
  tab: TabGuideTab;
  emoji: string;
  title: string;
  description: string;
  mascotPose: "wave" | "celebrate" | "think";
  accentColor: string;
}

export const TAB_GUIDE_CONTENT: Record<TabGuideTab, TabGuideInfo> = {
  assignments: {
    tab: "assignments",
    emoji: "📚",
    title: "Задания",
    description: "Здесь собраны все задания от твоего учителя: тесты, аудирование, чтение и видео. Выполняй их и зарабатывай XP очки — чем больше заданий, тем выше уровень!",
    mascotPose: "wave",
    accentColor: "#8b5cf6",
  },
  "voice-chat": {
    tab: "voice-chat",
    emoji: "🎤",
    title: "AI-тьютор",
    description: "Общайся по-английски с искусственным интеллектом! Он поправит ошибки, объяснит грамматику и поможет улучшить произношение. Это как живая беседа с носителем языка!",
    mascotPose: "think",
    accentColor: "#06b6d4",
  },
  leaderboard: {
    tab: "leaderboard",
    emoji: "🏆",
    title: "Рейтинг",
    description: "Смотри, кто набрал больше всего XP за неделю! Соревнуйся с друзьями, поднимайся в топ и получай бонусы за лидерство. Стань лучшим учеником!",
    mascotPose: "celebrate",
    accentColor: "#f59e0b",
  },
  calendar: {
    tab: "calendar",
    emoji: "📅",
    title: "Календарь",
    description: "Все занятия и задания по дням. Ты всегда будешь знать, что нужно сдать и когда — никаких неожиданностей и пропущенных дедлайнов!",
    mascotPose: "wave",
    accentColor: "#10b981",
  },
  profile: {
    tab: "profile",
    emoji: "👤",
    title: "Профиль",
    description: "Твои достижения, уровень, XP и статистика. Здесь же можно добавить друзей и следить за их прогрессом. Можешь даже переименовать меня — Снежу! 😄",
    mascotPose: "wave",
    accentColor: "#6366f1",
  },
  students: {
    tab: "students",
    emoji: "👨‍🎓",
    title: "Ученики",
    description: "Список всех твоих учеников. Смотри их прогресс, уровень и статистику. Назначай задания отдельным ученикам или группам!",
    mascotPose: "wave",
    accentColor: "#8b5cf6",
  },
  analysis: {
    tab: "analysis",
    emoji: "📊",
    title: "Анализ",
    description: "Детальная аналитика по всем ученикам: успеваемость, выполнение заданий и прогресс по времени. Принимай решения на основе данных!",
    mascotPose: "think",
    accentColor: "#6366f1",
  },
};

function getMascotImage(pose: "wave" | "celebrate" | "think") {
  if (pose === "celebrate") return MASCOT_CELEBRATE;
  if (pose === "think") return MASCOT_THINK;
  return MASCOT_WAVE;
}

interface TabGuideProps {
  tabName: TabGuideTab | null;
  visible: boolean;
  mascotName?: string;
  onClose: () => void;
}

export function TabGuide({ tabName, visible, mascotName = "Снежа", onClose }: TabGuideProps) {
  const colors = useColors();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(60)).current;
  const mascotSlideAnim = useRef(new Animated.Value(80)).current;

  const info = tabName ? TAB_GUIDE_CONTENT[tabName] : null;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.8);
      slideAnim.setValue(60);
      mascotSlideAnim.setValue(80);

      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 70, friction: 8, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
        Animated.spring(mascotSlideAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible || !info) return null;

  const accent = info.accentColor;
  const mascotSrc = getMascotImage(info.mascotPose);
  const mascotH = Math.min(H * 0.38, 300);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Accent top bar */}
          <View style={[styles.topBar, { backgroundColor: accent + "18" }]}>
            <Text style={[styles.topBarEmoji]}>{info.emoji}</Text>
            <Text style={[styles.topBarTitle, { color: accent }]}>{info.title}</Text>
          </View>

          {/* Mascot full body */}
          <Animated.View
            style={[styles.mascotWrap, { transform: [{ translateY: mascotSlideAnim }] }]}
          >
            <Image
              source={mascotSrc}
              style={[styles.mascotImg, { height: mascotH }]}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Name badge */}
          <View style={[styles.nameBadge, { backgroundColor: accent + "20", borderColor: accent + "40" }]}>
            <Text style={[styles.nameText, { color: accent }]}>{mascotName}</Text>
          </View>

          {/* Speech bubble */}
          <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
            <View style={[styles.bubble, { backgroundColor: accent + "12", borderColor: accent + "30" }]}>
              <Text style={[styles.bubbleText, { color: colors.foreground }]}>{info.description}</Text>
            </View>
          </Animated.View>

          {/* Button */}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: accent }]}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>Понятно! 👍</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const CARD_W = Math.min(W - 40, 380);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#000000bb",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: CARD_W,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  topBarEmoji: { fontSize: 24 },
  topBarTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  mascotWrap: {
    alignItems: "center",
    marginTop: -8,
    marginBottom: -4,
  },
  mascotImg: {
    width: CARD_W * 0.72,
  },
  nameBadge: {
    alignSelf: "center",
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 14,
  },
  nameText: { fontSize: 13, fontWeight: "700" },
  bubble: {
    marginHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 18,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "500",
    textAlign: "center",
  },
  btn: {
    marginHorizontal: 20,
    marginBottom: 22,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
