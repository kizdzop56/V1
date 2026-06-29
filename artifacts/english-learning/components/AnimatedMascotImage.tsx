/**
 * AnimatedMascotImage
 *
 * Shows the mascot PNG (transparent background) with two animations:
 *
 * 1. Breathing — scale 1.0 ↔ 1.008 every ~3.6 s.
 *
 * 2. Eyelid blink — two View pairs positioned exactly over each eye.
 *    Each pair is an outer clip-container (overflow:"hidden", elliptical
 *    borderRadius) plus an inner Animated.View (the "lid").
 *    The lid slides translateY from  –lidH  (above the clip → invisible)
 *    to  0  (fills the clip → eye looks closed).
 *    Lid colour matches the mascot's light-grey fur so it blends in.
 */

import React, { useEffect, useRef, useCallback } from "react";
import { View, Image, Animated } from "react-native";

// ─── Pose types & assets ─────────────────────────────────────────────────────
export type MascotPose =
  | "wave" | "celebrate" | "think" | "happy" | "excited"
  | "curious" | "point" | "laugh" | "sit" | "lie";

const RATIO: Record<MascotPose, number> = {
  wave: 9/16, celebrate: 9/16, think: 9/16, happy: 9/16, excited: 9/16,
  curious: 9/16, point: 9/16, laugh: 9/16, sit: 9/16, lie: 16/9,
};

const SRC: Record<MascotPose, any> = {
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

// ─── Eye calibration (fractions of rendered pixel size) ──────────────────────
// lx/ly = left-eye centre, rx/ry = right-eye centre
// erx = horizontal radius, ery = vertical radius (both relative to imgW)
interface EyePos { lx:number; ly:number; rx:number; ry:number; erx:number; ery:number; }

const EYE: Record<MascotPose, EyePos> = {
  wave:      { lx:.365, ly:.270, rx:.565, ry:.270, erx:.092, ery:.052 },
  celebrate: { lx:.350, ly:.258, rx:.558, ry:.258, erx:.096, ery:.056 },
  think:     { lx:.356, ly:.290, rx:.556, ry:.290, erx:.092, ery:.052 },
  happy:     { lx:.366, ly:.276, rx:.566, ry:.276, erx:.092, ery:.052 },
  excited:   { lx:.355, ly:.258, rx:.560, ry:.258, erx:.096, ery:.056 },
  curious:   { lx:.362, ly:.270, rx:.564, ry:.270, erx:.092, ery:.052 },
  point:     { lx:.374, ly:.268, rx:.574, ry:.268, erx:.092, ery:.050 },
  laugh:     { lx:.370, ly:.266, rx:.572, ry:.266, erx:.092, ery:.050 },
  sit:       { lx:.368, ly:.288, rx:.568, ry:.288, erx:.094, ery:.054 },
  lie:       { lx:.270, ly:.428, rx:.408, ry:.408, erx:.076, ery:.072 },
};

// Eyelid colour — matches the mascot's light-grey cream fur
const LID = "#d0ccc4";

// ─── Component ───────────────────────────────────────────────────────────────
interface Props {
  pose?:   MascotPose;
  width?:  number;
  height?: number;
  style?:  any;
}

export function AnimatedMascotImage({ pose = "wave", width = 200, height, style }: Props) {
  const imgW = width;
  const imgH = height ?? Math.round(width / RATIO[pose]);

  const ep   = EYE[pose];
  const erx  = ep.erx * imgW;          // horizontal half-width of eye area
  const ery  = ep.ery * imgW;          // vertical   half-height  (uses imgW for proportion)
  const lidH = ery * 2 + 4;            // total height of the clip container

  const breathe = useRef(new Animated.Value(1)).current;
  const lidLY   = useRef(new Animated.Value(-lidH)).current;
  const lidRY   = useRef(new Animated.Value(-lidH)).current;

  // ── Breathing ──────────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue:1.008, duration:1900, useNativeDriver:true }),
        Animated.timing(breathe, { toValue:1,     duration:1900, useNativeDriver:true }),
      ])
    ).start();
  }, []);

  // ── Blink ──────────────────────────────────────────────────────────────────
  const doBlink = useCallback(() => {
    const close = (v: Animated.Value) => Animated.timing(v, { toValue:0,    duration:130, useNativeDriver:true });
    const open  = (v: Animated.Value) => Animated.timing(v, { toValue:-lidH, duration:150, useNativeDriver:true });

    const singleBlink = Animated.sequence([
      Animated.parallel([close(lidLY), close(lidRY)]),
      Animated.delay(85),
      Animated.parallel([open(lidLY),  open(lidRY)]),
    ]);

    const doubleBlink = Animated.sequence([
      singleBlink,
      Animated.delay(160),
      Animated.parallel([close(lidLY), close(lidRY)]),
      Animated.delay(65),
      Animated.parallel([open(lidLY),  open(lidRY)]),
    ]);

    (Math.random() > 0.55 ? singleBlink : doubleBlink).start();
  }, [lidLY, lidRY, lidH]);

  useEffect(() => {
    let alive = true;
    const schedule = () => {
      if (!alive) return;
      setTimeout(() => {
        if (!alive) return;
        doBlink();
        schedule();
      }, 3000 + Math.random() * 2500);
    };
    schedule();
    return () => { alive = false; };
  }, [pose, doBlink]);

  // ── Eyelid helper ──────────────────────────────────────────────────────────
  // clipW/clipH define the clipping ellipse; lidY is the Animated.Value
  const Lid = ({ cx, cy, lidY }: { cx:number; cy:number; lidY:Animated.Value }) => (
    <View
      pointerEvents="none"
      style={{
        position:     "absolute",
        left:         cx - erx,
        top:          cy - ery - 2,
        width:        erx * 2,
        height:       lidH,
        borderRadius: erx,    // makes the clipping zone elliptical
        overflow:     "hidden",
      }}
    >
      <Animated.View
        style={{
          position:        "absolute",
          top:             0, left: 0, right: 0,
          height:          lidH,
          backgroundColor: LID,
          transform:       [{ translateY: lidY }],
        }}
      />
    </View>
  );

  // Pixel eye centres
  const lx = ep.lx * imgW, ly = ep.ly * imgH;
  const rx = ep.rx * imgW, ry = ep.ry * imgH;

  return (
    <Animated.View
      style={[
        { width: imgW, height: imgH, position: "relative" },
        style,
        { transform: [{ scale: breathe }] },
      ]}
    >
      <Image source={SRC[pose]} style={{ width: imgW, height: imgH }} resizeMode="contain" />

      {/* Eyelids — drawn on top of transparent PNG */}
      <Lid cx={lx} cy={ly} lidY={lidLY} />
      <Lid cx={rx} cy={ry} lidY={lidRY} />
    </Animated.View>
  );
}
