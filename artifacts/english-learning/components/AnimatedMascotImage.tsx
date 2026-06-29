/**
 * AnimatedMascotImage
 *
 * Renders the mascot PNG image with two subtle animations:
 *  1. Slow breathing pulse (very slight scale 1.0 ↔ 1.008, period ~3 s)
 *  2. Eye blink: light-grey eyelid ellipses + anime closed-eye arcs appear
 *     for ~160 ms every 3–5 s
 *
 * The mascot IMAGE is unchanged — no part-specific SVG drawings on top.
 * The SVG overlay only activates during the brief blink and is transparent otherwise.
 */

import React, { useEffect, useRef } from "react";
import { View, Image, Animated, StyleSheet } from "react-native";
import Svg, { Path, Ellipse } from "react-native-svg";

// ─── Pose registry ────────────────────────────────────────────────────────────
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

/** Aspect ratio width:height for each pose */
const POSE_RATIO: Record<MascotPose, number> = {
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

const IMAGES: Record<MascotPose, any> = {
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

/**
 * Eye positions as fraction of the rendered image (width × height).
 * lcx/lcy = left-eye centre, rcx/rcy = right-eye centre.
 * erx = horizontal half-width, ery = vertical half-height of the eyelid ellipse.
 *
 * Calibrated by visual inspection of each 9:16 image at approx. w=200 h=356.
 * Portrait poses share similar face proportions, so values are close.
 */
interface EyePos { lcx: number; lcy: number; rcx: number; rcy: number; erx: number; ery: number; }

const EYE: Record<MascotPose, EyePos> = {
  wave:      { lcx:.365, lcy:.270, rcx:.565, rcy:.270, erx:.090, ery:.048 },
  celebrate: { lcx:.350, lcy:.255, rcx:.560, rcy:.255, erx:.095, ery:.052 },
  think:     { lcx:.355, lcy:.290, rcx:.555, rcy:.290, erx:.090, ery:.048 },
  happy:     { lcx:.365, lcy:.275, rcx:.565, rcy:.275, erx:.090, ery:.048 },
  excited:   { lcx:.355, lcy:.255, rcx:.560, rcy:.255, erx:.095, ery:.052 },
  curious:   { lcx:.360, lcy:.268, rcx:.563, rcy:.268, erx:.090, ery:.048 },
  point:     { lcx:.373, lcy:.268, rcx:.573, rcy:.268, erx:.090, ery:.047 },
  laugh:     { lcx:.368, lcy:.265, rcx:.570, rcy:.265, erx:.090, ery:.047 },
  sit:       { lcx:.368, lcy:.290, rcx:.568, rcy:.290, erx:.092, ery:.048 },
  // lie is landscape; eyes are in the left side of image
  lie:       { lcx:.275, lcy:.430, rcx:.415, rcy:.410, erx:.075, ery:.070 },
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  pose?: MascotPose;
  /** Explicit width; height is derived from pose aspect ratio if not provided */
  width?: number;
  height?: number;
  style?: any;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AnimatedMascotImage({ pose = "wave", width = 200, height, style }: Props) {
  const ratio  = POSE_RATIO[pose];
  const imgW   = width;
  const imgH   = height ?? Math.round(width / ratio);

  const eyePos = EYE[pose];
  const breathe   = useRef(new Animated.Value(1)).current;
  const blinkOpac = useRef(new Animated.Value(0)).current;

  // ── Breathing pulse ────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.007, duration: 1800, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 1,     duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Blink loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let running = true;
    const schedule = () => {
      if (!running) return;
      const delay = 2600 + Math.random() * 2000;
      setTimeout(() => {
        if (!running) return;
        Animated.sequence([
          Animated.timing(blinkOpac, { toValue: 1, duration: 70,  useNativeDriver: true }),
          Animated.delay(55),
          Animated.timing(blinkOpac, { toValue: 0, duration: 70,  useNativeDriver: true }),
          // occasional double blink
          ...( Math.random() > 0.55 ? [
            Animated.delay(110),
            Animated.timing(blinkOpac, { toValue: 1, duration: 60, useNativeDriver: true }),
            Animated.delay(45),
            Animated.timing(blinkOpac, { toValue: 0, duration: 60, useNativeDriver: true }),
          ] : [] ),
        ]).start(() => schedule());
      }, delay);
    };
    schedule();
    return () => { running = false; };
  }, [pose]);

  // ── Derived eye pixel positions ────────────────────────────────────────────
  const lx  = eyePos.lcx * imgW;
  const ly  = eyePos.lcy * imgH;
  const rx  = eyePos.rcx * imgW;
  const ry  = eyePos.rcy * imgH;
  const erx = eyePos.erx * imgW;   // horizontal half-width of eyelid
  const ery = eyePos.ery * imgW;   // vertical half-height (relative to width for consistency)

  // Closed-eye arc: convex upward — looks like lid closing from top
  // Drawn from left edge → through top of arc → right edge
  const arcL = `M ${lx - erx} ${ly} Q ${lx} ${ly - ery * 2.2} ${lx + erx} ${ly}`;
  const arcR = `M ${rx - erx} ${ry} Q ${rx} ${ry - ery * 2.2} ${rx + erx} ${ry}`;

  // Eyelid fill colour: close match to the leopard's light fur
  const lidFill = "#dedad2";

  return (
    <Animated.View
      style={[
        { width: imgW, height: imgH },
        style,
        { transform: [{ scale: breathe }] },
      ]}
    >
      {/* ── Clean PNG image — untouched ── */}
      <Image
        source={IMAGES[pose]}
        style={{ width: imgW, height: imgH, resizeMode: "contain" }}
      />

      {/* ── Blink overlay — only visible for ~195 ms during a blink ── */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: blinkOpac }]}
        pointerEvents="none"
      >
        <Svg width={imgW} height={imgH}>
          {/* Left eye eyelid */}
          <Ellipse cx={lx} cy={ly} rx={erx + 1} ry={ery + 4} fill={lidFill} />
          <Path
            d={arcL}
            stroke="#2a2420"
            strokeWidth={ery * 1.6}
            strokeLinecap="round"
            fill="none"
          />

          {/* Right eye eyelid */}
          <Ellipse cx={rx} cy={ry} rx={erx + 1} ry={ery + 4} fill={lidFill} />
          <Path
            d={arcR}
            stroke="#2a2420"
            strokeWidth={ery * 1.6}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </Animated.View>
  );
}
