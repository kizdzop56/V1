import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, Animated, StyleSheet, Modal, Dimensions,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import authStorage from "@/utils/authStorage";
import { AnimatedMascotImage, type MascotPose } from "@/components/AnimatedMascotImage";

const { width: SCREEN_W } = Dimensions.get("window");

export const TOUR_STORAGE_KEY = "onboarding_tour_done_v1";

interface TourStep {
  title: string;
  message: string;
  emoji: string;
  pose: MascotPose;
  accentColor: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Привет! Я Снежа! 👋",
    message:
      "Я твой личный помощник в изучении английского. Давай покажу тебе, как всё устроено!",
    emoji: "👋",
    pose: "wave",
    accentColor: "#8b5cf6",
  },
  {
    title: "📚 Задания",
    message:
      "На первой вкладке живут твои задания от учителя: тесты, аудирование, чтение и видео. Выполняй их и зарабатывай очки XP!",
    emoji: "📚",
    pose: "point",
    accentColor: "#8b5cf6",
  },
  {
    title: "🎤 AI-тьютор",
    message:
      "Говори по-английски с AI! Он исправит ошибки, объяснит грамматику и поможет улучшить произношение. Это как живой разговор!",
    emoji: "🎤",
    pose: "sit",
    accentColor: "#06b6d4",
  },
  {
    title: "🏆 Таблица лидеров",
    message:
      "Смотри, кто набрал больше всего XP за неделю. Соревнуйся с друзьями и поднимайся на вершину! Удачи в борьбе за первое место!",
    emoji: "🏆",
    pose: "excited",
    accentColor: "#f59e0b",
  },
  {
    title: "📅 Расписание",
    message:
      "Здесь отображаются все занятия по дням. Ты всегда знаешь, что и когда нужно сдать — никаких сюрпризов!",
    emoji: "📅",
    pose: "happy",
    accentColor: "#10b981",
  },
  {
    title: "👤 Профиль",
    message:
      "Тут хранятся твои достижения, уровень, стрик и статистика. Также можешь найти друзей и следить за их прогрессом!",
    emoji: "👤",
    pose: "curious",
    accentColor: "#6366f1",
  },
  {
    title: "Ты готов! 🎉",
    message:
      "Всё, что нужно — знаешь! Начни с первого задания и набери как можно больше XP. Я всегда буду рядом. Отдыхай и учись! 🚀",
    emoji: "🎉",
    pose: "lie",
    accentColor: "#a855f7",
  },
];

interface OnboardingTourProps {
  visible: boolean;
  onFinish: () => void;
  mascotName?: string;
}

export function OnboardingTour({
  visible,
  onFinish,
  mascotName = "Снежа",
}: OnboardingTourProps) {
  const colors = useColors();
  const [step, setStep]   = useState(0);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const current = TOUR_STEPS[step]!;
  const isLast  = step === TOUR_STEPS.length - 1;

  // Entrance animation (modal appears)
  useEffect(() => {
    if (visible) {
      setStep(0);
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // Slide in content when step changes
  useEffect(() => {
    if (!visible) return;
    slideAnim.setValue(30);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [step]);

  const handleNext = () => {
    if (isLast) handleFinish();
    else setStep((s) => s + 1);
  };

  const handleFinish = async () => {
    await authStorage.setItem(TOUR_STORAGE_KEY, "1");
    onFinish();
  };

  if (!visible) return null;

  const accent    = current.accentColor;
  const bgColor   = accent + "18";
  const borderColor = accent;

  const cardW   = Math.min(SCREEN_W - 40, 420);
  // lie pose is landscape (16:9); all others are portrait (9:16)
  const isLandscape = current.pose === "lie";
  const mascotW = isLandscape ? cardW * 0.88 : cardW * 0.55;
  const mascotH = isLandscape ? Math.round(mascotW * 9 / 16) : Math.round(mascotW * 16 / 9);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleFinish}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            { backgroundColor: colors.card, width: cardW, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* ── Mascot — static position, only part-animations ── */}
          <View style={styles.mascotArea}>
            <AnimatedMascotImage
              pose={current.pose}
              width={mascotW}
              height={mascotH}
            />
          </View>

          {/* Name label — gradient purple */}
          <Text
            style={[
              styles.nameLabel,
              {
                color: "#8b5cf6",
                // @ts-ignore web gradient text
                backgroundImage: "linear-gradient(90deg, #7c3aed, #a78bfa, #c084fc)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              },
            ]}
          >
            {mascotName}
          </Text>

          {/* Step content */}
          <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              {current.title}
            </Text>
            <View style={[styles.bubble, { backgroundColor: bgColor, borderColor }]}>
              <Text style={[styles.bubbleText, { color: colors.foreground }]}>
                {current.message}
              </Text>
            </View>
          </Animated.View>

          {/* Progress dots */}
          <View style={styles.dotsRow}>
            {TOUR_STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === step
                    ? { backgroundColor: accent, width: 20 }
                    : { backgroundColor: colors.border },
                ]}
              />
            ))}
          </View>

          {/* Buttons */}
          <View style={styles.btnRow}>
            {!isLast && (
              <TouchableOpacity
                style={[styles.skipBtn, { borderColor: colors.border }]}
                onPress={handleFinish}
              >
                <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
                  Пропустить
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.nextBtn,
                { backgroundColor: accent, flex: isLast ? 1 : undefined },
              ]}
              onPress={handleNext}
            >
              <Text style={styles.nextText}>
                {isLast ? "Начать учиться! 🚀" : "Далее"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const PAD = Math.min(SCREEN_W * 0.06, 28);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#000000aa",
    justifyContent: "center",
    alignItems: "center",
    padding: PAD,
  },
  container: {
    borderRadius: 28,
    padding: PAD,
    shadowColor: "#8b5cf6",
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    alignItems: "center",
  },
  mascotArea: {
    alignItems: "center",
    marginBottom: 4,
  },
  nameLabel: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  bubble: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 20,
    width: "100%",
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "500",
    textAlign: "center",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  dot: {
    height: 7,
    borderRadius: 4,
    width: 7,
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    width: "100%",
  },
  skipBtn: {
    borderWidth: 1.5,
    borderRadius: 13,
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  skipText: { fontSize: 14, fontWeight: "600" },
  nextBtn: {
    flex: 1,
    borderRadius: 13,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
