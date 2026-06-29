import React, { useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, Animated, StyleSheet, Modal, Dimensions,
} from "react-native";
import authStorage from "@/utils/authStorage";
import { AnimatedMascotImage } from "@/components/AnimatedMascotImage";

const { width: SCREEN_W } = Dimensions.get("window");
const PAD = Math.min(SCREEN_W * 0.06, 24);

export const TOUR_STORAGE_KEY = "onboarding_tour_done_v1";

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
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 100, friction: 10, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleFinish = async () => {
    await authStorage.setItem(TOUR_STORAGE_KEY, "1");
    onFinish();
  };

  if (!visible) return null;

  const accent  = "#8b5cf6";
  const cardW   = Math.min(SCREEN_W - 40, 420);
  // Mascot: wide enough to show the full body clearly
  const mascotW = Math.round(cardW * 0.70);
  const mascotH = Math.round(mascotW * 16 / 9);
  // Small overlap — just tuck the feet into the card, body stays fully visible
  const overlap = Math.round(mascotH * 0.12);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleFinish}>
      {/* Dark overlay — mascot pops against it */}
      <View style={styles.overlay}>
        <Animated.View
          style={{ width: cardW, alignItems: "center", transform: [{ scale: scaleAnim }] }}
        >
          {/* Mascot — full body above the card */}
          <AnimatedMascotImage
            pose="wave"
            width={mascotW}
            height={mascotH}
            style={{ zIndex: 2 }}
          />

          {/* Semi-transparent card — slides in from below */}
          <Animated.View
            style={[
              styles.card,
              {
                marginTop: -overlap,
                paddingTop: overlap + 12,
                // @ts-ignore web backdropFilter
                backdropFilter: "blur(20px) saturate(1.3)",
                WebkitBackdropFilter: "blur(20px) saturate(1.3)",
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Name — gradient purple, slightly larger */}
            <Text
              style={[
                styles.nameLabel,
                {
                  // @ts-ignore web gradient text
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
            <Text style={styles.title}>Привет! Я {mascotName}! 👋</Text>

            {/* Description bubble */}
            <View style={styles.bubble}>
              <Text style={styles.bubbleText}>
                Я твой личный помощник в изучении английского. Давай покажу тебе, как всё устроено!
              </Text>
            </View>

            {/* CTA button */}
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: accent }]}
              onPress={handleFinish}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>Давай! 🚀</Text>
            </TouchableOpacity>
          </Animated.View>
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
    padding: PAD,
  },
  card: {
    width: "100%",
    borderRadius: 26,
    // Semi-transparent dark purple — you can see blurred app behind it
    backgroundColor: "rgba(30,22,55,0.70)",
    borderWidth: 2,
    borderColor: "rgba(139,92,246,0.70)",
    padding: 20,
    alignItems: "center",
    shadowColor: "#8b5cf6",
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 18,
  },
  nameLabel: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    color: "#c084fc",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    color: "#ffffff",
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  bubble: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(139,92,246,0.45)",
    backgroundColor: "rgba(255,255,255,0.07)",
    padding: 16,
    marginBottom: 16,
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
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.40)",
  },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
