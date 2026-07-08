---
name: In-app media popup convention
description: Video/audio/link attachments on assignment screens must open in an in-app modal, never navigate away.
---

Assignment media (video, audio, and any generically-linked file/attachment) must render/play inside an in-app popup modal that can be opened and closed at any time — never via `Linking.openURL` or a new browser tab/external navigation.

**Why:** User explicitly required all attached media (uploaded or link-based) to stay inside the app experience; navigating away breaks the flow and was reported as a bug across multiple assignment-related screens (assignment detail, teacher results, submission review).

**How to apply:** Use the shared `MediaViewerModal` component (mirrors the existing `ImageZoomModal` pattern) instead of hand-rolling `Linking.openURL` buttons. It takes a `kind` of `"video" | "audio" | "other"` and handles YouTube-embed detection, native `<video>`/`<audio>` on web, expo-av fallbacks on native, and a generic iframe/link fallback for unrecognized attachment types. When adding a new screen that displays assignment media, reuse this component rather than duplicating the audio/video regex-detection logic inline.
