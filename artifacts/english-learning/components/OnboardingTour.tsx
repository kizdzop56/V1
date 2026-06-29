import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, Animated, StyleSheet, Modal, Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { AnimatedMascotImage } from "@/components/AnimatedMascotImage";
import authStorage from "@/utils/authStorage";

const { width: SCREEN_W } = Dimensions.get("window");

export const TOUR_STORAGE_KEY = "onboarding_tour_done_v1";

// Transparent animated WebP (white bg flood-filled out, alpha preserved).
// expo-image autoplays animated WebP with transparency on web + native.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const WAVE_WEBP = require("../assets/images/mascot_wave.webp");

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
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 340, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 90, friction: 10, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleFinish = async () => {
    await authStorage.setItem(TOUR_STORAGE_KEY, "1");
    onFinish();
  };

  if (!visible) return null;

  const cardW   = Math.min(SCREEN_W - 32, 400);
  // mascot_wave.webp is 672x544 (landscape) — keep its true ratio so it
  // isn't letterboxed into a tall box and rendered tiny.
  const mascotW = cardW;
  const mascotH = Math.round(mascotW * (544 / 672));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleFinish}>
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
          <Text style={styles.title}>Привет!</Text>

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
            <Text style={styles.desc}>
              Я твой личный помощник в изучении английского.{"\n"}
              Давай покажу тебе, как всё устроено!
            </Text>
          </View>

          {/* CTA */}
          <TouchableOpacity style={styles.btn} onPress={handleFinish} activeOpacity={0.85}>
            <Text style={styles.btnText}>Давай! 🚀</Text>
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
