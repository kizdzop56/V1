---
name: Mascot image processing (halo removal + animated WebP timing)
description: How to defringe background-removed character art and reliably set animated WebP playback speed
---

# Defringe: white halo after background removal
For characters drawn with a dark outline (e.g. the snow-leopard mascot), the
"white halo" left by background removal is light, anti-aliased pixels OUTSIDE the
dark outline, adjacent to transparency.

**Safe removal rule:** the true silhouette border is the dark outline, so you can
strip light edge pixels without eating the character.
1. Set alpha=0 where `0 < alpha < 245` AND brightness(`mean(RGB)`) > 150 (kills the
   light anti-aliased fringe).
2. Then 2 erosion passes: any pixel with alpha>=40 that has a transparent neighbor
   AND brightness>170 → alpha=0 (peels the light opaque ring).
Interior white fur (ear tufts, belly, paws) is untouched because it is opaque and
bordered by the dark outline, not by transparency.
**Verify** by compositing over a DARK background (light halo only shows against dark).

# Animated WebP playback speed
**Why this is tricky:** Pillow's WebP reader reports per-frame `duration` as 0
even when the file plays fine — do NOT trust `im.info['duration']`. Pillow's lossy
animated-WebP *save* also silently drops durations; its lossless save preserves
them but balloons size (e.g. 2.3MB → 8MB).

**Ground truth:** parse the container yourself. Each `ANMF` chunk's payload bytes
12–14 are the 24-bit little-endian frame duration (ms).

**Reliable re-time:** dump frames to PNG, then
`ffmpeg -y -framerate N -i f%03d.png -vcodec libwebp -lossless 0 -q:v 92 -loop 0 -an out.webp`.
`-framerate` sets uniform per-frame duration. A natural friendly wave loop is
~1.8–2.2s; the mascot has 102 frames so framerate 55 ≈ 1.85s. Keeps size ~original.
