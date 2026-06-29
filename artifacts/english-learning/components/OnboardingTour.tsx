import React, { useEffect, useRef } from "react";
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
      {/* No dark overlay — floats over the live app */}
      <View style={styles.overlay} pointerEvents="box-none">
        <Animated.View
          style={{ width: cardW, alignItems: "center", transform: [{ scale: scaleAnim }] }}
          pointerEvents="auto"
        >
          {/* Mascot floats above the card */}
          <AnimatedMascotImage
            pose="wave"
            width={mascotW}
            height={mascotH}
            style={{ zIndex: 2 }}
          />

          {/* Glass card — transparent with purple border, mascot overlaps top */}
          <Animated.View
            style={[
              styles.glassPanel,
              {
                marginTop: -overlap,
                paddingTop: cardTopPad,
                // @ts-ignore web backdropFilter
                backdropFilter: "blur(24px) saturate(1.2)",
                WebkitBackdropFilter: "blur(24px) saturate(1.2)",
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

            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: accent }]}
              onPress={handleFinish}
            >
              <Text style={styles.nextText}>Давай! 🚀</Text>
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
  glassPanel: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(139,92,246,0.75)",
    /* transparent fill — see the blurred app through it */
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 22,
    alignItems: "center",
    shadowColor: "#8b5cf6",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 16,
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
    borderColor: "rgba(139,92,246,0.45)",
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 16,
    width: "100%",
    marginBottom: 16,
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
