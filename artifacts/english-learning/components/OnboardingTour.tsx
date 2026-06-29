import React, { useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, Animated, StyleSheet, Modal, Dimensions,
} from "react-native";
import authStorage from "@/utils/authStorage";

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

  const accent = "#8b5cf6";
  const cardW  = Math.min(SCREEN_W - 40, 420);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleFinish}>
      {/* No backdrop — card floats over the live app */}
      <View style={styles.overlay} pointerEvents="box-none">
        <Animated.View
          style={{ width: cardW, alignItems: "center", transform: [{ scale: scaleAnim }] }}
          pointerEvents="auto"
        >
          {/* Glass card — only the rectangle with text */}
          <Animated.View
            style={[
              styles.glassPanel,
              {
                // @ts-ignore web backdropFilter
                backdropFilter: "blur(24px) saturate(1.3)",
                WebkitBackdropFilter: "blur(24px) saturate(1.3)",
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

            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: accent }]} onPress={handleFinish}>
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
    backgroundColor: "rgba(42,36,60,0.82)",
    padding: 22,
    alignItems: "center",
    shadowColor: "#8b5cf6",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 18,
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
