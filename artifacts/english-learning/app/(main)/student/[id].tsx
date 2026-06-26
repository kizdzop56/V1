import React from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useGetUser, useGetStudentSubmissions, useGetStudentErrors, useGetStudentTimeStats } from "@workspace/api-client-react";

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const studentId = parseInt(id || "0", 10);
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: student, isLoading } = useGetUser(studentId, { query: { enabled: !!studentId } as any });
  const { data: submissions } = useGetStudentSubmissions(studentId, { query: { enabled: !!studentId } as any });
  const { data: errors } = useGetStudentErrors(studentId, { query: { enabled: !!studentId } as any });
  const { data: timeData } = useGetStudentTimeStats(studentId, { query: { enabled: !!studentId } as any });

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
      paddingHorizontal: 20, paddingBottom: 12,
      flexDirection: "row", alignItems: "center", gap: 12,
    },
    backBtn: { width: 36, height: 36, justifyContent: "center", alignItems: "center" },
    headerTitle: { fontSize: 18, fontWeight: "800", color: colors.foreground, flex: 1 },
    scroll: { paddingHorizontal: 20, paddingBottom: insets.bottom + 40 },
    profileCard: {
      backgroundColor: colors.card, borderRadius: 16, padding: 20,
      borderWidth: 1, borderColor: colors.border, marginBottom: 16,
      alignItems: "center",
    },
    avatar: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: colors.secondary, justifyContent: "center", alignItems: "center",
      marginBottom: 10,
    },
    name: { fontSize: 20, fontWeight: "800", color: colors.foreground },
    username: { fontSize: 14, color: colors.mutedForeground, marginBottom: 6 },
    ageBadge: {
      paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12,
      backgroundColor: colors.muted,
    },
    ageText: { fontSize: 13, color: colors.mutedForeground, fontWeight: "600" },
    statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
    statCard: {
      flex: 1, minWidth: "45%", backgroundColor: colors.card, borderRadius: 14,
      padding: 14, borderWidth: 1, borderColor: colors.border, alignItems: "center",
    },
    statValue: { fontSize: 24, fontWeight: "900", color: colors.foreground, marginTop: 6 },
    statLabel: { fontSize: 12, color: colors.mutedForeground, textAlign: "center" },
    section: { marginBottom: 16 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 10 },
    subCard: {
      backgroundColor: colors.card, borderRadius: 12, padding: 12,
      borderWidth: 1, borderColor: colors.border, marginBottom: 8,
    },
    subTitle: { fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 4 },
    subMeta: { flexDirection: "row", gap: 10 },
    subScore: { fontSize: 13, fontWeight: "700" },
    subDate: { fontSize: 12, color: colors.mutedForeground },
    errorCard: {
      backgroundColor: "#fef2f2", borderRadius: 12, padding: 12,
      borderWidth: 1, borderColor: "#fecaca", marginBottom: 8,
    },
    errorQ: { fontSize: 13, fontWeight: "600", color: colors.foreground, marginBottom: 4 },
    errorWrong: { fontSize: 13, color: colors.destructive },
    errorCorrect: { fontSize: 13, color: colors.success },
    loading: { flex: 1, justifyContent: "center", alignItems: "center" },
    empty: { fontSize: 14, color: colors.mutedForeground, textAlign: "center", paddingVertical: 20 },
  });

  if (isLoading) {
    return <View style={[styles.container, styles.loading]}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  if (!student) {
    return (
      <View style={[styles.container, styles.loading]}>
        <Text style={{ color: colors.mutedForeground }}>Student not found</Text>
      </View>
    );
  }

  const avgScore = submissions && submissions.length > 0
    ? Math.round(submissions.reduce((s: number, sub: any) => s + sub.score, 0) / submissions.length)
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Feather name="user" size={28} color={colors.primary} />
          </View>
          <Text style={styles.name}>{student.name}</Text>
          <Text style={styles.username}>@{student.username}</Text>
          {student.age && (
            <View style={styles.ageBadge}>
              <Text style={styles.ageText}>Age {student.age}</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Feather name="star" size={20} color="#f59e0b" />
            <Text style={styles.statValue}>{student.totalPoints}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="check-circle" size={20} color={colors.success} />
            <Text style={styles.statValue}>{submissions?.length || 0}</Text>
            <Text style={styles.statLabel}>Assignments Done</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="clock" size={20} color={colors.audioColor} />
            <Text style={styles.statValue}>{timeData?.totalMinutes || 0}</Text>
            <Text style={styles.statLabel}>Minutes Studied</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="bar-chart-2" size={20} color={colors.primary} />
            <Text style={styles.statValue}>{avgScore !== null ? `${avgScore}%` : "—"}</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
        </View>

        {/* Time breakdown */}
        {timeData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Study Time</Text>
            <View style={[styles.subCard, { flexDirection: "row", justifyContent: "space-around" }]}>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 20, fontWeight: "800", color: colors.foreground }}>{timeData.todayMinutes}</Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Today (min)</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 20, fontWeight: "800", color: colors.foreground }}>{timeData.weekMinutes}</Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>This Week (min)</Text>
              </View>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 20, fontWeight: "800", color: colors.foreground }}>{timeData.totalMinutes}</Text>
                <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Total (min)</Text>
              </View>
            </View>
          </View>
        )}

        {/* Recent submissions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Submissions</Text>
          {!submissions || submissions.length === 0 ? (
            <Text style={styles.empty}>No submissions yet</Text>
          ) : (
            submissions.slice(0, 10).map((sub: any) => (
              <View key={sub.id} style={styles.subCard}>
                <Text style={styles.subTitle} numberOfLines={1}>{sub.assignmentTitle || "Assignment"}</Text>
                <View style={styles.subMeta}>
                  <Text style={[styles.subScore, { color: sub.score >= 70 ? colors.success : colors.destructive }]}>
                    {sub.score}% ({sub.correctCount}/{sub.totalQuestions})
                  </Text>
                  <Text style={styles.subDate}>
                    {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : ""}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Errors */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Common Errors ({errors?.length || 0})</Text>
          {!errors || errors.length === 0 ? (
            <Text style={styles.empty}>No errors — great job! 🎉</Text>
          ) : (
            errors.slice(0, 10).map((err: any, i: number) => (
              <View key={i} style={styles.errorCard}>
                <Text style={styles.errorQ} numberOfLines={2}>{err.questionText}</Text>
                <Text style={styles.errorWrong}>✗ Student: "{err.studentAnswer}"</Text>
                <Text style={styles.errorCorrect}>✓ Correct: "{err.correctAnswer}"</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
