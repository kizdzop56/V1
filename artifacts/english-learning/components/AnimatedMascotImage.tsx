/**
 * AnimatedMascotImage
 *
 * Renders the mascot PNG with an SVG overlay that provides:
 *  - Eye blinking (anime-style curved lines fade in/out)
 *  - Ear wiggle (tiny overlay triangles rotate occasionally)
 *  - Tail swing  (a separate curved path that oscillates)
 *
 * The mascot IMAGE itself is completely static — no bounce/jump.
 */

import React, { useEffect, useRef, useCallback } from "react";
import { View, Image, Animated, StyleSheet } from "react-native";
import Svg, { Path, G, Ellipse } from "react-native-svg";

// ─── Pose registry ──────────────────────────────────────────────────────────
export type MascotPose =
  | "wave"
  | "celebrate"
  | "think"
  | "happy"
  | "excited"
  | "curious"
  | "point"
  | "laugh";

const IMAGES: Record<MascotPose, any> = {
  wave:      require("../assets/images/mascot_full.png"),
  celebrate: require("../assets/images/mascot_full_celebrate.png"),
  think:     require("../assets/images/mascot_full_think.png"),
  happy:     require("../assets/images/mascot_happy.png"),
  excited:   require("../assets/images/mascot_excited.png"),
  curious:   require("../assets/images/mascot_curious.png"),
  point:     require("../assets/images/mascot_point.png"),
  laugh:     require("../assets/images/mascot_laugh.png"),
};

// Eye and ear overlay positions as a fraction of the rendered image size.
// (cx, cy) = centre of each eye; (ex, ey) = half-widths used for the arc.
// These are calibrated to match the generated chibi images (9:16 aspect ratio).
interface EyeConfig {
  lx: number; ly: number; // left-eye centre (0–1)
  rx: number; ry: number; // right-eye centre
  ew: number; eh: number; // half-width & half-height of closed-eye arc
  // ear pivot points (fractional of image size)
  earL: { px: number; py: number };
  earR: { px: number; py: number };
  // tail base pivot (fractional)
  tail:  { px: number; py: number; len: number; startAngle: number };
}

const EYE_CONFIG: Record<MascotPose, EyeConfig> = {
  wave:      { lx:.365, ly:.265, rx:.56, ry:.265, ew:.072, eh:.038, earL:{px:.29,py:.10}, earR:{px:.70,py:.10}, tail:{px:.72,py:.80,len:.18,startAngle:-20} },
  celebrate: { lx:.355, ly:.265, rx:.56, ry:.265, ew:.076, eh:.042, earL:{px:.27,py:.09}, earR:{px:.72,py:.09}, tail:{px:.75,py:.82,len:.16,startAngle:10} },
  think:     { lx:.355, ly:.295, rx:.555, ry:.295, ew:.076, eh:.040, earL:{px:.26,py:.08}, earR:{px:.72,py:.08}, tail:{px:.70,py:.85,len:.20,startAngle:-25} },
  happy:     { lx:.365, ly:.275, rx:.57, ry:.275, ew:.072, eh:.038, earL:{px:.29,py:.10}, earR:{px:.71,py:.10}, tail:{px:.72,py:.78,len:.17,startAngle:-15} },
  excited:   { lx:.355, ly:.255, rx:.565, ry:.255, ew:.078, eh:.042, earL:{px:.27,py:.09}, earR:{px:.72,py:.09}, tail:{px:.73,py:.81,len:.16,startAngle:15} },
  curious:   { lx:.365, ly:.270, rx:.57, ry:.270, ew:.072, eh:.038, earL:{px:.29,py:.10}, earR:{px:.71,py:.10}, tail:{px:.71,py:.82,len:.18,startAngle:-20} },
  point:     { lx:.375, ly:.265, rx:.575, ry:.265, ew:.072, eh:.037, earL:{px:.29,py:.09}, earR:{px:.71,py:.09}, tail:{px:.72,py:.80,len:.17,startAngle:-18} },
  laugh:     { lx:.370, ly:.265, rx:.575, ry:.265, ew:.074, eh:.038, earL:{px:.28,py:.09}, earR:{px:.71,py:.09}, tail:{px:.72,py:.82,len:.17,startAngle:-20} },
};

// ─── Animated SVG wrappers ───────────────────────────────────────────────────
const AnimatedG = Animated.createAnimatedComponent(G);

// ─── Component ───────────────────────────────────────────────────────────────
interface Props {
  pose?: MascotPose;
  width?: number;
  height?: number;
  style?: any;
}

export function AnimatedMascotImage({ pose = "wave", width = 200, height = 280, style }: Props) {
  const cfg = EYE_CONFIG[pose];

  // ── Animation values ──────────────────────────────────────────────────────
  const blinkOpacity = useRef(new Animated.Value(0)).current;
  const earLRotate   = useRef(new Animated.Value(0)).current;
  const earRRotate   = useRef(new Animated.Value(0)).current;
  const tailAngle    = useRef(new Animated.Value(cfg.tail.startAngle)).current;

  // ── Blink loop ─────────────────────────────────────────────────────────────
  const startBlinkLoop = useCallback(() => {
    const blink = Animated.sequence([
      Animated.delay(2800 + Math.random() * 1800),
      Animated.timing(blinkOpacity, { toValue: 1, duration: 80,  useNativeDriver: true }),
      Animated.delay(60),
      Animated.timing(blinkOpacity, { toValue: 0, duration: 80,  useNativeDriver: true }),
      // occasional double-blink
      ...(Math.random() > 0.6 ? [
        Animated.delay(120),
        Animated.timing(blinkOpacity, { toValue: 1, duration: 70, useNativeDriver: true }),
        Animated.delay(50),
        Animated.timing(blinkOpacity, { toValue: 0, duration: 70, useNativeDriver: true }),
      ] : []),
    ]);
    Animated.loop(blink).start();
  }, [blinkOpacity]);

  // ── Ear wiggle loop ────────────────────────────────────────────────────────
  const startEarLoop = useCallback(() => {
    const wiggle = (anim: Animated.Value, dir: 1 | -1) =>
      Animated.sequence([
        Animated.delay(3500 + Math.random() * 2500),
        Animated.timing(anim, { toValue: dir * 10, duration: 140, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0,        duration: 140, useNativeDriver: true }),
        Animated.timing(anim, { toValue: dir * 7,  duration: 120, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0,        duration: 120, useNativeDriver: true }),
      ]);
    Animated.loop(wiggle(earLRotate,  1)).start();
    Animated.loop(wiggle(earRRotate, -1)).start();
  }, [earLRotate, earRRotate]);

  // ── Tail swing loop ────────────────────────────────────────────────────────
  const startTailLoop = useCallback(() => {
    const swing = Animated.loop(
      Animated.sequence([
        Animated.timing(tailAngle, { toValue: cfg.tail.startAngle + 28, duration: 900, useNativeDriver: true }),
        Animated.timing(tailAngle, { toValue: cfg.tail.startAngle - 8,  duration: 900, useNativeDriver: true }),
      ])
    );
    swing.start();
  }, [tailAngle, cfg.tail.startAngle]);

  useEffect(() => {
    startBlinkLoop();
    startEarLoop();
    startTailLoop();
  }, [pose]);

  // ── Derived pixel sizes ────────────────────────────────────────────────────
  const lx = cfg.lx * width;
  const ly = cfg.ly * height;
  const rx = cfg.rx * width;
  const ry = cfg.ry * height;
  const ew = cfg.ew * width;
  const eh = cfg.eh * height;

  // closed-eye arc: a horizontal "∪" (convex downward = lid closing)
  const makeEyeArc = (cx: number, cy: number) =>
    `M ${cx - ew} ${cy} Q ${cx} ${cy - eh * 2.5} ${cx + ew} ${cy}`;

  // ear overlay triangle paths (tiny, in SVG coords)
  const earLx = cfg.earL.px * width;
  const earLy = cfg.earL.py * height;
  const earRx = cfg.earR.px * width;
  const earRy = cfg.earR.py * height;
  const earSz = width * 0.055;

  // tail arc (drawn in local coordinates so rotation works around pivot)
  const tx = cfg.tail.px * width;
  const ty = cfg.tail.py * height;
  const tLen = cfg.tail.len * height;
  const tailPath = `M 0 0 Q ${width * 0.06} ${-tLen * 0.5} ${width * 0.04} ${-tLen}`;

  return (
    <View style={[{ width, height }, style]}>
      {/* ── Base mascot image (completely static) ── */}
      <Image
        source={IMAGES[pose]}
        style={{ width, height, resizeMode: "contain" }}
      />

      {/* ── SVG animation overlay ── */}
      <Svg
        width={width}
        height={height}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        {/* ── Tail (rotates around tail-base pivot) ── */}
        <AnimatedG
          style={{
            transform: [
              { translateX: tx },
              { translateY: ty },
              { rotate: tailAngle.interpolate({ inputRange: [-45, 45], outputRange: ["-45deg", "45deg"] }) },
              { translateX: -tx },
              { translateY: -ty },
            ],
          }}
        >
          {/* Tail body — covers the static tail to replace it with animated one */}
          <Path
            d={`M ${tx} ${ty} Q ${tx + width * 0.08} ${ty - tLen * 0.4} ${tx + width * 0.05} ${ty - tLen}`}
            stroke="#9e9896"
            strokeWidth={width * 0.046}
            strokeLinecap="round"
            fill="none"
          />
          {/* Tail tip (darker stripe) */}
          <Ellipse
            cx={tx + width * 0.04}
            cy={ty - tLen}
            rx={width * 0.028}
            ry={width * 0.032}
            fill="#3a3530"
          />
        </AnimatedG>

        {/* ── Left ear wiggle overlay ── */}
        <AnimatedG
          style={{
            transform: [
              { translateX: earLx },
              { translateY: earLy },
              { rotate: earLRotate.interpolate({ inputRange: [-15, 15], outputRange: ["-15deg", "15deg"] }) },
              { translateX: -earLx },
              { translateY: -earLy },
            ],
          }}
        >
          <Path
            d={`M ${earLx - earSz} ${earLy + earSz} L ${earLx} ${earLy - earSz * 0.6} L ${earLx + earSz} ${earLy + earSz * 0.2} Z`}
            fill="#d8d4c8"
            stroke="#555"
            strokeWidth={1}
          />
          {/* Inner ear pink */}
          <Path
            d={`M ${earLx - earSz * 0.5} ${earLy + earSz * 0.5} L ${earLx} ${earLy - earSz * 0.1} L ${earLx + earSz * 0.5} ${earLy + earSz * 0.25} Z`}
            fill="#f0b8b8"
          />
        </AnimatedG>

        {/* ── Right ear wiggle overlay ── */}
        <AnimatedG
          style={{
            transform: [
              { translateX: earRx },
              { translateY: earRy },
              { rotate: earRRotate.interpolate({ inputRange: [-15, 15], outputRange: ["-15deg", "15deg"] }) },
              { translateX: -earRx },
              { translateY: -earRy },
            ],
          }}
        >
          <Path
            d={`M ${earRx - earSz} ${earRy + earSz * 0.2} L ${earRx} ${earRy - earSz * 0.6} L ${earRx + earSz} ${earRy + earSz} Z`}
            fill="#d8d4c8"
            stroke="#555"
            strokeWidth={1}
          />
          <Path
            d={`M ${earRx - earSz * 0.5} ${earRy + earSz * 0.25} L ${earRx} ${earRy - earSz * 0.1} L ${earRx + earSz * 0.5} ${earRy + earSz * 0.5} Z`}
            fill="#f0b8b8"
          />
        </AnimatedG>

        {/* ── Eye blink overlay (anime-style closed arcs) ── */}
        <AnimatedG style={{ opacity: blinkOpacity }}>
          {/* Left eye fill (hides open eye) */}
          <Ellipse cx={lx} cy={ly} rx={ew + 2} ry={eh + 6} fill="#dddad0" />
          {/* Left closed-eye arc */}
          <Path
            d={makeEyeArc(lx, ly + 1)}
            stroke="#3a3530"
            strokeWidth={eh * 1.4}
            strokeLinecap="round"
            fill="none"
          />

          {/* Right eye fill */}
          <Ellipse cx={rx} cy={ry} rx={ew + 2} ry={eh + 6} fill="#dddad0" />
          {/* Right closed-eye arc */}
          <Path
            d={makeEyeArc(rx, ry + 1)}
            stroke="#3a3530"
            strokeWidth={eh * 1.4}
            strokeLinecap="round"
            fill="none"
          />
        </AnimatedG>
      </Svg>
    </View>
  );
}
