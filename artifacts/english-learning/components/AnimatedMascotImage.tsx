/**
 * AnimatedMascotImage
 *
 * Two-frame sprite blink: open-eye image + closed-eye image stacked on top.
 * During a blink the closed-eye layer fades in (80ms), pauses, then fades out (80ms).
 * Because both images share the same art style the transition looks completely natural.
 *
 * Subtle breathing: scale 1.0 ↔ 1.007 every ~3.6 s.
 */

import React, { useEffect, useRef, useCallback } from "react";
import { View, Image, Animated, StyleSheet } from "react-native";

export type MascotPose =
  | "wave"
  | "celebrate"
  | "think"
  | "happy"
  | "excited"
  | "curious"
  | "point"
  | "laugh"
  | "sit"
  | "lie";

const RATIO: Record<MascotPose, number> = {
  wave:      9 / 16,
  celebrate: 9 / 16,
  think:     9 / 16,
  happy:     9 / 16,
  excited:   9 / 16,
  curious:   9 / 16,
  point:     9 / 16,
  laugh:     9 / 16,
  sit:       9 / 16,
  lie:       16 / 9,
};

const OPEN: Record<MascotPose, any> = {
  wave:      require("../assets/images/mascot_full.png"),
  celebrate: require("../assets/images/mascot_full_celebrate.png"),
  think:     require("../assets/images/mascot_full_think.png"),
  happy:     require("../assets/images/mascot_happy.png"),
  excited:   require("../assets/images/mascot_excited.png"),
  curious:   require("../assets/images/mascot_curious.png"),
  point:     require("../assets/images/mascot_point.png"),
  laugh:     require("../assets/images/mascot_laugh.png"),
  sit:       require("../assets/images/mascot_sit.png"),
  lie:       require("../assets/images/mascot_lie.png"),
};

const BLINK: Record<MascotPose, any> = {
  wave:      require("../assets/images/mascot_full_blink.png"),
  celebrate: require("../assets/images/mascot_full_celebrate_blink.png"),
  think:     require("../assets/images/mascot_full_think_blink.png"),
  happy:     require("../assets/images/mascot_happy_blink.png"),
  excited:   require("../assets/images/mascot_excited_blink.png"),
  curious:   require("../assets/images/mascot_curious_blink.png"),
  point:     require("../assets/images/mascot_point_blink.png"),
  laugh:     require("../assets/images/mascot_laugh_blink.png"),
  sit:       require("../assets/images/mascot_sit_blink.png"),
  lie:       require("../assets/images/mascot_lie_blink.png"),
};

interface Props {
  pose?:   MascotPose;
  width?:  number;
  height?: number;
  style?:  any;
}

export function AnimatedMascotImage({
  pose = "wave",
  width = 200,
  height,
  style,
}: Props) {
  const imgW = width;
  const imgH = height ?? Math.round(width / RATIO[pose]);

  const breathe    = useRef(new Animated.Value(1)).current;
  const blinkOpac  = useRef(new Animated.Value(0)).current;

  // Breathing
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.007, duration: 1800, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 1,     duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Blink
  const doBlink = useCallback(() => {
    const close = Animated.timing(blinkOpac, { toValue: 1, duration: 75,  useNativeDriver: true });
    const open  = Animated.timing(blinkOpac, { toValue: 0, duration: 75,  useNativeDriver: true });
    const pause = Animated.delay(60);

    const seq = Math.random() > 0.5
      ? Animated.sequence([close, pause, open])
      : Animated.sequence([
          close, pause, open,
          Animated.delay(120),
          close, Animated.delay(40), open,
        ]);

    seq.start();
  }, [blinkOpac]);

  useEffect(() => {
    let alive = true;
    const schedule = () => {
      if (!alive) return;
      const delay = 2500 + Math.random() * 2000;
      setTimeout(() => {
        if (!alive) return;
        doBlink();
        schedule();
      }, delay);
    };
    schedule();
    return () => { alive = false; };
  }, [pose, doBlink]);

  return (
    <Animated.View
      style={[
        { width: imgW, height: imgH },
        style,
        { transform: [{ scale: breathe }] },
      ]}
    >
      {/* Open eyes — always visible */}
      <Image
        source={OPEN[pose]}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
      />

      {/* Closed eyes — fades in during blink */}
      <Animated.Image
        source={BLINK[pose]}
        style={[StyleSheet.absoluteFill, { opacity: blinkOpac }]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}
