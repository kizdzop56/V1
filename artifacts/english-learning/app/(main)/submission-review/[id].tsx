import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform, Image, Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import authStorage from "@/utils/authStorage";
import { ImageZoomModal } from "@/components/ImageZoomModal";

const BASE = process.env["EXPO_PUBLIC_DOMAIN"]
  ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}`
  : "";

async function apiFetch(path: string) {
  const token = await authStorage.getItem("auth_token");
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token ?? ""}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Ошибка сервера");
  return data;
}

const TYPE_LABELS: Record<string, string> = {
  text_test: "Тест", audio: "Аудирование", reading: "Чтение", video: "Видео",
};
const TYPE_COLORS: Record<string, string> = {
  text_test: "#8b5cf6", audio: "#06b6d4", reading: "#10b981", video: "#f59e0b",
};

type Answer = {
  id: number;
  questionId: number;
  studentAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  questionText: string;
};

type ReviewData = {
  id: number;
  score: number;
  correctCount: number;
  totalQuestions: number;
  pointsEarned: number;
  submittedAt: string;
  assignment: { id: number; title: string; type: string; points: number; mediaUrl: string | null; imageUrl: string | null } | null;
  answers: Answer[];
};

export default function SubmissionReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const submissionId = parseInt(id || "0", 10);
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [zoomImg, setZoomImg] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/api/submissions/${submissionId}/review`)
      .then(setData)
      .catch((e: Error) => setError(
        e.message === "Forbidden"
          ? "Нет доступа. Возможно, ваша сессия устарела — выйдите и войдите снова."
          : e.message
      ))
      .finally(() => setLoading(false));
  }, [submissionId]);

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
      paddingHorizontal: 20, paddingBottom: 12,
      flexDirection: "row", alignItems: "center", gap: 12,
    },
    headerTitle: { fontSize: 18, fontWeight: "800", color: colors.foreground, flex: 1 },
    scroll: { paddingHorizontal: 20, paddingBottom: insets.bottom + 40 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
    summaryCard: {
      backgroundColor: colors.card, borderRadius: 20, padding: 20,
      borderWidth: 1, borderColor: colors.border, marginBottom: 20,
    },
    scoreRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    bigScore: { fontSize: 48, fontWeight: "900" },
    statsRow: { flexDirection: "row", gap: 12 },
    stat: { flex: 1, alignItems: "center", backgroundColor: colors.muted, borderRadius: 12, padding: 10, gap: 2 },
    statVal: { fontSize: 18, fontWeight: "800", color: colors.foreground },
    statLabel: { fontSize: 11, color: colors.mutedForeground },
    sectionTitle: {
      fontSize: 12, fontWeight: "700", color: colors.mutedForeground,
      textTransform: "uppercase", letterSpacing: 0.6,
      marginBottom: 10,
    },
    answerCard: {
      borderRadius: 14, padding: 14, marginBottom: 10,
      borderWidth: 1.5,
    },
    questionNum: { fontSize: 11, fontWeight: "700", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.4 },
    questionText: { fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8, lineHeight: 20 },
    answerRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
    answerLabel: { fontSize: 12, fontWeight: "600" },
    answerText: { fontSize: 13, flex: 1 },
  });

  if (loading) return (
    <View style={[s.container, s.center]}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );

  if (error || !data) return (
    <View style={[s.container, s.center]}>
      <Text style={{ fontSize: 40 }}>😕</Text>
      <Text style={{ color: colors.mutedForeground }}>{error || "Не удалось загрузить"}</Text>
    </View>
  );

  const scoreColor = data.score >= 70 ? "#10b981" : data.score >= 40 ? "#f59e0b" : "#ef4444";
  const color = TYPE_COLORS[data.assignment?.type ?? ""] ?? colors.primary;
  const wrong = data.answers.filter(a => !a.isCorrect);
  const correct = data.answers.filter(a => a.isCorrect);

  return (
    <View style={s.container}>
      <ImageZoomModal uri={zoomImg} onClose={() => setZoomImg(null)} />
      <View style={s.header}>
        <TouchableOpacity
          style={{ width: 36, height: 36, justifyContent: "center", alignItems: "center" }}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={2}>
          {data.assignment?.title ?? "Задание"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Assignment media */}
        {data.assignment?.imageUrl ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setZoomImg(data.assignment!.imageUrl!)}
            style={{ borderRadius: 14, overflow: "hidden", marginBottom: 16, borderWidth: 1, borderColor: color + "40" }}
          >
            <Image
              source={{ uri: data.assignment.imageUrl }}
              style={{ width: "100%", height: 200, backgroundColor: "#000" }}
              resizeMode="contain"
            />
            <View style={{
              position: "absolute", bottom: 8, right: 8,
              backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 8,
              paddingHorizontal: 8, paddingVertical: 4,
              flexDirection: "row", alignItems: "center", gap: 4,
            }}>
              <Feather name="zoom-in" size={12} color="#fff" />
            </View>
          </TouchableOpacity>
        ) : null}

        {data.assignment?.mediaUrl ? (() => {
          const mUrl = data.assignment!.mediaUrl!;
          const aType = data.assignment!.type;
          const isAudio = aType === "audio" || /\.(mp3|m4a|wav|ogg|aac)(\?|$)/i.test(mUrl) || mUrl.includes("/upload/audio");
          const isVideo = aType === "video" || mUrl.includes("youtube") || mUrl.includes("youtu.be") || /\.(mp4|mov|webm|avi)(\?|$)/i.test(mUrl) || mUrl.includes("/upload/video");
          const openUrl = () => Linking.openURL(mUrl.startsWith("http") ? mUrl : `https://${mUrl}`);
          const ytEmbed = mUrl.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/");

          if (isVideo) {
            return (
              <View style={{ backgroundColor: "#fef3c7", borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "#f59e0b40", gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Feather name="video" size={16} color="#f59e0b" />
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#92400e" }}>Видео к заданию</Text>
                </View>
                {Platform.OS === "web" && ytEmbed.includes("embed") ? (
                  <View style={{ borderRadius: 10, overflow: "hidden" }}>
                    {/* @ts-ignore */}
                    <iframe src={ytEmbed} style={{ width: "100%", height: 200, border: "none" }} allowFullScreen />
                  </View>
                ) : null}
                <TouchableOpacity
                  onPress={openUrl}
                  style={{ backgroundColor: "#f59e0b", borderRadius: 10, paddingVertical: 10, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }}
                >
                  <Feather name="play-circle" size={16} color="#fff" />
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>Открыть видео</Text>
                </TouchableOpacity>
              </View>
            );
          }

          if (isAudio) {
            return (
              <View style={{ backgroundColor: "#ecfeff", borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "#06b6d440", gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Feather name="headphones" size={16} color="#06b6d4" />
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#0e7490" }}>Аудио к заданию</Text>
                </View>
                {Platform.OS === "web" ? (
                  /* @ts-ignore */
                  <audio controls src={mUrl} style={{ width: "100%", borderRadius: 8 }} />
                ) : (
                  <TouchableOpacity
                    onPress={openUrl}
                    style={{ backgroundColor: "#06b6d4", borderRadius: 10, paddingVertical: 10, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6 }}
                  >
                    <Feather name="headphones" size={16} color="#fff" />
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>Открыть аудио</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }

          return null;
        })() : null}

        {/* Summary card */}
        <View style={s.summaryCard}>
          <View style={s.scoreRow}>
            <View>
              <Text style={{ fontSize: 13, color: colors.mutedForeground, marginBottom: 4 }}>
                {TYPE_LABELS[data.assignment?.type ?? ""] ?? "Задание"}
              </Text>
              <Text style={[s.bigScore, { color: scoreColor }]}>{data.score}%</Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              <View style={{ backgroundColor: "#fef3c7", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#92400e" }}>+{data.pointsEarned} ⭐</Text>
              </View>
              <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                {new Date(data.submittedAt).toLocaleDateString("ru-RU")}
              </Text>
            </View>
          </View>

          <View style={s.statsRow}>
            <View style={s.stat}>
              <Text style={[s.statVal, { color: "#10b981" }]}>{data.correctCount}</Text>
              <Text style={s.statLabel}>Правильно</Text>
            </View>
            <View style={s.stat}>
              <Text style={[s.statVal, { color: "#ef4444" }]}>{data.totalQuestions - data.correctCount}</Text>
              <Text style={s.statLabel}>Ошибок</Text>
            </View>
            <View style={s.stat}>
              <Text style={s.statVal}>{data.totalQuestions}</Text>
              <Text style={s.statLabel}>Всего</Text>
            </View>
          </View>
        </View>

        {/* Mistakes first */}
        {wrong.length > 0 && (
          <>
            <Text style={s.sectionTitle}>Ошибки · {wrong.length}</Text>
            {wrong.map((a, i) => (
              <View key={a.id} style={[s.answerCard, {
                backgroundColor: "#fef2f2", borderColor: "#fca5a5",
              }]}>
                <Text style={[s.questionNum, { color: "#ef4444" }]}>Вопрос {data.answers.indexOf(a) + 1}</Text>
                <Text style={s.questionText}>{a.questionText}</Text>
                <View style={s.answerRow}>
                  <Feather name="x-circle" size={15} color="#ef4444" style={{ marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.answerLabel, { color: "#ef4444" }]}>Ваш ответ</Text>
                    <Text style={[s.answerText, { color: "#ef4444" }]}>{a.studentAnswer}</Text>
                  </View>
                </View>
                <View style={[s.answerRow, { marginTop: 8 }]}>
                  <Feather name="check-circle" size={15} color="#10b981" style={{ marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.answerLabel, { color: "#10b981" }]}>Правильный ответ</Text>
                    <Text style={[s.answerText, { color: "#10b981" }]}>{a.correctAnswer}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Correct answers */}
        {correct.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { marginTop: wrong.length > 0 ? 16 : 0 }]}>
              Правильные · {correct.length}
            </Text>
            {correct.map((a) => (
              <View key={a.id} style={[s.answerCard, {
                backgroundColor: "#f0fdf4", borderColor: "#86efac",
              }]}>
                <Text style={[s.questionNum, { color: "#10b981" }]}>Вопрос {data.answers.indexOf(a) + 1}</Text>
                <Text style={s.questionText}>{a.questionText}</Text>
                <View style={s.answerRow}>
                  <Feather name="check-circle" size={15} color="#10b981" style={{ marginTop: 1 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.answerLabel, { color: "#10b981" }]}>Ответ</Text>
                    <Text style={[s.answerText, { color: "#10b981" }]}>{a.studentAnswer}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {data.answers.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 40, gap: 10 }}>
            <Feather name="info" size={36} color={colors.mutedForeground} />
            <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: "center" }}>
              Подробные ответы недоступны для этого задания
            </Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}
