import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, Animated, StyleSheet, Modal, Dimensions,
} from "react-native";
import authStorage from "@/utils/authStorage";
import { AnimatedMascotImage } from "@/components/AnimatedMascotImage";

const { width: SCREEN_W } = Dimensions.get("window");
const PAD = Math.min(SCREEN_W * 0.06, 28);

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

  const accent   = "#8b5cf6";
  const cardW    = Math.min(SCREEN_W - 40, 420);
  const mascotW  = Math.round(cardW * 0.65);
  const mascotH  = Math.round(mascotW * 16 / 9);
  const overlap  = Math.round(mascotH * 0.30);
  const cardTopPad = overlap + 8;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleFinish}>
      <View style={styles.overlay}>
        <Animated.View style={{ width: cardW, alignItems: "center", transform: [{ scale: scaleAnim }] }}>

          {/* Mascot floats above panel */}
          <AnimatedMascotImage pose="wave" width={mascotW} height={mascotH} style={{ zIndex: 2 }} />

          {/* Content panel */}
          <View style={[styles.container, { width: cardW, marginTop: -overlap, paddingTop: cardTopPad }]}>

            {/* Big name on intro slide */}
            <Text
              style={[
                styles.nameLabel,
                {
                  color: "#c084fc",
                  // @ts-ignore web gradient
                  backgroundImage: "linear-gradient(90deg, #a78bfa, #c084fc, #e879f9)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                },
              ]}
            >
              {mascotName}
            </Text>

            {/* Glass content panel */}
            <Animated.View
              style={[
                styles.glassPanel,
                {
                  // @ts-ignore web backdropFilter
                  backdropFilter: "blur(22px) saturate(1.4)",
                  WebkitBackdropFilter: "blur(22px) saturate(1.4)",
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Text style={styles.stepTitle}>Привет! Я {mascotName}! 👋</Text>
              <View style={styles.bubble}>
                <Text style={styles.bubbleText}>
                  Я твой личный помощник в изучении английского. Давай покажу тебе, как всё устроено!
                </Text>
              </View>
            </Animated.View>

            {/* Single button */}
            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: accent }]} onPress={handleFinish}>
              <Text style={styles.nextText}>Давай! 🚀</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

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
    alignItems: "center",
  },
  nameLabel: {
    textAlign: "center",
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  glassPanel: {
    width: "100%",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.10)",
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.3,
    color: "#ffffff",
  },
  bubble: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(139,92,246,0.4)",
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 16,
    width: "100%",
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "500",
    textAlign: "center",
    color: "#ede9ff",
  },
  nextBtn: {
    width: "100%",
    borderRadius: 13,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.45)",
  },
  nextText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
