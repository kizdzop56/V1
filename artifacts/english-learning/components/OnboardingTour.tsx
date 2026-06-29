import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, Animated, StyleSheet, Modal, Image, Dimensions,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import authStorage from "@/utils/authStorage";

const MASCOT_IMAGE = require("../assets/images/mascot_full.png");
const MASCOT_CELEBRATE = require("../assets/images/mascot_full_celebrate.png");
const { width: SCREEN_W } = Dimensions.get("window");

export const TOUR_STORAGE_KEY = "onboarding_tour_done_v1";

interface TourStep {
  title: string;
  message: string;
  emoji: string;
  celebrate?: boolean;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Привет! Я Снежа! 👋",
    message: "Я твой личный помощник в изучении английского. Давай покажу тебе, как всё устроено!",
    emoji: "👋",
    celebrate: false,
  },
  {
    title: "📚 Задания",
    message: "На первой вкладке живут твои задания от учителя: тесты, аудирование, чтение и видео. Выполняй их и зарабатывай очки XP!",
    emoji: "📚",
  },
  {
    title: "🎤 AI-тьютор",
    message: "Говори по-английски с AI! Он исправит ошибки, объяснит грамматику и поможет улучшить произношение. Это как живой разговор!",
    emoji: "🎤",
  },
  {
    title: "🏆 Таблица лидеров",
    message: "Смотри, кто набрал больше всего XP за неделю. Соревнуйся с друзьями и поднимайся на вершину! Удачи в борьбе за первое место!",
    emoji: "🏆",
  },
  {
    title: "📅 Расписание",
    message: "Здесь отображаются все занятия по дням. Ты всегда знаешь, что и когда нужно сдать — никаких сюрпризов!",
    emoji: "📅",
  },
  {
    title: "👤 Профиль",
    message: "Тут хранятся твои достижения, уровень, стрик и статистика. Также можешь найти друзей и следить за их прогрессом!",
    emoji: "👤",
  },
  {
    title: "Ты готов! 🎉",
    message: "Всё, что нужно — знаешь! Начни с первого задания и набери как можно больше XP. Я всегда буду рядом. Удачи! 🚀",
    emoji: "🎉",
    celebrate: true,
  },
];

interface OnboardingTourProps {
  visible: boolean;
  onFinish: () => void;
  mascotName?: string;
}

export function OnboardingTour({ visible, onFinish, mascotName = "Снежа" }: OnboardingTourProps) {
  const colors = useColors();
  const [step, setStep] = useState(0);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const bounceRef = useRef<any>(null);

  const current = TOUR_STEPS[step]!;
  const isLast = step === TOUR_STEPS.length - 1;

  useEffect(() => {
    if (visible) {
      setStep(0);
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }).start();
      startBounce();
    } else {
      bounceRef.current?.stop?.();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    slideAnim.setValue(30);
    Animated.spring(slideAnim, { toValue: 0, tension: 100, friction: 10, useNativeDriver: true }).start();
    bounceRef.current?.stop?.();
    startBounce();
  }, [step]);

  function startBounce() {
    bounceAnim.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -10, duration: 550, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 550, useNativeDriver: true }),
      ])
    );
    bounceRef.current = loop;
    loop.start();
  }

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleFinish = async () => {
    bounceRef.current?.stop?.();
    await authStorage.setItem(TOUR_STORAGE_KEY, "1");
    onFinish();
  };

  if (!visible) return null;

  const isIntro = step === 0;
  const isCelebrate = current.celebrate && !isIntro;
  const borderColor = isCelebrate ? "#a855f7" : "#8b5cf6";
  const bgColor = isCelebrate ? "#f3e8ff" : "#ede9fe";
  const mascotSrc = isCelebrate ? MASCOT_CELEBRATE : MASCOT_IMAGE;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleFinish}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            { backgroundColor: colors.card, transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Mascot */}
          <Animated.View style={[styles.mascotArea, { transform: [{ translateY: bounceAnim }] }]}>
            <View style={[styles.mascotRing, { borderColor }]}>
              <Image source={mascotSrc} style={styles.mascotImg} />
            </View>
            {isCelebrate && (
              <View style={styles.sparkleRow}>
                {["✨", "🌟", "✨"].map((s, i) => (
                  <Text key={i} style={styles.sparkle}>{s}</Text>
                ))}
              </View>
            )}
          </Animated.View>

          <Text style={[styles.nameLabel, { color: "#8b5cf6" }]}>{mascotName}</Text>

          {/* Step content */}
          <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>{current.title}</Text>
            <View style={[styles.bubble, { backgroundColor: bgColor, borderColor }]}>
              <Text style={[styles.bubbleText, { color: "#1e293b" }]}>{current.message}</Text>
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
                    ? { backgroundColor: "#8b5cf6", width: 20 }
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
                <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Пропустить</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: borderColor, flex: isLast ? 1 : undefined }]}
              onPress={handleNext}
            >
              <Text style={styles.nextText}>{isLast ? "Начать учиться! 🚀" : "Далее"}</Text>
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
    width: "100%",
    maxWidth: 420,
    borderRadius: 28,
    padding: PAD,
    shadowColor: "#8b5cf6",
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  mascotArea: { alignItems: "center", marginBottom: 4 },
  mascotRing: {
    width: 160,
    height: 200,
    overflow: "hidden",
  },
  mascotImg: { width: "100%", height: "100%", resizeMode: "contain" },
  sparkleRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  sparkle: { fontSize: 18 },
  nameLabel: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 14,
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
