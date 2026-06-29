/**
 * AnimatedMascotImage
 *
 * Shows the mascot PNG with two life-like animations:
 *
 * 1. Slow breathing — very subtle scale 1.0 ↔ 1.007 (~3.6 s loop).
 *
 * 2. Eyelid blink — a React Native View pair (no SVG drawn on top of image)
 *    positioned at each eye.  Each "eye" container has:
 *      • overflow:"hidden" + borderRadius  →  clips its children to an ellipse
 *      • An inner View (the lid) that slides via translateY from
 *        ABOVE the clip boundary (invisible) DOWN to cover the eye (closed).
 *    This is exactly how a real eyelid works: the lid descends from the top,
 *    pauses a moment, then retracts.  The lid colour (#d4d0c8) matches the
 *    leopard's light-grey fur so the closed eye looks natural.
 *
 * Nothing is drawn on top of the original PNG artwork.
 */

import React, { useEffect, useRef, useCallback } from "react";
import { View, Image, Animated, StyleSheet } from "react-native";

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

/** Width-to-height ratio for each pose image */
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

// ─── Eye positions ────────────────────────────────────────────────────────────
// Expressed as fractions of the rendered image (width × height).
// (lx, ly)  left-eye  centre;  (rx, ry)  right-eye centre.
// erx = horizontal half-width,  ery = vertical half-height of eyelid area.
// Values calibrated visually for each chibi pose (all 9:16 except "lie").
interface EyePos {
  lx: number; ly: number;
  rx: number; ry: number;
  erx: number; ery: number;
}

const EYE: Record<MascotPose, EyePos> = {
  wave:      { lx:.365, ly:.270, rx:.565, ry:.270, erx:.092, ery:.050 },
  celebrate: { lx:.350, ly:.258, rx:.558, ry:.258, erx:.096, ery:.054 },
  think:     { lx:.356, ly:.290, rx:.556, ry:.290, erx:.092, ery:.050 },
  happy:     { lx:.366, ly:.276, rx:.566, ry:.276, erx:.092, ery:.050 },
  excited:   { lx:.355, ly:.258, rx:.560, ry:.258, erx:.096, ery:.054 },
  curious:   { lx:.362, ly:.270, rx:.564, ry:.270, erx:.092, ery:.050 },
  point:     { lx:.374, ly:.268, rx:.574, ry:.268, erx:.092, ery:.048 },
  laugh:     { lx:.370, ly:.266, rx:.572, ry:.266, erx:.092, ery:.048 },
  sit:       { lx:.368, ly:.288, rx:.568, ry:.288, erx:.094, ery:.052 },
  // lie is landscape — positions are tuned separately
  lie:       { lx:.270, ly:.428, rx:.408, ry:.408, erx:.076, ery:.072 },
};

// Eyelid colour — matches the leopard's light-grey fur above the eyes
const LID_COLOR = "#d4d0c8";

// ─── Component ────────────────────────────────────────────────────────────────
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

  const ep   = EYE[pose];

  // Pixel sizes derived from fractions
  const lx  = ep.lx  * imgW;
  const ly  = ep.ly  * imgH;
  const rx  = ep.rx  * imgW;
  const ry  = ep.ry  * imgH;
  const erx = ep.erx * imgW;   // horizontal half-width
  const ery = ep.ery * imgW;   // vertical half-height (use imgW for consistency)

  // The lid fills the eye container top-to-bottom.
  // Start position: fully above the container (invisible).
  const lidH = ery * 2 + 4;

  // ── Animated values ──────────────────────────────────────────────────────
  const breathe  = useRef(new Animated.Value(1)).current;
  const lidLY    = useRef(new Animated.Value(-lidH)).current;  // left  eyelid Y
  const lidRY    = useRef(new Animated.Value(-lidH)).current;  // right eyelid Y

  // ── Breathing pulse ──────────────────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.007, duration: 1800, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 1,     duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Blink loop ───────────────────────────────────────────────────────────
  const doBlink = useCallback(() => {
    const slideDown = (v: Animated.Value) =>
      Animated.timing(v, { toValue: 0,    duration: 70,  useNativeDriver: true });
    const slideUp   = (v: Animated.Value) =>
      Animated.timing(v, { toValue: -lidH, duration: 70, useNativeDriver: true });

    // Close both lids simultaneously, hold, then open
    const singleBlink = Animated.sequence([
      Animated.parallel([slideDown(lidLY), slideDown(lidRY)]),
      Animated.delay(55),
      Animated.parallel([slideUp(lidLY), slideUp(lidRY)]),
    ]);

    // Occasionally double-blink
    const seq = Math.random() > 0.55
      ? Animated.sequence([
          singleBlink,
          Animated.delay(110),
          Animated.parallel([slideDown(lidLY), slideDown(lidRY)]),
          Animated.delay(45),
          Animated.parallel([slideUp(lidLY), slideUp(lidRY)]),
        ])
      : singleBlink;

    seq.start();
  }, [lidLY, lidRY, lidH]);

  useEffect(() => {
    let alive = true;
    const schedule = () => {
      if (!alive) return;
      const delay = 2800 + Math.random() * 1800;
      setTimeout(() => {
        if (!alive) return;
        doBlink();
        schedule();
      }, delay);
    };
    schedule();
    return () => { alive = false; };
  }, [pose, doBlink]);

  // ── Eye lid View helper ──────────────────────────────────────────────────
  // One "eyelid unit" = a clip-container + a sliding lid inside
  const EyeLid = ({
    cx, cy, lidY,
  }: {
    cx: number; cy: number; lidY: Animated.Value;
  }) => (
    <View
      pointerEvents="none"
      style={{
        position:     "absolute",
        left:         cx - erx,
        top:          cy - ery,
        width:        erx * 2,
        height:       lidH,
        borderRadius: erx,          // elliptical clip
        overflow:     "hidden",
      }}
    >
      <Animated.View
        style={{
          position:        "absolute",
          top:             0,
          left:            0,
          right:           0,
          height:          lidH,
          backgroundColor: LID_COLOR,
          transform:       [{ translateY: lidY }],
        }}
      />
    </View>
  );

  return (
    <Animated.View
      style={[
        { width: imgW, height: imgH },
        style,
        { transform: [{ scale: breathe }] },
      ]}
    >
      {/* ── Mascot PNG — completely unmodified ── */}
      <Image
        source={IMAGES[pose]}
        style={{ width: imgW, height: imgH, resizeMode: "contain" }}
      />

      {/* ── Sliding eyelids (left + right) ── */}
      <EyeLid cx={lx} cy={ly} lidY={lidLY} />
      <EyeLid cx={rx} cy={ry} lidY={lidRY} />
    </Animated.View>
  );
}
