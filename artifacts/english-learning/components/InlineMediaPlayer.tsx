import React from "react";
import { View, Platform } from "react-native";
import { toEmbeddableUrl, NativeVideoPlayer, NativeAudioPlayer, type MediaKind } from "./MediaViewerModal";

type Props = {
  url: string;
  kind: MediaKind;
  height?: number;
  style?: any;
};

export function InlineMediaPlayer({ url, kind, height = 200, style }: Props) {
  const fullUrl = url.startsWith("http") ? url : `https://${url}`;
  const { isYoutube, embedUrl } = toEmbeddableUrl(fullUrl);

  if (kind === "video") {
    return (
      <View style={[{ borderRadius: 10, overflow: "hidden", height, backgroundColor: "#000" }, style]}>
        {isYoutube ? (
          Platform.OS === "web" ? (
            // @ts-ignore web-only iframe
            <iframe src={embedUrl} style={{ width: "100%", height: "100%", border: "none" }} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          ) : (
            <NativeVideoPlayer uri={embedUrl} />
          )
        ) : Platform.OS === "web" ? (
          // @ts-ignore web-only video element
          <video
            src={fullUrl}
            controls
            playsInline
            // @ts-ignore vendor-prefixed attr some mobile browsers still check
            webkit-playsinline="true"
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <NativeVideoPlayer uri={fullUrl} />
        )}
      </View>
    );
  }

  if (kind === "audio") {
    return Platform.OS === "web" ? (
      <View style={style}>
        {/* @ts-ignore web-only audio element */}
        <audio src={fullUrl} controls style={{ width: "100%" }} />
      </View>
    ) : (
      <NativeAudioPlayer uri={fullUrl} />
    );
  }

  if (Platform.OS === "web") {
    return (
      <View style={[{ height, borderRadius: 10, overflow: "hidden", backgroundColor: "#fff" }, style]}>
        {/* @ts-ignore web-only iframe — generic file/link preview */}
        <iframe src={fullUrl} style={{ width: "100%", height: "100%", border: "none" }} />
      </View>
    );
  }

  return null;
}
