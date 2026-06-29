import React, { useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, Animated, StyleSheet, Modal, Dimensions, Platform,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import authStorage from "@/utils/authStorage";

const { width: SCREEN_W } = Dimensions.get("window");
const PAD = Math.min(SCREEN_W * 0.06, 24);

export const TOUR_STORAGE_KEY = "onboarding_tour_done_v1";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const GREETING_VIDEO = require("../assets/images/mascot_greeting.mp4");

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
  const videoW  = Math.round(cardW * 0.70);
  const videoH  = Math.round(videoW * 16 / 9);
  const overlap = Math.round(videoH * 0.12);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleFinish}>
      <View style={styles.overlay}>
        <Animated.View
          style={{ width: cardW, alignItems: "center", transform: [{ scale: scaleAnim }] }}
        >
          {/* Mascot greeting animation — mixBlendMode screen removes white bg on web */}
          <View style={{ width: videoW, height: videoH, zIndex: 2 }}>
            <Video
              source={GREETING_VIDEO}
              style={[
                { width: videoW, height: videoH },
                Platform.OS === "web" ? { mixBlendMode: "screen" } as any : {},
              ]}
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay
              isMuted
            />
          </View>

          {/* Card floats below mascot */}
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
            {/* Name gradient */}
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

            {/* Title — no emoji */}
            <Text style={styles.title}>Привет!</Text>

            {/* Description — plain text, no bubble/border */}
            <Text style={styles.desc}>
              Я твой личный помощник в изучении английского. Давай покажу тебе, как всё устроено!
            </Text>

            {/* CTA */}
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
    backgroundColor: "#000000aa",
    justifyContent: "center",
    alignItems: "center",
    padding: PAD,
  },
  card: {
    width: "100%",
    borderRadius: 26,
    backgroundColor: "transparent",
    padding: 20,
    alignItems: "center",
    shadowColor: "#8b5cf6",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 14,
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
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    color: "#ffffff",
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  desc: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "500",
    textAlign: "center",
    color: "#ede9ff",
    marginBottom: 20,
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
