import React, { useState } from "react";
import { Platform } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Asset } from "expo-asset";
import { AnimatedMascotImage } from "@/components/AnimatedMascotImage";

// Transparent animated WebP — cropped tight to the leopard, full quality.
// Native ratio is 290x392 (portrait).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const WAVE_WEBP = require("../assets/images/mascot_wave.webp");

export const MASCOT_RATIO = 290 / 392; // width / height

interface Props {
  width: number;
  height: number;
}

/**
 * Waving mascot animation.
 *
 * On web we render a raw <img>: the browser loops the animated WebP natively
 * and smoothly. expo-image's web path re-shows a loading state on each loop,
 * which made the mascot's colour flash/disappear for a split second.
 *
 * On native we use expo-image (handles animated WebP with transparency), and
 * fall back to the static animated PNG mascot if the WebP fails to load.
 */
export function WavingMascot({ width, height }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <AnimatedMascotImage pose="wave" width={width} height={height} />;
  }

  if (Platform.OS === "web") {
    const uri = Asset.fromModule(WAVE_WEBP).uri;
    return React.createElement("img", {
      src: uri,
      width,
      height,
      draggable: false,
      onError: () => setFailed(true),
      style: { width, height, objectFit: "contain", display: "block" },
    });
  }

  return (
    <ExpoImage
      source={WAVE_WEBP}
      style={{ width, height }}
      contentFit="contain"
      autoplay
      onError={() => setFailed(true)}
    />
  );
}
