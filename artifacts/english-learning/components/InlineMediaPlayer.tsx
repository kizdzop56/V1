import React, { useState } from "react";
import { View, Text, Platform, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  MediaViewerModal,
  toEmbeddableUrl,
  NativeVideoPlayer,
  NativeAudioPlayer,
  type MediaKind,
} from "./MediaViewerModal";

type Props = {
  url: string;
  kind: MediaKind;
  height?: number;
  style?: any;
  title?: string;
};

export function InlineMediaPlayer({ url, kind, height = 200, style, title }: Props) {
  const [fullscreen, setFullscreen] = useState(false);
  const fullUrl = url.startsWith("http") ? url : `https://${url}`;
  const { isYoutube, embedUrl } = toEmbeddableUrl(fullUrl);

  return (
    <>
      <MediaViewerModal
        url={fullscreen ? url : null}
        kind={kind}
        title={title}
        onClose={() => setFullscreen(false)}
      />

      {kind === "video" && (
        <View style={style}>
          <View style={{ borderRadius: 10, overflow: "hidden", height, backgroundColor: "#000" }}>
            {isYoutube ? (
              Platform.OS === "web" ? (
                /* @ts-ignore */
                <iframe
                  src={embedUrl}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <NativeVideoPlayer uri={embedUrl} />
              )
            ) : Platform.OS === "web" ? (
              /* @ts-ignore */
              <video
                src={fullUrl}
                controls
                playsInline
                webkit-playsinline="true"
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <NativeVideoPlayer uri={fullUrl} />
            )}
          </View>
          <TouchableOpacity
            onPress={() => setFullscreen(true)}
            style={{
              alignSelf: "flex-end", marginTop: 6,
              flexDirection: "row", alignItems: "center", gap: 4,
              paddingHorizontal: 10, paddingVertical: 5,
              backgroundColor: "#f1f5f9", borderRadius: 8,
            }}
          >
            <Feather name="maximize-2" size={13} color="#64748b" />
            <Text style={{ fontSize: 12, color: "#64748b", fontWeight: "600" }}>На весь экран</Text>
          </TouchableOpacity>
        </View>
      )}

      {kind === "audio" && (
        <View style={[{ borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#6366f130", backgroundColor: "#e0e7ff" }, style]}>
          <View style={{
            flexDirection: "row", alignItems: "center", justifyContent: "space-between",
            paddingHorizontal: 12, paddingTop: 10, paddingBottom: 6,
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Feather name="headphones" size={15} color="#6366f1" />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#4338ca" }}>Аудио</Text>
            </View>
            <TouchableOpacity
              onPress={() => setFullscreen(true)}
              style={{
                flexDirection: "row", alignItems: "center", gap: 4,
                paddingHorizontal: 8, paddingVertical: 4,
                backgroundColor: "rgba(99,102,241,0.1)", borderRadius: 8,
              }}
            >
              <Feather name="maximize-2" size={13} color="#6366f1" />
              <Text style={{ fontSize: 12, color: "#6366f1", fontWeight: "600" }}>Развернуть</Text>
            </TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 12, paddingBottom: 10 }}>
            {Platform.OS === "web" ? (
              /* @ts-ignore */
              <audio src={fullUrl} controls style={{ width: "100%", borderRadius: 8, display: "block" }} />
            ) : (
              <NativeAudioPlayer uri={fullUrl} />
            )}
          </View>
        </View>
      )}

      {kind === "other" && (
        Platform.OS === "web" ? (
          <View style={[{ borderRadius: 10, overflow: "hidden", backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0" }, style]}>
            {/* @ts-ignore */}
            <iframe src={fullUrl} style={{ width: "100%", height, border: "none", display: "block" }} />
            <TouchableOpacity
              onPress={() => setFullscreen(true)}
              style={{
                flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
                paddingVertical: 8, borderTopWidth: 1, borderColor: "#e2e8f0",
                backgroundColor: "#f8fafc",
              }}
            >
              <Feather name="maximize-2" size={13} color="#8b5cf6" />
              <Text style={{ fontSize: 12, color: "#8b5cf6", fontWeight: "600" }}>На весь экран</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => setFullscreen(true)}
            style={[{
              backgroundColor: "#ede9fe", borderRadius: 14, borderWidth: 1, borderColor: "#8b5cf640",
              padding: 14, flexDirection: "row", alignItems: "center", gap: 12,
            }, style]}
          >
            <View style={{
              width: 44, height: 44, borderRadius: 12,
              backgroundColor: "#8b5cf620",
              justifyContent: "center", alignItems: "center",
            }}>
              <Feather name="play-circle" size={24} color="#8b5cf6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#5b21b6" }}>Прикреплённый файл</Text>
              <Text style={{ fontSize: 12, color: "#7c3aed", marginTop: 2 }}>Нажмите для просмотра</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#8b5cf6" />
          </TouchableOpacity>
        )
      )}
    </>
  );
}
