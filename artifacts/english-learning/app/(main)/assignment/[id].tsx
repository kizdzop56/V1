import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform, Alert, TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGetAssignment,
  useSubmitAssignment,
  useGetAssignmentSubmissions,
} from "@workspace/api-client-react";
import type { Question } from "@workspace/api-client-react";

export default function AssignmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const assignmentId = parseInt(id || "0", 10);
  const colors = useColors();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  const isAdmin = user?.role === "admin";
  const isTeacherRole = user?.role === "teacher" || user?.role === "admin";

  const { data: assignment, isLoading } = useGetAssignment(assignmentId, {
    query: { enabled: !!assignmentId } as any,
  });

  const { data: submissions } = useGetAssignmentSubmissions(assignmentId, {
    query: { enabled: isAdmin && !!assignmentId } as any,
  });

  const { mutate: submit, isPending: submitting } = useSubmitAssignment({
    mutation: {
      onSuccess: (data) => {
        setResult(data);
        setSubmitted(true);
      },
      onError: () => Alert.alert("Error", "Failed to submit. Please try again."),
    },
  });

  const handleSubmit = () => {
    if (!assignment) return;
    const answerList = (assignment.questions || []).map((q: Question) => ({
      questionId: q.id,
      answer: answers[q.id] || "",
    }));
    submit({ id: assignmentId, data: { answers: answerList } });
  };

  const TYPE_COLORS: Record<string, string> = {
    text_test: colors.textTestColor,
    audio: colors.audioColor,
    reading: colors.readingColor,
    video: colors.videoColor,
  };

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
    card: {
      backgroundColor: colors.card, borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: colors.border, marginBottom: 16,
    },
    assignTitle: { fontSize: 20, fontWeight: "800", color: colors.foreground, marginBottom: 6 },
    assignDesc: { fontSize: 14, color: colors.mutedForeground, lineHeight: 20, marginBottom: 12 },
    metaRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
    badge: {
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
      flexDirection: "row", alignItems: "center", gap: 4,
    },
    badgeText: { fontSize: 12, fontWeight: "600" },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 },
    questionCard: {
      backgroundColor: colors.card, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: colors.border, marginBottom: 10,
    },
    questionText: { fontSize: 15, fontWeight: "600", color: colors.foreground, marginBottom: 10 },
    answerInput: {
      borderWidth: 1.5, borderColor: colors.border, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 10,
      fontSize: 15, color: colors.foreground,
      backgroundColor: colors.background,
    },
    answerCorrect: { borderColor: colors.success, backgroundColor: "#f0fdf4" },
    answerWrong: { borderColor: colors.destructive, backgroundColor: "#fef2f2" },
    correctLabel: { fontSize: 12, color: colors.success, fontWeight: "600", marginTop: 6 },
    wrongLabel: { fontSize: 12, color: colors.destructive, fontWeight: "600", marginTop: 6 },
    submitBtn: {
      backgroundColor: colors.primary, borderRadius: 14,
      paddingVertical: 16, alignItems: "center",
    },
    submitText: { fontSize: 16, fontWeight: "700", color: colors.primaryForeground },
    resultCard: {
      backgroundColor: colors.card, borderRadius: 16, padding: 20,
      borderWidth: 1.5, marginBottom: 16, alignItems: "center",
    },
    resultScore: { fontSize: 48, fontWeight: "900", marginBottom: 4 },
    resultLabel: { fontSize: 16, color: colors.mutedForeground, marginBottom: 8 },
    resultPoints: {
      flexDirection: "row", alignItems: "center", gap: 6,
      backgroundColor: "#fef3c7", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    },
    resultPointsText: { fontSize: 16, fontWeight: "700", color: "#92400e" },
    submissionsSection: { marginBottom: 20 },
    subCard: {
      backgroundColor: colors.card, borderRadius: 12, padding: 12,
      borderWidth: 1, borderColor: colors.border, marginBottom: 8,
      flexDirection: "row", alignItems: "center",
    },
    subName: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.foreground },
    subScore: { fontSize: 16, fontWeight: "800", color: colors.foreground },
    content: {
      backgroundColor: colors.muted, borderRadius: 12, padding: 14,
      marginBottom: 16, borderWidth: 1, borderColor: colors.border,
    },
    contentText: { fontSize: 14, color: colors.foreground, lineHeight: 22 },
    loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  });

  if (isLoading) {
    return <View style={[styles.container, styles.loading]}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  if (!assignment) {
    return (
      <View style={[styles.container, styles.loading]}>
        <Text style={{ color: colors.mutedForeground }}>Assignment not found</Text>
      </View>
    );
  }

  const typeColor = TYPE_COLORS[assignment.type] || colors.primary;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{assignment.title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Assignment info */}
        <View style={styles.card}>
          <Text style={styles.assignTitle}>{assignment.title}</Text>
          <Text style={styles.assignDesc}>{assignment.description}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.badge, { backgroundColor: typeColor + "15" }]}>
              <Text style={[styles.badgeText, { color: typeColor }]}>{assignment.type.replace("_", " ")}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: "#fef3c7" }]}>
              <Feather name="star" size={12} color="#92400e" />
              <Text style={[styles.badgeText, { color: "#92400e" }]}>{assignment.points} pts</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.muted }]}>
              <Feather name="users" size={12} color={colors.mutedForeground} />
              <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>Ages {assignment.ageMin}–{assignment.ageMax}</Text>
            </View>
          </View>
        </View>

        {/* Content (reading/audio/video) */}
        {assignment.content && (
          <View style={styles.content}>
            <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>
              {assignment.type === "reading" ? "Reading Passage" : assignment.type === "audio" ? "Audio" : "Video"}
            </Text>
            <Text style={styles.contentText}>{assignment.content}</Text>
          </View>
        )}

        {/* Result card after submission */}
        {submitted && result && (
          <View style={[styles.resultCard, { borderColor: result.score >= 70 ? colors.success : colors.destructive }]}>
            <Text style={[styles.resultScore, { color: result.score >= 70 ? colors.success : colors.destructive }]}>
              {result.score}%
            </Text>
            <Text style={styles.resultLabel}>{result.correctCount}/{result.totalQuestions} correct</Text>
            <View style={styles.resultPoints}>
              <Feather name="star" size={16} color="#92400e" />
              <Text style={styles.resultPointsText}>+{result.pointsEarned} points earned!</Text>
            </View>
          </View>
        )}

        {/* Questions */}
        {(assignment.questions || []).length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>Вопросы</Text>
            {(assignment.questions || []).map((q: Question, i: number) => {
              const questionResult = result?.results?.find((r: any) => r.questionId === q.id);
              const hasOptions = Array.isArray(q.options) && q.options.length > 0;
              const selected = answers[q.id];
              return (
                <View key={q.id} style={styles.questionCard}>
                  <Text style={styles.questionText}>{i + 1}. {q.text}</Text>

                  {/* Teacher view — show correct answer */}
                  {isTeacherRole && q.correctAnswer ? (
                    <View style={[styles.answerInput, styles.answerCorrect]}>
                      <Text style={{ color: colors.success, fontWeight: "600" }}>✓ {q.correctAnswer}</Text>
                    </View>
                  ) : hasOptions ? (
                    /* Multiple choice */
                    <View style={{ gap: 8 }}>
                      {(q.options as string[]).map((opt, oi) => {
                        const isSelected = selected === opt;
                        const isCorrectOpt = submitted && opt === questionResult?.correctAnswer;
                        const isWrongOpt = submitted && isSelected && !questionResult?.isCorrect;
                        return (
                          <TouchableOpacity
                            key={oi}
                            onPress={() => !submitted && setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                            activeOpacity={submitted ? 1 : 0.7}
                            style={{
                              flexDirection: "row", alignItems: "center", gap: 10,
                              padding: 12, borderRadius: 12, borderWidth: 1.5,
                              borderColor: isCorrectOpt ? colors.success
                                : isWrongOpt ? colors.destructive
                                : isSelected ? colors.primary
                                : colors.border,
                              backgroundColor: isCorrectOpt ? "#f0fdf4"
                                : isWrongOpt ? "#fef2f2"
                                : isSelected ? colors.primary + "12"
                                : colors.background,
                            }}
                          >
                            <View style={{
                              width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                              borderColor: isCorrectOpt ? colors.success
                                : isWrongOpt ? colors.destructive
                                : isSelected ? colors.primary
                                : colors.border,
                              backgroundColor: (isSelected || isCorrectOpt) ? (isCorrectOpt ? colors.success : colors.primary) : "transparent",
                              justifyContent: "center", alignItems: "center",
                            }}>
                              {(isSelected || isCorrectOpt) && <Feather name="check" size={13} color="#fff" />}
                            </View>
                            <Text style={{
                              fontSize: 14, flex: 1, fontWeight: isSelected ? "600" : "400",
                              color: isCorrectOpt ? colors.success
                                : isWrongOpt ? colors.destructive
                                : colors.foreground,
                            }}>{opt}</Text>
                          </TouchableOpacity>
                        );
                      })}
                      {submitted && questionResult && !questionResult.isCorrect && (
                        <Text style={styles.wrongLabel}>✗ Правильно: {questionResult.correctAnswer}</Text>
                      )}
                      {submitted && questionResult?.isCorrect && (
                        <Text style={styles.correctLabel}>✓ Верно!</Text>
                      )}
                    </View>
                  ) : (
                    /* Open text */
                    <>
                      <TextInput
                        style={[
                          styles.answerInput,
                          submitted && questionResult?.isCorrect && styles.answerCorrect,
                          submitted && questionResult && !questionResult.isCorrect && styles.answerWrong,
                        ]}
                        value={answers[q.id] || ""}
                        onChangeText={v => setAnswers(prev => ({ ...prev, [q.id]: v }))}
                        placeholder="Ваш ответ..."
                        placeholderTextColor={colors.mutedForeground}
                        editable={!submitted}
                      />
                      {submitted && questionResult && (
                        questionResult.isCorrect
                          ? <Text style={styles.correctLabel}>✓ Верно!</Text>
                          : <Text style={styles.wrongLabel}>✗ Правильно: {questionResult.correctAnswer}</Text>
                      )}
                    </>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Admin: submissions list */}
        {isAdmin && submissions && submissions.length > 0 && (
          <View style={styles.submissionsSection}>
            <Text style={styles.sectionTitle}>Student Submissions ({submissions.length})</Text>
            {submissions.map((sub: any) => (
              <View key={sub.id} style={styles.subCard}>
                <Feather name="user" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                <Text style={styles.subName}>{sub.studentName || "Student"}</Text>
                <Text style={[styles.subScore, { color: sub.score >= 70 ? colors.success : colors.destructive }]}>
                  {sub.score}%
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Submit button (students only, not yet submitted) */}
        {!isTeacherRole && !submitted && (assignment.questions || []).length > 0 && (
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitText}>Submit Answers</Text>
            }
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}
