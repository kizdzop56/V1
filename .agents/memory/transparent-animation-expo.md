---
name: Transparent animated mascot in Expo (web + native)
description: How to ship a transparent looping animation that works in Expo web (mobile Safari) AND native; why video fails and the flood-fill + animated WebP pipeline.
---

# Transparent animated character in Expo (web + native)

**Rule:** For a transparent, looping character/mascot animation that must work in the Expo **web** build (the user often views via mobile Safari at `*.expo.picard.replit.dev`) AND native, use an **animated WebP rendered through `expo-image`** (`<Image autoplay contentFit="contain" />`). Do **not** use `expo-av` `Video`.

**Why:**
- Transparent video has no cross-platform format. HEVC-with-alpha plays only in iOS Safari; WebM/VP9-alpha plays only in Chromium. A single video file can't cover both.
- `expo-av` `Video` gated on `Platform.OS !== "web"` means the web build (what the user actually sees in their phone browser) never renders the video at all — it silently shows the fallback. Easy to miss.
- A "playable but opaque" video is indistinguishable from a transparent one to an `onError` fallback — the fallback won't fire, you just get a white box. Don't rely on `onError` to detect missing transparency.
- Animated WebP supports full alpha and is rendered by `expo-image` on every platform (on web it's a plain `<img>`, natively supported incl. iOS Safari 14+).

**Don't trust filenames for transparency.** A file from "PicsArt BackgroundRemover" (`.mov`, HEVC) was fully **opaque** with a baked white background (alpha 255 everywhere, corners RGB 252,252,252). Always verify: `magick identify -verbose "f.webp[0]" | grep -i alpha` should say `TrueColorAlpha`; sample a corner pixel's alpha.

## Pipeline to make a solid-background cartoon transparent
The subject (a snow-leopard mascot) is **white-furred on a near-white background**, so naive chroma-key / `-transparent white` punches holes in the fur. The art is a **cartoon with dark outlines**, so use connectivity-based flood-fill instead:

1. Extract frames: `ffmpeg -i src -vsync 0 frames/f_%04d.png`
2. Flood-fill bg → transparent per frame (add a 1px white border so one flood from a corner clears all edges; fuzz catches anti-aliased halo). Parallelize with `xargs -P`:
   `magick f.png -alpha set -bordercolor white -border 1 -fuzz 18% -fill none -draw "alpha 0,0 floodfill" -shave 1x1 out.png`
   Flood-fill stops at the dark outline, so interior white fur is preserved.
3. Assemble animated WebP with **ffmpeg** (ImageMagick `-define webp:method=6` OOM-killed on ~100 frames):
   `ffmpeg -framerate 25 -i out/f_%04d.png -c:v libwebp_anim -lossless 0 -q:v 78 -loop 0 -an mascot.webp`

**Gotcha:** this env's `ffmpeg`/`ffprobe` **cannot decode** animated WebP ("image data not found"). Verify frame count/alpha with **ImageMagick** instead (`magick identify mascot.webp | wc -l`, `magick "mascot.webp[N]" out.png`). ~100 frames ≈ 1.6 MB; fine for a one-time onboarding.

**Aspect-ratio gotcha:** the assembled `mascot_wave.webp` is **landscape 672x544**, not portrait. If the `<Image>` box is given a portrait ratio (e.g. `mascotW * 16/9`) with `contentFit="contain"`, the mascot gets letterboxed into a tall box and renders tiny with dead vertical space. Always size the box to the asset's true ratio: `mascotH = mascotW * (544/672)`. Check actual dims with `magick identify` before hardcoding a ratio.
