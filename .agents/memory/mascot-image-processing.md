---
name: Mascot image processing (halo removal + animated WebP timing/ghosting)
description: How to defringe background-removed character art and reliably control animated WebP frame count, timing, looping, and ghosting
---

# Defringe: white halo after background removal
The "white halo" is light, anti-aliased pixels OUTSIDE the dark outline, adjacent
to transparency. It lives in the PRISTINE source art too (not just lossy re-encodes):
measured first 1-3 opaque edge pixels are LIGHT (brightness 100-181) BEFORE the dark
outline (brightness <70).

**Safe removal = adaptive peel (NOT a fixed brightness threshold like 150/170).**
Iterate ~6x: zero any edge pixel (opaque OR semi-transparent) that has a transparent
neighbor AND `brightness(mean RGB) > 80`. This stops EXACTLY at the dark outline
(<70) at every location regardless of how wide the halo is there (1-3px), and only
removes ~2% of the silhouette. A fixed threshold fails because halo width varies and
the halo↔outline boundary is a gradient (e.g. 181→163→95→56).
**Verify** by compositing over DARK and colored bgs (light halo only shows there);
scan first-opaque-pixel brightness across many rows on both left and right edges —
target 0 samples with brightness>85.

# Prevent lossy halo resurrection (color-bleed)
Defringe only zeroes ALPHA; light RGB stays under transparent pixels and lossy
WebP's RGB→YUV bleeds it back. **Before encoding, dilate opaque RGB into transparent
pixels** (iterative neighbor-average over alpha<40). The outermost opaque ring is the
dark outline, so the bleed becomes dark and invisible.

# Animated WebP: exact frame count + FULL-CANVAS frames
Use `ffmpeg -framerate N -i f%03d.png -c:v libwebp -lossless 0 -q:v 92 -loop 0 -an
-vsync 0 out.webp`. This gives EXACTLY N frames, ALL full-canvas (X=0,Y=0,W,H). The
`-c:v libwebp` + `-vsync 0` combo is what makes it 1:1 — older recipes using
`-vcodec libwebp` without `-vsync 0` DUPLICATED frames (26→52) and corrupted timing.
**Avoid Pillow `save_all` for this:** even with `minimize_size=False` it writes
OPTIMIZED SUBRECT frames (~6,6,278,381 inside 290x392), NOT full-canvas — which
breaks the no-blend ghost fix below (subrects only overwrite their own rect).
Patch durations/flags in the binary afterward (below); ffmpeg's uniform durations get
overwritten anyway.

# Animated WebP container patching (durations, no-blend) — ground truth
Don't trust `im.info['duration']`. Parse/patch the container. Walk chunks from byte
12; each `ANMF` payload layout: bytes 0-2 X(*2), 3-5 Y(*2), 6-8 W-1, 9-11 H-1,
**12-14 duration ms (24-bit LE)**, **byte 15 flags** (bit0=dispose, bit1=blend;
blend 0=alpha-blend, 1=do-not-blend). Remember chunk size padding `sz + (sz&1)`.

- **"Many tails" / ghost trails fix:** frames default to blend=alpha + dispose=none,
  so vacated areas (moved tail/paw) let the previous frame show through. Set
  `byte15 |= 0x02` (do-not-blend) on EVERY frame so each frame overwrites the canvas
  → no trails. CRITICAL: this only fully works if frames are FULL-CANVAS (see above);
  with subrect frames, no-blend only overwrites the subrect and ghosts can survive on
  a strict decoder. (Prefer no-blend over dispose=background, which depends on the
  ANIM bg color and can flash.)
- **Long "rest" pause without file bloat:** set a long duration (e.g. 1400ms) on a
  SINGLE rest frame via bytes 12-14, instead of repeating that frame dozens of times.

# Making a clean looping wave from a one-shot gesture
The pristine source (102 frames, 672x544) is a DOUBLE wave, not periodic: wave1
(~f0-21 up→down), rest (~f24-38), wave2 (~f39-60 up→down), rest (~f63-101), then the
loop SNAPS paw-up (seam diff ~54 vs normal step). To get "rest → raise → wave →
lower → long still rest" seamlessly: take one rest→peak segment (e.g. f36→f49) and
**ping-pong** it (`[rest] + raise(37..49) + lower(48..37)`). Ping-pong only crosses
adjacent frames so it's always smooth; the leading rest frame gets the long duration
for the pause. Crop all frames to the UNION opaque bbox (mascot barely shifts) so it
stays stable; keep target fps ≤ ~40. Component renders the webp via raw <img> on web
/ expo-image native with objectFit:contain, so a tiny aspect-ratio change just
letterboxes — still update MASCOT_RATIO to the new WxH.
